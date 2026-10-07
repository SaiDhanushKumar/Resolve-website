<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Architecture rules
- Service boundaries (Complaint → Assignment → Notification) are Postgres tables + AFTER/BEFORE triggers that emit `complaint_events` and `notifications`; why: keeps services decoupled and guarantees alerts even if the UI fails.
- Roles live only in `user_roles` checked via `has_role()`/`is_staff()` in RLS; why: prevents privilege escalation.
- Client reads/writes use the browser client under RLS; realtime channel in AppShell invalidates queries; why: live updates without polling.
- Architecture write-up lives in docs/ARCHITECTURE.md; why: PS027 deliverable mapping to the microservices spec.
