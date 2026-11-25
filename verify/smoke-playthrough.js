// Automated playthrough: solves every answer-box chain (stage 4 Cambridge+Stretch in all 12 chapters, all 4 bosses)
// using the hint ladder, and checks chapters/bosses end up DONE, XP is awarded once, and victory shows.
const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs'),path=require('path');
const html=fs.readFileSync(path.join(__dirname,'..','combinatorics-sketchbook.html'),'utf8');
const errs=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!/scrollTo|navigation/.test(e.message))errs.push(e.message)});
const seed={chapters:{},xp:0,drawMemory:{}};for(let i=1;i<=12;i++)seed.chapters['ch'+i]={stage:4,stars:3,done:false,stageDone:[true,true,true,true,false]};
const dom=new JSDOM(html,{runScripts:'dangerously',virtualConsole:vc,url:'https://x.test/',beforeParse(w){w.scrollTo=()=>{};w.localStorage.setItem('cs_progress_v1',JSON.stringify(seed));}});
const w=dom.window,d=w.document;let fails=0;const ok=(c,m)=>{console.log((c?'  OK   ':'  FAIL ')+m);if(!c)fails++;};
function solveAll(){let n=0;
 for(let guard=0;guard<12;guard++){
  const rows=[...d.querySelectorAll('.answer-row')].filter(r=>{const i=r.querySelector('input');return i&&!i.disabled&&r.offsetParent!==undefined;});
  const row=rows.find(r=>d.getElementById(r.parentNode.id+'-hints-next'));
  if(!row)break;const cid=row.parentNode.id;
  for(let k=0;k<3;k++){const b=d.getElementById(cid+'-hints-next');if(b)b.click();}
  const m=/The answer is <strong>(-?\d+)<\/strong>/.exec(d.getElementById(cid+'-hints').innerHTML);
  if(!m){fails++;console.log('  FAIL no answer in ladder for '+cid);break;}
  d.getElementById(cid+'-input').value=m[1];d.getElementById(cid+'-check').click();n++;}
 return n;}
const read=()=>JSON.parse(w.localStorage.getItem('cs_progress_v1'));
let total=0;const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
for(let c=1;c<=12;c++){w.CSApp.nav('chapter','ch'+c,4);const n=solveAll();total+=n;
 ok(n>=2&&read().chapters['ch'+c].done===true,'ch'+c+' stage 4: '+n+' answers solved, chapter done');}
const xp1=read().xp;
for(let c=1;c<=12;c++){w.CSApp.nav('chapter','ch'+c,4);solveAll();}
ok(read().xp===xp1,'replaying all chapters does not add XP ('+xp1+')');
for(const [b,min] of [['boss1',1],['boss2',4],['boss3',4],['boss4',5]]){w.CSApp.nav(b);const n=solveAll();await sleep(400);
 ok(n>=min&&read().chapters[b].done===true,b+': '+n+' steps solved, boss defeated');
 ok(!!d.getElementById('victory-overlay'),b+' shows victory card');d.getElementById('victory-ok')&&d.getElementById('victory-ok').click();}
ok(read().chapters.ch2.stars===1,'stars floor at 1 after heavy hint use');
w.CSApp.nav('mastermap');ok(d.body.innerHTML.length>1000,'Master Map renders after everything is done');
w.CSApp.nav('home');ok(/12 of 12|12\/12|Master Map/i.test(d.body.textContent),'home renders after completion');
ok(errs.length===0,'no script errors '+JSON.stringify(errs.slice(0,2)));
console.log(fails?'\n'+fails+' FAILED':'\nPLAYTHROUGH PASSED ('+total+' chapter answers)');process.exit(fails?1:0);
})();
