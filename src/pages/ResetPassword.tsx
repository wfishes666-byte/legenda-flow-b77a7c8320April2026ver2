import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, AlertCircle } from 'lucide-react';
import logoKop from '@/assets/logo-dua-legenda.png';

type Status = 'verifying' | 'invalid' | 'ready' | 'submitting' | 'success';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [status, setStatus] = useState<Status>('verifying');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();

  // Verifikasi token saat halaman dibuka
  useEffect(() => {
    if (!token) {
      setStatus('invalid');
      setErrorMsg('Token tidak ditemukan di URL.');
      return;
    }
    (async () => {
      const { data, error } = await supabase.functions.invoke('reset-password-with-token', {
        body: { token, mode: 'verify' },
      });
      if (error || (data as any)?.error) {
        setStatus('invalid');
        setErrorMsg((data as any)?.error || error?.message || 'Link tidak valid.');
        return;
      }
      setEmail((data as any).email || '');
      setStatus('ready');
    })();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast({ title: 'Password terlalu pendek', description: 'Minimal 6 karakter', variant: 'destructive' });
      return;
    }
    if (password !== confirm) {
      toast({ title: 'Password tidak cocok', description: 'Konfirmasi password berbeda', variant: 'destructive' });
      return;
    }
    setStatus('submitting');
    const { data, error } = await supabase.functions.invoke('reset-password-with-token', {
      body: { token, new_password: password },
    });
    if (error || (data as any)?.error) {
      toast({
        title: 'Gagal reset password',
        description: (data as any)?.error || error?.message || 'Terjadi kesalahan',
        variant: 'destructive',
      });
      setStatus('ready');
      return;
    }
    setStatus('success');
    toast({ title: 'Berhasil!', description: 'Password baru telah disimpan. Silakan login.' });
    setTimeout(() => navigate('/login', { replace: true }), 1500);
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4 bg-neutral-950">
      <Card className="relative w-full max-w-md shadow-2xl border-border/50 backdrop-blur-sm bg-card/95">
        <CardHeader className="text-center space-y-3">
          <div className="flex justify-center">
            <img src={logoKop} alt="Dua Legenda" className="max-h-20 w-auto object-contain dark:invert" />
          </div>
          <CardDescription className="text-muted-foreground">
            Buat password baru Anda
          </CardDescription>
        </CardHeader>
        <CardContent>
          {status === 'verifying' && (
            <div className="text-center text-sm text-muted-foreground py-6">
              <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2" />
              Memverifikasi link reset...
            </div>
          )}

          {status === 'invalid' && (
            <div className="space-y-4">
              <div className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive flex gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold">Link tidak valid</p>
                  <p className="opacity-90">{errorMsg}</p>
                </div>
              </div>
              <Button variant="outline" className="w-full" onClick={() => navigate('/forgot-password')}>
                Minta Link Baru
              </Button>
            </div>
          )}

          {(status === 'ready' || status === 'submitting') && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {email && (
                <p className="text-xs text-muted-foreground">
                  Akun: <span className="font-semibold text-foreground">{email}</span>
                </p>
              )}
              <div className="space-y-2">
                <Label htmlFor="password">Password Baru</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  required
                  minLength={6}
                  disabled={status === 'submitting'}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm">Konfirmasi Password</Label>
                <Input
                  id="confirm"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  placeholder="Ulangi password baru"
                  required
                  minLength={6}
                  disabled={status === 'submitting'}
                />
              </div>
              <Button type="submit" className="w-full h-11" disabled={status === 'submitting'}>
                {status === 'submitting' ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Menyimpan...</>
                ) : (
                  'Simpan Password Baru'
                )}
              </Button>
            </form>
          )}

          {status === 'success' && (
            <div className="text-center text-sm text-muted-foreground py-6 space-y-2">
              <p className="text-foreground font-semibold">Password berhasil diubah!</p>
              <p>Mengalihkan ke halaman login...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
