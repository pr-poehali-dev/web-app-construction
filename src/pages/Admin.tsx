import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { api, BuildObject } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

// ─── Вспомогательные компоненты ──────────────────────────────────────────────

const Lbl = ({ children }: { children: React.ReactNode }) => (
  <label className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground block mb-1">
    {children}
  </label>
);

const dateInputClass =
  'w-full h-10 px-3 rounded-sm border border-input bg-background text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-accent transition';

const Section = ({
  title,
  icon,
  children,
}: {
  title: string;
  icon: string;
  children: React.ReactNode;
}) => (
  <section className="bg-card border border-border rounded-sm p-5 animate-fade-up">
    <h2 className="font-display text-base font-600 uppercase tracking-wide mb-4 flex items-center gap-2">
      <Icon name={icon} size={18} className="text-accent" />
      {title}
    </h2>
    {children}
  </section>
);

const fullName = (o: BuildObject) =>
  [o.customer_last_name, o.customer_first_name].filter(Boolean).join(' ') || `Объект #${o.id}`;

// ─── Редактор объекта ─────────────────────────────────────────────────────────

const ObjectEditor = ({
  obj,
  stages,
  onSave,
}: {
  obj: BuildObject;
  stages: string[];
  onSave: (o: BuildObject) => void;
}) => {
  const [o, setO] = useState<BuildObject>({ ...obj });
  const [stageCosts, setStageCosts] = useState<Record<string, number>>({});
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'info' | 'stages'>('info');

  useEffect(() => {
    if (open) {
      api<{ costs: Record<string, number> }>('get_stage_costs', { object_id: obj.id }).then((d) =>
        setStageCosts(d.costs || {})
      );
    }
  }, [open, obj.id]);

  const set = (k: keyof BuildObject, v: string | number) =>
    setO((p) => ({ ...p, [k]: v }));

  const saveStageCost = async (stage: string, cost: number) => {
    setStageCosts((p) => ({ ...p, [stage]: cost }));
    await api('set_stage_cost', { object_id: obj.id, stage, cost });
  };

  return (
    <div className="border border-border rounded-sm overflow-hidden">
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-4 py-3 bg-background hover:bg-secondary transition text-left"
      >
        <span className="font-display uppercase tracking-wide text-sm">{fullName(obj)}</span>
        <div className="flex items-center gap-2">
          {obj.address && (
            <span className="font-mono text-xs text-muted-foreground hidden sm:block truncate max-w-[200px]">
              {obj.address}
            </span>
          )}
          <Icon name={open ? 'ChevronUp' : 'ChevronDown'} size={16} className="text-muted-foreground shrink-0" />
        </div>
      </button>

      {open && (
        <div className="border-t border-border p-4 space-y-4">
          {/* Табы */}
          <div className="flex gap-1 p-1 bg-secondary rounded-sm w-fit">
            {(['info', 'stages'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 h-8 rounded-sm font-display uppercase text-xs tracking-wide transition ${
                  tab === t ? 'bg-foreground text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t === 'info' ? 'Данные объекта' : 'Стоимость этапов'}
              </button>
            ))}
          </div>

          {tab === 'info' && (
            <div className="space-y-4">
              {/* Заказчик */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Lbl>Фамилия</Lbl>
                  <Input value={o.customer_last_name || ''} onChange={(e) => set('customer_last_name', e.target.value)} className="h-10" />
                </div>
                <div>
                  <Lbl>Имя</Lbl>
                  <Input value={o.customer_first_name || ''} onChange={(e) => set('customer_first_name', e.target.value)} className="h-10" />
                </div>
                <div>
                  <Lbl>Отчество</Lbl>
                  <Input value={o.customer_middle_name || ''} onChange={(e) => set('customer_middle_name', e.target.value)} className="h-10" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Lbl>Телефон</Lbl>
                  <Input value={o.customer_phone || ''} onChange={(e) => set('customer_phone', e.target.value)} className="h-10" />
                </div>
                <div>
                  <Lbl>Проект</Lbl>
                  <Input value={o.project || ''} onChange={(e) => set('project', e.target.value)} className="h-10" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Lbl>Площадь по ДСП (м²)</Lbl>
                  <Input type="number" step="0.01" value={o.area_dsp ?? ''} onChange={(e) => set('area_dsp', e.target.value)} className="h-10" />
                </div>
                <div>
                  <Lbl>Адрес</Lbl>
                  <Input value={o.address || ''} onChange={(e) => set('address', e.target.value)} className="h-10" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Lbl>Номер договора</Lbl>
                  <Input value={o.contract_number || ''} onChange={(e) => set('contract_number', e.target.value)} className="h-10" />
                </div>
                <div>
                  <Lbl>Дата подписания</Lbl>
                  <input type="date" value={o.contract_sign_date || ''} onChange={(e) => set('contract_sign_date', e.target.value)} className={dateInputClass} />
                </div>
                <div>
                  <Lbl>Дата окончания</Lbl>
                  <input type="date" value={o.contract_end_date || ''} onChange={(e) => set('contract_end_date', e.target.value)} className={dateInputClass} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Lbl>Стоимость по договору (₽)</Lbl>
                  <Input type="number" value={o.cost ?? 0} onChange={(e) => set('cost', e.target.value)} className="h-10" />
                </div>
                <div>
                  <Lbl>Планируемая стоимость строительства (₽)</Lbl>
                  <Input type="number" value={o.self_cost ?? 0} onChange={(e) => set('self_cost', e.target.value)} className="h-10" />
                </div>
                <div>
                  <Lbl>Оплата агенту (₽)</Lbl>
                  <Input type="number" value={o.mortgage_cost ?? 0} onChange={(e) => set('mortgage_cost', e.target.value)} className="h-10" />
                </div>
              </div>

              <div>
                <Lbl>Банк</Lbl>
                <Input value={o.bank || ''} onChange={(e) => set('bank', e.target.value)} className="h-10" />
              </div>

              <div>
                <Lbl>Примечание</Lbl>
                <Textarea value={o.note || ''} onChange={(e) => set('note', e.target.value)} className="min-h-20 resize-none" />
              </div>

              <Button
                onClick={() => onSave(o)}
                className="h-10 bg-foreground text-primary-foreground hover:opacity-90 font-display uppercase text-xs tracking-wide rounded-sm"
              >
                <Icon name="Save" size={14} className="mr-1.5" />
                Сохранить изменения
              </Button>
            </div>
          )}

          {tab === 'stages' && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-mono mb-3">
                Стоимость каждого этапа вычитается из планируемой стоимости строительства при принятии осмотра.
              </p>
              {stages.map((stage) => (
                <div key={stage} className="flex items-center gap-3">
                  <span className="flex-1 text-sm truncate">{stage}</span>
                  <Input
                    type="number"
                    step="0.01"
                    value={stageCosts[stage] ?? 0}
                    onChange={(e) => setStageCosts((p) => ({ ...p, [stage]: Number(e.target.value) }))}
                    onBlur={(e) => saveStageCost(stage, Number(e.target.value))}
                    className="w-36 h-9 text-right"
                    placeholder="₽"
                  />
                </div>
              ))}
              <p className="text-xs text-muted-foreground font-mono mt-2">
                Изменения сохраняются автоматически при выходе из поля.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Редактор списка (этапы / поставки) ──────────────────────────────────────

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
    <Section title={title} icon={icon}>
      <div className="space-y-2">
        {items.map((it, i) => (
          <div key={i} className="flex gap-2">
            <Input value={it} onChange={(e) => update(i, e.target.value)} className="h-10" />
            <button
              onClick={() => remove(i)}
              className="flex h-10 w-10 items-center justify-center rounded-sm border border-border text-muted-foreground hover:text-destructive hover:border-destructive transition shrink-0"
            >
              <Icon name="Trash2" size={15} />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-3">
        <Button onClick={add} variant="outline" className="h-9 rounded-sm font-display uppercase text-xs tracking-wide">
          <Icon name="Plus" size={13} className="mr-1" /> Добавить
        </Button>
        <Button onClick={() => onSave(items)} className="h-9 bg-foreground text-primary-foreground hover:opacity-90 font-display uppercase text-xs tracking-wide rounded-sm">
          Сохранить список
        </Button>
      </div>
    </Section>
  );
};

// ─── Главный компонент ────────────────────────────────────────────────────────

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
        <Section title="Редактирование объектов" icon="Building2">
          {objects.length === 0 ? (
            <p className="text-muted-foreground text-sm">Объектов нет.</p>
          ) : (
            <div className="space-y-2">
              {objects.map((o) => (
                <ObjectEditor key={o.id} obj={o} stages={stages} onSave={saveObject} />
              ))}
            </div>
          )}
        </Section>

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

        {/* Смена пароля */}
        <Section title="Сменить пароль" icon="KeyRound">
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