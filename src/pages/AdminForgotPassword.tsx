import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Mail, ArrowLeft, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { API_BASE } from '@/lib/apiClient';
import logo from '@/assets/logo.jpeg';

const AdminForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Failed to send reset email');
      setSent(true);
      toast({
        title: 'Check your email',
        description: 'If the address is registered, a reset link has been sent.',
      });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-sm-black p-4">
      <Card className="w-full max-w-md border-0 shadow-2xl">
        <CardHeader className="text-center pb-2">
          <img src={logo} alt="S. M. Trade International" className="w-16 h-16 rounded-full mx-auto mb-4 object-cover" />
          <CardTitle className="text-2xl">Forgot Password</CardTitle>
          <p className="text-muted-foreground text-sm mt-1">Enter your admin email to receive a reset link</p>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="space-y-4 text-center">
              <p className="text-sm text-muted-foreground">
                If <strong>{email}</strong> is registered, you'll receive an email with a reset link shortly.
                The link is valid for 1 hour.
              </p>
              <Link to="/admin/login" className="inline-flex items-center text-sm text-sm-red hover:underline">
                <ArrowLeft className="h-4 w-4 mr-1" /> Back to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="Admin email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="pl-10"
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-sm-red hover:bg-[hsl(var(--sm-red-dark))] text-white" disabled={loading}>
                {loading ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending...</>) : 'Send Reset Link'}
              </Button>
              <div className="text-center">
                <Link to="/admin/login" className="inline-flex items-center text-sm text-muted-foreground hover:text-sm-red">
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back to login
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminForgotPassword;
