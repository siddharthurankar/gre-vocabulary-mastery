# Validation scope

The question engine has been checked across all 1,171 placements and both recognition/application stages for option counts, marked correct answers, rotating variants, content quarantine, review dates, delayed retention, retries and backup validation. Navigation checks cover four consecutive questions per placement/stage, queue-preserving word jumps and preference-preserving reset.

Additional local checks covered Sentence Equivalence and multi-blank all-or-nothing scoring, 40 look-alike drill questions, larger set sizes/deadlines, weakest-first ordering, idempotent grading and mistake-journal retries. Group 39 has 21 supplied-meaning cards and 64 contexts; the prior 38 groups remain unchanged.

Browser checks verified persisted exam answers/marks/timers, three-blank scoring, saved mistake details, continuous natural card advance, word highlighting, playlist position after reload, and local authenticated saving. A 390-pixel layout check found no horizontal overflow in multi-blank controls.

These checks validate structure and behavior, not universal semantic uniqueness. Editorial notes are available in `web/editorial-review.json`. Actual iPhone voice behavior, live public hosting, and anonymous cross-device cloud sync have not been verified or configured.

## Learn navigation and full-card display

Learn renders the complete main card and rating controls immediately, including for older saved sessions. Changing groups saves each group/part independently and resumes unfinished work. Browser checks verified ratings in Groups 1 and 39, return to each saved second word, and persistence after reload. Responsive checks found no horizontal overflow at phone width. Full-content narration uses the same speech fields and expands additional contexts when reading. Actual iPhone Safari narration and cross-device synchronization still require device verification and a reachable authenticated HTTPS server.
