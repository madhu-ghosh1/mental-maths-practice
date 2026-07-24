let data = loadData();
let session = null; // { questions, index, correct, results, startedAt }

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

function showScreen(name) {
  $$('.screen').forEach(s => s.classList.remove('active'));
  $(`#screen-${name}`).classList.add('active');
  $$('.nav-btn').forEach(b => b.classList.toggle('active', b.dataset.nav === name));
}

// ---------------- Theme ----------------
function applyTheme(theme) {
  if (theme === 'light' || theme === 'dark') {
    document.documentElement.dataset.theme = theme;
  } else {
    delete document.documentElement.dataset.theme;
  }
}

function effectiveTheme() {
  const t = document.documentElement.dataset.theme;
  if (t === 'light' || t === 'dark') return t;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function setTheme(theme) {
  data.settings.theme = theme;
  saveData(data);
  applyTheme(theme);
  $('#themeToggleBtn').textContent = effectiveTheme() === 'dark' ? '☀️' : '🌙';
  $$('.theme-option').forEach(b => b.classList.toggle('active', b.dataset.themeValue === theme));
  if ($('#screen-trends').classList.contains('active')) renderTrends();
}

$('#themeToggleBtn').addEventListener('click', () => {
  setTheme(effectiveTheme() === 'dark' ? 'light' : 'dark');
});

$$('.theme-option').forEach(btn => {
  btn.addEventListener('click', () => setTheme(btn.dataset.themeValue));
});

// ---------------- Jokes ----------------
function showJoke(joke, { isWelcome } = {}) {
  const overlay = $('#jokeOverlay');
  const textEl = $('#jokeText');
  const nextBtn = $('#jokeNextBtn');
  const closeBtn = $('#jokeCloseBtn');
  let step = 0;

  function render() {
    if (joke.type === 'oneliner') {
      textEl.textContent = joke.text;
      nextBtn.style.display = 'none';
      closeBtn.style.display = 'block';
      closeBtn.textContent = isWelcome ? "Let's practice! ✏️" : 'Nice one! 😄';
      return;
    }
    const steps = ['Knock knock!', "Who's there?", `${joke.name}.`, `${joke.name} who?`, joke.punchline];
    const nextLabels = ["Who's there?", 'Tell me!', `${joke.name} who?`, 'Go on... 🥁'];
    textEl.textContent = steps[step];
    if (step < steps.length - 1) {
      nextBtn.style.display = 'block';
      closeBtn.style.display = 'none';
      nextBtn.textContent = nextLabels[step];
    } else {
      nextBtn.style.display = 'none';
      closeBtn.style.display = 'block';
      closeBtn.textContent = isWelcome ? "Let's practice! ✏️" : 'Ha! Another? 😄';
    }
  }

  nextBtn.onclick = () => { step++; render(); };
  closeBtn.onclick = () => {
    overlay.style.display = 'none';
    if (isWelcome) {
      data.settings.welcomeShown = true;
      saveData(data);
    }
  };

  render();
  overlay.style.display = 'flex';
}

$('#jokeBtn').addEventListener('click', () => showJoke(getRandomJoke()));

function maybeShowWelcome() {
  if (!data.settings.welcomeShown) {
    showJoke(getWelcomeJoke(), { isWelcome: true });
  }
}

// ---------------- Home ----------------
function renderHome() {
  const name = data.settings.name;
  $('#homeGreeting').textContent = name ? `Hi ${name}! 👋` : 'Hi there! 👋';

  $('#streakNumber').textContent = data.streak.current;
  $('#streakLongest').textContent = `Best streak: ${data.streak.longest} day${data.streak.longest === 1 ? '' : 's'}`;

  const pill = $('#statusPill');
  if (practicedToday(data)) {
    pill.textContent = '✅ Practiced today';
    pill.className = 'status-pill done';
  } else {
    pill.textContent = '⏳ Not practiced yet today';
    pill.className = 'status-pill pending';
  }

  const wk = weeklyAccuracy(data);
  $('#weekAccuracy').textContent = wk === null ? '—' : wk + '%';
  $('#totalSessions').textContent = data.sessions.length;

  $('#challengeBestSub').textContent = data.challenge.attempts > 0
    ? `Best: ${data.challenge.bestScore}`
    : '2 min blitz';

  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone;
  $('#installBanner').style.display = isStandalone ? 'none' : 'flex';

  $('#themeToggleBtn').textContent = effectiveTheme() === 'dark' ? '☀️' : '🌙';
}

// ---------------- Practice ----------------
function startPractice() {
  const active = data.settings.activeTopics;
  session = {
    questions: buildSession(active, 20),
    index: 0,
    correct: 0,
    results: [],
    startedAt: Date.now()
  };
  showScreen('practice');
  renderQuestion();
}

function renderQuestion() {
  const q = session.questions[session.index];
  $('#practiceProgressFill').style.width = `${(session.index / session.questions.length) * 100}%`;
  $('#practiceCount').textContent = `${session.index + 1} / ${session.questions.length}`;
  $('#questionTopic').textContent = q.topicLabel;
  $('#questionText').textContent = q.text;
  $('#feedbackBanner').textContent = '';
  $('#feedbackBanner').className = 'feedback-banner';

  const numericWrap = $('#numericAnswerWrap');
  const choiceWrap = $('#choiceAnswerWrap');

  if (q.type === 'numeric') {
    numericWrap.style.display = 'flex';
    choiceWrap.style.display = 'none';
    const input = $('#answerInput');
    input.value = '';
    input.className = 'answer-input';
    input.disabled = false;
    setTimeout(() => input.focus(), 50);
  } else {
    numericWrap.style.display = 'none';
    choiceWrap.style.display = 'grid';
    choiceWrap.innerHTML = '';
    q.choices.forEach(choice => {
      const btn = document.createElement('button');
      btn.className = 'choice-btn';
      btn.textContent = choice;
      btn.onclick = () => submitAnswer(choice);
      choiceWrap.appendChild(btn);
    });
  }
}

function submitAnswer(rawAnswer) {
  const q = session.questions[session.index];
  let given = rawAnswer;
  let isCorrect;

  if (q.type === 'numeric') {
    const num = parseFloat(rawAnswer);
    isCorrect = !isNaN(num) && Math.abs(num - q.answer) < 1e-6;
    const input = $('#answerInput');
    input.disabled = true;
    input.classList.add(isCorrect ? 'correct' : 'incorrect');
    if (!isCorrect) input.value = String(q.answer);
  } else {
    isCorrect = rawAnswer === q.answer;
    $$('.choice-btn').forEach(btn => {
      btn.disabled = true;
      if (btn.textContent === q.answer) btn.classList.add('correct');
      else if (btn.textContent === rawAnswer && !isCorrect) btn.classList.add('incorrect');
    });
  }

  const banner = $('#feedbackBanner');
  banner.textContent = isCorrect ? randomReaction(CORRECT_REACTIONS) : randomReaction(INCORRECT_REACTIONS, q.answer);
  banner.className = 'feedback-banner ' + (isCorrect ? 'correct' : 'incorrect');
  if (!isCorrect) {
    const card = $('.question-card');
    card.classList.remove('shake');
    void card.offsetWidth;
    card.classList.add('shake');
  }

  session.results.push({ topic: q.topic, correct: isCorrect });
  if (isCorrect) session.correct++;

  setTimeout(() => {
    session.index++;
    if (session.index >= session.questions.length) {
      finishSession();
    } else {
      renderQuestion();
    }
  }, isCorrect ? 650 : 1400);
}

$('#answerForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const input = $('#answerInput');
  if (input.disabled || input.value.trim() === '') return;
  submitAnswer(input.value.trim());
});

// ---------------- Multiplication Challenge ----------------
let challenge = null; // { score, total, timeLeft, timerId, currentAnswer }
const CHALLENGE_DURATION = 120;

function generateTableQuestion() {
  const table = randInt(2, 20);
  const mult = randInt(1, 12);
  return { text: `${table} × ${mult} = ?`, answer: table * mult };
}

function formatMMSS(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function renderChallengeIntro() {
  $('#challengeIntro').style.display = 'flex';
  $('#challengeActive').style.display = 'none';
  $('#challengeResult').style.display = 'none';
  $('#challengeIntroBest').textContent = `Best score: ${data.challenge.bestScore}`;
}

function openChallenge() {
  renderChallengeIntro();
  showScreen('challenge');
}

function nextChallengeQuestion() {
  const q = generateTableQuestion();
  challenge.currentAnswer = q.answer;
  $('#challengeQuestionText').textContent = q.text;
  const input = $('#challengeAnswerInput');
  input.value = '';
  setTimeout(() => input.focus(), 30);
}

function startChallenge() {
  if (challenge && challenge.timerId) clearInterval(challenge.timerId);
  challenge = { score: 0, total: 0, timeLeft: CHALLENGE_DURATION, timerId: null, currentAnswer: null };
  $('#challengeIntro').style.display = 'none';
  $('#challengeResult').style.display = 'none';
  $('#challengeActive').style.display = 'flex';
  $('#challengeScore').textContent = 'Score: 0';
  $('#challengeTimer').textContent = formatMMSS(CHALLENGE_DURATION);
  $('#challengeTimeFill').style.width = '100%';
  nextChallengeQuestion();

  challenge.timerId = setInterval(() => {
    challenge.timeLeft--;
    $('#challengeTimer').textContent = formatMMSS(Math.max(0, challenge.timeLeft));
    $('#challengeTimeFill').style.width = `${(challenge.timeLeft / CHALLENGE_DURATION) * 100}%`;
    if (challenge.timeLeft <= 0) endChallenge();
  }, 1000);
}

$('#challengeAnswerForm').addEventListener('submit', (e) => {
  e.preventDefault();
  if (!challenge) return;
  const input = $('#challengeAnswerInput');
  const num = parseFloat(input.value);
  challenge.total++;
  if (!isNaN(num) && num === challenge.currentAnswer) challenge.score++;
  $('#challengeScore').textContent = `Score: ${challenge.score}`;
  nextChallengeQuestion();
});

function endChallenge() {
  clearInterval(challenge.timerId);
  $('#challengeActive').style.display = 'none';
  $('#challengeResult').style.display = 'block';

  const isNewBest = recordChallengeResult(data, challenge.score);
  $('#challengeResultScore').textContent = challenge.score;
  $('#challengeResultAccuracy').textContent = `${challenge.score}/${challenge.total} attempted`;
  $('#challengeNewBestBadge').style.display = isNewBest ? 'inline-flex' : 'none';
  if (isNewBest) setTimeout(fireConfetti, 200);
}

$('#openChallengeBtn').addEventListener('click', openChallenge);
$('#challengeStartBtn').addEventListener('click', startChallenge);
$('#challengeAgainBtn').addEventListener('click', startChallenge);
$('#challengeHomeBtn').addEventListener('click', () => {
  renderHome();
  showScreen('home');
});

function finishSession() {
  const durationSec = Math.round((Date.now() - session.startedAt) / 1000);
  const topics = {};
  session.results.forEach(r => {
    if (!topics[r.topic]) topics[r.topic] = { correct: 0, total: 0 };
    topics[r.topic].total++;
    if (r.correct) topics[r.topic].correct++;
  });

  const prevStreak = data.streak.current;
  const record = {
    date: todayStr(),
    topics,
    correct: session.correct,
    total: session.questions.length,
    durationSec
  };
  recordSession(data, record);

  renderSummary(record, prevStreak);
  showScreen('summary');
}

// ---------------- Summary ----------------
function renderSummary(record, prevStreak) {
  const pct = Math.round((record.correct / record.total) * 100);
  $('#summaryScoreBig').textContent = `${record.correct}/${record.total}`;
  $('#summaryPct').textContent = `${pct}% correct`;
  const mins = Math.floor(record.durationSec / 60);
  const secs = record.durationSec % 60;
  $('#summaryTime').textContent = `${mins}m ${secs}s`;

  const badgesEl = $('#summaryBadges');
  badgesEl.innerHTML = '';
  const badges = [];
  if (record.correct === record.total) badges.push('🌟 Perfect score!');
  if (prevStreak < 7 && data.streak.current >= 7) badges.push('🔥 7-day streak!');
  if (prevStreak < 30 && data.streak.current >= 30) badges.push('🏆 30-day streak!');
  Object.entries(record.topics).forEach(([key, t]) => {
    if (t.total >= 3 && t.correct === t.total) {
      badges.push(`💯 ${TOPICS[key].label} nailed it!`);
    }
  });
  badges.forEach(text => {
    const span = document.createElement('span');
    span.className = 'badge';
    span.textContent = text;
    badgesEl.appendChild(span);
  });

  if (badges.length > 0) {
    setTimeout(fireConfetti, 200);
  }

  const breakdownEl = $('#summaryBreakdown');
  breakdownEl.innerHTML = '';
  Object.entries(record.topics).forEach(([key, t]) => {
    const row = document.createElement('div');
    row.className = 'topic-breakdown-row';
    row.innerHTML = `<span>${TOPICS[key].label}</span><span>${t.correct}/${t.total}</span>`;
    breakdownEl.appendChild(row);
  });
}

// ---------------- Trends ----------------
function renderTrends() {
  drawHeatmap($('#heatmapCanvas'), $('#heatmapLabel'), data.sessions);
  drawTrendLine($('#trendCanvas'), $('#trendLabel'), data.sessions);
  drawTopicBars($('#topicBarsCanvas'), $('#topicBarsLabel'), data.sessions);
}

// ---------------- Settings ----------------
function renderSettings() {
  $('#nameInput').value = data.settings.name || '';
  $$('.theme-option').forEach(b => b.classList.toggle('active', b.dataset.themeValue === data.settings.theme));

  const list = $('#topicToggleList');
  list.innerHTML = '';
  TOPIC_ORDER.forEach(key => {
    const row = document.createElement('div');
    row.className = 'topic-toggle';
    const active = data.settings.activeTopics.includes(key);
    row.innerHTML = `
      <span>${TOPICS[key].label}</span>
      <label class="switch">
        <input type="checkbox" data-topic="${key}" ${active ? 'checked' : ''}>
        <span class="switch-track"></span>
      </label>`;
    list.appendChild(row);
  });

  list.querySelectorAll('input[type="checkbox"]').forEach(input => {
    input.addEventListener('change', () => {
      const key = input.dataset.topic;
      const set = new Set(data.settings.activeTopics);
      if (input.checked) set.add(key); else set.delete(key);
      if (set.size === 0) { input.checked = true; set.add(key); }
      data.settings.activeTopics = TOPIC_ORDER.filter(t => set.has(t));
      saveData(data);
    });
  });
}

$('#nameInput').addEventListener('input', (e) => {
  data.settings.name = e.target.value.trim();
  saveData(data);
});

$('#resetDataBtn').addEventListener('click', () => {
  if (confirm('Reset all practice history and streak? This cannot be undone.')) {
    data = defaultData();
    saveData(data);
    renderHome();
    renderSettings();
    showScreen('home');
  }
});

// ---------------- Navigation wiring ----------------
function abandonChallengeIfActive() {
  if (challenge && challenge.timerId) {
    clearInterval(challenge.timerId);
    challenge.timerId = null;
  }
}

$$('.nav-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    abandonChallengeIfActive();
    const target = btn.dataset.nav;
    showScreen(target);
    if (target === 'trends') renderTrends();
    if (target === 'settings') renderSettings();
    if (target === 'home') renderHome();
  });
});

$('#startPracticeBtn').addEventListener('click', startPractice);
$('#practiceAgainBtn').addEventListener('click', startPractice);
$('#summaryHomeBtn').addEventListener('click', () => { renderHome(); showScreen('home'); });

window.addEventListener('resize', () => {
  if ($('#screen-trends').classList.contains('active')) renderTrends();
});

// ---------------- Init ----------------
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('service-worker.js').catch(() => {});
  });
  // When a newly-deployed service worker takes over, reload once so the page
  // picks up the fresh assets it just fetched instead of staying on whatever
  // was already loaded in memory from the previous version.
  let reloadedForUpdate = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (reloadedForUpdate) return;
    reloadedForUpdate = true;
    window.location.reload();
  });
}

applyTheme(data.settings.theme);
renderHome();
showScreen('home');
maybeShowWelcome();
