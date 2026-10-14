# Architecture

The app uses browser-native HTML/CSS and JavaScript modules, with JSON content loaded by relative URL. `app.mjs` handles the original three-stage study experience and local persistence; `engine.mjs` handles reviews, quizzes, retries and backups. `lab.mjs` and `lab-engine.mjs` implement advanced practice tools. Their internal names and the existing browser-storage key are retained to preserve compatibility.

`data.json` contains vocabulary placements with shared canonical word IDs, authored contexts, per-context meanings, source provenance, and dictionary senses. Group 39 has separate question namespaces so variant history/flags do not collide with earlier placements. Completion is tracked by group placement; retention is tracked by canonical word.

The server serves `web/` and optionally stores one private user’s progress in SQLite. Its API has an origin check, hashed passwords, HttpOnly/SameSite cookies, and optimistic revision checking. Local preview allows the app shell on loopback without login; progress APIs still require authentication. Network listeners require TLS and cannot use preview mode.

Public multi-user cloud saving is not configured. Moving to Netlify/Supabase requires replacing the Python progress service and designing per-visitor identity, ownership rules, device pairing and conflict handling. No hosting workflows or cloud resources are created by this repository.
