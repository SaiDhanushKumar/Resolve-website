import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { BellRing, CheckCheck } from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/hooks/useAuth";
import { formatDate, type Notification } from "@/lib/service-desk";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "Notifications | ResolveNow Service Desk" },
      { name: "description", content: "Automated progress alerts for your tickets." },
      { property: "og:title", content: "Notifications | ResolveNow Service Desk" },
      { property: "og:description", content: "Automated progress alerts for your tickets." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Notifications,
});

function Notifications() {
  const { data: account } = useAccount();
  const queryClient = useQueryClient();

  const { data: items, isLoading } = useQuery({
    queryKey: ["notifications", account?.userId],
    enabled: Boolean(account?.userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as Notification[];
    },
  });

  const markAll = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("user_id", account!.userId)
        .eq("read", false);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries(),
  });

  const unread = (items ?? []).filter((n) => !n.read).length;

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-semibold">Notifications</h1>
          <p className="mt-1 text-muted-foreground">
            {unread > 0 ? `${unread} unread update${unread === 1 ? "" : "s"}` : "You are all caught up."}
          </p>
        </div>
        {unread > 0 && (
          <Button variant="outline" onClick={() => markAll.mutate()} disabled={markAll.isPending}>
            <CheckCheck className="size-4" /> Mark all read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[0, 1, 2].map((i) => (
            <Skeleton key={i} className="h-20" />
          ))}
        </div>
      ) : (items ?? []).length === 0 ? (
        <p className="rounded-lg border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          No alerts yet. You will be notified when tickets are created, assigned or updated.
        </p>
      ) : (
        <ul className="space-y-3">
          {(items ?? []).map((n) => {
            const body = (
              <div
                className={cn(
                  "rounded-lg border p-4 transition-colors",
                  n.read ? "border-border bg-card" : "border-primary/30 bg-primary/5",
                )}
              >
                <div className="flex items-start gap-3">
                  <BellRing
                    className={cn("mt-0.5 size-4", n.read ? "text-muted-foreground" : "text-primary")}
                  />
                  <div className="min-w-0">
                    <p className="font-medium">{n.title}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{n.body}</p>
                    <p className="mt-2 text-xs text-muted-foreground">{formatDate(n.created_at)}</p>
                  </div>
                </div>
              </div>
            );
            return (
              <li key={n.id}>
                {n.complaint_id ? (
                  <Link to="/tickets/$ticketId" params={{ ticketId: n.complaint_id }}>
                    {body}
                  </Link>
                ) : (
                  body
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
