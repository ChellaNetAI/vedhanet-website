import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { NavBar } from "@/components/NavBar";
import { enroll } from "./actions";

export default async function BrowseCoursesPage() {
  const session = await getCurrentProfile();
  if (!session) redirect("/login");

  const supabase = await createClient();
  const { data: courses } = await supabase
    .from("courses")
    .select("id, title, description")
    .eq("is_published", true)
    .order("created_at", { ascending: false });

  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("course_id")
    .eq("user_id", session.user.id);

  const enrolledIds = new Set((enrollments ?? []).map((e) => e.course_id));

  return (
    <main className="min-h-screen bg-gray-50">
      <NavBar role={session.profile.role} fullName={session.profile.full_name} />

      <div className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-gray-900">Browse courses</h1>

        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {(courses ?? []).map((course) => (
            <div
              key={course.id}
              className="flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm"
            >
              <div className="flex h-32 items-center justify-center bg-gray-100 text-3xl">
                🎓
              </div>
              <div className="flex flex-1 flex-col p-4">
                <h2 className="font-semibold text-gray-900">{course.title}</h2>
                <p className="mt-1 flex-1 text-sm text-gray-500">{course.description}</p>
                {enrolledIds.has(course.id) ? (
                  <a
                    href={`/courses/${course.id}`}
                    className="mt-4 rounded-lg bg-gray-100 px-3 py-2 text-center text-sm font-semibold text-gray-700"
                  >
                    Continue learning
                  </a>
                ) : (
                  <form action={enroll} className="mt-4">
                    <input type="hidden" name="course_id" value={course.id} />
                    <button
                      type="submit"
                      className="w-full rounded-lg bg-brand px-3 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
                    >
                      Enroll
                    </button>
                  </form>
                )}
              </div>
            </div>
          ))}

          {(!courses || courses.length === 0) && (
            <p className="text-gray-500">No courses published yet — check back soon.</p>
          )}
        </div>
      </div>
    </main>
  );
}
