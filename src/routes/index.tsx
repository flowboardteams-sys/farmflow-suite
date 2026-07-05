import { createFileRoute, Link } from "@tanstack/react-router";
import { Beef, Milk, Stethoscope, Store, ArrowRight, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({ component: Landing });

const FEATURES = [
  { icon: Beef, title: "Animal Management", desc: "Registration, pedigree, tags, QR codes, and full lifecycle history." },
  { icon: Stethoscope, title: "Health & Breeding", desc: "Vaccinations, treatments, AI records, pregnancy tests with smart reminders." },
  { icon: Milk, title: "Milk Production", desc: "Shift-based entry, quality metrics, and production analytics." },
  { icon: Store, title: "Marketplace", desc: "Sell livestock, milk, ghee and farm products through your own storefront." },
];

const PLANS = [
  { name: "Basic", price: 29, features: ["Up to 50 animals", "3 users", "1 location", "Core modules"] },
  { name: "Elite", price: 79, popular: true, features: ["Up to 500 animals", "10 users", "3 locations", "Marketplace + Analytics"] },
  { name: "Enterprise", price: 199, features: ["Unlimited animals", "Unlimited users", "Multi-farm", "Priority support"] },
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
          <div className="flex items-center gap-2">
            <Link to="/auth"><Button variant="ghost">Sign in</Button></Link>
            <Link to="/auth" search={{ mode: "signup" } as never}><Button>Get started</Button></Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-4 py-24 text-center">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">Run your farm like software.</h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
          Animals, health, breeding, milk, inventory, finance, HR, and a public marketplace — one platform, every farm.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link to="/auth" search={{ mode: "signup" } as never}>
            <Button size="lg">Start free 14-day trial <ArrowRight className="ml-2 h-4 w-4" /></Button>
          </Link>
          <a href="#pricing"><Button size="lg" variant="outline">See pricing</Button></a>
        </div>
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

      <section id="pricing" className="mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-3xl font-bold text-center">Simple, transparent pricing</h2>
        <p className="mt-3 text-center text-muted-foreground">Start free. Upgrade any time.</p>
        <div className="mt-10 grid gap-6 md:grid-cols-3">
          {PLANS.map((p) => (
            <div key={p.name} className={`rounded-lg border p-6 ${p.popular ? "border-primary shadow-lg" : "border-border"}`}>
              {p.popular && <div className="mb-3 inline-block rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">Most popular</div>}
              <h3 className="text-xl font-semibold">{p.name}</h3>
              <div className="mt-2"><span className="text-4xl font-bold">${p.price}</span><span className="text-muted-foreground">/mo</span></div>
              <ul className="mt-6 space-y-2 text-sm">
                {p.features.map((f) => <li key={f} className="flex items-start gap-2"><CheckCircle2 className="h-4 w-4 text-primary mt-0.5" /> {f}</li>)}
              </ul>
              <Link to="/auth" search={{ mode: "signup" } as never} className="mt-6 block">
                <Button className="w-full" variant={p.popular ? "default" : "outline"}>Choose {p.name}</Button>
              </Link>
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
