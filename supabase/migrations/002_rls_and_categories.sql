-- 002_rls_and_categories.sql
-- Default expense categories (global defaults where group_id is null)
insert into public.expense_categories (group_id, name_th, is_active, sort_order)
values
  (null, 'อาหาร', true, 1),
  (null, 'น้ำดื่ม', true, 2),
  (null, 'ของใช้ส่วนกลาง', true, 3),
  (null, 'อื่น ๆ', true, 4)
on conflict do nothing;

-- Function to check if the authenticated user is an active member of a group
create or replace function public.is_group_member(p_group_id uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select exists (
    select 1 from public.group_members
    where group_id = p_group_id
      and user_id = auth.uid()
      and status != 'removed'
  );
$$;

-- Function to check if the authenticated user is an admin of a group
create or replace function public.is_group_admin(p_group_id uuid)
returns boolean language sql stable security definer set search_path=public as $$
  select exists (
    select 1 from public.group_members
    where group_id = p_group_id
      and user_id = auth.uid()
      and role = 'admin'
      and status = 'active'
  );
$$;

-- RLS: group_members
create policy "members read group members"
  on public.group_members for select
  using (is_group_member(group_id));

create policy "admins update group members"
  on public.group_members for update
  using (is_group_admin(group_id));

-- RLS: group_invites
create policy "members read group invites"
  on public.group_invites for select
  using (is_group_member(group_id));

-- RLS: expense_categories
create policy "members read categories"
  on public.expense_categories for select
  using (group_id is null or is_group_member(group_id));

create policy "admins manage categories"
  on public.expense_categories for all
  using (group_id is not null and is_group_admin(group_id));

-- RLS: expenses
create policy "members read group expenses"
  on public.expenses for select
  using (is_group_member(group_id));

-- RLS: expense_payers
create policy "members read group expense payers"
  on public.expense_payers for select
  using (
    exists (
      select 1 from public.expenses e
      where e.id = expense_id and is_group_member(e.group_id)
    )
  );

-- RLS: expense_shares
create policy "members read group expense shares"
  on public.expense_shares for select
  using (
    exists (
      select 1 from public.expenses e
      where e.id = expense_id and is_group_member(e.group_id)
    )
  );

-- RLS: payments
create policy "members read group payments"
  on public.payments for select
  using (is_group_member(group_id));

-- RLS: payment_proofs
create policy "participants or admins read proofs"
  on public.payment_proofs for select
  using (
    exists (
      select 1 from public.payments p
      join public.group_members from_m on from_m.id = p.from_member_id
      join public.group_members to_m on to_m.id = p.to_member_id
      where p.id = payment_id
        and (
          from_m.user_id = auth.uid()
          or to_m.user_id = auth.uid()
          or is_group_admin(p.group_id)
        )
    )
  );

-- RLS: audit_logs
create policy "members read group audit logs"
  on public.audit_logs for select
  using (is_group_member(group_id));

-- Stored Procedure: void_expense
create or replace function public.void_expense(
  p_expense_id uuid,
  p_void_reason text
) returns void language plpgsql security definer set search_path=public as $$
declare
  actor uuid := auth.uid();
  exp_record public.expenses%rowtype;
begin
  if actor is null then
    raise exception 'not authenticated' using errcode='42501';
  end if;

  select * into exp_record from public.expenses where id = p_expense_id for update;
  if not found then
    raise exception 'expense not found' using errcode='P0002';
  end if;

  if not is_group_admin(exp_record.group_id) then
    raise exception 'only group admins can void expenses' using errcode='42501';
  end if;

  if exp_record.status = 'voided' then
    raise exception 'expense is already voided' using errcode='23514';
  end if;

  if coalesce(trim(p_void_reason), '') = '' then
    raise exception 'void reason is required' using errcode='23514';
  end if;

  update public.expenses
  set status = 'voided',
      void_reason = trim(p_void_reason)
  where id = p_expense_id;

  insert into public.audit_logs (
    group_id, actor_user_id, entity_type, entity_id, action, before_data, after_data
  ) values (
    exp_record.group_id,
    actor,
    'expense',
    p_expense_id,
    'voided',
    jsonb_build_object('status', 'active', 'total_amount_satang', exp_record.total_amount_satang),
    jsonb_build_object('status', 'voided', 'void_reason', trim(p_void_reason))
  );

  insert into public.notifications (
    user_id, group_id, type, title, body, data
  )
  select distinct gm.user_id, exp_record.group_id, 'expense_voided', 'ยกเลิกรายจ่าย',
         exp_record.title || ' ถูกยกเลิก: ' || trim(p_void_reason),
         jsonb_build_object('expense_id', p_expense_id)
  from public.expense_shares es
  join public.group_members gm on gm.id = es.member_id
  where es.expense_id = p_expense_id and gm.user_id <> actor;
end $$;
