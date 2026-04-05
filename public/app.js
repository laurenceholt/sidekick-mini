// ─── State ─────────────────────────────────────────────────

let data = null;         // full module data
let progress = {};       // { "m1-s1-l1": { completed: true, gems: 5 } }
let gems = 0;
let lives = 3;

// Current lesson context
let curModule = null;
let curSection = null;
let curLesson = null;
let curStepIdx = 0;
let subStep = 0;
let selectedAnswer = null;
let pointValue = null;

const ACCENT = '#57B477';
const STEP_TYPE_DESC = {
  'place-point': 'Place a point on a number line',
  'move-point': 'Drag a point along a number line',
  'equation-input': 'Type the answer to an equation',
  'multiple-choice': 'Choose from multiple options',
  'place-and-move': 'Place, move a point, then solve',
  'celebrate': 'Celebration screen'
};

// ─── Data Loading ──────────────────────────────────────────

async function loadData() {
  const saved = localStorage.getItem('sidekick-lessons');
  if (saved) {
    const parsed = JSON.parse(saved);
    // Check for old flat format and discard it
    if (parsed.modules) {
      data = parsed;
    } else {
      localStorage.removeItem('sidekick-lessons');
      const res = await fetch('/lessons.json');
      data = await res.json();
    }
  } else {
    const res = await fetch('/lessons.json');
    data = await res.json();
  }
  const savedProgress = localStorage.getItem('sidekick-progress');
  if (savedProgress) progress = JSON.parse(savedProgress);
  const savedGems = localStorage.getItem('sidekick-gems');
  if (savedGems) gems = parseInt(savedGems, 10);
  route();
}

function saveData() {
  localStorage.setItem('sidekick-lessons', JSON.stringify(data));
}

function saveProgress() {
  localStorage.setItem('sidekick-progress', JSON.stringify(progress));
  localStorage.setItem('sidekick-gems', gems);
}

// ─── Routing ───────────────────────────────────────────────

function route() {
  const hash = location.hash || '#map';
  document.querySelectorAll('.view').forEach(v => {
    v.style.display = 'none';
    v.classList.remove('active');
  });

  if (hash === '#edit') {
    showView('view-edit');
    renderEdit();
  } else if (hash.startsWith('#lesson/')) {
    const parts = hash.replace('#lesson/', '').split('/');
    startLesson(parts[0], parts[1], parts[2]);
  } else {
    showView('view-map');
    renderMap();
  }
}

function showView(id) {
  const el = document.getElementById(id);
  el.style.display = 'flex';
  el.classList.add('active');
}

window.addEventListener('hashchange', route);

// ─── Helpers to find data ──────────────────────────────────

function findModule(mId) { return data.modules.find(m => m.id === mId); }
function findSection(mod, sId) { return mod.sections.find(s => s.id === sId); }
function findLesson(sec, lId) { return sec.lessons.find(l => l.id === lId); }

function lessonKey(mId, sId, lId) { return mId + '-' + sId + '-' + lId; }

function isLessonCompleted(mId, sId, lId) {
  const p = progress[lessonKey(mId, sId, lId)];
  return p && p.completed;
}

function getFirstIncompleteLessonKey(mod) {
  for (const sec of mod.sections) {
    for (const les of sec.lessons) {
      if (!isLessonCompleted(mod.id, sec.id, les.id)) {
        return { mId: mod.id, sId: sec.id, lId: les.id };
      }
    }
  }
  return null; // all complete
}

// ─── MAP VIEW ──────────────────────────────────────────────

function renderMap() {
  const mod = data.modules[0]; // for now, single module
  document.getElementById('map-module-title').textContent = mod.title;
  document.getElementById('map-gems-count').textContent = gems;

  const container = document.getElementById('map-content');
  container.innerHTML = '';

  const firstIncomplete = getFirstIncompleteLessonKey(mod);
  let lessonIndex = 0;

  mod.sections.forEach((sec, si) => {
    // Section header
    const secDiv = document.createElement('div');
    secDiv.className = 'map-section';
    secDiv.innerHTML = '<div class="map-section-title">' + sec.title + '</div>';
    container.appendChild(secDiv);

    const path = document.createElement('div');
    path.className = 'map-path';

    sec.lessons.forEach((les, li) => {
      lessonIndex++;
      const key = lessonKey(mod.id, sec.id, les.id);
      const completed = isLessonCompleted(mod.id, sec.id, les.id);
      const isCurrent = firstIncomplete && firstIncomplete.lId === les.id && firstIncomplete.sId === sec.id;
      const isAvailable = completed || isCurrent;

      // Connector (not before first)
      if (li > 0 || si > 0) {
        const conn = document.createElement('div');
        conn.className = 'map-connector' + (completed ? ' completed' : '');
        path.appendChild(conn);
      }

      const node = document.createElement('div');
      node.className = 'map-node' + (completed ? ' completed' : '') + (isCurrent ? ' current' : '');

      const circle = document.createElement('div');
      let circleClass = 'map-node-circle';
      if (completed) circleClass += ' completed';
      else if (isCurrent) circleClass += ' current';
      else if (isAvailable) circleClass += ' available';
      else circleClass += ' locked';
      circle.className = circleClass;
      circle.textContent = completed ? '✓' : lessonIndex;

      const label = document.createElement('div');
      label.className = 'map-node-label';
      label.textContent = les.title;

      node.appendChild(circle);
      node.appendChild(label);

      if (isAvailable) {
        node.onclick = () => {
          location.hash = '#lesson/' + mod.id + '/' + sec.id + '/' + les.id;
        };
      }

      path.appendChild(node);
    });

    // Section check node at end of section
    const allInSection = sec.lessons.every(l => isLessonCompleted(mod.id, sec.id, l.id));
    const conn = document.createElement('div');
    conn.className = 'map-connector' + (allInSection ? ' completed' : '');
    path.appendChild(conn);

    const checkNode = document.createElement('div');
    checkNode.className = 'map-node' + (allInSection ? ' completed' : '');
    const checkCircle = document.createElement('div');
    checkCircle.className = 'map-node-circle section-check' + (allInSection ? ' completed' : '');
    checkCircle.textContent = allInSection ? '★' : '☆';
    const checkLabel = document.createElement('div');
    checkLabel.className = 'map-node-label';
    checkLabel.textContent = 'Section Check';
    checkNode.appendChild(checkCircle);
    checkNode.appendChild(checkLabel);
    path.appendChild(checkNode);

    container.appendChild(path);
  });
}

// ─── LESSON VIEW ───────────────────────────────────────────

function startLesson(mId, sId, lId) {
  showView('view-lesson');
  const mod = findModule(mId);
  const sec = findSection(mod, sId);
  const les = findLesson(sec, lId);

  curModule = mod;
  curSection = sec;
  curLesson = les;
  curStepIdx = 0;
  lives = 3;
  subStep = 0;

  document.getElementById('close-btn').onclick = () => { location.hash = '#map'; };
  renderStep();
}

function renderStep() {
  const steps = curLesson.steps;
  const step = steps[curStepIdx];
  const content = document.getElementById('step-content');
  const checkBtn = document.getElementById('check-btn');
  const feedbackBar = document.getElementById('feedback-bar');

  feedbackBar.className = 'feedback-bar hidden';
  checkBtn.textContent = 'CHECK';
  checkBtn.className = 'check-btn disabled';
  checkBtn.style.display = '';
  checkBtn.onclick = null;
  selectedAnswer = null;
  pointValue = null;
  subStep = 0;

  // Progress
  const pct = (curStepIdx / steps.length) * 100;
  document.getElementById('progress-bar').style.width = pct + '%';
  document.getElementById('gems-count').textContent = gems;

  // Step number: module-section-lesson-step
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
    case 'place-and-move': renderPlaceAndMove(step, content, checkBtn); break;
    case 'celebrate': renderCelebrate(step, content, checkBtn); break;
  }
}

// ─── Lives ─────────────────────────────────────────────────

function updateLives() {
  for (let i = 0; i < 3; i++) {
    const h = document.getElementById('heart-' + i);
    if (i < lives) h.classList.remove('lost');
    else h.classList.add('lost');
  }
}

function loseLife() {
  if (lives > 0) {
    lives--;
    const h = document.getElementById('heart-' + lives);
    h.classList.add('breaking');
    setTimeout(() => updateLives(), 500);
    if (lives === 0) setTimeout(showGameOver, 700);
  }
}

function showGameOver() {
  const overlay = document.createElement('div');
  overlay.className = 'game-over-overlay';
  overlay.innerHTML = `
    <div class="game-over-card">
      <div class="sad-emoji">😢</div>
      <h2>Out of lives!</h2>
      <p>No worries — let's try again!</p>
      <button class="restart-btn">START OVER</button>
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.querySelector('.restart-btn').onclick = () => {
    overlay.remove();
    curStepIdx = 0;
    lives = 3;
    updateLives();
    renderStep();
  };
}

// ─── Number Line ───────────────────────────────────────────

function buildNumberLine(container, min, max, options = {}) {
  const nlContainer = document.createElement('div');
  nlContainer.className = 'number-line-container';
  const line = document.createElement('div');
  line.className = 'number-line';
  const range = max - min;
  for (let i = min; i <= max; i++) {
    const pct = ((i - min) / range) * 100;
    const tick = document.createElement('div');
    tick.className = 'tick';
    tick.style.left = pct + '%';
    line.appendChild(tick);
    const label = document.createElement('div');
    label.className = 'tick-label' + (options.highlightValues && options.highlightValues.includes(i) ? ' highlight' : '');
    label.style.left = pct + '%';
    label.textContent = i;
    line.appendChild(label);
  }
  nlContainer.appendChild(line);
  return { nlContainer, line, range, min, max };
}

function addClickablePoint(nlContainer, line, min, max, onChange) {
  const range = max - min;
  let point = null, isDragging = false;
  function valFromX(cx) {
    const r = line.getBoundingClientRect();
    return Math.round(min + Math.max(0, Math.min(1, (cx - r.left) / r.width)) * range);
  }
  function setVal(v) {
    pointValue = v;
    if (!point) { point = document.createElement('div'); point.className = 'point placed'; line.appendChild(point); }
    point.style.left = ((v - min) / range) * 100 + '%';
    if (onChange) onChange(v);
  }
  const zone = document.createElement('div');
  zone.className = 'click-zone';
  line.appendChild(zone);
  zone.addEventListener('mousedown', e => { setVal(valFromX(e.clientX)); isDragging = true; });
  zone.addEventListener('touchstart', e => { e.preventDefault(); setVal(valFromX(e.touches[0].clientX)); isDragging = true; });
  document.addEventListener('mousemove', e => { if (isDragging) setVal(valFromX(e.clientX)); });
  document.addEventListener('touchmove', e => { if (isDragging) setVal(valFromX(e.touches[0].clientX)); });
  document.addEventListener('mouseup', () => { isDragging = false; });
  document.addEventListener('touchend', () => { isDragging = false; });
  return { setPointValue: setVal };
}

function addDraggablePoint(nlContainer, line, min, max, startVal, onChange) {
  const range = max - min;
  pointValue = startVal;

  const ghost = document.createElement('div');
  ghost.className = 'ghost-start';
  ghost.style.left = ((startVal - min) / range) * 100 + '%';
  line.appendChild(ghost);

  const arrowSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  arrowSvg.setAttribute('class', 'jump-arrows');
  arrowSvg.setAttribute('viewBox', '0 0 100 100');
  arrowSvg.setAttribute('preserveAspectRatio', 'none');
  arrowSvg.style.width = '100%';
  arrowSvg.style.height = '100%';
  nlContainer.appendChild(arrowSvg);

  const point = document.createElement('div');
  point.className = 'point';
  point.style.left = ((startVal - min) / range) * 100 + '%';
  line.appendChild(point);

  let isDragging = false;
  function valFromX(cx) {
    const r = line.getBoundingClientRect();
    return Math.round(min + Math.max(0, Math.min(1, (cx - r.left) / r.width)) * range);
  }

  function drawArrows(from, to) {
    arrowSvg.innerHTML = '';
    if (from === to) return;
    const s = from < to ? 1 : -1;
    for (let i = 0; i < Math.abs(to - from); i++) {
      const a = from + i * s, b = a + s;
      const x1 = ((a - min) / range) * 100, x2 = ((b - min) / range) * 100;
      const sweep = s > 0 ? 1 : 0, rad = Math.abs(x2 - x1) / 2;
      const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
      path.setAttribute('d', `M ${x1} 95 A ${rad} 40 0 0 ${sweep} ${x2} 95`);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', ACCENT);
      path.setAttribute('stroke-width', '2.5');
      path.setAttribute('vector-effect', 'non-scaling-stroke');
      arrowSvg.appendChild(path);
      const tip = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      const sz = 2;
      tip.setAttribute('points', s > 0
        ? `${x2},95 ${x2-sz},${95-sz*1.5} ${x2-sz},${95+sz*1.5}`
        : `${x2},95 ${x2+sz},${95-sz*1.5} ${x2+sz},${95+sz*1.5}`);
      tip.setAttribute('fill', ACCENT);
      arrowSvg.appendChild(tip);
    }
  }

  function update(v) {
    pointValue = v;
    point.style.left = ((v - min) / range) * 100 + '%';
    drawArrows(startVal, v);
    if (onChange) onChange(v);
  }

  point.addEventListener('mousedown', e => { e.preventDefault(); isDragging = true; });
  point.addEventListener('touchstart', e => { e.preventDefault(); isDragging = true; });
  document.addEventListener('mousemove', e => { if (isDragging) update(valFromX(e.clientX)); });
  document.addEventListener('touchmove', e => { if (isDragging) update(valFromX(e.touches[0].clientX)); });
  document.addEventListener('mouseup', () => { isDragging = false; });
  document.addEventListener('touchend', () => { isDragging = false; });
  return { point, updatePoint: update };
}

// ─── Equation Builder ──────────────────────────────────────

function buildEquation(eqStr, step) {
  const div = document.createElement('div');
  div.className = 'equation';
  const tokens = eqStr.split(/(\s*[+\−\-=]\s*)/);
  tokens.forEach(tok => {
    const span = document.createElement('span');
    const t = tok.trim();
    if (t === '+' || t === '−' || t === '-' || t === '=') span.className = 'op';
    span.textContent = tok;
    div.appendChild(span);
  });
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
  const tokens = eqStr.split(/(\s*[+\−\-=]\s*)/);
  tokens.forEach(tok => {
    const span = document.createElement('span');
    const t = tok.trim();
    if (t === '+' || t === '−' || t === '-' || t === '=') span.className = 'op';
    span.textContent = tok;
    div.appendChild(span);
  });
  const q = document.createElement('span');
  q.textContent = ' ?';
  q.className = 'op';
  div.appendChild(q);
  return div;
}

// ─── Step Renderers ────────────────────────────────────────

function makeInstruction(step, field) {
  const el = document.createElement('div');
  el.className = 'instruction';
  el.textContent = step[field];
  return el;
}

function renderPlacePoint(step, content, checkBtn) {
  content.appendChild(makeInstruction(step, 'instruction'));
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
  content.appendChild(makeInstruction(step, 'instruction'));
  const { nlContainer, line } = buildNumberLine(content, step.min, step.max);
  content.appendChild(nlContainer);
  addDraggablePoint(nlContainer, line, step.min, step.max, step.startValue, () => { checkBtn.className = 'check-btn'; });
  checkBtn.onclick = () => {
    if (checkBtn.classList.contains('disabled')) return;
    if (pointValue === step.target) handleCorrect(checkBtn);
    else {
      const dir = step.moveBy > 0 ? 'right' : 'left';
      handleWrong(`Adding ${Math.abs(step.moveBy)} means move ${Math.abs(step.moveBy)} spaces to the ${dir}.`, checkBtn);
    }
  };
}

function renderEquationInput(step, content, checkBtn) {
  content.appendChild(makeInstruction(step, 'instruction'));
  const { eqDiv, input } = buildEquation(step.equation, step);
  content.appendChild(eqDiv);
  input.addEventListener('input', () => {
    selectedAnswer = input.value.trim();
    checkBtn.className = selectedAnswer ? 'check-btn' : 'check-btn disabled';
  });
  if (step.showNumberLine) {
    const hl = [];
    if (step.startValue !== undefined) hl.push(step.startValue);
    if (step.endValue !== undefined) hl.push(step.endValue);
    const { nlContainer, line } = buildNumberLine(content, step.min, step.max, { highlightValues: hl });
    if (step.endValue !== undefined && !step.showClean) {
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
  content.appendChild(makeInstruction(step, 'instruction'));
  const choicesDiv = document.createElement('div');
  choicesDiv.className = 'choices';
  step.choices.forEach((ch, i) => {
    const btn = document.createElement('button');
    btn.className = 'choice-btn';
    btn.textContent = ch.text;
    btn.onclick = () => {
      choicesDiv.querySelectorAll('.choice-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedAnswer = i;
      checkBtn.className = 'check-btn';
    };
    choicesDiv.appendChild(btn);
  });
  content.appendChild(choicesDiv);
  checkBtn.onclick = () => {
    if (checkBtn.classList.contains('disabled')) return;
    const ok = step.choices[selectedAnswer].correct;
    choicesDiv.querySelectorAll('.choice-btn')[selectedAnswer].classList.add(ok ? 'correct' : 'wrong');
    ok ? handleCorrect(checkBtn) : handleWrong('Think about which direction means getting smaller.', checkBtn);
  };
}

function renderPlaceAndMove(step, content, checkBtn) {
  if (subStep === 0) {
    content.appendChild(makeInstruction(step, 'instruction'));
    content.appendChild(buildEqLabel(step.equation));
    const { nlContainer, line } = buildNumberLine(content, step.min, step.max);
    content.appendChild(nlContainer);
    addClickablePoint(nlContainer, line, step.min, step.max, () => { checkBtn.className = 'check-btn'; });
    checkBtn.onclick = () => {
      if (checkBtn.classList.contains('disabled')) return;
      if (pointValue === step.placeValue) {
        subStep = 1; gems += 2; saveProgress();
        showFeedback(true);
        setTimeout(() => renderPAMSub(step), 800);
      } else {
        handleWrong(step.placeValue < 0 ? 'Look for the negative side — left of zero.' : 'Look on the positive side — right of zero.', checkBtn, () => { subStep = 0; renderStep(); });
      }
    };
  }
}

function renderPAMSub(step) {
  const content = document.getElementById('step-content');
  const checkBtn = document.getElementById('check-btn');
  document.getElementById('feedback-bar').className = 'feedback-bar hidden';

  if (subStep === 1) {
    content.innerHTML = '';
    checkBtn.className = 'check-btn disabled';
    checkBtn.textContent = 'CHECK';
    content.appendChild(makeInstruction(step, 'instruction2'));
    content.appendChild(buildEqLabel(step.equation));
    const { nlContainer, line } = buildNumberLine(content, step.min, step.max);
    content.appendChild(nlContainer);
    addDraggablePoint(nlContainer, line, step.min, step.max, step.placeValue, () => { checkBtn.className = 'check-btn'; });
    checkBtn.onclick = () => {
      if (checkBtn.classList.contains('disabled')) return;
      if (pointValue === step.answer) {
        subStep = 2; gems += 2; saveProgress();
        showFeedback(true);
        setTimeout(() => renderPAMSub(step), 800);
      } else {
        const dir = step.moveBy < 0 ? 'left' : 'right';
        handleWrong(`Subtracting means move to the ${dir}. Count ${Math.abs(step.moveBy)} spaces.`, checkBtn, () => { subStep = 1; renderPAMSub(step); });
      }
    };
  } else if (subStep === 2) {
    content.innerHTML = '';
    checkBtn.className = 'check-btn disabled';
    checkBtn.textContent = 'CHECK';
    content.appendChild(makeInstruction(step, 'instruction3'));
    const { eqDiv, input } = buildEquation(step.equation, step);
    content.appendChild(eqDiv);
    const { nlContainer, line } = buildNumberLine(content, step.min, step.max, { highlightValues: [step.placeValue, step.answer] });
    const p = document.createElement('div');
    p.className = 'point';
    p.style.left = ((step.answer - step.min) / (step.max - step.min)) * 100 + '%';
    p.style.cursor = 'default';
    line.appendChild(p);
    content.appendChild(nlContainer);
    input.addEventListener('input', () => {
      selectedAnswer = input.value.trim();
      checkBtn.className = selectedAnswer ? 'check-btn' : 'check-btn disabled';
    });
    checkBtn.onclick = () => {
      if (checkBtn.classList.contains('disabled')) return;
      parseInt(selectedAnswer, 10) === step.answer
        ? handleCorrect(checkBtn)
        : handleWrong('Look where the dot ended up on the number line.', checkBtn, () => { subStep = 2; renderPAMSub(step); });
    };
  }
}

function renderCelebrate(step, content, checkBtn) {
  gems += (step.gems || 10);
  saveProgress();
  document.getElementById('gems-count').textContent = gems;
  document.getElementById('progress-bar').style.width = '100%';

  // Mark lesson completed
  const key = lessonKey(curModule.id, curSection.id, curLesson.id);
  progress[key] = { completed: true };
  saveProgress();

  const cel = document.createElement('div');
  cel.className = 'celebrate';
  cel.innerHTML = `
    <div class="trophy">&#127942;</div>
    <div class="congrats-text">${step.instruction || 'Amazing work!'}</div>
    <div class="sub-text">${step.message || 'Lesson complete!'}</div>
    <div class="gems-earned">&#x1F48E; +${step.gems || 10} gems!</div>
    <button class="continue-map-btn">CONTINUE</button>
  `;
  cel.querySelector('.continue-map-btn').onclick = () => { location.hash = '#map'; };
  content.appendChild(cel);
  checkBtn.style.display = 'none';
  launchConfetti();
}

// ─── Answer Handling ───────────────────────────────────────

function handleCorrect(checkBtn) {
  gems += 3;
  saveProgress();
  document.getElementById('gems-count').textContent = gems;
  showFeedback(true);
  checkBtn.textContent = 'CONTINUE';
  checkBtn.className = 'check-btn next';
  checkBtn.onclick = () => {
    curStepIdx++;
    if (curStepIdx < curLesson.steps.length) renderStep();
  };
}

function handleWrong(hint, checkBtn, rerender) {
  loseLife();
  showFeedback(false, hint);
  checkBtn.textContent = 'TRY AGAIN';
  checkBtn.className = 'check-btn try-again';
  checkBtn.onclick = () => { rerender ? rerender() : renderStep(); };
}

function showFeedback(ok, msg) {
  const bar = document.getElementById('feedback-bar');
  bar.className = 'feedback-bar ' + (ok ? 'correct' : 'wrong');
  bar.textContent = ok ? 'Great job! ✓' : (msg || 'Not quite. Try again!');
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
  table.innerHTML = `<thead><tr>
    <th>Loc</th>
    <th>Type</th>
    <th>Instruction</th>
    <th></th>
  </tr></thead>`;
  const tbody = document.createElement('tbody');

  data.modules.forEach((mod, mi) => {
    mod.sections.forEach((sec, si) => {
      sec.lessons.forEach((les, li) => {
        les.steps.forEach((step, sti) => {
          const tr = document.createElement('tr');

          // Location
          const tdLoc = document.createElement('td');
          tdLoc.className = 'edit-loc';
          tdLoc.textContent = (mi+1) + '-' + (si+1) + '-' + (li+1) + '-' + (sti+1);
          tr.appendChild(tdLoc);

          // Type
          const tdType = document.createElement('td');
          tdType.className = 'edit-type-desc';
          tdType.textContent = STEP_TYPE_DESC[step.type] || step.type;
          tr.appendChild(tdType);

          // Instruction (editable)
          const tdInstr = document.createElement('td');
          const instrInput = document.createElement('input');
          instrInput.className = 'edit-instruction-input';
          instrInput.value = step.instruction || '';
          instrInput.addEventListener('change', () => {
            step.instruction = instrInput.value;
            saveData();
            saved.classList.add('show');
            setTimeout(() => saved.classList.remove('show'), 1500);
          });
          tdInstr.appendChild(instrInput);
          tr.appendChild(tdInstr);

          // Saved indicator
          const tdSaved = document.createElement('td');
          const saved = document.createElement('span');
          saved.className = 'edit-saved';
          saved.textContent = 'Saved';
          tdSaved.appendChild(saved);
          tr.appendChild(tdSaved);

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
