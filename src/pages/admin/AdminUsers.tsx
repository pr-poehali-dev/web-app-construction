import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Section, Lbl } from './AdminShared';

interface AppUser {
  id: number;
  username: string;
  is_admin: boolean;
  created_at?: string;
}

const AdminUsers = () => {
  const [users, setUsers] = useState<AppUser[]>([]);
  const [newLogin, setNewLogin] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [adding, setAdding] = useState(false);
  const [changePwd, setChangePwd] = useState<Record<number, string>>({});
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  const load = () => {
    api<{ users: AppUser[] }>('list_users').then((d) => setUsers(d.users || []));
  };

  useEffect(() => { load(); }, []);

  const addUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdding(true);
    const r = await api<{ ok: boolean; error?: string }>('add_user', {
      username: newLogin.trim(),
      password: newPwd,
    });
    if (r.ok) {
      toast({ title: 'Пользователь добавлен', description: newLogin });
      setNewLogin('');
      setNewPwd('');
      load();
    } else {
      toast({ title: r.error || 'Ошибка', variant: 'destructive' });
    }
    setAdding(false);
  };

  const changePassword = async (u: AppUser) => {
    const pwd = changePwd[u.id] || '';
    if (pwd.length < 4) {
      toast({ title: 'Пароль слишком короткий', variant: 'destructive' });
      return;
    }
    await api('change_user_password', { id: u.id, password: pwd });
    toast({ title: 'Пароль изменён', description: u.username });
    setChangePwd((p) => ({ ...p, [u.id]: '' }));
  };

  const toggleAdmin = async (u: AppUser) => {
    const r = await api<{ ok: boolean; is_admin: boolean }>('toggle_admin', { id: u.id });
    if (r.ok) {
      setUsers((prev) => prev.map((x) => x.id === u.id ? { ...x, is_admin: r.is_admin } : x));
      toast({ title: r.is_admin ? `${u.username} — теперь администратор` : `${u.username} — права сняты` });
    }
  };

  const deleteUser = async (id: number) => {
    await api('delete_user', { id });
    setUsers((p) => p.filter((u) => u.id !== id));
    setConfirmDelete(null);
    toast({ title: 'Пользователь удалён' });
  };

  return (
    <Section title="Пользователи системы" icon="Users">
      <div className="space-y-2 mb-5">
        {users.length === 0 && (
          <p className="text-sm text-muted-foreground">Пользователей нет.</p>
        )}
        {users.map((u) => (
          <div key={u.id} className="border border-border rounded-sm overflow-hidden">
            <div className="flex items-center bg-background px-4 py-2.5 gap-3">
              <Icon name={u.is_admin ? 'ShieldCheck' : 'User'} size={15} className={u.is_admin ? 'text-accent shrink-0' : 'text-muted-foreground shrink-0'} />
              <span className="font-mono text-sm flex-1">{u.username}</span>

              {/* Переключатель Администратор */}
              <button
                onClick={() => toggleAdmin(u)}
                title={u.is_admin ? 'Снять права администратора' : 'Назначить администратором'}
                className={`flex items-center gap-1.5 h-7 px-2.5 rounded-sm text-xs font-mono border transition ${
                  u.is_admin
                    ? 'bg-accent/15 border-accent text-accent hover:bg-accent/25'
                    : 'border-border text-muted-foreground hover:border-accent hover:text-accent'
                }`}
              >
                <Icon name="Shield" size={12} />
                {u.is_admin ? 'Админ' : 'Обычный'}
              </button>

              {/* Удалить */}
              {confirmDelete === u.id ? (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-destructive font-mono">Удалить?</span>
                  <button
                    onClick={() => deleteUser(u.id)}
                    className="px-2 h-7 rounded-sm bg-destructive text-white text-xs font-display uppercase hover:bg-destructive/90 transition"
                  >
                    Да
                  </button>
                  <button
                    onClick={() => setConfirmDelete(null)}
                    className="px-2 h-7 rounded-sm border border-border text-xs font-display uppercase hover:bg-secondary transition"
                  >
                    Нет
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setConfirmDelete(u.id)}
                  className="flex h-7 w-7 items-center justify-center rounded-sm border border-border text-muted-foreground hover:text-destructive hover:border-destructive transition"
                >
                  <Icon name="Trash2" size={13} />
                </button>
              )}
            </div>

            {/* Смена пароля */}
            <div className="border-t border-border px-4 py-2.5 bg-secondary/30 flex items-center gap-2">
              <Input
                type="password"
                placeholder="Новый пароль"
                value={changePwd[u.id] || ''}
                onChange={(e) => setChangePwd((p) => ({ ...p, [u.id]: e.target.value }))}
                className="h-8 text-sm flex-1 max-w-[200px]"
              />
              <Button
                onClick={() => changePassword(u)}
                variant="outline"
                className="h-8 text-xs font-display uppercase tracking-wide rounded-sm px-3"
              >
                Сменить пароль
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Добавить пользователя */}
      <div className="border-t border-border pt-4">
        <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-3">
          Добавить пользователя
        </p>
        <form onSubmit={addUser} className="flex flex-col sm:flex-row gap-2">
          <div className="flex-1">
            <Lbl>Логин</Lbl>
            <Input
              value={newLogin}
              onChange={(e) => setNewLogin(e.target.value)}
              placeholder="user.name"
              className="h-10"
            />
          </div>
          <div className="flex-1">
            <Lbl>Пароль</Lbl>
            <Input
              type="password"
              value={newPwd}
              onChange={(e) => setNewPwd(e.target.value)}
              placeholder="••••••••"
              className="h-10"
            />
          </div>
          <div className="flex items-end">
            <Button
              type="submit"
              disabled={adding}
              className="h-10 bg-foreground text-primary-foreground hover:opacity-90 font-display uppercase text-xs tracking-wide rounded-sm px-4 whitespace-nowrap"
            >
              <Icon name={adding ? 'Loader' : 'Plus'} size={14} className={`mr-1 ${adding ? 'animate-spin' : ''}`} />
              Добавить
            </Button>
          </div>
        </form>
      </div>
    </Section>
  );
};

export default AdminUsers;
