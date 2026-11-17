import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";

export default async function SiteHeader() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pill =
    "rounded-full border-2 border-brand-orange px-4 py-2 text-brand-orange transition-colors duration-200 hover:bg-brand-orange hover:text-white";

  return (
    <header className="sticky top-0 z-20 border-b bg-white/90 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <Link href="/" aria-label="SERVORA home" className="flex items-center">
          <Image
            src="/brand/logo.png"
            alt="SERVORA"
            width={640}
            height={203}
            priority
            className="h-11 w-auto"
          />
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium sm:gap-6">
          <Link href="/services" className="hidden hover:underline sm:inline">
            Services
          </Link>
          {user ? (
            <Link href="/dashboard" className={pill}>
              My dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="hover:underline">
                Sign up / Log in
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