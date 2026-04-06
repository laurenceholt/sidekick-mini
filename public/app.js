// ─── State ─────────────────────────────────────────────────

let data = null;
let progress = {};
let gems = 0;
let lives = 3;

let curModule = null;
let curSection = null;
let curLesson = null;
let curStepIdx = 0;
let selectedAnswer = null;
let pointValue = null;
let wrongSteps = [];       // indices of steps answered wrong
let inFixMistakes = false; // are we in the fix-mistakes replay?
let fixQueue = [];         // steps to replay

const ACCENT = '#57B477';
const STEP_TYPE_DESC = {
  'place-point': 'Place a point on a number line',
  'move-point': 'Drag a point along a number line',
  'equation-input': 'Type the answer to an equation',
  'multiple-choice': 'Choose from multiple options',
  'number-line-choice': 'Pick between two points on a number line',
  'celebrate': 'Celebration screen'
};

// ─── Data Loading ──────────────────────────────────────────

async function loadData() {
  const fresh = await (await fetch('/lessons.json')).json();
  const saved = localStorage.getItem('sidekick-lessons');
  if (saved) {
    const parsed = JSON.parse(saved);
    // If saved version matches, use saved (preserves edits). Otherwise use fresh.
    if (parsed.version && parsed.version === fresh.version) {
      data = parsed;
    } else {
      data = fresh;
      localStorage.removeItem('sidekick-lessons');
    }
  } else {
    data = fresh;
  }
  const sp = localStorage.getItem('sidekick-progress');
  if (sp) progress = JSON.parse(sp);
  const sg = localStorage.getItem('sidekick-gems');
  if (sg) gems = parseInt(sg, 10);
  route();
}

function saveData() { localStorage.setItem('sidekick-lessons', JSON.stringify(data)); }
function saveProgress() { localStorage.setItem('sidekick-progress', JSON.stringify(progress)); localStorage.setItem('sidekick-gems', gems); }

// ─── Routing ───────────────────────────────────────────────

function route() {
  const hash = location.hash || '#map';
  document.querySelectorAll('.view').forEach(v => { v.style.display = 'none'; v.classList.remove('active'); });
  if (hash === '#edit') { showView('view-edit'); renderEdit(); }
  else if (hash.startsWith('#lesson/')) { const p = hash.replace('#lesson/', '').split('/'); startLesson(p[0], p[1], p[2]); }
  else { showView('view-map'); renderMap(); }
}

function showView(id) { const el = document.getElementById(id); el.style.display = 'flex'; el.classList.add('active'); }
window.addEventListener('hashchange', route);

// ─── Data Helpers ──────────────────────────────────────────

function findModule(mId) { return data.modules.find(m => m.id === mId); }
function findSection(mod, sId) { return mod.sections.find(s => s.id === sId); }
function findLesson(sec, lId) { return sec.lessons.find(l => l.id === lId); }
function lessonKey(mId, sId, lId) { return mId + '-' + sId + '-' + lId; }
function isLessonCompleted(mId, sId, lId) { const p = progress[lessonKey(mId, sId, lId)]; return p && p.completed; }

function getFirstIncompleteLessonKey(mod) {
  for (const sec of mod.sections)
    for (const les of sec.lessons)
      if (!isLessonCompleted(mod.id, sec.id, les.id) && les.steps.length > 0)
        return { mId: mod.id, sId: sec.id, lId: les.id };
  return null;
}

// ─── MAP VIEW ──────────────────────────────────────────────

function renderMap() {
  const mod = data.modules[0];
  document.getElementById('map-module-title').textContent = mod.title;
  document.getElementById('map-gems-count').textContent = gems;
  const container = document.getElementById('map-content');
  container.innerHTML = '';
  const firstIncomplete = getFirstIncompleteLessonKey(mod);
  let lessonIndex = 0;

  mod.sections.forEach((sec, si) => {
    const secDiv = document.createElement('div');
    secDiv.className = 'map-section';
    secDiv.innerHTML = '<div class="map-section-title">' + sec.title + '</div>';
    container.appendChild(secDiv);
    const path = document.createElement('div');
    path.className = 'map-path';

    sec.lessons.forEach((les, li) => {
      if (les.steps.length === 0) return; // skip empty lessons
      lessonIndex++;
      const completed = isLessonCompleted(mod.id, sec.id, les.id);
      const isCurrent = firstIncomplete && firstIncomplete.lId === les.id && firstIncomplete.sId === sec.id;
      const isAvailable = completed || isCurrent;
      if (li > 0 || si > 0) { const conn = document.createElement('div'); conn.className = 'map-connector' + (completed ? ' completed' : ''); path.appendChild(conn); }
      const node = document.createElement('div');
      node.className = 'map-node' + (completed ? ' completed' : '') + (isCurrent ? ' current' : '');
      const circle = document.createElement('div');
      circle.className = 'map-node-circle' + (completed ? ' completed' : isCurrent ? ' current' : isAvailable ? ' available' : ' locked');
      circle.textContent = completed ? '✓' : lessonIndex;
      const label = document.createElement('div');
      label.className = 'map-node-label';
      label.textContent = les.title;
      node.appendChild(circle);
      node.appendChild(label);
      if (isAvailable) node.onclick = () => { location.hash = '#lesson/' + mod.id + '/' + sec.id + '/' + les.id; };
      path.appendChild(node);
    });

    const allDone = sec.lessons.filter(l => l.steps.length > 0).every(l => isLessonCompleted(mod.id, sec.id, l.id));
    const conn = document.createElement('div');
    conn.className = 'map-connector' + (allDone ? ' completed' : '');
    path.appendChild(conn);
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
    path.appendChild(cn);
    container.appendChild(path);
  });
}

// ─── LESSON VIEW ───────────────────────────────────────────

function startLesson(mId, sId, lId) {
  showView('view-lesson');
  curModule = findModule(mId);
  curSection = findSection(curModule, sId);
  curLesson = findLesson(curSection, lId);
  curStepIdx = 0;
  lives = 3;
  wrongSteps = [];
  inFixMistakes = false;
  fixQueue = [];
  document.getElementById('close-btn').onclick = () => { location.hash = '#map'; };
  renderStep();
}

function getCurrentStep() {
  if (inFixMistakes) return fixQueue[curStepIdx];
  return curLesson.steps[curStepIdx];
}

function getTotalSteps() {
  if (inFixMistakes) return fixQueue.length;
  return curLesson.steps.length;
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
  document.getElementById('gems-count').textContent = gems;
  const mIdx = data.modules.indexOf(curModule) + 1;
  const sIdx = curModule.sections.indexOf(curSection) + 1;
  const lIdx = curSection.lessons.indexOf(curLesson) + 1;
  document.getElementById('step-number').textContent = mIdx + '-' + sIdx + '-' + lIdx + '-' + (curStepIdx + 1);
  updateLives();
  content.innerHTML = '';

  switch (step.type) {
    case 'place-point': renderPlacePoint(step, content, checkBtn); break;
    case 'move-point': renderMovePoint(step, content, checkBtn); break;
    case 'equation-input': renderEquationInput(step, content, checkBtn); break;
    case 'multiple-choice': renderMultipleChoice(step, content, checkBtn); break;
    case 'number-line-choice': renderNumberLineChoice(step, content, checkBtn); break;
    case 'celebrate': renderCelebrate(step, content, checkBtn); break;
  }
}

function advanceStep() {
  curStepIdx++;
  const total = getTotalSteps();
  if (curStepIdx < total) {
    renderStep();
  } else if (!inFixMistakes && wrongSteps.length > 0) {
    // Show fix-mistakes interstitial
    showFixMistakes();
  } else {
    // Lesson done — show celebrate
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
    <div class="sub-text">No lives lost this time.</div>
    <button class="continue-map-btn">CONTINUE</button>
  `;
  card.querySelector('.continue-map-btn').onclick = () => {
    // Build fix queue from wrong steps
    fixQueue = wrongSteps.map(i => curLesson.steps[i]);
    inFixMistakes = true;
    curStepIdx = 0;
    lives = 3;
    renderStep();
  };
  content.appendChild(card);
  checkBtn.style.display = 'none';
}

function finishLesson() {
  gems += 15;
  saveProgress();
  const key = lessonKey(curModule.id, curSection.id, curLesson.id);
  progress[key] = { completed: true };
  saveProgress();

  const content = document.getElementById('step-content');
  const checkBtn = document.getElementById('check-btn');
  content.innerHTML = '';
  document.getElementById('feedback-bar').className = 'feedback-inline hidden';
  document.getElementById('progress-bar').style.width = '100%';
  document.getElementById('gems-count').textContent = gems;

  const cel = document.createElement('div');
  cel.className = 'celebrate';
  cel.innerHTML = `
    <div class="trophy">&#127942;</div>
    <div class="congrats-text">Amazing work!</div>
    <div class="sub-text">Lesson complete!</div>
    <div class="gems-earned">&#x1F48E; +15 gems!</div>
    <button class="continue-map-btn">CONTINUE</button>
  `;
  cel.querySelector('.continue-map-btn').onclick = () => { location.hash = '#map'; };
  content.appendChild(cel);
  checkBtn.style.display = 'none';
  launchConfetti();
}

// ─── Lives ─────────────────────────────────────────────────

function updateLives() {
  for (let i = 0; i < 3; i++) { const h = document.getElementById('heart-' + i); if (i < lives) h.classList.remove('lost'); else h.classList.add('lost'); }
}

function loseLife() {
  if (inFixMistakes) return; // no life loss during fix-mistakes
  if (lives > 0) {
    lives--;
    document.getElementById('heart-' + lives).classList.add('breaking');
    setTimeout(() => updateLives(), 500);
    if (lives === 0) setTimeout(showGameOver, 700);
  }
}

function showGameOver() {
  const o = document.createElement('div');
  o.className = 'game-over-overlay';
  o.innerHTML = '<div class="game-over-card"><div class="sad-emoji">😢</div><h2>Out of lives!</h2><p>No worries — let\'s try again!</p><button class="restart-btn">START OVER</button></div>';
  document.body.appendChild(o);
  o.querySelector('.restart-btn').onclick = () => { o.remove(); curStepIdx = 0; lives = 3; wrongSteps = []; inFixMistakes = false; fixQueue = []; updateLives(); renderStep(); };
}

// ─── Number Line ───────────────────────────────────────────

function buildNumberLine(container, min, max, options = {}) {
  const nlc = document.createElement('div');
  nlc.className = 'number-line-container';
  const line = document.createElement('div');
  line.className = 'number-line';
  const range = max - min;
  for (let i = min; i <= max; i++) {
    const pct = ((i - min) / range) * 100;
    const tick = document.createElement('div'); tick.className = 'tick'; tick.style.left = pct + '%'; line.appendChild(tick);
    const lbl = document.createElement('div');
    lbl.className = 'tick-label' + (options.highlightValues && options.highlightValues.includes(i) ? ' highlight' : '');
    lbl.style.left = pct + '%'; lbl.textContent = i; line.appendChild(lbl);
  }
  if (options.ghostAt !== undefined) {
    const ghost = document.createElement('div');
    ghost.className = 'ghost-start';
    ghost.style.left = ((options.ghostAt - min) / range) * 100 + '%';
    line.appendChild(ghost);
  }
  // Static dots (for number-line-choice)
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

function addClickablePoint(nlc, line, min, max, onChange) {
  const range = max - min;
  let point = null, drag = false;
  function val(cx) { const r = line.getBoundingClientRect(); return Math.round(min + Math.max(0, Math.min(1, (cx - r.left) / r.width)) * range); }
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

  // SVG for jump arcs — positioned above the number line
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

    // Get actual pixel positions from the line
    const lineRect = line.getBoundingClientRect();
    const svgRect = svg.getBoundingClientRect();
    const lineW = lineRect.width;
    const svgW = svgRect.width;
    const svgH = svgRect.height;
    if (svgW === 0 || svgH === 0) return;

    svg.setAttribute('viewBox', `0 0 ${svgW} ${svgH}`);
    svg.setAttribute('preserveAspectRatio', 'xMidYMid meet');

    const s = from < to ? 1 : -1;
    const offsetX = lineRect.left - svgRect.left; // offset between svg and line
    const baseY = svgH; // bottom of SVG

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

      // Small downward arrowhead
      const aW = 4, aH = 7;
      const arrow = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      arrow.setAttribute('points', `${x2},${baseY} ${x2 - aW},${baseY - aH} ${x2 + aW},${baseY - aH}`);
      arrow.setAttribute('fill', ACCENT);
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
  // Draw a fat arrow pointing left or right
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 80 40');
  svg.setAttribute('width', '80');
  svg.setAttribute('height', '40');
  svg.style.display = 'block';
  svg.style.margin = '0 auto';

  const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  if (direction === 'left') {
    path.setAttribute('d', 'M 5 20 L 30 5 L 30 13 L 75 13 L 75 27 L 30 27 L 30 35 Z');
  } else {
    path.setAttribute('d', 'M 75 20 L 50 5 L 50 13 L 5 13 L 5 27 L 50 27 L 50 35 Z');
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
  el.textContent = step.instruction;
  return el;
}

function renderPlacePoint(step, content, checkBtn) {
  content.appendChild(makeInstruction(step));
  if (step.equationLabel) content.appendChild(buildEqLabel(step.equationLabel));
  const { nlContainer, line } = buildNumberLine(content, step.min, step.max);
  content.appendChild(nlContainer);
  addClickablePoint(nlContainer, line, step.min, step.max, () => { checkBtn.className = 'check-btn'; });
  checkBtn.onclick = () => {
    if (checkBtn.classList.contains('disabled')) return;
    if (pointValue === step.target) handleCorrect(checkBtn);
    else handleWrong(step.target < 0 ? "Look for the negative side — it's to the LEFT of zero." : "Look for the positive side — it's to the RIGHT of zero.", checkBtn);
  };
}

function renderMovePoint(step, content, checkBtn) {
  content.appendChild(makeInstruction(step));
  if (step.equationLabel) content.appendChild(buildEqLabel(step.equationLabel));
  const { nlContainer, line } = buildNumberLine(content, step.min, step.max);
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
    const opts = { highlightValues: hl };
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
  const cd = document.createElement('div');
  cd.className = 'choices';
  step.choices.forEach((ch, i) => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    // If choice has an arrow property, draw SVG arrow instead of text
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
    highlightValues: step.points
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

function renderCelebrate(step, content, checkBtn) {
  // Old celebrate type — just advance
  finishLesson();
}

// ─── Answer Handling ───────────────────────────────────────

function handleCorrect(checkBtn) {
  gems += 3;
  saveProgress();
  document.getElementById('gems-count').textContent = gems;
  showFeedback(true);
  checkBtn.textContent = 'CONTINUE';
  checkBtn.className = 'check-btn next';
  checkBtn.onclick = () => advanceStep();
}

function handleWrong(hint, checkBtn) {
  // Track which original step was wrong (only during first pass)
  if (!inFixMistakes) {
    if (!wrongSteps.includes(curStepIdx)) wrongSteps.push(curStepIdx);
  }
  loseLife();
  showFeedback(false, hint);
  checkBtn.textContent = 'TRY AGAIN';
  checkBtn.className = 'check-btn try-again';
  checkBtn.onclick = () => renderStep();
}

function showFeedback(ok, msg) {
  const bar = document.getElementById('feedback-bar');
  bar.className = 'feedback-inline ' + (ok ? 'correct' : 'wrong');
  bar.textContent = ok ? 'Great job! ✓' : (msg || 'Not quite!');
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

function renderEdit() {
  const container = document.getElementById('edit-content');
  container.innerHTML = '';
  const table = document.createElement('table');
  table.className = 'edit-table';
  table.innerHTML = '<thead><tr><th>Loc</th><th>Type</th><th>Instruction</th><th></th></tr></thead>';
  const tbody = document.createElement('tbody');

  data.modules.forEach((mod, mi) => {
    mod.sections.forEach((sec, si) => {
      sec.lessons.forEach((les, li) => {
        les.steps.forEach((step, sti) => {
          const tr = document.createElement('tr');
          const tdLoc = document.createElement('td'); tdLoc.className = 'edit-loc'; tdLoc.textContent = (mi+1)+'-'+(si+1)+'-'+(li+1)+'-'+(sti+1); tr.appendChild(tdLoc);
          const tdType = document.createElement('td'); tdType.className = 'edit-type-desc'; tdType.textContent = STEP_TYPE_DESC[step.type] || step.type; tr.appendChild(tdType);
          const tdInstr = document.createElement('td');
          const inp = document.createElement('input'); inp.className = 'edit-instruction-input'; inp.value = step.instruction || '';
          const tdS = document.createElement('td'); const sv = document.createElement('span'); sv.className = 'edit-saved'; sv.textContent = 'Saved'; tdS.appendChild(sv);
          inp.addEventListener('change', () => { step.instruction = inp.value; saveData(); sv.classList.add('show'); setTimeout(() => sv.classList.remove('show'), 1500); });
          tdInstr.appendChild(inp); tr.appendChild(tdInstr); tr.appendChild(tdS);
          tbody.appendChild(tr);
        });
      });
    });
  });
  table.appendChild(tbody);
  container.appendChild(table);
}

// ─── Init ──────────────────────────────────────────────────

loadData();
