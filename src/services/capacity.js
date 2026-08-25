const pool = require('../db');
const CAPACITY = { English: 28, Math: 41, Interactive: 5 };
const MATH = ['3A-A Math','B-D Math','E+ Math'];
const VALID = {
  Monday:['3:45 pm','4:30 pm','5:15 pm','6:00 pm'],
  Tuesday:['3:45 pm'],
  Thursday:['3:45 pm','4:30 pm','5:15 pm','6:00 pm'],
  Friday:['3:45 pm']
};
function assertSlot(day,time){ if(!VALID[day]?.includes(time)) throw Object.assign(new Error('Invalid day/timeslot combination'),{status:400}); }
async function slotCapacity(day,time,conn=pool){
  assertSlot(day,time);
  const [rows]=await conn.query(`SELECT section, COUNT(*) occupied FROM allocations WHERE day_of_week=? AND centre_timeslot=? AND is_reserved=1 GROUP BY section`,[day,time]);
  const counts=Object.fromEntries(rows.map(r=>[r.section,Number(r.occupied)]));
  const english=counts.English||0, interactive=counts.Interactive||0;
  const mathBreakdown=Object.fromEntries(MATH.map(s=>[s,counts[s]||0]));
  const math=Object.values(mathBreakdown).reduce((a,b)=>a+b,0);
  return {day,time,english:{occupied:english,capacity:28,available:Math.max(0,28-english)},math:{occupied:math,capacity:41,available:Math.max(0,41-math),breakdown:mathBreakdown},interactive:{occupied:interactive,capacity:5,available:Math.max(0,5-interactive)}};
}
async function canFit(day,time,sections,conn=pool,excludeStudentId=null){
  assertSlot(day,time);
  const params=[day,time];
  let sql=`SELECT section, COUNT(*) occupied FROM allocations WHERE day_of_week=? AND centre_timeslot=? AND is_reserved=1`;
  if(excludeStudentId){sql+=' AND student_id<>?';params.push(excludeStudentId)}
  sql+=' GROUP BY section';
  const [rows]=await conn.query(sql,params); const c=Object.fromEntries(rows.map(r=>[r.section,Number(r.occupied)]));
  const needEnglish=sections.filter(s=>s==='English').length;
  const needInteractive=sections.filter(s=>s==='Interactive').length;
  const needMath=sections.filter(s=>MATH.includes(s)).length;
  const mathNow=MATH.reduce((n,s)=>n+(c[s]||0),0);
  const checks={
    English:{needed:needEnglish,occupied:c.English||0,capacity:28,ok:(c.English||0)+needEnglish<=28},
    Math:{needed:needMath,occupied:mathNow,capacity:41,ok:mathNow+needMath<=41},
    Interactive:{needed:needInteractive,occupied:c.Interactive||0,capacity:5,ok:(c.Interactive||0)+needInteractive<=5}
  };
  return {ok:Object.values(checks).every(x=>x.ok),checks};
}
module.exports={CAPACITY,MATH,VALID,assertSlot,slotCapacity,canFit};
