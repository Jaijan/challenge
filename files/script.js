// ═══════════════════════════════════════════════════════════════
//  STATE
// ═══════════════════════════════════════════════════════════════
const STATE = {
  candidate: { name: '', email: '' },
  scores: { curiosity: 0, logic: 0, debugging: 0, leadership: 0, persistence: 0 },
  achievements: [],
  timers: {},
  stageStartTimes: {},
  totalStart: null,
  curiosityAttempts: 0,
  logicAnswers: [],
  debugAnswers: [],
  leadAnswers: [],
  terminalExplored: false,
  terminalKeyFound: false,
  finalResponse: '',
  candidates: JSON.parse(localStorage.getItem('asc_candidates') || '[]'),
};

// ═══════════════════════════════════════════════════════════════
//  PARTICLE BACKGROUND
// ═══════════════════════════════════════════════════════════════
(function(){
  const canvas = document.getElementById('particle-canvas');
  const ctx = canvas.getContext('2d');
  let particles = [];
  function resize(){ canvas.width = window.innerWidth; canvas.height = window.innerHeight; }
  resize();
  window.addEventListener('resize', resize);
  for(let i=0;i<70;i++){
    particles.push({
      x: Math.random()*window.innerWidth,
      y: Math.random()*window.innerHeight,
      r: Math.random()*1.5+0.3,
      dx: (Math.random()-0.5)*0.3,
      dy: (Math.random()-0.5)*0.3,
      alpha: Math.random()*0.5+0.1
    });
  }
  function draw(){
    ctx.clearRect(0,0,canvas.width,canvas.height);
    particles.forEach(p=>{
      ctx.beginPath();
      ctx.arc(p.x,p.y,p.r,0,Math.PI*2);
      ctx.fillStyle = `rgba(0,212,255,${p.alpha})`;
      ctx.fill();
      p.x+=p.dx; p.y+=p.dy;
      if(p.x<0||p.x>canvas.width) p.dx*=-1;
      if(p.y<0||p.y>canvas.height) p.dy*=-1;
    });
    // Draw faint connecting lines
    for(let i=0;i<particles.length;i++){
      for(let j=i+1;j<particles.length;j++){
        const d = Math.hypot(particles[i].x-particles[j].x, particles[i].y-particles[j].y);
        if(d<120){
          ctx.beginPath();
          ctx.moveTo(particles[i].x,particles[i].y);
          ctx.lineTo(particles[j].x,particles[j].y);
          ctx.strokeStyle = `rgba(0,212,255,${0.08*(1-d/120)})`;
          ctx.lineWidth = 0.5;
          ctx.stroke();
        }
      }
    }
    requestAnimationFrame(draw);
  }
  draw();
})();

// ═══════════════════════════════════════════════════════════════
//  SCREEN MANAGEMENT
// ═══════════════════════════════════════════════════════════════
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  const el = document.getElementById('screen-' + id);
  if (el) el.classList.add('active');
  window.scrollTo(0,0);
}

// ═══════════════════════════════════════════════════════════════
//  INTRO SEQUENCE
// ═══════════════════════════════════════════════════════════════
function beginSequence() {
  const beginBtn = document.getElementById('begin-btn');
  if (beginBtn) beginBtn.style.display = 'none';
  const lines = document.querySelectorAll('.t-line');
  lines.forEach((l,i) => {
    setTimeout(() => l.classList.add('show'), i * 600);
  });
  setTimeout(() => {
    const introReady = document.getElementById('intro-ready');
    if (introReady) { introReady.style.display = 'block'; introReady.classList.add('show'); }
  }, lines.length * 600);
  setTimeout(() => {
    const introForm = document.getElementById('intro-form');
    if (introForm) introForm.style.display = 'block';
  }, lines.length * 600 + 800);
}

function startEvaluation() {
  const nameEl = document.getElementById('reg-name');
  const emailEl = document.getElementById('reg-email');
  const name = nameEl ? nameEl.value.trim() : '';
  const email = emailEl ? emailEl.value.trim() : '';
  if(!name || !email) {
    alert('Identity verification incomplete.');
    return;
  }
  STATE.candidate.name = name;
  STATE.candidate.email = email;
  STATE.totalStart = Date.now();
  showScreen('curiosity');
  startTimer('curiosity');
}

// ═══════════════════════════════════════════════════════════════
//  TIMERS
// ═══════════════════════════════════════════════════════════════
function startTimer(stage) {
  if(STATE.timers[stage]) clearInterval(STATE.timers[stage]);
  STATE.stageStartTimes[stage] = Date.now();
  const el = document.getElementById('timer-' + stage);
  if(!el) return;
  STATE.timers[stage] = setInterval(() => {
    const s = Math.floor((Date.now()-STATE.stageStartTimes[stage])/1000);
    const m = Math.floor(s/60);
    const sec = s%60;
    const str = `${String(m).padStart(2,'0')}:${String(sec).padStart(2,'0')}`;
    el.textContent = str;
    el.className = 'live-timer' + (s>120?' warn':'') + (s>180?' crit':'');
  }, 1000);
}

function stopTimer(stage) {
  if(STATE.timers[stage]) clearInterval(STATE.timers[stage]);
  const elapsed = (Date.now() - (STATE.stageStartTimes[stage]||Date.now())) / 1000;
  return elapsed;
}

// ═══════════════════════════════════════════════════════════════
//  ACHIEVEMENTS
// ═══════════════════════════════════════════════════════════════
const ACHIEVEMENTS = {
  curious_mind: { icon: '🔍', name: 'CURIOUS MIND', desc: 'You went looking where others wouldn\'t.' },
  console_master: { icon: '💻', name: 'CONSOLE MASTER', desc: 'You used the browser console.' },
  fast_thinker: { icon: '⚡', name: 'FAST THINKER', desc: 'Completed logic under 90 seconds.' },
  debugger: { icon: '🐛', name: 'DEBUGGER', desc: 'Perfect score in the debugging arena.' },
  persistent: { icon: '🔥', name: 'PERSISTENT', desc: 'You tried multiple times. That matters.' },
  architect: { icon: '🏗️', name: 'ARCHITECT', desc: 'Achieved 80%+ overall score.' },
  future_lead: { icon: '🌟', name: 'FUTURE LEAD', desc: 'Top candidate profile.' },
  terminal_explorer: { icon: '🖥️', name: 'TERMINAL EXPLORER', desc: 'Uncovered all hidden files.' },
  early_bird: { icon: '⏱️', name: 'EARLY BIRD', desc: 'Completed evaluation in under 10 minutes.' },
};

function unlockAchievement(id) {
  if(STATE.achievements.includes(id)) return;
  STATE.achievements.push(id);
  showAchievementToast(id);
}

function showAchievementToast(id) {
  const ach = ACHIEVEMENTS[id];
  if(!ach) return;
  const toast = document.getElementById('ach-toast');
  toast.innerHTML = `<div class="ach-icon">${ach.icon}</div><div><div class="ach-name">ACHIEVEMENT UNLOCKED: ${ach.name}</div><div class="ach-desc">${ach.desc}</div></div>`;
  toast.style.display = 'flex';
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity 0.5s'; }, 3000);
  setTimeout(() => { toast.style.display = 'none'; toast.style.opacity = '1'; }, 3500);
}

// ═══════════════════════════════════════════════════════════════
//  FEATURE 1: CURIOSITY
// ═══════════════════════════════════════════════════════════════
// Hidden in page source and via console
window.getKey = function() {
  console.log('%c[ASCENSION]', 'color:#00d4ff; font-weight:bold; font-size:1.1em;');
  console.log('%cAccess Key: PROMETHEUS-X', 'color:#00ff88; font-size:1em;');
  console.log('%cHint: The answer is right here.', 'color:#ffaa00;');
  unlockAchievement('console_master');
  return 'PROMETHEUS-X';
};

console.log('%c\n██████╗ ██████╗  ██████╗ ██╗███████╗ ██████╗████████╗\n', 'color:#00d4ff');
console.log('%cASCENSION AI — CANDIDATE TERMINAL INTERFACE', 'color:#00d4ff; font-weight:bold; font-size:1.2em');
console.log('%cType: window.getKey() to retrieve the access key.', 'color:#ffaa00');

function checkCuriosityKey() {
  STATE.curiosityAttempts++;
  if(STATE.curiosityAttempts > 2) unlockAchievement('persistent');
  const valEl = document.getElementById('curiosity-key');
  const val = valEl ? valEl.value.trim().toUpperCase() : '';
  const fb = document.getElementById('curiosity-feedback');
  if (fb) fb.style.display = 'block';

  if(val === 'PROMETHEUS-X' || val === 'PROMETHUSX' || val === 'PROMETHEUS') {
    stopTimer('curiosity');
    const timeBonus = Math.max(0, 100 - STATE.curiosityAttempts * 15);
    STATE.scores.curiosity = Math.min(100, 70 + timeBonus/10 + (STATE.achievements.includes('console_master') ? 20 : 0));
    unlockAchievement('curious_mind');
    if (fb) fb.innerHTML = `<div class="glass-panel" style="border-color:var(--green);">
      <span style="font-family:'Share Tech Mono',monospace; color:var(--green); font-size:0.85rem;">
        ✓ ACCESS GRANTED — Identity verified.<br>
        Score: <strong>${Math.round(STATE.scores.curiosity)}</strong>/100
      </span>
    </div>`;
    setTimeout(() => goToLogic(), 1800);
  } else {
    if (fb) fb.innerHTML = `<div class="glass-panel" style="border-color:var(--red);">
      <span style="font-family:'Share Tech Mono',monospace; color:var(--red); font-size:0.85rem;">
        ✗ ACCESS DENIED — Incorrect key. Attempt ${STATE.curiosityAttempts} logged.
      </span>
    </div>`;
  }
}

function curiosityHint() {
  const el = document.getElementById('curiosity-hint-box');
  if (el) el.style.display = 'block';
}

// ═══════════════════════════════════════════════════════════════
//  FEATURE 2: LOGIC CHAMBER
// ═══════════════════════════════════════════════════════════════
const LOGIC_QUESTIONS = [
  {
    type: 'code',
    q: 'What is the decimal value of the binary number <span class="t-cyan">01001100</span>?',
    code: null,
    opts: ['76','72','78','84'],
    ans: 0,
    explain: '01001100 = 64+8+4 = 76'
  },
  {
    type: 'text',
    q: 'In a standard Git workflow, which sequence is correct when preparing to push a feature?',
    code: null,
    opts: [
      'git commit → git add → git push → git pull',
      'git add → git commit → git pull → git push',
      'git pull → git add → git commit → git push',
      'git stash → git push → git add → git commit'
    ],
    ans: 2,
    explain: 'Best practice: pull latest changes before pushing to avoid merge conflicts.'
  },
  {
    type: 'code',
    q: 'This API response handler returns the wrong data. What is the root cause?',
    code: `<span class="line-num">1</span><span class="kw">async</span> <span class="kw">function</span> <span class="fn">getUser</span>(id) {
<span class="line-num">2</span>  <span class="kw">const</span> res = <span class="kw">await</span> fetch(<span class="str">\`/api/users/\${id}\`</span>);
<span class="line-num">3</span>  <span class="kw">const</span> data = res.json(); <span class="cm">// line 3</span>
<span class="line-num">4</span>  <span class="kw">return</span> data.name;
<span class="line-num">5</span>}`,
    opts: [
      'fetch() is not async-safe',
      'res.json() is a Promise but await is missing — data is a Promise object, not parsed JSON',
      'Template literal is malformed',
      'return statement returns before data resolves'
    ],
    ans: 1,
    explain: 'res.json() returns a Promise. Without await, data is the Promise itself, not the resolved JSON.'
  },
  {
    type: 'text',
    q: 'A recursive function has no explicit base case. What will happen at runtime?',
    code: null,
    opts: [
      'It compiles with a warning and returns undefined',
      'It returns null after the recursion depth limit',
      'It causes a stack overflow / maximum call stack size exceeded error',
      'It runs until memory runs out, then auto-terminates'
    ],
    ans: 2,
    explain: 'Without a base case, the call stack fills up indefinitely causing a stack overflow.'
  },
  {
    type: 'code',
    q: 'What does this expression evaluate to in JavaScript?',
    code: `<span class="line-num">1</span>console.log(<span class="kw">typeof</span> <span class="kw">null</span>);`,
    opts: ['"null"','"undefined"','"object"','"boolean"'],
    ans: 2,
    explain: '"typeof null === object" is a long-standing JavaScript bug from its initial implementation.'
  },
];

let logicCurrent = 0;
let logicTimeoutId = null;

function goToLogic() {
  logicCurrent = 0;
  STATE.logicAnswers = [];
  showScreen('logic');
  startTimer('logic');
  renderLogicQuestion();
}

function renderLogicQuestion() {
  if(logicCurrent >= LOGIC_QUESTIONS.length) {
    finishLogic();
    return;
  }
  const q = LOGIC_QUESTIONS[logicCurrent];
  const counter = document.getElementById('logic-q-counter');
  if (counter) counter.textContent = `Q ${logicCurrent+1} / ${LOGIC_QUESTIONS.length}`;
  let html = `
    <div class="section-eyebrow">Logical Reasoning · Question ${logicCurrent+1}</div>
    <div class="section-title" style="font-size:1.1rem; margin-bottom:1.5rem;">${q.q}</div>
  `;
  if(q.code) html += `<div class="code-block" style="margin-bottom:1.5rem;">${q.code}</div>`;
  html += `<div class="options-grid">`;
  q.opts.forEach((opt,i) => {
    html += `<button class="option-btn" id="logic-opt-${i}" onclick="selectLogicAnswer(${i})">
      <span class="option-letter">${String.fromCharCode(65+i)}</span>
      <span>${opt}</span>
    </button>`;
  });
  html += `</div>
    <div id="logic-explain" style="display:none; margin-top:1.5rem;"></div>
    <div style="margin-top:2rem; display:none;" id="logic-next-btn">
      <button class="btn-primary" onclick="nextLogicQuestion()">NEXT QUESTION →</button>
    </div>`;
  const body = document.getElementById('logic-q-body');
  if (body) body.innerHTML = html;
}

function selectLogicAnswer(i) {
  const q = LOGIC_QUESTIONS[logicCurrent];
  const correct = q.ans === i;
  STATE.logicAnswers.push({ q: logicCurrent, ans: i, correct });

  document.querySelectorAll('#logic-q-body .option-btn').forEach((btn,idx) => {
    btn.disabled = true;
    if(idx === q.ans) btn.classList.add('correct');
    else if(idx === i && !correct) btn.classList.add('wrong');
  });

  const explainEl = document.getElementById('logic-explain');
  if (explainEl) {
    explainEl.style.display = 'block';
    explainEl.innerHTML = `<div class="glass-panel" style="border-color:${correct?'var(--green)':'var(--red)'}; padding:1rem 1.5rem;">
      <span style="font-family:'Share Tech Mono',monospace; font-size:0.82rem; color:${correct?'var(--green)':'var(--red)'};">
        ${correct ? '✓ CORRECT — ' : '✗ INCORRECT — '} ${q.explain}
      </span>
    </div>`;
  }

  const nextBtn = document.getElementById('logic-next-btn');
  if (nextBtn) nextBtn.style.display = 'block';
}

function nextLogicQuestion() {
  logicCurrent++;
  renderLogicQuestion();
}

function finishLogic() {
  const elapsed = stopTimer('logic');
  const correct = STATE.logicAnswers.filter(a=>a.correct).length;
  const acc = correct / LOGIC_QUESTIONS.length;
  const timeScore = Math.max(0, 100 - (elapsed/3));
  STATE.scores.logic = Math.round(acc * 70 + timeScore * 0.3);
  if(elapsed < 90) unlockAchievement('fast_thinker');
  goToDebug();
}

// ═══════════════════════════════════════════════════════════════
//  FEATURE 3: DEBUGGING ARENA
// ═══════════════════════════════════════════════════════════════
const DEBUG_QUESTIONS = [
  {
    title: 'Off-By-One Error',
    desc: 'This function should print all elements of an array. It crashes on the last element. Identify the bug.',
    code: `<span class="line-num">1</span><span class="kw">function</span> <span class="fn">printAll</span>(arr) {
<span class="line-num">2</span>  <span class="kw">for</span> (<span class="kw">let</span> i = <span class="num">0</span>; i <span class="op">&lt;=</span> arr.length; i++) {
<span class="line-num">3</span>    console.<span class="fn">log</span>(arr[i]); <span class="cm">// crashes here</span>
<span class="line-num">4</span>  }
<span class="line-num">5</span>}`,
    opts: [
      'arr.length should be arr.size()',
      'Loop condition i <= arr.length should be i < arr.length — the last iteration accesses arr[arr.length] which is undefined',
      'console.log is not available in all environments',
      'The loop variable should start at 1, not 0'
    ],
    ans: 1,
    weight: 1
  },
  {
    title: 'Async Race Condition',
    desc: 'This function intends to log the fetched data. Instead it always logs undefined. Why?',
    code: `<span class="line-num">1</span><span class="kw">function</span> <span class="fn">loadData</span>() {
<span class="line-num">2</span>  <span class="kw">let</span> result;
<span class="line-num">3</span>  fetch(<span class="str">'/api/data'</span>)
<span class="line-num">4</span>    .then(res <span class="op">=&gt;</span> res.<span class="fn">json</span>())
<span class="line-num">5</span>    .then(data <span class="op">=&gt;</span> { result = data; });
<span class="line-num">6</span>  console.<span class="fn">log</span>(result); <span class="cm">// always undefined</span>
<span class="line-num">7</span>}`,
    opts: [
      'fetch() requires a second argument for options',
      'The .then chain is using arrow functions incorrectly',
      'console.log on line 6 executes synchronously before the asynchronous fetch resolves — result is not yet assigned',
      'result must be declared with const, not let'
    ],
    ans: 2,
    weight: 1
  },
  {
    title: 'Null Reference',
    desc: 'This code throws "Cannot read properties of null". Identify the exact cause.',
    code: `<span class="line-num">1</span><span class="kw">function</span> <span class="fn">getUsername</span>(user) {
<span class="line-num">2</span>  <span class="kw">return</span> user.profile.name.<span class="fn">toUpperCase</span>();
<span class="line-num">3</span>}
<span class="line-num">4</span>
<span class="line-num">5</span>getUsername({ profile: <span class="kw">null</span> });`,
    opts: [
      'user is not passed as an argument',
      'toUpperCase() is not a valid String method',
      'user.profile is null — accessing .name on null throws a TypeError at runtime',
      'The function should use user?.profile?.name with optional chaining'
    ],
    ans: 2,
    weight: 1.5
  },
  {
    title: 'Database Query Bug',
    desc: 'This SQL query should return users older than 18. It returns no results despite valid data existing. What is wrong?',
    code: `<span class="line-num">1</span>SELECT * FROM users
<span class="line-num">2</span>WHERE age &gt; <span class="str">'18'</span>;
<span class="line-num">3</span><span class="cm">-- age column is INTEGER type</span>`,
    opts: [
      'SELECT * should specify column names explicitly',
      'The string \'18\' is compared to an INTEGER column — in strict SQL engines this causes a type mismatch returning 0 rows',
      'WHERE clause needs an AND condition',
      'The semicolon terminates the query prematurely'
    ],
    ans: 1,
    weight: 1.5
  }
];

let debugCurrent = 0;

function goToDebug() {
  debugCurrent = 0;
  STATE.debugAnswers = [];
  showScreen('debug');
  startTimer('debug');
  renderDebugQuestion();
}

function renderDebugQuestion() {
  if(debugCurrent >= DEBUG_QUESTIONS.length) {
    finishDebug();
    return;
  }
  const q = DEBUG_QUESTIONS[debugCurrent];
  const counter = document.getElementById('debug-q-counter');
  if (counter) counter.textContent = `Q ${debugCurrent+1} / ${DEBUG_QUESTIONS.length}`;
  let html = `
    <div class="section-eyebrow">Bug Type: ${q.title}</div>
    <div class="section-title" style="font-size:1.1rem; margin-bottom:1rem;">${q.desc}</div>
    <div class="code-block" style="margin-bottom:1.5rem;">${q.code}</div>
    <div class="section-eyebrow" style="margin-bottom:0.75rem;">Identify the root cause:</div>
    <div class="options-grid">`;
  q.opts.forEach((opt,i) => {
    html += `<button class="option-btn" id="debug-opt-${i}" onclick="selectDebugAnswer(${i})">
      <span class="option-letter">${String.fromCharCode(65+i)}</span>
      <span>${opt}</span>
    </button>`;
  });
  html += `</div>
    <div id="debug-explain" style="display:none; margin-top:1.5rem;"></div>
    <div style="margin-top:2rem; display:none;" id="debug-next-btn">
      <button class="btn-primary" onclick="nextDebugQuestion()">NEXT SCENARIO →</button>
    </div>`;
  const body = document.getElementById('debug-q-body');
  if (body) body.innerHTML = html;
}

function selectDebugAnswer(i) {
  const q = DEBUG_QUESTIONS[debugCurrent];
  const correct = q.ans === i;
  STATE.debugAnswers.push({ q: debugCurrent, ans: i, correct, weight: q.weight });

  document.querySelectorAll('#debug-q-body .option-btn').forEach((btn,idx) => {
    btn.disabled = true;
    if(idx === q.ans) btn.classList.add('correct');
    else if(idx === i && !correct) btn.classList.add('wrong');
  });

  const explain = document.getElementById('debug-explain');
  if (explain) {
    explain.style.display = 'block';
    explain.innerHTML = `<div class="glass-panel" style="border-color:${correct?'var(--green)':'var(--red)'}; padding:1rem 1.5rem;">
      <span style="font-family:'Share Tech Mono',monospace; font-size:0.82rem; color:${correct?'var(--green)':'var(--red)'};">
        ${correct ? '✓ CORRECT — Bug identified.' : '✗ INCORRECT — Misdiagnosis noted.'}
      </span>
    </div>`;
  }
  const nextBtn = document.getElementById('debug-next-btn');
  if (nextBtn) nextBtn.style.display = 'block';
}

function nextDebugQuestion() {
  debugCurrent++;
  renderDebugQuestion();
}

function finishDebug() {
  stopTimer('debug');
  let total = 0, maxTotal = 0;
  STATE.debugAnswers.forEach(a => {
    maxTotal += a.weight;
    if(a.correct) total += a.weight;
  });
  STATE.scores.debugging = Math.round((total/maxTotal)*100);
  if(total === maxTotal) unlockAchievement('debugger');
  goToGlitch();
}

// ═══════════════════════════════════════════════════════════════
//  FEATURE 4: SYSTEM GLITCH
// ═══════════════════════════════════════════════════════════════
function goToGlitch() {
  showScreen('glitch');
  const msgs = [
    { text: 'SYSTEM INTERRUPT DETECTED', color: 'var(--red)', delay: 500 },
    { text: '.', color: 'var(--text-dim)', delay: 1000 },
    { text: '..', color: 'var(--text-dim)', delay: 1300 },
    { text: '...', color: 'var(--text-dim)', delay: 1600 },
    { text: 'Unexpected candidate behavior detected.', color: 'var(--amber)', delay: 2200 },
    { text: 'Recalibrating evaluation parameters...', color: 'var(--text-dim)', delay: 3000 },
    { text: 'You are performing above expected thresholds.', color: 'var(--green)', delay: 3800 },
    { text: 'Interesting.', color: 'var(--accent)', delay: 4800 },
    { text: 'The system is adapting.', color: 'var(--accent2)', delay: 5600 },
    { text: 'Evaluation integrity: MAINTAINED', color: 'var(--green)', delay: 6400 },
  ];
  const container = document.getElementById('glitch-messages');
  if (container) container.innerHTML = '';
  msgs.forEach(m => {
    setTimeout(() => {
      const span = document.createElement('div');
      span.style.cssText = `color:${m.color}; font-family:'Share Tech Mono',monospace; opacity:0; transition:opacity 0.5s;`;
      span.textContent = m.text;
      if (container) container.appendChild(span);
      requestAnimationFrame(() => { setTimeout(() => span.style.opacity='1', 10); });
    }, m.delay);
  });
  setTimeout(() => {
    const cont = document.getElementById('glitch-continue');
    if (cont) cont.style.display = 'block';
  }, 7200);
}

function goToLeadership() {
  STATE.leadAnswers = [];
  showScreen('leadership');
  startTimer('lead');
  renderLeadershipQuestion(0);
}

// ═══════════════════════════════════════════════════════════════
//  FEATURE 5: LEADERSHIP CHAMBER
// ═══════════════════════════════════════════════════════════════
const LEADERSHIP_SCENARIOS = [
  {
    title: 'Production Deployment Crisis',
    scenario: 'It\'s 2 hours before a critical product release. A teammate submits a pull request with a subtle but serious bug that will break the payment flow. They\'re confident it\'s fine. The rest of the team is exhausted and ready to ship.',
    opts: [
      { text: 'Merge it to keep morale high and fix it in a hotfix after release.', score: 15 },
      { text: 'Quietly revert their changes without explaining why to avoid conflict.', score: 10 },
      { text: 'Escalate to leadership and block the release entirely.', score: 40 },
      { text: 'Have a direct 1-on-1 with the teammate, show them the bug with data, work together to patch it in the next 2 hours — or delay the release transparently.', score: 100 },
    ]
  },
  {
    title: 'Impossible Deadline',
    scenario: 'A stakeholder demands a fully-featured product in 2 weeks. Your team\'s realistic estimate is 6 weeks. They are not technically literate and believe development is "just typing."',
    opts: [
      { text: 'Say yes, crunch the team to 80-hour weeks, and deliver something broken.', score: 20 },
      { text: 'Say no flatly and offer no alternatives.', score: 30 },
      { text: 'Present a data-driven breakdown of complexity, propose a phased delivery (MVP in 2 weeks, full release in 6), and explain trade-offs clearly.', score: 100 },
      { text: 'Agree but secretly reduce scope without informing the stakeholder.', score: 25 },
    ]
  },
  {
    title: 'Disappearing Team Member',
    scenario: 'A key developer has been unreachable for 3 days. They own the most critical module. The project deadline is in 5 days. No documentation exists for their work.',
    opts: [
      { text: 'Reassign their work to whoever is available, regardless of context.', score: 35 },
      { text: 'Wait another 2 days before taking action.', score: 10 },
      { text: 'Immediately triage: check their git history, have someone start reverse-engineering the module, personally reach out through multiple channels, and brief the team transparently on the situation.', score: 100 },
      { text: 'Report the situation to leadership and wait for instructions.', score: 45 },
    ]
  }
];

let leadCurrent = 0;

function renderLeadershipQuestion(idx) {
  if(idx >= LEADERSHIP_SCENARIOS.length) {
    finishLeadership();
    return;
  }
  leadCurrent = idx;
  const q = LEADERSHIP_SCENARIOS[idx];
  const counter = document.getElementById('lead-q-counter');
  if (counter) counter.textContent = `S ${idx+1} / ${LEADERSHIP_SCENARIOS.length}`;
  let html = `
    <div class="section-eyebrow">Leadership Scenario ${idx+1}</div>
    <div class="section-title" style="font-size:1.2rem; margin-bottom:1rem;">${q.title}</div>
    <div class="glass-panel" style="margin-bottom:1.5rem; background:#03090e;">
      <p style="font-family:'Share Tech Mono',monospace; font-size:0.85rem; color:var(--text); line-height:1.8;">${q.scenario}</p>
    </div>
    <div class="section-eyebrow" style="margin-bottom:0.75rem;">Your decision:</div>
    <div class="options-grid">`;
  q.opts.forEach((opt,i) => {
    html += `<button class="option-btn" id="lead-opt-${i}" onclick="selectLeadershipAnswer(${i}, ${opt.score})">
      <span class="option-letter">${String.fromCharCode(65+i)}</span>
      <span>${opt.text}</span>
    </button>`;
  });
  html += `</div>
    <div id="lead-explain" style="display:none; margin-top:1.5rem;"></div>
    <div style="margin-top:2rem; display:none;" id="lead-next-btn">
      <button class="btn-primary" onclick="nextLeadershipQuestion()">NEXT SCENARIO →</button>
    </div>`;
  const body = document.getElementById('lead-q-body');
  if (body) body.innerHTML = html;
}

function selectLeadershipAnswer(i, score) {
  STATE.leadAnswers.push(score);

  document.querySelectorAll('#lead-q-body .option-btn').forEach(btn => {
    btn.disabled = true;
  });
  const btns = document.querySelectorAll('#lead-q-body .option-btn');
  if (btns && btns[i]) btns[i].classList.add('selected');

  const fb = score >= 80 ? ['var(--green)', '✓ STRONG DECISION — Transparent, direct, and constructive.'] :
             score >= 50 ? ['var(--amber)', '◈ ADEQUATE — Acceptable but leaves issues unresolved.'] :
             ['var(--red)', '✗ POOR JUDGMENT — This approach creates more problems.'];

  const leadExplain = document.getElementById('lead-explain');
  if (leadExplain) {
    leadExplain.style.display = 'block';
    leadExplain.innerHTML = `<div class="glass-panel" style="border-color:${fb[0]}; padding:1rem 1.5rem;">
      <span style="font-family:'Share Tech Mono',monospace; font-size:0.82rem; color:${fb[0]};">${fb[1]}</span>
    </div>`;
  }
  const nextBtn = document.getElementById('lead-next-btn');
  if (nextBtn) nextBtn.style.display = 'block';
}

function nextLeadershipQuestion() {
  renderLeadershipQuestion(leadCurrent + 1);
}

function finishLeadership() {
  stopTimer('lead');
  const avg = STATE.leadAnswers.reduce((s,v) => s+v, 0) / STATE.leadAnswers.length;
  STATE.scores.leadership = Math.round(avg);
  goToTerminal();
}

// ═══════════════════════════════════════════════════════════════
//  FEATURE 6: TERMINAL SIMULATION
// ═══════════════════════════════════════════════════════════════
const FS = {
  '~': { type: 'dir', children: ['documents', 'logs', 'system'] },
  '~/documents': { type: 'dir', children: ['readme.txt', 'config.json', 'notes.md'] },
  '~/logs': { type: 'dir', children: ['access.log', 'error.log', 'ascension.log'] },
  '~/system': { type: 'dir', children: ['vault', 'key.enc'] },
  '~/system/vault': { type: 'dir', children: ['classified.txt'] },
  '~/documents/readme.txt': { type: 'file', content: 'Project ASCENSION Candidate Terminal\nVersion 3.1.4\n\nThis terminal grants limited read access.\nNavigate with: ls, cd, cat\nThe system key is encrypted. Find the vault.' },
  '~/documents/config.json': { type: 'file', content: '{\n  "system": "ASCENSION",\n  "build": "7.4.1",\n  "keyHint": "Look deeper. /system/vault/classified.txt"\n}' },
  '~/documents/notes.md': { type: 'file', content: '# Developer Notes\n\nThe access key for the final stage is stored in:\n  ~/system/vault/classified.txt\n\nBut the vault requires exploring the logs first.' },
  '~/logs/access.log': { type: 'file', content: '[2024-01-15 09:12] CANDIDATE_A — PASSED\n[2024-01-15 11:43] CANDIDATE_B — FAILED\n[2024-01-15 14:22] CANDIDATE_C — PASSED\n[INFO] Vault unlock sequence: open vault' },
  '~/logs/error.log': { type: 'file', content: '[ERROR] Unauthorized access attempts: 47\n[ERROR] Key vault locked after 3 failed attempts\n[WARN] System monitoring active' },
  '~/logs/ascension.log': { type: 'file', content: '[ASCENSION_AI] Candidate behavioral analysis in progress.\n[ASCENSION_AI] Terminal exploration score: MONITORED\n[NOTE] Those who find this file show initiative.\n[HINT] The vault is in ~/system/vault/' },
  '~/system/key.enc': { type: 'file', content: 'ENCRYPTED: 5a61 7068 7972 2034 3234 0a0a\n\nThis file is encrypted. The plaintext key is in the vault.' },
  '~/system/vault/classified.txt': { type: 'file', content: '=== CLASSIFIED DOCUMENT ===\nClearance: ALPHA\n\nFINAL ACCESS KEY: ZEPHYR-424\n\nThis key grants access to the final evaluation stage.\nCandidate persistence level: EXCEPTIONAL\n\n[END DOCUMENT]', secret: true },
};

let terminalCwd = '~';
let terminalHistory = [];
let historyIdx = -1;
let filesOpened = new Set();

function goToTerminal() {
  showScreen('terminal');
  startTimer('terminal');
  const input = document.getElementById('terminal-input');
  if (input) {
    input.addEventListener('keydown', handleTerminalInput);
    input.focus();
  }
}

function handleTerminalInput(e) {
  const input = document.getElementById('terminal-input');
  if(!input) return;
  if(e.key === 'Enter') {
    const cmd = input.value.trim();
    if(!cmd) return;
    terminalHistory.unshift(cmd);
    historyIdx = -1;
    terminalPrint(`<span class="t-green">ascension@localhost:${terminalCwd}$</span> <span class="t-cmd">${escapeHtml(cmd)}</span>`);
    processTerminalCmd(cmd.trim());
    input.value = '';
  } else if(e.key === 'ArrowUp') {
    e.preventDefault();
    if(historyIdx < terminalHistory.length-1) { historyIdx++; input.value = terminalHistory[historyIdx]; }
  } else if(e.key === 'ArrowDown') {
    e.preventDefault();
    if(historyIdx > 0) { historyIdx--; input.value = terminalHistory[historyIdx]; }
    else if(historyIdx === 0) { historyIdx = -1; input.value = ''; }
  }
}

function terminalPrint(html) {
  const out = document.getElementById('terminal-output');
  if(!out) return;
  const line = document.createElement('span');
  line.className = 't-out-line';
  line.innerHTML = html;
  out.appendChild(line);
  out.scrollTop = out.scrollHeight;
}

function processTerminalCmd(cmd) {
  const parts = cmd.split(' ');
  const command = parts[0].toLowerCase();
  const arg = parts.slice(1).join(' ');

  switch(command) {
    case 'help':
      terminalPrint(`<span class="t-cyan">Available commands:</span>`);
      terminalPrint(`  <span class="t-green">ls</span>        — list directory contents`);
      terminalPrint(`  <span class="t-green">cd [dir]</span>  — change directory`);
      terminalPrint(`  <span class="t-green">cat [file]</span>— read file contents`);
      terminalPrint(`  <span class="t-green">open [file]</span>— open a file`);
      terminalPrint(`  <span class="t-green">pwd</span>       — print working directory`);
      terminalPrint(`  <span class="t-green">clear</span>     — clear terminal`);
      terminalPrint(` `);
      break;

    case 'pwd':
      terminalPrint(terminalCwd);
      break;

    case 'ls': {
      const target = arg ? resolvePath(arg) : terminalCwd;
      const node = FS[target];
      if(!node) { terminalPrint(`<span class="t-red">ls: ${escapeHtml(arg||terminalCwd)}: No such directory</span>`); break; }
      if(node.type !== 'dir') { terminalPrint(`<span class="t-red">ls: not a directory</span>`); break; }
      node.children.forEach(child => {
        const fullPath = target + '/' + child;
        const childNode = FS[fullPath];
        if(childNode && childNode.type === 'dir') terminalPrint(`<span class="t-cyan">${child}/</span>`);
        else terminalPrint(`<span class="t-white">${child}</span>`);
      });
      if(!STATE.terminalExplored && node.children.length > 0) {
        STATE.terminalExplored = true;
      }
      terminalPrint(' ');
      break;
    }

    case 'cd': {
      if(!arg || arg === '~') { terminalCwd = '~'; terminalPrint(' '); break; }
      const target = resolvePath(arg);
      if(!FS[target] || FS[target].type !== 'dir') {
        terminalPrint(`<span class="t-red">cd: no such directory: ${escapeHtml(arg)}</span>`);
      } else {
        terminalCwd = target;
        terminalPrint(' ');
      }
      break;
    }

    case 'cat':
    case 'open': {
      if(!arg) { terminalPrint(`<span class="t-red">${command}: missing operand</span>`); break; }
      const target = resolvePath(arg);
      const node = FS[target];
      if(!node) { terminalPrint(`<span class="t-red">${command}: ${escapeHtml(arg)}: No such file</span>`); break; }
      if(node.type === 'dir') { terminalPrint(`<span class="t-red">${command}: ${escapeHtml(arg)}: Is a directory</span>`); break; }
      node.content.split('\n').forEach(line => terminalPrint(escapeHtml(line)||' '));
      filesOpened.add(target);
      if(node.secret) {
        STATE.terminalKeyFound = true;
        unlockAchievement('terminal_explorer');
        setTimeout(() => terminalPrint(`<span class="t-amber">[ASCENSION_AI] File access logged. Key acquisition: CONFIRMED.</span>`), 500);
      }
      terminalPrint(' ');
      break;
    }

    case 'clear':
      const outEl = document.getElementById('terminal-output'); if(outEl) outEl.innerHTML = '';
      break;

    case 'ascension':
      terminalPrint(`<span class="t-amber">[ASCENSION_AI] You found the easter egg. Well done.</span>`);
      unlockAchievement('curious_mind');
      break;

    default:
      terminalPrint(`<span class="t-red">command not found: ${escapeHtml(command)}</span>`);
  }
  const inEl = document.getElementById('terminal-input'); if(inEl) inEl.focus();
}

function resolvePath(path) {
  if(path.startsWith('~/') || path === '~') return path;
  if(path.startsWith('/')) return '~' + path;
  if(path === '..') {
    const parts = terminalCwd.split('/');
    if(parts.length <= 1) return '~';
    return parts.slice(0,-1).join('/') || '~';
  }
  return terminalCwd === '~' ? '~/' + path : terminalCwd + '/' + path;
}

function escapeHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function checkTerminalKey() {
  const el = document.getElementById('terminal-key-input');
  const val = el ? el.value.trim().toUpperCase() : '';
  const fb = document.getElementById('terminal-key-feedback');
  if(val === 'ZEPHYR-424' || val === 'ZEPHYR424') {
    stopTimer('terminal');
    STATE.scores.persistence = Math.min(100, 40 + (filesOpened.size * 10) + (STATE.terminalKeyFound ? 30 : 0) + (STATE.curiosityAttempts > 1 ? 10 : 0));
    if (fb) fb.innerHTML = `<span class="t-green">✓ KEY VERIFIED — Access granted. Proceeding to final evaluation.</span>`;
    setTimeout(() => showScreen('final'), 1500);
  } else {
    if (fb) fb.innerHTML = `<span class="t-red">✗ INCORRECT KEY — Keep exploring the terminal.</span>`;
  }
}

// ═══════════════════════════════════════════════════════════════
//  FEATURE 7: FINAL EVALUATION
// ═══════════════════════════════════════════════════════════════
function submitFinalEvaluation() {
  const ta = document.getElementById('final-response');
  const response = ta ? ta.value.trim() : '';
  if(response.length < 30) {
    const fb = document.getElementById('final-feedback');
    if (fb) fb.innerHTML = `<span style="font-family:'Share Tech Mono',monospace; color:var(--red); font-size:0.82rem;">Response too brief. The AI requires more data.</span>`;
    return;
  }
  STATE.finalResponse = response;

  const totalTime = Math.round((Date.now() - STATE.totalStart) / 1000);
  if(totalTime < 600) unlockAchievement('early_bird');

  const final = computeFinalScore();
  if(final >= 80) unlockAchievement('architect');
  if(final >= 90) unlockAchievement('future_lead');

  const record = {
    id: Date.now(),
    name: STATE.candidate.name,
    email: STATE.candidate.email,
    score: final,
    curiosity_score: STATE.scores.curiosity,
    logic_score: STATE.scores.logic,
    debugging_score: STATE.scores.debugging,
    leadership_score: STATE.scores.leadership,
    persistence_score: STATE.scores.persistence,
    final_written_response: STATE.finalResponse,
    time_taken: totalTime,
    achievements: STATE.achievements,
    created_at: new Date().toISOString()
  };
  STATE.candidates.push(record);
  localStorage.setItem('asc_candidates', JSON.stringify(STATE.candidates));

  showResults(final, totalTime);
}

function computeFinalScore() {
  const w = { curiosity: 0.20, logic: 0.20, debugging: 0.30, leadership: 0.15, persistence: 0.15 };
  return Math.round(
    STATE.scores.curiosity * w.curiosity +
    STATE.scores.logic * w.logic +
    STATE.scores.debugging * w.debugging +
    STATE.scores.leadership * w.leadership +
    STATE.scores.persistence * w.persistence
  );
}

// ═══════════════════════════════════════════════════════════════
//  RESULTS
// ═══════════════════════════════════════════════════════════════
function showResults(final, totalTime) {
  showScreen('results');

  setTimeout(() => {
    const circle = document.getElementById('score-circle');
    if (circle) {
      const circumference = 377;
      const offset = circumference - (final/100) * circumference;
      circle.style.transition = 'stroke-dashoffset 1.5s ease';
      circle.style.strokeDashoffset = offset;
    }

    let curr = 0;
    const interval = setInterval(() => {
      curr = Math.min(curr+2, final);
      const disp = document.getElementById('score-display'); if (disp) disp.textContent = curr;
      if(curr >= final) clearInterval(interval);
    }, 30);
  }, 300);

  let rank, rankClass, msg;
  if(final >= 85) {
    rank = 'PROGRAMMING LEAD'; rankClass = 'rank-lead';
    msg = `Candidate ${STATE.candidate.name} demonstrates exceptional technical aptitude, analytical reasoning, and leadership capacity. ASCENSION recommends immediate consideration for Programming Lead. This profile is rare.`;
  } else if(final >= 70) {
    rank = 'CO-LEAD CANDIDATE'; rankClass = 'rank-colead';
    msg = `Candidate ${STATE.candidate.name} shows strong capability across evaluation domains. Technical skills are solid. Leadership instincts are developing. Co-Lead designation is appropriate. Further evaluation may be warranted.`;
  } else if(final >= 50) {
    rank = 'ACTIVE MEMBER'; rankClass = 'rank-member';
    msg = `Candidate ${STATE.candidate.name} passed threshold evaluation. Core skills are present. Leadership development is recommended. Contribution at team level is advised before re-evaluation for leadership roles.`;
  } else {
    rank = 'RE-EVALUATION REQUIRED'; rankClass = 'rank-retry';
    msg = `Current profile does not meet leadership thresholds. Persistence score has been noted. Technical skill development is recommended. Re-evaluation is available at any time.`;
  }

  const vr = document.getElementById('verdict-rank'); if (vr) vr.innerHTML = `<span class="${rankClass}">${rank}</span>`;
  const vt = document.getElementById('verdict-title'); if (vt) vt.textContent = `FINAL SCORE: ${final}/100`;
  const vm = document.getElementById('verdict-message'); if (vm) vm.textContent = msg;

  const breakdown = [
    { label: 'Curiosity', score: STATE.scores.curiosity, weight: '20%' },
    { label: 'Logic', score: STATE.scores.logic, weight: '20%' },
    { label: 'Debugging', score: STATE.scores.debugging, weight: '30%' },
    { label: 'Leadership', score: STATE.scores.leadership, weight: '15%' },
    { label: 'Persistence', score: STATE.scores.persistence, weight: '15%' },
  ];
  const sb = document.getElementById('score-breakdown');
  if (sb) sb.innerHTML = breakdown.map(b => `
    <div class="stat-row">
      <div class="stat-label"><span>${b.label} <span style="color:var(--text-dim); font-size:0.75em;">(${b.weight})</span></span><span class="stat-val">${b.score}</span></div>
      <div class="stat-track"><div class="stat-bar" style="width:${b.score}%"></div></div>
    </div>
  `).join('');

  if(STATE.achievements.length === 0) {
    const ad = document.getElementById('achievement-display'); if (ad) ad.innerHTML = `<span style="font-family:'Share Tech Mono',monospace; font-size:0.8rem; color:var(--text-dim);">No achievements unlocked.</span>`;
  } else {
    const ad = document.getElementById('achievement-display');
    if (ad) ad.innerHTML = STATE.achievements.map(id => {
      const a = ACHIEVEMENTS[id];
      return `<div style="display:flex; align-items:center; gap:0.75rem; margin-bottom:0.75rem;">
        <span style="font-size:1.5rem;">${a.icon}</span>
        <div>
          <div style="font-family:'Orbitron',sans-serif; font-size:0.7rem; color:var(--amber); letter-spacing:0.1em;">${a.name}</div>
          <div style="font-family:'Share Tech Mono',monospace; font-size:0.75rem; color:var(--text-dim);">${a.desc}</div>
        </div>
      </div>`;
    }).join('');
  }
}

// ═══════════════════════════════════════════════════════════════
//  ADMIN PANEL
// ═══════════════════════════════════════════════════════════════
function goToAdmin() {
  showScreen('admin');
  renderAdminSummary();
  renderAdminTable();
}

function goToResults() {
  showScreen('results');
}

function renderAdminSummary() {
  const c = STATE.candidates;
  const grid = document.getElementById('admin-stats-grid');
  if(!grid) return;
  if(c.length === 0) {
    grid.innerHTML = `<div style="font-family:'Share Tech Mono',monospace; color:var(--text-dim); font-size:0.8rem;">No candidates evaluated yet.</div>`;
    return;
  }
  const avg = c.reduce((s,x)=>s+x.score,0)/c.length;
  const top = Math.max(...c.map(x=>x.score));
  const leads = c.filter(x=>x.score>=85).length;
  const stats = [
    {label:'Total Candidates', val: c.length},
    {label:'Average Score', val: Math.round(avg)},
    {label:'Top Score', val: top},
    {label:'Lead Candidates', val: leads},
  ];
  grid.innerHTML = stats.map(s => `
    <div style="background:#080d14; border:1px solid var(--border2); padding:1.25rem 1.5rem;">
      <div style="font-family:'Orbitron',sans-serif; font-size:0.6rem; letter-spacing:0.2em; color:var(--text-dim); margin-bottom:0.5rem; text-transform:uppercase;">${s.label}</div>
      <div style="font-family:'Orbitron',sans-serif; font-size:1.8rem; font-weight:900; color:var(--accent);">${s.val}</div>
    </div>
  `).join('');
}

function renderAdminTable() {
  const searchEl = document.getElementById('admin-search');
  const sortEl = document.getElementById('admin-sort');
  const search = searchEl ? searchEl.value.toLowerCase() : '';
  const sort = sortEl ? sortEl.value : 'score';
  let data = [...STATE.candidates];

  if(search) data = data.filter(c => c.name.toLowerCase().includes(search) || c.email.toLowerCase().includes(search));

  data.sort((a,b) => {
    if(sort==='score') return b.score-a.score;
    if(sort==='score-asc') return a.score-b.score;
    if(sort==='name') return a.name.localeCompare(b.name);
    if(sort==='time') return a.time_taken-b.time_taken;
    return 0;
  });

  const tbody = document.getElementById('admin-tbody'); if(!tbody) return;

  const getVerdict = s => s>=85?'<span style="color:var(--green)">LEAD</span>':s>=70?'<span style="color:var(--accent)">CO-LEAD</span>':s>=50?'<span style="color:var(--amber)">MEMBER</span>':'<span style="color:var(--text-dim)">RETRY</span>';
  const fmtTime = s => `${Math.floor(s/60)}m${s%60}s`;

  tbody.innerHTML = data.length === 0 ?
    `<tr><td colspan="9" style="text-align:center; color:var(--text-dim); padding:2rem; font-family:'Share Tech Mono',monospace;">No candidates found.</td></tr>` :
    data.map((c,i) => `<tr onclick="showAdminResponse('${escapeHtml(c.name)}', '${escapeHtml((c.final_written_response||'No response.').replace(/'/g, "\\'"))}')">
      <td style="color:var(--text-dim);">${i+1}</td>
      <td><span style="color:var(--text-bright);">${escapeHtml(c.name)}</span><br><span style="font-size:0.72rem; color:var(--text-dim);">${escapeHtml(c.email)}</span></td>
      <td style="font-family:'Orbitron',sans-serif; color:var(--accent); font-size:1.1rem;">${c.score}</td>
      <td>${c.curiosity_score||0}</td>
      <td>${c.logic_score||0}</td>
      <td>${c.debugging_score||0}</td>
      <td>${c.leadership_score||0}</td>
      <td>${fmtTime(c.time_taken||0)}</td>
      <td>${getVerdict(c.score)}</td>
    </tr>`).join('');
}

function showAdminResponse(name, response) {
  const panel = document.getElementById('admin-response-panel');
  if(!panel) return;
  panel.style.display = 'block';
  const n = document.getElementById('admin-resp-name'); if(n) n.textContent = `WRITTEN RESPONSE — ${name}`;
  const r = document.getElementById('admin-resp-text'); if(r) r.textContent = response;
  panel.scrollIntoView({ behavior: 'smooth' });
}

function exportCSV() {
  if(STATE.candidates.length === 0) { alert('No candidates to export.'); return; }
  const headers = ['Name','Email','Score','Curiosity','Logic','Debugging','Leadership','Persistence','Time (s)','Achievements','Response','Date'];
  const rows = STATE.candidates.map(c => [
    `"${c.name}"`, `"${c.email}"`, c.score,
    c.curiosity_score, c.logic_score, c.debugging_score, c.leadership_score, c.persistence_score,
    c.time_taken, `"${(c.achievements||[]).join(';')}"`,
    `"${(c.final_written_response||'').replace(/"/g,'""')}"`,
    `"${c.created_at}"`
  ]);
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], {type:'text/csv'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'ascension_candidates.csv';
  a.click();
}

function restartEvaluation() {
  STATE.scores = { curiosity: 0, logic: 0, debugging: 0, leadership: 0, persistence: 0 };
  STATE.achievements = [];
  STATE.curiosityAttempts = 0;
  STATE.logicAnswers = [];
  STATE.debugAnswers = [];
  STATE.leadAnswers = [];
  STATE.terminalExplored = false;
  STATE.terminalKeyFound = false;
  filesOpened = new Set();
  showScreen('intro');
  const begin = document.getElementById('begin-btn'); if(begin) begin.style.display = 'block';
  const introForm = document.getElementById('intro-form'); if(introForm) introForm.style.display = 'none';
  document.querySelectorAll('.t-line').forEach(l => l.classList.remove('show'));
  const input = document.getElementById('terminal-input'); if(input) input.removeEventListener('keydown', handleTerminalInput);
}
