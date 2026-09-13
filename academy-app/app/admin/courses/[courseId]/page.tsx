import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { NavBar } from "@/components/NavBar";
import { FileUploadField } from "@/components/FileUploadField";
import { createModule, createLesson, createDocument } from "@/app/admin/actions";

export default async function ManageCoursePage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const session = await requireAdmin();
  const admin = createAdminClient();

  const { data: course } = await admin
    .from("courses")
    .select("id, title, description")
    .eq("id", courseId)
    .single();

  if (!course) notFound();

  const { data: modules } = await admin
    .from("modules")
    .select("id, title, position, lessons(id, title, kind, is_preview, position, documents(id, title))")
    .eq("course_id", courseId)
    .order("position", { ascending: true });

  return (
    <main className="min-h-screen bg-gray-50">
      <NavBar role={session.profile.role} fullName={session.profile.full_name} />

      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-gray-900">{course.title}</h1>
        <p className="text-sm text-gray-500">Manage modules, lessons, shorts and documents.</p>

        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="font-semibold text-gray-900">Add module</h2>
          <form action={createModule} className="mt-3 flex gap-3">
            <input type="hidden" name="course_id" value={course.id} />
            <input
              name="title"
              placeholder="e.g. Module 1 — LTM Basics"
              required
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <input
              name="position"
              type="number"
              defaultValue={(modules?.length ?? 0) + 1}
              className="w-20 rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <button className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark">
              Add
            </button>
          </form>
        </div>

        <div className="mt-8 space-y-8">
          {(modules ?? []).map((mod: any) => (
            <div key={mod.id} className="rounded-xl border border-gray-200 bg-white">
              <div className="border-b border-gray-100 px-5 py-3 font-semibold text-gray-900">
                {mod.title}
              </div>

              <ul className="divide-y divide-gray-100">
                {(mod.lessons ?? [])
                  .sort((a: any, b: any) => a.position - b.position)
                  .map((lesson: any) => (
                    <li key={lesson.id} className="px-5 py-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-gray-800">
                        <span>{lesson.kind === "short" ? "⚡" : "▶"}</span>
                        {lesson.title}
                        {lesson.is_preview && (
                          <span className="rounded bg-emerald-50 px-1.5 py-0.5 text-xs text-emerald-700">
                            Preview
                          </span>
                        )}
                      </div>

                      {lesson.documents?.length > 0 && (
                        <ul className="mt-1 text-xs text-gray-500">
                          {lesson.documents.map((d: any) => (
                            <li key={d.id}>📄 {d.title}</li>
                          ))}
                        </ul>
                      )}

                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs font-medium text-brand">
                          + Attach document
                        </summary>
                        <form action={createDocument} className="mt-2 space-y-2 rounded-lg bg-gray-50 p-3">
                          <input type="hidden" name="course_id" value={course.id} />
                          <input type="hidden" name="lesson_id" value={lesson.id} />
                          <input
                            name="title"
                            placeholder="Document title (e.g. Lesson slides)"
                            required
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                          />
                          <FileUploadField
                            bucket="documents"
                            label="PDF / slides"
                            accept=".pdf,.doc,.docx,.ppt,.pptx"
                            hiddenFieldName="file_path"
                          />
                          <button className="rounded-lg bg-gray-800 px-3 py-1.5 text-xs font-semibold text-white">
                            Attach
                          </button>
                        </form>
                      </details>
                    </li>
                  ))}
              </ul>

              <div className="grid grid-cols-1 gap-4 border-t border-gray-100 p-5 sm:grid-cols-2">
                <form action={createLesson} className="space-y-2">
                  <p className="text-xs font-semibold uppercase text-gray-500">Add full video lesson</p>
                  <input type="hidden" name="course_id" value={course.id} />
                  <input type="hidden" name="module_id" value={mod.id} />
                  <input type="hidden" name="kind" value="video" />
                  <input
                    name="title"
                    placeholder="Lesson title"
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                  <FileUploadField
                    bucket="videos"
                    label="Video file"
                    accept="video/*"
                    hiddenFieldName="video_path"
                  />
                  <label className="flex items-center gap-2 text-xs text-gray-600">
                    <input type="checkbox" name="is_preview" /> Free preview (no enrollment needed)
                  </label>
                  <button className="w-full rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-brand-dark">
                    Add lesson
                  </button>
                </form>

                <form action={createLesson} className="space-y-2">
                  <p className="text-xs font-semibold uppercase text-gray-500">Add short</p>
                  <input type="hidden" name="course_id" value={course.id} />
                  <input type="hidden" name="module_id" value={mod.id} />
                  <input type="hidden" name="kind" value="short" />
                  <input
                    name="title"
                    placeholder="Short title"
                    required
                    className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  />
                  <FileUploadField
                    bucket="shorts"
                    label="Short video file"
                    accept="video/*"
                    hiddenFieldName="video_path"
                  />
                  <label className="flex items-center gap-2 text-xs text-gray-600">
                    <input type="checkbox" name="is_preview" /> Free preview (no enrollment needed)
                  </label>
                  <button className="w-full rounded-lg bg-gray-800 px-3 py-2 text-sm font-semibold text-white">
                    Add short
                  </button>
                </form>
              </div>
            </div>
          ))}

          {(!modules || modules.length === 0) && (
            <p className="text-gray-500">Add a module above to start uploading lessons.</p>
          )}
        </div>
      </div>
    </main>
  );
}
