import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Loader2, Share2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/hooks/useAuth";
import {
  STATUSES,
  STATUS_LABEL,
  formatDate,
  type ComplaintEvent,
  type ComplaintStatus,
  type Department,
  type Profile,
} from "@/lib/service-desk";
import { PriorityPill, StatusPill, type TicketRow } from "@/components/TicketBits";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/tickets/$ticketId")({
  head: () => ({
    meta: [
      { title: "Ticket details | ResolveNow Service Desk" },
      { name: "description", content: "Ticket lifecycle, department assignment and timeline." },
      { property: "og:title", content: "Ticket details | ResolveNow Service Desk" },
      {
        property: "og:description",
        content: "Ticket lifecycle, department assignment and timeline.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: TicketDetail,
});

function TicketDetail() {
  const { ticketId } = Route.useParams();
  const { data: account } = useAccount();
  const queryClient = useQueryClient();

  const { data: ticket, isLoading } = useQuery({
    queryKey: ["complaint", ticketId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("complaints")
        .select("*, departments(name, code)")
        .eq("id", ticketId)
        .maybeSingle();
      if (error) throw error;
      return data as TicketRow | null;
    },
  });

  const { data: events } = useQuery({
    queryKey: ["complaint", ticketId, "events"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("complaint_events")
        .select("*")
        .eq("complaint_id", ticketId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ComplaintEvent[];
    },
  });

  const { data: departments } = useQuery({
    queryKey: ["departments"],
    enabled: Boolean(account?.isStaff),
    queryFn: async () => {
      const { data } = await supabase.from("departments").select("*").order("name");
      return (data ?? []) as Department[];
    },
  });

  const { data: agents } = useQuery({
    queryKey: ["agents"],
    enabled: Boolean(account?.isStaff),
    queryFn: async () => {
      const { data: roles } = await supabase
        .from("user_roles")
        .select("user_id")
        .in("role", ["agent", "admin"]);
      const ids = [...new Set((roles ?? []).map((r) => r.user_id))];
      if (ids.length === 0) return [] as Profile[];
      const { data } = await supabase.from("profiles").select("*").in("id", ids);
      return (data ?? []) as Profile[];
    },
  });

  const [deptId, setDeptId] = useState("");
  const [agentId, setAgentId] = useState("none");
  const [note, setNote] = useState("");
  const [comment, setComment] = useState("");

  const refresh = () => queryClient.invalidateQueries();

  const assign = useMutation({
    mutationFn: async () => {
      if (!deptId) throw new Error("Choose a department");
      const { error } = await supabase.from("assignments").insert({
        complaint_id: ticketId,
        department_id: deptId,
        agent_id: agentId === "none" ? null : agentId,
        assigned_by: account!.userId,
        note,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Ticket assigned — customer and agent notified");
      setNote("");
      await refresh();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Assignment failed"),
  });

  const setStatus = useMutation({
    mutationFn: async (status: ComplaintStatus) => {
      const { error } = await supabase.from("complaints").update({ status }).eq("id", ticketId);
      if (error) throw error;
    },
    onSuccess: async () => {
      toast.success("Status updated — customer notified");
      await refresh();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Update failed"),
  });

  const addComment = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("complaint_events").insert({
        complaint_id: ticketId,
        actor_id: account!.userId,
        event_type: "comment",
        message: comment,
      });
      if (error) throw error;
    },
    onSuccess: async () => {
      setComment("");
      await refresh();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not add comment"),
  });

  if (isLoading) return <Skeleton className="mx-auto h-96 max-w-5xl" />;
  if (!ticket)
    return (
      <div className="mx-auto max-w-xl text-center">
        <p className="text-muted-foreground">Ticket not found or you do not have access.</p>
        <Link to="/tickets" className="mt-4 inline-block text-primary hover:underline">
          Back to tickets
        </Link>
      </div>
    );

  const isOwner = ticket.customer_id === account?.userId;
  const agentName = agents?.find((a) => a.id === ticket.assigned_agent_id)?.full_name;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Link
        to="/tickets"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" /> All tickets
      </Link>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <Card className="shadow-panel">
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono text-sm text-muted-foreground">{ticket.ticket_no}</span>
                <StatusPill status={ticket.status} />
                <PriorityPill priority={ticket.priority} />
              </div>
              <CardTitle className="font-display text-2xl">{ticket.subject}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{ticket.description}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg">Lifecycle timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="relative space-y-5 border-l border-border pl-6">
                {(events ?? []).map((ev) => (
                  <li key={ev.id} className="relative">
                    <span className="absolute -left-[1.85rem] top-1 size-3 rounded-full border-2 border-card bg-primary" />
                    <p className="text-xs font-mono uppercase tracking-wide text-muted-foreground">
                      {ev.event_type.replace("_", " ")} · {formatDate(ev.created_at)}
                    </p>
                    <p className="mt-1 text-sm">{ev.message}</p>
                  </li>
                ))}
              </ol>
              {(account?.isStaff || isOwner) && (
                <form
                  className="mt-6 space-y-2"
                  onSubmit={(e) => {
                    e.preventDefault();
                    if (comment.trim()) addComment.mutate();
                  }}
                >
                  <Label htmlFor="comment">Add an update</Label>
                  <Textarea
                    id="comment"
                    rows={3}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share progress or extra details"
                  />
                  <Button type="submit" size="sm" disabled={addComment.isPending}>
                    Post update
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="font-display text-lg">Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Row label="Category" value={ticket.category} />
              <Row label="Department" value={ticket.departments?.name ?? "Awaiting assignment"} />
              <Row label="Owner" value={agentName ?? (ticket.assigned_agent_id ? "Assigned agent" : "—")} />
              <Row label="Raised" value={formatDate(ticket.created_at)} />
              <Row label="Updated" value={formatDate(ticket.updated_at)} />
              <Row label="Resolved" value={formatDate(ticket.resolved_at)} />
            </CardContent>
          </Card>

          {account?.isStaff && (
            <Card className="border-primary/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 font-display text-lg">
                  <Share2 className="size-4" /> Assign to department
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Select value={deptId} onValueChange={setDeptId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose department" />
                  </SelectTrigger>
                  <SelectContent>
                    {(departments ?? []).map((d) => (
                      <SelectItem key={d.id} value={d.id}>
                        {d.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={agentId} onValueChange={setAgentId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Owning agent" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No specific agent</SelectItem>
                    {(agents ?? []).map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.full_name || a.email}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Textarea
                  rows={2}
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Routing note (optional)"
                />
                <Button
                  className="w-full"
                  onClick={() => assign.mutate()}
                  disabled={assign.isPending}
                >
                  {assign.isPending && <Loader2 className="size-4 animate-spin" />}
                  Assign ticket
                </Button>
              </CardContent>
            </Card>
          )}

          {account?.isStaff && (
            <Card>
              <CardHeader>
                <CardTitle className="font-display text-lg">Update status</CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={ticket.status}
                  onValueChange={(v) => setStatus.mutate(v as ComplaintStatus)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {STATUS_LABEL[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          )}

          {isOwner && !account?.isStaff && (ticket.status === "resolved" || ticket.status === "closed") && (
            <Button variant="outline" className="w-full" onClick={() => setStatus.mutate("reopened")}>
              Not fixed? Reopen ticket
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium capitalize">{value}</span>
    </div>
  );
}
