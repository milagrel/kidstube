import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ListVideo, Plus } from 'lucide-react';
import { api } from '../api';

export default function PlaylistsPage({ state, refresh }) {
  const navigate = useNavigate();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  const create = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    await api.createPlaylist(name.trim());
    setName('');
    setCreating(false);
    setBusy(false);
    refresh();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
          <ListVideo className="w-6 h-6 text-violet-600" /> Playlists
        </h1>
        <button
          onClick={() => setCreating(!creating)}
          className="flex items-center gap-1 px-4 py-2 rounded-full bg-violet-600 text-white text-sm font-bold hover:bg-violet-700"
        >
          <Plus className="w-4 h-4" /> Nova
        </button>
      </div>

      {creating && (
        <form onSubmit={create} className="flex gap-2 mb-6 max-w-md">
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nome da playlist..."
            className="flex-1 px-4 py-2.5 rounded-full bg-white shadow-sm outline-none focus:ring-2 focus:ring-violet-400 text-sm font-medium"
          />
          <button
            disabled={busy || !name.trim()}
            className="px-5 py-2.5 rounded-full bg-violet-600 text-white text-sm font-bold disabled:opacity-40"
          >
            Criar
          </button>
        </form>
      )}

      {state.playlists.length === 0 ? (
        <div className="text-center py-20">
          <ListVideo className="w-14 h-14 text-slate-200 mx-auto" />
          <p className="mt-3 font-bold text-slate-500">Ainda não há playlists</p>
          <p className="text-sm text-slate-400">Cria uma para agrupar os teus vídeos preferidos!</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {state.playlists.map((p) => {
            const videos = p.videoIds.map((vid) => state.videos.find((v) => v.id === vid)).filter(Boolean);
            return (
              <button key={p.id} onClick={() => navigate(`/playlist/${p.id}`)} className="text-left group">
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-gradient-to-br from-violet-500 to-pink-500 shadow-sm group-hover:shadow-xl transition">
                  {videos.length > 0 ? (
                    <div className="grid grid-cols-2 grid-rows-2 h-full">
                      {videos.slice(0, 4).map((v) => (
                        <img key={v.id} src={`/api/videos/${v.id}/thumbnail`} alt="" className="w-full h-full object-cover" />
                      ))}
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <ListVideo className="w-10 h-10 text-white/80" />
                    </div>
                  )}
                  <span className="absolute bottom-2 right-2 bg-black/60 text-white text-xs font-bold px-2 py-0.5 rounded-md">
                    {videos.length} vídeos
                  </span>
                </div>
                <h3 className="mt-2 font-bold text-slate-800 group-hover:text-violet-600">{p.name}</h3>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
