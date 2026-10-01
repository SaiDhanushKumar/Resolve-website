import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  Bell,
  GitBranch,
  LifeBuoy,
  ListChecks,
  LockKeyhole,
  Network,
  Share2,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ResolveNow — Enterprise Issue Escalation & Service Desk" },
      {
        name: "description",
        content:
          "Log customer grievances, route them to specialised departments and track the full resolution lifecycle with automated progress alerts.",
      },
      { property: "og:title", content: "ResolveNow — Enterprise Service Desk" },
      {
        property: "og:description",
        content:
          "Log customer grievances, route them to specialised departments and track the full resolution lifecycle with automated progress alerts.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const features = [
  {
    icon: ListChecks,
    title: "Complaint lifecycle",
    body: "Open, assigned, in progress, resolved, closed or reopened — every transition is timestamped on an auditable timeline.",
  },
  {
    icon: Share2,
    title: "Department routing",
    body: "Administrators route each ticket to a specialised department and an owning agent, transparently visible to the customer.",
  },
  {
    icon: Bell,
    title: "Automated alerts",
    body: "Customers and agents receive instant in-app notifications on creation, assignment and every status change.",
  },
  {
    icon: LockKeyhole,
    title: "Token-secured access",
    body: "Signed JWT sessions plus role-based policies: customers see only their own tickets, agents and admins see the queue.",
  },
  {
    icon: GitBranch,
    title: "Decoupled services",
    body: "Complaint intake, assignment and notification delivery are separate modules communicating through events.",
  },
  {
    icon: Network,
    title: "Single ingress",
    body: "All traffic enters through one routed gateway layer with discovery and load balancing handled by the platform.",
  },
];

function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border bg-background/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
          <span className="flex items-center gap-2 font-display text-lg font-semibold">
            <LifeBuoy className="size-5 text-primary" /> ResolveNow
          </span>
          <nav className="flex items-center gap-2">
            <Link to="/architecture">
              <Button variant="ghost" size="sm">
                Architecture
              </Button>
            </Link>
            <Link to="/auth">
              <Button size="sm">Sign in</Button>
            </Link>
          </nav>
        </div>
      </header>

      <section className="hero-gradient relative overflow-hidden">
        <div className="surface-grid absolute inset-0 opacity-30" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-4 py-24">
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-accent">
            PS027 · Service Desk Management
          </p>
          <h1 className="mt-5 max-w-3xl font-display text-5xl font-semibold leading-tight text-primary-foreground md:text-6xl">
            Enterprise issue escalation, from first complaint to final resolution.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-primary-foreground/80">
            ResolveNow logs customer grievances, assigns them to specialised departments and keeps
            everyone informed with real-time, automated progress alerts.
          </p>
          <div className="mt-9 flex flex-wrap gap-3">
            <Link to="/auth">
              <Button size="lg" variant="secondary">
                Raise a ticket <ArrowRight className="size-4" />
              </Button>
            </Link>
            <Link to="/architecture">
              <Button
                size="lg"
                variant="outline"
                className="border-primary-foreground/30 bg-transparent text-primary-foreground hover:bg-primary-foreground/10"
              >
                View system design
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="font-display text-3xl font-semibold">Built for high-volume support surges</h2>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Intake, assignment and notification are independent concerns, wired together by events so
          one busy queue never blocks another.
        </p>
        <div className="mt-10 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <Card key={f.title} className="shadow-panel">
              <CardContent className="pt-6">
                <span className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <f.icon className="size-5" />
                </span>
                <h3 className="mt-4 font-display text-lg font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-t border-border bg-card">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-12">
          <div>
            <h2 className="font-display text-2xl font-semibold">Ready to log your first issue?</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Create an account in seconds — the first user can claim the administrator role.
            </p>
          </div>
          <Link to="/auth">
            <Button size="lg">
              Get started <ArrowRight className="size-4" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-border py-8 text-center text-sm text-muted-foreground">
        ResolveNow Service Desk · Enterprise Issue Escalation Platform
      </footer>
    </div>
  );
}
