-- ShiftSense demo seed — run in Supabase Dashboard → SQL → New query
-- Uses the first venue if one exists; otherwise creates org + venue "Atelier V, Indore".
-- Safe to re-run: skips when sales_facts already exist for that venue.

do $$
declare
  v_org uuid;
  v_venue uuid;
  v_tz text := 'Asia/Kolkata';
  v_role_waiter uuid;
  v_role_host uuid;
  v_staff_1 uuid;
  v_staff_2 uuid;
  v_rec uuid;
  v_day timestamptz;
  v_hour timestamptz;
  h int;
  d int;
  v_covers numeric;
begin
  select id, organization_id into v_venue, v_org from public.venues order by created_at limit 1;

  if v_venue is null then
    v_org := gen_random_uuid();
    v_venue := gen_random_uuid();
    insert into public.organizations (id, name) values (v_org, 'Atelier V Hospitality');
    insert into public.venues (
      id, organization_id, name, venue_type, timezone, country_code, city,
      latitude, longitude, capacity, currency, opening_hour, closing_hour
    ) values (
      v_venue, v_org, 'Atelier V', 'restaurant', v_tz, 'IN', 'Indore',
      22.7196, 75.8577, 80, 'INR', 12, 23
    );
    raise notice 'Created organization % and venue %', v_org, v_venue;
  else
    raise notice 'Using existing venue % (org %)', v_venue, v_org;
  end if;

  if exists (select 1 from public.sales_facts where venue_id = v_venue limit 1) then
    raise notice 'Venue already has sales_facts — seed skipped. Delete rows or use another venue to re-seed.';
    return;
  end if;

  -- Roles
  insert into public.venue_role_config (id, venue_id, role, department, metric, covers_per_staff_hour, hourly_cost, enabled, is_custom)
  values
    (gen_random_uuid(), v_venue, 'Restaurant manager', 'Floor', 'covers', 200, 26, true, false),
    (gen_random_uuid(), v_venue, 'Head waiter', 'Floor', 'covers', 40, 18, true, false),
    (gen_random_uuid(), v_venue, 'Waiter', 'Floor', 'covers', 18, 15, true, false),
    (gen_random_uuid(), v_venue, 'Host', 'Floor', 'covers', 60, 15, true, false),
    (gen_random_uuid(), v_venue, 'Head chef', 'Kitchen', 'orders', 80, 28, true, false)
  on conflict (venue_id, role) do nothing;

  select id into v_role_waiter from public.venue_role_config where venue_id = v_venue and role = 'Waiter' limit 1;
  select id into v_role_host from public.venue_role_config where venue_id = v_venue and role = 'Host' limit 1;

  v_staff_1 := gen_random_uuid();
  v_staff_2 := gen_random_uuid();
  insert into public.staff (id, venue_id, name, role, hourly_cost, max_weekly_hours, skills)
  values
    (v_staff_1, v_venue, 'Priya Sharma', 'Waiter', 15, 40, array['Waiter']),
    (v_staff_2, v_venue, 'Arjun Mehta', 'Host', 15, 38, array['Host']),
    (gen_random_uuid(), v_venue, 'Neha Patel', 'Waiter', 15, 40, array['Waiter']),
    (gen_random_uuid(), v_venue, 'Rohan Singh', 'Head chef', 28, 45, array['Head chef']),
    (gen_random_uuid(), v_venue, 'Ananya Rao', 'Restaurant manager', 26, 42, array['Restaurant manager']);

  -- 21 days of hourly sales (history for forecast)
  for d in -21..-1 loop
    v_day := (date_trunc('day', now() at time zone v_tz) + (d || ' days')::interval) at time zone v_tz;
    for h in 12..22 loop
      v_hour := v_day + (h || ' hours')::interval;
      v_covers := 24 + (abs(extract(dow from v_day)::int - 3) * 4) + case when h between 19 and 21 then 18 else 0 end;
      insert into public.sales_facts (id, venue_id, ts, channel, covers, order_count, order_value)
      values (gen_random_uuid(), v_venue, v_hour, 'dine-in', v_covers::int, greatest(1, (v_covers * 0.9)::int), (v_covers * 850)::numeric);
    end loop;
  end loop;

  insert into public.reservations (id, venue_id, slot_start, party_size, status, source)
  values
    (gen_random_uuid(), v_venue, ((date_trunc('day', now() at time zone v_tz) + interval '2 days') at time zone v_tz) + interval '13 hours', 18, 'confirmed', 'phone'),
    (gen_random_uuid(), v_venue, ((date_trunc('day', now() at time zone v_tz) + interval '2 days') at time zone v_tz) + interval '20 hours', 36, 'confirmed', 'website'),
    (gen_random_uuid(), v_venue, ((date_trunc('day', now() at time zone v_tz) + interval '4 days') at time zone v_tz) + interval '21 hours', 12, 'confirmed', 'walk-in'),
    (gen_random_uuid(), v_venue, ((date_trunc('day', now() at time zone v_tz) + interval '5 days') at time zone v_tz) + interval '20 hours', 45, 'confirmed', 'corporate'),
    (gen_random_uuid(), v_venue, ((date_trunc('day', now() at time zone v_tz) + interval '6 days') at time zone v_tz) + interval '13 hours', 22, 'confirmed', 'website');

  insert into public.external_signals (id, venue_id, kind, starts_at, ends_at, label, impact_multiplier, payload)
  values
    (gen_random_uuid(), v_venue, 'event', ((date_trunc('day', now() at time zone v_tz) + interval '5 days') at time zone v_tz) + interval '18 hours',
     ((date_trunc('day', now() at time zone v_tz) + interval '5 days') at time zone v_tz) + interval '23 hours', 'Corporate dinner', 1.35, '{"partySize":45}'::jsonb),
    (gen_random_uuid(), v_venue, 'holiday', date_trunc('day', now() at time zone v_tz) at time zone v_tz,
     (date_trunc('day', now() at time zone v_tz) + interval '1 day') at time zone v_tz, 'Local festival', 1.2, '{}'::jsonb),
    (gen_random_uuid(), v_venue, 'weather', now(), now() + interval '6 hours', 'Light rain', 0.92, '{"code":61}'::jsonb);

  -- Shifts (next 3 days)
  insert into public.shifts (id, venue_id, staff_id, staff_name, role, starts_at, ends_at, status)
  values
    (gen_random_uuid(), v_venue, v_staff_1, 'Priya Sharma', 'Waiter',
     ((date_trunc('day', now() at time zone v_tz) + interval '1 day') at time zone v_tz) + interval '12 hours',
     ((date_trunc('day', now() at time zone v_tz) + interval '1 day') at time zone v_tz) + interval '20 hours', 'published'),
    (gen_random_uuid(), v_venue, v_staff_2, 'Arjun Mehta', 'Host',
     ((date_trunc('day', now() at time zone v_tz) + interval '1 day') at time zone v_tz) + interval '12 hours',
     ((date_trunc('day', now() at time zone v_tz) + interval '1 day') at time zone v_tz) + interval '22 hours', 'published');

  -- Forecasts + recommendations (next 7 days, lunch peak sample)
  for d in 0..6 loop
    v_day := (date_trunc('day', now() at time zone v_tz) + (d || ' days')::interval) at time zone v_tz;
    for h in 12..22 loop
      v_hour := v_day + (h || ' hours')::interval;
      v_covers := 26 + case when h between 13 and 14 then 8 when h between 19 and 21 then 14 else 0 end
        + case when extract(dow from v_day)::int in (0, 6) then 6 else 0 end;
      insert into public.forecasts (id, venue_id, hour_start, metric, predicted, lower, upper, model_version, drivers)
      values
        (gen_random_uuid(), v_venue, v_hour, 'covers', v_covers, v_covers * 0.85, v_covers * 1.15, 'wcma-v1', '{"history":true}'::jsonb),
        (gen_random_uuid(), v_venue, v_hour, 'orders', v_covers * 0.9, v_covers * 0.75, v_covers * 1.05, 'wcma-v1', '{}'::jsonb)
      on conflict (venue_id, hour_start, metric) do update set predicted = excluded.predicted;
    end loop;
  end loop;

  insert into public.recommendations (
    id, venue_id, hour_start, role, required, scheduled, delta, cost_impact, hourly_cost, predicted_covers, reasons, status
  ) values (
    gen_random_uuid(), v_venue,
    ((date_trunc('day', now() at time zone v_tz) + interval '2 days') at time zone v_tz) + interval '20 hours',
    'Waiter', 6, 4, 2, 120, 15, 38,
    '[{"code":"demand","label":"Saturday dinner peak"}]'::jsonb, 'pending'
  ) returning id into v_rec;

  update public.recommendations set status = 'accepted' where id = v_rec;

  insert into public.recommendations (
    id, venue_id, hour_start, role, required, scheduled, delta, cost_impact, hourly_cost, predicted_covers, reasons, status
  ) values (
    gen_random_uuid(), v_venue,
    ((date_trunc('day', now() at time zone v_tz) + interval '5 days') at time zone v_tz) + interval '20 hours',
    'Host', 2, 1, 1, 15, 15, 45,
    '[{"code":"event","label":"Corporate dinner"}]'::jsonb, 'pending'
  );

  insert into public.recommendation_actions (id, recommendation_id, action, edited_required, notes)
  values (gen_random_uuid(), v_rec, 'accepted', null, 'Seeded demo action');

  insert into public.alerts (id, venue_id, severity, message, read_at)
  values
    (gen_random_uuid(), v_venue, 'high', 'Waiter short by 2 on upcoming Saturday dinner', null),
    (gen_random_uuid(), v_venue, 'medium', 'Host short by 1 during corporate event window', null),
    (gen_random_uuid(), v_venue, 'low', 'Forecast refreshed with festival multiplier', now());

  insert into public.import_jobs (id, venue_id, filename, kind, mapping, status, row_count, errors, storage_path)
  values
    (gen_random_uuid(), v_venue, 'sales-sample.csv', 'sales', '{"timestamp":"timestamp","covers":"covers"}'::jsonb, 'completed', 7, '[]'::jsonb, null),
    (gen_random_uuid(), v_venue, 'reservations-sample.csv', 'reservations', '{"timestamp":"timestamp","partySize":"party_size"}'::jsonb, 'completed', 3, '[]'::jsonb, null);

  raise notice 'Demo seed complete for venue %', v_venue;
end $$;

-- Quick counts
select 'organizations' as table_name, count(*) from public.organizations
union all select 'venues', count(*) from public.venues
union all select 'venue_role_config', count(*) from public.venue_role_config
union all select 'staff', count(*) from public.staff
union all select 'shifts', count(*) from public.shifts
union all select 'sales_facts', count(*) from public.sales_facts
union all select 'reservations', count(*) from public.reservations
union all select 'external_signals', count(*) from public.external_signals
union all select 'forecasts', count(*) from public.forecasts
union all select 'recommendations', count(*) from public.recommendations
union all select 'recommendation_actions', count(*) from public.recommendation_actions
union all select 'alerts', count(*) from public.alerts
union all select 'import_jobs', count(*) from public.import_jobs;
