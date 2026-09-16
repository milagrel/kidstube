const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const THUMB_DIR = path.join(DATA_DIR, 'thumbnails');
const DEFAULT_VIDEOS_FOLDER = path.join(__dirname, '..', 'videos');

function hashPin(pin) {
  return crypto.createHash('sha256').update(String(pin)).digest('hex');
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

let db = null;

function load() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.mkdirSync(THUMB_DIR, { recursive: true });
  if (fs.existsSync(DB_FILE)) {
    try {
      db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    } catch {
      db = null;
    }
  }
  if (!db) {
    db = {
      settings: {
        pinHash: hashPin('1234'),
        dailyLimitMinutes: 60,
        videosFolder: DEFAULT_VIDEOS_FOLDER,
      },
      categories: [],
      videos: [],
      playlists: [],
    };
  }
  db.settings = db.settings || { pinHash: hashPin('1234'), dailyLimitMinutes: 60, videosFolder: DEFAULT_VIDEOS_FOLDER };
  db.categories = db.categories || [];
  db.videos = db.videos || [];
  db.playlists = db.playlists || [];
  save();
}

function save() {
  const tmp = DB_FILE + '.tmp';
  fs.writeFileSync(tmp, JSON.stringify(db, null, 2));
  fs.renameSync(tmp, DB_FILE);
}

function getDataDir() { return DATA_DIR; }
function getThumbDir() { return THUMB_DIR; }
function getVideosFolder() { return db.settings.videosFolder; }
function getVideos() { return db.videos; }
function getCategories() { return db.categories; }
function getVideo(id) { return db.videos.find((v) => v.id === id); }

function verifyPin(pin) {
  return hashPin(pin) === db.settings.pinHash;
}

function getPublicSettings() {
  const { pinHash, ...rest } = db.settings;
  return rest;
}

function getPublicState() {
  return {
    settings: getPublicSettings(),
    categories: db.categories,
    videos: db.videos
      .filter((v) => !v.isPrivate)
      .map((v) => {
        const { isPrivate, ...pub } = v;
        return pub;
      }),
    playlists: db.playlists.map((p) => ({ id: p.id, name: p.name, videoIds: p.videoIds })),
  };
}

function updateSettings(settings = {}) {
  if (settings.pin) db.settings.pinHash = hashPin(settings.pin);
  if (settings.dailyLimitMinutes !== undefined && settings.dailyLimitMinutes !== null) {
    db.settings.dailyLimitMinutes = Math.max(0, parseInt(settings.dailyLimitMinutes, 10) || 0);
  }
  if (settings.videosFolder) {
    fs.mkdirSync(settings.videosFolder, { recursive: true });
    db.settings.videosFolder = settings.videosFolder;
  }
  save();
  return getPublicSettings();
}

function setFavorite(id, favorite) {
  const v = getVideo(id);
  if (v) {
    v.favorite = !!favorite;
    save();
  }
}

function setPrivate(id, isPrivate) {
  const v = getVideo(id);
  if (v) {
    v.isPrivate = !!isPrivate;
    save();
  }
}

function markWatched(id) {
  const v = getVideo(id);
  if (v) {
    v.playCount = (v.playCount || 0) + 1;
    v.lastWatchedAt = new Date().toISOString();
    save();
  }
}

function upsertCategory(cat = {}) {
  if (cat.id) {
    const c = db.categories.find((x) => x.id === cat.id);
    if (c) Object.assign(c, { name: cat.name || c.name, color: cat.color || c.color, icon: cat.icon || c.icon });
  } else {
    db.categories.push({ id: uid(), name: cat.name || 'Nova Categoria', color: cat.color || '#7C3AED', icon: cat.icon || '🎬' });
  }
  save();
  return db.categories;
}

function deleteCategory(id) {
  db.categories = db.categories.filter((c) => c.id !== id);
  db.videos.forEach((v) => {
    if (v.categoryId === id) v.categoryId = null;
  });
  save();
  return db.categories;
}

function createPlaylist(name) {
  const p = { id: uid(), name: name || 'Nova Playlist', videoIds: [] };
  db.playlists.push(p);
  save();
  return p;
}

function deletePlaylist(id) {
  db.playlists = db.playlists.filter((p) => p.id !== id);
  save();
  return db.playlists;
}

function addToPlaylist(playlistId, videoId) {
  const p = db.playlists.find((x) => x.id === playlistId);
  if (p && !p.videoIds.includes(videoId)) p.videoIds.push(videoId);
  save();
  return p;
}

function removeFromPlaylist(playlistId, videoId) {
  const p = db.playlists.find((x) => x.id === playlistId);
  if (p) p.videoIds = p.videoIds.filter((id) => id !== videoId);
  save();
  return p;
}

function replaceCategories(categories) {
  db.categories = categories;
  save();
}

function replaceVideos(videos) {
  db.videos = videos;
  save();
}

load();

module.exports = {
  getDataDir,
  getThumbDir,
  getVideosFolder,
  getVideos,
  getCategories,
  getVideo,
  verifyPin,
  getPublicSettings,
  getPublicState,
  updateSettings,
  setFavorite,
  setPrivate,
  markWatched,
  upsertCategory,
  deleteCategory,
  createPlaylist,
  deletePlaylist,
  addToPlaylist,
  removeFromPlaylist,
  replaceCategories,
  replaceVideos,
};
