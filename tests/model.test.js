import {test} from 'node:test';import assert from 'node:assert/strict';
import {validState,selectTasks,progress} from '../dist/model.js';
const task={id:'a',title:'Задача',note:'',date:'2026-10-13',priority:'normal',done:false};
test('overdue work stays in today; future work does not',()=>{const tasks=[task,{...task,id:'b',date:'2026-10-14'},{...task,id:'c',date:'2026-10-12'}];assert.deepEqual(selectTasks(tasks,'today','2026-10-13').map(t=>t.id),['c','a']);});
test('completed view, search and priority combine',()=>{const t={...task,done:true,priority:'high',title:'Купить книгу'};assert.equal(selectTasks([t],'done','2026-10-13','high','КНИГУ').length,1);assert.equal(selectTasks([t],'all','2026-10-13').length,0);});
test('today progress includes unfinished overdue, excludes old completed',()=>{assert.deepEqual(progress([task,{...task,id:'b',date:'2026-10-12'},{...task,id:'c',date:'2026-10-12',done:true}],'2026-10-13'),{total:2,done:0,percent:0});});
test('empty progress never divides by zero',()=>assert.equal(progress([],'2026-10-13').percent,0));
test('backup rejects invalid date, duplicate IDs and malformed records',()=>{assert.ok(validState({tasks:[task],sessions:0}));assert.ok(!validState({tasks:[task,task],sessions:0}));assert.ok(!validState({tasks:[{...task,date:'2026-02-30'}],sessions:0}));assert.ok(!validState({tasks:[{...task,id:'"><script>'}],sessions:0}));});

