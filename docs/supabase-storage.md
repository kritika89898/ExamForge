# Supabase Storage for ExamForge

ExamForge stores only split, optimized question papers in Supabase. Original
combined source PDFs remain backed up in Google Drive, and searchable paper
metadata remains in `client/data/papers.json`.

## 1. Create the free project

1. Sign in at <https://supabase.com/dashboard>.
2. Create a Free organization and a project named `ExamForge`.
3. Choose Mumbai, or the nearest available region.
4. Save the database password privately. It is not needed by the website.

## 2. Configure the local uploader

Copy `server/.env.example` to `server/.env`, then set:

```dotenv
SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
SUPABASE_STORAGE_BUCKET=academic-files
SUPABASE_SECRET_KEY=sb_secret_YOUR_PRIVATE_KEY
```

Find the project URL in the project's **Connect** dialog. Under
**Settings > API Keys**, create a secret `sb_secret_...` key for the local
uploader. Keep it only in the local `.env`; never commit it, paste it into client
code, send it in chat, or expose it in a screenshot.

On Render, add only `SUPABASE_URL` and `SUPABASE_STORAGE_BUCKET`. The deployed
viewer does not need the secret key.

## 3. Create the PDF bucket

From the `server` directory, run:

```powershell
npm run storage:setup
```

This creates or updates the public `academic-files` bucket with a 20 MB per-file
limit and PDF-only MIME type. Public access permits viewing; anonymous uploads,
updates, and deletion remain blocked.

## 4. Upload the verified sample

From the `server` directory:

```powershell
npm run storage:upload -- "../output/pdf/BAI303_CS_MID_2025.pdf" "papers/igdtuw/btech-cseai/semester-5/2025/mid/BAI303_CS_MID_2025.pdf"
```

The uploader validates the PDF header, enforces the 20 MB limit, refuses to
overwrite an existing object by default, and prints its public URL. Use
`--upsert` only when intentionally replacing a previously verified paper.

## 5. Verify before publishing

1. Open the printed public URL and confirm that only the intended paper appears.
2. Start ExamForge locally and open the matching `paper-viewer.html?id=...` URL.
3. Confirm the viewer badge says **Supabase Storage** instead of **Local demo source**.
4. Check the title, year, exam type, page count, and download link.

Do not upload `NPTEL - Consumer Psychology`. Enrollment numbers may remain in
the question papers, as approved for this dataset.
