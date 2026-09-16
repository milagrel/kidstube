import { useState } from 'react';
import { Moon, Lock } from 'lucide-react';
import { api } from '../api';
import { addExtraMinutes } from '../timeLimit';

export default function TimeLimitScreen({ onUnlock }) {
  const [showPin, setShowPin] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    const res = await api.verifyPin(pin);
    if (res.ok) {
      addExtraMinutes(30);
      onUnlock();
    } else {
      setError('PIN incorreto');
      setPin('');
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-indigo-100 via-violet-100 to-pink-100">
      <div className="w-24 h-24 rounded-full bg-indigo-500 flex items-center justify-center shadow-xl animate-pulse">
        <Moon className="w-12 h-12 text-white" />
      </div>
      <h1 className="mt-6 text-3xl font-extrabold text-slate-800">Hora de descansar! 🌙</h1>
      <p className="mt-2 text-slate-600 font-medium max-w-sm">
        O tempo de ecrã de hoje terminou. Vai brincar, desenhar ou ler um livro!
      </p>
      {!showPin ? (
        <button
          onClick={() => setShowPin(true)}
          className="mt-8 flex items-center gap-2 px-6 py-3 rounded-full bg-white text-slate-700 font-bold shadow-md hover:shadow-lg transition"
        >
          <Lock className="w-4 h-4" /> Pedir mais tempo aos pais
        </button>
      ) : (
        <form onSubmit={submit} className="mt-8 w-full max-w-xs space-y-3">
          <input
            type="password"
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={6}
            autoFocus
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            placeholder="PIN dos pais"
            className="w-full text-center text-2xl tracking-[0.4em] font-bold py-3 rounded-2xl bg-white shadow-md outline-none focus:ring-2 focus:ring-indigo-400"
          />
          {error && <p className="text-sm font-bold text-rose-500">{error}</p>}
          <button
            type="submit"
            disabled={pin.length < 4}
            className="w-full py-3 rounded-2xl bg-indigo-600 text-white font-extrabold hover:bg-indigo-700 disabled:opacity-40 transition"
          >
            +30 minutos
          </button>
        </form>
      )}
    </div>
  );
}
