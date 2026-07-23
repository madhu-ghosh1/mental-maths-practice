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
    settings: { activeTopics: TOPIC_ORDER.slice(), name: 'Eva', theme: 'auto', welcomeShown: false },
    streak: { current: 0, longest: 0, lastPracticeDate: null },
    sessions: []
  };
}

function loadData() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultData();
    const parsed = JSON.parse(raw);
    return Object.assign(defaultData(), parsed, {
      settings: Object.assign(defaultData().settings, parsed.settings),
      streak: Object.assign(defaultData().streak, parsed.streak)
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

function practicedToday(data) {
  return data.streak.lastPracticeDate === todayStr();
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
