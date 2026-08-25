const express=require('express');
const pool=require('../db');
const {slotCapacity,canFit,assertSlot,MATH}=require('../services/capacity');
const router=express.Router();
router.get('/health',async(req,res,next)=>{try{await pool.query('SELECT 1');res.json({ok:true,database:'connected'});}catch(e){next(e)}});
router.get('/students',async(req,res,next)=>{try{const [rows]=await pool.query(`SELECT s.*, GROUP_CONCAT(DISTINCT e.subject ORDER BY e.subject) subjects FROM students s LEFT JOIN enrolments e ON e.student_id=s.id AND e.active=1 GROUP BY s.id ORDER BY s.display_name`);res.json(rows);}catch(e){next(e)}});
router.get('/students/:id',async(req,res,next)=>{try{const [[student]]=await pool.query('SELECT * FROM students WHERE id=?',[req.params.id]);if(!student)return res.status(404).json({error:'Student not found'});const [enrolments]=await pool.query('SELECT * FROM enrolments WHERE student_id=? ORDER BY id',[req.params.id]);const [allocations]=await pool.query('SELECT * FROM allocations WHERE student_id=? ORDER BY FIELD(day_of_week,"Monday","Tuesday","Thursday","Friday"), centre_timeslot, section',[req.params.id]);const [absences]=await pool.query('SELECT * FROM absences WHERE student_id=? ORDER BY created_at DESC',[req.params.id]);res.json({student,enrolments,allocations,absences});}catch(e){next(e)}});
router.get('/capacity',async(req,res,next)=>{try{if(!req.query.day||!req.query.time)return res.status(400).json({error:'day and time are required'});res.json(await slotCapacity(req.query.day,req.query.time));}catch(e){next(e)}});
router.post('/capacity/check',async(req,res,next)=>{try{const {day,time,sections,excludeStudentId}=req.body;if(!Array.isArray(sections))return res.status(400).json({error:'sections must be an array'});res.json(await canFit(day,time,sections,null,excludeStudentId));}catch(e){next(e)}});
router.post('/allocations/move',async(req,res,next)=>{const conn=await pool.getConnection();try{const {studentId,fromDay,fromTime,toDay,toTime}=req.body;assertSlot(toDay,toTime);await conn.beginTransaction();const [allocs]=await conn.query('SELECT * FROM allocations WHERE student_id=? AND day_of_week=? AND centre_timeslot=? FOR UPDATE',[studentId,fromDay,fromTime]);if(!allocs.length)throw Object.assign(new Error('No allocation found for that student/session'),{status:404});const sections=allocs.map(a=>a.section);const fit=await canFit(toDay,toTime,sections,conn,studentId);if(!fit.ok){await conn.rollback();return res.status(409).json({error:'Requested session is full',...fit});}await conn.query('UPDATE allocations SET day_of_week=?, centre_timeslot=?, raw_time=? WHERE student_id=? AND day_of_week=? AND centre_timeslot=?',[toDay,toTime,toTime,studentId,fromDay,fromTime]);await conn.query('INSERT INTO audit_log(student_id,action,details) VALUES (?,"ALLOCATION_MOVED",?)',[studentId,JSON.stringify({from:{day:fromDay,time:fromTime},to:{day:toDay,time:toTime},sections})]);await conn.commit();res.json({ok:true,fit});}catch(e){await conn.rollback();next(e)}finally{conn.release()}});
router.get('/waitlist',async(req,res,next)=>{try{const [rows]=await pool.query(`SELECT w.*,s.display_name,GROUP_CONCAT(wr.section ORDER BY wr.section SEPARATOR ', ') required_sections FROM waitlist w JOIN students s ON s.id=w.student_id LEFT JOIN waitlist_requirements wr ON wr.waitlist_id=w.id GROUP BY w.id ORDER BY FIELD(w.status,'WAITING','ALLOCATED','CANCELLED'),w.requested_at`);res.json(rows);}catch(e){next(e)}});
router.get('/absences',async(req,res,next)=>{try{const [rows]=await pool.query(`SELECT a.*,s.display_name,s.status FROM absences a JOIN students s ON s.id=a.student_id WHERE a.ended_at IS NULL ORDER BY a.return_date`);res.json(rows);}catch(e){next(e)}});
router.get('/audit-log',async(req,res,next)=>{try{const [rows]=await pool.query(`SELECT a.id,a.action,a.details,a.created_at,s.display_name student,u.name staff FROM audit_log a LEFT JOIN students s ON s.id=a.student_id LEFT JOIN users u ON u.id=a.user_id ORDER BY a.created_at DESC LIMIT 1000`);res.json(rows);}catch(e){next(e)}});

// Client-testing bridge: persist the approved prototype state in MySQL.
// This keeps every current UI workflow persistent while the normalized V2 API is built later.
router.get('/state',async(req,res,next)=>{try{
  const [[row]]=await pool.query('SELECT state_json, updated_at FROM app_state WHERE id=1');
  if(!row)return res.json({exists:false,state:null});
  let state=row.state_json;
  if(typeof state==='string'){try{state=JSON.parse(state)}catch{} }
  res.json({exists:true,state,updatedAt:row.updated_at});
}catch(e){next(e)}});
router.put('/state',async(req,res,next)=>{try{
  const state=req.body?.state;
  if(!state||typeof state!=='object')return res.status(400).json({error:'A valid state object is required'});
  const payload=JSON.stringify(state);
  if(Buffer.byteLength(payload,'utf8')>5*1024*1024)return res.status(413).json({error:'Application state is too large'});
  await pool.query(`INSERT INTO app_state(id,state_json) VALUES(1,CAST(? AS JSON)) ON DUPLICATE KEY UPDATE state_json=CAST(? AS JSON),updated_at=CURRENT_TIMESTAMP`,[payload,payload]);
  res.json({ok:true});
}catch(e){next(e)}});
router.delete('/state',async(req,res,next)=>{try{await pool.query('DELETE FROM app_state WHERE id=1');res.json({ok:true});}catch(e){next(e)}});

module.exports=router;
