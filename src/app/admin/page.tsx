import SignOutButton from "@/components/auth/SignOutButton";

export default function AdminPage() {
  return (
    <main className="mx-auto max-w-3xl space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Admin</h1>
      <SignOutButton />
    </main>
  );
}