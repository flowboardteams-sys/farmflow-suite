import { createFileRoute, Link } from "@tanstack/react-router";
import { AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/subscription-expired")({ component: Expired });
function Expired() {
  return (
    <div className="min-h-screen grid place-items-center px-4">
      <div className="max-w-md rounded-lg border p-8 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-destructive" />
        <h1 className="mt-4 text-2xl font-semibold">Your subscription has expired</h1>
        <p className="mt-2 text-sm text-muted-foreground">Renew your plan to continue using HerdOS.</p>
        <Link to="/choose-plan" className="mt-6 inline-block"><Button>Choose a plan</Button></Link>
      </div>
    </div>
  );
}
