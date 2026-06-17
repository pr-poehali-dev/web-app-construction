import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api, BuildObject } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

const objectLabel = (o: BuildObject) =>
  [o.customer_last_name, o.customer_first_name].filter(Boolean).join(' ') || `Объект #${o.id}`;

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

  const saveCosts = async (o: BuildObject) => {
    await api('update_object', {
      id: o.id,
      cost: o.cost ?? 0,
      self_cost: o.self_cost ?? 0,
      mortgage_cost: o.mortgage_cost ?? 0,
    });
    toast({ title: 'Сохранено', description: objectLabel(o) });
  };

  const setObjField = (id: number, field: keyof BuildObject, value: number) =>
    setObjects((prev) => prev.map((o) => (o.id === id ? { ...o, [field]: value } : o)));

  const saveList = async (kind: 'stage' | 'supply', items: string[]) => {
    await api('set_list', { kind, items: items.filter((i) => i.trim()) });
    toast({ title: 'Список обновлён' });
  };

  // ---- экран входа ----
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
          <Button type="submit" className="w-full h-11 bg-accent text-accent-foreground hover:bg-accent/90 font-display uppercase tracking-wider rounded-sm">
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

  // ---- обязательная смена пароля ----
  if (mustChange) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <form onSubmit={changePassword} className="w-full max-w-sm bg-card border border-border rounded-sm p-7 animate-fade-up">
          <div className="flex h-12 w-12 items-center justify-center bg-accent text-accent-foreground rounded-sm mb-5">
            <Icon name="KeyRound" size={24} />
          </div>
          <h1 className="font-display text-2xl font-600 uppercase tracking-wide mb-1">Смена пароля</h1>
          <p className="text-sm text-muted-foreground mb-6">
            Вы вошли со стандартным паролем. Задайте новый, чтобы продолжить.
          </p>
          <Input type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} placeholder="Новый пароль" className="h-11 mb-3" autoFocus />
          <Input type="password" value={newPwd2} onChange={(e) => setNewPwd2(e.target.value)} placeholder="Повторите пароль" className="h-11 mb-4" />
          <Button type="submit" className="w-full h-11 bg-accent text-accent-foreground hover:bg-accent/90 font-display uppercase tracking-wider rounded-sm">
            Сохранить и войти
          </Button>
        </form>
      </div>
    );
  }

  // ---- панель администратора ----
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
        {/* Стоимости объектов */}
        <section className="bg-card border border-border rounded-sm p-5 animate-fade-up">
          <h2 className="font-display text-base font-600 uppercase tracking-wide mb-4 flex items-center gap-2">
            <Icon name="Wallet" size={18} className="text-accent" /> Стоимости объектов
          </h2>
          {objects.length === 0 ? (
            <p className="text-muted-foreground text-sm">Объектов нет.</p>
          ) : (
            <div className="space-y-4">
              {objects.map((o) => (
                <div key={o.id} className="border border-border rounded-sm p-4">
                  <p className="font-display uppercase tracking-wide text-sm mb-3">{objectLabel(o)}</p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {([
                      ['Стоимость', 'cost'],
                      ['Себестоимость', 'self_cost'],
                      ['Ипотека', 'mortgage_cost'],
                    ] as [string, keyof BuildObject][]).map(([label, field]) => (
                      <div key={field}>
                        <label className="font-mono text-[11px] uppercase text-muted-foreground">{label}</label>
                        <Input
                          type="number"
                          value={(o[field] as number) ?? 0}
                          onChange={(e) => setObjField(o.id, field, Number(e.target.value))}
                          className="h-10 mt-1"
                        />
                      </div>
                    ))}
                  </div>
                  <Button onClick={() => saveCosts(o)} className="mt-3 h-9 bg-foreground text-primary-foreground hover:opacity-90 font-display uppercase text-xs tracking-wide rounded-sm">
                    Сохранить
                  </Button>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Списки */}
        <ListEditor title="Этапы" icon="ListChecks" items={stages} onSave={(it) => saveList('stage', it)} setItems={setStages} />
        <ListEditor title="Что привезти" icon="Package" items={supplies} onSave={(it) => saveList('supply', it)} setItems={setSupplies} />

        {/* Смена пароля */}
        <section className="bg-card border border-border rounded-sm p-5 animate-fade-up">
          <h2 className="font-display text-base font-600 uppercase tracking-wide mb-4 flex items-center gap-2">
            <Icon name="KeyRound" size={18} className="text-accent" /> Сменить пароль
          </h2>
          <form onSubmit={changePassword} className="space-y-3 max-w-sm">
            <Input type="password" value={oldPwd} onChange={(e) => setOldPwd(e.target.value)} placeholder="Текущий пароль" className="h-10" />
            <Input type="password" value={newPwd} onChange={(e) => setNewPwd(e.target.value)} placeholder="Новый пароль" className="h-10" />
            <Input type="password" value={newPwd2} onChange={(e) => setNewPwd2(e.target.value)} placeholder="Повторите новый" className="h-10" />
            <Button type="submit" className="h-10 bg-accent text-accent-foreground hover:bg-accent/90 font-display uppercase text-xs tracking-wide rounded-sm">
              Изменить пароль
            </Button>
          </form>
        </section>
      </main>
    </div>
  );
};

const ListEditor = ({
  title,
  icon,
  items,
  setItems,
  onSave,
}: {
  title: string;
  icon: string;
  items: string[];
  setItems: (v: string[]) => void;
  onSave: (items: string[]) => void;
}) => {
  const update = (i: number, v: string) => setItems(items.map((x, idx) => (idx === i ? v : x)));
  const remove = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const add = () => setItems([...items, '']);

  return (
    <section className="bg-card border border-border rounded-sm p-5 animate-fade-up">
      <h2 className="font-display text-base font-600 uppercase tracking-wide mb-4 flex items-center gap-2">
        <Icon name={icon} size={18} className="text-accent" /> {title}
      </h2>
      <div className="space-y-2">
        {items.map((it, i) => (
          <div key={i} className="flex gap-2">
            <Input value={it} onChange={(e) => update(i, e.target.value)} className="h-10" />
            <button
              onClick={() => remove(i)}
              className="flex h-10 w-10 items-center justify-center rounded-sm border border-border text-muted-foreground hover:text-destructive hover:border-destructive transition shrink-0"
            >
              <Icon name="Trash2" size={16} />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-3">
        <Button onClick={add} variant="outline" className="h-9 rounded-sm font-display uppercase text-xs tracking-wide">
          <Icon name="Plus" size={14} className="mr-1" /> Добавить
        </Button>
        <Button onClick={() => onSave(items)} className="h-9 bg-foreground text-primary-foreground hover:opacity-90 font-display uppercase text-xs tracking-wide rounded-sm">
          Сохранить список
        </Button>
      </div>
    </section>
  );
};

export default Admin;
