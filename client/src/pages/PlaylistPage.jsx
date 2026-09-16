import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, Trash2 } from 'lucide-react';
import { api } from '../api';
import VideoCard from '../components/VideoCard';
import PinModal from '../components/PinModal';

export default function PlaylistPage({ state, refresh }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const playlist = state.playlists.find((p) => p.id === id);
  const [removeTarget, setRemoveTarget] = useState(null);

  if (!playlist) {
    return (
      <div className="text-center py-20">
        <p className="font-bold text-slate-600">Playlist não encontrada</p>
        <button onClick={() => navigate('/playlists')} className="mt-4 px-6 py-2 rounded-full bg-violet-600 text-white font-bold">
          Voltar
        </button>
      </div>
    );
  }

  const videos = playlist.videoIds.map((vid) => state.videos.find((v) => v.id === vid)).filter(Boolean);
  const catById = Object.fromEntries(state.categories.map((c) => [c.id, c]));

  const remove = async () => {
    await api.removeFromPlaylist(playlist.id, removeTarget.id);
    setRemoveTarget(null);
    refresh();
  };

  return (
    <div>
      <button
        onClick={() => navigate('/playlists')}
        className="flex items-center gap-1 text-sm font-bold text-slate-500 hover:text-violet-600 mb-3"
      >
        <ChevronLeft className="w-4 h-4" /> Playlists
      </button>
      <h1 className="text-2xl font-extrabold text-slate-800 mb-5">{playlist.name}</h1>
      {videos.length === 0 ? (
        <div className="text-center py-20">
          <Trash2 className="w-14 h-14 text-slate-200 mx-auto" />
          <p className="mt-3 font-bold text-slate-500">Esta playlist está vazia</p>
          <p className="text-sm text-slate-400">Adiciona vídeos com o botão “Playlist” na página do vídeo</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {videos.map((v) => (
            <VideoCard key={v.id} video={v} category={catById[v.categoryId]} showRemove onRemove={setRemoveTarget} />
          ))}
        </div>
      )}
      {removeTarget && (
        <PinModal title="Remover da playlist" onSuccess={remove} onClose={() => setRemoveTarget(null)} />
      )}
    </div>
  );
}
