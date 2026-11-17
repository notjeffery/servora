import AuthShell from "@/components/auth/AuthShell";
import SignupForm from "@/components/auth/SignupForm";
import { safeNext } from "@/lib/utils";

export default function SignupPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  return (
    <AuthShell>
      <SignupForm
        role="customer"
        title="Create your account"
        subtitle="Book trusted tradespeople for your next job."
        redirectTo={safeNext(searchParams.next)}
      />
    </AuthShell>
  );
}