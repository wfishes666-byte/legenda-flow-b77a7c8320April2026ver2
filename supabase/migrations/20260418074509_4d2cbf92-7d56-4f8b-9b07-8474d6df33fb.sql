
-- Generic activity logging trigger for data changes across the app.
-- Captures inserts/updates/deletes on key business tables, with the actor's name and role.

CREATE OR REPLACE FUNCTION public.log_table_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_name text := 'System';
  v_role text := 'system';
  v_module text := TG_ARGV[0];
  v_action text;
  v_desc text;
  v_record_id text;
BEGIN
  IF v_user IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  SELECT COALESCE(p.full_name, '') INTO v_name FROM public.profiles p WHERE p.user_id = v_user LIMIT 1;
  IF v_name IS NULL OR v_name = '' THEN v_name := 'Unknown'; END IF;

  SELECT r.role::text INTO v_role FROM public.user_roles r WHERE r.user_id = v_user LIMIT 1;
  IF v_role IS NULL THEN v_role := 'crew'; END IF;

  IF TG_OP = 'INSERT' THEN
    v_action := 'Tambah Data';
    v_record_id := NEW.id::text;
    v_desc := 'Menambahkan data baru pada ' || v_module;
  ELSIF TG_OP = 'UPDATE' THEN
    v_action := 'Ubah Data';
    v_record_id := NEW.id::text;
    v_desc := 'Memperbarui data pada ' || v_module;
  ELSIF TG_OP = 'DELETE' THEN
    v_action := 'Hapus Data';
    v_record_id := OLD.id::text;
    v_desc := 'Menghapus data pada ' || v_module;
  END IF;

  INSERT INTO public.activity_logs (user_id, user_name, user_role, module, action, description, metadata)
  VALUES (
    v_user, v_name, v_role, v_module, v_action, v_desc,
    jsonb_build_object('table', TG_TABLE_NAME, 'record_id', v_record_id, 'op', TG_OP)
  );

  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Helper to (re)create triggers
DO $$
DECLARE
  t record;
  trig_name text;
BEGIN
  FOR t IN
    SELECT * FROM (VALUES
      ('attendance', 'Absensi'),
      ('attendance_logs', 'Check In/Out'),
      ('cashbon', 'Cashbon'),
      ('content_plans', 'Konten Marketing'),
      ('daily_sales', 'Penjualan Harian'),
      ('expense_items', 'Pengeluaran'),
      ('financial_reports', 'Laporan Keuangan'),
      ('inventory', 'Inventaris'),
      ('invoices', 'Invoice'),
      ('invoice_items', 'Item Invoice'),
      ('item_catalog', 'Katalog Barang'),
      ('leave_requests', 'Pengajuan Cuti'),
      ('outlets', 'Outlet'),
      ('payroll', 'Penggajian'),
      ('performance_reviews', 'Penilaian Kinerja'),
      ('profiles', 'Profil Karyawan'),
      ('punishments', 'Punishment'),
      ('recipes', 'Resep'),
      ('sp_history', 'Surat Peringatan'),
      ('user_roles', 'Hak Akses')
    ) AS x(tbl_name, module_label)
  LOOP
    trig_name := 'trg_log_' || t.tbl_name;
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', trig_name, t.tbl_name);
    EXECUTE format(
      'CREATE TRIGGER %I AFTER INSERT OR UPDATE OR DELETE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.log_table_activity(%L)',
      trig_name, t.tbl_name, t.module_label
    );
  END LOOP;
END$$;
