import { createFileRoute, Link } from "@tanstack/react-router";
import { Beef, Milk, Stethoscope, Store, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({ component: Landing });

const FEATURES = [
  { icon: Beef, title: "Animal Management", desc: "Registration, pedigree, tags, QR codes, and full lifecycle history." },
  { icon: Stethoscope, title: "Health & Breeding", desc: "Vaccinations, treatments, AI records, pregnancy tests with smart reminders." },
  { icon: Milk, title: "Milk Production", desc: "Shift-based entry, quality metrics, and production analytics." },
  { icon: Store, title: "Marketplace", desc: "Sell livestock, milk, ghee and farm products through your own storefront." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg">
            <div className="grid h-8 w-8 place-items-center rounded-md bg-primary text-primary-foreground">H</div>
            HerdOS
          </Link>
          <Link to="/auth"><Button>Sign in <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-24 text-center">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">Run your farm like software.</h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
          Animals, health, breeding, milk, inventory, finance, HR, and a public marketplace — one platform, every farm.
        </p>
        <p className="mt-4 text-sm text-muted-foreground">Farm accounts are provisioned by the Super Admin.</p>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="rounded-lg border border-border p-6">
              <f.icon className="h-8 w-8 text-primary" />
              <h3 className="mt-4 font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-border">
        <div className="mx-auto max-w-6xl px-4 py-8 text-sm text-muted-foreground text-center">
          © {new Date().getFullYear()} HerdOS. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
