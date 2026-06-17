import { useEffect, useState } from 'react';
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
import { api, BuildObject } from '@/lib/api';

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

const objectLabel = (o: BuildObject) =>
  [o.customer_last_name, o.customer_first_name].filter(Boolean).join(' ') +
  (o.address ? ` — ${o.address}` : ` (объект #${o.id})`);

const Inspection = () => {
  const navigate = useNavigate();
  const [objects, setObjects] = useState<BuildObject[]>([]);
  const [stages, setStages] = useState<string[]>([]);
  const [supplies, setSupplies] = useState<string[]>([]);

  const [object, setObject] = useState('');
  const [stage, setStage] = useState('');

  // Последний осмотр по выбранному объекту
  const [lastStage, setLastStage] = useState<string | null>(null);
  const [lastStagePassed, setLastStagePassed] = useState<string | null>(null);
  const [loadingLast, setLoadingLast] = useState(false);

  // Блок: выбран неверный этап
  const [stageWarning, setStageWarning] = useState(false);

  const [stagePassed, setStagePassed] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [supply, setSupply] = useState('');
  const [nextStart, setNextStart] = useState('');
  const [nextEnd, setNextEnd] = useState('');
  const [note, setNote] = useState('');

  const [houseDone, setHouseDone] = useState('');
  const [ownerMeeting, setOwnerMeeting] = useState('');
  const [actDate, setActDate] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api<{ objects: BuildObject[] }>('list_objects').then((d) => setObjects(d.objects || []));
    api<{ stages: string[]; supplies: string[] }>('get_settings').then((d) => {
      setStages(d.stages || []);
      setSupplies(d.supplies || []);
    });
  }, []);

  // При смене объекта — загружаем его последний этап
  const handleObjectChange = (val: string) => {
    setObject(val);
    setStage('');
    setStageWarning(false);
    setLastStage(null);
    setLastStagePassed(null);
    setLoadingLast(true);
    api<{ stage: string | null; stage_passed: string | null }>('get_last_stage', {
      object_name: val,
    }).then((d) => {
      setLastStage(d.stage ?? null);
      setLastStagePassed(d.stage_passed ?? null);
      setLoadingLast(false);
    });
  };

  // Вычисляем «разрешённый» следующий этап
  const allowedStage = (() => {
    if (!lastStage) return stages[0] ?? null; // нет осмотров — первый этап
    const idx = stages.indexOf(lastStage);
    if (idx === -1) return null;
    // Если последний этап был принят — следующий по порядку
    if (lastStagePassed === 'Да') return stages[idx + 1] ?? null;
    // Если не принят — повторить тот же
    return lastStage;
  })();

  // Обработка выбора этапа: проверяем совпадение с allowedStage
  const handleStageChange = (val: string) => {
    if (allowedStage && val !== allowedStage && val !== lastStage) {
      // Этап выбран, но он не является ожидаемым следующим
      setStage(val);
      setStageWarning(true);
    } else {
      setStage(val);
      setStageWarning(false);
    }
  };

  const isFinal = stage === 'Дом сдан';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!object || !stage) {
      toast({ title: 'Заполните название объекта и этап', variant: 'destructive' });
      return;
    }
    if (stageWarning) {
      toast({
        title: 'Вы не завершили прошлый этап',
        description: `Ожидаемый этап: «${allowedStage}»`,
        variant: 'destructive',
      });
      return;
    }
    setSaving(true);
    try {
      await api('add_inspection', {
        object_name: object,
        stage,
        stage_passed: stagePassed,
        delivery_date: deliveryDate,
        supply,
        next_start_date: nextStart,
        next_end_date: nextEnd,
        note,
        house_done: houseDone,
        owner_meeting_date: ownerMeeting,
        act_date: actDate,
      });
      toast({ title: 'Осмотр сохранён', description: `${object} · ${stage}` });
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

          {/* Выбор объекта и этапа */}
          <div className="bg-card border border-border rounded-sm p-5 sm:p-6 space-y-5 animate-fade-up">
            <Field label="Название объекта" required>
              <Select value={object} onValueChange={handleObjectChange}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Выберите объект" />
                </SelectTrigger>
                <SelectContent>
                  {objects.length === 0 && (
                    <div className="px-3 py-2 text-sm text-muted-foreground">
                      Сначала добавьте объект
                    </div>
                  )}
                  {objects.map((o) => (
                    <SelectItem key={o.id} value={objectLabel(o)}>
                      {objectLabel(o)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>

            {/* Подсказка о текущем состоянии объекта */}
            {object && !loadingLast && (
              <div className="flex items-start gap-2 rounded-sm border border-border bg-secondary/60 px-3 py-2.5 text-sm">
                <Icon name="Info" size={15} className="text-muted-foreground mt-0.5 shrink-0" />
                <div>
                  {lastStage ? (
                    <>
                      <span className="text-muted-foreground">Последний осмотр: </span>
                      <span className="font-display uppercase tracking-wide">{lastStage}</span>
                      <span className={`ml-2 font-mono text-xs px-1.5 py-0.5 rounded-sm ${lastStagePassed === 'Да' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                        {lastStagePassed === 'Да' ? 'принят' : 'не принят'}
                      </span>
                    </>
                  ) : (
                    <span className="text-muted-foreground">Осмотров по этому объекту ещё не было</span>
                  )}
                  {allowedStage && (
                    <p className="text-muted-foreground mt-0.5">
                      Ожидаемый этап:{' '}
                      <span className="font-medium text-foreground">{allowedStage}</span>
                    </p>
                  )}
                </div>
              </div>
            )}
            {loadingLast && (
              <p className="text-xs text-muted-foreground font-mono">Загружаю данные объекта…</p>
            )}

            <Field label="Текущий этап" required>
              <Select value={stage} onValueChange={handleStageChange}>
                <SelectTrigger className={`h-11 ${stageWarning ? 'border-destructive ring-1 ring-destructive' : ''}`}>
                  <SelectValue placeholder="Выберите этап" />
                </SelectTrigger>
                <SelectContent>
                  {stages.map((s) => {
                    const isAllowed = s === allowedStage;
                    const isPrev = lastStage && stages.indexOf(s) < stages.indexOf(lastStage ?? '') && lastStagePassed === 'Да';
                    return (
                      <SelectItem
                        key={s}
                        value={s}
                        className={isPrev ? 'opacity-40' : ''}
                      >
                        <span className="flex items-center gap-2">
                          {s}
                          {isAllowed && (
                            <span className="ml-1 text-[10px] font-mono bg-accent/20 text-accent px-1 rounded">
                              ожидается
                            </span>
                          )}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </Field>

            {/* Предупреждение о несовпадении этапа */}
            {stageWarning && (
              <div className="flex items-start gap-2 rounded-sm border border-destructive/50 bg-destructive/8 px-3 py-2.5">
                <Icon name="TriangleAlert" size={16} className="text-destructive mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-display uppercase tracking-wide text-destructive">
                    Вы не завершили прошлый этап
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Ожидается этап «{allowedStage}». Выберите его или сначала завершите предыдущий.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Ход работ (не финальный этап) */}
          {stage && !isFinal && !stageWarning && (
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
                    {supplies.map((s) => (
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

          {/* Финальный этап «Дом сдан» */}
          {isFinal && !stageWarning && (
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

          {/* Кнопки */}
          {stage && (
            <div className="flex gap-3 animate-fade-up">
              <Button
                type="submit"
                disabled={saving || stageWarning}
                title={stageWarning ? 'Вы не завершили прошлый этап' : ''}
                className={`flex-1 h-12 font-display uppercase tracking-wider text-base rounded-sm transition ${
                  stageWarning
                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                    : 'bg-accent text-accent-foreground hover:bg-accent/90'
                }`}
              >
                <Icon
                  name={saving ? 'Loader' : stageWarning ? 'Lock' : 'Check'}
                  size={18}
                  className={`mr-2 ${saving ? 'animate-spin' : ''}`}
                />
                {saving ? 'Сохраняю…' : stageWarning ? 'Завершите прошлый этап' : 'Сохранить осмотр'}
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
