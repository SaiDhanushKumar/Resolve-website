import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { AppRole, Profile } from "@/lib/service-desk";

export function useCurrentUser() {
  return useQuery({
    queryKey: ["current-user"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user ?? null;
    },
  });
}

export interface AccountInfo {
  userId: string;
  email: string;
  profile: Profile | null;
  roles: AppRole[];
  isAdmin: boolean;
  isAgent: boolean;
  isStaff: boolean;
}

export function useAccount() {
  const { data: user, isLoading: userLoading } = useCurrentUser();

  const query = useQuery({
    queryKey: ["account", user?.id],
    enabled: Boolean(user?.id),
    queryFn: async (): Promise<AccountInfo> => {
      const id = user!.id;
      const [profileRes, rolesRes] = await Promise.all([
        supabase.from("profiles").select("*").eq("id", id).maybeSingle(),
        supabase.from("user_roles").select("role").eq("user_id", id),
      ]);
      const roles = (rolesRes.data ?? []).map((r) => r.role as AppRole);
      return {
        userId: id,
        email: user!.email ?? "",
        profile: profileRes.data ?? null,
        roles,
        isAdmin: roles.includes("admin"),
        isAgent: roles.includes("agent"),
        isStaff: roles.includes("admin") || roles.includes("agent"),
      };
    },
  });

  return { ...query, isLoading: userLoading || query.isLoading };
}
