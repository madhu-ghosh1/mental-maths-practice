// Knock-knock jokes and one-liners. Kept kid-friendly and Year 8 appropriate.

const KNOCK_KNOCK_JOKES = [
  { name: 'Ivana', punchline: "Ivana be a maths genius — let's go!" },
  { name: 'Lettuce', punchline: "Lettuce in, it's cold out here!" },
  { name: 'Olive', punchline: 'Olive you and I miss you when you skip practice!' },
  { name: 'Tank', punchline: "You're welcome!" },
  { name: 'Wooden shoe', punchline: 'Wooden shoe like to hear another joke?' },
  { name: 'Dishes', punchline: 'Dishes a very bad joke, but here we are.' },
  { name: 'Interrupting cow', punchline: 'MOO!' },
  { name: 'Adder', punchline: "Adder you going to let me in or what?" },
  { name: 'Isabelle', punchline: "Isabelle working? I had to knock!" },
  { name: 'Figs', punchline: "Figs the doorbell, it's broken!" }
];

const ONE_LINERS = [
  'Why was six afraid of seven? Because seven eight nine! 🍽️',
  'Why did the two 4s skip lunch? They already 8! 😄',
  "Why is it sad that parallel lines have so much in common? They'll never meet. 😢",
  "Why couldn't the angle get a loan? Its parents wouldn't co-sign! 📐",
  'Why did the student wear glasses in maths class? To improve di-vision! 👓',
  "What do you call a number that can't sit still? A roamin' numeral! 🏃",
  'I saw my maths teacher with a piece of graph paper yesterday... I think she must be plotting something. 📈',
  'Why was the maths book sad? It had too many problems. 📚',
  'What did the zero say to the eight? Nice belt! 🎽',
  'Why do maths teachers love parks? All the natural logs! 🌳',
  "Why is maths like a nice pair of shoes? Because they always fit... eventually. 👟",
  'What did one triangle say to the other? Nice angle! 📐',
  "Why did the fraction go to therapy? It couldn't stay whole. 🍰",
  '5 out of 4 people struggle with fractions. 😅',
  'Why was the equal sign so humble? Because it wasn\'t less than or greater than anyone else. 🤝'
];

function randomOf(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomJoke() {
  const useKnockKnock = Math.random() < 0.5;
  if (useKnockKnock) {
    return { type: 'knock', ...randomOf(KNOCK_KNOCK_JOKES) };
  }
  return { type: 'oneliner', text: randomOf(ONE_LINERS) };
}

function getWelcomeJoke() {
  return { type: 'knock', ...randomOf(KNOCK_KNOCK_JOKES) };
}
