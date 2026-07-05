import { createFileRoute, Link } from "@tanstack/react-router";
import { MailCheck } from "lucide-react";

export const Route = createFileRoute("/verify-email")({ component: Verify });
function Verify() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 shadow-sm text-center">
        <MailCheck className="mx-auto h-12 w-12 text-primary" />
        <h1 className="mt-4 text-2xl font-semibold">Check your email</h1>
        <p className="mt-2 text-sm text-muted-foreground">We sent you a confirmation link. Click it to activate your account.</p>
        <Link to="/auth" className="mt-6 inline-block text-primary hover:underline text-sm">Back to sign in</Link>
      </div>
    </div>
  );
}
