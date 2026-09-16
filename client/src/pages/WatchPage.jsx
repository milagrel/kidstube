import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, ListPlus, ChevronLeft, X } from 'lucide-react';
import { api } from '../api';
import { addSeconds, isLocked } from '../timeLimit';
import VideoCard from '../components/VideoCard';
import TimeLimitScreen from '../components/TimeLimitScreen';

export default function WatchPage({ state, refresh }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const video = state.videos.find((v) => v.id === id);
  const [showPlaylists, setShowPlaylists] = useState(false);
  const [locked, setLocked] = useState(false);
  const videoRef = useRef(null);
  const lastTime = useRef(0);

  useEffect(() => {
    if (id) api.markWatched(id).catch(() => {});
  }, [id]);

  const onTimeUpdate = () => {
    const v = videoRef.current;
    if (!v || v.paused) return;
    const now = v.currentTime;
    const delta = now - lastTime.current;
    lastTime.current = now;
    if (delta > 0 && delta < 10) {
      addSeconds(Math.round(delta));
      if (isLocked(state.settings.dailyLimitMinutes)) setLocked(true);
    }
  };

  if (locked) return <TimeLimitScreen onUnlock={() => setLocked(false)} />;

  if (!video) {
    return (
      <div className="text-center py-20">
        <p className="font-bold text-slate-600">Vídeo não encontrado</p>
        <button
          onClick={() => navigate('/')}
          className="mt-4 px-6 py-2 rounded-full bg-violet-600 text-white font-bold"
        >
          Voltar ao início
        </button>
      </div>
    );
  }

  const catById = Object.fromEntries(state.categories.map((c) => [c.id, c]));
  const category = catById[video.categoryId];
  const related = state.videos
    .filter((v) => v.id !== id && (video.categoryId ? v.categoryId === video.categoryId : true))
    .slice(0, 8);

  const toggleFavorite = async () => {
    await api.toggleFavorite(video.id, !video.favorite);
    refresh();
  };

  const togglePlaylist = async (p) => {
    if (p.videoIds.includes(video.id)) await api.removeFromPlaylist(p.id, video.id);
    else await api.addToPlaylist(p.id, video.id);
    refresh();
  };

  return (
    <div className="space-y-6">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-violet-600"
      >
        <ChevronLeft className="w-4 h-4" /> Voltar
      </button>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <video
            ref={videoRef}
            controls
            autoPlay
            playsInline
            preload="metadata"
            className="w-full aspect-video bg-black rounded-2xl shadow-xl"
            src={`/api/videos/${video.id}/stream`}
            onTimeUpdate={onTimeUpdate}
            onPlay={() => {
              lastTime.current = videoRef.current?.currentTime || 0;
            }}
          />
          <div className="flex flex-wrap items-start gap-3">
            <div className="flex-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-800 leading-snug">{video.title}</h1>
              {category && (
                <span
                  className="inline-block mt-2 text-xs font-bold px-3 py-1 rounded-full"
                  style={{ backgroundColor: category.color + '1f', color: category.color }}
                >
                  {category.icon} {category.name}
                </span>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={toggleFavorite}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-sm transition shadow-sm ${
                  video.favorite ? 'bg-rose-500 text-white' : 'bg-white text-slate-700 hover:bg-rose-50'
                }`}
              >
                <Heart className={`w-4 h-4 ${video.favorite ? 'fill-white' : ''}`} />
                {video.favorite ? 'Favorito' : 'Favorito'}
              </button>
              <button
                onClick={() => setShowPlaylists(true)}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full font-bold text-sm bg-white text-slate-700 shadow-sm hover:bg-violet-50"
              >
                <ListPlus className="w-4 h-4" /> Playlist
              </button>
            </div>
          </div>
        </div>

        <aside>
          <h2 className="text-lg font-extrabold text-slate-800 mb-3">Vídeos parecidos</h2>
          <div className="grid grid-cols-2 lg:grid-cols-1 gap-4">
            {related.map((v) => (
              <VideoCard key={v.id} video={v} category={catById[v.categoryId]} onToggleFavorite={toggleFavorite} />
            ))}
          </div>
        </aside>
      </div>

      {showPlaylists && (
        <PlaylistModal
          state={state}
          video={video}
          onToggle={togglePlaylist}
          onClose={() => setShowPlaylists(false)}
          onCreated={refresh}
        />
      )}
    </div>
  );
}

function PlaylistModal({ state, video, onToggle, onClose, onCreated }) {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  const create = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    const res = await api.createPlaylist(name.trim());
    await api.addToPlaylist(res.playlist.id, video.id);
    setName('');
    setBusy(false);
    onCreated();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-extrabold text-slate-800">Adicionar à playlist</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-5 h-5" />
          </button>
        </div>
        <form onSubmit={create} className="flex gap-2 mb-4">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nova playlist..."
            className="flex-1 px-4 py-2 rounded-full bg-slate-100 outline-none focus:ring-2 focus:ring-violet-400 text-sm font-medium"
          />
          <button
            disabled={busy || !name.trim()}
            className="px-4 py-2 rounded-full bg-violet-600 text-white text-sm font-bold disabled:opacity-40"
          >
            Criar
          </button>
        </form>
        <div className="space-y-2">
          {state.playlists.map((p) => {
            const active = p.videoIds.includes(video.id);
            return (
              <button
                key={p.id}
                onClick={() => onToggle(p)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl text-sm font-bold transition ${
                  active ? 'bg-violet-100 text-violet-700' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>{p.name}</span>
                <span
                  className={`w-5 h-5 rounded-full border-2 ${active ? 'bg-violet-600 border-violet-600' : 'border-slate-300'}`}
                />
              </button>
            );
          })}
          {state.playlists.length === 0 && (
            <p className="text-sm text-slate-400 text-center py-4">Ainda não há playlists. Cria uma! 🎉</p>
          )}
        </div>
      </div>
    </div>
  );
}
