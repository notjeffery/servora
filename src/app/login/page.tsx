import AuthShell from "@/components/auth/AuthShell";
import LoginForm from "@/components/auth/LoginForm";
import { safeNext } from "@/lib/utils";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { next?: string };
}) {
  return (
    <AuthShell>
      <LoginForm next={safeNext(searchParams.next)} />
    </AuthShell>
  );
}