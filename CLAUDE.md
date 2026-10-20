# CLAUDE.md

Instructions for working on Tempo.

- Tempo is a design concept with demo data. Never add medical advice, and never claim it sends notifications or messages.
- Run `npm run check` before finishing any change. `npm run contrast` must pass for both themes and all four accents.
- Style only with `--t-*` tokens from `tokens/tokens.json`; never edit `src/styles/tokens.css` by hand.
- All interface text lives in `src/app/copy.ts`.
- Screens use components from `src/ui`. Add missing pieces there with tests.
- Gestures are shortcuts only. Every swipe must have a visible button that does the same thing (WCAG 2.5.1).
- Targets are at least 44px (`--t-size-target-min`). Status is always shown with words and an icon, never colour alone.
- Validate anything read from storage or imported files with `src/data/validate.ts` or `src/settings/settings.ts`.
- Never kill processes by name or pattern (no `pkill`, `killall`). Stop only a process you started, by its PID.
