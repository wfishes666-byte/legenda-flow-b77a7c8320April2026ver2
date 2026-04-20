import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import AppLayout from '@/components/AppLayout';
import OutletSelector from '@/components/OutletSelector';
import { useOutlets } from '@/hooks/useOutlets';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { FileText, Plus, Save, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { ExportButtons } from '@/components/ExportButtons';
import { formatRpExport } from '@/lib/exportUtils';

interface FinanceReport {
  id: string;
  user_id: string;
  outlet_id: string | null;
  report_date: string;
  reporter_name: string | null;
  starting_cash: number | null;
  daily_offline_income: number | null;
  online_delivery_sales: number | null;
  shopeefood_sales: number | null;
  gofood_sales: number | null;
  grabfood_sales: number | null;
  ending_physical_cash: number | null;
  ending_qris_cash: number | null;
  total_expense: number | null;
  notes: string | null;
}

const formatRp = (v: number) => `Rp ${(v || 0).toLocaleString('id-ID')}`;

export default function DailyRecapPage() {
  const { user, role } = useAuth();
  const { toast } = useToast();
  const { outlets, selectedOutlet, setSelectedOutlet } = useOutlets();
  const [reports, setReports] = useState<FinanceReport[]>([]);
  const [profiles, setProfiles] = useState<any[]>([]);
  const [submitting, setSubmitting] = useState(false);

  const canManage = role === 'admin' || role === 'management';

  const [form, setForm] = useState({
    report_date: new Date().toISOString().split('T')[0],
    reporter_name: '',
    starting_cash: 0,
    daily_offline_income: 0,
    shopeefood_sales: 0,
    gofood_sales: 0,
    grabfood_sales: 0,
    ending_physical_cash: 0,
    ending_qris_cash: 0,
    total_expense: 0,
    notes: '',
  });

  const fetchData = async () => {
    let query = supabase
      .from('finance_daily_reports')
      .select('*')
      .order('report_date', { ascending: false })
      .limit(300);
    if (selectedOutlet) query = query.eq('outlet_id', selectedOutlet);
    const { data } = await query;
    if (data) setReports(data as FinanceReport[]);
    const { data: p } = await supabase.from('profiles').select('user_id, full_name');
    if (p) setProfiles(p);
  };

  useEffect(() => { fetchData(); }, [role, selectedOutlet]);

  const outletMap = useMemo(() => new Map(outlets.map(o => [o.id, o.name])), [outlets]);
  const profileMap = useMemo(() => new Map(profiles.map((p: any) => [p.user_id, p.full_name])), [profiles]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!selectedOutlet) {
      toast({ title: 'Pilih cabang dulu', variant: 'destructive' });
      return;
    }
    setSubmitting(true);
    const online = form.shopeefood_sales + form.gofood_sales + form.grabfood_sales;
    const { error } = await supabase.from('finance_daily_reports').insert({
      user_id: user.id,
      outlet_id: selectedOutlet,
      report_date: form.report_date,
      reporter_name: form.reporter_name,
      starting_cash: form.starting_cash,
      daily_offline_income: form.daily_offline_income,
      online_delivery_sales: online,
      shopeefood_sales: form.shopeefood_sales,
      gofood_sales: form.gofood_sales,
      grabfood_sales: form.grabfood_sales,
      ending_physical_cash: form.ending_physical_cash,
      ending_qris_cash: form.ending_qris_cash,
      total_expense: form.total_expense,
      notes: form.notes,
    });
    setSubmitting(false);
    if (error) {
      toast({ title: 'Gagal simpan', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Tersimpan', description: 'Laporan harian finance ditambahkan.' });
    setForm({
      report_date: new Date().toISOString().split('T')[0],
      reporter_name: '',
      starting_cash: 0, daily_offline_income: 0,
      shopeefood_sales: 0, gofood_sales: 0, grabfood_sales: 0,
      ending_physical_cash: 0, ending_qris_cash: 0, total_expense: 0,
      notes: '',
    });
    fetchData();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Hapus laporan ini?')) return;
    const { error } = await supabase.from('finance_daily_reports').delete().eq('id', id);
    if (error) {
      toast({ title: 'Gagal hapus', description: error.message, variant: 'destructive' });
      return;
    }
    toast({ title: 'Dihapus' });
    fetchData();
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold font-sans flex items-center gap-3">
              <FileText className="w-7 h-7" /> Laporan Harian Finance
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Data finance internal — terpisah dari Laporan Harian Outlet (input crew).
            </p>
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            <OutletSelector outlets={outlets} selectedOutlet={selectedOutlet} onSelect={setSelectedOutlet} />
            <ExportButtons
              filename={`laporan-harian-finance-${format(new Date(), 'yyyy-MM-dd')}`}
              title="Laporan Harian Finance"
              orientation="landscape"
              columns={[
                { header: 'Tanggal', accessor: 'report_date' },
                { header: 'Cabang', accessor: (r: any) => outletMap.get(r.outlet_id) || '-' },
                { header: 'Pelapor', accessor: (r: any) => r.reporter_name || profileMap.get(r.user_id) || '-' },
                { header: 'Kas Awal', accessor: (r: any) => formatRpExport(r.starting_cash) },
                { header: 'Offline', accessor: (r: any) => formatRpExport(r.daily_offline_income) },
                { header: 'Online', accessor: (r: any) => formatRpExport(r.online_delivery_sales) },
                { header: 'Kas Fisik', accessor: (r: any) => formatRpExport(r.ending_physical_cash) },
                { header: 'QRIS', accessor: (r: any) => formatRpExport(r.ending_qris_cash) },
                { header: 'Pengeluaran', accessor: (r: any) => formatRpExport(r.total_expense) },
              ]}
              rows={reports}
            />
          </div>
        </div>

        <Tabs defaultValue="recap" className="w-full">
          <TabsList>
            <TabsTrigger value="recap">Rekap</TabsTrigger>
            {canManage && <TabsTrigger value="input">Input Manual</TabsTrigger>}
          </TabsList>

          <TabsContent value="recap" className="mt-4">
            <Card className="glass-card">
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border text-left text-muted-foreground">
                        <th className="p-3 font-medium">Tanggal</th>
                        <th className="p-3 font-medium">Cabang</th>
                        <th className="p-3 font-medium">Pelapor</th>
                        <th className="p-3 font-medium">Kas Awal</th>
                        <th className="p-3 font-medium">Offline</th>
                        <th className="p-3 font-medium">Online</th>
                        <th className="p-3 font-medium">Kas Fisik</th>
                        <th className="p-3 font-medium">QRIS</th>
                        <th className="p-3 font-medium">Pengeluaran</th>
                        <th className="p-3 font-medium">Selisih</th>
                        {canManage && <th className="p-3 font-medium" />}
                      </tr>
                    </thead>
                    <tbody>
                      {reports.map((r) => {
                        const totalIncome = (r.daily_offline_income || 0) + (r.online_delivery_sales || 0);
                        const totalCash = (r.ending_physical_cash || 0) + (r.ending_qris_cash || 0);
                        const expected = (r.starting_cash || 0) + totalIncome - (r.total_expense || 0);
                        const diff = totalCash - expected;
                        return (
                          <tr key={r.id} className="border-b border-border/50 hover:bg-muted/30">
                            <td className="p-3">{r.report_date}</td>
                            <td className="p-3">{outletMap.get(r.outlet_id || '') || '-'}</td>
                            <td className="p-3">{r.reporter_name || profileMap.get(r.user_id) || '-'}</td>
                            <td className="p-3">{formatRp(r.starting_cash || 0)}</td>
                            <td className="p-3">{formatRp(r.daily_offline_income || 0)}</td>
                            <td className="p-3">{formatRp(r.online_delivery_sales || 0)}</td>
                            <td className="p-3">{formatRp(r.ending_physical_cash || 0)}</td>
                            <td className="p-3">{formatRp(r.ending_qris_cash || 0)}</td>
                            <td className="p-3">{formatRp(r.total_expense || 0)}</td>
                            <td className="p-3">
                              <Badge variant={diff === 0 ? 'default' : diff > 0 ? 'secondary' : 'destructive'}>
                                {diff >= 0 ? '+' : ''}{formatRp(diff)}
                              </Badge>
                            </td>
                            {canManage && (
                              <td className="p-3">
                                <Button size="icon" variant="ghost" onClick={() => handleDelete(r.id)}>
                                  <Trash2 className="w-4 h-4 text-destructive" />
                                </Button>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                      {reports.length === 0 && (
                        <tr><td colSpan={canManage ? 11 : 10} className="p-8 text-center text-muted-foreground">Belum ada laporan finance.</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {canManage && (
            <TabsContent value="input" className="mt-4">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="w-5 h-5" /> Input Laporan Harian Finance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Tanggal</Label>
                      <Input type="date" value={form.report_date} onChange={(e) => setForm({ ...form, report_date: e.target.value })} required />
                    </div>
                    <div>
                      <Label>Nama Pelapor</Label>
                      <Input value={form.reporter_name} onChange={(e) => setForm({ ...form, reporter_name: e.target.value })} />
                    </div>
                    <div>
                      <Label>Kas Awal</Label>
                      <Input type="number" value={form.starting_cash} onChange={(e) => setForm({ ...form, starting_cash: Number(e.target.value) })} />
                    </div>
                    <div>
                      <Label>Pemasukan Offline (Dine-in)</Label>
                      <Input type="number" value={form.daily_offline_income} onChange={(e) => setForm({ ...form, daily_offline_income: Number(e.target.value) })} />
                    </div>
                    <div>
                      <Label>ShopeeFood</Label>
                      <Input type="number" value={form.shopeefood_sales} onChange={(e) => setForm({ ...form, shopeefood_sales: Number(e.target.value) })} />
                    </div>
                    <div>
                      <Label>GoFood</Label>
                      <Input type="number" value={form.gofood_sales} onChange={(e) => setForm({ ...form, gofood_sales: Number(e.target.value) })} />
                    </div>
                    <div>
                      <Label>GrabFood</Label>
                      <Input type="number" value={form.grabfood_sales} onChange={(e) => setForm({ ...form, grabfood_sales: Number(e.target.value) })} />
                    </div>
                    <div>
                      <Label>Total Pengeluaran</Label>
                      <Input type="number" value={form.total_expense} onChange={(e) => setForm({ ...form, total_expense: Number(e.target.value) })} />
                    </div>
                    <div>
                      <Label>Kas Fisik Akhir</Label>
                      <Input type="number" value={form.ending_physical_cash} onChange={(e) => setForm({ ...form, ending_physical_cash: Number(e.target.value) })} />
                    </div>
                    <div>
                      <Label>QRIS Akhir</Label>
                      <Input type="number" value={form.ending_qris_cash} onChange={(e) => setForm({ ...form, ending_qris_cash: Number(e.target.value) })} />
                    </div>
                    <div className="md:col-span-2">
                      <Label>Catatan</Label>
                      <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                    </div>
                    <div className="md:col-span-2">
                      <Button type="submit" disabled={submitting} className="w-full md:w-auto">
                        <Save className="w-4 h-4 mr-2" /> {submitting ? 'Menyimpan...' : 'Simpan Laporan'}
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </AppLayout>
  );
}
