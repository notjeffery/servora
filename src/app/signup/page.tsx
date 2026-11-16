import AuthShell from "@/components/auth/AuthShell";
import SignupForm from "@/components/auth/SignupForm";

export default function SignupPage() {
  return (
    <AuthShell>
      <SignupForm
        role="customer"
        title="Create your account"
        subtitle="Book trusted tradespeople for your next job."
      />
    </AuthShell>
  );
}