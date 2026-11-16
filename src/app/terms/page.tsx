import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-3xl font-bold text-brand-navy">Terms of Service</h1>
      <p className="mt-4 text-gray-600">
        Placeholder. Replace this with your real Terms of Service before
        launch.
      </p>
      <Link href="/" className="mt-8 inline-block font-semibold text-brand-orange">
        Back to home
      </Link>
    </main>
  );
}