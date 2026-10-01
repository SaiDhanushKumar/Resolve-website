import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Building2, Loader2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/hooks/useAuth";
import type { Department } from "@/lib/service-desk";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/departments")({
  head: () => ({
    meta: [
      { title: "Departments | ResolveNow Service Desk" },
      { name: "description", content: "Manage the specialised departments tickets are routed to." },
      { property: "og:title", content: "Departments | ResolveNow Service Desk" },
      {
        property: "og:description",
        content: "Manage the specialised departments tickets are routed to.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Departments,
});

function Departments() {
  const { data: account } = useAccount();
  const queryClient = useQueryClient();
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const { data: departments } = useQuery({
    queryKey: ["departments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("departments").select("*").order("name");
      if (error) throw error;
      return (data ?? []) as Department[];
    },
  });

  const { data: counts } = useQuery({
    queryKey: ["department-load"],
    queryFn: async () => {
      const { data, error } = await supabase.from("complaints").select("department_id, status");
      if (error) throw error;
      const map: Record<string, number> = {};
      for (const row of data ?? []) {
        if (!row.department_id) continue;
        if (row.status === "closed" || row.status === "resolved") continue;
        map[row.department_id] = (map[row.department_id] ?? 0) + 1;
      }
      return map;
    },
  });

  const create = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("departments")
        .insert({ code: code.toUpperCase().trim(), name: name.trim(), description });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Department created");
      setCode("");
      setName("");
      setDescription("");
      await queryClient.invalidateQueries({ queryKey: ["departments"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not create department"),
  });

  if (account && !account.isAdmin) {
    return <p className="text-muted-foreground">Administrators only.</p>;
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Departments</h1>
        <p className="mt-1 text-muted-foreground">
          Specialised teams that tickets are escalated to, with their current active workload.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {(departments ?? []).map((d) => (
          <Card key={d.id} className="shadow-panel">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between gap-3">
                <span className="flex size-10 items-center justify-center rounded-md bg-primary/10 text-primary">
                  <Building2 className="size-5" />
                </span>
                <span className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground">
                  {counts?.[d.id] ?? 0} active
                </span>
              </div>
              <h3 className="mt-3 font-display text-lg font-semibold">{d.name}</h3>
              <p className="font-mono text-xs text-muted-foreground">{d.code}</p>
              <p className="mt-2 text-sm text-muted-foreground">{d.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-display text-xl">Add a department</CardTitle>
          <CardDescription>New routing targets become available immediately.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="grid gap-4 sm:grid-cols-2"
            onSubmit={(e) => {
              e.preventDefault();
              create.mutate();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="code">Code</Label>
              <Input
                id="code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="SECURITY"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Security & Compliance"
                required
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="desc">Description</Label>
              <Textarea
                id="desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={2}
              />
            </div>
            <Button type="submit" disabled={create.isPending} className="sm:col-span-2">
              {create.isPending && <Loader2 className="size-4 animate-spin" />}
              Create department
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
