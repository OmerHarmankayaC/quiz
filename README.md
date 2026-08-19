# Kaç?

A Turkish Fermi estimation game. You are asked how many of something there are
— pyramid blocks, constitutional referendum votes, litres of water — and you
answer on a logarithmic slider. Scoring is by order of magnitude, not by exact
match, so being within a factor of two counts as a good answer.

**Play:** [quiz-sandy-pi.vercel.app](https://quiz-sandy-pi.vercel.app)

The interface and all question content are in Turkish.

## What is in it

- **Daily puzzle** — three questions a day from a fixed calendar, with a streak
  counter. Everyone gets the same puzzle on the same day (Europe/Istanbul).
- **Packs** — six themed sets of ten questions each.
- **Two question types** — Fermi estimation on a slider, and multiple choice.
- **Napkin maths** — after answering, the result card shows the back-of-envelope
  calculation that gets you to the right order of magnitude.
- **Archive** — replay past days.

The question bank ships with 224 Fermi questions, 781 multiple choice questions,
and a 102-day calendar.

## Design

Everything runs in the browser. There is no server, no account, and no
database: the game is a static Next.js export, the question bank is compiled to
JSON at build time, and progress lives in `localStorage`.

All game rules live in pure, DOM-free modules under `lib/game/`. React
components only render — no component computes a score. That split is what
makes the rules testable, and there are 138 tests over them.

| Module | Responsibility |
|---|---|
| `lib/game/scoring.ts` | Ratio, points, log-scale slider conversion |
| `lib/game/daily.ts` | Date → the day's puzzle, calendar validation |
| `lib/game/storage.ts` | The only door to `localStorage` |
| `lib/game/bank.ts` | Reads the JSON bank, builds the id → question index |
| `lib/game/format.ts` | Turkish number formatting |
| `lib/game/renk.ts` | Pack colour derivation |
| `lib/game/hesap.ts` | Picks which napkin calculation to show |

The slider is logarithmic: one step is 10^(1/10), so the full 180-step range
spans from below 1 to the very large answers in the bank.

## Stack

Next.js 15 (App Router, `output: 'export'`) · TypeScript (strict) · Tailwind v4
· Vitest + jsdom. Question bank built by Python scripts under `scripts/`.

## Development

```bash
npm install
npm run dev      # http://localhost:3000
npm test         # vitest, 138 tests
npm run build    # static export
```

Rebuilding the question bank:

```bash
python3 scripts/build_fermi_bank.py
python3 scripts/build_mcq_bank.py
python3 scripts/build_packs.py
python3 scripts/build_calendar.py
python3 scripts/validate_bank.py
```

## Credits

The format is inspired by [fermi.gg](https://fermi.gg); the questions, the
Turkish content, and the implementation are original.
