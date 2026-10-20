# Decisions

## T-01: Reuse Steady's data layer, rebuild the interface

Tempo copies Steady's types, validation, storage, schedule logic and reducer, which are already tested. Only the interface, tokens and copy are new. Both apps can evolve separately.

## T-02: Dark-first, with four accents

Younger users often keep phones in dark mode. "Auto" follows the device. Four accents (tangerine, violet, mint, sky) let people make it theirs. Each accent has separate light and dark values, and every pair is checked by `npm run contrast` (118 pairs).

## T-03: 44px targets and 16px body text

The audience has typical dexterity and eyesight, so Tempo uses Apple's 44px minimum and 16px body text, denser than Steady but still above WCAG 2.2's 24px target minimum. A text size setting goes up to 130%.

## T-04: Swipe to log, but never only swipe

Swiping a row right logs a dose, which is fast one-handed. The same row always has a visible **Log** button, so keyboard, switch and screen reader users never need the gesture (WCAG 2.5.1). Mouse drags do not trigger it, and vertical scrolling is never captured.

## T-05: Quick add instead of a wizard

People who type fast prefer one field to six screens. The parser in `src/data/quickAdd.ts` reads names, strengths, amounts, units, times, frequency and food rules, shows what it understood as chips, and fills the normal form, which stays fully editable.

## T-06: Command menu

⌘K / Ctrl+K opens a searchable menu to jump to any screen or med, log due doses, add things, or change the theme and accent. It is a combobox with a listbox and works entirely by keyboard.

## T-07: Streaks without guilt

Streaks, the week strip and the heatmap motivate without nagging. An unfinished today never breaks a streak, and the copy never scolds for missed doses.

## T-08: Honest sharing and data portability

The buddy check-in drafts a message the person edits and shares themselves; Tempo never says it was sent. Data stays in the browser, with JSON export and validated import for backups and moving devices.
