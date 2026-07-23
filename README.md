# Mental Maths Practice

A daily mental-maths practice app, built for a Year 8 student, aligned to the
JAGS Year 8 Scheme of Learning. Static PWA — no backend, no accounts, no
build step. Works fully offline once installed. All progress is stored only
in the browser on the device it's used on.

## How it works

- 20 questions a day, mixed across whichever topics are toggled on in Settings.
- Home screen shows a streak counter and whether today's practice is done.
- Trends screen shows a 12-week practice heatmap, an accuracy trend line, and
  a per-topic accuracy breakdown.
- Data lives in `localStorage` on the device — nothing is sent anywhere.

## One-time setup on her iPhone/iPad

### 1. Install as a home-screen app
1. Open the app's URL in **Safari** (must be Safari, not Chrome, for this to work on iOS).
2. Tap the **Share** icon (square with an arrow) in the toolbar.
3. Tap **Add to Home Screen** → **Add**.
4. Launch it from the new home-screen icon from now on (it opens full-screen, no browser bar, and works offline).

### 2. Daily 7:20 AM reminder (iOS Shortcuts automation)
No backend/push server is used — this uses Apple's built-in Shortcuts app instead:
1. Open the **Shortcuts** app.
2. Go to the **Automation** tab → tap **+** → **Create Personal Automation**.
3. Choose **Time of Day** → set it to **7:20 AM** → **Daily** → **Next**.
4. Tap **Add Action**, search for **Show Notification**, and add it.
   - Title: `Mental Maths time! 🧠`
   - Body: `20 questions — let's keep the streak going`
5. Optionally add a second action, **Open App**, and choose the Mental Maths
   home-screen app, so tapping the notification jumps straight in.
6. Tap **Next** → turn **Ask Before Running** **OFF** (otherwise it won't fire automatically) → **Done**.

That's it — no further setup needed. The automation lives entirely on the device.

## Changing topics or questions

All question logic is in `js/topics.js`. Each topic is a `generate()` function
returning either a numeric-entry question (`{ type: 'numeric', text, answer }`)
or a multiple-choice one (`{ type: 'choice', text, choices, answer }`). Add a
new topic by adding a new entry to the `TOPICS` object and its key to
`TOPIC_ORDER` — it'll automatically show up as a toggle in Settings.

Which topics are active for the daily session is controlled entirely from the
in-app **Settings** screen (manual per-topic toggles) — nothing here needs to
change for that.

## Local development

```bash
python3 -m http.server 8934
# open http://localhost:8934/index.html
```

No build step, no dependencies.
