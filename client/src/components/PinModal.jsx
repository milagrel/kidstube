import { useState } from 'react';
import { Lock, X } from 'lucide-react';
import { api } from '../api';

export default function PinModal({ title = 'Código dos Pais', onSuccess, onClose }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await api.verifyPin(pin);
      if (res.ok) {
        sessionStorage.setItem('kidstube_parent', '1');
        onSuccess();
      } else {
        setError('PIN incorreto. Tenta de novo.');
        setPin('');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="w-9 h-9 rounded-xl bg-violet-100 text-violet-600 flex items-center justify-center">
              <Lock className="w-5 h-5" />
            </span>
            <h2 className="font-extrabold text-slate-800">{title}</h2>
          </div>
          {onClose && (
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
        <form onSubmit={submit} className="space-y-3">
          <input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            autoFocus
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            placeholder="••••"
            className="w-full text-center text-2xl tracking-[0.5em] font-bold py-3 rounded-2xl bg-slate-100 outline-none focus:ring-2 focus:ring-violet-400"
          />
          {error && <p className="text-sm font-semibold text-rose-500 text-center">{error}</p>}
          <button
            type="submit"
            disabled={busy || pin.length < 4}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-violet-600 to-pink-500 text-white font-extrabold hover:opacity-90 disabled:opacity-40 transition"
          >
            {busy ? 'A verificar...' : 'Entrar'}
          </button>
        </form>
      </div>
    </div>
  );
}
