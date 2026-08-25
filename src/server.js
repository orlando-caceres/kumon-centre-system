require('dotenv').config();
const path=require('path'); const express=require('express'); const helmet=require('helmet');
const api=require('./routes/api'); const app=express();
app.use(helmet({contentSecurityPolicy:false})); app.use(express.json({limit:'1mb'}));
app.use('/api',api); app.use(express.static(path.join(__dirname,'..','public')));
app.get('*',(req,res)=>res.sendFile(path.join(__dirname,'..','public','index.html')));
app.use((err,req,res,next)=>{console.error(err);res.status(err.status||500).json({error:err.message||'Server error'});});
const port=Number(process.env.PORT||3000); app.listen(port,()=>console.log(`Kumon system running at http://localhost:${port}`));
