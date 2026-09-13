import Link from "next/link";
import { logout } from "@/app/login/actions";

export function NavBar({
  role,
  fullName,
}: {
  role: "student" | "admin";
  fullName: string | null;
}) {
  return (
    <header className="flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
      <div className="flex items-center gap-6">
        <Link href="/" className="text-lg font-bold text-gray-900">
          VedhaNet Academy
        </Link>
        <nav className="hidden gap-4 text-sm text-gray-600 sm:flex">
          <Link href="/dashboard" className="hover:text-gray-900">
            My courses
          </Link>
          <Link href="/courses" className="hover:text-gray-900">
            Browse
          </Link>
          {role === "admin" && (
            <Link href="/admin" className="hover:text-gray-900">
              Admin
            </Link>
          )}
        </nav>
      </div>
      <div className="flex items-center gap-3 text-sm">
        <span className="text-gray-500">{fullName ?? "Student"}</span>
        <form action={logout}>
          <button className="rounded-lg border border-gray-300 px-3 py-1.5 font-medium text-gray-700 hover:bg-gray-50">
            Log out
          </button>
        </form>
      </div>
    </header>
  );
}
