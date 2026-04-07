// ─── State ─────────────────────────────────────────────────

let data = null;
let progress = {};
let boba = 0;
let streak = 0;            // consecutive correct answers
let wasRetry = false;       // was the current attempt a retry?

let curModule = null;
let curSection = null;
let curLesson = null;
let curMiniLesson = null;
let curStepIdx = 0;
let selectedAnswer = null;
let pointValue = null;
let wrongSteps = [];       // indices of steps answered wrong
let inFixMistakes = false; // are we in the fix-mistakes replay?
let fixQueue = [];         // steps to replay
let userId = '9999';       // resolved to public IP on load if available

const ACCENT = '#57B477';
const SUPABASE_URL = 'https://qwqsgfepygsfempjmquq.supabase.co';
const SUPABASE_KEY = 'sb_publishable_0vWmF5y1PwMwXd4vSts_zA_UL4brDcl';
const sb = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

const STEP_TYPE_DESC = {
  'place-point': 'Place a point on a number line',
  'move-point': 'Drag a point along a number line',
  'equation-input': 'Type the answer to an equation',
  'multiple-choice': 'Choose from multiple options',
  'number-line-choice': 'Pick between two points on a number line',
  'thermometer': 'Thermometer interaction',
  'thermometer-compare': 'Compare two thermometers',
  'elevation': 'Elevation diagram interaction',
  'celebrate': 'Celebration screen'
};

// ─── Markdown ─────────────────────────────────────────────

function parseMarkdown(text) {
  if (!text) return '';
  // Escape HTML first
  let s = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  // Bold: **text**
  s = s.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  // Italic: *text*
  s = s.replace(/\*(.+?)\*/g, '<em>$1</em>');
  return s;
}

// ─── Data Loading ──────────────────────────────────────────

async function loadData() {
  try {
    // Load lesson content from Supabase
    const { data: row, error } = await sb.from('lessons_content').select('data').eq('id', 'main').single();
    if (error) throw error;
    data = row.data;
  } catch (e) {
    console.warn('Supabase load failed, falling back to static file:', e);
    data = await (await fetch('/lessons.json')).json();
  }
  // Student progress stays in localStorage (per-device)
  const sp = localStorage.getItem('sidekick-progress');
  if (sp) progress = JSON.parse(sp);
  const sb2 = localStorage.getItem('sidekick-boba');
  if (sb2) boba = parseInt(sb2, 10);
  fetchUserId();
  route();
}

async function fetchUserId() {
  try {
    const cached = localStorage.getItem('sidekick-uid');
    if (cached) { userId = cached; return; }
    const r = await fetch('https://api.ipify.org?format=json');
    const j = await r.json();
    if (j && j.ip) { userId = j.ip; localStorage.setItem('sidekick-uid', userId); }
  } catch (e) { /* leave as 9999 */ }
}

// ─── Event Logging ────────────────────────────────────────

function getStepIdString() {
  if (!curModule || !curMiniLesson) return '';
  const mIdx = data.modules.indexOf(curModule) + 1;
  const sIdx = curModule.sections.indexOf(curSection) + 1;
  const lIdx = curSection.lessons.indexOf(curLesson) + 1;
  const mlIdx = curLesson.miniLessons.indexOf(curMiniLesson) + 1;
  let stepNo;
  if (inFixMistakes) {
    const orig = curMiniLesson.steps.indexOf(fixQueue[curStepIdx]);
    stepNo = (orig >= 0 ? orig : curStepIdx) + 1;
  } else {
    stepNo = curStepIdx + 1;
  }
  return mIdx + '-' + sIdx + '-' + lIdx + '-' + mlIdx + '-' + stepNo;
}

function getAnswerStr() {
  const step = getCurrentStep();
  if (pointValue !== null && pointValue !== undefined) return String(pointValue);
  if (selectedAnswer !== null && selectedAnswer !== undefined) {
    if (step && step.choices && typeof selectedAnswer === 'number') {
      const c = step.choices[selectedAnswer];
      if (c == null) return String(selectedAnswer);
      if (typeof c === 'string') return c;
      return c.label || c.text || c.value || JSON.stringify(c);
    }
    return String(selectedAnswer);
  }
  return null;
}

function getETTime() {
  return new Date().toLocaleString('en-US', { timeZone: 'America/New_York', hour12: false });
}

async function logEvent(correct) {
  try {
    await sb.from('events').insert({
      user_id: userId || '9999',
      step_id: getStepIdString(),
      answer: getAnswerStr(),
      correct: correct,
      boba_total: boba,
      et_time: getETTime()
    });
  } catch (e) { console.warn('logEvent failed', e); }
}

async function saveData() {
  // Save lesson content to Supabase
  try {
    const { error } = await sb.from('lessons_content').update({ data: data, updated_at: new Date().toISOString() }).eq('id', 'main');
    if (error) throw error;
  } catch (e) {
    console.error('Failed to save to Supabase:', e);
  }
}

function saveProgress() {
  localStorage.setItem('sidekick-progress', JSON.stringify(progress));
  localStorage.setItem('sidekick-boba', boba);
}

// ─── Routing ───────────────────────────────────────────────

function route() {
  const hash = location.hash || '#map';
  document.querySelectorAll('.view').forEach(v => { v.style.display = 'none'; v.classList.remove('active'); });
  if (hash === '#edit') { showView('view-edit'); renderEdit(); }
  else if (hash.startsWith('#lesson/')) { const p = hash.replace('#lesson/', '').split('/'); startLesson(p[0], p[1], p[2], p[3]); }
  else { showView('view-map'); renderMap(); }
}

function showView(id) { const el = document.getElementById(id); el.style.display = 'flex'; el.classList.add('active'); }
window.addEventListener('hashchange', route);

// ─── Data Helpers ──────────────────────────────────────────

function findModule(mId) { return data.modules.find(m => m.id === mId); }
function findSection(mod, sId) { return mod.sections.find(s => s.id === sId); }
function findLesson(sec, lId) { return sec.lessons.find(l => l.id === lId); }
function findMiniLesson(les, mlId) { return les.miniLessons.find(ml => ml.id === mlId); }
function miniLessonKey(mId, sId, lId, mlId) { return mId + '-' + sId + '-' + lId + '-' + mlId; }
function isMiniLessonCompleted(mId, sId, lId, mlId) { const p = progress[miniLessonKey(mId, sId, lId, mlId)]; return p && p.completed; }

function getFirstIncompleteMiniLessonKey(mod) {
  for (const sec of mod.sections)
    for (const les of sec.lessons)
      for (const ml of les.miniLessons)
        if (!isMiniLessonCompleted(mod.id, sec.id, les.id, ml.id) && ml.steps.length > 0)
          return { mId: mod.id, sId: sec.id, lId: les.id, mlId: ml.id };
  return null;
}

// ─── MAP VIEW ──────────────────────────────────────────────

function renderMap() {
  const mod = data.modules[0];
  document.getElementById('map-module-title').textContent = mod.title;
  document.getElementById('map-gems-count').textContent = boba;
  const container = document.getElementById('map-content');
  container.innerHTML = '';
  const firstIncomplete = getFirstIncompleteMiniLessonKey(mod);
  let nodeIndex = 0;

  mod.sections.forEach((sec, si) => {
    const secDiv = document.createElement('div');
    secDiv.className = 'map-section';
    secDiv.innerHTML = '<div class="map-section-title">' + sec.title + '</div>';
    container.appendChild(secDiv);

    let lastLessonPath = null;
    sec.lessons.forEach((les, li) => {
      const lesDiv = document.createElement('div');
      lesDiv.className = 'map-lesson-title';
      lesDiv.textContent = (li + 1) + '. ' + les.title;
      container.appendChild(lesDiv);
      const path = document.createElement('div');
      path.className = 'map-path';
      let nodesInLesson = 0;

      les.miniLessons.forEach((ml, mli) => {
        if (ml.steps.length === 0) return; // skip empty mini-lessons
        nodeIndex++;
        nodesInLesson++;
        const completed = isMiniLessonCompleted(mod.id, sec.id, les.id, ml.id);
        const isCurrent = firstIncomplete && firstIncomplete.mlId === ml.id && firstIncomplete.lId === les.id && firstIncomplete.sId === sec.id;
        const isAvailable = completed || isCurrent;
        if (nodesInLesson > 1) { const conn = document.createElement('div'); conn.className = 'map-connector' + (completed ? ' completed' : ''); path.appendChild(conn); }
        const node = document.createElement('div');
        node.className = 'map-node' + (completed ? ' completed' : '') + (isCurrent ? ' current' : '');
        const circle = document.createElement('div');
        circle.className = 'map-node-circle' + (completed ? ' completed' : isCurrent ? ' current' : isAvailable ? ' available' : ' locked');
        circle.textContent = completed ? '✓' : nodeIndex;
        const label = document.createElement('div');
        label.className = 'map-node-label';
        label.textContent = ml.title;
        node.appendChild(circle);
        node.appendChild(label);
        if (isAvailable) node.onclick = () => { location.hash = '#lesson/' + mod.id + '/' + sec.id + '/' + les.id + '/' + ml.id; };
        path.appendChild(node);
      });
      container.appendChild(path);
      lastLessonPath = path;
    });

    const allDone = sec.lessons.every(l => l.miniLessons.filter(ml => ml.steps.length > 0).every(ml => isMiniLessonCompleted(mod.id, sec.id, l.id, ml.id)));
    if (lastLessonPath) {
      const conn = document.createElement('div');
      conn.className = 'map-connector' + (allDone ? ' completed' : '');
      lastLessonPath.appendChild(conn);
      const cn = document.createElement('div');
      cn.className = 'map-node' + (allDone ? ' completed' : '');
      const cc = document.createElement('div');
      cc.className = 'map-node-circle section-check' + (allDone ? ' completed' : '');
      cc.textContent = allDone ? '★' : '☆';
      const cl = document.createElement('div');
      cl.className = 'map-node-label';
      cl.textContent = 'Section Check';
      cn.appendChild(cc);
      cn.appendChild(cl);
      lastLessonPath.appendChild(cn);
    }
  });
}

// ─── LESSON VIEW ───────────────────────────────────────────

function startLesson(mId, sId, lId, mlId) {
  showView('view-lesson');
  curModule = findModule(mId);
  curSection = findSection(curModule, sId);
  curLesson = findLesson(curSection, lId);
  curMiniLesson = findMiniLesson(curLesson, mlId);
  curStepIdx = 0;
  streak = 0;
  wasRetry = false;
  wrongSteps = [];
  inFixMistakes = false;
  fixQueue = [];
  document.getElementById('close-btn').onclick = () => { location.hash = '#map'; };
  renderStep();
}

function getCurrentStep() {
  if (inFixMistakes) return fixQueue[curStepIdx];
  return curMiniLesson.steps[curStepIdx];
}

function getTotalSteps() {
  if (inFixMistakes) return fixQueue.length;
  return curMiniLesson.steps.length;
}

function renderStep() {
  const step = getCurrentStep();
  const total = getTotalSteps();
  const content = document.getElementById('step-content');
  const checkBtn = document.getElementById('check-btn');
  const fb = document.getElementById('feedback-bar');
  fb.className = 'feedback-inline hidden';
  fb.textContent = '';
  checkBtn.textContent = 'CHECK';
  checkBtn.className = 'check-btn disabled';
  checkBtn.style.display = '';
  checkBtn.onclick = null;
  selectedAnswer = null;
  pointValue = null;

  const pct = (curStepIdx / total) * 100;
  document.getElementById('progress-bar').style.width = pct + '%';
  document.getElementById('boba-count').textContent = boba;
  const mIdx = data.modules.indexOf(curModule) + 1;
  const sIdx = curModule.sections.indexOf(curSection) + 1;
  const lIdx = curSection.lessons.indexOf(curLesson) + 1;
  const mlIdx = curLesson.miniLessons.indexOf(curMiniLesson) + 1;
  document.getElementById('step-number').textContent = mIdx + '-' + sIdx + '-' + lIdx + '-' + mlIdx + '-' + (curStepIdx + 1);
  content.innerHTML = '';

  switch (step.type) {
    case 'place-point': renderPlacePoint(step, content, checkBtn); break;
    case 'move-point': renderMovePoint(step, content, checkBtn); break;
    case 'equation-input': renderEquationInput(step, content, checkBtn); break;
    case 'multiple-choice': renderMultipleChoice(step, content, checkBtn); break;
    case 'number-line-choice': renderNumberLineChoice(step, content, checkBtn); break;
    case 'thermometer': renderThermometer(step, content, checkBtn); break;
    case 'thermometer-compare': renderThermometerCompare(step, content, checkBtn); break;
    case 'elevation': renderElevation(step, content, checkBtn); break;
    case 'celebrate': renderCelebrate(step, content, checkBtn); break;
  }
}

function advanceStep() {
  curStepIdx++;
  wasRetry = false;
  const total = getTotalSteps();
  if (curStepIdx < total) {
    renderStep();
  } else if (!inFixMistakes && wrongSteps.length > 0) {
    showFixMistakes();
  } else {
    finishLesson();
  }
}

function showFixMistakes() {
  const content = document.getElementById('step-content');
  const checkBtn = document.getElementById('check-btn');
  content.innerHTML = '';
  document.getElementById('feedback-bar').className = 'feedback-inline hidden';
  document.getElementById('progress-bar').style.width = '100%';

  const card = document.createElement('div');
  card.className = 'celebrate';
  card.innerHTML = `
    <div style="font-size:60px">🔧</div>
    <div class="congrats-text" style="color:#1a1a2e;font-size:24px">Let's fix some mistakes!</div>
    <div class="sub-text">Let's go over them one more time.</div>
    <button class="continue-map-btn">CONTINUE</button>
  `;
  card.querySelector('.continue-map-btn').onclick = () => {
    fixQueue = wrongSteps.map(i => curMiniLesson.steps[i]);
    inFixMistakes = true;
    curStepIdx = 0;
    streak = 0;
    renderStep();
  };
  content.appendChild(card);
  checkBtn.style.display = 'none';
}

function finishLesson() {
  boba += 20;
  saveProgress();
  const key = miniLessonKey(curModule.id, curSection.id, curLesson.id, curMiniLesson.id);
  progress[key] = { completed: true };
  saveProgress();

  const content = document.getElementById('step-content');
  const checkBtn = document.getElementById('check-btn');
  content.innerHTML = '';
  document.getElementById('feedback-bar').className = 'feedback-inline hidden';
  document.getElementById('progress-bar').style.width = '100%';
  document.getElementById('boba-count').textContent = boba;

  const cel = document.createElement('div');
  cel.className = 'celebrate';
  cel.innerHTML = `
    <div class="trophy">&#127942;</div>
    <div class="congrats-text">Amazing work!</div>
    <div class="sub-text">Mini-lesson complete!</div>
    <div class="gems-earned"><img src="/boba.svg" class="boba-icon"> +20 boba!</div>
  `;
  content.appendChild(cel);

  // Story offer (interstitial)
  const mIdx = data.modules.indexOf(curModule) + 1;
  const sIdx = curModule.sections.indexOf(curSection) + 1;
  const lIdx = curSection.lessons.indexOf(curLesson) + 1;
  const mlIdx = curLesson.miniLessons.indexOf(curMiniLesson) + 1;
  const tag = mIdx + '-' + sIdx + '-' + lIdx + '-' + mlIdx;
  const story = (data.stories || []).find(s => s.tag === tag);

  if (story) {
    const offerText = document.createElement('div');
    offerText.className = 'story-offer-text';
    offerText.textContent = story.offer;
    cel.appendChild(offerText);

    const btnRow = document.createElement('div');
    btnRow.className = 'celebrate-btn-row';
    const yesBtn = document.createElement('button');
    yesBtn.className = 'continue-map-btn yes-btn';
    yesBtn.textContent = 'YES';
    yesBtn.onclick = () => openStory(story);
    const noBtn = document.createElement('button');
    noBtn.className = 'continue-map-btn no-btn';
    noBtn.textContent = 'NO, CONTINUE';
    noBtn.onclick = () => { location.hash = '#map'; };
    btnRow.appendChild(yesBtn);
    btnRow.appendChild(noBtn);
    cel.appendChild(btnRow);
  } else {
    const cont = document.createElement('button');
    cont.className = 'continue-map-btn';
    cont.textContent = 'CONTINUE';
    cont.onclick = () => { location.hash = '#map'; };
    cel.appendChild(cont);
  }

  checkBtn.style.display = 'none';
  launchConfetti();
}

// ─── Stories ───────────────────────────────────────────────

function openStory(story) {
  let idx = 0;
  const overlay = document.createElement('div');
  overlay.className = 'story-overlay';
  overlay.innerHTML = `
    <div class="story-card">
      <button class="story-close" aria-label="Close">&times;</button>
      <div class="story-page">
        <img class="story-img" alt="">
        <div class="story-text"></div>
      </div>
      <div class="story-nav">
        <button class="story-prev">&larr; Prev</button>
        <span class="story-counter"></span>
        <button class="story-next">Next &rarr;</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  const img = overlay.querySelector('.story-img');
  const txt = overlay.querySelector('.story-text');
  const counter = overlay.querySelector('.story-counter');
  const prev = overlay.querySelector('.story-prev');
  const next = overlay.querySelector('.story-next');

  function render() {
    const p = story.pages[idx];
    img.src = p.image;
    txt.innerHTML = parseMarkdown(p.text || '');
    counter.textContent = (idx + 1) + ' / ' + story.pages.length;
    prev.disabled = idx === 0;
    next.textContent = idx === story.pages.length - 1 ? 'Done' : 'Next →';
  }
  prev.onclick = () => { if (idx > 0) { idx--; render(); } };
  next.onclick = () => {
    if (idx < story.pages.length - 1) { idx++; render(); }
    else { overlay.remove(); location.hash = '#map'; }
  };
  overlay.querySelector('.story-close').onclick = () => { overlay.remove(); location.hash = '#map'; };
  render();
}

// ─── Boba & Streak ───────────────────────────────────────

function addBoba(amount) {
  boba += amount;
  saveProgress();
  document.getElementById('boba-count').textContent = boba;
}

function showStreakBonus() {
  const popup = document.createElement('div');
  popup.className = 'streak-popup';
  popup.innerHTML = `
    <div class="streak-icon">&#127911;</div>
    <div class="streak-text">5x Streak!</div>
    <div class="streak-bonus">+10 boba bonus</div>
  `;
  document.body.appendChild(popup);
  setTimeout(() => popup.remove(), 1800);
}

// ─── Number Line ───────────────────────────────────────────

function buildNumberLine(container, min, max, options = {}) {
  const nlc = document.createElement('div');
  nlc.className = 'number-line-container';
  const line = document.createElement('div');
  line.className = 'number-line';
  const range = max - min;
  const tickStep = options.tickStep || 1;

  // Draw regular ticks
  const drawnTicks = new Set();
  for (let i = min; i <= max; i += tickStep) {
    const pct = ((i - min) / range) * 100;
    const tick = document.createElement('div'); tick.className = 'tick'; tick.style.left = pct + '%'; line.appendChild(tick);
    const lbl = document.createElement('div');
    lbl.className = 'tick-label' + (options.highlightValues && options.highlightValues.includes(i) ? ' highlight' : '');
    lbl.style.left = pct + '%'; lbl.textContent = i; line.appendChild(lbl);
    drawnTicks.add(i);
  }

  // Add extra ticks for highlighted values that don't fall on regular ticks
  if (options.highlightValues) {
    options.highlightValues.forEach(v => {
      if (!drawnTicks.has(v)) {
        const pct = ((v - min) / range) * 100;
        const tick = document.createElement('div'); tick.className = 'tick'; tick.style.left = pct + '%'; line.appendChild(tick);
        const lbl = document.createElement('div');
        lbl.className = 'tick-label highlight';
        lbl.style.left = pct + '%'; lbl.textContent = v; line.appendChild(lbl);
        drawnTicks.add(v);
      }
    });
  }

  // Add extra ticks for static points that don't fall on regular ticks
  if (options.staticPoints) {
    options.staticPoints.forEach(v => {
      if (!drawnTicks.has(v)) {
        const pct = ((v - min) / range) * 100;
        const tick = document.createElement('div'); tick.className = 'tick'; tick.style.left = pct + '%'; line.appendChild(tick);
        const lbl = document.createElement('div');
        lbl.className = 'tick-label highlight';
        lbl.style.left = pct + '%'; lbl.textContent = v; line.appendChild(lbl);
        drawnTicks.add(v);
      }
    });
  }

  if (options.ghostAt !== undefined) {
    const ghost = document.createElement('div');
    ghost.className = 'ghost-start';
    ghost.style.left = ((options.ghostAt - min) / range) * 100 + '%';
    line.appendChild(ghost);
  }
  // Static dots
  if (options.staticPoints) {
    options.staticPoints.forEach(v => {
      const p = document.createElement('div');
      p.className = 'point';
      p.style.left = ((v - min) / range) * 100 + '%';
      p.style.cursor = 'default';
      line.appendChild(p);
    });
  }
  nlc.appendChild(line);
  return { nlContainer: nlc, line, range, min, max };
}

function addClickablePoint(nlc, line, min, max, onChange, snapStep) {
  const range = max - min;
  const snap = snapStep || 1;
  let point = null, drag = false;
  function val(cx) {
    const r = line.getBoundingClientRect();
    const raw = min + Math.max(0, Math.min(1, (cx - r.left) / r.width)) * range;
    return Math.round(raw / snap) * snap;
  }
  function set(v) {
    pointValue = v;
    if (!point) { point = document.createElement('div'); point.className = 'point placed'; line.appendChild(point); }
    point.style.left = ((v - min) / range) * 100 + '%';
    if (onChange) onChange(v);
  }
  const zone = document.createElement('div'); zone.className = 'click-zone'; line.appendChild(zone);
  zone.addEventListener('mousedown', e => { set(val(e.clientX)); drag = true; });
  zone.addEventListener('touchstart', e => { e.preventDefault(); set(val(e.touches[0].clientX)); drag = true; });
  document.addEventListener('mousemove', e => { if (drag) set(val(e.clientX)); });
  document.addEventListener('touchmove', e => { if (drag) set(val(e.touches[0].clientX)); });
  document.addEventListener('mouseup', () => { drag = false; });
  document.addEventListener('touchend', () => { drag = false; });
}

function addDraggablePoint(nlc, line, min, max, startVal, onChange) {
  const range = max - min;
  pointValue = startVal;

  const ghost = document.createElement('div');
  ghost.className = 'ghost-start';
  ghost.style.left = ((startVal - min) / range) * 100 + '%';
  line.appendChild(ghost);

  // SVG for jump arcs
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('class', 'jump-arrows');
  nlc.appendChild(svg);

  const point = document.createElement('div');
  point.className = 'point';
  point.style.left = ((startVal - min) / range) * 100 + '%';
  line.appendChild(point);

  let drag = false;
  function val(cx) { const r = line.getBoundingClientRect(); return Math.round(min + Math.max(0, Math.min(1, (cx - r.left) / r.width)) * range); }

  function drawArrows(from, to) {
    svg.innerHTML = '';
    if (from === to) return;

    const lineRect = line.getBoundingClientRect();
    const svgRect = svg.getBoundingClientRect();
    const lineW = lineRect.width;
    const svgW = svgRect.width;
    const svgH = svgRect.height;
    if (svgW === 0 || svgH === 0) return;

    svg.setAttribute('viewBox', `0 0 ${svgW} ${svgH}`);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

    const s = from < to ? 1 : -1;
    const offsetX = lineRect.left - svgRect.left;
    const baseY = svgH;

    for (let i = 0; i < Math.abs(to - from); i++) {
      const a = from + i * s, b = a + s;
      const x1 = offsetX + ((a - min) / range) * lineW;
      const x2 = offsetX + ((b - min) / range) * lineW;
      const midX = (x1 + x2) / 2;
      const peakY = svgH * 0.1;

      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', `M ${x1} ${baseY} Q ${midX} ${peakY} ${x2} ${baseY}`);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', ACCENT);
      path.setAttribute('stroke-width', '2.5');
      path.setAttribute('stroke-linecap', 'round');
      svg.appendChild(path);

      const aW = 5, aH = 8;
      const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
      arrow.setAttribute('points', `${x2 - aW},${baseY - aH} ${x2},${baseY} ${x2 + aW},${baseY - aH}`);
      arrow.setAttribute('fill', 'none');
      arrow.setAttribute('stroke', ACCENT);
      arrow.setAttribute('stroke-width', '2.5');
      arrow.setAttribute('stroke-linecap', 'round');
      arrow.setAttribute('stroke-linejoin', 'round');
      svg.appendChild(arrow);
    }
  }

  function update(v) {
    pointValue = v;
    point.style.left = ((v - min) / range) * 100 + '%';
    drawArrows(startVal, v);
    if (onChange) onChange(v);
  }

  point.addEventListener('mousedown', e => { e.preventDefault(); drag = true; });
  point.addEventListener('touchstart', e => { e.preventDefault(); drag = true; });
  document.addEventListener('mousemove', e => { if (drag) update(val(e.clientX)); });
  document.addEventListener('touchmove', e => { if (drag) update(val(e.touches[0].clientX)); });
  document.addEventListener('mouseup', () => { drag = false; });
  document.addEventListener('touchend', () => { drag = false; });
}

// ─── SVG Arrow Helpers ─────────────────────────────────────

function makeSvgArrow(direction) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 100 50');
  svg.setAttribute('width', '120');
  svg.setAttribute('height', '60');
  svg.style.display = 'block';
  svg.style.margin = '0 auto';

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  if (direction === 'left') {
    path.setAttribute('d', 'M 8 25 L 35 4 C 37 2, 40 4, 40 7 L 40 16 L 88 16 C 92 16, 94 18, 94 22 L 94 28 C 94 32, 92 34, 88 34 L 40 34 L 40 43 C 40 46, 37 48, 35 46 L 8 25 Z');
  } else {
    path.setAttribute('d', 'M 92 25 L 65 4 C 63 2, 60 4, 60 7 L 60 16 L 12 16 C 8 16, 6 18, 6 22 L 6 28 C 6 32, 8 34, 12 34 L 60 34 L 60 43 C 60 46, 63 48, 65 46 L 92 25 Z');
  }
  path.setAttribute('fill', 'currentColor');
  svg.appendChild(path);
  return svg;
}

// ─── Equation Builder ──────────────────────────────────────

function colorizeEq(container, eqStr) {
  eqStr.split(/(\s*[+\−\-=]\s*)/).forEach(tok => {
    const span = document.createElement('span');
    const t = tok.trim();
    if (t === '+' || t === '−' || t === '-' || t === '=') span.className = 'op';
    span.textContent = tok;
    container.appendChild(span);
  });
}

function buildEquation(eqStr) {
  const div = document.createElement('div');
  div.className = 'equation';
  colorizeEq(div, eqStr);
  const input = document.createElement('input');
  input.className = 'answer-box';
  input.type = 'text';
  input.inputMode = 'numeric';
  input.maxLength = 4;
  div.appendChild(input);
  return { eqDiv: div, input };
}

function buildEqLabel(eqStr) {
  const div = document.createElement('div');
  div.className = 'equation';
  colorizeEq(div, eqStr);
  const q = document.createElement('span'); q.textContent = ' ?'; q.className = 'op';
  div.appendChild(q);
  return div;
}

// ─── Step Renderers ────────────────────────────────────────

function makeInstruction(step) {
  const el = document.createElement('div');
  el.className = 'instruction';
  el.innerHTML = parseMarkdown(step.instruction);
  return el;
}

function renderPlacePoint(step, content, checkBtn) {
  content.appendChild(makeInstruction(step));
  if (step.equationLabel) content.appendChild(buildEqLabel(step.equationLabel));
  const opts = { tickStep: step.tickStep };
  // Show reference point for "less than" / "greater than" conditions
  if (step.referencePoint !== undefined) {
    opts.staticPoints = [step.referencePoint];
    opts.highlightValues = [step.referencePoint];
  }
  const { nlContainer, line } = buildNumberLine(content, step.min, step.max, opts);
  content.appendChild(nlContainer);
  addClickablePoint(nlContainer, line, step.min, step.max, () => { checkBtn.className = 'check-btn'; }, step.tickStep);
  checkBtn.onclick = () => {
    if (checkBtn.classList.contains('disabled')) return;
    // Support condition-based validation (lessThan, greaterThan) or exact target
    if (step.condition === 'lessThan') {
      if (pointValue < step.conditionValue) handleCorrect(checkBtn);
      else handleWrong('Less than ' + step.conditionValue + ' means to the LEFT of ' + step.conditionValue + ' on the number line.', checkBtn);
    } else if (step.condition === 'greaterThan') {
      if (pointValue > step.conditionValue) handleCorrect(checkBtn);
      else handleWrong('Greater than ' + step.conditionValue + ' means to the RIGHT of ' + step.conditionValue + ' on the number line.', checkBtn);
    } else {
      if (pointValue === step.target) handleCorrect(checkBtn);
      else handleWrong(step.hint || (step.target < 0 ? "Look for the negative side — it's to the LEFT of zero." : "Look for the positive side — it's to the RIGHT of zero."), checkBtn);
    }
  };
}

function renderMovePoint(step, content, checkBtn) {
  content.appendChild(makeInstruction(step));
  if (step.equationLabel) content.appendChild(buildEqLabel(step.equationLabel));
  const { nlContainer, line } = buildNumberLine(content, step.min, step.max, { tickStep: step.tickStep });
  content.appendChild(nlContainer);
  addDraggablePoint(nlContainer, line, step.min, step.max, step.startValue, () => { checkBtn.className = 'check-btn'; });
  checkBtn.onclick = () => {
    if (checkBtn.classList.contains('disabled')) return;
    if (pointValue === step.target) handleCorrect(checkBtn);
    else {
      const dir = step.moveBy > 0 ? 'right' : 'left';
      const verb = step.moveBy > 0 ? 'Adding' : 'Subtracting';
      handleWrong(`${verb} ${Math.abs(step.moveBy)} means move ${Math.abs(step.moveBy)} spaces to the ${dir}.`, checkBtn);
    }
  };
}

function renderEquationInput(step, content, checkBtn) {
  content.appendChild(makeInstruction(step));
  const { eqDiv, input } = buildEquation(step.equation);
  content.appendChild(eqDiv);
  input.addEventListener('input', () => {
    selectedAnswer = input.value.trim();
    checkBtn.className = selectedAnswer ? 'check-btn' : 'check-btn disabled';
  });
  if (step.showNumberLine) {
    const hl = [];
    if (step.startValue !== undefined) hl.push(step.startValue);
    if (step.endValue !== undefined) hl.push(step.endValue);
    const opts = { highlightValues: hl, tickStep: step.tickStep };
    if (step.ghostAt !== undefined) opts.ghostAt = step.ghostAt;
    const { nlContainer, line } = buildNumberLine(content, step.min, step.max, opts);
    if (step.endValue !== undefined) {
      const p2 = document.createElement('div');
      p2.className = 'point';
      p2.style.left = ((step.endValue - step.min) / (step.max - step.min)) * 100 + '%';
      p2.style.cursor = 'default';
      line.appendChild(p2);
    }
    content.appendChild(nlContainer);
  }
  checkBtn.onclick = () => {
    if (checkBtn.classList.contains('disabled')) return;
    parseInt(selectedAnswer, 10) === step.answer ? handleCorrect(checkBtn) : handleWrong('Try counting the spaces on the number line.', checkBtn);
  };
}

function renderMultipleChoice(step, content, checkBtn) {
  content.appendChild(makeInstruction(step));

  // Optionally show a number line with static points
  if (step.showNumberLine) {
    const opts = { tickStep: step.tickStep };
    if (step.staticPoints) {
      opts.staticPoints = step.staticPoints;
      opts.highlightValues = step.staticPoints;
    }
    const { nlContainer } = buildNumberLine(content, step.min, step.max, opts);
    content.appendChild(nlContainer);
  }

  const cd = document.createElement('div');
  cd.className = 'choices';
  step.choices.forEach((ch, i) => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    if (ch.arrow) {
      const label = document.createElement('div');
      label.style.display = 'flex';
      label.style.flexDirection = 'column';
      label.style.alignItems = 'center';
      label.style.gap = '4px';
      label.appendChild(makeSvgArrow(ch.arrow));
      const txt = document.createElement('span');
      txt.textContent = ch.text.charAt(0).toUpperCase() + ch.text.slice(1);
      txt.style.fontSize = '18px';
      label.appendChild(txt);
      btn.appendChild(label);
    } else {
      btn.textContent = ch.text;
    }
    btn.onclick = () => {
      cd.querySelectorAll('.choice-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedAnswer = i;
      checkBtn.className = 'check-btn';
    };
    cd.appendChild(btn);
  });
  content.appendChild(cd);
  checkBtn.onclick = () => {
    if (checkBtn.classList.contains('disabled')) return;
    const ok = step.choices[selectedAnswer].correct;
    cd.querySelectorAll('.choice-btn')[selectedAnswer].classList.add(ok ? 'correct' : 'wrong');
    ok ? handleCorrect(checkBtn) : handleWrong(step.hint || 'Think about which direction means getting smaller.', checkBtn);
  };
}

function renderNumberLineChoice(step, content, checkBtn) {
  content.appendChild(makeInstruction(step));
  const { nlContainer } = buildNumberLine(content, step.min, step.max, {
    staticPoints: step.points,
    highlightValues: step.points,
    tickStep: step.tickStep
  });
  content.appendChild(nlContainer);

  const cd = document.createElement('div');
  cd.className = 'choices';
  step.choices.forEach((ch, i) => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = ch.text;
    btn.style.fontSize = '28px';
    btn.onclick = () => {
      cd.querySelectorAll('.choice-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedAnswer = i;
      checkBtn.className = 'check-btn';
    };
    cd.appendChild(btn);
  });
  content.appendChild(cd);

  checkBtn.onclick = () => {
    if (checkBtn.classList.contains('disabled')) return;
    const ok = step.choices[selectedAnswer].correct;
    cd.querySelectorAll('.choice-btn')[selectedAnswer].classList.add(ok ? 'correct' : 'wrong');
    ok ? handleCorrect(checkBtn) : handleWrong(step.hint || 'Look at the number line carefully.', checkBtn);
  };
}

// ─── Thermometer ──────────────────────────────────────────

function buildThermometerVisual(min, max, tickStep, opts = {}) {
  const wrap = document.createElement('div');
  wrap.className = 'thermo-visual';

  const scaleArea = document.createElement('div');
  scaleArea.className = 'thermo-scale-area';

  // Ticks on the right
  const range = max - min;
  for (let t = min; t <= max; t += tickStep) {
    const pct = ((t - min) / range) * 100;
    const tick = document.createElement('div');
    tick.className = 'thermo-tick';
    tick.style.bottom = pct + '%';
    const line = document.createElement('div');
    line.className = 'thermo-tick-line';
    const lbl = document.createElement('span');
    lbl.className = 'thermo-tick-label';
    lbl.textContent = t + '°';
    if (t === 0) { lbl.style.fontWeight = '900'; lbl.style.color = '#1a1a2e'; }
    tick.appendChild(line);
    tick.appendChild(lbl);
    scaleArea.appendChild(tick);
  }

  // Zero line indicator
  const zeroPct = ((0 - min) / range) * 100;
  const zeroLine = document.createElement('div');
  zeroLine.className = 'thermo-zero-line';
  zeroLine.style.bottom = zeroPct + '%';
  scaleArea.appendChild(zeroLine);

  // Tube
  const tube = document.createElement('div');
  tube.className = 'thermo-tube';
  const fill = document.createElement('div');
  fill.className = 'thermo-fill';
  tube.appendChild(fill);
  scaleArea.appendChild(tube);

  // Bulb
  const bulb = document.createElement('div');
  bulb.className = 'thermo-bulb';

  wrap.appendChild(scaleArea);
  wrap.appendChild(bulb);

  // Pointer indicator (shows where user clicked)
  const pointer = document.createElement('div');
  pointer.className = 'thermo-pointer';
  pointer.style.display = 'none';
  scaleArea.appendChild(pointer);

  return { wrap, tube, fill, scaleArea, pointer, range, min, max };
}

function renderThermometer(step, content, checkBtn) {
  const isInteractive = step.target !== undefined && !step.choices;
  const hasChoices = step.choices && step.choices.length > 0;

  // Side-by-side layout: instruction left, thermometer right
  const row = document.createElement('div');
  row.className = 'thermo-wrap';

  const instrCol = document.createElement('div');
  instrCol.className = 'thermo-instr-col';
  instrCol.appendChild(makeInstruction(step));

  const { wrap, tube, fill, scaleArea, pointer, range, min, max } = buildThermometerVisual(step.min, step.max, step.tickStep || 10);

  row.appendChild(instrCol);
  row.appendChild(wrap);
  content.appendChild(row);

  // If displaying a fixed temperature (read-only + MC)
  if (step.displayTemp !== undefined) {
    const pct = ((step.displayTemp - step.min) / range) * 100;
    fill.style.height = Math.max(0, pct) + '%';
  }

  if (isInteractive) {
    // Click on tube to set temperature
    tube.style.cursor = 'pointer';
    const tickStepVal = step.tickStep || 10;

    function setTemp(e) {
      const rect = tube.getBoundingClientRect();
      const y = rect.bottom - (e.clientY || e.touches[0].clientY);
      const pctRaw = y / rect.height;
      const raw = step.min + pctRaw * range;
      const snapped = Math.round(raw / tickStepVal) * tickStepVal;
      const clamped = Math.max(step.min, Math.min(step.max, snapped));
      pointValue = clamped;
      const pct = ((clamped - step.min) / range) * 100;
      fill.style.height = Math.max(0, pct) + '%';
      pointer.style.display = 'block';
      pointer.style.bottom = pct + '%';
      pointer.textContent = clamped + '°';
      checkBtn.className = 'check-btn';
    }

    tube.addEventListener('click', setTemp);
    tube.addEventListener('touchend', e => { e.preventDefault(); setTemp(e); });

    checkBtn.onclick = () => {
      if (checkBtn.classList.contains('disabled')) return;
      if (pointValue === step.target) handleCorrect(checkBtn);
      else handleWrong(step.hint || 'Try clicking closer to ' + step.target + '° on the thermometer.', checkBtn);
    };
  }

  if (hasChoices) {
    const cd = document.createElement('div');
    cd.className = 'choices';
    step.choices.forEach((ch, i) => {
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      btn.textContent = ch.text;
      btn.onclick = () => {
        cd.querySelectorAll('.choice-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedAnswer = i;
        checkBtn.className = 'check-btn';
      };
      cd.appendChild(btn);
    });
    instrCol.appendChild(cd);

    checkBtn.onclick = () => {
      if (checkBtn.classList.contains('disabled')) return;
      const ok = step.choices[selectedAnswer].correct;
      cd.querySelectorAll('.choice-btn')[selectedAnswer].classList.add(ok ? 'correct' : 'wrong');
      ok ? handleCorrect(checkBtn) : handleWrong(step.hint || 'Look at the thermometer carefully.', checkBtn);
    };
  }
}

function renderThermometerCompare(step, content, checkBtn) {
  const row = document.createElement('div');
  row.className = 'thermo-wrap thermo-compare';

  const instrCol = document.createElement('div');
  instrCol.className = 'thermo-instr-col';
  instrCol.appendChild(makeInstruction(step));

  const thermoRow = document.createElement('div');
  thermoRow.className = 'thermo-pair';

  step.temperatures.forEach(temp => {
    const { wrap, fill } = buildThermometerVisual(step.min, step.max, step.tickStep || 10);
    const range = step.max - step.min;
    const pct = ((temp - step.min) / range) * 100;
    fill.style.height = Math.max(0, pct) + '%';
    // Label
    const label = document.createElement('div');
    label.className = 'thermo-temp-label';
    label.textContent = temp + '°';
    wrap.appendChild(label);
    thermoRow.appendChild(wrap);
  });

  row.appendChild(instrCol);
  row.appendChild(thermoRow);
  content.appendChild(row);

  const cd = document.createElement('div');
  cd.className = 'choices';
  step.choices.forEach((ch, i) => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = ch.text;
    btn.onclick = () => {
      cd.querySelectorAll('.choice-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedAnswer = i;
      checkBtn.className = 'check-btn';
    };
    cd.appendChild(btn);
  });
  instrCol.appendChild(cd);

  checkBtn.onclick = () => {
    if (checkBtn.classList.contains('disabled')) return;
    const ok = step.choices[selectedAnswer].correct;
    cd.querySelectorAll('.choice-btn')[selectedAnswer].classList.add(ok ? 'correct' : 'wrong');
    ok ? handleCorrect(checkBtn) : handleWrong(step.hint || 'Compare the heights of the red fill.', checkBtn);
  };
}

// ─── Elevation ────────────────────────────────────────────

function buildElevationVisual(min, max, tickStep, opts = {}) {
  const wrap = document.createElement('div');
  wrap.className = 'elev-visual';

  const range = max - min;
  const zeroPct = ((0 - min) / range) * 100;

  // Background zones
  const sky = document.createElement('div');
  sky.className = 'elev-sky';
  sky.style.height = (100 - zeroPct) + '%';
  wrap.appendChild(sky);

  const water = document.createElement('div');
  water.className = 'elev-water';
  water.style.height = zeroPct + '%';
  wrap.appendChild(water);

  // Sea level line
  const seaLine = document.createElement('div');
  seaLine.className = 'elev-sea-line';
  seaLine.style.bottom = zeroPct + '%';
  const seaLabel = document.createElement('span');
  seaLabel.className = 'elev-sea-label';
  seaLabel.textContent = 'Sea Level';
  seaLine.appendChild(seaLabel);
  wrap.appendChild(seaLine);

  // Simple mountain SVG
  const mtn = document.createElement('div');
  mtn.className = 'elev-mountain';
  mtn.style.bottom = zeroPct + '%';
  mtn.innerHTML = `<svg viewBox="0 0 120 80" preserveAspectRatio="none" width="100%" height="100%">
    <polygon points="20,80 60,8 100,80" fill="#8BC34A" opacity="0.6"/>
    <polygon points="50,80 80,25 110,80" fill="#689F38" opacity="0.5"/>
    <polygon points="55,15 60,8 65,15" fill="white" opacity="0.7"/>
  </svg>`;
  wrap.appendChild(mtn);

  // Waves at sea level
  const waves = document.createElement('div');
  waves.className = 'elev-waves';
  waves.style.bottom = (zeroPct - 2) + '%';
  waves.innerHTML = `<svg viewBox="0 0 120 12" preserveAspectRatio="none" width="100%" height="100%">
    <path d="M0,6 Q15,0 30,6 Q45,12 60,6 Q75,0 90,6 Q105,12 120,6" fill="none" stroke="#29B6F6" stroke-width="2" opacity="0.6"/>
  </svg>`;
  wrap.appendChild(waves);

  // Scale column (left side)
  const scale = document.createElement('div');
  scale.className = 'elev-scale';
  for (let t = min; t <= max; t += tickStep) {
    const pct = ((t - min) / range) * 100;
    const tick = document.createElement('div');
    tick.className = 'elev-tick';
    tick.style.bottom = pct + '%';
    const lbl = document.createElement('span');
    lbl.className = 'elev-tick-label';
    lbl.textContent = t + 'm';
    if (t === 0) { lbl.style.fontWeight = '900'; lbl.style.color = '#1a1a2e'; }
    tick.appendChild(lbl);
    const line = document.createElement('div');
    line.className = 'elev-tick-line';
    tick.appendChild(line);
    scale.appendChild(tick);
  }
  wrap.appendChild(scale);

  // Click zone (transparent overlay)
  const clickZone = document.createElement('div');
  clickZone.className = 'elev-click-zone';
  wrap.appendChild(clickZone);

  // Pointer
  const pointer = document.createElement('div');
  pointer.className = 'elev-pointer';
  pointer.style.display = 'none';
  wrap.appendChild(pointer);

  // Static points
  if (opts.staticPoints) {
    opts.staticPoints.forEach(v => {
      const pct = ((v - min) / range) * 100;
      const dot = document.createElement('div');
      dot.className = 'elev-static-point';
      dot.style.bottom = pct + '%';
      const dotLabel = document.createElement('span');
      dotLabel.className = 'elev-point-label';
      dotLabel.textContent = v + 'm';
      dot.appendChild(dotLabel);
      wrap.appendChild(dot);
    });
  }

  return { wrap, clickZone, pointer, range, min, max };
}

function renderElevation(step, content, checkBtn) {
  const isInteractive = step.target !== undefined && !step.choices;
  const hasChoices = step.choices && step.choices.length > 0;

  const row = document.createElement('div');
  row.className = 'elev-wrap';

  const instrCol = document.createElement('div');
  instrCol.className = 'elev-instr-col';
  instrCol.appendChild(makeInstruction(step));

  const { wrap, clickZone, pointer, range, min, max } = buildElevationVisual(
    step.min, step.max, step.tickStep || 20,
    { staticPoints: step.staticPoints }
  );

  row.appendChild(instrCol);
  row.appendChild(wrap);
  content.appendChild(row);

  if (isInteractive) {
    const tickStepVal = step.tickStep || 20;

    function setElev(e) {
      const rect = wrap.getBoundingClientRect();
      const y = rect.bottom - (e.clientY || e.touches[0].clientY);
      const pctRaw = y / rect.height;
      const raw = step.min + pctRaw * range;
      const snapped = Math.round(raw / tickStepVal) * tickStepVal;
      const clamped = Math.max(step.min, Math.min(step.max, snapped));
      pointValue = clamped;
      const pct = ((clamped - step.min) / range) * 100;
      pointer.style.display = 'flex';
      pointer.style.bottom = pct + '%';
      pointer.textContent = clamped + 'm';
      checkBtn.className = 'check-btn';
    }

    clickZone.addEventListener('click', setElev);
    clickZone.addEventListener('touchend', e => { e.preventDefault(); setElev(e); });

    checkBtn.onclick = () => {
      if (checkBtn.classList.contains('disabled')) return;
      if (pointValue === step.target) handleCorrect(checkBtn);
      else handleWrong(step.hint || 'Try clicking closer to ' + step.target + 'm on the scale.', checkBtn);
    };
  }

  if (hasChoices) {
    const cd = document.createElement('div');
    cd.className = 'choices';
    step.choices.forEach((ch, i) => {
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      btn.textContent = ch.text;
      btn.onclick = () => {
        cd.querySelectorAll('.choice-btn').forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');
        selectedAnswer = i;
        checkBtn.className = 'check-btn';
      };
      cd.appendChild(btn);
    });
    instrCol.appendChild(cd);

    checkBtn.onclick = () => {
      if (checkBtn.classList.contains('disabled')) return;
      const ok = step.choices[selectedAnswer].correct;
      cd.querySelectorAll('.choice-btn')[selectedAnswer].classList.add(ok ? 'correct' : 'wrong');
      ok ? handleCorrect(checkBtn) : handleWrong(step.hint || 'Look at the elevation diagram carefully.', checkBtn);
    };
  }
}

// ─── Celebrate ────────────────────────────────────────────

function renderCelebrate(step, content, checkBtn) {
  finishLesson();
}

// ─── Answer Handling ───────────────────────────────────────

function handleCorrect(checkBtn) {
  const earned = wasRetry ? 2 : 5;
  addBoba(earned);
  logEvent(true);
  streak++;

  if (streak > 0 && streak % 5 === 0) {
    addBoba(10);
    showStreakBonus();
  }

  showFeedback(true, null, earned);
  checkBtn.textContent = 'CONTINUE';
  checkBtn.className = 'check-btn next';
  checkBtn.onclick = () => advanceStep();
}

function handleWrong(hint, checkBtn) {
  if (!inFixMistakes) {
    if (!wrongSteps.includes(curStepIdx)) wrongSteps.push(curStepIdx);
  }
  addBoba(1);
  logEvent(false);
  streak = 0;
  showFeedback(false, hint);
  checkBtn.textContent = 'TRY AGAIN';
  checkBtn.className = 'check-btn try-again';
  checkBtn.onclick = () => { wasRetry = true; renderStep(); };
}

function showFeedback(ok, msg, earned) {
  const bar = document.getElementById('feedback-bar');
  bar.className = 'feedback-inline ' + (ok ? 'correct' : 'wrong');
  if (ok) {
    bar.textContent = curStepIdx === 0 && !inFixMistakes ? 'Great job! +' + (earned || 5) + ' boba' : 'Great job!';
  } else {
    bar.textContent = msg || 'Not quite!';
  }
}

function launchConfetti() {
  const c = document.createElement('div');
  c.className = 'confetti-container';
  document.body.appendChild(c);
  const colors = ['#57B477', '#6EC48E', '#ff4b4b', '#ffc800', '#ce82ff', '#3d9e65'];
  for (let i = 0; i < 60; i++) {
    const p = document.createElement('div');
    p.className = 'confetti';
    p.style.left = Math.random() * 100 + '%';
    p.style.background = colors[Math.floor(Math.random() * colors.length)];
    p.style.width = (Math.random() * 8 + 6) + 'px';
    p.style.height = (Math.random() * 8 + 6) + 'px';
    p.style.animationDuration = (Math.random() * 2 + 1.5) + 's';
    p.style.animationDelay = Math.random() + 's';
    c.appendChild(p);
  }
  setTimeout(() => c.remove(), 4000);
}

// ─── EDIT VIEW ─────────────────────────────────────────────

let editTab = 'steps';

function renderEdit() {
  const container = document.getElementById('edit-content');
  container.innerHTML = '';

  const tabs = document.createElement('div');
  tabs.className = 'edit-tabs';
  ['steps', 'stories'].forEach(t => {
    const b = document.createElement('button');
    b.className = 'edit-tab' + (editTab === t ? ' active' : '');
    b.textContent = t === 'steps' ? 'Steps' : 'Stories';
    b.onclick = () => { editTab = t; renderEdit(); };
    tabs.appendChild(b);
  });
  container.appendChild(tabs);

  if (editTab === 'stories') { renderEditStories(container); return; }

  const table = document.createElement('table');
  table.className = 'edit-table';
  table.innerHTML = '<thead><tr><th>Loc</th><th>Type</th><th>Instruction</th><th></th></tr></thead>';
  const tbody = document.createElement('tbody');

  data.modules.forEach((mod, mi) => {
    mod.sections.forEach((sec, si) => {
      sec.lessons.forEach((les, li) => {
        les.miniLessons.forEach((ml, mli) => {
          ml.steps.forEach((step, sti) => {
            const tr = document.createElement('tr');
            const tdLoc = document.createElement('td'); tdLoc.className = 'edit-loc'; tdLoc.textContent = (mi+1)+'-'+(si+1)+'-'+(li+1)+'-'+(mli+1)+'-'+(sti+1); tr.appendChild(tdLoc);
            const tdType = document.createElement('td'); tdType.className = 'edit-type-desc'; tdType.textContent = STEP_TYPE_DESC[step.type] || step.type; tr.appendChild(tdType);
            const tdInstr = document.createElement('td');
            const inp = document.createElement('textarea'); inp.className = 'edit-instruction-input'; inp.rows = 2; inp.value = step.instruction || '';
            const tdS = document.createElement('td'); const sv = document.createElement('span'); sv.className = 'edit-saved'; sv.textContent = 'Saved'; tdS.appendChild(sv);
            inp.addEventListener('change', () => { step.instruction = inp.value; saveData(); sv.classList.add('show'); setTimeout(() => sv.classList.remove('show'), 1500); });
            tdInstr.appendChild(inp); tr.appendChild(tdInstr); tr.appendChild(tdS);
            tbody.appendChild(tr);
          });
        });
      });
    });
  });
  table.appendChild(tbody);
  container.appendChild(table);
}

function renderEditStories(container) {
  if (!data.stories) data.stories = [];

  const wrap = document.createElement('div');
  wrap.className = 'stories-edit';

  data.stories.forEach((story, si) => {
    const card = document.createElement('div');
    card.className = 'story-edit-card';

    const title = document.createElement('div');
    title.className = 'story-edit-title';
    title.textContent = 'Story: ' + story.id + '  (tag: ' + story.tag + ')';
    card.appendChild(title);

    const tagRow = document.createElement('label');
    tagRow.className = 'story-edit-row';
    tagRow.innerHTML = '<span>Tag (mini-lesson, e.g. 1-1-1-2)</span>';
    const tagInp = document.createElement('input');
    tagInp.type = 'text';
    tagInp.value = story.tag || '';
    tagInp.addEventListener('change', () => { story.tag = tagInp.value.trim(); saveData(); flashSaved(card); });
    tagRow.appendChild(tagInp);
    card.appendChild(tagRow);

    const offerRow = document.createElement('label');
    offerRow.className = 'story-edit-row';
    offerRow.innerHTML = '<span>Offer text</span>';
    const offerInp = document.createElement('textarea');
    offerInp.rows = 2;
    offerInp.value = story.offer || '';
    offerInp.addEventListener('change', () => { story.offer = offerInp.value; saveData(); flashSaved(card); });
    offerRow.appendChild(offerInp);
    card.appendChild(offerRow);

    const pagesWrap = document.createElement('div');
    pagesWrap.className = 'story-pages-edit';
    story.pages.forEach((page, pi) => pagesWrap.appendChild(renderStoryPageEditor(story, page, pi, card)));
    card.appendChild(pagesWrap);

    const addPage = document.createElement('button');
    addPage.className = 'story-add-page-btn';
    addPage.textContent = '+ Add page';
    addPage.onclick = () => {
      story.pages.push({ image: '', text: '' });
      saveData();
      renderEdit();
    };
    card.appendChild(addPage);

    const saved = document.createElement('span');
    saved.className = 'edit-saved story-saved';
    saved.textContent = 'Saved';
    card.appendChild(saved);

    wrap.appendChild(card);
  });

  const addStory = document.createElement('button');
  addStory.className = 'story-add-btn';
  addStory.textContent = '+ New story';
  addStory.onclick = () => {
    const id = 'story-' + (data.stories.length + 1);
    data.stories.push({ id: id, tag: '', offer: '', pages: [{ image: '', text: '' }] });
    saveData();
    renderEdit();
  };
  wrap.appendChild(addStory);

  container.appendChild(wrap);
}

function renderStoryPageEditor(story, page, pi, card) {
  const row = document.createElement('div');
  row.className = 'story-page-edit';

  const left = document.createElement('div');
  left.className = 'story-page-img-col';
  const img = document.createElement('img');
  img.className = 'story-page-thumb';
  img.alt = '';
  if (page.image) img.src = page.image;
  else img.style.display = 'none';
  left.appendChild(img);

  const fileInp = document.createElement('input');
  fileInp.type = 'file';
  fileInp.accept = 'image/*';
  fileInp.className = 'story-file-input';
  const uploadBtn = document.createElement('button');
  uploadBtn.className = 'story-upload-btn';
  uploadBtn.textContent = page.image ? 'Replace image' : 'Upload image';
  uploadBtn.onclick = () => fileInp.click();
  fileInp.addEventListener('change', async () => {
    const file = fileInp.files[0];
    if (!file) return;
    uploadBtn.textContent = 'Uploading…';
    uploadBtn.disabled = true;
    try {
      const ext = (file.name.split('.').pop() || 'png').toLowerCase();
      const path = story.id + '/page' + (pi + 1) + '-' + Date.now() + '.' + ext;
      const { error: upErr } = await sb.storage.from('stories').upload(path, file, { upsert: true, contentType: file.type });
      if (upErr) throw upErr;
      const { data: pub } = sb.storage.from('stories').getPublicUrl(path);
      page.image = pub.publicUrl;
      img.src = page.image;
      img.style.display = '';
      await saveData();
      uploadBtn.textContent = 'Replace image';
      flashSaved(card);
    } catch (e) {
      console.error(e);
      uploadBtn.textContent = 'Upload failed — retry';
      alert('Upload failed: ' + (e.message || e));
    } finally {
      uploadBtn.disabled = false;
      fileInp.value = '';
    }
  });
  left.appendChild(uploadBtn);
  left.appendChild(fileInp);
  row.appendChild(left);

  const right = document.createElement('div');
  right.className = 'story-page-text-col';
  const lbl = document.createElement('div');
  lbl.className = 'story-page-label';
  lbl.textContent = 'Page ' + (pi + 1) + ' text';
  right.appendChild(lbl);
  const txt = document.createElement('textarea');
  txt.rows = 3;
  txt.value = page.text || '';
  txt.addEventListener('change', () => { page.text = txt.value; saveData(); flashSaved(card); });
  right.appendChild(txt);

  const del = document.createElement('button');
  del.className = 'story-page-del';
  del.textContent = 'Delete page';
  del.onclick = () => {
    if (!confirm('Delete page ' + (pi + 1) + '?')) return;
    story.pages.splice(pi, 1);
    saveData();
    renderEdit();
  };
  right.appendChild(del);

  row.appendChild(right);
  return row;
}

function flashSaved(card) {
  const sv = card.querySelector('.story-saved');
  if (!sv) return;
  sv.classList.add('show');
  setTimeout(() => sv.classList.remove('show'), 1500);
}

// ─── Init ──────────────────────────────────────────────────

loadData();
