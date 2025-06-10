"use client";

"use client";
import { useState } from "react";
import { toast } from "sonner";
import { useAuthActions } from "@convex-dev/auth/react";

export function SignInForm() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signIn" | "signUp">("signIn");
  const [submitting, setSubmitting] = useState(false);
  const [showForgot, setShowForgot] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetting, setResetting] = useState(false);
  const [resetSent, setResetSent] = useState(false);

  return (
    <div className="w-full">
      {/* Only password and Google sign-in flows remain */}
      <form
        className="flex flex-col gap-form-field"
        onSubmit={async (e) => {
          e.preventDefault();
          setSubmitting(true);
          const formData = new FormData(e.target as HTMLFormElement);
          formData.set("flow", flow);
          try {
            await signIn("password", formData);
            toast.success(flow === "signIn" ? "Signed in!" : "Account created!");
            window.location.reload();
          } catch (error: any) {
            let toastTitle = "";
            if (error.message.includes("Invalid password")) {
              toastTitle = "Invalid password. Please try again.";
            } else {
              toastTitle =
                flow === "signIn"
                  ? "Could not sign in, did you mean to sign up?"
                  : "Could not sign up, did you mean to sign in?";
            }
            toast.error(toastTitle);
          } finally {
            setSubmitting(false);
          }
        }}
      >
        <input
          className="auth-input-field"
          type="email"
          name="email"
          placeholder="Email"
          required
        />
        <input
          className="auth-input-field"
          type="password"
          name="password"
          placeholder="Password"
          required
        />
        <button className="auth-button" type="submit" disabled={submitting}>
          {flow === "signIn" ? "Sign in" : "Sign up"}
        </button>
        <div className="text-right mt-2">
          <button
            type="button"
            className="text-xs text-primary hover:underline"
            onClick={() => setShowForgot(true)}
          >
            Forgot password?
          </button>
        </div>
        <div className="text-center text-sm text-secondary">
          <span>
            {flow === "signIn"
              ? "Don't have an account? "
              : "Already have an account? "}
          </span>
          <button
            type="button"
            className="text-primary hover:text-primary-hover hover:underline font-medium cursor-pointer"
            onClick={() => setFlow(flow === "signIn" ? "signUp" : "signIn")}
          >
            {flow === "signIn" ? "Sign up instead" : "Sign in instead"}
          </button>
        </div>
      </form>
      {showForgot && (
        <div className="mt-4 p-4 bg-gray-900 border border-gray-700 rounded-xl">
          <h3 className="text-lg font-bold text-white mb-2">Reset your password</h3>
          {resetSent ? (
            <div className="text-green-400">Check your email for a reset link.</div>
          ) : (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setResetting(true);
                try {
                  // TODO: Call Convex mutation to send reset email
                  setResetSent(true);
                } catch (err) {
                  toast.error("Failed to send reset email");
                } finally {
                  setResetting(false);
                }
              }}
              className="flex flex-col gap-2"
            >
              <input
                className="auth-input-field"
                type="email"
                placeholder="Enter your email"
                value={resetEmail}
                onChange={e => setResetEmail(e.target.value)}
                required
              />
              <button className="auth-button" type="submit" disabled={resetting}>
                {resetting ? "Sending..." : "Send reset link"}
              </button>
              <button type="button" className="text-xs text-gray-400 mt-2" onClick={() => setShowForgot(false)}>
                Cancel
              </button>
            </form>
          )}
        </div>
      )}
      <div className="flex items-center justify-center my-3">
        <hr className="my-4 grow border-gray-200" />
        <span className="mx-4 text-secondary">or</span>
        <hr className="my-4 grow border-gray-200" />
      </div>
      <button
        type="button"
        onClick={() => signIn("google")}
        className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white text-gray-900 font-semibold border border-gray-300 shadow hover:bg-gray-100 transition mb-2"
        style={{ fontSize: 16 }}
      >
        <svg width="20" height="20" viewBox="0 0 48 48" className="mr-2" style={{ display: 'inline' }}><g><path fill="#4285F4" d="M24 9.5c3.54 0 6.7 1.22 9.19 3.23l6.85-6.85C35.64 2.36 30.18 0 24 0 14.82 0 6.71 5.48 2.69 13.44l7.98 6.2C12.2 13.16 17.62 9.5 24 9.5z"/><path fill="#34A853" d="M46.1 24.55c0-1.64-.15-3.22-.42-4.74H24v9.01h12.42c-.54 2.9-2.18 5.36-4.65 7.02l7.18 5.59C43.98 37.13 46.1 31.3 46.1 24.55z"/><path fill="#FBBC05" d="M10.67 28.09c-1.01-2.99-1.01-6.19 0-9.18l-7.98-6.2C.64 16.36 0 20.09 0 24c0 3.91.64 7.64 2.69 11.29l7.98-6.2z"/><path fill="#EA4335" d="M24 48c6.18 0 11.64-2.04 15.53-5.54l-7.18-5.59c-2.01 1.35-4.59 2.15-8.35 2.15-6.38 0-11.8-3.66-13.33-8.91l-7.98 6.2C6.71 42.52 14.82 48 24 48z"/><path fill="none" d="M0 0h48v48H0z"/></g></svg>
        Sign in with Google
      </button>
    </div>
  );
}
