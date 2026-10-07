import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, LifeBuoy } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/architecture")({
  head: () => ({
    meta: [
      { title: "System architecture | ResolveNow Service Desk" },
      {
        name: "description",
        content:
          "How ResolveNow maps to the microservices design: Complaint, Assignment and Notification services, gateway, auth and discovery.",
      },
      { property: "og:title", content: "System architecture | ResolveNow Service Desk" },
      {
        property: "og:description",
        content: "Microservices mapping for the ResolveNow service desk platform.",
      },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Architecture,
});

const services = [
  {
    name: "API Gateway",
    role: "Single ingress & routing",
    impl: "All browser traffic enters through one routed web entry point. Routes are split into public pages and a protected area that rejects unauthenticated requests before any data loads.",
  },
  {
    name: "Auth Service",
    role: "JWT issuance & validation",
    impl: "Email/password and Google sign-in issue signed JWT access tokens. Every data request carries the token; the database verifies it and applies role-based row-level policies (customer, agent, admin).",
  },
  {
    name: "Complaint Service",
    role: "Logs issues, owns lifecycle",
    impl: "Owns the complaints table and lifecycle states (open → assigned → in progress → resolved → closed / reopened). Inserting a complaint emits a 'created' event.",
  },
  {
    name: "Assignment Service",
    role: "Routes tasks to departments",
    impl: "Owns assignments and departments. Creating an assignment updates the complaint's department/agent and moves it to 'assigned', then emits an 'assigned' event.",
  },
  {
    name: "Notification Service",
    role: "Alerts users on updates",
    impl: "Consumes events from the other services and writes notifications for customers and agents. Delivered instantly via a realtime push channel to the in-app bell.",
  },
  {
    name: "Discovery & load balancing",
    role: "Eureka equivalent",
    impl: "Services are addressed by name inside the managed platform; the edge runtime auto-scales stateless instances and balances traffic, so support surges never need manual registration.",
  },
];

function Architecture() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2 font-display font-semibold">
            <LifeBuoy className="size-5 text-primary" /> ResolveNow
          </Link>
          <Link to="/dashboard" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-4" /> Back to app
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-5xl space-y-10 px-4 py-12">
        <div>
          <p className="font-mono text-xs uppercase tracking-[0.25em] text-muted-foreground">PS027</p>
          <h1 className="mt-2 font-display text-4xl font-semibold">System architecture</h1>
          <p className="mt-3 max-w-2xl text-muted-foreground">
            How each required microservice is realised, and how they communicate.
          </p>
        </div>

        <Card className="shadow-panel">
          <CardContent className="overflow-x-auto pt-6">
            <pre className="font-mono text-xs leading-relaxed text-foreground">{`
  Browser ──► API Gateway (routing, protected area)
                 │
                 ├──► Auth Service ── issues JWT ──► every request is token-verified
                 │
                 ▼
          Complaint Service ──(event: created / status_changed)──┐
                 │                                               │
                 ▼                                               ▼
          Assignment Service ──(event: assigned)──────► Notification Service
                                                                 │
                                                  realtime push  ▼
                                                     in-app alerts (customer & agent)
`}</pre>
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-2">
          {services.map((s) => (
            <Card key={s.name}>
              <CardContent className="pt-6">
                <h2 className="font-display text-lg font-semibold">{s.name}</h2>
                <p className="text-sm font-medium text-primary">{s.role}</p>
                <p className="mt-2 text-sm text-muted-foreground">{s.impl}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <p className="text-sm text-muted-foreground">
          The full write-up, including a Spring Boot / Eureka reference mapping, test plan and
          deployment steps, lives in <span className="font-mono">docs/ARCHITECTURE.md</span>.
        </p>
      </main>
    </div>
  );
}
