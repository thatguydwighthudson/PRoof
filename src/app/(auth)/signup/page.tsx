import { signUp } from "@/app/actions/auth";
import { SignUpForm } from "@/components/auth/auth-form";

export default function SignUpPage() {
  return (
    <div>
      <p className="mb-1 text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">
        PRoof
      </p>
      <h1 className="mb-6 text-3xl font-extrabold tracking-tight">Sign up</h1>
      <SignUpForm action={signUp} />
    </div>
  );
}
