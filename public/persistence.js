// V1.1 client-testing persistence layer.
// It serializes the already-approved prototype state into MySQL after changes.
(() => {
  let ready=false, saving=false, lastSaved='', pending=false;
  const banner=document.createElement('div');
  banner.id='dbPersistenceBanner';
  banner.style.cssText='position:fixed;right:18px;bottom:18px;z-index:9999;padding:8px 12px;border-radius:8px;background:#172033;color:#fff;font:12px system-ui;box-shadow:0 4px 16px #0003;opacity:.9';
  banner.textContent='Database: connecting…';
  document.body.appendChild(banner);

  function serialiseMap(map){ return [...map.entries()]; }
  function snapshot(){
    return {
      version:1,
      savedAt:new Date().toISOString(),
      students: students.map(x=>({...x})),
      waitlist: waitlist.map(x=>({...x,sections:[...(x.sections||[])]})),
      waitlistSequence,
      absences: serialiseMap(absenceRecords),
      inactive: serialiseMap(inactiveRecords),
      audit: auditLog.map(x=>({...x,timestamp:x.timestamp instanceof Date?x.timestamp.toISOString():x.timestamp})),
      auditSequence
    };
  }
  function restore(state){
    if(!state)return;
    students.splice(0,students.length,...(state.students||[]));
    waitlist.splice(0,waitlist.length,...(state.waitlist||[]));
    waitlistSequence=Number(state.waitlistSequence)||1;
    absenceRecords.clear(); for(const [k,v] of (state.absences||[])) absenceRecords.set(k,v);
    inactiveRecords.clear(); for(const [k,v] of (state.inactive||[])) inactiveRecords.set(k,v);
    auditLog.splice(0,auditLog.length,...(state.audit||[]).map(x=>({...x,timestamp:new Date(x.timestamp)})));
    auditSequence=Number(state.auditSequence)||1;
  }
  async function save(force=false){
    if(!ready||saving)return;
    const state=snapshot(); const json=JSON.stringify(state);
    if(!force && json===lastSaved)return;
    saving=true; banner.textContent='Database: saving…';
    try { await API.saveState(state); lastSaved=json; banner.textContent='Database: saved'; }
    catch(e){ console.error(e); banner.textContent='Database: save failed'; }
    finally { saving=false; if(pending){pending=false;save();} }
  }
  async function boot(){
    try {
      const result=await API.getState();
      if(result.exists){ restore(result.state); banner.textContent='Database: loaded'; }
      else { banner.textContent='Database: creating initial state…'; }
      ready=true;
      // Re-render all pages after restoring persisted state.
      render(); renderWaitlist(); renderAudit();
      if(typeof renderStudentsPage==='function')renderStudentsPage();
      if(typeof renderSchedulePage==='function')renderSchedulePage();
      if(typeof renderAbsencesPage==='function')renderAbsencesPage();
      await save(true);
    } catch(e){ console.error(e); banner.textContent='Database: unavailable'; alert('Could not load persistent MySQL data. Check that the Node server and MySQL are running.'); }
  }
  // Poll for actual state changes. This captures every existing prototype workflow without
  // rewriting the approved UI event handlers during the client-testing stage.
  setInterval(()=>{ if(ready){ if(saving)pending=true; else save(); } },1200);
  window.addEventListener('beforeunload',()=>{ if(ready) navigator.sendBeacon?.('/api/state', new Blob([JSON.stringify({state:snapshot()})],{type:'application/json'})); });
  boot();
})();
