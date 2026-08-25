
// --- Audit Log / Change History ---
const auditLog=[];
let auditSequence=1;
function addAudit(student,action,details,staff='Admin'){auditLog.unshift({id:auditSequence++,timestamp:new Date(),student,action,details,staff});renderAudit();if(editingStudent===student)renderStudentActivity(student);}
function auditDateKey(d){const y=d.getFullYear(),m=String(d.getMonth()+1).padStart(2,'0'),day=String(d.getDate()).padStart(2,'0');return `${y}-${m}-${day}`;}
function formatAuditDate(d){return d.toLocaleString('en-AU',{day:'numeric',month:'short',year:'numeric',hour:'numeric',minute:'2-digit'});}
function renderAudit(){if(!$('auditRows'))return;const q=$('auditStudent').value.toLowerCase().trim(),a=$('auditAction').value,date=$('auditDate').value,staff=$('auditStaff').value;const rows=auditLog.filter(x=>(!q||x.student.toLowerCase().includes(q))&&(a==='All'||x.action===a)&&(!date||auditDateKey(x.timestamp)===date)&&(staff==='All'||x.staff===staff));$('auditRows').innerHTML=rows.map(x=>`<tr><td>${formatAuditDate(x.timestamp)}</td><td><b>${x.student}</b></td><td><span class="audit-action">${x.action}</span></td><td>${x.details}</td><td>${x.staff}</td></tr>`).join('');$('auditEmpty').style.display=rows.length?'none':'block';}
function renderStudentActivity(name){if(!$('studentActivity'))return;const rows=auditLog.filter(x=>x.student===name).slice(0,8);$('studentActivity').innerHTML=rows.length?rows.map(x=>`<div class="activity-item"><div><b>${x.action}</b><span>${x.details}</span></div><small>${formatAuditDate(x.timestamp)} · ${x.staff}</small></div>`).join(''):'<span class="muted">No recorded activity.</span>'; }
const caps={'English':28,'All Math':41,'Interactive':5};
const mathSections=['3A–A Math','B–D Math','E+ Math'];
const sectionNames=['English',...mathSections,'Interactive'];
const $=id=>document.getElementById(id);
const centreTimes={
  Monday:['3:45 pm','4:30 pm','5:15 pm','6:00 pm'],
  Tuesday:['3:45 pm'],
  Thursday:['3:45 pm','4:30 pm','5:15 pm','6:00 pm'],
  Friday:['3:45 pm']
};
// Interactive students can have a second 20-minute subject inside a 45-minute centre timeslot.
// These raw Excel times are grouped under the main centre timeslot in the dashboard.
const rawTimesBySlot={
  '3:45 pm':['3:45 pm','4:10 pm','4:15 pm'],
  '4:30 pm':['4:30 pm','4:50 pm'],
  '5:15 pm':['5:15 pm','5:35 pm'],
  '6:00 pm':['6:00 pm','6:20 pm']
};
const timeMatches=(studentTime,selectedTime)=>selectedTime==='All'||(rawTimesBySlot[selectedTime]||[selectedTime]).includes(studentTime);
const validSlotForDay=(day,time)=>time==='All'||(centreTimes[day]||[]).includes(time);
function updateTimeOptions(){
  const day=$('day').value;
  const current=$('time').value;
  const allowed=day==='All'?['3:45 pm','4:30 pm','5:15 pm','6:00 pm']:centreTimes[day];
  $('time').innerHTML='<option value="All">All timeslots</option>'+allowed.map(t=>`<option>${t}</option>`).join('');
  $('time').value=allowed.includes(current)||current==='All'?current:'All';
}
const unique=(arr,key)=>[...new Map(arr.map(x=>[key(x),x])).values()];
const badgeClass=status=>status==='New'?'new-b':status==='Temporary Absence'?'absence-b':status==='Free Trial'?'trial-b':status==='Extended Absence'?'extended-b':'active-b';
function getRows(includeSearch=true){
  const d=$('day').value,t=$('time').value,s=$('section').value,status=$('status').value,q=includeSearch?$('search').value.toLowerCase().trim():'';
  const listStatus=includeSearch?$('listStatus').value:'All';
  const dashboardStatusMatch=x=>status==='All'||(status==='Attending'?!['Temporary Absence','Extended Absence'].includes(x.status):x.status===status);
  const listStatusMatch=x=>listStatus==='All'||x.status===listStatus;
  return students.filter(x=>!x.released&&(d==='All'||x.day===d)&&timeMatches(x.time,t)&&(s==='All'||x.section===s)&&dashboardStatusMatch(x)&&listStatusMatch(x)&&(!q||x.name.toLowerCase().includes(q)));
}
function filteredSchedule(){return getRows(false)}
function capacityForScope(rows){
  const d=$('day').value,t=$('time').value,s=$('section').value;
  const days=d==='All'?['Monday','Tuesday','Thursday','Friday']:[d];
  const times=t==='All'?['3:45 pm','4:30 pm','5:15 pm','6:00 pm']:[t];
  let cap=0;
  for(const day of days) for(const time of times){
    if(!validSlotForDay(day,time)) continue;
    if(s==='All'){
      cap += caps.English + caps['All Math'] + caps.Interactive;
    } else if(mathSections.includes(s)){
      cap += caps['All Math']; // All three Math sections share the same 41-seat pool
    } else {
      cap += caps[s]||0;
    }
  }
  return cap;
}
function occupiedForAvailability(schedule){
  const s=$('section').value;
  if(mathSections.includes(s)){
    // When a Math subsection is selected, availability must include every Math student
    // in the same selected day/time scope because the 41 seats are shared.
    const d=$('day').value,t=$('time').value,status=$('status').value;
    const statusMatch=x=>status==='All'||(status==='Attending'?!['Temporary Absence','Extended Absence'].includes(x.status):x.status===status);
    return students.filter(x=>!x.released&&(d==='All'||x.day===d)&&timeMatches(x.time,t)&&mathSections.includes(x.section)&&statusMatch(x)).length;
  }
  return schedule.length;
}

function occupiedMathForScope(){
  const d=$('day').value,t=$('time').value,status=$('status').value;
  const statusMatch=x=>status==='All'||(status==='Attending'?!['Temporary Absence','Extended Absence'].includes(x.status):x.status===status);
  return students.filter(x=>!x.released&&(d==='All'||x.day===d)&&timeMatches(x.time,t)&&mathSections.includes(x.section)&&statusMatch(x)).length;
}
function render(){
  const d=$('day').value,t=$('time').value,s=$('section').value,status=$('status').value;
  const displayed=getRows(true), schedule=filteredSchedule();
  $('scope').textContent=`Showing: ${d==='All'?'all days':d} · ${t==='All'?'all times':t} · ${s==='All'?'all sections':s} · ${status==='All'?'all students':status}`;
  $('occScope').textContent=`${d==='All'?'All days':d} · ${t==='All'?'All times':t}`;
  $('total').textContent=new Set(schedule.map(x=>x.name)).size;
  $('attending').textContent=new Set(schedule.filter(x=>!['Temporary Absence','Extended Absence'].includes(x.status)).map(x=>x.name)).size;
  $('available').textContent=Math.max(0,capacityForScope(schedule)-occupiedForAvailability(schedule)); // Temporary Absence still occupies/reserves its place
  $('newCount').textContent=new Set(schedule.filter(x=>x.status==='New').map(x=>x.name)).size;
  $('trialCount').textContent=schedule.filter(x=>x.status==='Free Trial').length;
  const days=d==='All'?['Monday','Tuesday','Thursday','Friday']:[d];
  const times=t==='All'?['3:45 pm','4:30 pm','5:15 pm','6:00 pm']:[t];
  let validCombos=0;
  for(const day of days) for(const time of times) if(validSlotForDay(day,time)) validCombos++;
  validCombos=Math.max(1,validCombos);

  function occupancyData(sec){
    const occ=schedule.filter(x=>x.section===sec).length;
    const cap=(caps[sec]||0)*validCombos;
    const av=Math.max(0,cap-occ);
    const pct=cap?Math.min(100,Math.round(occ/cap*100)):0;
    return {occ,cap,av,pct};
  }

  function mainOccRow(sec,label=sec){
    const {occ,cap,av,pct}=occupancyData(sec);
    return `<div class="capacity-row">
      <div class="capacity-name"><b>${label}</b></div>
      <div class="capacity-bar"><div class="fill" style="width:${pct}%"></div></div>
      <div class="capacity-breakdown"></div>
      <div class="capacity-total"><b>${occ} / ${cap}</b><span>${av} available</span></div>
    </div>`;
  }

  function mathBlock(){
    const mathOcc=occupiedMathForScope();
    const mathCap=caps['All Math']*validCombos;
    const mathAv=Math.max(0,mathCap-mathOcc);
    const mathPct=mathCap?Math.min(100,Math.round(mathOcc/mathCap*100)):0;
    const selected=$('section').value;
    const details=mathSections.map(sec=>{
      // Counts respect the selected dashboard filters, but Math capacity remains shared.
      const count=students.filter(x=>{
        if(x.released)return false;
        const dayOk=d==='All'||x.day===d;
        const timeOk=timeMatches(x.time,t);
        const statusOk=status==='All'||(status==='Attending'?!['Temporary Absence','Extended Absence'].includes(x.status):x.status===status);
        return dayOk&&timeOk&&statusOk&&x.section===sec;
      }).length;
      const selectedClass=selected===sec?' selected-math-detail':'';
      return `<div class="math-detail${selectedClass}"><span>${sec}</span><strong>${count}</strong></div>`;
    }).join('');
    return `<div class="math-capacity-block">
      <div class="capacity-row math-main-row">
        <div class="capacity-name"><b>Math</b><small>Shared capacity</small></div>
        <div class="capacity-bar"><div class="fill" style="width:${mathPct}%"></div></div>
        <div class="capacity-breakdown"></div>
        <div class="capacity-total"><b>${mathOcc} / ${mathCap}</b><span>${mathAv} available</span></div>
      </div>
      <div class="math-details">${details}</div>
    </div>`;
  }

  let occupancyHtml='';
  if(s==='All'){
    occupancyHtml=mainOccRow('English')+mathBlock()+mainOccRow('Interactive');
  } else if(mathSections.includes(s)){
    occupancyHtml=mathBlock();
  } else {
    occupancyHtml=mainOccRow(s);
  }
  $('occRows').innerHTML=occupancyHtml;
  $('rows').innerHTML=displayed.map(x=>`<tr><td><b>${x.name}</b></td><td><span class="badge ${badgeClass(x.status)}">${x.status}</span></td><td>${x.day}</td><td>${x.time}</td><td>${x.section}</td><td><button class="view-student" data-student="${encodeURIComponent(x.name)}">View</button></td></tr>`).join('');
  $('empty').style.display=displayed.length?'none':'block';
}
$('day').addEventListener('change',()=>{updateTimeOptions();render()});
['time','section','status','listStatus'].forEach(id=>$(id).addEventListener('change',render));
$('search').addEventListener('input',render);
$('reset').addEventListener('click',()=>{$('day').value='All';updateTimeOptions();$('time').value=$('section').value=$('status').value=$('listStatus').value='All';$('search').value='';render()});
$('print').addEventListener('click',()=>window.print());
updateTimeOptions();
render();

function openStudentProfile(name){
  const entries=students.filter(x=>x.name===name);
  if(!entries.length)return;
  const priority=['Temporary Absence','Free Trial','New','Active'];
  const status=priority.find(st=>entries.some(x=>x.status===st))||entries[0].status;
  $('profileName').textContent=name;
  $('profileStatus').textContent=status;
  $('profileStatus').className='badge '+badgeClass(status);
  $('profileEntries').textContent=`${entries.length} schedule ${entries.length===1?'entry':'entries'}`;
  const dayOrder={Monday:1,Tuesday:2,Thursday:3,Friday:4};
  const slotOrder={'3:45 pm':1,'4:10 pm':2,'4:15 pm':3,'4:30 pm':4,'4:50 pm':5,'5:15 pm':6,'5:35 pm':7,'6:00 pm':8,'6:20 pm':9};
  $('profileSchedule').innerHTML=[...entries].sort((a,b)=>(dayOrder[a.day]||9)-(dayOrder[b.day]||9)||(slotOrder[a.time]||99)-(slotOrder[b.time]||99)||a.section.localeCompare(b.section)).map(x=>`<tr><td>${x.day}</td><td>${x.time}</td><td>${x.section}</td><td><span class="badge ${badgeClass(x.status)}">${x.status}</span></td></tr>`).join('');
  $('studentProfile').classList.add('open');
  $('studentProfile').setAttribute('aria-hidden','false');
}
function closeStudentProfile(){ $('studentProfile').classList.remove('open'); $('studentProfile').setAttribute('aria-hidden','true'); }
$('rows').addEventListener('click',e=>{const btn=e.target.closest('.view-student');if(btn)openStudentProfile(decodeURIComponent(btn.dataset.student));});
$('closeProfile').addEventListener('click',closeStudentProfile);
$('studentProfile').addEventListener('click',e=>{if(e.target===$('studentProfile'))closeStudentProfile();});
document.addEventListener('keydown',e=>{if(e.key==='Escape')closeStudentProfile();});

// --- Phase 1: dynamic student allocation editor ---
const waitlist=[];
let editingStudent=null;
let lastMoveCheck=null;
const mainSlotForRaw=time=>Object.entries(rawTimesBySlot).find(([,raw])=>raw.includes(time))?.[0]||time;
function studentVisits(name){
  const map=new Map();
  students.filter(x=>x.name===name).forEach(x=>{
    const slot=mainSlotForRaw(x.time), key=`${x.day}|${slot}`;
    if(!map.has(key)) map.set(key,{key,day:x.day,time:slot,entries:[]});
    map.get(key).entries.push(x);
  });
  return [...map.values()];
}
function fillEditTimes(){
  const day=$('editDay').value;
  $('editTime').innerHTML=(centreTimes[day]||[]).map(t=>`<option>${t}</option>`).join('');
}
function loadVisitEditor(name){
  editingStudent=name; lastMoveCheck=null;
  const visits=studentVisits(name);
  $('editVisit').innerHTML=visits.map(v=>`<option value="${v.key}">${v.day} · ${v.time} · ${v.entries.map(e=>e.section).join(' + ')}</option>`).join('');
  const first=visits[0];
  if(first){$('editDay').value=first.day;fillEditTimes();$('editTime').value=first.time;}
  $('capacityCheck').innerHTML=''; $('confirmMove').disabled=true; $('addWaitlist').disabled=true;
}
function selectedVisit(){return studentVisits(editingStudent).find(v=>v.key===$('editVisit').value);}
function requiredPools(entries){
  const pools=[];
  if(entries.some(e=>e.section==='English')) pools.push({name:'English',cap:caps.English,test:e=>e.section==='English'});
  if(entries.some(e=>mathSections.includes(e.section))) pools.push({name:'Math',cap:caps['All Math'],test:e=>mathSections.includes(e.section)});
  if(entries.some(e=>e.section==='Interactive')) pools.push({name:'Interactive',cap:caps.Interactive,test:e=>e.section==='Interactive'});
  return pools;
}
function checkAllocation(){
  const visit=selectedVisit(); if(!visit)return;
  const targetDay=$('editDay').value,targetTime=$('editTime').value;
  const moving=new Set(visit.entries);
  const pools=requiredPools(visit.entries);
  const results=pools.map(pool=>{
    // Reserved temporary-absence places count as occupied. Remove the student's current visit from the calculation first.
    const occupied=students.filter(e=>!e.released&&!moving.has(e)&&e.day===targetDay&&timeMatches(e.time,targetTime)&&pool.test(e)).length;
    const needed=visit.entries.filter(pool.test).length;
    const after=occupied+needed;
    return {...pool,occupied,needed,after,ok:after<=pool.cap};
  });
  const ok=results.every(r=>r.ok);
  lastMoveCheck={visit,targetDay,targetTime,results,ok};
  $('capacityCheck').innerHTML=results.map(r=>`<div class="check-row"><span>${r.name}${r.name==='Math'?' (shared)':''}</span><strong>${r.after} / ${r.cap}</strong><span class="${r.ok?'check-ok':'check-full'}">${r.ok?'Available':'Full'}</span></div>`).join('')+`<div class="check-summary ${ok?'ok':'full'}">${ok?'This student can be moved.':'This allocation cannot fit in the selected timeslot.'}</div>`;
  $('confirmMove').disabled=!ok;
  $('addWaitlist').disabled=ok;
}
function applyMove(){
  if(!lastMoveCheck?.ok)return;
  const {visit,targetDay,targetTime}=lastMoveCheck;
  const oldAllocation=`${visit.day} ${visit.time}`;
  visit.entries.forEach(e=>{e.day=targetDay;e.time=targetTime;});
  addAudit(editingStudent,'Allocation Changed',`${oldAllocation} → ${targetDay} ${targetTime} · ${visit.entries.map(e=>e.section).join(' + ')}`);
  render(); openStudentProfile(editingStudent);
  $('moveMessage').textContent=`Allocation moved to ${targetDay} at ${targetTime}. Dashboard counts have been updated.`;
}
function addCurrentToWaitlist(){
  if(!lastMoveCheck||lastMoveCheck.ok)return;
  const {visit,targetDay,targetTime}=lastMoveCheck;
  waitlist.push({name:editingStudent,sections:visit.entries.map(e=>e.section),preferredDay:targetDay,preferredTime:targetTime,requested:new Date().toISOString()});
  addAudit(editingStudent,'Added to Waitlist',`${targetDay} ${targetTime} · ${visit.entries.map(e=>e.section).join(' + ')}`);
  $('moveMessage').textContent=`Added to waitlist for ${targetDay} at ${targetTime}: ${visit.entries.map(e=>e.section).join(' + ')}.`;
  $('addWaitlist').disabled=true;
}
$('editDay').addEventListener('change',()=>{fillEditTimes();lastMoveCheck=null;$('capacityCheck').innerHTML='';$('confirmMove').disabled=true;$('addWaitlist').disabled=true;});
$('editTime').addEventListener('change',()=>{lastMoveCheck=null;$('capacityCheck').innerHTML='';$('confirmMove').disabled=true;$('addWaitlist').disabled=true;});
$('editVisit').addEventListener('change',()=>{const v=selectedVisit();if(v){$('editDay').value=v.day;fillEditTimes();$('editTime').value=v.time;}lastMoveCheck=null;$('capacityCheck').innerHTML='';$('confirmMove').disabled=true;$('addWaitlist').disabled=true;});
$('checkMove').addEventListener('click',checkAllocation);
$('confirmMove').addEventListener('click',applyMove);
$('addWaitlist').addEventListener('click',addCurrentToWaitlist);

// Extend the existing profile opener with the allocation editor.
const originalOpenStudentProfile=openStudentProfile;
openStudentProfile=function(name){originalOpenStudentProfile(name);loadVisitEditor(name);$('moveMessage').textContent='Changes in this prototype are kept while this page remains open.';};

// --- Phase 2: absence management ---
const absenceRecords=new Map();
const isoDate=d=>d.toISOString().slice(0,10);
const parseLocalDate=value=>{const [y,m,d]=value.split('-').map(Number);return new Date(y,m-1,d);};
const formatDate=value=>parseLocalDate(value).toLocaleDateString('en-AU',{day:'numeric',month:'short',year:'numeric'});
function withinOneCalendarMonth(startValue,returnValue){
  const start=parseLocalDate(startValue), ret=parseLocalDate(returnValue);
  const limit=new Date(start.getFullYear(),start.getMonth()+1,start.getDate());
  return ret<=limit;
}
function currentAbsence(name){
  const records=absenceRecords.get(name)||[];
  return [...records].reverse().find(r=>r.active)||null;
}
function renderAbsencePreview(){
  const start=$('absenceStart').value,ret=$('absenceReturn').value;
  if(!start||!ret){$('absencePreview').innerHTML='';return;}
  if(parseLocalDate(ret)<=parseLocalDate(start)){
    $('absencePreview').innerHTML='<div class="absence-rule long">Return date must be after the start date.</div>';return;
  }
  const short=withinOneCalendarMonth(start,ret);
  $('absencePreview').innerHTML=short
    ?'<div class="absence-rule short"><b>Temporary Absence</b> — the student will be grey, excluded from Attending, and their current spaces remain reserved until they return.</div>'
    :'<div class="absence-rule long"><b>Extended Absence</b> — this is longer than one month, so the student’s current timeslot allocation will be released.</div>';
}
function renderAbsenceHistory(name){
  const records=absenceRecords.get(name)||[];
  $('absenceHistory').innerHTML=records.length?[...records].reverse().map(r=>`<div class="history-row"><div><b>${r.type}</b><br><span>${formatDate(r.start)} → ${formatDate(r.returnDate)}</span></div><span>${r.active?'Current':'Completed'}</span></div>`).join(''):'<span class="muted">No recorded absences.</span>';
  $('endAbsence').disabled=!currentAbsence(name);
}
function loadAbsenceEditor(name){
  const active=currentAbsence(name);
  $('absenceStart').value=active?.start||'';
  $('absenceReturn').value=active?.returnDate||'';
  renderAbsencePreview();renderAbsenceHistory(name);
}
function saveAbsence(){
  if(!editingStudent)return;
  const start=$('absenceStart').value,ret=$('absenceReturn').value;
  if(!start||!ret){$('moveMessage').textContent='Please enter both the start date and return date.';return;}
  if(parseLocalDate(ret)<=parseLocalDate(start)){$('moveMessage').textContent='Return date must be after the start date.';return;}
  const entries=students.filter(x=>x.name===editingStudent);
  if(!entries.length)return;
  const previousStatus=entries.find(x=>!['Temporary Absence','Extended Absence'].includes(x.status))?.status||'Active';
  const old=currentAbsence(editingStudent);if(old)old.active=false;
  const short=withinOneCalendarMonth(start,ret);
  const record={start,returnDate:ret,type:short?'Temporary Absence':'Extended Absence',previousStatus,active:true};
  if(!absenceRecords.has(editingStudent))absenceRecords.set(editingStudent,[]);
  absenceRecords.get(editingStudent).push(record);
  entries.forEach(e=>{e.status=record.type;e.absenceStart=start;e.absenceReturn=ret;e.released=!short;});
  addAudit(editingStudent,'Absence Started',`${record.type}: ${formatDate(start)} → ${formatDate(ret)}${short?' · spaces reserved':' · allocation released'}`);
  render();
  if(short){
    openStudentProfile(editingStudent);
    $('moveMessage').textContent=`Temporary absence saved: ${formatDate(start)} to ${formatDate(ret)}. The student’s spaces remain reserved.`;
  }else{
    // Released entries stay in memory for history/restoration, but no longer occupy capacity.
    openStudentProfile(editingStudent);
    $('moveMessage').textContent=`Extended absence saved: ${formatDate(start)} to ${formatDate(ret)}. The student’s timeslot spaces have been released.`;
  }
}
function endAbsenceNow(){
  if(!editingStudent)return;
  const record=currentAbsence(editingStudent);if(!record)return;
  record.active=false;
  students.filter(x=>x.name===editingStudent).forEach(e=>{e.status=record.previousStatus||'Active';e.released=false;delete e.absenceStart;delete e.absenceReturn;});
  addAudit(editingStudent,'Absence Ended',`Returned to ${record.previousStatus||'Active'}`);
  render();openStudentProfile(editingStudent);
  $('moveMessage').textContent='Absence ended. The student has returned to their previous status. For an extended absence, check capacity before relying on the restored allocation.';
}
$('absenceStart').addEventListener('change',renderAbsencePreview);
$('absenceReturn').addEventListener('change',renderAbsencePreview);
$('saveAbsence').addEventListener('click',saveAbsence);
$('endAbsence').addEventListener('click',endAbsenceNow);

const allocationProfileOpener=openStudentProfile;
openStudentProfile=function(name){allocationProfileOpener(name);loadAbsenceEditor(name);};

// --- Phase 3: waitlist management ---
let waitlistSequence=1;
function waitlistPoolResults(item){
  const sourceEntries=students.filter(e=>e.name===item.name && e.day===item.sourceDay && mainSlotForRaw(e.time)===item.sourceTime && item.sections.includes(e.section));
  const moving=new Set(sourceEntries);
  const pseudoEntries=item.sections.map(section=>({section}));
  return requiredPools(pseudoEntries).map(pool=>{
    const occupied=students.filter(e=>!e.released&&!moving.has(e)&&e.day===item.preferredDay&&timeMatches(e.time,item.preferredTime)&&pool.test(e)).length;
    const needed=pseudoEntries.filter(pool.test).length;
    const after=occupied+needed;
    return {...pool,occupied,needed,after,ok:after<=pool.cap};
  });
}
function waitlistAvailability(item){
  const results=waitlistPoolResults(item);
  return {results,ok:results.length>0&&results.every(r=>r.ok)};
}
function formatRequested(value){
  const d=new Date(value);
  return Number.isNaN(d.getTime())?'—':d.toLocaleDateString('en-AU',{day:'numeric',month:'short',year:'numeric'});
}
function renderWaitlist(){
  if(!$('waitlistRows'))return;
  const filter=$('waitlistFilter').value;
  const entries=waitlist.map(item=>({...item,availability:waitlistAvailability(item)})).filter(item=>filter==='All'||(filter==='Available'?item.availability.ok:!item.availability.ok));
  $('waitlistNavCount').textContent=waitlist.length;
  $('waitlistRows').innerHTML=entries.map(item=>{
    const details=item.availability.results.map(r=>`${r.name}: ${r.after}/${r.cap}`).join(' · ');
    return `<tr><td><b>${item.name}</b></td><td><div class="waitlist-sections">${item.sections.map(s=>`<span class="section-chip">${s}</span>`).join('')}</div></td><td>${item.sourceDay} · ${item.sourceTime}</td><td><b>${item.preferredDay}</b> · ${item.preferredTime}</td><td><span class="availability-pill ${item.availability.ok?'available':'waiting'}">${item.availability.ok?'Available now':'Still waiting'}</span><span class="wait-detail">${details}</span></td><td>${formatRequested(item.requested)}</td><td><div class="waitlist-actions"><button class="allocate-btn" data-wait-id="${item.id}" ${item.availability.ok?'':'disabled'}>Allocate</button><button class="remove-wait-btn" data-wait-id="${item.id}">Remove</button></div></td></tr>`;
  }).join('');
  $('waitlistEmpty').style.display=entries.length?'none':'block';
}
function allocateWaitlistItem(id){
  const item=waitlist.find(w=>w.id===id);if(!item)return;
  const availability=waitlistAvailability(item);
  if(!availability.ok){renderWaitlist();return;}
  const sourceEntries=students.filter(e=>e.name===item.name&&e.day===item.sourceDay&&mainSlotForRaw(e.time)===item.sourceTime&&item.sections.includes(e.section));
  if(!sourceEntries.length){alert('The student’s current allocation has changed. Remove this waitlist entry and create a new request.');return;}
  // Recheck immediately before changing anything, then move all sections in the visit together.
  sourceEntries.forEach(e=>{e.day=item.preferredDay;e.time=item.preferredTime;});
  const index=waitlist.findIndex(w=>w.id===id);if(index>=0)waitlist.splice(index,1);
  render();renderWaitlist();
}
function removeWaitlistItem(id){
  const index=waitlist.findIndex(w=>w.id===id);if(index>=0)waitlist.splice(index,1);
  renderWaitlist();
}
$('waitlistFilter').addEventListener('change',renderWaitlist);
$('waitlistRows').addEventListener('click',e=>{
  const allocate=e.target.closest('.allocate-btn');
  const remove=e.target.closest('.remove-wait-btn');
  if(allocate&&!allocate.disabled)allocateWaitlistItem(Number(allocate.dataset.waitId));
  if(remove)removeWaitlistItem(Number(remove.dataset.waitId));
});
$('waitlistNav').addEventListener('click',()=>setTimeout(()=>{$('waitlistSection').classList.add('waitlist-highlight');setTimeout(()=>$('waitlistSection').classList.remove('waitlist-highlight'),1300)},100));

// Upgrade the existing Add to Waitlist action so requests appear in the Waitlist manager.
addCurrentToWaitlist=function(){
  if(!lastMoveCheck||lastMoveCheck.ok)return;
  const {visit,targetDay,targetTime}=lastMoveCheck;
  const duplicate=waitlist.some(w=>w.name===editingStudent&&w.sourceDay===visit.day&&w.sourceTime===visit.time&&w.preferredDay===targetDay&&w.preferredTime===targetTime);
  if(duplicate){$('moveMessage').textContent='This waitlist request already exists.';return;}
  waitlist.push({id:waitlistSequence++,name:editingStudent,sections:visit.entries.map(e=>e.section),sourceDay:visit.day,sourceTime:visit.time,preferredDay:targetDay,preferredTime:targetTime,requested:new Date().toISOString()});
  $('moveMessage').textContent=`Added to waitlist for ${targetDay} at ${targetTime}: ${visit.entries.map(e=>e.section).join(' + ')}.`;
  $('addWaitlist').disabled=true;
  renderWaitlist();
};
// The listener registered earlier resolves this function name at click time.

// Keep waitlist availability live whenever dashboard/student allocations change.
const renderBeforeWaitlist=render;
render=function(){renderBeforeWaitlist();renderWaitlist();};
renderWaitlist();

// --- Phase 4: Add New Student / Free Trial ---
let lastNewStudentCheck=null;
function fillNewStudentTimes(){
  const day=$('newStudentDay').value;
  $('newStudentTime').innerHTML=(centreTimes[day]||[]).map(t=>`<option>${t}</option>`).join('');
}
function selectedNewSections(){
  const sections=[];
  if($('newEnglish').checked)sections.push('English');
  if($('newMath').checked)sections.push($('newMathLevel').value);
  if($('newInteractive').checked)sections.push('Interactive');
  return sections;
}
function resetNewStudentForm(){
  $('newStudentName').value='';$('newStudentStatus').value='New';
  $('newEnglish').checked=$('newMath').checked=$('newInteractive').checked=false;
  $('mathLevelWrap').classList.add('hidden');$('newStudentDay').value='Monday';fillNewStudentTimes();
  $('newStudentCapacity').innerHTML='';$('newStudentMessage').textContent='';
  $('saveNewStudent').disabled=true;$('waitlistNewStudent').disabled=true;lastNewStudentCheck=null;
}
function openAddStudent(){resetNewStudentForm();$('addStudentModal').classList.add('open');$('addStudentModal').setAttribute('aria-hidden','false');}
function closeAddStudent(){$('addStudentModal').classList.remove('open');$('addStudentModal').setAttribute('aria-hidden','true');}
function invalidateNewStudentCheck(){lastNewStudentCheck=null;$('newStudentCapacity').innerHTML='';$('saveNewStudent').disabled=true;$('waitlistNewStudent').disabled=true;}
function checkNewStudentAllocation(){
  const name=$('newStudentName').value.trim(), status=$('newStudentStatus').value, sections=selectedNewSections(), day=$('newStudentDay').value,time=$('newStudentTime').value;
  if(!name){$('newStudentMessage').textContent='Enter the student name first.';return;}
  if(!sections.length){$('newStudentMessage').textContent='Select at least one subject.';return;}
  const pseudo=sections.map(section=>({section}));
  const results=requiredPools(pseudo).map(pool=>{
    const occupied=students.filter(e=>!e.released&&e.day===day&&timeMatches(e.time,time)&&pool.test(e)).length;
    const needed=pseudo.filter(pool.test).length, after=occupied+needed;
    return {...pool,occupied,needed,after,ok:after<=pool.cap};
  });
  const ok=results.every(r=>r.ok);
  lastNewStudentCheck={name,status,sections,day,time,results,ok};
  $('newStudentCapacity').innerHTML=results.map(r=>`<div class="check-row"><span>${r.name}${r.name==='Math'?' (shared)':''}</span><strong>${r.after} / ${r.cap}</strong><span class="${r.ok?'check-ok':'check-full'}">${r.ok?'Available':'Full'}</span></div>`).join('')+`<div class="check-summary ${ok?'ok':'full'}">${ok?'Student can be allocated.':'Requested allocation is full. The student can be added to the waitlist.'}</div>`;
  $('saveNewStudent').disabled=!ok;$('waitlistNewStudent').disabled=ok;$('newStudentMessage').textContent='';
}
function duplicateStudentName(name){return students.some(e=>e.name.toLowerCase()===name.toLowerCase());}
function createAndAllocateNewStudent(){
  if(!lastNewStudentCheck?.ok)return;
  const c=lastNewStudentCheck;
  if(duplicateStudentName(c.name)){ $('newStudentMessage').textContent='A student with this name already exists. Open their profile instead of creating a duplicate.';return; }
  // Recheck capacity immediately before saving.
  checkNewStudentAllocation(); if(!lastNewStudentCheck?.ok)return;
  c.sections.forEach(section=>students.push({name:c.name,status:c.status,day:c.day,time:c.time,section}));
  addAudit(c.name,'Student Created',`${c.status} · allocated ${c.day} ${c.time} · ${c.sections.join(' + ')}`);
  render();closeAddStudent();openStudentProfile(c.name);
  $('moveMessage').textContent=`${c.status==='Free Trial'?'Free Trial':'New Student'} created and allocated to ${c.day} at ${c.time}.`;
}
function createNewStudentOnWaitlist(){
  if(!lastNewStudentCheck||lastNewStudentCheck.ok)return;
  const c=lastNewStudentCheck;
  if(duplicateStudentName(c.name)){ $('newStudentMessage').textContent='A student with this name already exists. Open their profile to create a move/waitlist request.';return; }
  // Keep a non-capacity-holding record so the new student exists before allocation.
  c.sections.forEach(section=>students.push({name:c.name,status:c.status,day:c.day,time:c.time,section,released:true,pendingAllocation:true}));
  waitlist.push({id:waitlistSequence++,name:c.name,sections:[...c.sections],sourceDay:'Not allocated',sourceTime:'—',preferredDay:c.day,preferredTime:c.time,requested:new Date().toISOString(),newStudent:true});
  addAudit(c.name,'Student Created',`${c.status} · created without allocation`);addAudit(c.name,'Added to Waitlist',`${c.day} ${c.time} · ${c.sections.join(' + ')}`);
  render();renderWaitlist();closeAddStudent();
  document.getElementById('waitlistSection').scrollIntoView({behavior:'smooth',block:'start'});
}
$('openAddStudent').addEventListener('click',openAddStudent);$('closeAddStudent').addEventListener('click',closeAddStudent);
$('addStudentModal').addEventListener('click',e=>{if(e.target===$('addStudentModal'))closeAddStudent();});
$('newMath').addEventListener('change',()=>{$('mathLevelWrap').classList.toggle('hidden',!$('newMath').checked);invalidateNewStudentCheck();});
['newEnglish','newInteractive'].forEach(id=>$(id).addEventListener('change',invalidateNewStudentCheck));
['newStudentName','newStudentStatus','newMathLevel','newStudentTime'].forEach(id=>$(id).addEventListener(id==='newStudentName'?'input':'change',invalidateNewStudentCheck));
$('newStudentDay').addEventListener('change',()=>{fillNewStudentTimes();invalidateNewStudentCheck();});
$('checkNewStudent').addEventListener('click',checkNewStudentAllocation);$('saveNewStudent').addEventListener('click',createAndAllocateNewStudent);$('waitlistNewStudent').addEventListener('click',createNewStudentOnWaitlist);

// Support waitlisted students who do not yet have a current allocation.
const previousWaitlistPoolResults=waitlistPoolResults;
waitlistPoolResults=function(item){
  if(!item.newStudent)return previousWaitlistPoolResults(item);
  const pseudo=item.sections.map(section=>({section}));
  return requiredPools(pseudo).map(pool=>{
    const occupied=students.filter(e=>!e.released&&e.day===item.preferredDay&&timeMatches(e.time,item.preferredTime)&&pool.test(e)).length;
    const needed=pseudo.filter(pool.test).length,after=occupied+needed;
    return {...pool,occupied,needed,after,ok:after<=pool.cap};
  });
};
const previousAllocateWaitlistItem=allocateWaitlistItem;
allocateWaitlistItem=function(id){
  const item=waitlist.find(w=>w.id===id);if(!item?.newStudent)return previousAllocateWaitlistItem(id);
  const availability=waitlistAvailability(item);if(!availability.ok){renderWaitlist();return;}
  const pending=students.filter(e=>e.name===item.name&&e.pendingAllocation&&item.sections.includes(e.section));
  if(!pending.length){alert('The pending student record could not be found.');return;}
  pending.forEach(e=>{e.day=item.preferredDay;e.time=item.preferredTime;e.released=false;delete e.pendingAllocation;});
  const index=waitlist.findIndex(w=>w.id===id);if(index>=0)waitlist.splice(index,1);
  render();renderWaitlist();
};
fillNewStudentTimes();

// --- Phase 5: Inactive Student Management ---
const inactiveRecords=new Map();
let lastReactivateCheck=null;
const todayIso=()=>new Date().toISOString().slice(0,10);
function sixMonthsAfter(value){const d=parseLocalDate(value);return new Date(d.getFullYear(),d.getMonth()+6,d.getDate());}
function isDeletionEligible(record){return record&&new Date()>=sixMonthsAfter(record.inactiveFrom);}
function fillReactivateTimes(){const day=$('reactivateDay').value;$('reactivateTime').innerHTML=(centreTimes[day]||[]).map(t=>`<option>${t}</option>`).join('');}
function inactiveSections(name){return [...new Set(students.filter(e=>e.name===name).map(e=>e.section))];}
function loadInactiveEditor(name){
  const rec=inactiveRecords.get(name);lastReactivateCheck=null;$('reactivateCapacity').innerHTML='';$('confirmReactivate').disabled=true;
  $('inactiveDate').value=todayIso();$('inactiveReason').value='';
  if(!rec){$('inactiveCurrent').innerHTML='';$('inactiveForm').classList.remove('hidden');$('reactivateForm').classList.add('hidden');return;}
  const eligible=isDeletionEligible(rec), eligibleDate=sixMonthsAfter(rec.inactiveFrom).toLocaleDateString('en-AU',{day:'numeric',month:'short',year:'numeric'});
  $('inactiveCurrent').innerHTML=`<div class="inactive-card ${eligible?'eligible':''}"><b>Inactive since ${formatDate(rec.inactiveFrom)}</b>${rec.reason?`<br>Reason: ${rec.reason}`:''}<br>${eligible?'Eligible for permanent deletion (inactive for 6+ months).':`Eligible for deletion from ${eligibleDate}.`}</div>`;
  $('inactiveForm').classList.add('hidden');$('reactivateForm').classList.remove('hidden');$('deleteInactive').classList.toggle('hidden',!eligible);$('reactivateDay').value='Monday';fillReactivateTimes();
}
function markStudentInactive(){
  if(!editingStudent)return;const date=$('inactiveDate').value,reason=$('inactiveReason').value.trim();if(!date){$('moveMessage').textContent='Please enter the inactive date.';return;}
  const entries=students.filter(e=>e.name===editingStudent);if(!entries.length)return;
  const previousStatus=entries.find(e=>!['Temporary Absence','Extended Absence','Inactive'].includes(e.status))?.status||'Active';
  entries.forEach(e=>{e.status='Inactive';e.released=true;delete e.pendingAllocation;});
  for(let i=waitlist.length-1;i>=0;i--)if(waitlist[i].name===editingStudent)waitlist.splice(i,1);
  const active=currentAbsence(editingStudent);if(active)active.active=false;
  inactiveRecords.set(editingStudent,{inactiveFrom:date,reason,previousStatus,oldAllocations:entries.map(e=>({day:e.day,time:e.time,section:e.section}))});
  addAudit(editingStudent,'Marked Inactive',`${formatDate(date)}${reason?` · ${reason}`:''} · allocations released`);
  render();openStudentProfile(editingStudent);$('moveMessage').textContent='Student marked inactive. All allocated spaces were released and waitlist requests were removed.';
}
function checkReactivation(){
  if(!editingStudent||!inactiveRecords.has(editingStudent))return;const day=$('reactivateDay').value,time=$('reactivateTime').value,sections=inactiveSections(editingStudent);const pseudo=sections.map(section=>({section}));
  const results=requiredPools(pseudo).map(pool=>{const occupied=students.filter(e=>!e.released&&e.day===day&&timeMatches(e.time,time)&&pool.test(e)).length;const needed=pseudo.filter(pool.test).length,after=occupied+needed;return {...pool,occupied,needed,after,ok:after<=pool.cap};});
  const ok=results.every(r=>r.ok);lastReactivateCheck={day,time,results,ok};$('reactivateCapacity').innerHTML=results.map(r=>`<div class="check-row"><span>${r.name}${r.name==='Math'?' (shared)':''}</span><strong>${r.after} / ${r.cap}</strong><span class="${r.ok?'check-ok':'check-full'}">${r.ok?'Available':'Full'}</span></div>`).join('')+`<div class="check-summary ${ok?'ok':'full'}">${ok?'Student can be reactivated and allocated.':'The student cannot fit in this timeslot.'}</div>`;$('confirmReactivate').disabled=!ok;
}
function reactivateStudent(){
  if(!lastReactivateCheck?.ok||!editingStudent)return;checkReactivation();if(!lastReactivateCheck?.ok)return;const rec=inactiveRecords.get(editingStudent);students.filter(e=>e.name===editingStudent).forEach(e=>{e.status=rec?.previousStatus||'Active';e.day=lastReactivateCheck.day;e.time=lastReactivateCheck.time;e.released=false;});inactiveRecords.delete(editingStudent);addAudit(editingStudent,'Reactivated',`${lastReactivateCheck.day} ${lastReactivateCheck.time}`);render();openStudentProfile(editingStudent);$('moveMessage').textContent=`Student reactivated and allocated to ${lastReactivateCheck.day} at ${lastReactivateCheck.time}.`;
}
function deleteInactiveStudent(){
  if(!editingStudent)return;const rec=inactiveRecords.get(editingStudent);if(!isDeletionEligible(rec))return;if(!confirm(`Permanently delete ${editingStudent}? This cannot be undone in this prototype.`))return;
  for(let i=students.length-1;i>=0;i--)if(students[i].name===editingStudent)students.splice(i,1);inactiveRecords.delete(editingStudent);absenceRecords.delete(editingStudent);for(let i=waitlist.length-1;i>=0;i--)if(waitlist[i].name===editingStudent)waitlist.splice(i,1);closeStudentProfile();render();
}
$('markInactive').addEventListener('click',markStudentInactive);$('reactivateDay').addEventListener('change',()=>{fillReactivateTimes();lastReactivateCheck=null;$('reactivateCapacity').innerHTML='';$('confirmReactivate').disabled=true;});$('reactivateTime').addEventListener('change',()=>{lastReactivateCheck=null;$('reactivateCapacity').innerHTML='';$('confirmReactivate').disabled=true;});$('checkReactivate').addEventListener('click',checkReactivation);$('confirmReactivate').addEventListener('click',reactivateStudent);$('deleteInactive').addEventListener('click',deleteInactiveStudent);fillReactivateTimes();

// Add inactive students to the Student List without counting them in dashboard occupancy/capacity.
const renderBeforeInactive=render;
render=function(){
  renderBeforeInactive();
  const listStatus=$('listStatus').value,q=$('search').value.toLowerCase().trim();
  if(listStatus==='Inactive'||listStatus==='All'){
    const names=[...inactiveRecords.keys()].filter(name=>!q||name.toLowerCase().includes(q));
    if(names.length){
      const html=names.map(name=>{const rec=inactiveRecords.get(name);return `<tr><td><b>${name}</b></td><td><span class="badge inactive-b">Inactive</span></td><td>—</td><td>—</td><td>${inactiveSections(name).join(' + ')}</td><td><button class="view-student" data-student="${encodeURIComponent(name)}">View</button></td></tr>`}).join('');
      $('rows').insertAdjacentHTML('beforeend',html);$('empty').style.display='none';
    }
  }
};

const openBeforeInactive=openStudentProfile;
openStudentProfile=function(name){
  openBeforeInactive(name);loadInactiveEditor(name);const rec=inactiveRecords.get(name);
  if(rec){$('profileStatus').textContent='Inactive';$('profileStatus').className='badge inactive-b';$('profileEntries').textContent='No active allocation';$('profileSchedule').innerHTML=rec.oldAllocations.map(x=>`<tr><td>${x.day}</td><td>${x.time}</td><td>${x.section}</td><td><span class="badge inactive-b">Released</span></td></tr>`).join('');$('capacityCheck').innerHTML='<div class="check-summary full">Inactive students cannot be moved. Reactivate the student below to create a new allocation.</div>';$('checkMove').disabled=true;$('confirmMove').disabled=true;$('addWaitlist').disabled=true;$('saveAbsence').disabled=true;$('endAbsence').disabled=true;}else{$('checkMove').disabled=false;$('saveAbsence').disabled=false;}
};
render();

// Audit page controls and actions that are easiest to observe at the UI boundary.
['auditStudent','auditAction','auditDate','auditStaff'].forEach(id=>$(id).addEventListener(id==='auditStudent'?'input':'change',renderAudit));
$('clearAuditFilters').addEventListener('click',()=>{$('auditStudent').value='';$('auditAction').value='All';$('auditDate').value='';$('auditStaff').value='All';renderAudit();});
$('auditNav').addEventListener('click',()=>setTimeout(()=>$('auditSection').scrollIntoView({behavior:'smooth',block:'start'}),50));
const auditAllocateWaitlist=allocateWaitlistItem;allocateWaitlistItem=function(id){const item=waitlist.find(w=>w.id===id);const snap=item?{...item,sections:[...item.sections]}:null;const before=waitlist.length;auditAllocateWaitlist(id);if(snap&&waitlist.length<before)addAudit(snap.name,'Waitlist Allocated',`${snap.preferredDay} ${snap.preferredTime} · ${snap.sections.join(' + ')}`);};
const auditRemoveWaitlist=removeWaitlistItem;removeWaitlistItem=function(id){const item=waitlist.find(w=>w.id===id);const snap=item?{...item,sections:[...item.sections]}:null;const before=waitlist.length;auditRemoveWaitlist(id);if(snap&&waitlist.length<before)addAudit(snap.name,'Waitlist Removed',`${snap.preferredDay} ${snap.preferredTime}`);};
renderAudit();

// --- Navigation pages: Dashboard / Students / Schedule / Waitlist / Absences / Audit Log ---
const pageMeta={dashboard:['Dashboard','Capacity and student overview'],students:['Students','Student records, allocations and status management'],schedule:['Schedule','Centre-wide allocation by day and timeslot'],waitlist:['Waitlist','Manage students waiting for preferred allocations'],absences:['Absences','Current temporary and extended absences'],audit:['Audit Log','Change history for important student actions']};
function setPage(page){
  document.querySelectorAll('[data-page-link]').forEach(a=>a.classList.toggle('active',a.dataset.pageLink===page));
  document.querySelectorAll('[data-page]').forEach(el=>{const show=el.dataset.page===page;if(el.classList.contains('page-section'))el.classList.toggle('page-active',show);else el.style.display=show?'':'none';});
  const meta=pageMeta[page]||pageMeta.dashboard;$('pageTitle').textContent=meta[0];$('pageSubtitle').textContent=meta[1];
  if(page==='students')renderStudentsPage();if(page==='schedule')renderSchedulePage();if(page==='waitlist')renderWaitlist();if(page==='absences')renderAbsencesPage();if(page==='audit')renderAudit();window.scrollTo({top:0,behavior:'smooth'});
}
document.querySelectorAll('[data-page-link]').forEach(a=>a.addEventListener('click',e=>{e.preventDefault();setPage(a.dataset.pageLink);}));
$('openWaitlistPage').addEventListener('click',()=>setPage('waitlist'));
$('studentsAdd').addEventListener('click',openAddStudent);

function studentSummaryRows(){
  const map=new Map();
  students.forEach(e=>{if(!map.has(e.name))map.set(e.name,[]);map.get(e.name).push(e);});
  return [...map.entries()].map(([name,entries])=>{
    const inactive=inactiveRecords.has(name);const status=inactive?'Inactive':(entries.find(e=>e.status==='Extended Absence')?.status||entries.find(e=>e.status==='Temporary Absence')?.status||entries.find(e=>e.status==='Free Trial')?.status||entries.find(e=>e.status==='New')?.status||entries[0]?.status||'Active');
    const subjects=[...new Set(entries.map(e=>e.section))];const visits=[...new Set(entries.filter(e=>!e.released&&!e.pendingAllocation).map(e=>`${e.day} ${e.time}`))];
    return {name,status,subjects,visits};
  }).sort((a,b)=>a.name.localeCompare(b.name));
}
function renderStudentsPage(){
  const q=$('studentsPageSearch').value.toLowerCase().trim(),st=$('studentsPageStatus').value;
  const data=studentSummaryRows().filter(x=>(!q||x.name.toLowerCase().includes(q))&&(st==='All'||x.status===st));
  $('studentsPageRows').innerHTML=data.map(x=>`<tr><td><b>${x.name}</b></td><td><span class="badge ${badgeClass(x.status)}">${x.status}</span></td><td>${x.subjects.join(' + ')}</td><td>${x.visits.length?x.visits.join('<br>'):'—'}</td><td><button class="view-student" data-student="${encodeURIComponent(x.name)}">View / Edit</button></td></tr>`).join('');
  $('studentsPageEmpty').style.display=data.length?'none':'block';
}
$('studentsPageSearch').addEventListener('input',renderStudentsPage);$('studentsPageStatus').addEventListener('change',renderStudentsPage);
$('studentsPageRows').addEventListener('click',e=>{const b=e.target.closest('.view-student');if(b)openStudentProfile(decodeURIComponent(b.dataset.student));});

function sessionEntries(day,time){return students.filter(e=>!e.released&&!e.pendingAllocation&&e.day===day&&timeMatches(e.time,time));}
function renderSchedulePage(){
  const day=$('scheduleDay').value,times=centreTimes[day]||[];
  $('scheduleGrid').innerHTML=times.map(time=>{const es=sessionEntries(day,time),eng=es.filter(e=>e.section==='English').length,math=es.filter(e=>['3A–A Math','B–D Math','E+ Math'].includes(e.section)).length,int=es.filter(e=>e.section==='Interactive').length;return `<div class="session-card" data-time="${time}"><h3>${time}</h3><div class="session-metric"><span>English</span><b>${eng} / 28</b></div><div class="session-metric"><span>Math</span><b>${math} / 41</b></div><div class="session-metric"><span>Interactive</span><b>${int} / 5</b></div></div>`}).join('');$('scheduleDetail').innerHTML='';
}
function renderScheduleDetail(time){
 const day=$('scheduleDay').value,es=sessionEntries(day,time),groups=[['English',e=>e.section==='English'],['Math',e=>['3A–A Math','B–D Math','E+ Math'].includes(e.section)],['Interactive',e=>e.section==='Interactive']];
 $('scheduleDetail').innerHTML=`<h3>${day} — ${time}</h3><p>Click a student to open their profile.</p><div class="schedule-columns">${groups.map(([title,test])=>{const arr=es.filter(test);let body='';if(title==='Math'){body=['3A–A Math','B–D Math','E+ Math'].map(level=>`<div class="subsection-title">${level}</div>${arr.filter(e=>e.section===level).map(e=>`<button data-student="${encodeURIComponent(e.name)}">${e.name} <span class="muted">· ${e.status}</span></button>`).join('')||'<span class="muted">No students</span>'}`).join('')}else body=arr.map(e=>`<button data-student="${encodeURIComponent(e.name)}">${e.name} <span class="muted">· ${e.status}</span></button>`).join('')||'<span class="muted">No students</span>';return `<div class="schedule-list"><h4>${title}</h4>${body}</div>`}).join('')}</div>`;
}
$('scheduleDay').addEventListener('change',renderSchedulePage);$('scheduleGrid').addEventListener('click',e=>{const c=e.target.closest('.session-card');if(!c)return;document.querySelectorAll('.session-card').forEach(x=>x.classList.remove('selected'));c.classList.add('selected');renderScheduleDetail(c.dataset.time);});$('scheduleDetail').addEventListener('click',e=>{const b=e.target.closest('[data-student]');if(b)openStudentProfile(decodeURIComponent(b.dataset.student));});

function renderAbsencesPage(){
 const q=$('absencePageSearch').value.toLowerCase().trim(),type=$('absencePageType').value;const data=studentSummaryRows().filter(x=>['Temporary Absence','Extended Absence'].includes(x.status)&&(type==='All'||x.status===type)&&(!q||x.name.toLowerCase().includes(q)));
 $('absencePageRows').innerHTML=data.map(x=>{const recs=absenceRecords.get(x.name)||[];const current=[...recs].reverse().find(r=>r.active);const dates=current?`${formatDate(current.start)} → ${formatDate(current.returnDate)}`:'Dates not recorded (imported status)';return `<tr><td><b>${x.name}</b></td><td><span class="badge ${badgeClass(x.status)}">${x.status}</span></td><td class="absence-page-date">${dates}</td><td>${x.visits.length?x.visits.join('<br>'):(x.status==='Extended Absence'?'Released':'—')}</td><td><button class="view-student" data-student="${encodeURIComponent(x.name)}">Manage</button></td></tr>`}).join('');$('absencePageEmpty').style.display=data.length?'none':'block';
}
$('absencePageSearch').addEventListener('input',renderAbsencesPage);$('absencePageType').addEventListener('change',renderAbsencesPage);$('absencePageRows').addEventListener('click',e=>{const b=e.target.closest('.view-student');if(b)openStudentProfile(decodeURIComponent(b.dataset.student));});

const renderBeforePages=render;render=function(){renderBeforePages();if($('dashboardWaitlistCount'))$('dashboardWaitlistCount').textContent=waitlist.length;renderStudentsPage();renderAbsencesPage();if(document.querySelector('[data-page-link="schedule"].active'))renderSchedulePage();};
setPage('dashboard');render();
