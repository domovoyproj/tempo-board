export const $ = (selector) => document.querySelector(selector);
export const escapeHTML = (value) => String(value).replace(/[&<>"']/g, (char) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
export function dateKey(date = new Date()) {
  return [date.getFullYear(), String(date.getMonth()+1).padStart(2,'0'), String(date.getDate()).padStart(2,'0')].join('-');
}
export function shiftDay(key, amount) {
  const [year, month, day] = key.split('-').map(Number);
  return dateKey(new Date(year, month-1, day+amount, 12));
}
export function toast(message) {
  const region = $('#notice'); region.textContent = message; region.hidden = false;
  clearTimeout(toast.timer); toast.timer = setTimeout(() => { region.hidden = true; }, 5000);
}
export function load(key, fallback, validate) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return structuredClone(fallback);
    const state = JSON.parse(raw);
    if (!validate(state)) throw new Error('Invalid data');
    return state;
  } catch { toast('Не удалось прочитать данные. Исходная копия в браузере не изменена.'); return structuredClone(fallback); }
}
export function save(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); return true; }
  catch { toast('Браузер не сохранил изменения. Скачайте резервную копию.'); return false; }
}
export function download(name, value) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(value,null,2)], {type:'application/json'}));
  const link = document.createElement('a'); link.href=url; link.download=name; link.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
}
export async function readBackup(file, app, validate) {
  if (!file || file.size > 2000000) throw new Error('Выберите JSON-файл размером до 2 МБ.');
  const backup = JSON.parse(await file.text());
  if (backup.app !== app || backup.version !== 1 || !validate(backup.data)) throw new Error('Это не подходящая резервная копия.');
  return backup.data;
}
export function wireDialog(dialog) {
  dialog.querySelector('[data-close]')?.addEventListener('click',()=>dialog.close());
}
export const validDate = (value) => typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value) && dateKey(new Date(value+'T12:00:00')) === value;
export const validId = (value) => typeof value === 'string' && /^[a-zA-Z0-9_-]{1,80}$/.test(value);

