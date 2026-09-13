const DAYS=['Tuesday','Thursday','Saturday','Sunday'];
const dayShort={Tuesday:'TUE',Thursday:'THU',Saturday:'SAT',Sunday:'SUN'};
const workoutTitles={Tuesday:'Chest + Triceps + Core',Thursday:'Upper Pull',Saturday:'Lower Body',Sunday:'Full Body'};
const seedProgram={
Tuesday:[
['Flat Barbell Bench Press',4,'8 / 8 / 6 / 6','70 / 72.5 / 75 / 75 kg','Warm-up: 20×15, 40×10, 55×5, 65×3.'],
['Incline Dumbbell Press',3,'10 / 8 / 8','20 / 22.5 / 22.5 kg each','Bench around 25–30°.'],
['Dumbbell Pullover',3,'10–12','15 kg','Lie fully supported lengthways on the bench.'],
['Pec Deck',3,'10–15','35 kg','Controlled chest fly.'],
['Bodyweight Dips',2,'6–10','Bodyweight','Skip if shoulder pain is more than normal soreness.'],
['EZ-Bar Skull Crushers',3,'8–10','20 kg total','Stop if elbow/brachialis pain increases.'],
['Overhead Rope Extension',3,'10–12','17.5–20 kg','Cable stack may vary.'],
['Single-Arm Triceps Extension',4,'10–12 each','5–7.5 kg',''],
['Heel Slide',2,'6 each side','Bodyweight','Core stability.'],
['Bird Dog',2,'5 each side, 5-sec hold','Bodyweight','Cross-body stability.'],
['Side Plank from Knees',2,'15–25 sec each side','Bodyweight','Lateral core stability.'],
['Pallof Press',2,'8–10 each side','7.5–10 kg','Anti-rotation.']
],
Thursday:[
['Cable Row',5,'5','30 kg',''],['Lat Pulldown',4,'6–10','50 kg',''],['Chest-Supported Row',4,'5–8','45 kg',''],['Single-Arm Dumbbell Row',3,'8–10 each','27.5 kg each',''],['Face Pull + Rear Delt Raise',3,'12–15 / 12–15','20 kg / 7.5 kg each',''],['Hammer Curl',3,'8–12','15 kg each','Reduce or substitute if left brachialis/elbow is sore.'],['Farmer Carry',4,'30–40 m','30 kg each',''],['Rower / Sled / Bike',1,'15–20 min','Steady','']
],
Saturday:[
['Box Jump',5,'3','Bodyweight',''],['Squat',5,'3–5','60 kg',''],['Romanian Deadlift',4,'5–8','60 kg',''],['Trap-Bar Deadlift',3,'3–5','80 kg',''],['Walking Lunge',3,'8–10 each','15 kg each',''],['Hamstring Curl + Calf Raise',3,'10–12 / 12–15','40 kg / 60 kg',''],['Cable Crunch + Hanging Knee Raise',3,'12–15 / 8–12','35 kg / Bodyweight',''],['Incline Walk / Bike',1,'20–30 min','Steady','']
],
Sunday:[
['Kettlebell Swing',5,'5','20 kg',''],['Trap-Bar Deadlift',4,'3–5','70 kg',''],['Front Squat',3,'6–8','40 kg',''],['Dumbbell Bench Press',3,'8–10','22.5 kg each',''],['Seated Cable Row',3,'8–10','45 kg',''],['Rear Delt Raise + EZ-Bar Curl',3,'12–15 / 10–12','7.5 kg each / 25 kg',''],['Suitcase Carry',3,'30–40 m each','24 kg',''],['Bike / Incline Walk',1,'30–40 min','Steady','']
]};

const DB_NAME='BearFitLocalDB', STORE='state', KEY='app', DB_VERSION=1;
let state=null;
let currentView='trainView';
let selectedDay=null;
let editMode=false;

function defaultState(){
 const program={};
 for(const day of DAYS) program[day]=seedProgram[day].map((x,i)=>({id:crypto.randomUUID(),name:x[0],sets:x[1],reps:x[2],suggested:x[3],notes:x[4],order:i+1,active:true}));
 return {version:1,program,setLogs:[],sessions:[],foodLogs:[],settings:{calorieTarget:2400,proteinTarget:180},draftSets:{},workoutSelection:{},createdAt:new Date().toISOString()};
}
function openDB(){return new Promise((resolve,reject)=>{const req=indexedDB.open(DB_NAME,DB_VERSION);req.onupgradeneeded=()=>{const db=req.result;if(!db.objectStoreNames.contains(STORE))db.createObjectStore(STORE)};req.onsuccess=()=>resolve(req.result);req.onerror=()=>reject(req.error)})}
async function loadState(){const db=await openDB();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readonly');const req=tx.objectStore(STORE).get(KEY);req.onsuccess=()=>resolve(req.result||defaultState());req.onerror=()=>reject(req.error)})}
async function saveState(){const db=await openDB();return new Promise((resolve,reject)=>{const tx=db.transaction(STORE,'readwrite');tx.objectStore(STORE).put(state,KEY);tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error)})}
function isoDate(d=new Date()){const y=d.getFullYear();const m=String(d.getMonth()+1).padStart(2,'0');const day=String(d.getDate()).padStart(2,'0');return `${y}-${m}-${day}`}
function scheduledDay(){const names=['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];const n=names[new Date().getDay()];return DAYS.includes(n)?n:'Tuesday'}
function parseSuggested(s=''){const m=String(s).match(/\d+(?:\.\d+)?/);return m?Number(m[0]):''}
function suggestedWeightForSet(ex,setNo){const nums=(String(ex.suggested).match(/\d+(?:\.\d+)?/g)||[]).map(Number);return nums.length===ex.sets?nums[setNo-1]:(nums[0]??'')}
function escapeHtml(s=''){return String(s).replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]))}
function toast(msg){const el=document.createElement('div');el.className='toast';el.textContent=msg;document.body.appendChild(el);setTimeout(()=>el.remove(),1800)}
function recentLogs(name){return state.setLogs.filter(x=>x.exerciseName===name).sort((a,b)=>b.timestamp.localeCompare(a.timestamp))}
function latestWeight(name){const x=recentLogs(name).find(x=>Number.isFinite(x.weight));return x?x.weight:''}
function latestSet(name){return recentLogs(name)[0]||null}
function dayDraftKey(day,exId,setNo){return `${isoDate()}|${day}|${exId}|${setNo}`}
function formatDateLong(dateStr){const d=new Date(`${dateStr}T12:00:00`);return d.toLocaleDateString(undefined,{weekday:'short',day:'numeric',month:'short',year:'numeric'})}
function formatNumber(n){return new Intl.NumberFormat(undefined,{maximumFractionDigits:1}).format(n||0)}
function sessionSets(session){if(Array.isArray(session.sets))return session.sets;return state.setLogs.filter(x=>x.date===session.date&&x.workoutDay===session.workoutDay)}
function sessionStats(session){const logs=sessionSets(session);const totalReps=logs.reduce((sum,x)=>sum+(Number(x.reps)||0),0);const volume=logs.reduce((sum,x)=>sum+((Number(x.weight)||0)*(Number(x.reps)||0)),0);const exerciseCount=new Set(logs.map(x=>x.exerciseName)).size;return {logs,totalReps,volume,exerciseCount,setCount:logs.length}}

function showView(id){currentView=id;document.querySelectorAll('.view').forEach(v=>v.classList.toggle('active',v.id===id));document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active',b.dataset.view===id));render()}
function render(){if(currentView==='trainView')renderTrain();if(currentView==='foodView')renderFood();if(currentView==='progressView')renderProgress()}

function renderTrain(){
 const root=document.getElementById('trainView');
 const sched=scheduledDay();
 const chosen=state.workoutSelection?.[isoDate()]||sched;
 const title=workoutTitles[selectedDay]||'Workout';
 let html=`<div class="day-tabs">${DAYS.map(d=>`<button class="day-tab ${d===selectedDay?'active':''}" data-day="${d}">${dayShort[d]}</button>`).join('')}</div>`;
 html+=`<div class="hero"><div class="row between"><div><div class="eyebrow">${escapeHtml(selectedDay.toUpperCase())}</div><h2>${escapeHtml(title)}</h2><div class="muted">${selectedDay===sched?'Scheduled for today':selectedDay===chosen?`Switched from ${sched}'s scheduled workout.`:`Today is ${sched}. Tap below to switch.`}</div></div><button class="secondary" id="editToggle">${editMode?'Done':'Edit'}</button></div>${selectedDay!==chosen?`<button class="primary wide" id="useSelectedBtn">Do ${escapeHtml(selectedDay)} Workout Today</button>`:''}</div>`;
 const exercises=state.program[selectedDay].filter(e=>e.active).sort((a,b)=>a.order-b.order);
 html+=exercises.map((ex,idx)=>exerciseCard(ex,idx)).join('');
 html+=`<button class="secondary wide" id="addExerciseBtn">+ Add Exercise</button><button class="primary wide" id="finishWorkoutBtn">Finish Workout</button>`;
 root.innerHTML=html;
 root.querySelectorAll('.day-tab').forEach(b=>b.onclick=()=>{selectedDay=b.dataset.day;editMode=false;renderTrain()});
 const useBtn=root.querySelector('#useSelectedBtn');if(useBtn)useBtn.onclick=async()=>{state.workoutSelection=state.workoutSelection||{};state.workoutSelection[isoDate()]=selectedDay;await saveState();toast(`${selectedDay} selected for today`);renderTrain()};
 root.querySelector('#editToggle').onclick=()=>{editMode=!editMode;renderTrain()};
 root.querySelector('#addExerciseBtn').onclick=addExerciseFlow;
 root.querySelector('#finishWorkoutBtn').onclick=finishWorkout;
 root.querySelectorAll('.check-set').forEach(b=>b.onclick=()=>saveSetFromRow(b));
 root.querySelectorAll('.set-input').forEach(i=>i.onchange=()=>saveDraftFromInput(i));
 root.querySelectorAll('[data-move]').forEach(b=>b.onclick=()=>moveExercise(b.dataset.id,Number(b.dataset.move)));
 root.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>removeExercise(b.dataset.remove));
 root.querySelectorAll('[data-sets-delta]').forEach(b=>b.onclick=()=>adjustExerciseSets(b.dataset.id,Number(b.dataset.setsDelta)));
 root.querySelectorAll('[data-edit-details]').forEach(b=>b.onclick=()=>editExerciseDetails(b.dataset.editDetails));
}
function exerciseCard(ex,idx){
 const last=latestSet(ex.name);const prev=last?`Previous: ${last.weight??'—'} kg × ${last.reps??'—'} reps`:'No previous log yet';
 let sets='';
 for(let s=1;s<=ex.sets;s++){
  const key=dayDraftKey(selectedDay,ex.id,s);const draft=state.draftSets[key]||{};const logged=state.setLogs.find(x=>x.date===isoDate()&&x.workoutDay===selectedDay&&x.exerciseId===ex.id&&x.setNumber===s);
  const prior=latestWeight(ex.name);const weight=draft.weight ?? logged?.weight ?? (prior!==''?prior:suggestedWeightForSet(ex,s));
  const reps=draft.reps ?? logged?.reps ?? '';
  sets+=`<div class="set-grid"><div class="set-num">${s}</div><input class="set-input" data-key="${key}" data-field="weight" inputmode="decimal" type="number" step="0.5" value="${weight??''}" aria-label="Set ${s} weight"><input class="set-input" data-key="${key}" data-field="reps" inputmode="numeric" type="number" step="1" value="${reps??''}" aria-label="Set ${s} reps"><button class="check-set ${logged?'done':''}" data-id="${ex.id}" data-set="${s}">${logged?'✓':'○'}</button></div>`;
 }
 const editTools=editMode?`<div class="edit-tools"><button class="mini" data-id="${ex.id}" data-move="-1">↑</button><button class="mini" data-id="${ex.id}" data-move="1">↓</button><button class="mini" data-edit-details="${ex.id}">Edit details</button><button class="mini remove" data-remove="${ex.id}">Remove</button></div>`:'';
 return `<div class="exercise-card"><div class="exercise-head"><div class="exercise-main"><div class="exercise-title">${escapeHtml(ex.name)}</div><div class="target">${escapeHtml(ex.reps)} · ${escapeHtml(ex.suggested)}</div></div><div class="set-count-control" aria-label="Change number of sets"><button class="set-count-btn" data-id="${ex.id}" data-sets-delta="-1" aria-label="Remove one set">−</button><span><strong>${ex.sets}</strong><small>SETS</small></span><button class="set-count-btn" data-id="${ex.id}" data-sets-delta="1" aria-label="Add one set">+</button></div></div>${editTools}<div class="previous">${escapeHtml(prev)}</div>${ex.notes?`<div class="small muted" style="margin-bottom:10px">${escapeHtml(ex.notes)}</div>`:''}<div class="set-grid set-head"><div>SET</div><div>KG</div><div>REPS</div><div>DONE</div></div>${sets}</div>`
}
async function saveDraftFromInput(input){const key=input.dataset.key;state.draftSets[key]=state.draftSets[key]||{};state.draftSets[key][input.dataset.field]=input.value===''?'':Number(input.value);await saveState()}
async function saveSetFromRow(btn){const ex=state.program[selectedDay].find(e=>e.id===btn.dataset.id);const setNo=Number(btn.dataset.set);const key=dayDraftKey(selectedDay,ex.id,setNo);const row=btn.parentElement;const inputs=row.querySelectorAll('input');const weight=inputs[0].value===''?null:Number(inputs[0].value);const reps=inputs[1].value===''?null:Number(inputs[1].value);const existingIndex=state.setLogs.findIndex(x=>x.date===isoDate()&&x.workoutDay===selectedDay&&x.exerciseId===ex.id&&x.setNumber===setNo);if(existingIndex>=0){state.setLogs.splice(existingIndex,1);btn.classList.remove('done');btn.textContent='○';toast('Set removed');}else{state.setLogs.push({id:crypto.randomUUID(),date:isoDate(),timestamp:new Date().toISOString(),workoutDay:selectedDay,exerciseId:ex.id,exerciseName:ex.name,setNumber:setNo,weight,reps});btn.classList.add('done');btn.textContent='✓';toast('Set saved');}await saveState()}
async function finishWorkout(){
 const today=isoDate();
 const logs=state.setLogs.filter(x=>x.date===today&&x.workoutDay===selectedDay).sort((a,b)=>a.timestamp.localeCompare(b.timestamp));
 if(!logs.length){toast('Log at least one set first');return}
 const firstTime=logs[0]?.timestamp?new Date(logs[0].timestamp).getTime():Date.now();
 const durationMinutes=Math.max(1,Math.round((Date.now()-firstTime)/60000));
 const session={id:crypto.randomUUID(),date:today,timestamp:new Date().toISOString(),workoutDay:selectedDay,workoutTitle:workoutTitles[selectedDay]||'Workout',setCount:logs.length,durationMinutes,sets:logs.map(x=>({...x}))};
 state.sessions.push(session);
 await saveState();
 toast(`${selectedDay} workout saved`);
 showWorkoutReport(session.id);
}
async function adjustExerciseSets(id,delta){
 const ex=state.program[selectedDay].find(e=>e.id===id);if(!ex)return;
 const next=Math.max(1,ex.sets+delta);if(next===ex.sets)return;
 if(next<ex.sets){
  const todayLogs=state.setLogs.filter(x=>x.date===isoDate()&&x.workoutDay===selectedDay&&x.exerciseId===id);
  const highest=todayLogs.reduce((m,x)=>Math.max(m,Number(x.setNumber)||0),0);
  if(highest>next){toast(`Set ${highest} is already logged. Remove it first.`);return}
 }
 ex.sets=next;await saveState();renderTrain();toast(`${ex.name}: ${ex.sets} sets`)
}
async function editExerciseDetails(id){
 const ex=state.program[selectedDay].find(e=>e.id===id);if(!ex)return;
 const reps=prompt('Target reps / time',ex.reps);if(reps===null)return;
 const suggested=prompt('Suggested weight',ex.suggested);if(suggested===null)return;
 const notes=prompt('Notes',ex.notes||'');if(notes===null)return;
 ex.reps=reps||ex.reps;ex.suggested=suggested;ex.notes=notes;await saveState();renderTrain();toast('Exercise updated')
}
async function moveExercise(id,delta){const arr=state.program[selectedDay].filter(e=>e.active).sort((a,b)=>a.order-b.order);const i=arr.findIndex(e=>e.id===id),j=i+delta;if(i<0||j<0||j>=arr.length)return;const a=arr[i],b=arr[j];[a.order,b.order]=[b.order,a.order];await saveState();renderTrain()}
async function removeExercise(id){const ex=state.program[selectedDay].find(e=>e.id===id);if(!ex)return;if(!confirm(`Remove ${ex.name} from ${selectedDay}? Your old logs will be kept.`))return;ex.active=false;await saveState();renderTrain()}
async function addExerciseFlow(){const name=prompt('Exercise name');if(!name)return;const sets=Math.max(1,Number(prompt('How many sets?','3'))||3);const reps=prompt('Target reps','8–12')||'8–12';const suggested=prompt('Suggested starting weight','')||'';const maxOrder=Math.max(0,...state.program[selectedDay].map(e=>e.order||0));state.program[selectedDay].push({id:crypto.randomUUID(),name,sets,reps,suggested,notes:'',order:maxOrder+1,active:true});await saveState();renderTrain();toast('Exercise added')}

function renderFood(){
 const root=document.getElementById('foodView');const date=isoDate();const logs=state.foodLogs.filter(x=>x.date===date);const cals=logs.reduce((a,b)=>a+(Number(b.calories)||0),0);const protein=logs.reduce((a,b)=>a+(Number(b.protein)||0),0);const pct=Math.min(100,(cals/state.settings.calorieTarget)*100||0);
 root.innerHTML=`<div class="hero"><div class="eyebrow">TODAY</div><h2>${cals.toLocaleString()} / ${state.settings.calorieTarget.toLocaleString()} kcal</h2><div class="calorie-bar"><div class="calorie-fill" style="width:${pct}%"></div></div><div class="muted">${Math.max(0,state.settings.calorieTarget-cals).toLocaleString()} kcal remaining · ${protein} g protein</div></div>
 <div class="card"><div class="section-title" style="margin-top:0"><h2>Quick log</h2></div><div class="form-grid"><input id="foodName" class="full" placeholder="Food / meal"><input id="foodCalories" type="number" inputmode="numeric" placeholder="Calories"><input id="foodProtein" type="number" inputmode="decimal" placeholder="Protein g"><button class="primary full" id="addFood">Add food</button></div></div>
 <div class="section-title"><h2>Today</h2><button class="ghost" id="editTargets">Targets</button></div><div class="card">${logs.length?logs.map(x=>`<div class="food-item"><div><strong>${escapeHtml(x.item)}</strong><div class="small muted">${x.protein||0} g protein</div></div><div class="row"><strong>${x.calories} kcal</strong><button class="mini remove" data-food-remove="${x.id}">×</button></div></div>`).join(''):'<div class="muted">Nothing logged yet.</div>'}</div>`;
 root.querySelector('#addFood').onclick=addFood;root.querySelector('#editTargets').onclick=editTargets;root.querySelectorAll('[data-food-remove]').forEach(b=>b.onclick=()=>removeFood(b.dataset.foodRemove));
}
async function addFood(){const item=document.getElementById('foodName').value.trim();const calories=Number(document.getElementById('foodCalories').value);const protein=Number(document.getElementById('foodProtein').value)||0;if(!item||!calories){toast('Add food and calories');return}state.foodLogs.push({id:crypto.randomUUID(),date:isoDate(),timestamp:new Date().toISOString(),item,calories,protein});await saveState();renderFood();toast('Food logged')}
async function removeFood(id){state.foodLogs=state.foodLogs.filter(x=>x.id!==id);await saveState();renderFood()}
async function editTargets(){const c=Number(prompt('Daily calorie target',state.settings.calorieTarget));if(c>0)state.settings.calorieTarget=c;const p=Number(prompt('Daily protein target (g)',state.settings.proteinTarget));if(p>0)state.settings.proteinTarget=p;await saveState();renderFood()}

function renderProgress(){
 const root=document.getElementById('progressView');const names=[...new Set(Object.values(state.program).flat().filter(x=>x.active).map(x=>x.name))].sort();const selected=root.dataset.exercise||names[0]||'';root.dataset.exercise=selected;const logs=recentLogs(selected);const last=logs[0];const best=logs.filter(x=>Number.isFinite(x.weight)).sort((a,b)=>(b.weight-a.weight)||((b.reps||0)-(a.reps||0)))[0];const bench=selected==='Flat Barbell Bench Press';const benchPct=bench&&best?.weight?Math.min(100,(best.weight/90)*100):0;
 const sessions=[...(state.sessions||[])].sort((a,b)=>String(b.timestamp).localeCompare(String(a.timestamp))).slice(0,12);
 root.innerHTML=`<div class="hero"><div class="eyebrow">PROGRESS</div><h2>${escapeHtml(selected||'No exercise')}</h2><select id="progressExercise" style="margin-top:10px">${names.map(n=>`<option ${n===selected?'selected':''}>${escapeHtml(n)}</option>`).join('')}</select></div>
 <div class="metric-row"><div class="metric-card"><div class="muted small">LAST</div><div class="metric">${last?`${last.weight??'—'} kg`: '—'}</div><div class="small muted">${last?`${last.reps??'—'} reps`:'No data'}</div></div><div class="metric-card"><div class="muted small">BEST</div><div class="metric">${best?`${best.weight??'—'} kg`:'—'}</div><div class="small muted">${best?`${best.reps??'—'} reps`:'No data'}</div></div></div>
 ${bench?`<div class="card"><div class="row between"><strong>90 kg bench goal</strong><strong>${Math.round(benchPct)}%</strong></div><div class="progress-track" style="margin-top:10px"><div class="progress-fill" style="width:${benchPct}%"></div></div></div>`:''}
 <div class="section-title"><h2>Completed workouts</h2></div><div class="card">${sessions.length?sessions.map(x=>{const stats=sessionStats(x);return `<div class="session-item"><div><strong>${escapeHtml(x.workoutDay)} · ${escapeHtml(x.workoutTitle||workoutTitles[x.workoutDay]||'Workout')}</strong><div class="small muted">${formatDateLong(x.date)} · ${stats.setCount} sets${x.durationMinutes?` · ${x.durationMinutes} min`:''}</div></div><button class="mini" data-report-session="${x.id}">View report</button></div>`}).join(''):'<div class="muted">Finish a workout to create your first report.</div>'}</div>
 <div class="section-title"><h2>Recent sets</h2></div><div class="card">${logs.length?logs.slice(0,25).map(x=>`<div class="history-item"><div>${x.date} · Set ${x.setNumber}</div><strong>${x.weight??'—'} kg × ${x.reps??'—'}</strong></div>`).join(''):'<div class="muted">No sets logged yet.</div>'}</div>`;
 root.querySelector('#progressExercise').onchange=e=>{root.dataset.exercise=e.target.value;renderProgress()};
 root.querySelectorAll('[data-report-session]').forEach(b=>b.onclick=()=>showWorkoutReport(b.dataset.reportSession));
}

function workoutReportHtml(session){
 const stats=sessionStats(session);const logs=stats.logs;
 const order=[];const grouped={};
 logs.forEach(x=>{if(!grouped[x.exerciseName]){grouped[x.exerciseName]=[];order.push(x.exerciseName)}grouped[x.exerciseName].push(x)});
 const exercises=order.map(name=>`<section class="report-exercise"><div class="report-exercise-title">${escapeHtml(name)}</div><div class="report-sets">${grouped[name].sort((a,b)=>a.setNumber-b.setNumber).map(x=>`<span>Set ${x.setNumber}: <strong>${x.weight??'—'} kg × ${x.reps??'—'}</strong></span>`).join('')}</div></section>`).join('');
 return `<article class="workout-report"><header class="report-header"><div><div class="report-brand">BEARFIT</div><div class="report-kicker">WORKOUT REPORT</div></div><div class="report-date">${escapeHtml(formatDateLong(session.date))}</div></header><div class="report-title-block"><h1>${escapeHtml(session.workoutDay)} — ${escapeHtml(session.workoutTitle||workoutTitles[session.workoutDay]||'Workout')}</h1>${session.durationMinutes?`<div>${session.durationMinutes} min session</div>`:''}</div><div class="report-metrics"><div><span>SETS</span><strong>${stats.setCount}</strong></div><div><span>REPS</span><strong>${stats.totalReps}</strong></div><div><span>VOLUME</span><strong>${formatNumber(stats.volume)} kg</strong></div><div><span>EXERCISES</span><strong>${stats.exerciseCount}</strong></div></div><div class="report-list">${exercises||'<p>No sets logged.</p>'}</div><footer class="report-footer">Generated by BearFit Local · ${new Date(session.timestamp||Date.now()).toLocaleString()}</footer></article>`
}
function reportShareText(session){
 const stats=sessionStats(session);const lines=[`BEARFIT — ${session.workoutDay} ${session.workoutTitle||workoutTitles[session.workoutDay]||'Workout'}`,formatDateLong(session.date),`${stats.setCount} sets · ${stats.totalReps} reps · ${formatNumber(stats.volume)} kg volume`,''];
 const grouped={};stats.logs.forEach(x=>{(grouped[x.exerciseName]??=[]).push(x)});Object.entries(grouped).forEach(([name,sets])=>lines.push(`${name}: ${sets.sort((a,b)=>a.setNumber-b.setNumber).map(x=>`${x.weight??'—'}kg×${x.reps??'—'}`).join(' | ')}`));return lines.join('\n')
}
function showWorkoutReport(sessionId){const session=(state.sessions||[]).find(x=>x.id===sessionId);if(!session){toast('Report not found');return}const dialog=document.getElementById('reportDialog');dialog.dataset.sessionId=session.id;document.getElementById('workoutReport').innerHTML=workoutReportHtml(session);dialog.showModal()}
async function shareCurrentReport(){const id=document.getElementById('reportDialog').dataset.sessionId;const session=(state.sessions||[]).find(x=>x.id===id);if(!session)return;const text=reportShareText(session);try{if(navigator.share){await navigator.share({title:`BearFit ${session.workoutDay} workout`,text});}else{await navigator.clipboard.writeText(text);toast('Report copied to clipboard')}}catch(e){if(e?.name!=='AbortError'){try{await navigator.clipboard.writeText(text);toast('Report copied to clipboard')}catch{}}}}
function printCurrentReport(){window.print()}

function download(name,text,type='application/json'){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text],{type}));a.download=name;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
function csvEscape(v){const s=String(v??'');return /[",\n]/.test(s)?`"${s.replace(/"/g,'""')}"`:s}
function exportJson(){download(`BearFit-backup-${isoDate()}.json`,JSON.stringify(state,null,2));toast('Backup exported')}
function exportCsv(){const rows=[['Date','Workout Day','Exercise','Set','Weight kg','Reps']];[...state.setLogs].sort((a,b)=>a.timestamp.localeCompare(b.timestamp)).forEach(x=>rows.push([x.date,x.workoutDay,x.exerciseName,x.setNumber,x.weight,x.reps]));download(`BearFit-training-${isoDate()}.csv`,rows.map(r=>r.map(csvEscape).join(',')).join('\n'),'text/csv');toast('CSV exported')}
async function importJson(file){try{const parsed=JSON.parse(await file.text());if(!parsed.program||!parsed.setLogs)throw new Error('Invalid backup');state=parsed;await saveState();render();toast('Backup restored')}catch(e){alert('Could not import this BearFit backup.')}}
async function resetAll(){if(!confirm('Reset all BearFit data on this device? Export a backup first if you want to keep your history.'))return;state=defaultState();await saveState();selectedDay=scheduledDay();render();document.getElementById('backupDialog').close();toast('BearFit reset')}

async function init(){
 state=await loadState();state.workoutSelection=state.workoutSelection||{};selectedDay=state.workoutSelection[isoDate()]||scheduledDay();
 document.querySelectorAll('.nav-btn').forEach(b=>b.onclick=()=>showView(b.dataset.view));
 const dialog=document.getElementById('backupDialog');document.getElementById('backupBtn').onclick=()=>dialog.showModal();document.getElementById('exportJsonBtn').onclick=exportJson;document.getElementById('exportCsvBtn').onclick=exportCsv;document.getElementById('importJsonInput').onchange=e=>e.target.files[0]&&importJson(e.target.files[0]);document.getElementById('resetBtn').onclick=resetAll;
 const reportDialog=document.getElementById('reportDialog');document.getElementById('shareReportBtn').onclick=shareCurrentReport;document.getElementById('printReportBtn').onclick=printCurrentReport;document.getElementById('closeReportBtn').onclick=()=>reportDialog.close();
 if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
 render();
}
init();
