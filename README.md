# GRE Vocabulary Mastery

A browser-based GRE vocabulary study app with learning cards, recognition quizzes, sentence practice, read-along audio, and spaced repetition.

**Current status:** source repository with a working local app. No public website, Netlify deployment, or Supabase integration is configured.

## Features

- 39 groups, 1,171 word placements, and 1,149 unique words. Original group order is preserved.
- Three study stages: detailed learning cards, five-option recognition quizzes, and contextual sentence questions. Every stage can be opened directly.
- Multiple authored contexts and explicit intended meanings, including both senses of *sanction*. Word lookup, previous/next navigation, and a group index.
- Full-card narration, sentence highlighting, word highlighting when the voice provides boundary events, and auto-scroll. Continuous listening playlists retain their position.
- Spaced reviews, difficult-word practice, local progress persistence, JSON backup/restore, and reversible statistics reset.
- Timed exam practice, 30/60/100-question final reviews, 30 Sentence Equivalence items, 18 multi-blank Text Completion items, look-alike drills, and a mistake journal.
- Optional local authenticated progress server with password hashing and revision checks. This is separate from the planned public multi-user cloud service.

## Run locally

Requires Python 3. No Python packages or frontend build step are needed.

```sh
git clone https://github.com/siddharthurankar/gre-vocabulary-mastery.git
cd gre-vocabulary-mastery
python3 start.py
```

Open **http://127.0.0.1:8770**. Keep the terminal open while studying. On macOS, you can also open `Start GRE Vocabulary.command`. If another copy is already using port 8770, use that copy or choose a different port:

```sh
python3 tools/serve.py --preview --port 8780
```

Browser progress belongs to the browser and address used. Closing the tab does not erase it. Clearing browser storage, private browsing, or using a different address/browser can lose access to that local progress; use Settings → Export backup. The existing working app retains its storage key so removing the preview label does not reset progress.

## Project layout

```text
web/       Browser app, authored question banks, vocabulary and editorial notes
tools/     Optional Python local/authenticated server
tests/     Question-engine, scheduling and navigation regression checks
docs/      Architecture, device checks and validation scope
licenses/  Third-party dictionary license
start.py   Local launcher
```

## Verification

Requires Node.js 20 or newer, with no npm packages to install:

```sh
npm test
```

See [validation notes](docs/validation.md) for what has and has not been tested.

## Devices and synchronization

The interface is responsive. Installed browser voices and their word-boundary support vary. On iPhone Safari, keep the screen unlocked and the page foreground for continuous listening. Actual phone narration and cross-device synchronization still require device testing and a trusted HTTPS service.

The optional Python server supports a single private login and authenticated progress storage. It defaults to loopback, stores its database outside the repository, and requires HTTPS for a network-facing listener. This repository does not contain credentials, personal study history, session databases, uploaded workbooks, or deployment configuration.

Anonymous multi-user cloud progress, device pairing/recovery, and Netlify/Supabase deployment are future work. The GregMat-inspired daily planner is a proposal, not an implemented feature.

## Content

Practice questions and memory aids are authored study material, not official ETS questions. Dynamic practice rotates a finite bank of contexts/options; no live AI service is called. Editorial review and synonym filtering reduce ambiguity but cannot guarantee every generated distractor combination is uniquely defensible. Flag questionable content in the app.

Definitions are informed by Princeton WordNet. See [third-party notices](THIRD_PARTY_NOTICES.md) and the included [WordNet license](licenses/WORDNET.txt). No project-wide reuse license has been selected for original code/content.
