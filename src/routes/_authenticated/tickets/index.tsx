import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { PlusCircle, Search } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/hooks/useAuth";
import { STATUSES, STATUS_LABEL, type ComplaintStatus } from "@/lib/service-desk";
import { TicketCard, type TicketRow } from "@/components/TicketBits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/tickets/")({
  head: () => ({
    meta: [
      { title: "Tickets | ResolveNow Service Desk" },
      { name: "description", content: "Browse, filter and track the full complaint queue." },
      { property: "og:title", content: "Tickets | ResolveNow Service Desk" },
      {
        property: "og:description",
        content: "Browse, filter and track the full complaint queue.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Tickets,
});

function Tickets() {
  const { data: account } = useAccount();
  const [status, setStatus] = useState<ComplaintStatus | "all">("all");
  const [scope, setScope] = useState<"all" | "mine">("all");
  const [search, setSearch] = useState("");

  const { data: tickets, isLoading } = useQuery({
    queryKey: ["complaints", "all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("complaints")
        .select("*, departments(name, code)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as TicketRow[];
    },
  });

  const filtered = (tickets ?? []).filter((t) => {
    if (status !== "all" && t.status !== status) return false;
    if (scope === "mine" && t.assigned_agent_id !== account?.userId) return false;
    if (search) {
      const q = search.toLowerCase();
      if (
        !t.subject.toLowerCase().includes(q) &&
        !t.ticket_no.toLowerCase().includes(q) &&
        !t.description.toLowerCase().includes(q)
      )
        return false;
    }
    return true;
  });

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold">Tickets</h1>
          <p className="mt-1 text-muted-foreground">
            {account?.isStaff
              ? "Every complaint logged across the service desk."
              : "All the issues you have raised."}
          </p>
        </div>
        {!account?.isStaff && (
          <Link to="/new-ticket">
            <Button>
              <PlusCircle className="size-4" /> Raise a ticket
            </Button>
          </Link>
        )}
      </div>

      <div className="flex flex-wrap gap-3 rounded-lg border border-border bg-card p-3">
        <div className="relative min-w-56 flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="pl-9"
            placeholder="Search by ticket number, subject or text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <Select value={status} onValueChange={(v) => setStatus(v as ComplaintStatus | "all")}>
          <SelectTrigger className="w-44">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {STATUS_LABEL[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {account?.isStaff && (
          <Select value={scope} onValueChange={(v) => setScope(v as "all" | "mine")}>
            <SelectTrigger className="w-44">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Whole queue</SelectItem>
              <SelectItem value="mine">Assigned to me</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {isLoading ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No tickets match these filters.
        </p>
      ) : (
        <div className="grid gap-3 lg:grid-cols-2">
          {filtered.map((t) => (
            <TicketCard key={t.id} ticket={t} />
          ))}
        </div>
      )}
    </div>
  );
}
