import Image from "next/image";
import Link from "next/link";

export default function AuthShell({ children }: { children: React.ReactNode }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center px-4 py-10">
      <Image
        src="/images/hero.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-black/50" />
      <div className="relative w-full max-w-lg rounded-3xl bg-white p-8 shadow-2xl sm:p-10">
        <Link href="/" aria-label="SERVORA home" className="inline-block">
          <Image
            src="/brand/logo.png"
            alt="SERVORA"
            width={640}
            height={203}
            className="h-12 w-auto"
          />
        </Link>
        <div className="mt-6">{children}</div>
      </div>
    </main>
  );
}