# Capstone Console

A private, mobile-first research dashboard and knowledge base. **The repository is the
database** — every save is a Markdown or JSON file committed straight back into this repo
through the GitHub API. No Postgres, no Supabase, no ORM.

## What's inside

| Route         | File it edits              | What it does                                                  |
| ------------- | -------------------------- | ------------------------------------------------------------- |
| `/`           | `data/timeline.json`       | Lifecycle tracker; tap a phase to advance it, plus live stats  |
| `/insights`   | `data/insights.json`       | **AI-managed** visual briefing, read-only in the app (below)   |
| `/problem`    | `data/problem_statement.md`| Markdown + LaTeX editor with preview and **Export context**    |
| `/articles`   | `data/articles.json`       | Source manager: URL, status, usefulness 0–10, tags, notes      |
| `/topics`     | `data/topics.json`         | Knowledge gaps: understand / learning / don't understand       |
| `/scratchpad` | `data/ai_notes.md`         | One-button clipboard dump for AI output                        |

## AI Insights board

`/insights` is owned by your AI assistant. It reads your articles, topics, scratchpad and
problem statement (plus web research when you ask) and writes the key points into
`data/insights.json`. The page then renders them as stat tiles, takeaway cards, process
pipelines, comparison tables, timelines, bar charts, glossaries, callouts and next steps.

- **Instructions for Cursor:** `.cursor/rules/ai-insights.mdc` (workflow, writing rules, every
  block type with examples). Cursor loads it automatically when the task is about insights, or
  you can attach it with `@ai-insights`.
- **Editor validation:** `data/insights.schema.json` gives autocomplete and error squiggles.
- **Check:** `npm run insights:check` validates the file with the same parser the app uses.
  Invalid blocks are skipped and listed in a warning panel on the page, so they never crash it.

Example prompts in Cursor:

> Refresh the insights board from my latest scratchpad entries and articles.
>
> Research semi-global matching and add what matters to the insights board, citing URLs.
>
> Mark the next steps I've finished as done and prune anything stale from insights.

## Security model

- **9-dot pattern lock.** `src/middleware.ts` gates every route. Unauthenticated requests
  redirect to `/login`, which renders a touch-friendly Android-style pattern grid.
- The drawn pattern is checked **server-side** against `SECRET_PATTERN` in a Server Action,
  with constant-time comparison and rate limiting (8 attempts per 5 minutes per IP).
- On success the server sets an **HTTP-only, SameSite=Lax, Secure** cookie holding an
  HMAC-SHA256 signed token. Nothing sensitive ever reaches the client.
- `GITHUB_TOKEN` is read **only** inside server modules (`src/lib/storage.ts` is marked
  `server-only`). It is never bundled into client JavaScript.
- Server Actions are public POST endpoints by design, so every mutating action re-verifies
  the session itself rather than trusting middleware alone.

## Storage drivers

The app picks a driver automatically:

- **No `GITHUB_TOKEN`** → writes to `./data` on your local disk. Ideal for `npm run dev`.
- **`GITHUB_TOKEN` + owner/repo set** → commits through `@octokit/rest`. Required in
  production, because serverless filesystems are read-only.

The header shows a `local` or `git` badge so you always know where your data is going.

Missing files are never an error: the UI shows an empty state and the first save creates
the file.

---

# Deployment plan

Run these from the project directory.

### 1. Install and configure

```bash
npm install
cp .env.example .env.local
```

Open `.env.local` and set:

- `SECRET_PATTERN` — your unlock pattern. Dots are numbered `0 1 2 / 3 4 5 / 6 7 8`,
  minimum 4 dots. The pre-filled `0-3-6-7-8` draws an "L".
- `AUTH_SECRET` — generate one:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Leave `GITHUB_TOKEN` empty for now so local edits write to `./data`.

### 2. Run locally

```bash
npm run dev
```

Open http://localhost:3000, draw your pattern, and you're in.

### 3. Push to GitHub

```bash
git add -A
git commit -m "feat: capstone console"
gh repo create Capstone --private --source=. --remote=origin --push
```

Already have a remote? Use `git push -u origin main` instead.

> The repo **must be private** — `data/` holds your research notes in plain text.

### 4. Create the fine-grained PAT

GitHub → Settings → Developer settings → Personal access tokens → **Fine-grained tokens** →
Generate new token:

- **Repository access:** Only select repositories → `Capstone`
- **Permissions:** Repository permissions → **Contents: Read and write** (nothing else)
- Copy the token — it is shown once.

### 5. Deploy to Vercel

```bash
npm i -g vercel
vercel link
vercel env add SECRET_PATTERN production
vercel env add AUTH_SECRET production
vercel env add GITHUB_TOKEN production
vercel env add GITHUB_OWNER production
vercel env add GITHUB_REPO production
vercel env add GITHUB_BRANCH production
vercel --prod
```

`GITHUB_OWNER` is your username, `GITHUB_REPO` is `Capstone`, `GITHUB_BRANCH` is `main`.

### 6. Pull your data back down

Saves made in the deployed app are commits, so:

```bash
git pull
```

### Handy commands

```bash
npm run build      # production build
npm run start      # serve the production build
npm run typecheck  # tsc --noEmit
npm run insights:check  # validate data/insights.json
```
