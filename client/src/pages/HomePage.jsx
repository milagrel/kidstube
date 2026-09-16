import { useState } from 'react';
import { PlayCircle, Sparkles } from 'lucide-react';
import VideoCard from '../components/VideoCard';
import { api } from '../api';

export default function HomePage({ state, query, refresh }) {
  const [categoryId, setCategoryId] = useState('all');
  const { videos, categories } = state;

  const toggleFavorite = async (video) => {
    await api.toggleFavorite(video.id, !video.favorite);
    refresh();
  };

  const catById = Object.fromEntries(categories.map((c) => [c.id, c]));

  const filtered = videos.filter((v) => {
    const matchCat = categoryId === 'all' || v.categoryId === categoryId;
    const q = query.trim().toLowerCase();
    const matchQ = !q || v.title.toLowerCase().includes(q);
    return matchCat && matchQ;
  });

  const continueWatching = [...videos]
    .filter((v) => v.lastWatchedAt)
    .sort((a, b) => b.lastWatchedAt.localeCompare(a.lastWatchedAt))
    .slice(0, 8);

  return (
    <div className="space-y-8">
      {query.trim() ? (
        <div>
          <h2 className="text-xl font-extrabold text-slate-800 mb-4">
            Resultados para “{query}” ({filtered.length})
          </h2>
          {filtered.length === 0 ? (
            <EmptyState />
          ) : (
            <VideoGrid videos={filtered} categories={catById} onToggleFavorite={toggleFavorite} />
          )}
        </div>
      ) : (
        <>
          {continueWatching.length > 0 && (
            <section>
              <SectionTitle icon={<PlayCircle className="w-5 h-5 text-violet-600" />} title="Continuar a ver" />
              <VideoGrid videos={continueWatching} categories={catById} onToggleFavorite={toggleFavorite} />
            </section>
          )}

          <section>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
              <Chip active={categoryId === 'all'} onClick={() => setCategoryId('all')} label="Todos" color="#7C3AED" />
              {categories.map((c) => (
                <Chip
                  key={c.id}
                  active={categoryId === c.id}
                  onClick={() => setCategoryId(c.id)}
                  label={`${c.icon} ${c.name}`}
                  color={c.color}
                />
              ))}
            </div>
            {filtered.length === 0 ? (
              <EmptyState />
            ) : (
              <VideoGrid videos={filtered} categories={catById} onToggleFavorite={toggleFavorite} />
            )}
          </section>
        </>
      )}
    </div>
  );
}

function SectionTitle({ icon, title }) {
  return (
    <h2 className="flex items-center gap-2 text-xl font-extrabold text-slate-800 mb-4">
      {icon} {title}
    </h2>
  );
}

function Chip({ active, onClick, label, color }) {
  return (
    <button
      onClick={onClick}
      className="shrink-0 px-4 py-2 rounded-full text-sm font-bold transition shadow-sm"
      style={active ? { backgroundColor: color, color: '#fff' } : { backgroundColor: '#fff', color: '#475569' }}
    >
      {label}
    </button>
  );
}

function VideoGrid({ videos, categories, onToggleFavorite }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
      {videos.map((v) => (
        <VideoCard key={v.id} video={v} category={categories[v.categoryId]} onToggleFavorite={onToggleFavorite} />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <Sparkles className="w-12 h-12 text-slate-300" />
      <p className="mt-3 font-bold text-slate-500">Ainda não há vídeos aqui</p>
      <p className="text-sm text-slate-400">Os pais podem adicionar vídeos nas Definições</p>
    </div>
  );
}
