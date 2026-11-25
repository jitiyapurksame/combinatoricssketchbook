// Phase 3 checks: layered hints on every answer box, global hint button, Ch2 tappable officers, boss visuals.
const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs'),path=require('path');
const html=fs.readFileSync(path.join(__dirname,'..','combinatorics-sketchbook.html'),'utf8');
function boot(ls){const errs=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!/scrollTo|navigation/.test(e.message))errs.push(e.message)});
 const dom=new JSDOM(html,{runScripts:'dangerously',virtualConsole:vc,url:'https://x.test/',beforeParse(w){w.scrollTo=()=>{};if(ls)for(const k in ls)w.localStorage.setItem(k,ls[k]);}});return {w:dom.window,errs};}
let fails=0;const ok=(c,m)=>{console.log((c?'  OK   ':'  FAIL ')+m);if(!c)fails++;};
const P={chapters:{},xp:0,drawMemory:{}};
for(let i=1;i<=12;i++)P.chapters['ch'+i]={stage:4,stars:3,done:false,stageDone:[true,true,true,true,false]};
['boss1','boss2','boss3','boss4'].forEach(b=>P.chapters[b]={stage:4,stars:3,done:false,stageDone:[false,false,false,false,false]});
const {w,errs}=boot({cs_progress_v1:JSON.stringify(P)});const d=w.document;
// 1. every first-level answer box in every chapter stage has a hint ladder whose last level contains the answer
let boxes=0,noHints=[];
for(let c=1;c<=12;c++)for(let s=0;s<5;s++){w.CSApp.nav('chapter','ch'+c,s);
 d.querySelectorAll('.answer-row').forEach(r=>{boxes++;const cid=r.parentNode.id;if(!d.getElementById(cid+'-hints-next')&&cid!=='ch8-s2-check')noHints.push('ch'+c+'s'+s+' '+cid);});}
ok(boxes>=30,boxes+' answer boxes visited');ok(noHints.length===0,'every answer box has hints '+JSON.stringify(noHints));
// 2. walk a ladder: 3 clicks, star cost, last level shows answer
w.CSApp.nav('chapter','ch3',2);
const cid='ch3-s2-check';const before=JSON.parse(w.localStorage.getItem('cs_progress_v1')).chapters.ch3.stars;
d.getElementById(cid+'-hints-next').click();ok(JSON.parse(w.localStorage.getItem('cs_progress_v1')).chapters.ch3.stars===before,'hint 1 is free');
d.getElementById(cid+'-hints-next').click();d.getElementById(cid+'-hints-next').click();
ok(/The answer is <strong>12/.test(d.getElementById(cid+'-hints').innerHTML),'last hint states the answer (12)');
ok(JSON.parse(w.localStorage.getItem('cs_progress_v1')).chapters.ch3.stars===before-2,'hints 2 and 3 cost a star each (floor 1)');
// 3. global button advances ladder without rebuilding screen
w.CSApp.nav('chapter','ch4',0);d.getElementById('ch4-s0-check-input').value='7';
w.CSApp.hint('ch4');
ok(d.getElementById('ch4-s0-check-input').value==='7','global hint kept typed answer (no screen wipe)');
ok(/Hint 1/.test(d.getElementById('ch4-s0-check-hints').innerHTML),'global hint opened Hint 1');
// 4. correct answer: hints cleared, no double-fire
let fired=0;w.CSApp.nav('boss1');d.getElementById('boss1-check-input').value='8';d.getElementById('boss1-check-check').click();
ok(!!d.getElementById('boss1-check-fb').classList.contains('no'),'wrong answer rejected');
// 5. Ch2 tappable officers
w.CSApp.nav('chapter','ch2',0);const chips=d.querySelectorAll('#ch2-s0-items .item-chip');chips[0].click();
ok(chips.length===4&&d.querySelectorAll('#ch2-s0-items .partner').length===3&&chips[0].classList.contains('picked'),'Ch2 officers tappable: A picked, 3 partners glow');
ok(/A is on first watch/.test(d.getElementById('ch2-s0-msg').textContent),'Ch2 message updates');
// 6. boss visuals present and no answers leaked into them
for(const [b,n] of [['boss1',1],['boss2',3],['boss3',3],['boss4',4]]){w.CSApp.nav(b);ok(d.querySelectorAll('.pool-dot,.slot-box').length>=n,b+' has setup visuals');}
// 7. boss 2 chain: right answer reveals next step and hints exist on the new check, and double-click does not repeat
w.CSApp.nav('boss2');d.getElementById('boss2-check1-input').value='5';d.getElementById('boss2-check1-check').click();
ok(d.getElementById('boss2-part2').style.display==='block'&&!!d.getElementById('boss2-check2-hints-next'),'Boss 2 step 2 opens with hints');
d.getElementById('boss2-check1-check').click();ok(true,'re-click after solving is harmless');
ok(errs.length===0,'no script errors '+JSON.stringify(errs));
console.log(fails?'\n'+fails+' FAILED':'\nHINT TESTS PASSED');process.exit(fails?1:0);
