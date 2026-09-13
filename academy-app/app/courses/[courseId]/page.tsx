import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { NavBar } from "@/components/NavBar";

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const session = await getCurrentProfile();
  if (!session) redirect("/login");

  const supabase = await createClient();

  const { data: course } = await supabase
    .from("courses")
    .select("id, title, description")
    .eq("id", courseId)
    .single();

  if (!course) notFound();

  const { data: modules } = await supabase
    .from("modules")
    .select("id, title, position, lessons(id, title, kind, is_preview, position, duration_seconds)")
    .eq("course_id", courseId)
    .order("position", { ascending: true });

  return (
    <main className="min-h-screen bg-gray-50">
      <NavBar role={session.profile.role} fullName={session.profile.full_name} />

      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-gray-900">{course.title}</h1>
        <p className="mt-1 text-gray-600">{course.description}</p>

        <div className="mt-8 space-y-6">
          {(modules ?? []).map((mod: any) => (
            <div key={mod.id} className="rounded-xl border border-gray-200 bg-white">
              <div className="border-b border-gray-100 px-5 py-3 font-semibold text-gray-900">
                {mod.title}
              </div>
              <ul className="divide-y divide-gray-100">
                {(mod.lessons ?? [])
                  .sort((a: any, b: any) => a.position - b.position)
                  .map((lesson: any) => (
                    <li key={lesson.id}>
                      <Link
                        href={`/courses/${course.id}/lessons/${lesson.id}`}
                        className="flex items-center justify-between px-5 py-3 text-sm hover:bg-gray-50"
                      >
                        <span className="flex items-center gap-2 text-gray-800">
                          <span>{lesson.kind === "short" ? "⚡" : "▶"}</span>
                          {lesson.title}
                          {lesson.is_preview && (
                            <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-xs font-medium text-emerald-700">
                              Preview
                            </span>
                          )}
                        </span>
                        {lesson.duration_seconds ? (
                          <span className="text-gray-400">
                            {Math.round(lesson.duration_seconds / 60)} min
                          </span>
                        ) : null}
                      </Link>
                    </li>
                  ))}
              </ul>
            </div>
          ))}

          {(!modules || modules.length === 0) && (
            <p className="text-gray-500">Content for this course is coming soon.</p>
          )}
        </div>
      </div>
    </main>
  );
}
