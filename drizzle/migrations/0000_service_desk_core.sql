-- ========== ENUMS ==========
CREATE TYPE public.app_role AS ENUM ('admin', 'agent', 'customer');
CREATE TYPE public.complaint_status AS ENUM ('open', 'assigned', 'in_progress', 'resolved', 'closed', 'reopened');
CREATE TYPE public.complaint_priority AS ENUM ('low', 'medium', 'high', 'critical');

-- ========== DEPARTMENTS ==========
CREATE TABLE public.departments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.departments TO authenticated;
GRANT ALL ON public.departments TO service_role;
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- ========== PROFILES ==========
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- ========== USER ROLES ==========
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE OR REPLACE FUNCTION public.is_staff(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('admin','agent'))
$$;

-- ========== COMPLAINTS ==========
CREATE SEQUENCE public.ticket_seq START 1001;

CREATE TABLE public.complaints (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_no text NOT NULL UNIQUE DEFAULT ('TKT-' || nextval('public.ticket_seq')),
  customer_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  description text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  priority public.complaint_priority NOT NULL DEFAULT 'medium',
  status public.complaint_status NOT NULL DEFAULT 'open',
  department_id uuid REFERENCES public.departments(id) ON DELETE SET NULL,
  assigned_agent_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);
GRANT SELECT, INSERT, UPDATE ON public.complaints TO authenticated;
GRANT ALL ON public.complaints TO service_role;
ALTER TABLE public.complaints ENABLE ROW LEVEL SECURITY;

-- ========== ASSIGNMENTS ==========
CREATE TABLE public.assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id uuid NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  department_id uuid NOT NULL REFERENCES public.departments(id) ON DELETE RESTRICT,
  agent_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  assigned_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  note text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.assignments TO authenticated;
GRANT ALL ON public.assignments TO service_role;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

-- ========== LIFECYCLE EVENTS ==========
CREATE TABLE public.complaint_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id uuid NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type text NOT NULL,
  message text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.complaint_events TO authenticated;
GRANT ALL ON public.complaint_events TO service_role;
ALTER TABLE public.complaint_events ENABLE ROW LEVEL SECURITY;

-- ========== NOTIFICATIONS ==========
CREATE TABLE public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  complaint_id uuid REFERENCES public.complaints(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL DEFAULT '',
  read boolean NOT NULL DEFAULT false,
  email_status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ========== POLICIES ==========
CREATE POLICY "departments readable" ON public.departments FOR SELECT TO authenticated USING (true);
CREATE POLICY "admins manage departments" ON public.departments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE POLICY "own profile readable" ON public.profiles FOR SELECT TO authenticated
  USING (id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (id = auth.uid());
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated
  USING (id = auth.uid() OR public.has_role(auth.uid(),'admin'))
  WITH CHECK (id = auth.uid() OR public.has_role(auth.uid(),'admin'));

CREATE POLICY "roles readable" ON public.user_roles FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_staff(auth.uid()));

CREATE POLICY "complaints visible" ON public.complaints FOR SELECT TO authenticated
  USING (customer_id = auth.uid() OR public.is_staff(auth.uid()));
CREATE POLICY "customers create complaints" ON public.complaints FOR INSERT TO authenticated
  WITH CHECK (customer_id = auth.uid());
CREATE POLICY "staff update complaints" ON public.complaints FOR UPDATE TO authenticated
  USING (public.is_staff(auth.uid()) OR customer_id = auth.uid())
  WITH CHECK (public.is_staff(auth.uid()) OR customer_id = auth.uid());

CREATE POLICY "assignments visible" ON public.assignments FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()) OR EXISTS (
    SELECT 1 FROM public.complaints c WHERE c.id = complaint_id AND c.customer_id = auth.uid()));
CREATE POLICY "staff create assignments" ON public.assignments FOR INSERT TO authenticated
  WITH CHECK (public.is_staff(auth.uid()) AND assigned_by = auth.uid());

CREATE POLICY "events visible" ON public.complaint_events FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()) OR EXISTS (
    SELECT 1 FROM public.complaints c WHERE c.id = complaint_id AND c.customer_id = auth.uid()));
CREATE POLICY "events insert" ON public.complaint_events FOR INSERT TO authenticated
  WITH CHECK (actor_id = auth.uid());

CREATE POLICY "own notifications" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "own notifications update" ON public.notifications FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- ========== TRIGGERS ==========
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)), COALESCE(NEW.email,''))
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer') ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Complaint Service -> logs issue, emits event + notification
CREATE OR REPLACE FUNCTION public.on_complaint_created()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.complaint_events (complaint_id, actor_id, event_type, message)
  VALUES (NEW.id, NEW.customer_id, 'created', 'Ticket ' || NEW.ticket_no || ' logged.');
  INSERT INTO public.notifications (user_id, complaint_id, title, body)
  VALUES (NEW.customer_id, NEW.id, 'Ticket ' || NEW.ticket_no || ' created',
          'We received your issue "' || NEW.subject || '" and it is now in the queue.');
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_complaint_created AFTER INSERT ON public.complaints
  FOR EACH ROW EXECUTE FUNCTION public.on_complaint_created();

-- Status / lifecycle changes -> event + notification
CREATE OR REPLACE FUNCTION public.on_complaint_updated()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.updated_at := now();
  IF NEW.status IS DISTINCT FROM OLD.status THEN
    IF NEW.status IN ('resolved','closed') AND NEW.resolved_at IS NULL THEN
      NEW.resolved_at := now();
    END IF;
    INSERT INTO public.complaint_events (complaint_id, actor_id, event_type, message)
    VALUES (NEW.id, auth.uid(), 'status_changed', 'Status changed from ' || OLD.status || ' to ' || NEW.status || '.');
    INSERT INTO public.notifications (user_id, complaint_id, title, body)
    VALUES (NEW.customer_id, NEW.id, 'Ticket ' || NEW.ticket_no || ' is now ' || NEW.status,
            'Your ticket "' || NEW.subject || '" moved to ' || NEW.status || '.');
    IF NEW.assigned_agent_id IS NOT NULL AND NEW.assigned_agent_id <> NEW.customer_id THEN
      INSERT INTO public.notifications (user_id, complaint_id, title, body)
      VALUES (NEW.assigned_agent_id, NEW.id, 'Ticket ' || NEW.ticket_no || ' is now ' || NEW.status,
              'Ticket "' || NEW.subject || '" moved to ' || NEW.status || '.');
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_complaint_updated BEFORE UPDATE ON public.complaints
  FOR EACH ROW EXECUTE FUNCTION public.on_complaint_updated();

-- Assignment Service -> updates complaint, emits event + notifications
CREATE OR REPLACE FUNCTION public.on_assignment_created()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  dept_name text;
  c public.complaints%ROWTYPE;
BEGIN
  SELECT name INTO dept_name FROM public.departments WHERE id = NEW.department_id;
  SELECT * INTO c FROM public.complaints WHERE id = NEW.complaint_id;

  UPDATE public.complaints
     SET department_id = NEW.department_id,
         assigned_agent_id = NEW.agent_id,
         status = CASE WHEN status IN ('open','reopened') THEN 'assigned'::public.complaint_status ELSE status END,
         updated_at = now()
   WHERE id = NEW.complaint_id;

  INSERT INTO public.complaint_events (complaint_id, actor_id, event_type, message)
  VALUES (NEW.complaint_id, NEW.assigned_by, 'assigned', 'Assigned to ' || COALESCE(dept_name,'a department') ||
          CASE WHEN NEW.note <> '' THEN ' — ' || NEW.note ELSE '' END);

  INSERT INTO public.notifications (user_id, complaint_id, title, body)
  VALUES (c.customer_id, NEW.complaint_id, 'Ticket ' || c.ticket_no || ' assigned',
          'Your ticket was routed to ' || COALESCE(dept_name,'a department') || '.');

  IF NEW.agent_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, complaint_id, title, body)
    VALUES (NEW.agent_id, NEW.complaint_id, 'New ticket assigned: ' || c.ticket_no,
            'You have been assigned "' || c.subject || '".');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER trg_assignment_created AFTER INSERT ON public.assignments
  FOR EACH ROW EXECUTE FUNCTION public.on_assignment_created();

-- ========== REALTIME ==========
ALTER PUBLICATION supabase_realtime ADD TABLE public.complaints;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
ALTER PUBLICATION supabase_realtime ADD TABLE public.complaint_events;

-- ========== SEED DEPARTMENTS ==========
INSERT INTO public.departments (code, name, description) VALUES
  ('BILLING', 'Billing & Payments', 'Invoices, refunds, payment failures and subscription issues.'),
  ('TECH', 'Technical Support', 'Outages, defects, performance and integration problems.'),
  ('NETWORK', 'Network Operations', 'Connectivity, latency and infrastructure incidents.'),
  ('ACCOUNT', 'Account Management', 'Access, onboarding, contracts and account changes.'),
  ('LOGISTICS', 'Logistics & Delivery', 'Shipping, delivery delays and damaged goods.');