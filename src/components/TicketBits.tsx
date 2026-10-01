import { Link } from "@tanstack/react-router";
import {
  formatDate,
  priorityTone,
  statusTone,
  PRIORITY_LABEL,
  STATUS_LABEL,
  type Complaint,
  type ComplaintPriority,
  type ComplaintStatus,
} from "@/lib/service-desk";
import { cn } from "@/lib/utils";

export function StatusPill({ status }: { status: ComplaintStatus }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        statusTone(status),
      )}
    >
      {STATUS_LABEL[status]}
    </span>
  );
}

export function PriorityPill({ priority }: { priority: ComplaintPriority }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium",
        priorityTone(priority),
      )}
    >
      {PRIORITY_LABEL[priority]}
    </span>
  );
}

export type TicketRow = Complaint & { departments: { name: string; code: string } | null };

export function TicketCard({ ticket }: { ticket: TicketRow }) {
  return (
    <Link
      to="/tickets/$ticketId"
      params={{ ticketId: ticket.id }}
      className="block rounded-lg border border-border bg-card p-4 transition-shadow hover:shadow-raised"
    >
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-xs text-muted-foreground">{ticket.ticket_no}</span>
        <StatusPill status={ticket.status} />
        <PriorityPill priority={ticket.priority} />
        {ticket.departments && (
          <span className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground">
            {ticket.departments.name}
          </span>
        )}
      </div>
      <h3 className="mt-2 font-display text-base font-semibold">{ticket.subject}</h3>
      <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">{ticket.description}</p>
      <p className="mt-3 text-xs text-muted-foreground">
        Raised {formatDate(ticket.created_at)} · Updated {formatDate(ticket.updated_at)}
      </p>
    </Link>
  );
}
