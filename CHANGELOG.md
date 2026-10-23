# Release notes

## October 23, 2026 — Ordered visual learning map

- Replaced independent tiles with four numbered, consistently placed regions: Understand, Recall, Connect & distinguish, and Explore & remember.
- Grouped meaning with its example, recall prompt with its answer, and usage distinctions with related words. Kept the requested section and narration order.
- Added a clear typography hierarchy, a distinct recall background, subtle dividers, target-word emphasis, and aligned panel boundaries. All contexts and memory aids stay visible.
- Preserved content and progress; rendering/narration checks pass for all 3,223 placements. Representative laptop fit and responsive reflow were checked. Long content can still require scrolling.

## October 23, 2026 — Wide study board

- Reordered synonym cards: Simple meaning, Meaning in use, Quick recall, Recall answer, Instructor’s usage & distinctions, Words in this family, then More contexts & other meanings. Memory hooks and word families remain visible afterward.
- Replaced the additional-context dropdown with an always-visible panel. Preserved every existing context, dictionary sense, example, definition, memory hook and content flag.
- Added responsive horizontal panels to both libraries’ learning cards, wider content areas, compact navigation, side-by-side quiz choices and explanations, and denser library/collection grids.
- Moved Learn ratings into the audio toolbar on desktop to save vertical space without overlaying the card.
- Preserved logical DOM/narration order, tap pronunciation, quiz behavior, saved sessions and progress storage.
- Regression checks cover all 3,223 cards. Browser audit covered primary routes, desktop card fit, narrow-screen reflow, and full-card narration. Long content remains scrollable rather than being clipped or reduced to unreadable text.
- Fallback branch: `checkpoint/before-wide-study-layout-2026-10-23` (accepted version before these changes).

## October 23, 2026 — Synonym Groups checkpoint

This checkpoint preserves the accepted local app, including the new instructor-based library. No deployment or cloud synchronization is enabled by this save.

### Added

- Separate Synonym Groups navigation and library: 685 meaning headings, 2,052 entries, and 137 groups of five consecutive headings.
- Source definitions, usage distinctions, page references, combined word-form labels, repeated placements, and cross-references.
- Learn, five-option recognition, meaning-and-usage practice, narration, tap-to-read, highlighting, saved sessions, and spaced reviews for the new library.
- Separate meaning-specific progress and quiz history for synonym entries.

### Preserved

- All original 39 vocabulary groups and their content.
- Existing study progress, settings, memory hooks, accessibility controls, and advanced practice modes.
- Original quizzes draw distractors from the original library; synonym quizzes use the new library and filter overlapping meanings and duplicate answer spellings.

### Validation

- Checked every synonym entry for source order, placement identity, five-family grouping, and available five-option questions in both quiz stages.
- Original question-engine, navigation, scheduling, backup, and narration regression checks pass.
- Browser checks covered both libraries, learning cards, recognition, application, and reloading a saved synonym session.

### Current limitations

- Apply uses source usage sentences where possible. Other entries use labelled meaning-in-use exercises, not a fully edited bank of realistic GRE Text Completion questions. Some words have only one suitable source context.
- Speech uses installed browser voices; actual iPhone narration still needs device testing.
- Progress remains local to the browser unless the optional authenticated server is configured. Public hosting and automatic phone–laptop synchronization remain future work.

See docs/synonym-import.md for extraction and content details. Personal progress databases, credentials, and the uploaded PDF are not included in this repository.
