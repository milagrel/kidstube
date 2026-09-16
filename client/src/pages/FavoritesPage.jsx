import { Heart } from 'lucide-react';
import VideoCard from '../components/VideoCard';
import { api } from '../api';

export default function FavoritesPage({ state, refresh }) {
  const favorites = state.videos.filter((v) => v.favorite);
  const catById = Object.fromEntries(state.categories.map((c) => [c.id, c]));

  const toggleFavorite = async (video) => {
    await api.toggleFavorite(video.id, !video.favorite);
    refresh();
  };

  return (
    <div>
      <h1 className="text-2xl font-extrabold text-slate-800 mb-5 flex items-center gap-2">
        <Heart className="w-6 h-6 text-rose-500 fill-rose-500" /> Os meus favoritos
      </h1>
      {favorites.length === 0 ? (
        <div className="text-center py-20">
          <Heart className="w-14 h-14 text-slate-200 mx-auto" />
          <p className="mt-3 font-bold text-slate-500">Ainda não tens favoritos</p>
          <p className="text-sm text-slate-400">Toca no coração ❤️ de um vídeo para o guardares aqui</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
          {favorites.map((v) => (
            <VideoCard key={v.id} video={v} category={catById[v.categoryId]} onToggleFavorite={toggleFavorite} />
          ))}
        </div>
      )}
    </div>
  );
}
