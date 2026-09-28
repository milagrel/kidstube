import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Heart, ListPlus, ChevronLeft, X, SkipBack, SkipForward, RotateCcw, RotateCw, Search } from 'lucide-react';
import { api } from '../api';
import { addSeconds, isLocked } from '../timeLimit';
import { formatDuration } from '../utils';
import TimeLimitScreen from '../components/TimeLimitScreen';

const VIEW_KEY = 'kidstube_sidebar_view';
const SKIP_SECONDS = 10;

export default function WatchPage({ state, refresh }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const video = state.videos.find((v) => v.id === id);
  const [showPlaylists, setShowPlaylists] = useState(false);
  const [locked, setLocked] = useState(false);
  const [view, setView] = useState(() => localStorage.getItem(VIEW_KEY) || '3');
  const [sidebarQuery, setSidebarQuery] = useState('');
  const videoRef = useRef(null);
  const lastTime = useRef(0);

  const allVideos = state.videos;
  const index = allVideos.findIndex((v) => v.id === id);
  const prevVideo = index > 0 ? allVideos[index - 1] : null;
  const nextVideo = index >= 0 && index < allVideos.length - 1 ? allVideos[index + 1] : null;

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

  const skip = (sec) => {
    const v = videoRef.current;
    if (v) v.currentTime = Math.max(0, Math.min(v.duration || 0, v.currentTime + sec));
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

  const sidebarVideos = allVideos.filter((v) => {
    const q = sidebarQuery.trim().toLowerCase();
    return !q || v.title.toLowerCase().includes(q);
  });

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
    <div className="space-y-4">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-violet-600"
      >
        <ChevronLeft className="w-4 h-4" /> Voltar
      </button>

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-6 items-start">
        {/* Área do vídeo — fica fixa no ecrã */}
        <div className="lg:sticky lg:top-20 space-y-3">
          <video
            key={video.id}
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

          {/* Botões de navegação do vídeo */}
          <div className="flex items-center justify-center gap-2 flex-wrap">
            <NavButton
              onClick={() => prevVideo && navigate(`/ver/${prevVideo.id}`)}
              disabled={!prevVideo}
              icon={<SkipBack className="w-4 h-4" />}
              label="Anterior"
            />
            <NavButton onClick={() => skip(-SKIP_SECONDS)} icon={<RotateCcw className="w-4 h-4" />} label={`-${SKIP_SECONDS}s`} />
            <NavButton onClick={() => skip(SKIP_SECONDS)} icon={<RotateCw className="w-4 h-4" />} label={`+${SKIP_SECONDS}s`} />
            <NavButton
              onClick={() => nextVideo && navigate(`/ver/${nextVideo.id}`)}
              disabled={!nextVideo}
              icon={<SkipForward className="w-4 h-4" />}
              label="Próximo"
            />
          </div>

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

        {/* Barra lateral — todos os vídeos, com scroll próprio */}
        <aside className="mt-6 lg:mt-0 lg:max-h-[calc(100vh-7rem)] lg:overflow-y-auto lg:pr-1">
          <div className="sticky top-0 z-10 bg-white/95 backdrop-blur rounded-2xl p-3 mb-3 border border-slate-100 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <h2 className="text-sm font-extrabold text-slate-800 flex-1 truncate">
                Todos os vídeos ({sidebarVideos.length})
              </h2>
              <ViewToggle view={view} onChange={setView} />
            </div>
            <div className="flex items-center gap-2 bg-slate-100 rounded-full px-3 py-1.5">
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <input
                value={sidebarQuery}
                onChange={(e) => setSidebarQuery(e.target.value)}
                placeholder="Procurar aqui..."
                className="flex-1 bg-transparent outline-none text-xs font-medium min-w-0"
              />
            </div>
          </div>

          {sidebarVideos.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-8">Nenhum vídeo encontrado</p>
          ) : view === '1' ? (
            <div className="space-y-2">
              {sidebarVideos.map((v) => (
                <SidebarItem
                  key={v.id}
                  video={v}
                  category={catById[v.categoryId]}
                  active={v.id === id}
                  list
                  onSelect={() => navigate(`/ver/${v.id}`)}
                />
              ))}
            </div>
          ) : (
            <div className={`grid gap-3 ${view === '2' ? 'grid-cols-2' : view === '3' ? 'grid-cols-3' : 'grid-cols-4'}`}>
              {sidebarVideos.map((v) => (
                <SidebarItem
                  key={v.id}
                  video={v}
                  category={catById[v.categoryId]}
                  active={v.id === id}
                  onSelect={() => navigate(`/ver/${v.id}`)}
                />
              ))}
            </div>
          )}
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

function NavButton({ onClick, disabled, icon, label }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-white text-slate-700 text-sm font-bold shadow-sm hover:bg-violet-50 disabled:opacity-40 disabled:hover:bg-white transition"
    >
      {icon} {label}
    </button>
  );
}

function ViewToggle({ view, onChange }) {
  const modes = [
    { key: '1', label: '☰', title: 'Lista' },
    { key: '2', label: '2', title: '2 colunas' },
    { key: '3', label: '3', title: '3 colunas' },
    { key: '4', label: '4', title: '4 colunas' },
  ];
  return (
    <div className="flex items-center gap-0.5 bg-slate-100 rounded-full p-0.5 shrink-0" title="Formato da lista">
      {modes.map((m) => (
        <button
          key={m.key}
          onClick={() => onChange(m.key)}
          title={m.title}
          className={`px-2 py-1 rounded-full text-[11px] font-extrabold transition ${
            view === m.key ? 'bg-white text-violet-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'
          }`}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}

function SidebarItem({ video, category, active, list, onSelect }) {
  return (
    <button
      onClick={onSelect}
      className={`text-left w-full rounded-xl overflow-hidden transition ${
        active ? 'ring-2 ring-violet-500 bg-violet-50' : 'hover:bg-slate-100'
      }`}
    >
      {list ? (
        <div className="flex gap-2 p-1.5">
          <div className="relative shrink-0">
            <img
              src={`/api/videos/${video.id}/thumbnail`}
              alt=""
              loading="lazy"
              className="w-28 aspect-video object-cover rounded-lg bg-slate-200"
            />
            {video.duration ? (
              <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] font-bold px-1 rounded">
                {formatDuration(video.duration)}
              </span>
            ) : null}
          </div>
          <div className="min-w-0 py-0.5">
            <p className="text-xs font-bold text-slate-800 line-clamp-2 leading-snug">{video.title}</p>
            {category && (
              <span className="text-[10px] font-bold" style={{ color: category.color }}>
                {category.icon} {category.name}
              </span>
            )}
          </div>
        </div>
      ) : (
        <div className="p-1.5">
          <div className="relative">
            <img
              src={`/api/videos/${video.id}/thumbnail`}
              alt=""
              loading="lazy"
              className="w-full aspect-video object-cover rounded-lg bg-slate-200"
            />
            {video.duration ? (
              <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] font-bold px-1 rounded">
                {formatDuration(video.duration)}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-[11px] font-bold text-slate-800 line-clamp-2 leading-snug">{video.title}</p>
        </div>
      )}
    </button>
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
