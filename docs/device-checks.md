# Device checks

Before a hosted release, test on actual Safari/iPhone, Chrome/Android, tablet and desktop browsers:

- Navigation, scrolling, word search and all three study stages.
- Narration of the complete card, all question options, multi-blank prompts, and post-answer explanations. Hidden answers must remain hidden until answered/revealed.
- Word highlighting where boundaries are available; sentence fallback and auto-scroll otherwise.
- Continuous listening advances naturally; pause/stop/reload retain playlist position. Screen-lock/background playback is not promised by the browser speech system.
- Browser progress survives reopening. Backup/restore and reversible reset work.
- Timed answers/marks persist across reload; the deadline continues while away.
- If a trusted HTTPS progress service is configured, test two-device saves and stale-write rejection with separate browser profiles.

The current repository has no live public hosting or anonymous cross-device identity service.
