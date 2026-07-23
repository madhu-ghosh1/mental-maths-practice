const CORRECT_REACTIONS = [
  '✓ Correct! 🎉',
  '✓ Nice one! 🔥',
  '✓ Boom! Nailed it. 💥',
  '✓ Maths ninja! 🥷',
  '✓ Too easy for you! 😎',
  '✓ Brain cells activated! 🧠',
  '✓ Yes! Keep going! ⚡',
  '✓ Smooth! 🧈'
];

const INCORRECT_REACTIONS = [
  '✗ So close! Answer: {answer}',
  '✗ Not quite — it was {answer}',
  '✗ Sneaky one! Answer: {answer}',
  '✗ Ah, tricky! It was {answer}',
  '✗ Nice try — answer: {answer}'
];

function randomReaction(pool, answer) {
  const text = pool[Math.floor(Math.random() * pool.length)];
  return text.replace('{answer}', answer);
}

// Lightweight dependency-free confetti burst on a full-viewport canvas overlay.
function fireConfetti() {
  const canvas = document.createElement('canvas');
  canvas.style.position = 'fixed';
  canvas.style.inset = '0';
  canvas.style.pointerEvents = 'none';
  canvas.style.zIndex = '999';
  document.body.appendChild(canvas);

  const dpr = window.devicePixelRatio || 1;
  const w = window.innerWidth, h = window.innerHeight;
  canvas.width = w * dpr;
  canvas.height = h * dpr;
  canvas.style.width = w + 'px';
  canvas.style.height = h + 'px';
  const ctx = canvas.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

  const colors = ['#7c5cff', '#ff7aa8', '#26b783', '#ffb347', '#5636c9'];
  const pieces = Array.from({ length: 90 }, () => ({
    x: Math.random() * w,
    y: -20 - Math.random() * h * 0.3,
    size: 5 + Math.random() * 5,
    color: colors[Math.floor(Math.random() * colors.length)],
    vy: 2 + Math.random() * 3,
    vx: -1.5 + Math.random() * 3,
    rot: Math.random() * Math.PI,
    vr: -0.2 + Math.random() * 0.4
  }));

  const start = performance.now();
  const duration = 2600;

  function frame(now) {
    const elapsed = now - start;
    ctx.clearRect(0, 0, w, h);
    pieces.forEach(p => {
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
      ctx.restore();
    });
    if (elapsed < duration) {
      requestAnimationFrame(frame);
    } else {
      canvas.remove();
    }
  }
  requestAnimationFrame(frame);
}
