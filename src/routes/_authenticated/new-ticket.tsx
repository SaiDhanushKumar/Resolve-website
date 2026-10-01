import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/hooks/useAuth";
import { CATEGORIES, PRIORITIES, PRIORITY_LABEL, type ComplaintPriority } from "@/lib/service-desk";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/new-ticket")({
  head: () => ({
    meta: [
      { title: "Raise a ticket | ResolveNow Service Desk" },
      { name: "description", content: "Log a new grievance with the ResolveNow service desk." },
      { property: "og:title", content: "Raise a ticket | ResolveNow Service Desk" },
      {
        property: "og:description",
        content: "Log a new grievance with the ResolveNow service desk.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NewTicket,
});

function NewTicket() {
  const { data: account } = useAccount();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("general");
  const [priority, setPriority] = useState<ComplaintPriority>("medium");

  const mutation = useMutation({
    mutationFn: async () => {
      if (!account) throw new Error("Not signed in");
      const { data, error } = await supabase
        .from("complaints")
        .insert({
          customer_id: account.userId,
          subject,
          description,
          category,
          priority,
        })
        .select("id, ticket_no")
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: async (data) => {
      toast.success(`Ticket ${data.ticket_no} logged`);
      await queryClient.invalidateQueries();
      navigate({ to: "/tickets/$ticketId", params: { ticketId: data.id } });
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : "Could not log ticket"),
  });

  return (
    <div className="mx-auto max-w-2xl">
      <Card className="shadow-panel">
        <CardHeader>
          <CardTitle className="font-display text-2xl">Raise a ticket</CardTitle>
          <CardDescription>
            Describe the issue. It is logged immediately, routed to a department, and you will be
            alerted at every step.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="space-y-5"
            onSubmit={(e) => {
              e.preventDefault();
              mutation.mutate();
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Invoice charged twice in March"
                maxLength={140}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">What happened?</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Include dates, order or account references and anything you already tried."
                rows={6}
                maxLength={4000}
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Category</Label>
                <Select value={category} onValueChange={setCategory}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((c) => (
                      <SelectItem key={c} value={c} className="capitalize">
                        {c}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select
                  value={priority}
                  onValueChange={(v) => setPriority(v as ComplaintPriority)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PRIORITIES.map((p) => (
                      <SelectItem key={p} value={p}>
                        {PRIORITY_LABEL[p]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={mutation.isPending}>
              {mutation.isPending && <Loader2 className="size-4 animate-spin" />}
              Submit ticket
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
