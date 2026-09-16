const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const store = require('./store');
const scanner = require('./scanner');

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

const DIST_DIR = path.join(__dirname, '..', 'client', 'dist');
const UPLOAD_DIR = path.join(__dirname, 'data', 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const upload = multer({
  dest: UPLOAD_DIR,
  limits: { fileSize: 8 * 1024 * 1024 * 1024 },
});

const MIME = {
  '.mp4': 'video/mp4',
  '.m4v': 'video/mp4',
  '.webm': 'video/webm',
  '.mkv': 'video/x-matroska',
  '.mov': 'video/quicktime',
  '.avi': 'video/x-msvideo',
};

// ---------- Estado do scan ----------
const scanState = { scanning: false, lastScanAt: null, error: null };

async function runScan() {
  if (scanState.scanning) return;
  scanState.scanning = true;
  try {
    await scanner.scan();
    scanState.lastScanAt = new Date().toISOString();
    scanState.error = null;
  } catch (e) {
    scanState.error = e.message;
  } finally {
    scanState.scanning = false;
  }
}

// ---------- Sessões dos pais (PIN) ----------
const sessions = new Map();

app.post('/api/verify-pin', (req, res) => {
  if (store.verifyPin(req.body?.pin)) {
    const token = crypto.randomBytes(24).toString('hex');
    sessions.set(token, Date.now() + 12 * 60 * 60 * 1000);
    res.json({ ok: true, token });
  } else {
    res.json({ ok: false });
  }
});

function requireAuth(req, res, next) {
  const t = req.headers['x-auth-token'];
  const exp = sessions.get(t);
  if (!t || !exp || exp < Date.now()) {
    sessions.delete(t);
    return res.status(401).json({ error: 'Sessão expirada. Insere o PIN novamente.' });
  }
  next();
}

// ---------- Helpers ----------
function videoFilePath(video) {
  return path.join(store.getVideosFolder(), video.filePath || video.fileName);
}

function sanitize(name) {
  return (
    path
      .basename(String(name || ''))
      .replace(/[<>:"/\\|?*\x00-\x1F]/g, '_')
      .trim() || 'video.mp4'
  );
}

function uniqueName(dir, name) {
  const ext = path.extname(name);
  const base = path.basename(name, ext);
  let candidate = name;
  let i = 1;
  while (fs.existsSync(path.join(dir, candidate))) {
    candidate = `${base} (${i})${ext}`;
    i += 1;
  }
  return candidate;
}

// ---------- Estado público ----------
app.get('/api/state', (req, res) => {
  res.json({ ...store.getPublicState(), scan: scanState });
});

// ---------- Definições (PIN) ----------
app.post('/api/settings', requireAuth, (req, res) => {
  const settings = store.updateSettings(req.body?.settings || {});
  res.json({ ok: true, settings });
});

app.post('/api/scan', requireAuth, async (req, res) => {
  await runScan();
  res.json({ ok: true, scan: scanState });
});

app.get('/api/admin/videos', requireAuth, (req, res) => {
  res.json({ videos: store.getVideos() });
});

// ---------- Vídeos ----------
app.post('/api/videos/:id/favorite', (req, res) => {
  store.setFavorite(req.params.id, !!req.body?.favorite);
  res.json({ ok: true });
});

app.post('/api/videos/:id/private', requireAuth, (req, res) => {
  store.setPrivate(req.params.id, !!req.body?.isPrivate);
  res.json({ ok: true });
});

app.post('/api/videos/:id/watched', (req, res) => {
  store.markWatched(req.params.id);
  res.json({ ok: true });
});

app.get('/api/videos/:id/stream', (req, res) => {
  const video = store.getVideo(req.params.id);
  if (!video) return res.status(404).json({ error: 'Vídeo não encontrado' });
  const filePath = videoFilePath(video);
  if (!fs.existsSync(filePath)) return res.status(404).json({ error: 'Ficheiro não encontrado' });
  const stat = fs.statSync(filePath);
  const mime = MIME[path.extname(filePath).toLowerCase()] || 'application/octet-stream';
  const range = req.headers.range;
  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
    if (Number.isNaN(start) || start >= stat.size || end >= stat.size) {
      res.writeHead(416, { 'Content-Range': `bytes */${stat.size}` });
      return res.end();
    }
    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${stat.size}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': end - start + 1,
      'Content-Type': mime,
    });
    fs.createReadStream(filePath, { start, end }).pipe(res);
  } else {
    res.writeHead(200, {
      'Content-Length': stat.size,
      'Accept-Ranges': 'bytes',
      'Content-Type': mime,
    });
    fs.createReadStream(filePath).pipe(res);
  }
});

app.get('/api/videos/:id/thumbnail', (req, res) => {
  const video = store.getVideo(req.params.id);
  if (!video) return res.status(404).end();
  if (video.thumbnailFile) {
    const p = path.join(store.getDataDir(), video.thumbnailFile);
    if (fs.existsSync(p)) return res.sendFile(p);
  }
  const filePath = videoFilePath(video);
  const base = path.join(path.dirname(filePath), path.basename(filePath, path.extname(filePath)));
  for (const ext of ['.jpg', '.jpeg', '.png', '.webp']) {
    const side = base + ext;
    if (fs.existsSync(side)) return res.sendFile(side);
  }
  res.type('image/svg+xml').send(scanner.makePlaceholder(video.title));
});

// ---------- Upload (PIN) ----------
app.post(
  '/api/upload',
  upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'thumbnail', maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const videoFile = req.files?.video?.[0];
      if (!videoFile) return res.status(400).json({ error: 'Nenhum vídeo enviado' });
      const folder = store.getVideosFolder();
      fs.mkdirSync(folder, { recursive: true });
      const destName = uniqueName(folder, sanitize(videoFile.originalname));
      fs.renameSync(videoFile.path, path.join(folder, destName));
      const thumbFile = req.files?.thumbnail?.[0];
      if (thumbFile) {
        const thumbName = path.basename(destName, path.extname(destName)) + path.extname(thumbFile.originalname || '.jpg');
        fs.renameSync(thumbFile.path, path.join(folder, uniqueName(folder, thumbName)));
      }
      const result = await scanner.scan();
      res.json({ ok: true, ...result });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  }
);

// ---------- Categorias (PIN) ----------
app.post('/api/categories', requireAuth, (req, res) => {
  const categories = store.upsertCategory(req.body || {});
  res.json({ ok: true, categories });
});

app.delete('/api/categories/:id', requireAuth, (req, res) => {
  const categories = store.deleteCategory(req.params.id);
  res.json({ ok: true, categories });
});

// ---------- Playlists ----------
app.post('/api/playlists', (req, res) => {
  const playlist = store.createPlaylist(req.body?.name || 'Nova Playlist');
  res.json({ ok: true, playlist });
});

app.delete('/api/playlists/:id', requireAuth, (req, res) => {
  const playlists = store.deletePlaylist(req.params.id);
  res.json({ ok: true, playlists });
});

app.post('/api/playlists/:id/videos', (req, res) => {
  const playlist = store.addToPlaylist(req.params.id, req.body?.videoId);
  res.json({ ok: true, playlist });
});

app.delete('/api/playlists/:id/videos/:videoId', (req, res) => {
  const playlist = store.removeFromPlaylist(req.params.id, req.params.videoId);
  res.json({ ok: true, playlist });
});

// ---------- Frontend (produção) ----------
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/')) return next();
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}

// ---------- Erros ----------
app.use((err, req, res, next) => {
  if (err) return res.status(400).json({ error: err.message });
  next();
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🎬 KidsTube a correr em http://localhost:${PORT}`);
  console.log(`   Na rede local: http://<IP-deste-PC>:${PORT}`);
  console.log(`   Pasta de vídeos: ${store.getVideosFolder()}`);
  runScan().then(() => {
    console.log(`   Vídeos encontrados: ${store.getVideos().length}`);
  });
  // Procurar novos vídeos automaticamente a cada 30 segundos
  setInterval(runScan, 30000);
});
