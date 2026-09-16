import { useEffect, useState, useCallback } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { Play } from 'lucide-react';
import { api } from './api';
import { isLocked } from './timeLimit';
import Header from './components/Header';
import HomePage from './pages/HomePage';
import WatchPage from './pages/WatchPage';
import FavoritesPage from './pages/FavoritesPage';
import PlaylistsPage from './pages/PlaylistsPage';
import PlaylistPage from './pages/PlaylistPage';
import SettingsPage from './pages/SettingsPage';
import TimeLimitScreen from './components/TimeLimitScreen';

export default function App() {
  const [state, setState] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [query, setQuery] = useState('');
  const location = useLocation();

  const refresh = useCallback(async () => {
    try {
      const s = await api.getState();
      setState(s);
      setError('');
    } catch (e) {
      setError(e.message);
    }
  }, []);

  useEffect(() => {
    refresh().finally(() => setLoading(false));
  }, [refresh]);

  // Atualizar automaticamente a cada 30s (novos vídeos aparecem sozinhos)
  useEffect(() => {
    const t = setInterval(() => {
      api.getState().then(setState).catch(() => {});
    }, 30000);
    return () => clearInterval(t);
  }, []);

  // Atualizar ao voltar à janela
  useEffect(() => {
    const onFocus = () => refresh();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [refresh]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4">
        <div className="w-20 h-20 rounded-3xl bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center shadow-lg animate-bounce">
          <Play className="w-10 h-10 text-white fill-white" />
        </div>
        <p className="text-slate-500 font-semibold">A carregar KidsTube...</p>
      </div>
    );
  }

  if (!state) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 p-6 text-center">
        <p className="text-lg font-bold text-slate-700">Não foi possível ligar ao servidor</p>
        <p className="text-slate-500">{error}</p>
        <button
          onClick={refresh}
          className="px-6 py-2 rounded-full bg-violet-600 text-white font-bold hover:bg-violet-700"
        >
          Tentar de novo
        </button>
      </div>
    );
  }

  const locked = isLocked(state.settings.dailyLimitMinutes);
  const showLock = locked && location.pathname !== '/definicoes';

  return (
    <div className="min-h-screen">
      {showLock ? (
        <TimeLimitScreen onUnlock={() => setState({ ...state })} />
      ) : (
        <>
          <Header query={query} setQuery={setQuery} limit={state.settings.dailyLimitMinutes} scan={state.scan} />
          <main className="max-w-7xl mx-auto px-4 sm:px-6 pb-16 pt-4">
            <Routes>
              <Route path="/" element={<HomePage state={state} query={query} refresh={refresh} />} />
              <Route path="/ver/:id" element={<WatchPage state={state} refresh={refresh} />} />
              <Route path="/favoritos" element={<FavoritesPage state={state} refresh={refresh} />} />
              <Route path="/playlists" element={<PlaylistsPage state={state} refresh={refresh} />} />
              <Route path="/playlist/:id" element={<PlaylistPage state={state} refresh={refresh} />} />
              <Route path="/definicoes" element={<SettingsPage state={state} refresh={refresh} />} />
            </Routes>
          </main>
        </>
      )}
    </div>
  );
}
