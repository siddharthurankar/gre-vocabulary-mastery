# Validation scope

The question engine has been checked across all 1,171 placements and both recognition/application stages for option counts, marked correct answers, rotating variants, content quarantine, review dates, delayed retention, retries and backup validation. Navigation checks cover four consecutive questions per placement/stage, queue-preserving word jumps and preference-preserving reset.

Additional local checks covered Sentence Equivalence and multi-blank all-or-nothing scoring, 40 look-alike drill questions, larger set sizes/deadlines, weakest-first ordering, idempotent grading and mistake-journal retries. Group 39 has 21 supplied-meaning cards and 64 contexts; the prior 38 groups remain unchanged.

Browser checks verified persisted exam answers/marks/timers, three-blank scoring, saved mistake details, continuous natural card advance, word highlighting, playlist position after reload, and local authenticated saving. A 390-pixel layout check found no horizontal overflow in multi-blank controls.

These checks validate structure and behavior, not universal semantic uniqueness. Editorial notes are available in `web/editorial-review.json`. Actual iPhone voice behavior, live public hosting, and anonymous cross-device cloud sync have not been verified or configured.

## Learn navigation and full-card display

Learn renders the complete main card and rating controls immediately, including for older saved sessions. Changing groups saves each group/part independently and resumes unfinished work. Browser checks verified ratings in Groups 1 and 39, return to each saved second word, and persistence after reload. Responsive checks found no horizontal overflow at phone width. Full-content narration uses the same speech fields and expands additional contexts when reading. Actual iPhone Safari narration and cross-device synchronization still require device verification and a reachable authenticated HTTPS server.

## Tap-to-read and answer explanations

Words in learning cards, question text, choices, and explanations can be tapped for isolated pronunciation. Sentence speaker controls offer complete-line playback; single-word headings support keyboard activation. Choice letter buttons remain the grading controls, so pronunciation does not submit an answer. Selected playback cancels current speech and pauses continuous listening rather than advancing its playlist. Main Read in Parts 2 and 3 narrates only the revealed explanation; before answering it explains how to use individual pronunciation. Explanation headings, meanings, clues, memory aids, and comparison cards retain speech markup and synchronized highlighting. Narration regression checks cover explanation scoping, unrevealed answers, token duplication, and isolated playback without changing session position.
