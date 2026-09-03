# ExamForge

ExamForge is an AI-powered exam-preparation platform for browsing previous-year
question papers and generating subject-wise question predictions, important topics,
and study strategies.

## Current features

- Department, semester, and subject browsing
- Previous-year paper links and solution placeholders
- Gemini-powered predictions from curated JSON datasets
- Admin PDF upload with PDF-only validation and a 10 MB size limit
- Subject-specific PDF viewer backed by Supabase Storage
- Health and subject-discovery APIs

## Run locally

Requirements: Node.js 20 or newer and a Gemini API key.

```bash
cd server
npm install
copy .env.example .env
npm run dev
```

Set `GEMINI_API_KEY` in `server/.env`, then open
`http://localhost:5000`. The Express server serves both the API and the frontend,
so the browser uses same-origin API URLs in local and hosted environments.

For hosted papers, create the public `academic-files` Supabase Storage bucket and
set `SUPABASE_URL` in `server/.env`. See `docs/supabase-storage.md` for the bucket,
upload, and deployment procedure. The secret API key is only needed while
uploading files and must never be added to a browser file or committed to Git.

## Scripts

From the `server` directory:

- `npm start` starts the production server.
- `npm run dev` starts the server with automatic reloads.
- `npm test` runs the API and upload regression tests.
- `npm run storage:setup` creates or updates the public PDF-only bucket.
- `npm run storage:upload -- <local-pdf> <storage-path>` uploads one prepared PDF
  to the configured Supabase bucket.

## API

| Method | Endpoint | Purpose |
| --- | --- | --- |
| `GET` | `/api/health` | Deployment health check |
| `GET` | `/api/subjects` | List subjects with local datasets |
| `POST` | `/api/predict` | Generate a prediction from `{ "subject": "DBMS" }` |
| `POST` | `/api/pdf/upload` | Upload a PDF with department, semester, and subject fields |

## Project structure

```text
client/            Browser UI and admin upload page
docs/              Storage setup and operating instructions
server/
  controllers/     HTTP request handlers
  data/            Subject datasets used for predictions
  routes/          Express API routes
  services/        Dataset, PDF, and Gemini integrations
  scripts/         Controlled Supabase bucket and upload tooling
```

## Suggested next milestones

1. Expand the verified paper catalog semester by semester.
2. Add admin authentication before accepting uploads.
3. Replace placeholder paper links with stored, searchable documents.
4. Add rate limiting and caching around AI prediction requests.
