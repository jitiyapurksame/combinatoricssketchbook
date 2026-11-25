// Ship progress, hub link, story briefings, lifebelt click fix, emoji safety.
const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs'),path=require('path');
const html=fs.readFileSync(path.join(__dirname,'..','combinatorics-sketchbook.html'),'utf8');
function boot(ls){const errs=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!/scrollTo|navigation/.test(e.message))errs.push(e.message)});
 const dom=new JSDOM(html,{runScripts:'dangerously',virtualConsole:vc,url:'https://x.test/',beforeParse(w){w.scrollTo=()=>{};if(ls)for(const k in ls)w.localStorage.setItem(k,ls[k]);}});return {w:dom.window,errs};}
let fails=0;const ok=(c,m)=>{console.log((c?'  OK   ':'  FAIL ')+m);if(!c)fails++;};
// emoji that fail on Windows 10 / older iPads
ok(!/[\u{1F6DF}\u{1FA9C}\u{1FAE0}-\u{1FAFF}\u{1FA70}-\u{1FA9F}]/u.test(html),'no Emoji 13+ characters that show as empty boxes on older devices');
let {w,errs}=boot({});let d=w.document;
ok(d.querySelector('#hub-link').getAttribute('href')==='https://jj-engineer-port.vercel.app/','hub link on home points at the hub');
ok(d.querySelectorAll('.ship-svg [data-part]').length===16,'ship has 16 parts');
ok(/0 of 16 parts certified — ship 0% built/.test(d.body.textContent),'fresh ship: 0 of 16, 0%');
ok(/Start here: Keel/.test(d.getElementById('ship-next').textContent),'"Start here: Keel" button');
d.getElementById('ship-next').click();ok(d.getElementById('stage-content')&&/Lifebelts/.test(d.getElementById('stage-content').textContent),'Start here opens Ch1');
// lifebelt fix
const chips=d.querySelectorAll('#ch1-s0-items .item-chip');chips[1].click();
ok(d.querySelectorAll('#ch1-s0-items .picked').length===1,'tapped lifebelt stays highlighted');
ok(/Stage 1 done/.test(d.getElementById('ch1-s0-msg').textContent)&&/any of the 3/.test(d.getElementById('ch1-s0-msg').textContent),'message stays and says stage done');
ok(![...d.querySelectorAll('.stage-nav .btn.primary')][0].disabled,'Next Stage unlocked');
// nudge sits right above the nav and knows stage is done
d.querySelector('.stage-nav .amber').click();
const slot=d.getElementById('hint-slot');ok(slot&&slot.nextElementSibling&&slot.nextElementSibling.id==='chapter-stage-nav','hint nudge placed directly above the buttons');
ok(/already done/.test(slot.textContent),'nudge says the stage is done');
// briefings everywhere
let miss=[];for(let c=1;c<=12;c++){w.CSApp.nav('chapter','ch'+c,0);const b=d.querySelector('.brief');if(!b||!b.open||!/Why this matters/.test(b.textContent))miss.push('ch'+c);}
for(const b of ['boss1','boss2','boss3','boss4']){w.CSApp.nav(b);const e=d.querySelector('.brief');if(!e||!e.open)miss.push(b);}
ok(miss.length===0,'story briefing on all 12 chapters + 4 bosses '+JSON.stringify(miss));
w.CSApp.nextStage('ch1',0);ok(d.querySelector('.stage-dot.active')&&/Mental/.test(d.querySelector('.stage-dot.active').textContent),'moved to stage 2');ok(d.querySelector('.brief')&&!d.querySelector('.brief').open,'briefing collapsed on later stages');
ok(/Why this step\?/.test(d.querySelector('.why-line').textContent),'stage "why" line shown');
// themes
const all=[...w.document.querySelectorAll('x')];const txt=html;
for(const t of ['Titanic','Haunted House','VW Beetle','Princess Anna','Cooking = Chemistry','Super Mario'])ok(txt.includes(t),'theme used: '+t);
// progress lights up parts
const P={chapters:{ch1:{stage:4,stars:3,done:true,stageDone:[true,true,true,true,true]},ch2:{stage:2,stars:3,done:false,stageDone:[true,true,false,false,false]}},xp:25,drawMemory:{}};
({w,errs}=boot({cs_progress_v1:JSON.stringify(P)}));d=w.document;
const op=id=>parseFloat(d.querySelector('[data-part="'+id+'"]').style.opacity);
ok(op('ch1')===1&&op('ch2')>0.4&&op('ch2')<1&&op('ch3')===0,'finished part solid, in-progress part partly lit, untouched part blank');
ok(/1 of 16 parts certified/.test(d.body.textContent)&&/Keep building: Hull & Masts/.test(d.getElementById('ship-next').textContent),'meter + "Keep building: Hull Plates"');
const chipsAll=[...d.querySelectorAll('.ship-chip')];ok(chipsAll.length===16&&chipsAll.find(c=>/Rudder/.test(c.textContent)).disabled,'locked boss part is disabled');
chipsAll[1].click();ok(!!d.querySelector('#stage-content'),'part chip opens its chapter');
// all done -> launch
const D={chapters:{},xp:0,drawMemory:{}};for(let i=1;i<=12;i++)D.chapters['ch'+i]={stage:4,stars:3,done:true,stageDone:[true,true,true,true,true]};['boss1','boss2','boss3','boss4'].forEach(b=>D.chapters[b]={stage:4,stars:3,done:true,stageDone:[false,false,false,false,true]});
({w,errs}=boot({cs_progress_v1:JSON.stringify(D)}));d=w.document;
ok(/ALL SYSTEMS GO/.test(d.getElementById('ship-launch').textContent)&&/100%/.test(d.body.textContent),'finished ship says ALL SYSTEMS GO');
ok(errs.length===0,'no script errors '+JSON.stringify(errs.slice(0,2)));
console.log(fails?'\n'+fails+' FAILED':'\nSHIP TESTS PASSED');process.exit(fails?1:0);
