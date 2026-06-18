import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { api } from '@/lib/api';

const COMPLETION_TYPES = ['Теплый контур', 'Черновая отделка', 'White Box'];

const Field = ({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) => (
  <div className="space-y-2">
    <label className="font-display text-sm font-500 uppercase tracking-wide text-foreground flex items-center gap-1.5">
      {label}
      {required && <span className="text-accent">*</span>}
    </label>
    {children}
  </div>
);

const dateInputClass =
  'w-full h-11 px-3 rounded-sm border border-input bg-card text-foreground font-mono text-sm focus:outline-none focus:ring-2 focus:ring-ring focus:border-accent transition';

const AddObject = () => {
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState({
    customer_last_name: '',
    customer_first_name: '',
    customer_middle_name: '',
    customer_phone: '',
    customer_email: '',
    project: '',
    area_living: '',
    area_total: '',
    address: '',
    cadastral_number: '',
    contract_prelim_number: '',
    contract_main_number: '',
    contract_sign_date: '',
    contract_end_date: '',
    cost: '',
    self_cost: '',
    mortgage_cost: '',
    bank: '',
    note: '',
    project_finance: false,
    project_finance_amount: '',
    completion_type: '',
  });

  const set = (k: string, v: string) => setF((p) => ({ ...p, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!f.customer_last_name) {
      toast({ title: 'Укажите фамилию заказчика', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await api('add_object', { ...f, project_finance: f.project_finance ? true : false } as Record<string, unknown>);
      toast({ title: 'Объект добавлен' });
      navigate('/');
    } catch {
      toast({ title: 'Не удалось сохранить', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-card/70 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-2xl flex items-center gap-3 py-4">
          <button
            onClick={() => navigate('/')}
            className="flex h-9 w-9 items-center justify-center rounded-sm border border-border hover:border-accent hover:text-accent transition"
          >
            <Icon name="ArrowLeft" size={18} />
          </button>
          <div>
            <h1 className="font-display text-lg font-600 uppercase tracking-wider leading-none">
              Добавить объект
            </h1>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">карточка нового объекта</p>
          </div>
        </div>
      </header>

      <main className="container max-w-2xl py-8 sm:py-10">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Заказчик */}
          <div className="bg-card border border-border rounded-sm p-5 sm:p-6 space-y-5 animate-fade-up">
            <div className="flex items-center gap-2 pb-1">
              <span className="h-2 w-2 rounded-full bg-accent" />
              <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">заказчик</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Фамилия" required>
                <Input value={f.customer_last_name} onChange={(e) => set('customer_last_name', e.target.value)} className="h-11" />
              </Field>
              <Field label="Имя">
                <Input value={f.customer_first_name} onChange={(e) => set('customer_first_name', e.target.value)} className="h-11" />
              </Field>
              <Field label="Отчество">
                <Input value={f.customer_middle_name} onChange={(e) => set('customer_middle_name', e.target.value)} className="h-11" />
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Номер телефона">
                <Input type="tel" value={f.customer_phone} onChange={(e) => set('customer_phone', e.target.value)} className="h-11" placeholder="+7 ___ ___-__-__" />
              </Field>
              <Field label="Электронная почта">
                <Input type="email" value={f.customer_email} onChange={(e) => set('customer_email', e.target.value)} className="h-11" placeholder="example@mail.ru" />
              </Field>
            </div>
          </div>

          {/* Объект и договор */}
          <div className="bg-card border border-border rounded-sm p-5 sm:p-6 space-y-5 animate-fade-up">
            <div className="flex items-center gap-2 pb-1">
              <span className="h-2 w-2 rounded-full bg-accent" />
              <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">объект и договор</p>
            </div>
            <Field label="Проект">
              <Input value={f.project} onChange={(e) => set('project', e.target.value)} className="h-11" />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Площадь жилая">
                <Input type="number" step="0.01" value={f.area_living} onChange={(e) => set('area_living', e.target.value)} className="h-11" placeholder="м²" />
              </Field>
              <Field label="Площадь общая">
                <Input type="number" step="0.01" value={f.area_total} onChange={(e) => set('area_total', e.target.value)} className="h-11" placeholder="м²" />
              </Field>
            </div>
            <Field label="Адрес">
              <Input value={f.address} onChange={(e) => set('address', e.target.value)} className="h-11" />
            </Field>
            <Field label="Кадастровый номер">
              <Input value={f.cadastral_number} onChange={(e) => set('cadastral_number', e.target.value)} className="h-11" placeholder="00:00:000000:000" />
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Номер предварительного договора">
                <Input value={f.contract_prelim_number} onChange={(e) => set('contract_prelim_number', e.target.value)} className="h-11" />
              </Field>
              <Field label="Номер основного договора">
                <Input value={f.contract_main_number} onChange={(e) => set('contract_main_number', e.target.value)} className="h-11" />
              </Field>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Field label="Срок подписания договора">
                <input type="date" value={f.contract_sign_date} onChange={(e) => set('contract_sign_date', e.target.value)} className={dateInputClass} />
              </Field>
              <Field label="Срок окончания договора">
                <input type="date" value={f.contract_end_date} onChange={(e) => set('contract_end_date', e.target.value)} className={dateInputClass} />
              </Field>
            </div>
          </div>

          {/* Финансы */}
          <div className="bg-card border border-border rounded-sm p-5 sm:p-6 space-y-5 animate-fade-up">
            <div className="flex items-center gap-2 pb-1">
              <span className="h-2 w-2 rounded-full bg-accent" />
              <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">финансы</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Field label="Стоимость по договору">
                <Input type="number" step="0.01" value={f.cost} onChange={(e) => set('cost', e.target.value)} className="h-11" placeholder="₽" />
              </Field>
              <Field label="Планируемая стоимость строительства">
                <Input type="number" step="0.01" value={f.self_cost} onChange={(e) => set('self_cost', e.target.value)} className="h-11" placeholder="₽" />
              </Field>
              <Field label="Оплата агенту">
                <Input type="number" step="0.01" value={f.mortgage_cost} onChange={(e) => set('mortgage_cost', e.target.value)} className="h-11" placeholder="₽" />
              </Field>
            </div>
            <Field label="Банк">
              <Input value={f.bank} onChange={(e) => set('bank', e.target.value)} className="h-11" />
            </Field>

            {/* Проектное финансирование */}
            <div className="space-y-3">
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <Checkbox
                  checked={f.project_finance}
                  onCheckedChange={(v) => setF((p) => ({ ...p, project_finance: !!v, project_finance_amount: v ? p.project_finance_amount : '' }))}
                />
                <span className="font-display text-sm font-500 uppercase tracking-wide text-foreground">
                  Проектное финансирование
                </span>
              </label>
              {f.project_finance && (
                <Field label="Сумма проектного финансирования">
                  <Input
                    type="number"
                    step="0.01"
                    value={f.project_finance_amount}
                    onChange={(e) => set('project_finance_amount', e.target.value)}
                    className="h-11"
                    placeholder="₽"
                    autoFocus
                  />
                </Field>
              )}
            </div>

            <Field label="Примечание">
              <Textarea value={f.note} onChange={(e) => set('note', e.target.value)} className="min-h-24 resize-none" placeholder="Дополнительная информация…" />
            </Field>
          </div>

          {/* Комплектация */}
          <div className="bg-card border border-border rounded-sm p-5 sm:p-6 space-y-5 animate-fade-up">
            <div className="flex items-center gap-2 pb-1">
              <span className="h-2 w-2 rounded-full bg-accent" />
              <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">комплектация</p>
            </div>
            <Field label="Комплектация">
              <Select value={f.completion_type} onValueChange={(v) => setF((p) => ({ ...p, completion_type: v }))}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Выберите вариант…" />
                </SelectTrigger>
                <SelectContent>
                  {COMPLETION_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          <div className="flex gap-3 animate-fade-up">
            <Button type="submit" disabled={saving} className="flex-1 h-12 bg-accent text-accent-foreground hover:bg-accent/90 font-display uppercase tracking-wider text-base rounded-sm">
              <Icon name={saving ? 'Loader' : 'Check'} size={18} className={`mr-2 ${saving ? 'animate-spin' : ''}`} />
              {saving ? 'Сохраняю…' : 'Добавить объект'}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate('/')} className="h-12 rounded-sm font-display uppercase tracking-wide">
              Отмена
            </Button>
          </div>
        </form>
      </main>
    </div>
  );
};

export default AddObject;