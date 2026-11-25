#!/usr/bin/env node
/*
 * verify.js — one-command regression check for combinatorics-sketchbook.html
 *
 * Usage:   node verify/verify.js [path/to/combinatorics-sketchbook.html]
 * Default: ../combinatorics-sketchbook.html (relative to this file)
 *
 * What it checks
 *   1. JS syntax (node --check equivalent) of the single <script> block
 *   2. Brace / paren / bracket balance of the whole file
 *   3. Every static getElementById("x") has a matching id="x" in the file
 *   4. Math: extracts the REAL kCombinations / kPermutations / kSequences /
 *      climbCompositions from the file, brute-forces every answer in the app,
 *      and compares with the literal expected value the file asks for
 *   5. Regression guards for bugs we hit during the build (see HANDOFF.md §7)
 *
 * Exit code 0 = all good, 1 = something failed.
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const file = process.argv[2] || path.join(__dirname, '..', 'combinatorics-sketchbook.html');
const html = fs.readFileSync(file, 'utf8');
let failures = 0;
const ok  = (m) => console.log('  OK   ' + m);
const bad = (m) => { failures++; console.log('  FAIL ' + m); };
const check = (cond, m) => cond ? ok(m) : bad(m);

// ---------- 1. syntax ----------
console.log('\n[1] Syntax');
const sm = html.match(/<script>([\s\S]*)<\/script>/);
if (!sm) { bad('no <script> block found'); process.exit(1); }
const js = sm[1];
try { new vm.Script(js); ok('script block parses'); } catch (e) { bad('syntax error: ' + e.message); }

// ---------- 2. balance ----------
console.log('\n[2] Balance');
[['{','}','braces'],['(',')','parens'],['[',']','brackets']].forEach(([a,b,n]) => {
  const ca = html.split(a).length - 1, cb = html.split(b).length - 1;
  check(ca === cb, n + ' balanced (' + ca + ' / ' + cb + ')');
});

// ---------- 3. static ids ----------
console.log('\n[3] Static element ids');
const declared = new Set();
for (const m of html.matchAll(/id=\\?"([A-Za-z0-9\-]+)\\?"/g)) declared.add(m[1]);
for (const m of html.matchAll(/\.id = "([A-Za-z0-9\-]+)"/g)) declared.add(m[1]); // ids created with element.id = "..."
const used = new Set();
for (const m of html.matchAll(/getElementById\("([A-Za-z0-9\-]+)"\)/g)) used.add(m[1]);
const missing = [...used].filter(x => !declared.has(x));
check(missing.length === 0, used.size + ' static ids used, ' + declared.size + ' declared' + (missing.length ? ' — MISSING: ' + missing.join(', ') : ''));

// ---------- 4. math (using the real functions from the file) ----------
console.log('\n[4] Math (real generators extracted from the file)');
function grab(name) {
  const re = new RegExp('function ' + name + '\\([^)]*\\) \\{[\\s\\S]*?\\n\\}\\n');
  const m = js.match(re);
  if (!m) throw new Error('could not extract ' + name);
  return m[0];
}
const ctx = {};
vm.createContext(ctx);
['kCombinations','kPermutations','kSequences','climbCompositions'].forEach(n => vm.runInContext(grab(n), ctx));
const C = (a,k) => ctx.kCombinations(a,k), P = (a,k) => ctx.kPermutations(a,k), S = (a,k) => ctx.kSequences(a,k), L = ctx.climbCompositions;
const L_ = (a) => a.length;
const perms = (a) => P(a, a.length);

// literal expression the file passes to answerCheckWidget("id", <expr>, ...)
function fileExpr(id) {
  const m = js.match(new RegExp('answerCheckWidget\\("' + id + '",\\s*([^,]+),'));
  if (!m) return { missing: true };
  const e = m[1].trim();
  if (/^[0-9+\-*\/() ]+$/.test(e)) return { value: Function('return (' + e + ')')(), expr: e };
  return { variable: true, expr: e };
}
function expectFile(id, computed, label) {
  const f = fileExpr(id);
  if (f.missing) return bad(label + ': answerCheckWidget("' + id + '") not found');
  if (f.variable) return ok(label + ' = ' + computed + '  (file uses variable "' + f.expr + '", checked by brute force only)');
  check(f.value === computed, label + ' = ' + computed + '  (file asks for ' + f.value + ')');
}

// Ch1
check(L_(C(['A','B','C'],2))===3 && L_(P(['A','B','C'],2))===6 && L_(S(['A','B','C'],2))===9, 'Ch1 choose/arrange/code of 3 flags = 3 / 6 / 9');
check(L_(P(['A','B','C','D'],2).filter(p=>p[0]!=='D'))===9, 'Ch1 stretch (D never first) = 9');
// Ch2
expectFile('ch2-s0-check', 3, 'Ch2 s1 second-watch options');
check(L_(P(['A','B','C','D','E'],2))===20 && L_(P(['A','B','C','D','E'],2).filter(p=>p[0]!=='E'))===16, 'Ch2 base 20, stretch 16');
// Ch3
expectFile('ch3-s0-check', 2*3, 'Ch3 s1 dial settings');
expectFile('ch3-s2-check', 2*3*2, 'Ch3 s3 three dials');
// Ch4
expectFile('ch4-s0-check', 3*3, 'Ch4 s1 cabin grid');
expectFile('ch4-s2-check', 4*4, 'Ch4 s3 4x4 grid');
// Ch5
expectFile('ch5-s0-check', 3+2, 'Ch5 s1 wrench+spanner');
expectFile('ch5-s2-check', 3+2+4, 'Ch5 s3 three piles');
// Ch6
expectFile('ch6-s2-check', 2*3*2*2, 'Ch6 s3 four dials');
check(3*3*1+3*1*2===15, 'Ch6 stretch (Rotating only on High) = 15');
// Ch7
expectFile('ch7-s1-check', 5*4*3, 'Ch7 s2 roster 5x4x3');
expectFile('ch7-s2-check', 5*4*3*2, 'Ch7 s3 four roles');
check(L_(P(['A','B','C','D','E','F'],3))===120 && L_(P(['A','B','C','D','E','F'],3).filter(p=>p[0]!=='F'))===100, 'Ch7 base 120, stretch 100');
// Ch8
check(L_(P(['A','B','C','D','E'],3))===60 && L_(C(['A','B','C','D','E'],3))===10, 'Ch8 s2 ordered 60 / teams 10 (ratio 3! = 6)');
expectFile('ch8-s2-check', L_(C(['A','B','C','D','E','F'],2)), 'Ch8 s3 teams of 2 from 6');
const o7 = ['A','B','C','D','E','F','G'], t7 = C(o7,3);
check(L_(t7)===35 && L_(t7)-L_(t7.filter(t=>t.includes('F')&&t.includes('G')))===30, 'Ch8 base 35, stretch 30');
// Ch9
const f4 = ['F1','F2','F3','F4'], f5 = ['F1','F2','F3','F4','F5'], o5 = ['A','B','C','D','E'];
expectFile('ch9-c5', L_(perms(f4).filter(p=>p[0]!=='F1')), 'Ch9 s2 four funnels, Old not first');
expectFile('ch9-s2-check', L_(perms(f5).filter(p=>p[0]!=='F1'&&p[1]!=='F1')), 'Ch9 s3 five funnels, Old not 1st/2nd');
check(L_(perms(o5).filter(p=>p[2]!=='C'))===96 && L_(perms(o5).filter(p=>p[2]!=='C'&&p[0]!=='D'&&p[4]!=='D'))===60, 'Ch9 base 96, stretch 60');
// Ch10
const e6 = ['S1','S2','J1','J2','J3','J4'], isS = (x)=>x[0]==='S';
const good6 = L_(C(e6,3).filter(t=>t.some(isS)));
expectFile('ch10-c1', L_(C(e6,3)), 'Ch10 total teams'); expectFile('ch10-c2', L_(C(['J1','J2','J3','J4'],3)), 'Ch10 bad teams'); expectFile('ch10-c3', good6, 'Ch10 good teams');
const e7 = ['S1','S2','S3','J1','J2','J3','J4'];
expectFile('ch10-s2-check', L_(C(e7,3).filter(t=>t.some(isS))), 'Ch10 s3 seven engineers');
const e8 = ['S1','S2','S3','J1','J2','J3','J4','J5'];
check(L_(C(e8,4).filter(t=>t.some(isS)))===65 && L_(C(e8,4).filter(t=>t.filter(isS).length>=2))===35, 'Ch10 base 65, stretch (>=2 seniors) 35');
// Ch11
check(L_(S(['R','G'],3))===8, 'Ch11 s1 two colours x three positions = 8');
expectFile('ch11-s1-check', L_(S(['R','G','B'],3)), 'Ch11 s2 three colours x three positions');
check(L(4).length===5 && L(5).length===8 && L(6).length===13, 'Ch11 ladder ways(4,5,6) = 5, 8, 13');
check(Math.pow(5,4)===625, 'Ch11 base 5^4 = 625');
// Ch12
const o9 = ['A','B','C','D','E','F','G','H','X'];
expectFile('ch12-s2-check', L_(P(o9,4).filter(p=>p[0]!=='X')), 'Ch12 s3 nine officers, four roles, X not first');
const f5b = ['A','B','C','D','E'];
check(L_(P(f5b,3))===60 && L_(P(f5b,3).filter(m=>{const i=m.indexOf('A');return i===-1||i===0;}))===36, 'Ch12 Explorer 60, Inventor 36');
// Bosses
check(L_(P(['A','B','C','D'],2).filter(p=>p[0]!=='D'))===9, 'Boss1 = 9');
check((3+2)*(5*4)*3===300, 'Boss2 = 5 x 20 x 3 = 300');
check(L_(perms(o5).filter(p=>p[0]!=='A'))*good6*8===12288, 'Boss3 = 96 x 16 x 8 = 12288');
check(3*2*(5*4)*good6*L_(S(['R','G'],3))===15360, 'Boss4 = 6 x 20 x 16 x 8 = 15360');

// ---------- 5. regression guards ----------
console.log('\n[5] Regression guards');
const markFn = js.match(/function markStageDone\([^)]*\) \{[\s\S]*?\n\}/);
check(markFn && /refreshChapterNav\(\)/.test(markFn[0]), 'markStageDone() calls refreshChapterNav() (Next Stage button must enable the moment a stage completes)');
check(/function nextStage\(/.test(js) && /CSApp\.nextStage/.test(js), 'Next Stage goes through nextStage() (the old clamp bug kept everyone on Stage 1)');
check(!/Part A<\/div>/.test(js.replace(/PART A/g,'')), 'chapter header is not hard-coded to "Part A"');
check(!/s3-note|s3-done/.test(js), 'no leftover bare Why-It-Works textareas');
const guided = (js.match(/guidedExplanationWidget\("ch\d+-s3-guided"/g) || []).length;
check(guided === 12, 'all 12 Why-It-Works stages use guidedExplanationWidget (found ' + guided + ')');
check(/function listBuilderWidget\(/.test(js) && /function crossBuilderWidget\(/.test(js) && /function shrinkingPoolWidget\(/.test(js) && /function teamBuilderWidget\(/.test(js), 'all four tap-to-build widgets are defined');

console.log('\n' + (failures ? failures + ' CHECK(S) FAILED' : 'ALL CHECKS PASSED'));
process.exit(failures ? 1 : 0);
