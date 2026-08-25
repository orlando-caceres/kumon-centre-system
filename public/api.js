const API = {
  async request(url, options={}) {
    const response = await fetch(url, {
      ...options,
      headers: { 'Content-Type':'application/json', ...(options.headers||{}) }
    });
    let data=null;
    try { data=await response.json(); } catch {}
    if(!response.ok) throw new Error(data?.error || data?.message || `Request failed (${response.status})`);
    return data;
  },
  getState(){ return this.request('/api/state'); },
  saveState(state){ return this.request('/api/state',{method:'PUT',body:JSON.stringify({state})}); },
  resetState(){ return this.request('/api/state',{method:'DELETE'}); },
  getStudents(){ return this.request('/api/students'); },
  getStudent(id){ return this.request(`/api/students/${id}`); },
  getWaitlist(){ return this.request('/api/waitlist'); },
  getAbsences(){ return this.request('/api/absences'); },
  getAuditLog(){ return this.request('/api/audit-log'); },
  getCapacity(day,time){ const q=new URLSearchParams({day,time}); return this.request(`/api/capacity?${q}`); }
};
