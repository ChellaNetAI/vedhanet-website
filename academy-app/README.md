# VedhaNet Academy — student video/document portal

A Next.js + Supabase app for uploading F5 training videos, shorts and
documents and letting logged-in students watch them. This lives alongside
your existing marketing site (`../index.html`) — a good setup is:

- `www.vedhanetacademy.com` → the existing marketing site
- `learn.vedhanetacademy.com` (or `app.vedhanetacademy.com`) → this app

## What's included

- Student signup/login (email + password)
- Course → Module → Lesson structure
- Full lecture videos **and** short-form clips, uploaded straight from the
  browser into Supabase Storage (no server file-size limits)
- Documents (PDF/slides) attached to a lesson, downloadable by enrolled
  students
- Free "preview" lessons that don't require enrollment
- Video resume/progress tracking per student
- An admin area (you) to create courses, modules, lessons and uploads
- Row Level Security in Postgres so a student can only ever read lessons
  they're enrolled in (or that are marked preview) — enforced by the
  database itself, not just the UI

## 1. Create your Supabase project

1. Go to supabase.com → New project. Pick a region close to your students
   (e.g. Mumbai/Singapore for India).
2. In **Project Settings → API**, copy:
   - Project URL
   - `anon` public key
   - `service_role` key (keep this secret — server-only)
3. In the **SQL Editor**, run `supabase/schema.sql` from this repo (paste the
   whole file, click Run).
4. Go to **Storage** and create three **private** buckets (leave "Public
   bucket" unchecked):
   - `videos`
   - `shorts`
   - `documents`
5. Back in the SQL Editor, run `supabase/storage_policies.sql`.

## 2. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in the three values from step 1.

## 3. Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000, sign up a test account, then open your Supabase
dashboard → **Table Editor → profiles**, find your row, and change `role`
from `student` to `admin`. Reload the app — you'll now see an **Admin** link
in the nav bar and can create courses.

## 4. Upload your first course

1. Log in as admin → **Admin** → create a course (e.g. "F5 LTM
   Fundamentals").
2. Open the course → **Add module** (e.g. "Module 1 — LTM Basics").
3. Under the module, use **Add full video lesson** or **Add short** to
   upload a video file directly, and use **+ Attach document** on a lesson
   to add a PDF.
4. Back on the course list, click **Publish** so students can see it.

Students sign up, go to **Browse**, and click **Enroll** (currently free/
open enrollment — see "Adding payments" below to gate it).

## 5. Deploy

Easiest path: [Vercel](https://vercel.com).

1. Push this repo to GitHub (already done if you're reading this from the
   repo).
2. Import the project in Vercel, set the **root directory** to
   `academy-app`.
3. Add the same three environment variables from `.env.local`.
4. Point your `learn.vedhanetacademy.com` subdomain's DNS (CNAME) at the
   Vercel deployment, and add the domain in the Vercel project settings.

## How video access is secured

Videos and documents live in **private** Supabase Storage buckets — there
is no public URL for them. When a student opens a lesson:

1. The server queries the `lessons` table using the student's own session.
   Postgres Row Level Security only returns the row if the lesson is a free
   preview or the student has a row in `enrollments` for that course.
2. If (and only if) that query succeeds, the server mints a **signed URL**
   (expires in 1 hour) using the service-role key and hands it to the
   `<video>` tag / download link.

So even a student who guesses a file's storage path can't fetch it directly
— every request re-checks enrollment.

## Known limitations / next steps

- **Enrollment is free/self-serve** right now (`enrollments_insert_self`
  policy in `schema.sql`). To sell paid courses, wire up Razorpay: create
  the order, verify the payment webhook server-side, and only then insert
  the `enrollments` row (delete the self-serve policy once you do this).
- **Video playback** uses a plain HTML5 `<video>` tag against Supabase
  Storage. This is fine for an MVP, but for very large libraries or to get
  adaptive-bitrate streaming and analytics, migrate lesson playback to a
  dedicated video host (Mux or Bunny Stream) later — the DB schema
  (`video_path`) can just as easily hold a Mux playback ID.
- **Email confirmation**: Supabase requires email confirmation by default.
  For a faster signup flow for students, you can disable "Confirm email" in
  Supabase → Authentication → Providers → Email, or switch to phone OTP.
- **Dependencies**: `next` is pinned to `15.5.25` and `npm audit` is clean
  except for a `postcss` copy bundled *inside* Next's own build tooling
  (dev-time only, not reachable via user input). Re-run `npm audit` when
  bumping Next in the future.
