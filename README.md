# Valuation Game Web

A browser port of the original Valuation Game, built with React, TypeScript,
Phaser 3, and Vite. The current playable slice reproduces the A0 introduction
and all eight scored Stage A substages, A1 through A8. Ordinary lesson,
question, calculator, and feedback interfaces use React; Phaser remains
used for the graphical Lifestyle driveway scene.

## Requirements

- Node.js 20.19+ or 22.12+
- npm

## Install and run

```sh
npm install
npm run dev
```

Open the local URL printed by Vite. Choose **New Game** to begin the six-card
A0 introduction. Complete each substage's worked tutorial and eight timed
questions to unlock the next Stage A lesson, from A1 Interest through A8
Perpetuities. The **Stage Map** tracks Stage A progress; **Lifestyle** opens
the driveway, dealership, fashion, jewelry, garage/toys, and realtor catalogs.
A0 is the original unscored introduction; A1-A8 contain the scored questions
and earnings.

Stage rewards use the typed cap table in `src/game/logic/rewards.ts`. For each
eight-question substage, USD earnings are the stage cap multiplied by
performance points divided by 800,000, clamped to the range 0–1 and rounded
to the nearest dollar. Performance points remain separate from cash, and
negative performance never creates a negative cash reward. The cap table also
contains the proposed A0 and B0-B5 values, but A0 is an unscored introduction
and Stage B is not yet playable in this web version.
A1-A3 caps are calibrated so a strong performance worth 80% of each stage's
potential points earns $3,504 cumulatively; average and weak scores still pay
proportionally less. Later caps rise progressively through Stage A and B.
Future Value (A4) uses a three-times time factor, so its potential score decays
at one-third the A1-A3 rate while the same point ceiling and accuracy rules
remain in effect.

## Controls

- Click lesson controls or press **Space/Enter** to reveal and continue.
- Click an answer or press **1**, **2**, or **3**.
- Press **C** to open or close the calculator; use **Escape** to pause/resume.
- The calculator also supports the keyboard's number, arithmetic, percent,
  Backspace, Enter, and Delete keys.

## Save data and scope

Progress and earnings are saved in this browser's localStorage. Use **New Game**
to restart; replacing an existing save requires confirmation. Each substage's
available-cash reward is credited once, including after reloads. Lifestyle
purchases deduct available cash without changing career earnings; purchased
items, equipped clothing/accessories, selected vehicles and properties, and
display slots are saved with the same player state. New players create a name
and choose from 24 illustrated avatars after selecting **New Game**. Each
avatar has a permanent save ID plus separate portrait and Lifestyle character
art keys; the current SVG and Phaser illustrations share the same appearance
configuration. Existing saves from versions 1 through 4 prompt for a profile
when continued and retain their progress, cash, earnings, purchases, and
equipment. Continuing a profiled save skips setup and restores its saved
identity.

Career level and title are derived from completed substages, never cash or
Lifestyle possessions. The configured milestones are A1 (Trainee Analyst),
A4 (Junior Analyst), all Stage A (Analyst), B2 (Investment Associate), and all
Stage B (Investment Associate). Stage B is not yet playable in this web build;
its milestones are ready for the future curriculum. Completing a milestone
shows a one-time Level Up notification for that completion.
Clearing this site's browser storage removes the save.

Stage A is included through A8. Stage B, desktop-save import, and cross-device
saves are not implemented.

## Validate and build

```sh
npm run test
npm run build
npm run preview
```

## GitHub Pages deployment

The production build uses `/valuation-game-web/` as its base path. Pushing to
the `main` branch runs the test suite, builds the site, and deploys `dist` to
GitHub Pages. In the repository's **Settings → Pages**, set the build and
deployment source to **GitHub Actions**.

## Project structure

```text
src/
  components/             React lesson, profile, question, map, calculator, and summary UI
  game/
    definitions/          A0 and A1-A8 lesson and stage content
    logic/                Question, scoring, timer, calculator, and career progression
    scenes/               Phaser scenes for future graphical gameplay
  progress/
    persistence/          Versioned localStorage game save
  systems/
    lifestyle-shop/       Lifestyle catalog/economy, React shops, Phaser driveway
  styles/                 Shared visual styling
```
