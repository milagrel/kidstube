import { NavLink, useNavigate } from 'react-router-dom';
import { Play, Home, Heart, ListVideo, Settings, Search, Loader2 } from 'lucide-react';
import { getUsedSeconds } from '../timeLimit';

const navItems = [
  { to: '/', label: 'Início', icon: Home, end: true },
  { to: '/favoritos', label: 'Favoritos', icon: Heart },
  { to: '/playlists', label: 'Playlists', icon: ListVideo },
  { to: '/definicoes', label: 'Definições', icon: Settings },
];

export default function Header({ query, setQuery, limit, scan }) {
  const navigate = useNavigate();
  const used = getUsedSeconds();
  const remaining = limit > 0 ? Math.max(0, Math.round(limit - used / 60)) : null;

  return (
    <header className="sticky top-0 z-40 bg-white/80 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/')} className="flex items-center gap-2 shrink-0">
          <span className="w-10 h-10 rounded-2xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center shadow-md">
            <Play className="w-5 h-5 text-white fill-white" />
          </span>
          <span className="text-xl font-extrabold bg-gradient-to-r from-violet-600 to-pink-500 bg-clip-text text-transparent hidden sm:block">
            KidsTube
          </span>
        </button>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            navigate('/');
          }}
          className="flex-1 max-w-xl mx-auto flex items-center gap-2 bg-slate-100 rounded-full px-4 py-2 focus-within:ring-2 focus-within:ring-violet-400"
        >
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Procurar vídeos..."
            className="flex-1 bg-transparent outline-none text-sm font-medium min-w-0"
          />
        </form>

        {scan?.scanning && (
          <span className="hidden md:inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 shrink-0">
            <Loader2 className="w-3.5 h-3.5 animate-spin" /> A procurar vídeos...
          </span>
        )}

        {remaining !== null && (
          <span
            className={`hidden md:inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full shrink-0 ${
              remaining <= 15 ? 'bg-rose-100 text-rose-600' : 'bg-emerald-100 text-emerald-700'
            }`}
          >
            ⏱ {remaining} min hoje
          </span>
        )}

        <nav className="flex items-center gap-1 shrink-0">
          {navItems.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex flex-col items-center gap-0.5 px-3 py-1 rounded-xl text-[11px] font-bold transition ${
                  isActive ? 'text-violet-600 bg-violet-50' : 'text-slate-500 hover:bg-slate-100'
                }`
              }
            >
              <Icon className="w-5 h-5" />
              <span className="hidden sm:block">{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
