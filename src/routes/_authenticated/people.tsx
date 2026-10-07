import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/hooks/useAuth";
import type { AppRole, Profile } from "@/lib/service-desk";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/people")({
  head: () => ({
    meta: [
      { title: "People & roles | ResolveNow Service Desk" },
      { name: "description", content: "Promote customers to agents and manage administrators." },
      { property: "og:title", content: "People & roles | ResolveNow Service Desk" },
      {
        property: "og:description",
        content: "Promote customers to agents and manage administrators.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: People,
});

function People() {
  const { data: account } = useAccount();
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: ["people"],
    queryFn: async () => {
      const [p, r] = await Promise.all([
        supabase.from("profiles").select("*").order("created_at"),
        supabase.from("user_roles").select("user_id, role"),
      ]);
      const roles: Record<string, AppRole[]> = {};
      for (const row of r.data ?? []) (roles[row.user_id] ??= []).push(row.role as AppRole);
      return { profiles: (p.data ?? []) as Profile[], roles };
    },
  });

  const toggle = useMutation({
    mutationFn: async ({ userId, role, on }: { userId: string; role: AppRole; on: boolean }) => {
      const res = on
        ? await supabase.from("user_roles").insert({ user_id: userId, role })
        : await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
      if (res.error) throw res.error;
    },
    onSuccess: async () => {
      toast.success("Roles updated");
      await queryClient.invalidateQueries();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Update failed"),
  });

  if (account && !account.isAdmin) return <p className="text-muted-foreground">Administrators only.</p>;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">People &amp; roles</h1>
        <p className="mt-1 text-muted-foreground">
          Everyone signs up as a customer. Grant the agent role to support staff.
        </p>
      </div>
      <div className="space-y-3">
        {(data?.profiles ?? []).map((p) => {
          const roles = data?.roles[p.id] ?? [];
          const isAgent = roles.includes("agent");
          const isAdmin = roles.includes("admin");
          return (
            <Card key={p.id}>
              <CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6">
                <div>
                  <p className="font-medium">{p.full_name || p.email}</p>
                  <p className="text-sm text-muted-foreground">{p.email}</p>
                  <div className="mt-2 flex gap-1">
                    {roles.map((r) => (
                      <Badge key={r} variant="secondary" className="capitalize">
                        {r}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant={isAgent ? "outline" : "default"}
                    onClick={() => toggle.mutate({ userId: p.id, role: "agent", on: !isAgent })}
                  >
                    {isAgent ? "Remove agent" : "Make agent"}
                  </Button>
                  {p.id !== account?.userId && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => toggle.mutate({ userId: p.id, role: "admin", on: !isAdmin })}
                    >
                      {isAdmin ? "Remove admin" : "Make admin"}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
