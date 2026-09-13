import Link from "next/link";
import { requireAdmin } from "@/lib/auth";
import { createAdminClient } from "@/lib/supabase/server";
import { NavBar } from "@/components/NavBar";
import { createCourse, togglePublish } from "./actions";

export default async function AdminPage() {
  const session = await requireAdmin();

  const admin = createAdminClient();
  const { data: courses } = await admin
    .from("courses")
    .select("id, title, description, is_published")
    .order("created_at", { ascending: false });

  return (
    <main className="min-h-screen bg-gray-50">
      <NavBar role={session.profile.role} fullName={session.profile.full_name} />

      <div className="mx-auto max-w-3xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-gray-900">Admin · Courses</h1>

        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="font-semibold text-gray-900">New course</h2>
          <form action={createCourse} className="mt-3 space-y-3">
            <input
              name="title"
              placeholder="e.g. F5 LTM Fundamentals"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <textarea
              name="description"
              placeholder="Short description shown to students"
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <button
              type="submit"
              className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
            >
              Create course
            </button>
          </form>
        </div>

        <div className="mt-8 space-y-3">
          {(courses ?? []).map((course) => (
            <div
              key={course.id}
              className="flex items-center justify-between rounded-xl border border-gray-200 bg-white px-5 py-4"
            >
              <div>
                <Link
                  href={`/admin/courses/${course.id}`}
                  className="font-semibold text-gray-900 hover:underline"
                >
                  {course.title}
                </Link>
                <p className="text-sm text-gray-500">{course.description}</p>
              </div>
              <form
                action={togglePublish.bind(null, course.id, !course.is_published)}
              >
                <button
                  type="submit"
                  className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                    course.is_published
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {course.is_published ? "Published" : "Draft — publish"}
                </button>
              </form>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
