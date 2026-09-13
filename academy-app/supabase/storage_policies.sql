-- Run this AFTER creating three PRIVATE storage buckets in the Supabase
-- dashboard (Storage -> New bucket, uncheck "Public bucket"):
--   videos     (full lesson recordings)
--   shorts     (short-form clips)
--   documents  (PDFs / slides / notes)
--
-- Files are never served directly from a public URL. The app always
-- generates a short-lived signed URL server-side after checking the
-- viewer is enrolled (see app/api/media/[bucket]/[...path]/route.ts).

-- Admins can upload/manage files in all three buckets.
create policy "media_admin_write" on storage.objects
  for all
  using (bucket_id in ('videos', 'shorts', 'documents') and public.is_admin())
  with check (bucket_id in ('videos', 'shorts', 'documents') and public.is_admin());

-- No public/select policy is defined for authenticated users on purpose:
-- reads only ever happen through the service-role key on the server,
-- inside app/api/media, which independently checks enrollment via RLS
-- on the lessons/documents tables before minting a signed URL.
