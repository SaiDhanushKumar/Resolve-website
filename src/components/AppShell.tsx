import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, type ReactNode } from "react";
import {
  Bell,
  Building2,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Network,
  PlusCircle,
  Ticket,
  Users,
} from "lucide-react";

import { supabase } from "@/integrations/supabase/client";
import { useAccount } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

function NavItem({
  to,
  icon: Icon,
  label,
  badge,
}: {
  to: string;
  icon: typeof Ticket;
  label: string;
  badge?: number;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const active = pathname === to || (to !== "/dashboard" && pathname.startsWith(to));
  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors",
        active
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/75 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
      )}
    >
      <Icon className="size-4 shrink-0" />
      <span className="flex-1">{label}</span>
      {badge ? (
        <span className="rounded-full bg-sidebar-primary px-2 py-0.5 text-xs font-semibold text-sidebar-primary-foreground">
          {badge}
        </span>
      ) : null}
    </Link>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const { data: account } = useAccount();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: unread = 0 } = useQuery({
    queryKey: ["unread-count", account?.userId],
    enabled: Boolean(account?.userId),
    queryFn: async () => {
      const { count } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true })
        .eq("user_id", account!.userId)
        .eq("read", false);
      return count ?? 0;
    },
  });

  // Realtime: notification + ticket updates refresh the UI instantly.
  useEffect(() => {
    if (!account?.userId) return;
    const channel = supabase
      .channel("service-desk-stream")
      .on("postgres_changes", { event: "*", schema: "public", table: "notifications" }, () => {
        queryClient.invalidateQueries({ queryKey: ["unread-count"] });
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "complaints" }, () => {
        queryClient.invalidateQueries({ queryKey: ["complaints"] });
        queryClient.invalidateQueries({ queryKey: ["complaint"] });
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [account?.userId, queryClient]);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  const roleLabel = account?.isAdmin
    ? "Administrator"
    : account?.isAgent
      ? "Support agent"
      : "Customer";

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar p-4 md:flex">
        <Link to="/" className="mb-6 flex items-center gap-2 px-2">
          <span className="flex size-9 items-center justify-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <LifeBuoy className="size-5" />
          </span>
          <span className="font-display text-lg font-semibold text-sidebar-foreground">
            ResolveNow
          </span>
        </Link>

        <nav className="flex flex-1 flex-col gap-1">
          <NavItem to="/dashboard" icon={LayoutDashboard} label="Dashboard" />
          <NavItem to="/tickets" icon={Ticket} label="Tickets" />
          {!account?.isStaff && <NavItem to="/new-ticket" icon={PlusCircle} label="Raise ticket" />}
          <NavItem to="/notifications" icon={Bell} label="Notifications" badge={unread} />
          {account?.isAdmin && <NavItem to="/departments" icon={Building2} label="Departments" />}
          {account?.isAdmin && <NavItem to="/people" icon={Users} label="People & roles" />}
          <NavItem to="/architecture" icon={Network} label="Architecture" />
        </nav>

        <div className="mt-4 rounded-lg bg-sidebar-accent/60 p-3">
          <p className="truncate text-sm font-medium text-sidebar-accent-foreground">
            {account?.profile?.full_name || account?.email}
          </p>
          <Badge variant="secondary" className="mt-2">
            {roleLabel}
          </Badge>
          <Button variant="ghost" size="sm" className="mt-2 w-full justify-start" onClick={signOut}>
            <LogOut className="size-4" /> Sign out
          </Button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex items-center justify-between gap-3 border-b border-border bg-card px-4 py-3 md:hidden">
          <Link to="/dashboard" className="flex items-center gap-2 font-display font-semibold">
            <LifeBuoy className="size-5 text-primary" /> ResolveNow
          </Link>
          <div className="flex items-center gap-1">
            <Link to="/notifications">
              <Button variant="ghost" size="icon" aria-label="Notifications">
                <Bell className="size-5" />
              </Button>
            </Link>
            <Button variant="ghost" size="icon" aria-label="Sign out" onClick={signOut}>
              <LogOut className="size-5" />
            </Button>
          </div>
        </header>

        <div className="flex gap-1 overflow-x-auto border-b border-border bg-card px-2 py-2 md:hidden">
          <Link to="/dashboard" className="shrink-0">
            <Button variant="ghost" size="sm">
              Dashboard
            </Button>
          </Link>
          <Link to="/tickets" className="shrink-0">
            <Button variant="ghost" size="sm">
              Tickets
            </Button>
          </Link>
          {!account?.isStaff && (
            <Link to="/new-ticket" className="shrink-0">
              <Button variant="ghost" size="sm">
                Raise ticket
              </Button>
            </Link>
          )}
          {account?.isAdmin && (
            <Link to="/people" className="shrink-0">
              <Button variant="ghost" size="sm">
                People
              </Button>
            </Link>
          )}
          <Link to="/architecture" className="shrink-0">
            <Button variant="ghost" size="sm">
              Architecture
            </Button>
          </Link>
        </div>

        <main className="flex-1 p-4 md:p-8">{children}</main>
      </div>
    </div>
  );
}
