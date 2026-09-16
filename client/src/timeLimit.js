const KEY = 'kidstube_time_used_';
const EXTRA_KEY = 'kidstube_time_extra_';

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function getUsedSeconds() {
  return parseInt(localStorage.getItem(KEY + todayKey()) || '0', 10);
}

export function addSeconds(s) {
  localStorage.setItem(KEY + todayKey(), String(getUsedSeconds() + Math.max(0, Math.round(s))));
}

export function getExtraMinutes() {
  return parseInt(localStorage.getItem(EXTRA_KEY + todayKey()) || '0', 10);
}

export function addExtraMinutes(min) {
  localStorage.setItem(EXTRA_KEY + todayKey(), String(getExtraMinutes() + Math.max(0, Math.round(min))));
}

export function isLocked(limitMinutes) {
  if (!limitMinutes || limitMinutes <= 0) return false;
  return getUsedSeconds() >= limitMinutes * 60 + getExtraMinutes() * 60;
}
