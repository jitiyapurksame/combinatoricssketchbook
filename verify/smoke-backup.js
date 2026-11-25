// Round-trip test of the backup system in jsdom: export -> wipe -> restore, plus bad files.
const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs'),path=require('path');
const html=fs.readFileSync(path.join(__dirname,'..','combinatorics-sketchbook.html'),'utf8');
function boot(ls){const errs=[];const vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!/scrollTo|navigation/.test(e.message))errs.push(e.message)});
 const dom=new JSDOM(html,{runScripts:'dangerously',virtualConsole:vc,url:'https://x.test/',beforeParse(w){w.scrollTo=()=>{};if(ls)for(const k in ls)w.localStorage.setItem(k,ls[k]);}});return {w:dom.window,errs};}
const sleep=ms=>new Promise(r=>setTimeout(r,ms));let fails=0;const ok=(c,m)=>{console.log((c?'  OK   ':'  FAIL ')+m);if(!c)fails++;};
(async()=>{
 const P={chapters:{ch1:{stage:4,stars:2,done:true,stageDone:[true,true,true,true,true]},boss1:{stage:4,stars:3,done:true,stageDone:[false,false,false,false,true]}},xp:55,drawMemory:{ch1:true}};
 let {w,errs}=boot({cs_progress_v1:JSON.stringify(P),cs_errorlog_v1:JSON.stringify([{code:'A',note:'misread',ts:1}])});
 let captured=null;w.URL.createObjectURL=b=>{captured=b;return 'blob:x'};w.HTMLAnchorElement.prototype.click=function(){};
 ok(!!w.document.getElementById('bk-nudge'),'nudge shows when progress exists and no backup');
 w.document.getElementById('bk-export').click();await sleep(20);
 ok(!!captured,'export produced a file');
 const text=await new Promise(r=>{const fr=new w.FileReader();fr.onload=()=>r(fr.result);fr.readAsText(captured)});
 ok(JSON.parse(text).progress.xp===55,'file contains progress');
 // fresh device
 const b2=boot({});w=b2.w;errs=b2.errs;
 async function pick(content){const inp=w.document.getElementById('bk-file');const f=new w.File([content],'b.json',{type:'application/json'});
  Object.defineProperty(inp,'files',{value:[f],configurable:true});inp.dispatchEvent(new w.Event('change'));await sleep(30);}
 await pick('not json');ok(/valid JSON/.test(w.document.getElementById('bk-status').textContent),'rejects non-JSON');
 await pick('{"app":"other"}');ok(/doesn't look like/.test(w.document.getElementById('bk-status').textContent),'rejects wrong app file');
 await pick(text);ok(/55 XP/.test(w.document.getElementById('bk-preview').textContent),'preview shows contents');
 w.document.getElementById('bk-confirm').click();await sleep(30);
 const saved=JSON.parse(w.localStorage.getItem('cs_progress_v1'));
 ok(saved.xp===55&&saved.chapters.ch1.done&&saved.chapters.boss1.done,'progress restored to storage');
 ok(JSON.parse(w.localStorage.getItem('cs_errorlog_v1')).length===1,'error log restored');
 ok(/restored/.test(w.document.getElementById('bk-status').textContent),'success message shown');
 ok(errs.length===0,'no script errors '+JSON.stringify(errs));
 // hostile file
 await pick(JSON.stringify({app:'jj-combinatorics-sketchbook-backup',progress:{chapters:{ch1:null,ch2:{stars:99,stage:'x'}},xp:'lots'},errorLog:'no'}));
 w.document.getElementById('bk-confirm').click();await sleep(30);
 ok(JSON.parse(w.localStorage.getItem('cs_progress_v1')).chapters.ch2.stars===3,'hostile values sanitized');
 console.log(fails?'\n'+fails+' FAILED':'\nBACKUP TESTS PASSED');process.exit(fails?1:0);
})();
