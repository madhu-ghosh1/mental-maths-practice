// Dependency-free canvas charts. Colors read from CSS custom properties so
// light/dark mode swap automatically. Validated sequential ramp (see README):
// light: #bda6ff #9f7dff #7c5cff #5636c9   dark: #4a3d8f #6142e0 #7c5cff #b7a1ff

function cssVar(name) {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function isDarkMode() {
  const root = document.documentElement;
  if (root.dataset.theme === 'dark') return true;
  if (root.dataset.theme === 'light') return false;
  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

function heatRamp() {
  return isDarkMode()
    ? ['#4a3d8f', '#6142e0', '#7c5cff', '#b7a1ff']
    : ['#bda6ff', '#9f7dff', '#7c5cff', '#5636c9'];
}

function setupCanvas(canvas, cssHeight) {
  const dpr = window.devicePixelRatio || 1;
  const cssWidth = canvas.parentElement.clientWidth;
  canvas.style.width = cssWidth + 'px';
  canvas.style.height = cssHeight + 'px';
  canvas.width = Math.round(cssWidth * dpr);
  canvas.height = Math.round(cssHeight * dpr);
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, width: cssWidth, height: cssHeight };
}

// ---- Streak heatmap (last 84 days, GitHub-contributions style) ----
function drawHeatmap(canvas, labelEl, sessions, weeks = 12) {
  const days = weeks * 7;
  const cell = 13, gap = 4;
  const { ctx, width } = setupCanvas(canvas, weeks >= 1 ? 7 * (cell + gap) : 100);
  ctx.clearRect(0, 0, width, canvas.height);

  const byDate = {};
  sessions.forEach(s => {
    if (!byDate[s.date]) byDate[s.date] = { correct: 0, total: 0 };
    byDate[s.date].correct += s.correct;
    byDate[s.date].total += s.total;
  });

  const ramp = heatRamp();
  const emptyColor = cssVar('--border') || '#e7e3f5';
  const today = new Date();
  const cellData = [];

  const gridWidth = weeks * (cell + gap) - gap;
  const offsetX = Math.max(0, (width - gridWidth) / 2);

  for (let w = 0; w < weeks; w++) {
    for (let d = 0; d < 7; d++) {
      const dayIndex = (weeks - 1 - w) * 7 + (6 - d);
      const date = new Date(today);
      date.setDate(date.getDate() - dayIndex);
      const key = date.toISOString().slice(0, 10);
      const rec = byDate[key];
      let color = emptyColor;
      if (rec && rec.total > 0) {
        const acc = rec.correct / rec.total;
        const bucket = acc >= 0.9 ? 3 : acc >= 0.75 ? 2 : acc >= 0.5 ? 1 : 0;
        color = ramp[bucket];
      }
      const x = offsetX + w * (cell + gap);
      const y = d * (cell + gap);
      ctx.fillStyle = color;
      roundRect(ctx, x, y, cell, cell, 3);
      ctx.fill();
      cellData.push({ x, y, key, rec });
    }
  }

  canvas.onclick = (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;
    const hit = cellData.find(c => mx >= c.x && mx <= c.x + cell && my >= c.y && my <= c.y + cell);
    if (hit && labelEl) {
      if (hit.rec && hit.rec.total > 0) {
        const pct = Math.round((hit.rec.correct / hit.rec.total) * 100);
        labelEl.textContent = `${hit.key}: ${pct}% (${hit.rec.correct}/${hit.rec.total})`;
      } else {
        labelEl.textContent = `${hit.key}: no practice`;
      }
    }
  };
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

// ---- Accuracy trend line (last N sessions) ----
function drawTrendLine(canvas, labelEl, sessions, maxPoints = 20) {
  const data = sessions.slice(-maxPoints).map(s => ({
    date: s.date,
    pct: s.total ? Math.round((s.correct / s.total) * 100) : 0
  }));

  const height = 160;
  const { ctx, width } = setupCanvas(canvas, height);
  ctx.clearRect(0, 0, width, height);

  const padL = 30, padR = 14, padT = 16, padB = 22;
  const plotW = width - padL - padR;
  const plotH = height - padT - padB;

  const gridColor = cssVar('--border') || '#e7e3f5';
  const mutedColor = cssVar('--muted') || '#78748f';
  const primary = cssVar('--primary') || '#7c5cff';

  ctx.strokeStyle = gridColor;
  ctx.lineWidth = 1;
  ctx.font = '10px -apple-system, sans-serif';
  ctx.fillStyle = mutedColor;
  [0, 50, 100].forEach(v => {
    const y = padT + plotH - (v / 100) * plotH;
    ctx.beginPath();
    ctx.moveTo(padL, y);
    ctx.lineTo(padL + plotW, y);
    ctx.stroke();
    ctx.fillText(v + '%', 2, y + 3);
  });

  if (data.length === 0) {
    ctx.fillStyle = mutedColor;
    ctx.fillText('No sessions yet', padL, padT + plotH / 2);
    return;
  }

  const stepX = data.length > 1 ? plotW / (data.length - 1) : 0;
  const points = data.map((d, i) => ({
    x: padL + (data.length > 1 ? i * stepX : plotW / 2),
    y: padT + plotH - (d.pct / 100) * plotH,
    ...d
  }));

  ctx.strokeStyle = primary;
  ctx.lineWidth = 2;
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.beginPath();
  points.forEach((p, i) => (i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y)));
  ctx.stroke();

  const last = points[points.length - 1];
  ctx.fillStyle = primary;
  ctx.beginPath();
  ctx.arc(last.x, last.y, 4, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = cssVar('--text') || '#2c2a3d';
  ctx.font = '700 11px -apple-system, sans-serif';
  const labelText = last.pct + '%';
  const labelX = Math.min(last.x + 6, width - ctx.measureText(labelText).width - 4);
  ctx.fillText(labelText, labelX, last.y - 8);

  const hitRadius = 14;
  canvas.onclick = (e) => {
    const rect = canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    let nearest = points[0], best = Infinity;
    points.forEach(p => {
      const d = Math.abs(p.x - mx);
      if (d < best) { best = d; nearest = p; }
    });
    if (best < hitRadius * 3 && labelEl) {
      labelEl.textContent = `${nearest.date}: ${nearest.pct}%`;
    }
  };
}

// ---- Per-topic accuracy bars (horizontal) ----
function drawTopicBars(canvas, labelEl, sessions) {
  const stats = {};
  sessions.forEach(s => {
    Object.entries(s.topics || {}).forEach(([topic, t]) => {
      if (!stats[topic]) stats[topic] = { correct: 0, total: 0 };
      stats[topic].correct += t.correct;
      stats[topic].total += t.total;
    });
  });

  const rows = Object.entries(stats)
    .map(([key, v]) => ({
      key,
      label: (TOPICS[key] && TOPICS[key].label) || key,
      pct: v.total ? Math.round((v.correct / v.total) * 100) : 0,
      total: v.total
    }))
    .sort((a, b) => b.pct - a.pct);

  const rowH = 28;
  const height = Math.max(60, rows.length * rowH + 10);
  const { ctx, width } = setupCanvas(canvas, height);
  ctx.clearRect(0, 0, width, height);

  if (!rows.length) {
    ctx.fillStyle = cssVar('--muted') || '#78748f';
    ctx.font = '13px -apple-system, sans-serif';
    ctx.fillText('Practice a few sessions to see topic breakdown', 4, 20);
    return;
  }

  const labelW = 132;
  const valueW = 40;
  const barMaxW = width - labelW - valueW - 8;
  const primary = cssVar('--primary') || '#7c5cff';
  const track = cssVar('--surface-alt') || '#f3f0fb';
  const text = cssVar('--text') || '#2c2a3d';
  const muted = cssVar('--muted') || '#78748f';

  ctx.font = '11px -apple-system, sans-serif';
  const bars = [];
  rows.forEach((r, i) => {
    const y = i * rowH + 6;
    ctx.fillStyle = muted;
    const truncated = r.label.length > 20 ? r.label.slice(0, 19) + '…' : r.label;
    ctx.fillText(truncated, 0, y + 14);

    ctx.fillStyle = track;
    roundRect(ctx, labelW, y + 4, barMaxW, 14, 7);
    ctx.fill();

    const barW = Math.max(6, (r.pct / 100) * barMaxW);
    ctx.fillStyle = primary;
    roundRect(ctx, labelW, y + 4, barW, 14, 7);
    ctx.fill();

    ctx.fillStyle = text;
    ctx.font = '700 11px -apple-system, sans-serif';
    ctx.fillText(r.pct + '%', labelW + barMaxW + 8, y + 14);
    ctx.font = '11px -apple-system, sans-serif';

    bars.push({ y, key: r.key, label: r.label, pct: r.pct, total: r.total });
  });

  canvas.onclick = (e) => {
    const rect = canvas.getBoundingClientRect();
    const my = e.clientY - rect.top;
    const hit = bars.find(b => my >= b.y && my <= b.y + rowH);
    if (hit && labelEl) {
      labelEl.textContent = `${hit.label}: ${hit.pct}% correct (${hit.total} answered)`;
    }
  };
}
