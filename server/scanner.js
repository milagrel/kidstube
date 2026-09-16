const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const store = require('./store');

const VIDEO_EXTS = ['.mp4', '.webm', '.mkv', '.mov', '.avi', '.m4v'];
const PRIVATE_FOLDER_NAMES = ['privado', 'private', 'privados'];

const PALETTE = ['#7C3AED', '#EC4899', '#F59E0B', '#0EA5E9', '#10B981', '#EF4444', '#8B5CF6', '#F97316', '#06B6D4', '#84CC16'];

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

function hasFfmpeg() {
  try {
    execSync('ffmpeg -version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function hasFfprobe() {
  try {
    execSync('ffprobe -version', { stdio: 'ignore' });
    return true;
  } catch {
    return false;
  }
}

function probeDuration(file) {
  try {
    const out = execSync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${file}"`,
      { encoding: 'utf8', maxBuffer: 1024 * 1024 }
    );
    const d = parseFloat(out.trim());
    return Number.isFinite(d) ? Math.round(d) : null;
  } catch {
    return null;
  }
}

function makeThumbnail(file, outFile) {
  try {
    execSync(`ffmpeg -y -ss 2 -i "${file}" -vframes 1 -vf "scale=640:-2" "${outFile}"`, { stdio: 'ignore' });
    return fs.existsSync(outFile);
  } catch {
    return false;
  }
}

function fixMojibake(str) {
  let s = String(str);
  for (let i = 0; i < 3; i++) {
    try {
      const fixed = Buffer.from(s, 'latin1').toString('utf8');
      if (fixed.includes('\uFFFD') || fixed === s) break;
      s = fixed;
    } catch {
      break;
    }
  }
  return s;
}

function titleFromFile(name) {
  const base = fixMojibake(path.basename(name, path.extname(name)));
  const cleaned = base.replace(/[_\-]+/g, ' ').replace(/\s+/g, ' ').trim();
  return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
}

function walk(dir, base, out) {
  let entries = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    if (entry.name.startsWith('.')) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full, base, out);
    } else if (entry.isFile()) {
      const ext = path.extname(entry.name).toLowerCase();
      if (VIDEO_EXTS.includes(ext)) {
        out.push({ filePath: path.relative(base, full), fileName: entry.name });
      }
    }
  }
}

function makePlaceholder(title) {
  let h = 0;
  for (const ch of String(title)) h = (h * 31 + ch.charCodeAt(0)) % 997;
  const c = PALETTE[h % PALETTE.length];
  const safe = String(title).replace(/[<>&'"]/g, '');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="360">
  <rect width="640" height="360" fill="${c}"/>
  <circle cx="320" cy="150" r="62" fill="rgba(255,255,255,0.22)"/>
  <polygon points="298,118 298,182 352,150" fill="#ffffff"/>
  <text x="320" y="285" font-family="Segoe UI, Arial, sans-serif" font-size="34" font-weight="700" fill="#ffffff" text-anchor="middle">${safe}</text>
</svg>`;
}

async function scan() {
  const folder = store.getVideosFolder();
  fs.mkdirSync(folder, { recursive: true });

  const found = [];
  walk(folder, folder, found);

  const ffmpeg = hasFfmpeg();
  const ffprobe = hasFfprobe();

  // Categorias a partir de subpastas
  const existingCats = store.getCategories();
  const catByName = new Map(existingCats.map((c) => [c.name.toLowerCase(), c]));
  const allCats = [...existingCats];
  const folderNames = [...new Set(found.map((f) => path.dirname(f.filePath)).filter((d) => d !== '.'))];
  for (const name of folderNames) {
    if (PRIVATE_FOLDER_NAMES.includes(name.toLowerCase())) continue;
    if (!catByName.has(name.toLowerCase())) {
      const cat = { id: uid(), name, color: PALETTE[allCats.length % PALETTE.length], icon: '📁' };
      catByName.set(name.toLowerCase(), cat);
      allCats.push(cat);
    }
  }
  const catIdByName = new Map(allCats.map((c) => [c.name.toLowerCase(), c.id]));

  const existingVideos = store.getVideos();
  const byPath = new Map(existingVideos.map((v) => [v.filePath, v]));
  const videos = [];

  for (const f of found) {
    const relDir = path.dirname(f.filePath);
    const isPrivateFolder = PRIVATE_FOLDER_NAMES.includes(relDir.toLowerCase());
    const categoryId = relDir === '.' || isPrivateFolder ? null : catIdByName.get(relDir.toLowerCase()) || null;
    const full = path.join(folder, f.filePath);
    let v = byPath.get(f.filePath);
    if (v) {
      v.title = titleFromFile(f.fileName);
      v.categoryId = categoryId;
      if (isPrivateFolder) v.isPrivate = true;
      if (!v.thumbnailFile && ffmpeg) {
        const out = path.join(store.getThumbDir(), v.id + '.jpg');
        if (makeThumbnail(full, out)) v.thumbnailFile = 'thumbnails/' + v.id + '.jpg';
      }
      videos.push(v);
    } else {
      const id = uid();
      let thumbnailFile = null;
      if (ffmpeg) {
        const out = path.join(store.getThumbDir(), id + '.jpg');
        if (makeThumbnail(full, out)) thumbnailFile = 'thumbnails/' + id + '.jpg';
      }
      videos.push({
        id,
        title: titleFromFile(f.fileName),
        fileName: f.fileName,
        filePath: f.filePath,
        categoryId,
        duration: ffprobe ? probeDuration(full) : null,
        thumbnailFile,
        favorite: false,
        isPrivate: isPrivateFolder,
        playCount: 0,
        lastWatchedAt: null,
        addedAt: new Date().toISOString(),
      });
    }
  }

  store.replaceCategories(allCats);
  store.replaceVideos(videos);
  return { total: videos.length, ffmpeg, ffprobe };
}

module.exports = { scan, makePlaceholder };
