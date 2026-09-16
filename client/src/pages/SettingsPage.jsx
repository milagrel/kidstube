import { useEffect, useState } from 'react';
import { Settings as SettingsIcon, Shield, Upload, Tags, ListVideo, Film, RefreshCw, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import { api } from '../api';
import PinModal from '../components/PinModal';

const COLORS = ['#7C3AED', '#EC4899', '#F59E0B', '#0EA5E9', '#10B981', '#EF4444', '#8B5CF6', '#F97316', '#06B6D4', '#84CC16'];
const ICONS = ['🎬', '🎨', '🎵', '📚', '🧸', '🦖', '🚀', '🐱', '⭐', '🌈', '⚽', '🍎'];

export default function SettingsPage({ state, refresh }) {
  const [authed, setAuthed] = useState(() => sessionStorage.getItem('kidstube_token') !== null);
  if (!authed) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <PinModal title="Código dos Pais" onSuccess={() => setAuthed(true)} />
      </div>
    );
  }
  return <SettingsContent state={state} refresh={refresh} />;
}

function Card({ icon, title, children }) {
  return (
    <section className="bg-white rounded-3xl shadow-sm p-5 sm:p-6">
      <h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-800 mb-4">
        <span className="w-8 h-8 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center">{icon}</span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function SettingsContent({ state, refresh }) {
  const [limit, setLimit] = useState(state.settings.dailyLimitMinutes);
  const [newPin, setNewPin] = useState('');
  const [folder, setFolder] = useState(state.settings.videosFolder);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [videoFile, setVideoFile] = useState(null);
  const [thumbFile, setThumbFile] = useState(null);
  const [catName, setCatName] = useState('');
  const [catColor, setCatColor] = useState(COLORS[0]);
  const [catIcon, setCatIcon] = useState(ICONS[0]);
  const [plName, setPlName] = useState('');
  const [allVideos, setAllVideos] = useState([]);

  useEffect(() => {
    api
      .getAdminVideos()
      .then((r) => setAllVideos(r.videos))
      .catch(() => {});
  }, []);

  const flash = (text) => {
    setMsg(text);
    setTimeout(() => setMsg(''), 3500);
  };

  const saveSettings = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      const settings = { dailyLimitMinutes: limit };
      if (newPin) settings.pin = newPin;
      if (folder.trim()) settings.videosFolder = folder.trim();
      await api.saveSettings(settings);
      if (newPin) {
        setNewPin('');
        flash('PIN atualizado! 🔒');
      } else {
        flash('Definições guardadas! ✅');
      }
      await api.scan();
      refresh();
    } catch (err) {
      flash(err.message);
    } finally {
      setBusy(false);
    }
  };

  const doScan = async () => {
    setBusy(true);
    try {
      await api.scan();
      refresh();
      flash('Vídeos atualizados! 🔄');
    } catch (err) {
      flash(err.message);
    } finally {
      setBusy(false);
    }
  };

  const doUpload = async (e) => {
    e.preventDefault();
    if (!videoFile) return;
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append('video', videoFile);
      if (thumbFile) fd.append('thumbnail', thumbFile);
      const res = await api.upload(fd);
      flash(`Vídeo adicionado! (${res.total} no total)`);
      setVideoFile(null);
      setThumbFile(null);
      refresh();
    } catch (err) {
      flash(err.message);
    } finally {
      setBusy(false);
    }
  };

  const addCategory = async (e) => {
    e.preventDefault();
    if (!catName.trim()) return;
    await api.createCategory({ name: catName.trim(), color: catColor, icon: catIcon });
    setCatName('');
    refresh();
  };

  const removeCategory = async (c) => {
    if (!window.confirm(`Apagar a categoria "${c.name}"? Os vídeos ficam em "Todos".`)) return;
    await api.deleteCategory(c.id);
    refresh();
  };

  const addPlaylist = async (e) => {
    e.preventDefault();
    if (!plName.trim()) return;
    await api.createPlaylist(plName.trim());
    setPlName('');
    refresh();
  };

  const removePlaylist = async (p) => {
    if (!window.confirm(`Apagar a playlist "${p.name}"?`)) return;
    await api.deletePlaylist(p.id);
    refresh();
  };

  const togglePrivate = async (v) => {
    await api.setPrivate(v.id, !v.isPrivate);
    refresh();
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <h1 className="text-2xl font-extrabold text-slate-800 flex items-center gap-2">
        <SettingsIcon className="w-6 h-6 text-violet-600" /> Definições dos Pais
      </h1>
      {msg && <div className="px-4 py-3 rounded-2xl bg-emerald-50 text-emerald-700 font-bold text-sm">{msg}</div>}

      <Card icon={<Shield className="w-4 h-4" />} title="Limites e segurança">
        <form onSubmit={saveSettings} className="space-y-4">
          <label className="block">
            <span className="text-sm font-bold text-slate-600">Limite diário de ecrã (minutos)</span>
            <input
              type="number" min="0" max="600" value={limit} onChange={(e) => setLimit(e.target.value)}
              className="mt-1 w-full max-w-xs px-4 py-2.5 rounded-2xl bg-slate-100 outline-none focus:ring-2 focus:ring-violet-400 font-bold"
            />
            <span className="text-xs text-slate-400 block">0 = sem limite</span>
          </label>
          <label className="block">
            <span className="text-sm font-bold text-slate-600">Nova PIN dos pais (4-6 dígitos)</span>
            <input
              type="password" inputMode="numeric" maxLength={6} value={newPin}
              onChange={(e) => setNewPin(e.target.value.replace(/\D/g, ''))}
              placeholder="Deixar vazio para manter"
              className="mt-1 w-full max-w-xs px-4 py-2.5 rounded-2xl bg-slate-100 outline-none focus:ring-2 focus:ring-violet-400 font-bold tracking-widest"
            />
          </label>
          <label className="block">
            <span className="text-sm font-bold text-slate-600">Pasta dos vídeos</span>
            <input
              value={folder} onChange={(e) => setFolder(e.target.value)}
              className="mt-1 w-full px-4 py-2.5 rounded-2xl bg-slate-100 outline-none focus:ring-2 focus:ring-violet-400 font-mono text-sm"
            />
          </label>
          <div className="flex gap-2">
            <button type="submit" disabled={busy} className="px-5 py-2.5 rounded-full bg-violet-600 text-white font-bold text-sm disabled:opacity-40 hover:bg-violet-700">
              Guardar
            </button>
            <button type="button" onClick={doScan} disabled={busy} className="flex items-center gap-1 px-5 py-2.5 rounded-full bg-white text-slate-700 font-bold text-sm shadow-sm hover:bg-slate-50 disabled:opacity-40">
              <RefreshCw className="w-4 h-4" /> Procurar vídeos
            </button>
          </div>
        </form>
      </Card>

      <Card icon={<Upload className="w-4 h-4" />} title="Adicionar vídeo">
        <form onSubmit={doUpload} className="space-y-3">
          <div>
            <label className="block text-sm font-bold text-slate-600 mb-1">Ficheiro de vídeo (mp4, webm, mkv...)</label>
            <input type="file" accept="video/*" onChange={(e) => setVideoFile(e.target.files[0])} className="block w-full text-sm text-slate-500 file:mr-3 file:px-4 file:py-2 file:rounded-full file:border-0 file:bg-violet-100 file:text-violet-700 file:font-bold hover:file:bg-violet-200" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-600 mb-1">Miniatura (opcional)</label>
            <input type="file" accept="image/*" onChange={(e) => setThumbFile(e.target.files[0])} className="block w-full text-sm text-slate-500 file:mr-3 file:px-4 file:py-2 file:rounded-full file:border-0 file:bg-slate-100 file:text-slate-600 file:font-bold hover:file:bg-slate-200" />
          </div>
          <button disabled={busy || !videoFile} className="px-5 py-2.5 rounded-full bg-emerald-600 text-white font-bold text-sm disabled:opacity-40 hover:bg-emerald-700">
            Enviar vídeo
          </button>
        </form>
      </Card>

      <Card icon={<Tags className="w-4 h-4" />} title="Categorias">
        <form onSubmit={addCategory} className="flex flex-wrap gap-2 items-center mb-4">
          <input value={catName} onChange={(e) => setCatName(e.target.value)} placeholder="Nome (ex.: Desenhos)" className="flex-1 min-w-40 px-4 py-2.5 rounded-2xl bg-slate-100 outline-none focus:ring-2 focus:ring-violet-400 text-sm font-medium" />
          <select value={catColor} onChange={(e) => setCatColor(e.target.value)} className="px-3 py-2.5 rounded-2xl bg-slate-100 text-sm font-bold outline-none">
            {COLORS.map((c) => <option key={c} value={c} style={{ color: c }}>● Cor</option>)}
          </select>
          <select value={catIcon} onChange={(e) => setCatIcon(e.target.value)} className="px-3 py-2.5 rounded-2xl bg-slate-100 text-sm outline-none">
            {ICONS.map((i) => <option key={i} value={i}>{i}</option>)}
          </select>
          <button disabled={!catName.trim()} className="px-4 py-2.5 rounded-full bg-violet-600 text-white text-sm font-bold disabled:opacity-40">
            <Plus className="w-4 h-4 inline" /> Adicionar
          </button>
        </form>
        <div className="flex flex-wrap gap-2">
          {state.categories.map((c) => (
            <span key={c.id} className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold" style={{ backgroundColor: c.color + '1f', color: c.color }}>
              {c.icon} {c.name}
              <button onClick={() => removeCategory(c)} className="hover:text-rose-500"><Trash2 className="w-3.5 h-3.5" /></button>
            </span>
          ))}
          {state.categories.length === 0 && <p className="text-sm text-slate-400">Sem categorias — as subpastas da pasta de vídeos criam categorias automaticamente.</p>}
        </div>
      </Card>

      <Card icon={<ListVideo className="w-4 h-4" />} title="Playlists">
        <form onSubmit={addPlaylist} className="flex gap-2 mb-4 max-w-md">
          <input value={plName} onChange={(e) => setPlName(e.target.value)} placeholder="Nome da playlist..." className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-100 outline-none focus:ring-2 focus:ring-violet-400 text-sm font-medium" />
          <button disabled={!plName.trim()} className="px-4 py-2.5 rounded-full bg-violet-600 text-white text-sm font-bold disabled:opacity-40">Criar</button>
        </form>
        <div className="space-y-2">
          {state.playlists.map((p) => (
            <div key={p.id} className="flex items-center justify-between px-4 py-3 rounded-2xl bg-slate-50">
              <span className="font-bold text-slate-700 text-sm">{p.name} <span className="text-slate-400 font-medium">({p.videoIds.length})</span></span>
              <button onClick={() => removePlaylist(p)} className="text-slate-400 hover:text-rose-500"><Trash2 className="w-4 h-4" /></button>
            </div>
          ))}
          {state.playlists.length === 0 && <p className="text-sm text-slate-400">Sem playlists ainda.</p>}
        </div>
      </Card>

      <Card icon={<Film className="w-4 h-4" />} title={`Vídeos (${allVideos.length})`}>
        <p className="text-xs text-slate-400 mb-3">Olho aberto = visível para as crianças. Olho fechado = escondido (privado).</p>
        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {allVideos.map((v) => (
            <div key={v.id} className="flex items-center gap-3 px-3 py-2 rounded-2xl bg-slate-50">
              <img src={`/api/videos/${v.id}/thumbnail`} alt="" className="w-16 h-10 rounded-lg object-cover bg-slate-200" />
              <div className="flex-1 min-w-0">
                <p className="font-bold text-sm text-slate-700 truncate">{v.title}</p>
                <p className="text-xs text-slate-400 truncate">{v.fileName}</p>
              </div>
              <button onClick={() => togglePrivate(v)} title={v.isPrivate ? 'Tornar público' : 'Tornar privado'} className={`p-2 rounded-full ${v.isPrivate ? 'bg-slate-200 text-slate-500' : 'bg-emerald-100 text-emerald-600'}`}>
                {v.isPrivate ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          ))}
          {allVideos.length === 0 && <p className="text-sm text-slate-400">Ainda não há vídeos. Coloca ficheiros na pasta de vídeos ou envia um acima.</p>}
        </div>
      </Card>
    </div>
  );
}
