// Draw-From-Memory: drawing saved, reloaded, backed up and restored; hostile drawings rejected.
const {JSDOM,VirtualConsole}=require('jsdom');const fs=require('fs'),path=require('path');
const html=fs.readFileSync(path.join(__dirname,'..','combinatorics-sketchbook.html'),'utf8');
const PNG='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==';
function boot(ls){const errs=[];const calls={drawImage:0,fill:0};const vc=new VirtualConsole();vc.on('jsdomError',e=>{if(!/scrollTo|navigation/.test(e.message))errs.push(e.message)});
 const dom=new JSDOM(html,{runScripts:'dangerously',virtualConsole:vc,url:'https://x.test/',beforeParse(w){w.scrollTo=()=>{};
  w.HTMLCanvasElement.prototype.getContext=()=>({scale(){},beginPath(){},moveTo(){},lineTo(){},stroke(){},clearRect(){},fillRect(){calls.fill++},drawImage(){calls.drawImage++}});
  w.HTMLCanvasElement.prototype.toDataURL=()=>PNG;
  if(ls)for(const k in ls)w.localStorage.setItem(k,ls[k]);}});return {w:dom.window,errs,calls};}
let fails=0;const ok=(c,m)=>{console.log((c?'  OK   ':'  FAIL ')+m);if(!c)fails++;};
(async()=>{
 let {w,errs,calls}=boot({});let d=w.document;
 w.CSApp.nav('drawmemory','ch2');ok(calls.fill>0,'pad paints a white page');
 d.getElementById('pad-done').click();
 const saved=JSON.parse(w.localStorage.getItem('cs_drawings_v1')||'{}');
 ok(saved.ch2===PNG,'drawing saved on finish');
 ok(JSON.parse(w.localStorage.getItem('cs_progress_v1')).drawMemory.ch2===true,'completion flag still set');
 // reopening loads it (Image onload is not fired in jsdom, so check the note + src path)
 w.CSApp.nav('drawmemory','ch2');ok(d.getElementById('pad-saved-note').style.display==='block','reopen shows "saved drawing loaded"');
 w.CSApp.nav('drawmemory','ch3');ok(d.getElementById('pad-saved-note').style.display==='none','other chapter starts blank');
 // backup round trip includes drawings
 let blob=null;w.URL.createObjectURL=b=>{blob=b;return 'blob:x'};w.HTMLAnchorElement.prototype.click=function(){};
 w.CSApp.nav('home');d.getElementById('bk-export').click();await new Promise(r=>setTimeout(r,20));
 const text=await new Promise(r=>{const fr=new w.FileReader();fr.onload=()=>r(fr.result);fr.readAsText(blob)});
 ok(JSON.parse(text).drawings.ch2===PNG,'backup file contains the drawing');
 const b2=boot({});w=b2.w;d=w.document;
 const inp=d.getElementById('bk-file');Object.defineProperty(inp,'files',{value:[new w.File([text],'b.json')],configurable:true});inp.dispatchEvent(new w.Event('change'));await new Promise(r=>setTimeout(r,30));
 ok(/1 saved drawings/.test(d.getElementById('bk-preview').textContent),'preview counts drawings');
 d.getElementById('bk-confirm').click();await new Promise(r=>setTimeout(r,30));
 ok(JSON.parse(w.localStorage.getItem('cs_drawings_v1')).ch2===PNG,'drawing restored');
 // hostile drawings
 const h=boot({cs_drawings_v1:JSON.stringify({ch1:'javascript:alert(1)',ch2:'data:image/svg+xml;base64,AAAA',chX:PNG,ch5:PNG})});
 w=h.w;w.CSApp.nav('drawmemory','ch5');
 const clean=Object.keys(JSON.parse(w.localStorage.getItem('cs_drawings_v1')));
 ok(clean.length===4,'raw storage untouched until a save');
 w.CSApp.nav('drawmemory','ch1');w.document.getElementById('pad-done').click();
 const after=JSON.parse(w.localStorage.getItem('cs_drawings_v1'));
 ok(Object.keys(after).sort().join()==='ch1,ch5','hostile entries (script, svg, unknown chapter) dropped on next save');
 ok(errs.length===0&&h.errs.length===0,'no script errors');
 console.log(fails?'\n'+fails+' FAILED':'\nDRAWING TESTS PASSED');process.exit(fails?1:0);
})();
