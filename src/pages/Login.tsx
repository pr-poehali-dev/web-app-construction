import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [locked, setLocked] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!username || !password) {
      setError('Введите логин и пароль');
      return;
    }
    setLoading(true);
    try {
      const r = await api<{ ok: boolean; username?: string; is_admin?: boolean; locked?: boolean; error?: string }>('user_login', { username, password });
      if (r.ok && r.username) {
        login(r.username, r.is_admin ?? false);
        navigate('/');
      } else {
        setLocked(!!r.locked);
        setError(r.error || 'Неверный логин или пароль');
      }
    } catch {
      setError('Ошибка соединения, попробуйте позже');
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
              onChange={(e) => { setUsername(e.target.value); setError(''); setLocked(false); }}
              placeholder="your.login"
              className="h-11"
              autoFocus
              autoComplete="username"
              disabled={locked}
            />
          </div>
          <div>
            <label className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground block mb-1">
              Пароль
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); setLocked(false); }}
              placeholder="••••••••"
              className="h-11"
              autoComplete="current-password"
              disabled={locked}
            />
          </div>
        </div>

        {/* Сообщение об ошибке / блокировке */}
        {error && (
          <div className={`mt-4 flex items-start gap-2.5 rounded-sm px-3 py-2.5 text-sm font-mono ${
            locked
              ? 'bg-red-950/40 border border-red-800 text-red-300'
              : 'bg-destructive/10 border border-destructive/30 text-destructive'
          }`}>
            <Icon name={locked ? 'ShieldOff' : 'AlertCircle'} size={15} className="mt-0.5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <Button
          type="submit"
          disabled={loading || locked}
          className="w-full h-12 mt-5 bg-foreground text-primary-foreground hover:opacity-90 font-display uppercase tracking-wider rounded-sm text-base disabled:opacity-40"
        >
          {loading ? (
            <Icon name="Loader" size={18} className="mr-2 animate-spin" />
          ) : locked ? (
            <Icon name="Lock" size={18} className="mr-2" />
          ) : (
            <Icon name="LogIn" size={18} className="mr-2" />
          )}
          {loading ? 'Вхожу…' : locked ? 'Заблокировано' : 'Войти'}
        </Button>
      </form>
    </div>
  );
};

export default Login;
