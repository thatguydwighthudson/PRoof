import { signUp } from "@/app/actions/auth";
import { SignUpForm } from "@/components/auth/auth-form";
import { AppLogo } from "@/components/brand/app-logo";

export default function SignUpPage() {
  return (
    <div>
      <AppLogo className="mb-4" height={44} priority />
      <h1 className="mb-6 text-3xl font-extrabold tracking-tight">Sign up</h1>
      <SignUpForm action={signUp} />
    </div>
  );
}
