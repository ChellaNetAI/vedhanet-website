import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { NavBar } from "@/components/NavBar";

export default async function DashboardPage() {
  const session = await getCurrentProfile();
  if (!session) redirect("/login");

  const supabase = await createClient();
  const { data: enrollments } = await supabase
    .from("enrollments")
    .select("course_id, courses(id, title, description, cover_image_url)")
    .eq("user_id", session.user.id);

  const courses = (enrollments ?? [])
    .map((e: any) => e.courses)
    .filter(Boolean);

  return (
    <main className="min-h-screen">
      <NavBar role={session.profile.role} fullName={session.profile.full_name} />

      <div className="mx-auto max-w-5xl px-6 py-10">
        <h1 className="text-2xl font-semibold text-gray-900">My courses</h1>

        {courses.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
            <p className="text-gray-600">You&apos;re not enrolled in any course yet.</p>
            <Link
              href="/courses"
              className="mt-4 inline-block rounded-lg bg-gradient-to-r from-brand to-accentpink px-4 py-2 text-sm font-semibold text-white shadow-[0_0_24px_rgba(109,91,208,0.3)] transition hover:brightness-110"
            >
              Browse courses
            </Link>
          </div>
        ) : (
          <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course: any) => (
              <Link
                key={course.id}
                href={`/courses/${course.id}`}
                className="block overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm transition hover:shadow-md"
              >
                <div className="flex h-32 items-center justify-center bg-gray-100 text-3xl">
                  🎓
                </div>
                <div className="p-4">
                  <h2 className="font-semibold text-gray-900">{course.title}</h2>
                  <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                    {course.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
