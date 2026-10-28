-- 003_admin_rbac_and_audit.sql
-- System-level Role-Based Access Control (RBAC), System Audit Logs, and Site Settings

-- 1. System Roles Table
create table if not exists public.system_roles (
  name text primary key,
  label_th text not null,
  description text,
  permissions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- Seed predefined roles
insert into public.system_roles (name, label_th, description, permissions)
values
  ('super_admin', 'ผู้ดูแลระบบสูงสุด', 'จัดการระบบและสิทธิ์ทั้งหมด รวมถึงการตั้งค่าและความปลอดภัย', '["all"]'::jsonb),
  ('admin', 'ผู้ดูแลระบบ', 'จัดการข้อมูล สมาชิก และกลุ่มตามขอบเขตที่ได้รับมอบหมาย', '["users.read", "users.write", "groups.read", "groups.write", "reports.read", "audit.read"]'::jsonb),
  ('editor', 'ผู้จัดการเนื้อหา', 'จัดการเนื้อหา ประกาศ และแบนเนอร์เว็บไซต์', '["content.read", "content.write"]'::jsonb),
  ('support', 'เจ้าหน้าที่ฝ่ายสนับสนุน', 'ตรวจสอบข้อมูลสมาชิกและกลุ่มเพื่อช่วยเหลือการใช้งาน (ห้ามแก้ไขข้อมูลการเงิน)', '["users.read", "groups.read", "audit.read"]'::jsonb),
  ('analyst', 'นักวิเคราะห์ข้อมูล', 'ดูรายงาน สถิติ และส่งออกข้อมูลระบบ', '["reports.read", "reports.export"]'::jsonb)
on conflict (name) do update set
  label_th = excluded.label_th,
  description = excluded.description,
  permissions = excluded.permissions;

-- 2. User System Roles Mapping
create table if not exists public.user_system_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null references public.system_roles(name) on delete restrict,
  assigned_at timestamptz not null default now(),
  assigned_by uuid references auth.users(id),
  primary key (user_id, role)
);

-- 3. System Audit Logs
create table if not exists public.system_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id),
  actor_name text,
  actor_email text,
  action text not null,
  target_type text not null,
  target_id text,
  details jsonb not null default '{}'::jsonb,
  ip_address text,
  user_agent text,
  status text not null default 'success' check (status in ('success', 'failure', 'denied')),
  created_at timestamptz not null default now()
);

create index if not exists idx_system_audit_created_at on public.system_audit_logs(created_at desc);
create index if not exists idx_system_audit_action on public.system_audit_logs(action);
create index if not exists idx_system_audit_actor on public.system_audit_logs(actor_id);

-- 4. Site Settings Table
create table if not exists public.site_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  description text,
  is_public boolean not null default false,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

-- Seed default site settings
insert into public.site_settings (key, value, description, is_public)
values
  ('general', '{"siteName": "หารกัน (HaarKan)", "tagline": "ระบบจัดการแชร์ค่าใช้จ่ายและเคลียร์เงินในกลุ่ม", "contactEmail": "support@haarkan.local", "maintenanceMode": false}'::jsonb, 'การตั้งค่าทั่วไปของเว็บไซต์', true),
  ('announcements', '{"active": false, "title": "", "content": "", "type": "info"}'::jsonb, 'ประกาศแถบข้อความสำหรับผู้ใช้งาน', true),
  ('security', '{"maxLoginAttempts": 5, "sessionTimeoutHours": 24, "requireAdminOtp": false}'::jsonb, 'การตั้งค่านโยบายความปลอดภัย', false)
on conflict (key) do nothing;

-- 5. Helper function to check if current user is system admin
create or replace function public.is_system_admin()
returns boolean language sql stable security definer set search_path=public as $$
  select exists (
    select 1 from public.user_system_roles usr
    where usr.user_id = auth.uid()
      and usr.role in ('super_admin', 'admin')
  );
$$;

-- 6. RLS Policies
alter table public.system_roles enable row level security;
alter table public.user_system_roles enable row level security;
alter table public.system_audit_logs enable row level security;
alter table public.site_settings enable row level security;

-- Only system admins can read/manage user_system_roles
create policy "system admins manage user system roles"
  on public.user_system_roles for all
  using (is_system_admin());

-- Only system admins can read audit logs
create policy "system admins read audit logs"
  on public.system_audit_logs for select
  using (is_system_admin());

-- Anyone can read public site settings; only admins can modify
create policy "anyone read public settings"
  on public.site_settings for select
  using (is_public = true or is_system_admin());

create policy "system admins manage settings"
  on public.site_settings for all
  using (is_system_admin());
