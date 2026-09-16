const API = '/api';

function token() {
  return sessionStorage.getItem('kidstube_token');
}

async function req(url, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  if (token()) headers['X-Auth-Token'] = token();
  const res = await fetch(API + url, { ...options, headers });
  if (!res.ok) {
    let data = {};
    try {
      data = await res.json();
    } catch {
      /* ignore */
    }
    const err = new Error(data.error || `Erro (${res.status})`);
    if (res.status === 401) sessionStorage.removeItem('kidstube_token');
    throw err;
  }
  return res.json();
}

export const api = {
  getState: () => req('/state'),

  verifyPin: async (pin) => {
    const res = await fetch(API + '/verify-pin', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    });
    const data = await res.json();
    if (data.ok && data.token) sessionStorage.setItem('kidstube_token', data.token);
    return data;
  },

  saveSettings: (settings) => req('/settings', { method: 'POST', body: JSON.stringify({ settings }) }),
  scan: () => req('/scan', { method: 'POST', body: JSON.stringify({}) }),
  getAdminVideos: () => req('/admin/videos'),

  toggleFavorite: (id, favorite) => req(`/videos/${id}/favorite`, { method: 'POST', body: JSON.stringify({ favorite }) }),
  setPrivate: (id, isPrivate) => req(`/videos/${id}/private`, { method: 'POST', body: JSON.stringify({ isPrivate }) }),
  markWatched: (id) => req(`/videos/${id}/watched`, { method: 'POST', body: JSON.stringify({}) }),

  createCategory: (cat) => req('/categories', { method: 'POST', body: JSON.stringify(cat) }),
  deleteCategory: (id) => req(`/categories/${id}`, { method: 'DELETE', body: JSON.stringify({}) }),

  createPlaylist: (name) => req('/playlists', { method: 'POST', body: JSON.stringify({ name }) }),
  deletePlaylist: (id) => req(`/playlists/${id}`, { method: 'DELETE', body: JSON.stringify({}) }),
  addToPlaylist: (playlistId, videoId) => req(`/playlists/${playlistId}/videos`, { method: 'POST', body: JSON.stringify({ videoId }) }),
  removeFromPlaylist: (playlistId, videoId) => req(`/playlists/${playlistId}/videos/${videoId}`, { method: 'DELETE', body: JSON.stringify({}) }),

  upload: (formData) => {
    const headers = {};
    if (token()) headers['X-Auth-Token'] = token();
    return fetch(API + '/upload', { method: 'POST', headers, body: formData }).then(async (res) => {
      if (!res.ok) {
        let data = {};
        try {
          data = await res.json();
        } catch {
          /* ignore */
        }
        throw new Error(data.error || 'Erro no envio');
      }
      return res.json();
    });
  },
};
