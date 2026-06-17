import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { toast } from '@/hooks/use-toast';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      toast({ title: 'Введите логин и пароль', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const r = await api<{ ok: boolean; username?: string }>('user_login', { username, password });
      if (r.ok && r.username) {
        login(r.username);
        navigate('/');
      } else {
        toast({ title: 'Неверный логин или пароль', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'Ошибка соединения', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm bg-card border border-border rounded-sm p-8 animate-fade-up"
      >
        <div className="flex h-14 w-14 items-center justify-center bg-foreground rounded-sm overflow-hidden p-2 mb-6">
          <img
            src="https://cdn.poehali.dev/projects/c00b6d94-7991-4278-a41e-54f2a348ad20/bucket/480fcb47-c795-4ae7-a82c-ab902467d38c.png"
            alt="СтройКонтроль"
            className="w-full h-full object-contain invert"
          />
        </div>

        <h1 className="font-display text-2xl font-600 uppercase tracking-wide mb-1">
          СтройКонтроль
        </h1>
        <p className="text-sm text-muted-foreground font-mono mb-7">
          войдите, чтобы продолжить
        </p>

        <div className="space-y-3">
          <div>
            <label className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground block mb-1">
              Логин
            </label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="your.login"
              className="h-11"
              autoFocus
              autoComplete="username"
            />
          </div>
          <div>
            <label className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground block mb-1">
              Пароль
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="h-11"
              autoComplete="current-password"
            />
          </div>
        </div>

        <Button
          type="submit"
          disabled={loading}
          className="w-full h-12 mt-6 bg-foreground text-primary-foreground hover:opacity-90 font-display uppercase tracking-wider rounded-sm text-base"
        >
          {loading ? (
            <Icon name="Loader" size={18} className="mr-2 animate-spin" />
          ) : (
            <Icon name="LogIn" size={18} className="mr-2" />
          )}
          {loading ? 'Вхожу…' : 'Войти'}
        </Button>
      </form>
    </div>
  );
};

export default Login;
