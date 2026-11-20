import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function SiteHeader() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pill =
    "shrink-0 whitespace-nowrap rounded-full border-2 border-brand-orange px-3 py-1.5 text-sm text-brand-orange transition-colors duration-200 hover:bg-brand-orange hover:text-white sm:px-4 sm:py-2";

  return (
    <header className="sticky top-0 z-20 border-b bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
        <Link
          href="/"
          aria-label="SERVORA home"
          className="flex shrink-0 items-center"
        >
          <Image
            src="/brand/logo.png"
            alt="SERVORA"
            width={640}
            height={203}
            priority
            className="h-9 w-auto sm:h-11"
          />
        </Link>

        <nav className="flex items-center gap-3 text-sm font-medium sm:gap-6">
          <Link href="/services" className="hidden hover:underline sm:inline">
            Services
          </Link>

          {user ? (
            <Link href="/dashboard" className={pill}>
              <span className="sm:hidden">Dashboard</span>
              <span className="hidden sm:inline">My dashboard</span>
            </Link>
          ) : (
            <>
              <Link href="/login" className="whitespace-nowrap hover:underline">
                <span className="sm:hidden">Log in</span>
                <span className="hidden sm:inline">Sign up / Log in</span>
              </Link>
              <Link href="/pro/signup" className={pill}>
                Become a Pro
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}