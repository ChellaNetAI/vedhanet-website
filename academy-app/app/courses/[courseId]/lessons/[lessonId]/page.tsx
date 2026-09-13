import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { NavBar } from "@/components/NavBar";
import { VideoPlayer } from "@/components/VideoPlayer";

const SIGNED_URL_TTL_SECONDS = 60 * 60; // 1 hour

export default async function LessonPage({
  params,
}: {
  params: Promise<{ courseId: string; lessonId: string }>;
}) {
  const { courseId, lessonId } = await params;
  const session = await getCurrentProfile();
  if (!session) redirect("/login");

  // Uses the signed-in user's own session, so Postgres RLS enforces that
  // this lesson is either a free preview or the user is enrolled.
  const supabase = await createClient();
  const { data: lesson } = await supabase
    .from("lessons")
    .select("id, title, kind, video_path, module_id")
    .eq("id", lessonId)
    .single();

  if (!lesson) notFound();

  const { data: documents } = await supabase
    .from("documents")
    .select("id, title, file_path")
    .eq("lesson_id", lessonId);

  const { data: progress } = await supabase
    .from("lesson_progress")
    .select("progress_seconds")
    .eq("lesson_id", lessonId)
    .eq("user_id", session.user.id)
    .maybeSingle();

  // RLS above already proved the viewer is allowed to see this lesson.
  // Storage buckets are private, so an admin (service-role) client mints a
  // short-lived signed URL instead of exposing a permanent public link.
  const admin = createAdminClient();
  const bucket = lesson.kind === "short" ? "shorts" : "videos";

  let videoUrl: string | null = null;
  if (lesson.video_path) {
    const { data } = await admin.storage
      .from(bucket)
      .createSignedUrl(lesson.video_path, SIGNED_URL_TTL_SECONDS);
    videoUrl = data?.signedUrl ?? null;
  }

  const documentLinks = await Promise.all(
    (documents ?? []).map(async (doc) => {
      const { data } = await admin.storage
        .from("documents")
        .createSignedUrl(doc.file_path, SIGNED_URL_TTL_SECONDS);
      return { ...doc, url: data?.signedUrl ?? null };
    })
  );

  return (
    <main className="min-h-screen bg-gray-50">
      <NavBar role={session.profile.role} fullName={session.profile.full_name} />

      <div className="mx-auto max-w-3xl px-6 py-10">
        <Link
          href={`/courses/${courseId}`}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          ← Back to course
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-gray-900">{lesson.title}</h1>

        <div className="mt-4">
          {videoUrl ? (
            <VideoPlayer
              lessonId={lesson.id}
              src={videoUrl}
              startAt={progress?.progress_seconds ?? 0}
            />
          ) : (
            <div className="flex h-64 items-center justify-center rounded-xl bg-gray-100 text-gray-500">
              Video is being processed — check back shortly.
            </div>
          )}
        </div>

        {documentLinks.length > 0 && (
          <div className="mt-8">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
              Downloads
            </h2>
            <ul className="mt-3 space-y-2">
              {documentLinks.map((doc) => (
                <li key={doc.id}>
                  {doc.url ? (
                    <a
                      href={doc.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-800 hover:bg-gray-50"
                    >
                      📄 {doc.title}
                    </a>
                  ) : (
                    <span className="text-sm text-gray-400">{doc.title} (unavailable)</span>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </main>
  );
}
