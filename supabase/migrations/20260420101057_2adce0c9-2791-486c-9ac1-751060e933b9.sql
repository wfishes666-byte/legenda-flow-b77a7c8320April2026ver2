
CREATE TABLE public.finance_daily_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  outlet_id uuid REFERENCES public.outlets(id) ON DELETE SET NULL,
  report_date date NOT NULL DEFAULT CURRENT_DATE,
  reporter_name text DEFAULT '',
  starting_cash numeric DEFAULT 0,
  daily_offline_income numeric DEFAULT 0,
  online_delivery_sales numeric DEFAULT 0,
  shopeefood_sales numeric DEFAULT 0,
  gofood_sales numeric DEFAULT 0,
  grabfood_sales numeric DEFAULT 0,
  ending_physical_cash numeric DEFAULT 0,
  ending_qris_cash numeric DEFAULT 0,
  total_expense numeric DEFAULT 0,
  notes text DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_finance_daily_reports_outlet_date ON public.finance_daily_reports(outlet_id, report_date DESC);
CREATE INDEX idx_finance_daily_reports_date ON public.finance_daily_reports(report_date DESC);

ALTER TABLE public.finance_daily_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin full access finance_daily_reports"
  ON public.finance_daily_reports FOR ALL
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Management full access finance_daily_reports"
  ON public.finance_daily_reports FOR ALL
  USING (public.has_role(auth.uid(), 'management'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'management'::public.app_role));

CREATE POLICY "PIC view finance_daily_reports (own outlet)"
  ON public.finance_daily_reports FOR SELECT
  USING (public.has_role(auth.uid(), 'pic'::public.app_role) AND public.pic_can_access_outlet(outlet_id));

CREATE POLICY "PIC insert finance_daily_reports (own outlet)"
  ON public.finance_daily_reports FOR INSERT
  WITH CHECK (public.has_role(auth.uid(), 'pic'::public.app_role) AND public.pic_can_access_outlet(outlet_id));

CREATE POLICY "PIC update finance_daily_reports (own outlet)"
  ON public.finance_daily_reports FOR UPDATE
  USING (public.has_role(auth.uid(), 'pic'::public.app_role) AND public.pic_can_access_outlet(outlet_id));

CREATE TRIGGER trg_finance_daily_reports_updated_at
  BEFORE UPDATE ON public.finance_daily_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
