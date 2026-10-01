import type { Database } from "@/integrations/supabase/types";

export type AppRole = Database["public"]["Enums"]["app_role"];
export type ComplaintStatus = Database["public"]["Enums"]["complaint_status"];
export type ComplaintPriority = Database["public"]["Enums"]["complaint_priority"];

export type Complaint = Database["public"]["Tables"]["complaints"]["Row"];
export type Department = Database["public"]["Tables"]["departments"]["Row"];
export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];
export type ComplaintEvent = Database["public"]["Tables"]["complaint_events"]["Row"];

export const STATUSES: ComplaintStatus[] = [
  "open",
  "assigned",
  "in_progress",
  "resolved",
  "closed",
  "reopened",
];

export const PRIORITIES: ComplaintPriority[] = ["low", "medium", "high", "critical"];

export const CATEGORIES = [
  "general",
  "billing",
  "outage",
  "defect",
  "delivery",
  "account access",
  "data request",
];

export const STATUS_LABEL: Record<ComplaintStatus, string> = {
  open: "Open",
  assigned: "Assigned",
  in_progress: "In progress",
  resolved: "Resolved",
  closed: "Closed",
  reopened: "Reopened",
};

export const PRIORITY_LABEL: Record<ComplaintPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export function statusTone(status: ComplaintStatus): string {
  switch (status) {
    case "open":
      return "bg-info/10 text-info border-info/30";
    case "assigned":
      return "bg-primary/10 text-primary border-primary/30";
    case "in_progress":
      return "bg-warning/15 text-warning-foreground border-warning/40";
    case "resolved":
      return "bg-success/10 text-success border-success/30";
    case "closed":
      return "bg-muted text-muted-foreground border-border";
    case "reopened":
      return "bg-destructive/10 text-destructive border-destructive/30";
  }
}

export function priorityTone(priority: ComplaintPriority): string {
  switch (priority) {
    case "low":
      return "bg-muted text-muted-foreground border-border";
    case "medium":
      return "bg-info/10 text-info border-info/30";
    case "high":
      return "bg-warning/15 text-warning-foreground border-warning/40";
    case "critical":
      return "bg-destructive/10 text-destructive border-destructive/30";
  }
}

export const OPEN_STATUSES: ComplaintStatus[] = ["open", "assigned", "in_progress", "reopened"];

export function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
