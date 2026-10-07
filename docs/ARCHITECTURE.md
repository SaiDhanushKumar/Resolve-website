# PS027 — ResolveNow Enterprise Issue Escalation & Service Desk

## 1. Overview
ResolveNow logs customer grievances, routes them to specialised departments and
tracks the resolution lifecycle with automated alerts. Roles: **Customer**,
**Agent**, **Admin**.

## 2. Service mapping

| Required service | Responsibility | Implementation in this project |
|---|---|---|
| API Gateway | Ingress routing | TanStack Start router; public routes (`/`, `/auth`, `/architecture`) and a protected `_authenticated` subtree |
| Auth Service | JWT auth | Lovable Cloud Auth (email/password + Google) issues signed JWTs; Postgres RLS enforces roles via `has_role()` / `is_staff()` |
| Complaint Service | Log issues, lifecycle | `complaints` table, `complaint_status` enum, `trg_complaint_created`, `trg_complaint_updated` |
| Assignment Service | Assign to departments | `departments`, `assignments`, `trg_assignment_created` |
| Notification Service | Alert users | `notifications` table populated by event triggers; realtime push to the UI |
| Eureka + Load balancing | Discovery / scaling | Managed edge runtime: name-based service addressing, auto-scaled stateless instances |

## 3. Inter-service communication
`Complaint → Assignment → Notification` is event-driven:
1. Customer inserts a complaint → `created` event + notification.
2. Staff inserts an assignment → complaint updated (`assigned`), `assigned` event, notifications to customer & agent.
3. Any status change → `status_changed` event + notifications.

Each service owns its tables; communication is via database events, so services stay decoupled.

## 4. Security
- JWT required on every data call; anonymous access is denied.
- Customers read only their own tickets; agents/admins read the queue.
- Roles live in a separate `user_roles` table (no privilege escalation via profile edits).
- First admin is bootstrapped through `claim_first_admin()` — closes after first use.

## 5. Spring Boot reference mapping (for a Java deployment)
| Module | Port | Notes |
|---|---|---|
| eureka-server | 8761 | `@EnableEurekaServer` |
| api-gateway | 8080 | Spring Cloud Gateway, `lb://COMPLAINT-SERVICE` routes, JWT filter |
| auth-service | 8081 | Issues JWT (jjwt), BCrypt passwords |
| complaint-service | 8082 | Publishes to assignment via OpenFeign (`@LoadBalanced`) |
| assignment-service | 8083 | Calls notification-service via Feign |
| notification-service | 8084 | Persists alerts, sends email |

Run 2+ instances of any service; the gateway load-balances via Spring Cloud LoadBalancer.

## 6. Test plan
- Auth: sign-up, sign-in, protected route redirects when signed out.
- Complaint: customer creates ticket → appears in list, timeline shows `created`, notification created.
- RLS: customer B cannot see customer A's ticket.
- Assignment: admin assigns → status becomes `assigned`, customer + agent notified.
- Status: agent sets `resolved` → `resolved_at` stamped, customer notified; customer can reopen.

## 7. Deployment
Click **Publish** in Lovable. Frontend, server runtime and database deploy together; the backend is already live.
