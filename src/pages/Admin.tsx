import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api, BuildObject } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Lbl, Section, fullName } from './admin/AdminShared';
import { ObjectsSection } from './admin/AdminObjectEditor';
import { ListEditor } from './admin/AdminListEditor';
import AdminUsers from './admin/AdminUsers';

const Admin = () => {
  const navigate = useNavigate();
  const [authed, setAuthed] = useState(false);
  const [mustChange, setMustChange] = useState(false);

  const [pwd, setPwd] = useState('');
  const [oldPwd, setOldPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [newPwd2, setNewPwd2] = useState('');

  const [objects, setObjects] = useState<BuildObject[]>([]);
  const [stages, setStages] = useState<string[]>([]);
  const [supplies, setSupplies] = useState<string[]>([]);

  const loadAll = () => {
    api<{ objects: BuildObject[] }>('list_objects').then((d) => setObjects(d.objects || []));
    api<{ stages: string[]; supplies: string[] }>('get_settings').then((d) => {
      setStages(d.stages || []);
      setSupplies(d.supplies || []);
    });
  };

  useEffect(() => {
    if (authed) loadAll();
  }, [authed]);

  const login = async (e: React.FormEvent) => {
    e.preventDefault();
    const r = await api<{ ok: boolean; password_changed: boolean }>('check_password', { password: pwd });
    if (r.ok) {
      setAuthed(true);
      setMustChange(!r.password_changed);
      setOldPwd(pwd);
    } else {
      toast({ title: 'Неверный пароль', variant: 'destructive' });
    }
  };

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPwd.length < 4) {
      toast({ title: 'Пароль слишком короткий', variant: 'destructive' });
      return;
    }
    if (newPwd !== newPwd2) {
      toast({ title: 'Пароли не совпадают', variant: 'destructive' });
      return;
    }
    const r = await api<{ ok: boolean; error?: string }>('change_password', {
      old_password: oldPwd,
      new_password: newPwd,
    });
    if (r.ok) {
      toast({ title: 'Пароль изменён' });
      setMustChange(false);
      setOldPwd(newPwd);
      setNewPwd('');
      setNewPwd2('');
    } else {
      toast({ title: r.error || 'Ошибка', variant: 'destructive' });
    }
  };

  const saveObject = async (o: BuildObject) => {
    await api('update_object', { ...o });
    setObjects((prev) => prev.map((x) => (x.id === o.id ? o : x)));
    toast({ title: 'Объект обновлён', description: fullName(o) });
  };

  const deleteObject = (id: number) => {
    setObjects((prev) => prev.filter((x) => x.id !== id));
    toast({ title: 'Объект удалён', description: 'Все связанные данные удалены' });
  };

  const saveList = async (kind: 'stage' | 'supply', items: string[]) => {
    await api('set_list', { kind, items: items.filter((i) => i.trim()) });
    toast({ title: 'Список обновлён' });
  };

  // ── Экран входа ─────────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <form onSubmit={login} className="w-full max-w-sm bg-card border border-border rounded-sm p-7 animate-fade-up">
          <div className="flex h-12 w-12 items-center justify-center bg-foreground text-accent rounded-sm mb-5">
            <Icon name="Lock" size={24} />
          </div>
          <h1 className="font-display text-2xl font-600 uppercase tracking-wide mb-1">Администратор</h1>
          <p className="text-sm text-muted-foreground mb-6">Введите пароль для доступа</p>
          <Input
            type="password"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            placeholder="Пароль"
            className="h-11 mb-3"
            autoFocus
          />
          <Button
            type="submit"
            className="w-full h-11 bg-accent text-accent-foreground hover:bg-accent/90 font-display uppercase tracking-wider rounded-sm"
          >
            Войти
          </Button>
          <button
            type="button"
            onClick={() => navigate('/')}
            className="w-full mt-3 text-sm text-muted-foreground hover:text-foreground transition"
          >
            ← На главную
          </button>
        </form>
      </div>
    );
  }

  // ── Смена пароля (обязательная) ──────────────────────────────────────────────
  if (mustChange) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <form
          onSubmit={changePassword}
          className="w-full max-w-sm bg-card border border-border rounded-sm p-7 animate-fade-up"
        >
          <div className="flex h-12 w-12 items-center justify-center bg-accent text-accent-foreground rounded-sm mb-5">
            <Icon name="KeyRound" size={24} />
          </div>
          <h1 className="font-display text-2xl font-600 uppercase tracking-wide mb-1">Смена пароля</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Вы вошли со стандартным паролем. Задайте новый, чтобы продолжить.
          </p>
          <Input
            type="password"
            value={newPwd}
            onChange={(e) => setNewPwd(e.target.value)}
            placeholder="Новый пароль"
            className="h-11 mb-3"
            autoFocus
          />
          <Input
            type="password"
            value={newPwd2}
            onChange={(e) => setNewPwd2(e.target.value)}
            placeholder="Повторите пароль"
            className="h-11 mb-4"
          />
          <Button
            type="submit"
            className="w-full h-11 bg-accent text-accent-foreground hover:bg-accent/90 font-display uppercase tracking-wider rounded-sm"
          >
            Сохранить и войти
          </Button>
        </form>
      </div>
    );
  }

  // ── Панель администратора ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-card/70 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-3xl flex items-center gap-3 py-4">
          <button
            onClick={() => navigate('/')}
            className="flex h-9 w-9 items-center justify-center rounded-sm border border-border hover:border-accent hover:text-accent transition"
          >
            <Icon name="ArrowLeft" size={18} />
          </button>
          <div>
            <h1 className="font-display text-lg font-600 uppercase tracking-wider leading-none">
              Администратор
            </h1>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">настройки системы</p>
          </div>
        </div>
      </header>

      <main className="container max-w-3xl py-8 sm:py-10 space-y-6">

        {/* Объекты */}
        <ObjectsSection objects={objects} stages={stages} onSave={saveObject} onDelete={deleteObject} />

        {/* Списки */}
        <ListEditor
          title="Этапы строительства"
          icon="ListChecks"
          items={stages}
          setItems={setStages}
          onSave={(it) => saveList('stage', it)}
        />
        <ListEditor
          title="Что привезти (поставки)"
          icon="Package"
          items={supplies}
          setItems={setSupplies}
          onSave={(it) => saveList('supply', it)}
        />

        {/* Пользователи */}
        <AdminUsers />

        {/* Смена пароля */}
        <Section title="Сменить пароль администратора" icon="KeyRound">
          <form onSubmit={changePassword} className="space-y-3 max-w-sm">
            <div>
              <Lbl>Текущий пароль</Lbl>
              <Input type="password" value={oldPwd} onChange={(e) => setOldPwd(e.target.value)} className="h-10" />
            </div>
            <div>
              <Lbl>Новый пароль</Lbl>
              <Input type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} className="h-10" />
            </div>
            <div>
              <Lbl>Повторите новый</Lbl>
              <Input type="password" value={newPwd2} onChange={(e) => setNewPwd2(e.target.value)} className="h-10" />
            </div>
            <Button
              type="submit"
              className="h-10 bg-accent text-accent-foreground hover:bg-accent/90 font-display uppercase text-xs tracking-wide rounded-sm"
            >
              Изменить пароль
            </Button>
          </form>
        </Section>
      </main>
    </div>
  );
};

export default Admin;