import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { api, BuildObject, Inspection } from '@/lib/api';

const fmt = (n?: number) =>
  n == null || n === 0 ? '—' : new Intl.NumberFormat('ru-RU').format(n) + ' ₽';

const fullName = (o: BuildObject) =>
  [o.customer_last_name, o.customer_first_name, o.customer_middle_name].filter(Boolean).join(' ');

const dateRu = (s?: string) =>
  s ? new Date(s).toLocaleDateString('ru-RU') : '—';

const ObjectCard = ({ o, stage, stageCompletion }: { o: BuildObject; stage?: string; stageCompletion?: number | null }) => (
  <div className="bg-card border border-border rounded-sm p-4 sm:p-5 hover:border-accent transition animate-fade-up">
    <div className="flex items-start justify-between gap-3 mb-3">
      <div className="min-w-0">
        <h3 className="font-display text-base font-600 uppercase tracking-wide leading-tight truncate">
          {fullName(o)}
        </h3>
        {o.project && <p className="text-xs text-muted-foreground mt-0.5">{o.project}</p>}
        {o.address && <p className="text-sm text-muted-foreground truncate">{o.address}</p>}
      </div>
      <div className="flex flex-col items-end gap-1 shrink-0">
        {stage && (
          <span className="font-mono text-[11px] px-2 py-1 bg-accent/15 text-accent rounded-sm whitespace-nowrap border border-accent/30">
            {stage}
          </span>
        )}
        {stage && stageCompletion != null && (
          <div className="flex items-center gap-1.5">
            <div className="w-16 bg-secondary rounded-full h-1.5 overflow-hidden">
              <div
                className={`h-full rounded-full ${stageCompletion >= 100 ? 'bg-emerald-500' : 'bg-accent'}`}
                style={{ width: `${stageCompletion}%` }}
              />
            </div>
            <span className="font-mono text-[11px] text-muted-foreground">{stageCompletion}%</span>
          </div>
        )}
        {o.completion_type && (
          <span className="font-mono text-[11px] px-2 py-1 bg-secondary rounded-sm whitespace-nowrap">
            {o.completion_type}
          </span>
        )}
        {o.bank && (
          <span className="font-mono text-[11px] px-2 py-1 bg-secondary rounded-sm whitespace-nowrap">
            {o.bank}
          </span>
        )}
      </div>
    </div>

    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 mb-3">
      {[
        { l: 'Осн. договор', v: o.contract_main_number || '—' },
        { l: 'Пред. договор', v: o.contract_prelim_number || '—' },
        { l: 'Площадь общая', v: o.area_total ? `${o.area_total} м²` : '—' },
        { l: 'Нач. договора', v: dateRu(o.contract_sign_date) },
        { l: 'Окон. договора', v: dateRu(o.contract_end_date) },
      ].map((f) => (
        <div key={f.l} className="border border-border rounded-sm px-3 py-2 bg-background/40">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{f.l}</p>
          <p className="font-display text-sm font-500 mt-0.5 truncate">{f.v}</p>
        </div>
      ))}
    </div>

    <div className="grid grid-cols-3 gap-2 mb-2">
      {[
        { l: 'Стоимость по договору', v: o.cost },
        { l: 'План. стоимость стр-ва', v: o.self_cost },
        { l: 'Оплата агенту', v: o.mortgage_cost },
      ].map((f) => (
        <div key={f.l} className="border border-border rounded-sm px-3 py-2 bg-background/40">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">{f.l}</p>
          <p className="font-display text-sm font-500 mt-0.5">{fmt(f.v)}</p>
        </div>
      ))}
    </div>

    {/* Проектное финансирование */}
    {o.project_finance && (
      <div className="mb-2 border border-accent/30 rounded-sm px-3 py-2 bg-accent/5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Icon name="Landmark" size={13} className="text-accent shrink-0" />
          <p className="font-mono text-[10px] uppercase tracking-wider text-accent">Проектное финансирование</p>
        </div>
        {o.project_finance_amount ? (
          <p className="font-display text-sm font-600 text-accent">{fmt(o.project_finance_amount)}</p>
        ) : null}
      </div>
    )}

    <div className="grid grid-cols-2 gap-2">
      <div className="border border-border rounded-sm px-3 py-2 bg-background/40">
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Фактические расходы</p>
        <p className="font-display text-sm font-500 mt-0.5">{fmt(o.actual_expenses)}</p>
      </div>
      <div className={`rounded-sm px-3 py-2 border ${
        ((o.cost || 0) - (o.actual_expenses || 0)) >= 0
          ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800'
          : 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800'
      }`}>
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Прибыль</p>
        <p className={`font-display text-sm font-600 mt-0.5 ${
          ((o.cost || 0) - (o.actual_expenses || 0)) >= 0
            ? 'text-emerald-700 dark:text-emerald-400'
            : 'text-red-600 dark:text-red-400'
        }`}>
          {fmt((o.cost || 0) - (o.actual_expenses || 0))}
        </p>
      </div>
    </div>

    {o.note && (
      <p className="mt-3 text-xs text-muted-foreground italic border-t border-border pt-2">
        {o.note}
      </p>
    )}
  </div>
);

const SectionHeader = ({
  title,
  count,
  icon,
}: {
  title: string;
  count: number;
  icon: string;
}) => (
  <div className="flex items-center gap-3 mb-3">
    <div className="flex h-8 w-8 items-center justify-center bg-foreground text-accent rounded-sm shrink-0">
      <Icon name={icon} size={16} />
    </div>
    <h2 className="font-display text-xl font-600 uppercase tracking-wide">{title}</h2>
    <span className="font-mono text-xs px-2 py-0.5 bg-secondary rounded-sm">{count}</span>
    <div className="flex-1 border-t border-border" />
  </div>
);

const Objects = () => {
  const navigate = useNavigate();
  const [objects, setObjects] = useState<BuildObject[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api<{ objects: BuildObject[] }>('list_objects'),
      api<{ inspections: Inspection[] }>('list_inspections'),
    ]).then(([od, id]) => {
      setObjects(od.objects || []);
      setInspections(id.inspections || []);
      setLoading(false);
    });
  }, []);

  // Последний этап каждого объекта (объект идентифицируется по ФИО + адресу)
  const latestStage: Record<number, string> = {};
  const latestCompletion: Record<number, number | null> = {};
  const doneIds = new Set<number>();

  objects.forEach((o) => {
    const label = fullName(o) + (o.address ? ` — ${o.address}` : '');
    // inspections отсортированы DESC по created_at
    const ins = inspections.find((i) => i.object_name && i.object_name.startsWith(fullName(o).split(' ')[0]));
    if (ins?.stage) latestStage[o.id] = ins.stage;
    if (ins) latestCompletion[o.id] = ins.stage_completion ?? null;
    // Если в любом осмотре по этому объекту stage_passed='Да' И stage='Дом сдан' → готов
    const hasDone = inspections.some(
      (i) =>
        i.object_name &&
        i.object_name.startsWith(fullName(o).split(' ')[0]) &&
        i.stage === 'Дом сдан' &&
        i.stage_passed === 'Да'
    );
    if (hasDone) doneIds.add(o.id);
    // Также, если в house_done стоит "Да"
    const hasDoneHouse = inspections.some(
      (i) =>
        i.object_name &&
        i.object_name.startsWith(fullName(o).split(' ')[0]) &&
        i.house_done === 'Да'
    );
    if (hasDoneHouse) doneIds.add(o.id);
    void label;
  });

  const active = objects.filter((o) => !doneIds.has(o.id));
  const done = objects.filter((o) => doneIds.has(o.id));

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-card/70 backdrop-blur-sm sticky top-0 z-10">
        <div className="container max-w-4xl flex items-center gap-3 py-4">
          <button
            onClick={() => navigate('/')}
            className="flex h-9 w-9 items-center justify-center rounded-sm border border-border hover:border-accent hover:text-accent transition"
          >
            <Icon name="ArrowLeft" size={18} />
          </button>
          <div>
            <h1 className="font-display text-lg font-600 uppercase tracking-wider leading-none">
              Все объекты
            </h1>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">
              {objects.length} объектов · сортировка по дате договора
            </p>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl py-8 sm:py-10 space-y-10">
        {loading ? (
          <p className="text-muted-foreground font-mono text-sm">Загрузка…</p>
        ) : (
          <>
            {/* В работе */}
            <section>
              <SectionHeader title="В работе" count={active.length} icon="Hammer" />
              {active.length === 0 ? (
                <div className="bg-card border border-border rounded-sm p-8 text-center">
                  <p className="text-muted-foreground text-sm">Нет активных объектов.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {active.map((o, i) => (
                    <div key={o.id} style={{ animationDelay: `${i * 50}ms` }}>
                      <ObjectCard o={o} stage={latestStage[o.id]} stageCompletion={latestCompletion[o.id]} />
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Готовые */}
            <section>
              <SectionHeader title="Готовые" count={done.length} icon="CheckCircle2" />
              {done.length === 0 ? (
                <div className="bg-card border border-border rounded-sm p-8 text-center">
                  <p className="text-muted-foreground text-sm">
                    Завершённых объектов пока нет.
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {done.map((o, i) => (
                    <div key={o.id} style={{ animationDelay: `${i * 50}ms` }}>
                      <ObjectCard o={o} stage="Дом сдан" stageCompletion={100} />
                    </div>
                  ))}
                </div>
              )}
            </section>
          </>
        )}
      </main>
    </div>
  );
};

export default Objects;