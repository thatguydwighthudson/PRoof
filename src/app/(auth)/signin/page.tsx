import { signIn } from "@/app/actions/auth";
import { SignInForm } from "@/components/auth/auth-form";
import { AppLogo } from "@/components/brand/app-logo";

export default function SignInPage() {
  return (
    <div>
      <div className="mb-8 flex justify-center">
        <AppLogo className="w-full max-w-sm" height={280} priority />
      </div>
      <h1 className="mb-6 text-center text-3xl font-extrabold tracking-tight">
        Sign in
      </h1>
      <SignInForm action={signIn} />
    </div>
  );
}
