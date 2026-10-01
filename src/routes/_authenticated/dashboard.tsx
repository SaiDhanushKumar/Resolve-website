import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { AlertTriangle, PlusCircle } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/hooks/useAuth";
import { OPEN_STATUSES } from "@/lib/service-desk";
import { TicketCard, type TicketRow } from "@/components/TicketBits";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard | ResolveNow Service Desk" },
      { name: "description", content: "Live overview of ticket volume, workload and resolution." },
      { property: "og:title", content: "Dashboard | ResolveNow Service Desk" },
      {
        property: "og:description",
        content: "Live overview of ticket volume, workload and resolution.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Dashboard,
});

function Stat({ label, value, tone }: { label: string; value: number; tone?: string }) {
  return (
    <Card className="shadow-panel">
      <CardContent className="pt-6">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className={`mt-1 font-display text-3xl font-semibold ${tone ?? ""}`}>{value}</p>
      </CardContent>
    </Card>
  );
}

function Dashboard() {
  const { data: account } = useAccount();
  const queryClient = useQueryClient();

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

  const { data: adminExists } = useQuery({
    queryKey: ["admin-exists"],
    queryFn: async () => {
      const { data } = await supabase.rpc("admin_exists");
      return Boolean(data);
    },
  });

  const list = tickets ?? [];
  const open = list.filter((t) => OPEN_STATUSES.includes(t.status));
  const unassigned = list.filter((t) => !t.department_id);
  const resolved = list.filter((t) => t.status === "resolved" || t.status === "closed");
  const mine = list.filter((t) => t.assigned_agent_id === account?.userId);

  async function claimAdmin() {
    const { data, error } = await supabase.rpc("claim_first_admin");
    if (error || !data) {
      toast.error("Administrator role is already taken.");
    } else {
      toast.success("You are now the administrator.");
    }
    await queryClient.invalidateQueries();
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold">
            Welcome back
            {account?.profile?.full_name ? `, ${account.profile.full_name.split(" ")[0]}` : ""}
          </h1>
          <p className="mt-1 text-muted-foreground">
            {account?.isStaff
              ? "Service desk queue and departmental workload."
              : "Your tickets and their current resolution status."}
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

      {account && !account.isAdmin && adminExists === false && (
        <Card className="border-warning/50 bg-warning/10">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
            <p className="flex items-center gap-2 text-sm">
              <AlertTriangle className="size-4" />
              No administrator exists yet. Claim the role to manage departments and assignments.
            </p>
            <Button size="sm" onClick={claimAdmin}>
              Claim administrator role
            </Button>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat label="Total tickets" value={list.length} />
          <Stat label="Open" value={open.length} tone="text-info" />
          <Stat
            label={account?.isStaff ? "Awaiting assignment" : "Assigned to a team"}
            value={account?.isStaff ? unassigned.length : list.length - unassigned.length}
            tone="text-warning-foreground"
          />
          <Stat label="Resolved" value={resolved.length} tone="text-success" />
        </div>
      )}

      {account?.isAgent && (
        <section>
          <h2 className="mb-3 font-display text-xl font-semibold">Assigned to you</h2>
          {mine.length === 0 ? (
            <p className="text-sm text-muted-foreground">No tickets assigned to you right now.</p>
          ) : (
            <div className="grid gap-3 lg:grid-cols-2">
              {mine.slice(0, 4).map((t) => (
                <TicketCard key={t.id} ticket={t} />
              ))}
            </div>
          )}
        </section>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-xl font-semibold">Recent activity</h2>
          <Link to="/tickets" className="text-sm font-medium text-primary hover:underline">
            View all tickets
          </Link>
        </div>
        {list.length === 0 ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">No tickets yet</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground">
              {account?.isStaff
                ? "Once customers log grievances they will appear here."
                : "Raise your first ticket and we will route it to the right department."}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 lg:grid-cols-2">
            {list.slice(0, 6).map((t) => (
              <TicketCard key={t.id} ticket={t} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
