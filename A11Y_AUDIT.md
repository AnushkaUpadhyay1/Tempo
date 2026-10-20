# Accessibility audit — Tempo 1.0.0

Date: 2026-10-21. Automated checks catch many problems but do not prove WCAG 2.2 AA conformance.

## Automated

| Check                                                                                                               | Result                                                           |
| ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| Colour contrast, 2 themes × 4 accents (`npm run contrast`)                                                          | 118 of 118 pairs pass AA                                         |
| axe-core via vitest-axe, 8 scans (Sheet, TabBar, command menu, Today, Meds list, med form, appointment detail, You) | 0 violations (`color-contrast` rule off in jsdom; covered above) |
| ESLint jsx-a11y strict                                                                                              | 0 errors, 0 warnings                                             |
| Vitest + Testing Library                                                                                            | 82 of 82 tests pass in 10 files                                  |

Tests cover keyboard use of chips, the segmented control (arrow keys and roving focus), switches, sheets (focus on the safe choice, Escape, focus return), the command menu (combobox, arrow keys, Enter), swipe with a button alternative, focus moving to new headings, live announcements, and settings applying to the whole page.

## Scripted browser checks (headless Chrome, production build)

- 54 page loads: 9 routes × light and dark × 320px (130% text), 390px and 1280px. No console errors and no horizontal scrolling.
- Touch targets: nothing under 44px except card title links, whose click area is stretched over the whole card.
- Offline: after one visit, Today, the med form, Calendar and You load with the network off, with data intact.

## Fixed during the build

1. Semicolons in calendar exports were not escaped (found by lint and a test).
2. The command menu used list elements with interactive roles (jsx-a11y). Rebuilt with neutral containers.
3. The sheet's backdrop click handler was on a non-interactive element (jsx-a11y). Moved to a native listener; Escape and Close cover keyboard users.
4. Quick add read "omega 3 capsule" as three capsules (test). A number before a singular unit now stays in the name.
5. Fast swipes could be missed because the distance was read from stale state. It is now read from a ref.
6. Importing backups failed where `File.text()` is missing. Added a FileReader fallback.

## Limitations

- Text size tops out at 130%; browser zoom still works beyond it.
- Dates and exact times use native inputs, which vary between browsers.
- Haptics, sharing and clipboard depend on browser support and fail quietly.
- Not yet tested with VoiceOver, TalkBack, NVDA, Windows High Contrast, real devices or real users.
