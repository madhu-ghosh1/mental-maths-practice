// Question generators for the JAGS Year 8 Scheme of Learning.
// Each topic maps to a generator that returns either:
//   { type: 'numeric', text, answer }               -- typed numeric answer
//   { type: 'choice',  text, choices: [...], answer } -- multiple choice (answer is the correct string)

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick(arr) {
  return arr[randInt(0, arr.length - 1)];
}

function shuffle(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = randInt(0, i);
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function makeChoices(correct, distractors) {
  const choices = shuffle([correct, ...distractors]);
  return { choices: choices.map(String), answer: String(correct) };
}

const TOPICS = {
  indices: {
    label: 'Indices & Algebra',
    generate() {
      const kind = pick(['multiply', 'divide', 'power', 'substitute']);
      const base = randInt(2, 6);
      if (kind === 'multiply') {
        const a = randInt(1, 5), b = randInt(1, 5);
        return { type: 'numeric', text: `${base}^${a} × ${base}^${b} = ${base}^?`, answer: a + b };
      }
      if (kind === 'divide') {
        const b = randInt(1, 4), a = b + randInt(1, 4);
        return { type: 'numeric', text: `${base}^${a} ÷ ${base}^${b} = ${base}^?`, answer: a - b };
      }
      if (kind === 'power') {
        const a = randInt(1, 4), b = randInt(1, 3);
        return { type: 'numeric', text: `(${base}^${a})^${b} = ${base}^?`, answer: a * b };
      }
      const x = randInt(2, 6);
      const coeff = randInt(2, 5);
      return { type: 'numeric', text: `If x = ${x}, what is ${coeff}x²?`, answer: coeff * x * x };
    }
  },

  angles: {
    label: 'Angles & Polygons',
    generate() {
      const kind = pick(['line', 'interior', 'exterior', 'triangle']);
      if (kind === 'line') {
        const a = randInt(20, 160);
        return { type: 'numeric', text: `Two angles on a straight line: one is ${a}°. What is the other?`, answer: 180 - a };
      }
      if (kind === 'interior') {
        const sides = randInt(4, 10);
        return { type: 'numeric', text: `What is the sum of interior angles of a ${sides}-sided polygon (in degrees)?`, answer: (sides - 2) * 180 };
      }
      if (kind === 'exterior') {
        const sides = randInt(3, 12);
        return { type: 'numeric', text: `What is each exterior angle of a regular ${sides}-sided polygon (in degrees)? (round to nearest whole number)`, answer: Math.round(360 / sides) };
      }
      const a = randInt(30, 100), b = randInt(30, 100);
      const c = 180 - a - b;
      return { type: 'numeric', text: `A triangle has angles ${a}° and ${b}°. What is the third angle?`, answer: c };
    }
  },

  probability: {
    label: 'Probability',
    generate() {
      const kind = pick(['dice', 'coin', 'spinner', 'bag']);
      if (kind === 'dice') {
        return { type: 'numeric', text: `A fair 6-sided die is rolled. What is the probability of getting a specific number? Answer as the denominator (e.g. for 1/6 answer 6).`, answer: 6 };
      }
      if (kind === 'coin') {
        const c = makeChoices('1/2', ['1/4', '1/3', '2/3']);
        return { type: 'choice', text: 'A fair coin is flipped. What is the probability of heads?', choices: c.choices, answer: c.answer };
      }
      if (kind === 'spinner') {
        const sections = randInt(3, 8);
        return { type: 'numeric', text: `A spinner has ${sections} equal sections numbered 1 to ${sections}. What is the denominator of the probability of landing on any one specific number?`, answer: sections };
      }
      const red = randInt(2, 6), blue = randInt(2, 6);
      const total = red + blue;
      return { type: 'numeric', text: `A bag has ${red} red and ${blue} blue balls. What is the denominator of the probability of picking red (as a fraction out of the total)?`, answer: total };
    }
  },

  percentages: {
    label: 'Percentages',
    generate() {
      const kind = pick(['of', 'increase', 'decrease']);
      const base = randInt(2, 20) * 10;
      const pct = pick([5, 10, 15, 20, 25, 50, 75]);
      if (kind === 'of') {
        return { type: 'numeric', text: `What is ${pct}% of ${base}?`, answer: Math.round(base * pct / 100) };
      }
      if (kind === 'increase') {
        return { type: 'numeric', text: `Increase ${base} by ${pct}%. What is the new value?`, answer: Math.round(base * (1 + pct / 100)) };
      }
      return { type: 'numeric', text: `Decrease ${base} by ${pct}%. What is the new value?`, answer: Math.round(base * (1 - pct / 100)) };
    }
  },

  coordinates: {
    label: 'Coordinates & Graphs',
    generate() {
      const kind = pick(['midpoint', 'gradient', 'evaluate']);
      if (kind === 'midpoint') {
        const x1 = randInt(-6, 6), y1 = randInt(-6, 6), x2 = randInt(-6, 6), y2 = randInt(-6, 6);
        return { type: 'numeric', text: `Midpoint x-coordinate of (${x1}, ${y1}) and (${x2}, ${y2})?`, answer: (x1 + x2) / 2 };
      }
      if (kind === 'gradient') {
        const x1 = randInt(0, 4), y1 = randInt(0, 4);
        const m = randInt(-4, 4) || 1;
        const x2 = x1 + randInt(1, 3);
        const y2 = y1 + m * (x2 - x1);
        return { type: 'numeric', text: `What is the gradient between (${x1}, ${y1}) and (${x2}, ${y2})?`, answer: m };
      }
      const m = randInt(-4, 4) || 2, c = randInt(-5, 5), x = randInt(-4, 4);
      return { type: 'numeric', text: `If y = ${m}x + ${c}, what is y when x = ${x}?`, answer: m * x + c };
    }
  },

  sequences: {
    label: 'Sequences',
    generate() {
      const kind = pick(['next', 'nth']);
      const start = randInt(1, 10);
      const step = randInt(2, 8);
      if (kind === 'next') {
        const terms = [start, start + step, start + 2 * step, start + 3 * step];
        return { type: 'numeric', text: `What is the next term: ${terms.join(', ')}, ?`, answer: start + 4 * step };
      }
      const n = randInt(4, 10);
      return { type: 'numeric', text: `A sequence has nth term ${step}n + ${start}. What is the ${n}th term?`, answer: step * n + start };
    }
  },

  area_perimeter: {
    label: 'Area & Perimeter',
    generate() {
      const kind = pick(['rect_area', 'rect_perim', 'triangle_area', 'parallelogram']);
      if (kind === 'rect_area') {
        const w = randInt(2, 15), h = randInt(2, 15);
        return { type: 'numeric', text: `Area of a rectangle ${w}cm × ${h}cm?`, answer: w * h };
      }
      if (kind === 'rect_perim') {
        const w = randInt(2, 15), h = randInt(2, 15);
        return { type: 'numeric', text: `Perimeter of a rectangle ${w}cm × ${h}cm?`, answer: 2 * (w + h) };
      }
      if (kind === 'triangle_area') {
        const b = randInt(2, 16), h = randInt(2, 16);
        return { type: 'numeric', text: `Area of a triangle with base ${b}cm and height ${h}cm?`, answer: (b * h) / 2 };
      }
      const b = randInt(2, 15), h = randInt(2, 15);
      return { type: 'numeric', text: `Area of a parallelogram with base ${b}cm and height ${h}cm?`, answer: b * h };
    }
  },

  expanding_brackets: {
    label: 'Expanding Brackets & Equations',
    generate() {
      const kind = pick(['expand', 'solve']);
      if (kind === 'expand') {
        const a = randInt(2, 6), b = randInt(1, 8);
        const x = randInt(1, 6);
        return { type: 'numeric', text: `Expand ${a}(x + ${b}), then evaluate at x = ${x}. What's the result?`, answer: a * (x + b) };
      }
      const a = randInt(2, 8), b = randInt(1, 10);
      const x = randInt(1, 8);
      const total = a * x + b;
      return { type: 'numeric', text: `Solve for x: ${a}x + ${b} = ${total}`, answer: x };
    }
  },

  averages: {
    label: 'Averages & Range',
    generate() {
      const kind = pick(['mean', 'range', 'median']);
      if (kind === 'mean') {
        const n = randInt(3, 5);
        let nums, sum;
        do {
          nums = Array.from({ length: n }, () => randInt(1, 20));
          sum = nums.reduce((a, b) => a + b, 0);
        } while (sum % n !== 0);
        return { type: 'numeric', text: `Find the mean of: ${nums.join(', ')}`, answer: sum / n };
      }
      if (kind === 'range') {
        const n = randInt(4, 6);
        const nums = Array.from({ length: n }, () => randInt(1, 20));
        return { type: 'numeric', text: `Find the range of: ${nums.join(', ')}`, answer: Math.max(...nums) - Math.min(...nums) };
      }
      const n = 5;
      const nums = Array.from({ length: n }, () => randInt(1, 20));
      const sorted = [...nums].sort((a, b) => a - b);
      return { type: 'numeric', text: `Find the median of: ${nums.join(', ')}`, answer: sorted[2] };
    }
  },

  pythagoras: {
    label: "Pythagoras' Theorem",
    generate() {
      const triples = [[3, 4, 5], [6, 8, 10], [5, 12, 13], [9, 12, 15], [8, 15, 17], [7, 24, 25]];
      const [a, b, c] = pick(triples);
      const findHyp = Math.random() < 0.6;
      if (findHyp) {
        return { type: 'numeric', text: `Right-angled triangle with legs ${a}cm and ${b}cm. Find the hypotenuse.`, answer: c };
      }
      return { type: 'numeric', text: `Right-angled triangle with hypotenuse ${c}cm and one leg ${a}cm. Find the other leg.`, answer: b };
    }
  },

  algebra_factorise: {
    label: 'Rearranging & Factorising',
    generate() {
      const kind = pick(['rearrange', 'factorise']);
      if (kind === 'rearrange') {
        const a = randInt(2, 6), b = randInt(1, 10);
        const x = randInt(1, 8);
        const total = a * x + b;
        return { type: 'numeric', text: `Make x the subject: ${a}x + ${b} = ${total}. What is x?`, answer: x };
      }
      const p = randInt(1, 6), q = randInt(1, 6);
      const bSum = p + q, c = p * q;
      const cStr = `+ ${c}`;
      const distractors = [
        `(x + ${p})(x - ${q})`,
        `(x - ${p})(x + ${q})`,
        `(x - ${p})(x - ${q})`
      ];
      const correct = `(x + ${p})(x + ${q})`;
      const { choices, answer } = makeChoices(correct, distractors);
      return { type: 'choice', text: `Factorise: x² + ${bSum}x ${cStr}`, choices, answer };
    }
  },

  volume: {
    label: 'Volume',
    generate() {
      const kind = pick(['cuboid', 'prism']);
      if (kind === 'cuboid') {
        const l = randInt(2, 10), w = randInt(2, 10), h = randInt(2, 10);
        return { type: 'numeric', text: `Volume of a cuboid ${l}cm × ${w}cm × ${h}cm?`, answer: l * w * h };
      }
      const base = randInt(2, 10), height = randInt(2, 10), length = randInt(2, 10);
      const area = (base * height) / 2;
      return { type: 'numeric', text: `A triangular prism has a triangular cross-section with base ${base}cm and height ${height}cm, and the prism is ${length}cm long. What is its volume?`, answer: area * length };
    }
  },

  ratio: {
    label: 'Ratio',
    generate() {
      const kind = pick(['simplify', 'share']);
      if (kind === 'simplify') {
        const factor = randInt(2, 6);
        const a = randInt(1, 6), b = randInt(1, 6);
        return { type: 'numeric', text: `Simplify the ratio ${a * factor}:${b * factor} to its simplest form. What is the first number?`, answer: a };
      }
      const a = randInt(1, 5), b = randInt(1, 5);
      const parts = a + b;
      const perPart = randInt(2, 10);
      const total = parts * perPart;
      return { type: 'numeric', text: `Share £${total} in the ratio ${a}:${b}. How much is the first share?`, answer: a * perPart };
    }
  },

  construction_locus: {
    label: 'Construction & Locus',
    generate() {
      const facts = [
        { q: 'What tool is used to draw an arc of constant radius in constructions?', correct: 'Compass', distractors: ['Protractor', 'Ruler', 'Set square'] },
        { q: 'The locus of points equidistant from two fixed points is a...', correct: 'Perpendicular bisector', distractors: ['Angle bisector', 'Circle', 'Straight line parallel to both'] },
        { q: 'The locus of points equidistant from two lines meeting at a point is a...', correct: 'Angle bisector', distractors: ['Perpendicular bisector', 'Circle', 'Arc'] },
        { q: 'The locus of points a fixed distance from a single point is a...', correct: 'Circle', distractors: ['Straight line', 'Perpendicular bisector', 'Angle bisector'] }
      ];
      const f = pick(facts);
      const { choices, answer } = makeChoices(f.correct, f.distractors);
      return { type: 'choice', text: f.q, choices, answer };
    }
  },

  bearings_scale: {
    label: 'Bearings & Scale Drawing',
    generate() {
      const kind = pick(['bearing_fact', 'back_bearing', 'scale']);
      if (kind === 'bearing_fact') {
        const facts = [
          { q: 'Bearings are always measured from which direction?', correct: 'North', distractors: ['South', 'East', 'West'] },
          { q: 'Bearings are measured in which direction?', correct: 'Clockwise', distractors: ['Anticlockwise'] },
          { q: 'How many figures should a bearing always be written with?', correct: '3', distractors: ['2', '4', '1'] }
        ];
        const f = pick(facts);
        const { choices, answer } = makeChoices(f.correct, f.distractors);
        return { type: 'choice', text: f.q, choices, answer };
      }
      if (kind === 'back_bearing') {
        const b = randInt(10, 170);
        return { type: 'numeric', text: `A bearing is ${b}°. What is the back bearing (add 180°)?`, answer: b + 180 };
      }
      const cm = randInt(2, 10);
      const scaleFactor = pick([100, 1000, 50000]);
      const realM = (cm * scaleFactor) / 100;
      return { type: 'numeric', text: `A map has scale 1:${scaleFactor}. A distance on the map is ${cm}cm. What is the real distance in metres?`, answer: realM };
    }
  },

  circle_theorems: {
    label: 'Circle Theorems',
    generate() {
      const facts = [
        { q: 'The angle in a semicircle is always...', correct: '90°', distractors: ['180°', '45°', '60°'] },
        { q: 'The angle at the centre of a circle is __ the angle at the circumference (same arc).', correct: 'Twice', distractors: ['Half', 'Equal to', 'Three times'] },
        { q: 'A tangent to a circle meets the radius at what angle?', correct: '90°', distractors: ['45°', '180°', '60°'] },
        { q: 'Angles in the same segment of a circle, subtended by the same arc, are...', correct: 'Equal', distractors: ['Supplementary', 'Complementary', 'Twice each other'] }
      ];
      const f = pick(facts);
      const { choices, answer } = makeChoices(f.correct, f.distractors);
      return { type: 'choice', text: f.q, choices, answer };
    }
  },

  statistics: {
    label: 'Statistics',
    generate() {
      const items = ['apples', 'red cars', 'goals', 'sunny days', 'late buses'];
      const item = pick(items);
      const n = 5;
      const freqs = Array.from({ length: n }, () => randInt(1, 12));
      const total = freqs.reduce((a, b) => a + b, 0);
      return {
        type: 'numeric',
        text: `A frequency table has counts of ${item}: ${freqs.join(', ')}. What is the total frequency?`,
        answer: total
      };
    }
  }
};

const TOPIC_ORDER = [
  'indices', 'angles', 'probability', 'percentages', 'coordinates', 'sequences',
  'area_perimeter', 'expanding_brackets', 'averages', 'pythagoras',
  'algebra_factorise', 'volume', 'ratio', 'construction_locus',
  'bearings_scale', 'circle_theorems', 'statistics'
];

function generateQuestion(topicKey) {
  const topic = TOPICS[topicKey];
  const q = topic.generate();
  q.topic = topicKey;
  q.topicLabel = topic.label;
  return q;
}

function buildSession(activeTopics, count) {
  const pool = activeTopics.length ? activeTopics : TOPIC_ORDER;
  const questions = [];
  for (let i = 0; i < count; i++) {
    const topicKey = pool[i % pool.length];
    questions.push(generateQuestion(topicKey));
  }
  return shuffle(questions);
}
