import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/hooks/use-toast';

const OBJECTS = ['Объект №1 — ул. Лесная, 12', 'Объект №2 — пос. Сосновый', 'Объект №3 — СНТ Рассвет'];

const STAGES = [
  'Фундамент',
  'Стены',
  'Армопояс',
  'Кровля',
  'Фасад',
  'Цоколь',
  'Контур заземления',
  'Отмостка',
  'Окна и дверь',
  'Вентиляция',
  'Сантехника',
  'Электроснабжение',
  'Стяжка полусухая и улучшенная штукатурка стен',
  'Дом сдан',
];

const SUPPLIES = ['Бетон на армопояс', 'Комплект стен', 'Комплект для крыши'];

const today = new Date();
const toISO = (d: Date) => d.toISOString().split('T')[0];
const tomorrow = toISO(new Date(today.getTime() + 86400000));
const twoMonths = (() => {
  const d = new Date(today);
  d.setMonth(d.getMonth() + 2);
  return toISO(d);
})();

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

const Inspection = () => {
  const navigate = useNavigate();
  const [object, setObject] = useState('');
  const [stage, setStage] = useState('');

  const [stagePassed, setStagePassed] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [supply, setSupply] = useState('');
  const [nextStart, setNextStart] = useState('');
  const [nextEnd, setNextEnd] = useState('');
  const [note, setNote] = useState('');

  const [houseDone, setHouseDone] = useState('');
  const [ownerMeeting, setOwnerMeeting] = useState('');
  const [actDate, setActDate] = useState('');

  const isFinal = stage === 'Дом сдан';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!object || !stage) {
      toast({ title: 'Заполните название объекта и этап', variant: 'destructive' });
      return;
    }
    toast({
      title: 'Осмотр сохранён',
      description: `${object} · ${stage}`,
    });
    navigate('/');
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
              Новый осмотр
            </h1>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">
              заполните карточку проверки
            </p>
          </div>
        </div>
      </header>

      <main className="container max-w-2xl py-8 sm:py-10">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-card border border-border rounded-sm p-5 sm:p-6 space-y-5 animate-fade-up">
            <Field label="Название объекта" required>
              <Select value={object} onValueChange={setObject}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Выберите объект" />
                </SelectTrigger>
                <SelectContent>
                  {OBJECTS.map((o) => (
                    <SelectItem key={o} value={o}>
                      {o}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Текущий этап" required>
              <Select value={stage} onValueChange={setStage}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Выберите этап" />
                </SelectTrigger>
                <SelectContent>
                  {STAGES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {s}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          </div>

          {stage && !isFinal && (
            <div className="bg-card border border-border rounded-sm p-5 sm:p-6 space-y-5 animate-fade-up">
              <div className="flex items-center gap-2 pb-1">
                <span className="h-2 w-2 rounded-full bg-accent" />
                <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  ход работ
                </p>
              </div>

              <Field label="Этап пройден">
                <div className="grid grid-cols-2 gap-3">
                  {['Да', 'Нет'].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setStagePassed(v)}
                      className={`h-11 rounded-sm border font-display uppercase tracking-wide text-sm transition ${
                        stagePassed === v
                          ? 'bg-foreground text-primary-foreground border-foreground'
                          : 'bg-card border-input hover:border-accent'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Дата поставки">
                <input
                  type="date"
                  min={tomorrow}
                  max={twoMonths}
                  value={deliveryDate}
                  onChange={(e) => setDeliveryDate(e.target.value)}
                  className={dateInputClass}
                />
                <p className="text-xs text-muted-foreground font-mono">
                  с завтрашнего дня, не дальше 2 месяцев
                </p>
              </Field>

              <Field label="Что привезти">
                <Select value={supply} onValueChange={setSupply}>
                  <SelectTrigger className="h-11">
                    <SelectValue placeholder="Выберите комплект" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUPPLIES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Дата начала следующего этапа">
                <input
                  type="date"
                  min={tomorrow}
                  value={nextStart}
                  onChange={(e) => setNextStart(e.target.value)}
                  className={dateInputClass}
                />
              </Field>

              <Field label="Дата окончания следующих работ">
                <input
                  type="date"
                  min={nextStart || tomorrow}
                  value={nextEnd}
                  onChange={(e) => setNextEnd(e.target.value)}
                  className={dateInputClass}
                />
              </Field>

              <Field label="Примечание">
                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="Дополнительные комментарии по объекту…"
                  className="min-h-24 resize-none"
                />
              </Field>
            </div>
          )}

          {isFinal && (
            <div className="bg-card border border-border rounded-sm p-5 sm:p-6 space-y-5 animate-fade-up">
              <div className="flex items-center gap-2 pb-1">
                <span className="h-2 w-2 rounded-full bg-accent" />
                <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                  завершение объекта
                </p>
              </div>

              <Field label="Дом сдан">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {['Да', 'Нет', 'Дом готов. Ждём подписания'].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setHouseDone(v)}
                      className={`min-h-11 px-3 py-2 rounded-sm border font-display uppercase tracking-wide text-sm transition leading-tight ${
                        houseDone === v
                          ? 'bg-foreground text-primary-foreground border-foreground'
                          : 'bg-card border-input hover:border-accent'
                      }`}
                    >
                      {v}
                    </button>
                  ))}
                </div>
              </Field>

              <Field label="Встреча с хозяином">
                <input
                  type="date"
                  value={ownerMeeting}
                  onChange={(e) => setOwnerMeeting(e.target.value)}
                  className={dateInputClass}
                />
              </Field>

              <Field label="Дата сдачи по акту">
                <input
                  type="date"
                  value={actDate}
                  onChange={(e) => setActDate(e.target.value)}
                  className={dateInputClass}
                />
              </Field>
            </div>
          )}

          {stage && (
            <div className="flex gap-3 animate-fade-up">
              <Button
                type="submit"
                className="flex-1 h-12 bg-accent text-accent-foreground hover:bg-accent/90 font-display uppercase tracking-wider text-base rounded-sm"
              >
                <Icon name="Check" size={18} className="mr-2" />
                Сохранить осмотр
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/')}
                className="h-12 rounded-sm font-display uppercase tracking-wide"
              >
                Отмена
              </Button>
            </div>
          )}
        </form>
      </main>
    </div>
  );
};

export default Inspection;
