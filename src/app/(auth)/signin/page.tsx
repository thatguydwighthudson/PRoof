import { signIn } from "@/app/actions/auth";
import { SignInForm } from "@/components/auth/auth-form";

export default function SignInPage() {
  return (
    <div>
      <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
        PRoof
      </p>
      <h1 className="mb-6 text-3xl font-extrabold tracking-tight">Sign in</h1>
      <SignInForm action={signIn} />
    </div>
  );
}
