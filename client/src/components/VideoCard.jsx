import { useNavigate } from 'react-router-dom';
import { Play, Heart, X } from 'lucide-react';
import { formatDuration } from '../utils';

export default function VideoCard({ video, category, onToggleFavorite, showRemove, onRemove }) {
  const navigate = useNavigate();
  return (
    <div className="group relative cursor-pointer" onClick={() => navigate(`/ver/${video.id}`)}>
      <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-200 shadow-sm group-hover:shadow-xl transition-shadow">
        <img
          src={`/api/videos/${video.id}/thumbnail`}
          alt={video.title}
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
        {video.duration ? (
          <span className="absolute bottom-2 right-2 bg-black/70 text-white text-[11px] font-bold px-2 py-0.5 rounded-md">
            {formatDuration(video.duration)}
          </span>
        ) : null}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
          <span className="bg-white/95 rounded-full p-3 shadow-lg">
            <Play className="w-6 h-6 text-violet-600 fill-violet-600" />
          </span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite?.(video);
          }}
          className={`absolute top-2 right-2 p-1.5 rounded-full backdrop-blur transition ${
            video.favorite ? 'bg-rose-500 text-white' : 'bg-black/30 text-white hover:bg-black/50'
          }`}
          title={video.favorite ? 'Remover dos favoritos' : 'Adicionar aos favoritos'}
        >
          <Heart className={`w-4 h-4 ${video.favorite ? 'fill-white' : ''}`} />
        </button>
        {showRemove && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove?.(video);
            }}
            className="absolute top-2 left-2 p-1.5 rounded-full bg-black/40 text-white hover:bg-rose-500 transition"
            title="Remover da playlist"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      <div className="mt-2 px-0.5">
        <h3 className="font-bold text-sm text-slate-800 line-clamp-2 leading-snug">{video.title}</h3>
        {category ? (
          <span
            className="inline-block mt-1 text-[11px] font-bold px-2 py-0.5 rounded-full"
            style={{ backgroundColor: category.color + '1f', color: category.color }}
          >
            {category.icon} {category.name}
          </span>
        ) : (
          <span className="inline-block mt-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-500">
            Todos
          </span>
        )}
      </div>
    </div>
  );
}
