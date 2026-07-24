const STORAGE_KEY = 'mentalMathsData_v1';

function todayStr() {
  const d = new Date();
  const tz = d.getTimezoneOffset() * 60000;
  return new Date(d - tz).toISOString().slice(0, 10);
}

function daysBetween(a, b) {
  const d1 = new Date(a + 'T00:00:00');
  const d2 = new Date(b + 'T00:00:00');
  return Math.round((d2 - d1) / 86400000);
}

function defaultData() {
  return {
    settings: { activeTopics: TOPIC_ORDER.slice(), name: 'Eva', theme: 'auto', welcomeShown: false, lastSummaryShownDate: null },
    streak: { current: 0, longest: 0, lastPracticeDate: null },
    sessions: [],
    challenge: { bestScore: 0, attempts: 0 },
    topicStats: {}
  };
}

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultData();
    const parsed = JSON.parse(raw);
    return Object.assign(defaultData(), parsed, {
      settings: Object.assign(defaultData().settings, parsed.settings),
      streak: Object.assign(defaultData().streak, parsed.streak),
      challenge: Object.assign(defaultData().challenge, parsed.challenge),
      topicStats: Object.assign(defaultData().topicStats, parsed.topicStats)
    });
  } catch (e) {
    return defaultData();
  }
}

function saveData(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

function recordSession(data, session) {
  data.sessions.push(session);

  const today = todayStr();
  const last = data.streak.lastPracticeDate;
  if (last === today) {
    // already counted today
  } else if (last && daysBetween(last, today) === 1) {
    data.streak.current += 1;
  } else {
    data.streak.current = 1;
  }
  data.streak.lastPracticeDate = today;
  data.streak.longest = Math.max(data.streak.longest, data.streak.current);

  saveData(data);
  return data;
}

function recordChallengeResult(data, score) {
  data.challenge.attempts += 1;
  const isNewBest = score > data.challenge.bestScore;
  if (isNewBest) data.challenge.bestScore = score;
  saveData(data);
  return isNewBest;
}

function practicedToday(data) {
  return data.streak.lastPracticeDate === todayStr();
}

const MAX_TOPIC_LEVEL = 3;

function getTopicLevel(data, topicKey) {
  return (data.topicStats[topicKey] && data.topicStats[topicKey].level) || 1;
}

// Streak-based promotion: 3 correct answers in a row levels a topic up,
// 2 wrong in a row levels it down. Levels persist across sessions since a
// topic may only get 1-2 questions per day when many topics are active.
function updateTopicLevel(data, topicKey, isCorrect) {
  if (!data.topicStats[topicKey]) {
    data.topicStats[topicKey] = { level: 1, correctStreak: 0, wrongStreak: 0 };
  }
  const stat = data.topicStats[topicKey];
  let direction = null;

  if (isCorrect) {
    stat.correctStreak += 1;
    stat.wrongStreak = 0;
    if (stat.correctStreak >= 3 && stat.level < MAX_TOPIC_LEVEL) {
      stat.level += 1;
      stat.correctStreak = 0;
      direction = 'up';
    }
  } else {
    stat.wrongStreak += 1;
    stat.correctStreak = 0;
    if (stat.wrongStreak >= 2 && stat.level > 1) {
      stat.level -= 1;
      stat.wrongStreak = 0;
      direction = 'down';
    }
  }

  saveData(data);
  return direction ? { direction } : null;
}

// Weakest active topic across the last few sessions, for the "today's focus" line.
// Returns null when there isn't enough data yet to make a fair call.
function weakestActiveTopic(data, activeTopics, lookback = 5) {
  const recent = data.sessions.slice(-lookback);
  const stats = {};
  recent.forEach(s => {
    Object.entries(s.topics || {}).forEach(([topic, t]) => {
      if (!activeTopics.includes(topic)) return;
      if (!stats[topic]) stats[topic] = { correct: 0, total: 0 };
      stats[topic].correct += t.correct;
      stats[topic].total += t.total;
    });
  });

  let weakest = null;
  Object.entries(stats).forEach(([topic, t]) => {
    if (t.total < 2) return;
    const acc = t.correct / t.total;
    if (!weakest || acc < weakest.acc) weakest = { topic, acc };
  });
  return weakest ? weakest.topic : null;
}

function weeklyAccuracy(data) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 7);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  const recent = data.sessions.filter(s => s.date >= cutoffStr);
  if (!recent.length) return null;
  const correct = recent.reduce((a, s) => a + s.correct, 0);
  const total = recent.reduce((a, s) => a + s.total, 0);
  return total ? Math.round((correct / total) * 100) : null;
}
