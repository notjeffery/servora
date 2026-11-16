import SignOutButton from "@/components/auth/SignOutButton";

export default function CustomerDashboard() {
  return (
    <main className="mx-auto max-w-3xl space-y-4 p-6">
      <h1 className="text-2xl font-semibold">Customer dashboard</h1>
      <SignOutButton />
    </main>
  );
}