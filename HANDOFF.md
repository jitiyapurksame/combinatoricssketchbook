# Combinatorics Sketchbook — HANDOFF

Last updated: 22 Nov 2026 · Part of J.J.'s Engineering Academy
Live: https://combinatoricssketchbook.vercel.app/ · File: `combinatorics-sketchbook.html` (single file, ~3,100 lines, ~159 KB, vanilla JS, no build step)

---

## 0. Status in one paragraph

All content is built and deployed: **12 chapters in 4 Parts, 4 Boss Battles, a Master Map finale, a Draw-From-Memory pad and an Error Log.** Every number in the app was brute-force verified with `verify/verify.js` (all checks pass). The app has been **playtested on J.J.'s iPad only on a handful of screens** (Ch1, 2, 3, 4, 7, 8, 12 — via screenshots), and every playtest round so far found a real problem, so treat the rest as **unplaytested**. Work now is playtest-driven polish, not new content. The biggest known gap is **hints** (§10, item 1).

---

## 1. Start the next conversation like this

Upload: this zip (or `HANDOFF.md` + `combinatorics-sketchbook.html`) and, if you have any, new screenshots from J.J.'s iPad. Then paste:

> Continue the Combinatorics Sketchbook from HANDOFF.md. Read §2 (house rules), §7 (gotchas) and §10 (open issues) first. Start with open issue #1 (layered hints on every answer-check stage). Run `node verify/verify.js` before and after every batch. Deliver the updated `combinatorics-sketchbook.html` plus the `verify/` folder as a zip.

Working style that has worked well: small verifiable batches, "go ahead" to continue, plan first before big changes, screenshot-driven bug reports traced to real root causes.

---

## 2. Learner and house rules (do not break these)

- **Learner:** J.J., 12-year-old boy with ADHD, uses an iPad. Interests: ocean liners/Titanic engineering (dominant theme), chemistry/experiments and Super Mario (secondary).
- **Language:** English only. Short sentences, concrete, encouraging, engineering vocabulary ("Step 1 beats perfection", "Chief Engineer", "blueprint").
- **Method:** Singapore CPA applied to Cambridge level. Stage order is fixed: **Visual Model → Mental Strategy → General Rule → Why It Works → Competition Challenge** (Challenge = Cambridge question, then a locked-until-solved Olympiad "stretch").
- **Stage 1 is concrete-first:** open with objects J.J. physically taps (chips, dials, grid picks) *before* any counting question or answer box. Never "text + bare answer box".
- **Anti-freeze:** every problem stage has a low-shame escape hatch. Hints are progressive — strategy first, answer last, **the final hint level must state the answer outright**. Stars go 3→2→1, never 0.
- **ADHD pacing:** max one bonus stage per mission; don't stack optional stages; show 3 items by default where lists are long.
- **Explaining is hard for him:** Why-It-Works uses tap-to-build sentences (`guidedExplanationWidget`) with a "type my own" fallback — keep it.
- **Visual aids illustrate the *setup*, never the *answer being asked*.** (Ch7 S2 may show 5→4→3 because the text already states it; Ch9/10/12 only show who is in the pool / who is restricted.) Competition Challenge and Boss stages are assessments — leave them un-scaffolded.
- **Theme:** Titanic dominant everywhere; chemistry and Mario only in Competition Challenge variants.
- **Look & feel:** navy `#0E2A45`, parchment `#F1ECDD`, brass `#D9A441`, Space Mono, dashed blueprint borders, faint grid background. iPad: ≥44 px touch targets, `viewport-fit=cover`, Apple web-app meta tags.

---

## 3. Package contents and deploying

```
combinatorics-sketchbook-handoff/
├── combinatorics-sketchbook.html   ← the whole app
├── HANDOFF.md                      ← this file
├── README.md                       ← 1-page quick start
└── verify/
    └── verify.js                   ← one-command regression + math check
```

Deploy: replace the deployed file's contents with `combinatorics-sketchbook.html`. (Vercel serves `index.html` at the site root — if your deployed project uses that name, copy this file in under that name.) Progress lives in the iPad's `localStorage`, so redeploying does not erase it **as long as the site URL stays the same**.

**Do not deploy `index-hub-preview.html` from the earlier sessions** — it was built from an older copy of the hub. The current hub (`index.html`, jj-engineer-port.vercel.app) already lists this app (clipper ship, "Dry dock", old description).

---

## 4. Architecture (find things by function name, not line number)

Everything is one IIFE in one `<script>`. Function declarations are hoisted, so order in the file doesn't matter.

**State** — `PROGRESS = { chapters: { <id>: { stage, stars, done, stageDone[5] } }, xp, drawMemory }`
- localStorage keys: `cs_progress_v1` (progress), `cs_errorlog_v1` (error log)
- `getChapterState(id)` creates a record on first use. Boss records use ids `boss1`–`boss4`.
- `stage` = highest *unlocked* stage; `stageDone[i]` = stage i completed; `done` is set when stage 4 completes.

**Routing** — `route = { view, chapterId, stage }`; `nav(view, chapterId, stage)` sets it and calls `render()`. Views: `home`, `chapter`, `boss1..boss4`, `drawmemory`, `errorlog`, `mastermap`. Inline `onclick="CSApp.xxx(...)"` calls the public API `window.CSApp = { nav, hint, nextStage }`.

**Chapter screen** — `renderChapter` writes three regions: `#chapter-chrome` (stars + stage tracker), `#stage-content` (the stage), `#chapter-stage-nav` (Back / hint / Next Stage). `refreshChapterNav()` redraws only chrome + nav, never the stage content. **`markStageDone()` calls it**, which is why the Next Stage button enables the instant a stage is completed.

**Data tables** — `CHAPTERS` (id, part, num, emoji, title, subtitle), `PARTS` (A–D, each with its boss), `BOSS1..BOSS4`, `CHAPTER_STAGES` (`ch1..ch12 → array of 5 functions (chId, root)`), `TOOL_DEFS` (Ch12), `DRAW_PROMPTS`, `STAGE_LABELS`, `ERR_TYPES`.

**Generators (the single source of mathematical truth)** — `kCombinations`, `kPermutations`, `kSequences`, `climbCompositions`, `factorial`. Never hard-code an answer you can compute from these.

### Widget catalog

| Widget | Use |
|---|---|
| `listBuilderWidget(id, items, k, mode, chId, onAllFound)` | tap k chips to build every combo/perm/seq (`'combo'`,`'perm'`,`'seq'`); "Stuck? Reveal one (costs a star)" |
| `crossBuilderWidget(id, groups, chId, onAllFound)` | tap one option per dial group (cartesian product) |
| `shrinkingPoolWidget(id, pool, slots, onComplete)` | tap into ordered role slots; each pick leaves the pool |
| `teamBuilderWidget(id, pool, size, onComplete)` | tap an unordered team, shown sorted |
| `answerCheckWidget(id, correct, onCorrect)` | number box + Check |
| `guidedExplanationWidget(id, chId, stageIdx, tokens)` | tap-to-build sentence; `tokens` = `{t:'text'}` / `{t:'blank', options:[3 equivalent phrasings]}`; "type my own" fallback |
| `progressiveHintWidget(id, chId, levels)` | stacking hints; 1st free, later ones cost a star; last level must state the answer |
| `poolShrinkVisualHtml(pool, pickedSeq, roleLabels)` | coloured dots disappearing step by step |
| `restrictedPoolVisualHtml(items, [{item,note}])` | dots with the restricted one badged 🚫 |
| `categorizedPoolVisualHtml(A,labelA,colA,B,labelB,colB)` | two coloured groups (e.g. Seniors/Juniors) |
| `buildTreeSVG(root, level1, level2ByParent, width)` | live tree diagram (Ch3) |

---

## 5. Chapter map

| Ch | Part | Topic | Stage-1 concrete object | Notes |
|---|---|---|---|---|
| 1 🛟 | A | What does "count" mean | tap one of 3 lifebelts | S2: CHOOSE vs ARRANGE vs CODE with 3 flags (3/6/9) |
| 2 🧱 | A | Systematic counting | officer chips (**not tappable — see §10 #2**) | crossing-out via `listBuilderWidget` perm |
| 3 🌳 | A | Tree diagrams | tap pressure + valve dial chips | live SVG tree |
| 4 📋 | A | Tables & grids | tap deck + class chips | grid fill, area-model link |
| 5 🔧 | B | Addition principle | tap one tool from two piles | "Operation Detective" + / × quiz |
| 6 📡 | B | Multiplication principle | 3 dial rows | `crossBuilderWidget` |
| 7 ⚓ | B | Permutations | `shrinkingPoolWidget` roster | S2 has the dot visual |
| 8 🔍 | B | Combinations | `teamBuilderWidget` | S2 tap all 6 orderings of one team; **S3 has the recap table + 3-level hints** (the model for §10 #1) |
| 9 🚫 | C | Restrictions | fill restricted slot first, then pool | S2/S3 have restricted-pool visual |
| 10 ➖ | C | Complementary counting | build a "bad" team of Juniors | S2 has Senior/Junior visual |
| 11 🪜 | C | Repetition & recursion | lantern code via `listBuilderWidget` seq | ladder: ways(n)=ways(n−1)+ways(n−2) |
| 12 🧰 | D | Chief Engineer's Toolkit | tap through 8 tools | Tool Detective, 2-tool combo, Explorer→Inventor |

Bosses: **1** Captain's Missing Signal (9, reveal-style widget) · **2** Bridge Team Assembly (5×20×3 = 300) · **3** Final Inspection Day (96×16×8 = 12,288) · **4** Graduation Voyage (6×20×16×8 = 15,360) → unlocks **Master Map**.

---

## 6. What happened, in order (so you know why things are the way they are)

1. **Plan** — 4 sessions, one per Part, hosted standalone like the Number Theory Sketchbook.
2. **Session 1** — engine + Part A + Boss 1. **Bug:** Next Stage kept snapping back to Stage 1 (progress clamp used the stale value) → fixed with `nextStage()`.
3. **Playtest fixes** — Stage 2 was reveal-only → tap-to-build; Ch3/Ch4 Stage 1 lacked concrete objects → added; house rule recorded.
4. **Sessions 2–4** — Parts B, C, D, Bosses 2–4, Master Map.
5. **Why-It-Works** — free textareas replaced by tap-to-build sentences in all 12 chapters.
6. **Ch12 playtest** — Next Stage never enabled. **Root cause:** 47 of 48 `markStageDone` calls never refreshed the button (only Ch1's did). Fixed once, centrally (`markStageDone` → `refreshChapterNav`). Also: header said "Part A" on every chapter; Ch12 tool definitions rewritten with emoji + chapter callbacks.
7. **Ch8 S3** — recap table + 3 progressive hints (the pattern to copy).
8. **Visual aids** — pool-shrink dots (Ch7 S2); restricted/categorized dots (Ch9 S2, S3, Ch10 S2, Ch12 S3).

---

## 7. Gotchas that already cost us time

- **Every stage-completion path must go through `markStageDone()`** (it refreshes chrome/nav). Never set `stageDone` directly.
- **Never call full `render()` to "refresh" a stage** — it re-runs the stage function and wipes in-progress widget state. Use `refreshChapterNav()`.
- **Gate Stage-1 completion behind a real interaction.** An early version marked Ch1 S1 done on load.
- **Tap-widget closures are in-memory only.** State isn't persisted, so anything that re-renders the stage resets it.
- **`str_replace` ate a function signature once** (a `listBuilderWidget` header) — the syntax check caught it. Always run `verify.js` after structural edits.
- **Apostrophes:** HTML is built in single-quoted JS strings — escape as `\'` (a missed one breaks the whole script).
- **Spoilers:** don't pre-solve the number a stage asks for (see §2).
- **Palette has 6 colours** (`CHIP_COLORS`); pools of more than 6 repeat colours (letters stay distinct).
- **My earlier simulations only tested logic, not the DOM** — which is exactly why the 47-site bug survived. Only real taps (or screenshots) found it. Prefer a jsdom smoke test for new flows if you can.

---

## 8. Verification

```
node verify/verify.js            # defaults to ../combinatorics-sketchbook.html
node verify/verify.js path/to/other.html
```
Checks: script parses · braces/parens/brackets balance · every static `getElementById` has a matching `id` · every answer in the app recomputed by brute force using the **real generator functions pulled out of the file** (and compared with the literal the file asks for, where it is a literal) · regression guards for the bugs in §6/§7. Mutation-tested: changing an answer, removing the refresh call, or breaking syntax each makes it fail.
**When you add a stage with a new answer, add its line to section [4] of `verify.js`.**

---

## 9. Playtest checklist (what has NOT been seen on the iPad)

Seen via screenshots: Ch1 S1–S2 · Ch2 S1 · Ch3 S1 · Ch4 S4 · Ch7 S2 · Ch8 S3 · Ch12 S1. **Everything else is unplaytested**, including all four Boss Battles, the Master Map, Draw-From-Memory, and the Error Log. Suggested order for J.J.: Part A end-to-end → Boss 1 → Part B → Boss 2 → … For each screen note: can he start without help? does Next Stage enable? is any chip too small? is any wording confusing? does a hint exist and does the last one give the answer?

---

## 10. Open issues and backlog (priority order)

1. **[High] Hints are inconsistent and the global hint button doesn't help.** The amber "Show me the next step" button calls `hintCurrentChapter` = `useHint()` + full `render()`: it **costs a star, shows nothing new on stages that are just an answer box, and rebuilds the stage from scratch**. Only Ch8 S3 has layered hints (`progressiveHintWidget`), but ~65 `answerCheckWidget` calls exist. This breaks the house rule (progressive hints, final level states the answer). *Proposal:* (a) give every answer-check stage 2–3 layered hints in the Ch8 S3 style, last level states the answer; (b) make the global button open/advance the current stage's hints (stage registers a hint provider) and use `refreshChapterNav()` instead of `render()`; (c) audit General Rule stages for "jumpy" steps and add a recap table/visual where needed.
2. **[Med] Ch2 Stage 1 officer chips aren't tappable** (display only) — violates the concrete-first rule. Make them tappable (e.g. tap the first-watch officer, then see allowed partners).
3. **[Med] Boss Battles.** Boss 1 still uses the old Reveal-one/Reveal-all widget; Bosses 2–4 are plain numeric chains with no visuals. J.J. has asked for real visual aids in boss steps in other apps — add setup-only visuals using the existing dot generators.
4. **[Med] Progress is stored only on the iPad** and this app is not covered by the hub's export/import. The Number Theory Sketchbook got Restore Codes + a backup file for this reason. *Not yet requested for this app — ask before building.*
5. **[Low] `guidedExplanationWidget` "Continue"** calls `markStageDone` then a full `render()` (redundant; briefly resets the sentence). Remove the `render()`.
6. **[Low] Draw-From-Memory** saves only a completion flag, not the drawing.
7. **[Low] Hub entry** still shows clipper / "Dry dock" and the old description. Optional: refresh the text; optionally design an own ship as was done for Number Theory ("S.S. Number Cruncher"). *Suggested only.*
8. **[Low] Story Hooks.** In the Number Theory Sketchbook, J.J. forgot blunt explanations, so a "Story Hook" (real-life example from a favourite story) was added before them. Consider the same here if playtesting shows the same pattern. *Suggested only.*

---

## 11. Decisions already made (don't relitigate)

- Standalone external site (like Number Theory), not part of the hub's combined Voyage bar.
- 5-stage mission format for every chapter; Boss Battle at the end of each Part; Master Map unlocks after Boss 4.
- Why-It-Works options are equivalent phrasings (no "wrong" taps) so there is no failure loop.
- First hint is free; later hints cost a star; stars never reach 0.
- Competition Challenge = Cambridge question + locked Olympiad stretch ("Explorer → Inventor" label in Ch12).

---

## 12. Phase 1 done (24 Nov 2026)
Fixed: damaged saves no longer white-screen the app (`sanitizeProgress`) · replaying a chapter no longer farms XP · global hint button no longer wipes the stage/boss chain or burns a star (shows an "Engineer's nudge" instead) · Boss 1 Reveal-all no longer re-renders · Why-It-Works Continue no longer re-renders · `alert()` replaced by in-page victory card / inline message. New: `verify/smoke-dom.js` (jsdom; run `npm i jsdom` first). Next: Phase 2 backup system, Phase 3 layered hints + Ch2 tappable officers + boss visuals.

## 13. Phase 2 done (24 Nov 2026) — Backup system
Home screen has a "Ship's Log" card: **Save a Backup** (iPad share sheet → Save to Files; plain download elsewhere) and **Restore a Backup** (preview of contents, warning if the device has more progress, then replace). File: `jj-combinatorics-backup-YYYY-MM-DD.json`, `app: "jj-combinatorics-sketchbook-backup"`, contains `progress` + `errorLog`. Restored data goes through `sanitizeProgress`, so a bad file can't break the app. Home shows a 💾 nudge if progress exists and no backup in 7 days, and a warning if the browser refuses to save (`storageFailed`). Meta key `cs_backup_meta_v1` (not part of the backup). Test: `node verify/smoke-backup.js` (needs `npm i jsdom`). Still not in the hub's own export (separate site). Next: Phase 3.

## 14. Phase 3 done (24 Nov 2026) — Hints, Ch2 officers, boss visuals
- **Layered hints (issue #1 done):** `answerCheckWidget` now builds its own 3-level ladder via `autoHintLevels()` (strategy → set-up → **the answer**), picked by stage kind from the container id (`-s0-` visual, `-s1-`/`-cN` strategy, `-s2-` rule, `-s4-check1` Cambridge, `-s4-check2` stretch, `boss*`). Hint 1 free, hints 2–3 cost a star (floor 1). Pass `{noHints:true}` as 4th arg to opt out (used by Ch8 S2, which has its own hand-written ladder). Hand-written, topic-specific hints can still replace the generic ones later.
- The 💡 button (`hintCurrentChapter`) now clicks the live hint ladder's next button; no re-render, typed answers survive. Falls back to the Engineer's nudge if no ladder is on screen.
- Answer boxes lock after a correct answer (fixes double-firing of `onCorrect`, e.g. boss victory twice).
- **Ch2 Stage 1 officers are tappable** (issue #2): tap one as first watch, the others glow as possible second-watch partners.
- **Boss visuals (issue #3, setup-only):** `slotsVisualHtml` + existing pool/restricted/categorized helpers added to Boss 1–4 steps. Boss 1's Reveal widget is unchanged.
- Tests: `node verify/smoke-hints.js` (needs `npm i jsdom`). Still open: #6 Draw-From-Memory saves a flag only, #7 hub card text/ship, #8 Story Hooks, topic-specific hint text.

## 15. Phase 4 done (25 Nov 2026) — Drawings, hub text, full retest
- **Draw-From-Memory now saves the drawing** (issue #6): white "paper" background, saved to `cs_drawings_v1` (`{ch1..ch12: dataURL}`, PNG, JPEG fallback, 400k-char cap, whitelist-validated by `cleanDrawings`). Reopening a chapter's pad reloads it. Drawings are part of the backup file (`drawings`) and shown in the restore preview.
- **Hub text refreshed** (issue #7, text only): Combinatorics card describes 12 chapters / 4 bosses / hints / own backup; hub footnote says to back this app up from its own Ship's Log. Own ship design still not drawn (`ship: "clipper"`). Ship `index.html` is delivered separately.
- **Test suite** (all need `npm i jsdom`): `verify/verify.js` (static + math), `smoke-dom.js` (every stage renders, corrupt saves), `smoke-backup.js`, `smoke-hints.js`, `smoke-draw.js`, `smoke-playthrough.js` (solves every stage-4 chain in 12 chapters + all 4 bosses via the hint ladders). All pass.
- **Issue list status:** #1 hints ✅ (generic ladders; topic-specific text still possible) · #2 ✅ · #3 ✅ (Boss 1 Reveal widget kept) · #4 ✅ own backup · #5 ✅ · #6 ✅ · #7 text ✅ / ship open · #8 Story Hooks still open (wait for playtest).
- **Still unplaytested on the real iPad:** backup share sheet, drawing pad with finger, hint button position, boss visuals layout. Ask for screenshots.

## 16. Playtest round 1 fixes (25 Nov 2026)
Feedback from J.J.'s dad after deploying: (1) lifebelts "can't be clicked", (2) wants a ship for total progress like the Number Theory app, (3) link back to the hub, (4) story / "why am I doing this" for J.J.
- **Lifebelt bug (real, existed since the original build):** Ch1 Stage 1 called `render()` after `markStageDone`, which rebuilt the stage and erased the picked state and message, so the tap looked dead. Fixed: no re-render; message now ends with "Stage 1 done, tap Next Stage". Grep showed no other site had this pattern. The 💡 nudge now sits directly above the Next/Back buttons and says so when a stage is already done.
- **Blank emoji boxes (Windows / older iPads):** 🛟 (Emoji 14) and 🪜 (Emoji 13) replaced by ⭕ and 🧗. `verify/smoke-ship.js` fails the build if any Emoji 13+ character is added again. Use only emoji from Emoji 12 or older.
- **Ship progress:** "S.S. Combinator", 16 parts (12 chapters + 4 bosses) in `SHIP_PARTS` / `SHIP_SHAPES`; part fades in with its stages (stage 1 of a chapter already shows a piece), solid when done; dashed blueprint outline for the missing parts; "Start here / Keep building" button; part list (boss parts locked until their Part's chapters are done). Ship is derived from existing progress, so nothing new is stored or needs backup.
- **Hub link:** pill button in the home header → https://jj-engineer-port.vercel.app/
- **Story + why:** `BRIEFS` (one per chapter and boss: theme, story, why it matters) shown as a "Mission Briefing" panel (open on Stage 1 and bosses, collapsed on later stages), plus a one-line `STAGE_WHY` under each stage tab. Themes: Titanic, Haunted House, VW Beetle, Princess Anna, Cooking = Chemistry, Super Mario. Stories are original and short; to retheme a chapter just edit its entry in `BRIEFS`.
- Tests: `node verify/smoke-ship.js` added; all 7 suites pass.

## 17. Original ship: "Clipper Combinator" (25 Nov 2026)
Replaces the generic liner from §16 (it looked like the hub's flagship). It is an **original three-masted clipper**; every one of the 16 parts carries a symbol of the chapter that builds it: Ch1 keel with tally marks, Ch2 hull + masts, Ch3 branching rigging (tree), Ch4 cabin window grid (table), Boss 1 rudder, Ch5 fore sail with +, Ch6 main sail with ×, Ch7 five signal flags in order (permutations), Ch8 crow's nest (picked team), Boss 2 topsails, Ch9 anchor (restriction), Ch10 lifeboats, Ch11 rope ladder (recursion), Boss 3 stern lantern, Ch12 mizzen sail, Boss 4 pennant. Shapes live in `SHIP_SHAPES`, names/order in `SHIP_PARTS` (order = build order = recommended study order). Hub `index.html` fleet card now shows a matching clipper silhouette and note. Tests updated (`smoke-ship.js`), all suites pass.
