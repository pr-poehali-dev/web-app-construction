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
  is_locked: boolean;
  locked_until_iso?: string;
  failed_attempts?: number;
  created_at?: string;
}

const fmtLockTime = (iso?: string) => {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleString('ru-RU', {
    timeZone: 'Asia/Yekaterinburg',
    day: '2-digit', month: '2-digit',
    hour: '2-digit', minute: '2-digit',
  });
};

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

  const unlockUser = async (u: AppUser) => {
    await api('unlock_user', { id: u.id });
    setUsers((prev) => prev.map((x) => x.id === u.id
      ? { ...x, is_locked: false, locked_until_iso: undefined, failed_attempts: 0 }
      : x));
    toast({ title: `${u.username} разблокирован` });
  };

  const deleteUser = async (id: number) => {
    await api('delete_user', { id });
    setUsers((p) => p.filter((u) => u.id !== id));
    setConfirmDelete(null);
    toast({ title: 'Пользователь удалён' });
  };

  const lockedCount = users.filter((u) => u.is_locked).length;

  return (
    <Section title="Пользователи системы" icon="Users">
      {/* Баннер если есть заблокированные */}
      {lockedCount > 0 && (
        <div className="flex items-center gap-2.5 mb-4 rounded-sm px-3 py-2.5 bg-red-950/30 border border-red-800 text-red-300 text-sm font-mono animate-fade-up">
          <Icon name="ShieldOff" size={15} className="shrink-0" />
          Заблокировано пользователей: {lockedCount}
        </div>
      )}

      <div className="space-y-2 mb-5">
        {users.length === 0 && (
          <p className="text-sm text-muted-foreground">Пользователей нет.</p>
        )}
        {users.map((u) => (
          <div
            key={u.id}
            className={`border rounded-sm overflow-hidden transition-colors ${
              u.is_locked ? 'border-red-700 bg-red-950/10' : 'border-border'
            }`}
          >
            {/* Строка пользователя */}
            <div className={`flex items-center px-4 py-2.5 gap-2 flex-wrap ${u.is_locked ? 'bg-red-950/20' : 'bg-background'}`}>
              <Icon
                name={u.is_locked ? 'ShieldOff' : u.is_admin ? 'ShieldCheck' : 'User'}
                size={15}
                className={`shrink-0 ${u.is_locked ? 'text-red-400' : u.is_admin ? 'text-accent' : 'text-muted-foreground'}`}
              />
              <span className={`font-mono text-sm flex-1 min-w-0 truncate ${u.is_locked ? 'text-red-300' : ''}`}>
                {u.username}
              </span>

              {/* Метка «заблокирован до» */}
              {u.is_locked && (
                <span className="font-mono text-[11px] px-2 py-0.5 rounded-sm bg-red-900/60 text-red-300 border border-red-700 whitespace-nowrap">
                  до {fmtLockTime(u.locked_until_iso)}
                </span>
              )}

              {/* Кнопка разблокировать */}
              {u.is_locked && (
                <button
                  onClick={() => unlockUser(u)}
                  className="flex items-center gap-1 h-7 px-2.5 rounded-sm text-xs font-mono border border-red-700 text-red-300 hover:bg-red-900/40 transition whitespace-nowrap"
                >
                  <Icon name="LockOpen" size={12} />
                  Разблокировать
                </button>
              )}

              {/* Переключатель Администратор (только если не заблокирован) */}
              {!u.is_locked && (
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
              )}

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
            <div className={`border-t px-4 py-2.5 flex items-center gap-2 ${u.is_locked ? 'border-red-800/50 bg-red-950/10' : 'border-border bg-secondary/30'}`}>
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
