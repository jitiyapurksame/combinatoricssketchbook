const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs');
const html=fs.readFileSync(process.argv[2]||''+require('path').join(__dirname,'..','combinatorics-sketchbook.html')+'','utf8');
function boot(ls){const errs=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>errs.push('JSDOMERR '+e.message));vc.on('error',e=>errs.push('ERR '+e));
 const dom=new JSDOM(html,{runScripts:'dangerously',virtualConsole:vc,url:'https://x.test/',beforeParse(w){w.alert=()=>{};w.HTMLCanvasElement.prototype.getContext=()=>({scale(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},clearRect(){}});
  if(ls)for(const k in ls)w.localStorage.setItem(k,ls[k]);}});
 return {dom,errs};}
// 1 every stage renders
let {dom,errs}=boot();let w=dom.window;
const ids=[...Array(12)].map((_,i)=>'ch'+(i+1));
for(const c of ids){const st={stage:4,stars:3,done:false,stageDone:[true,true,true,true,false]};
 const p=JSON.parse(w.localStorage.getItem('cs_progress_v1')||'{"chapters":{},"xp":0,"drawMemory":{}}');p.chapters[c]=st;w.localStorage.setItem('cs_progress_v1',JSON.stringify(p));}
console.log('boot errs',errs);
const P={chapters:{},xp:0,drawMemory:{}};
ids.concat(['boss1','boss2','boss3','boss4']).forEach(c=>P.chapters[c]={stage:4,stars:3,done:false,stageDone:[true,true,true,true,false]});
({dom,errs}=boot({cs_progress_v1:JSON.stringify(P)}));w=dom.window;
let bad=[];
for(const c of ids)for(let s=0;s<5;s++){try{w.CSApp.nav('chapter',c,s);const sc=w.document.getElementById('stage-content');if(!sc||sc.innerHTML.length<50)bad.push(c+' s'+s+' empty');}catch(e){bad.push(c+' s'+s+' THROW '+e.message)}}
for(const b of ['boss1','boss2','boss3','boss4','mastermap','errorlog','home'])try{w.CSApp.nav(b);}catch(e){bad.push(b+' THROW '+e.message)}
for(const c of ids)try{w.CSApp.nav('drawmemory',c)}catch(e){bad.push('draw '+c+' '+e.message)}
console.log('render problems',bad,errs);
// hint behaviour: stars + wipe
const q=w.localStorage;
w.CSApp.nav('chapter','ch2',1);const before=JSON.parse(q.getItem('cs_progress_v1')).chapters.ch2.stars;
w.CSApp.hint('ch2');w.CSApp.hint('ch2');w.CSApp.hint('ch2');
console.log('stars after 3 global hints',before,'->',JSON.parse(q.getItem('cs_progress_v1')).chapters.ch2.stars);
// global hint on boss
w.CSApp.nav('boss1');w.CSApp.hint('boss1');console.log('boss1 route after hint', w.document.getElementById('boss1-lb')?'ok':'missing');
// Missing-id check: boss2 chain wiped by hint?
w.CSApp.nav('boss2');w.document.getElementById('boss2-check1-input').value=5;w.document.getElementById('boss2-check1-check').click();
console.log('boss2 part2 visible before hint',w.document.getElementById('boss2-part2').style.display);
w.CSApp.hint('boss2');console.log('boss2 part2 visible after hint',w.document.getElementById('boss2-part2').style.display);
// corrupted saves
for(const bad of ['null','[]','{"chapters":null}','{"xp":5}','{not json']){
 const r=boot({cs_progress_v1:bad});let m=r.errs.slice();try{r.dom.window.CSApp.nav('chapter','ch1',0);r.dom.window.CSApp.nav('mastermap')}catch(e){m.push('THROW '+e.message)}
 console.log('corrupt',bad,'=>',m.length?m.slice(0,2):'ok', 'body len',r.dom.window.document.body.innerHTML.length);}
for(const bad of ['null','{"a":1}','"str"']){const r=boot({cs_errorlog_v1:bad});let m=r.errs.slice();try{r.dom.window.CSApp.nav('errorlog')}catch(e){m.push('THROW '+e.message)}console.log('corrupt errlog',bad,m.length?m.slice(0,1):'ok')}
