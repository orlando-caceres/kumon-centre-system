require('dotenv').config();
const fs=require('fs'); const path=require('path'); const mysql=require('mysql2/promise');
(async()=>{let conn;try{
  conn=await mysql.createConnection({host:process.env.DB_HOST||'127.0.0.1',port:Number(process.env.DB_PORT||3306),user:process.env.DB_USER,password:process.env.DB_PASSWORD,multipleStatements:true});
  const sql=fs.readFileSync(path.join(__dirname,'..','sql','migration-v1.1.sql'),'utf8');
  await conn.query(sql); console.log('V1.1 migration complete: app_state table is ready.');
}catch(e){console.error('Migration failed:',e.message);process.exitCode=1;}finally{if(conn)await conn.end();}})();
