import Link from "next/link";
import { getCurrentProfile } from "@/lib/auth";

export default async function HomePage() {
  const session = await getCurrentProfile();

  return (
    <main className="min-h-screen">
      <header className="flex items-center justify-between px-6 py-5">
        <span className="text-lg font-bold text-gray-900">VedhaNet Academy</span>
        <nav className="flex items-center gap-3 text-sm">
          {session ? (
            <Link
              href={session.profile.role === "admin" ? "/admin" : "/dashboard"}
              className="rounded-lg bg-brand px-4 py-2 font-semibold text-white hover:bg-brand-dark"
            >
              Go to my dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="font-medium text-gray-700 hover:text-gray-900">
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-lg bg-brand px-4 py-2 font-semibold text-white hover:bg-brand-dark"
              >
                Sign up
              </Link>
            </>
          )}
        </nav>
      </header>

      <section className="mx-auto max-w-3xl px-6 py-20 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
          F5 BIG-IP Training, on demand
        </h1>
        <p className="mt-4 text-lg text-gray-600">
          Video lessons, quick shorts and downloadable notes for LTM, GTM/DNS,
          ASM/AWAF and APM — watch anytime, at your own pace.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link
            href="/signup"
            className="rounded-lg bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark"
          >
            Start learning
          </Link>
          <Link
            href="/login"
            className="rounded-lg border border-gray-300 px-6 py-3 font-semibold text-gray-700 hover:bg-gray-50"
          >
            I already have an account
          </Link>
        </div>
      </section>
    </main>
  );
}
