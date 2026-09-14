import Link from "next/link";
import { logout } from "@/app/login/actions";
import { Logo } from "@/components/Logo";

export function NavBar({
  role,
  fullName,
}: {
  role: "student" | "admin";
  fullName: string | null;
}) {
  return (
    <header className="sticky top-0 z-50 flex items-center justify-between border-b border-[rgba(109,91,208,0.18)] bg-white/75 px-6 py-4 backdrop-blur-md">
      <div className="flex items-center gap-6">
        <Link href="/" className="flex items-center gap-2.5 text-lg font-bold text-gray-900">
          <Logo size={32} />
          VedhaNet Academy
        </Link>
        <nav className="hidden gap-4 text-sm font-medium text-gray-600 sm:flex">
          <Link href="/dashboard" className="hover:text-brand">
            My courses
          </Link>
          <Link href="/courses" className="hover:text-brand">
            Browse
          </Link>
          {role === "admin" && (
            <Link href="/admin" className="hover:text-brand">
              Admin
            </Link>
          )}
        </nav>
      </div>
      <div className="flex items-center gap-3 text-sm">
        <span className="text-gray-500">{fullName ?? "Student"}</span>
        <form action={logout}>
          <button className="rounded-lg border border-[rgba(109,91,208,0.18)] bg-white px-3 py-1.5 font-medium text-gray-700 hover:border-brand hover:text-brand">
            Log out
          </button>
        </form>
      </div>
    </header>
  );
}
