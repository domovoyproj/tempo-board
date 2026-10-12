import { validDate, validId } from './shared.js';
export const initial = { tasks: [], sessions: 0 };
export function validState(state) {
  return state && Array.isArray(state.tasks) && state.tasks.length <= 3000 && Number.isInteger(state.sessions) && state.sessions >= 0 &&
    new Set(state.tasks.map(t=>t.id)).size === state.tasks.length &&
    state.tasks.every(t=>validId(t.id) && typeof t.title==='string' && t.title.trim().length>0 && t.title.length<=160 &&
      validDate(t.date) && ['high','normal','low'].includes(t.priority) && typeof t.done==='boolean' && typeof t.note==='string' && t.note.length<=1000);
}
export function selectTasks(tasks, view, today, priority='all', search='') {
  return tasks.filter(t=>(view==='done'?t.done:view==='today'?(t.date===today||(!t.done&&t.date<today)):!t.done) &&
    (priority==='all'||t.priority===priority) && (t.title+' '+t.note).toLocaleLowerCase('ru').includes(search.toLocaleLowerCase('ru')))
    .sort((a,b)=>Number(a.done)-Number(b.done)||a.date.localeCompare(b.date)||({high:0,normal:1,low:2}[a.priority]-{high:0,normal:1,low:2}[b.priority]));
}
export function progress(tasks,today) {
  const current=tasks.filter(t=>t.date===today || (!t.done && t.date<today));
  const done=current.filter(t=>t.done).length;
  return {total:current.length,done,percent:current.length?Math.round(done/current.length*100):0};
}
