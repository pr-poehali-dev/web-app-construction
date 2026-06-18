import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { api, BuildObject, Inspection } from '@/lib/api';

const fmt = (n?: number) =>
  n == null ? '—' : new Intl.NumberFormat('ru-RU').format(n) + ' ₽';

const objectLabel = (o: BuildObject) =>
  [o.customer_last_name, o.customer_first_name].filter(Boolean).join(' ') || `Объект #${o.id}`;

const Balance = () => {
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

  // Последний осмотр по объекту (inspections отсортированы DESC)
  const getLastIns = (o: BuildObject) =>
    inspections.find((i) => i.object_name && i.object_name.startsWith(o.customer_last_name));

  const totals = objects.reduce(
    (a, o) => ({
      cost: a.cost + (o.cost || 0),
      self: a.self + (o.self_cost || 0),
      actual: a.actual + (o.actual_expenses || 0),
      profit: a.profit + ((o.cost || 0) - (o.actual_expenses || 0) - (o.mortgage_cost || 0)),
    }),
    { cost: 0, self: 0, actual: 0, profit: 0 }
  );

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
              Баланс объектов
            </h1>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">финансовое состояние</p>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl py-8 sm:py-10 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 animate-fade-up">
          {[
            { l: 'Общая стоимость по договору', v: totals.cost, icon: 'Wallet' },
            { l: 'Фактические расходы', v: totals.actual, icon: 'Receipt' },
            { l: 'Прибыль', v: totals.profit, icon: 'TrendingUp', accent: true },
          ].map((t) => (
            <div
              key={t.l}
              className={`p-5 rounded-sm border ${t.accent ? 'bg-foreground text-primary-foreground border-foreground' : 'bg-card border-border'}`}
            >
              <div className="flex items-center justify-between mb-3">
                <p className={`font-mono text-xs uppercase tracking-wider ${t.accent ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                  {t.l}
                </p>
                <Icon name={t.icon} size={16} className={t.accent ? 'text-accent' : 'text-muted-foreground'} />
              </div>
              <p className="font-display text-2xl font-600">{fmt(t.v)}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <p className="text-muted-foreground font-mono text-sm">Загрузка…</p>
        ) : objects.length === 0 ? (
          <div className="bg-card border border-border rounded-sm p-10 text-center animate-fade-up">
            <Icon name="Inbox" size={32} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Объектов пока нет. Добавьте первый объект.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {objects.map((o, i) => (
              <div
                key={o.id}
                style={{ animationDelay: `${i * 50}ms` }}
                className="bg-card border border-border rounded-sm p-5 animate-fade-up hover:border-accent transition"
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div>
                    <h3 className="font-display text-lg font-500 uppercase tracking-wide leading-tight">
                      {objectLabel(o)}
                    </h3>
                    {o.address && <p className="text-sm text-muted-foreground mt-0.5">{o.address}</p>}
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    {o.bank && (
                      <span className="font-mono text-xs px-2 py-1 bg-secondary rounded-sm whitespace-nowrap">
                        {o.bank}
                      </span>
                    )}
                    {(() => {
                      const ins = getLastIns(o);
                      if (!ins?.stage) return null;
                      const pct = ins.stage_completion ?? null;
                      return (
                        <div className="flex flex-col items-end gap-1">
                          <span className="font-mono text-[11px] px-2 py-0.5 bg-accent/15 text-accent border border-accent/30 rounded-sm whitespace-nowrap">
                            {ins.stage}
                          </span>
                          {pct != null && (
                            <div className="flex items-center gap-1.5">
                              <div className="w-16 bg-secondary rounded-full h-1.5 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${pct >= 100 ? 'bg-emerald-500' : 'bg-accent'}`}
                                  style={{ width: `${pct}%` }}
                                />
                              </div>
                              <span className="font-mono text-[11px] text-muted-foreground">{pct}%</span>
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-2">
                  {[
                    { l: 'Стоимость по договору', v: o.cost },
                    { l: 'Планируемая стоимость строительства', v: o.self_cost },
                    { l: 'Оплата агенту', v: o.mortgage_cost },
                  ].map((p) => (
                    <div key={p.l} className="border border-border rounded-sm px-3 py-2.5 bg-background/40">
                      <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
                        {p.l}
                      </p>
                      <p className="font-display text-base font-500">{fmt(p.v)}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="border border-border rounded-sm px-3 py-2.5 bg-background/40">
                    <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
                      Фактические расходы
                    </p>
                    <p className="font-display text-base font-500">{fmt(o.actual_expenses)}</p>
                  </div>
                  <div className={`rounded-sm px-3 py-2.5 border ${
                    ((o.cost || 0) - (o.actual_expenses || 0) - (o.mortgage_cost || 0)) >= 0
                      ? 'bg-emerald-50 border-emerald-200 dark:bg-emerald-950/30 dark:border-emerald-800'
                      : 'bg-red-50 border-red-200 dark:bg-red-950/30 dark:border-red-800'
                  }`}>
                    <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground mb-1">
                      Прибыль
                    </p>
                    <p className={`font-display text-base font-600 ${
                      ((o.cost || 0) - (o.actual_expenses || 0) - (o.mortgage_cost || 0)) >= 0
                        ? 'text-emerald-700 dark:text-emerald-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}>
                      {fmt((o.cost || 0) - (o.actual_expenses || 0) - (o.mortgage_cost || 0))}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <p className="text-xs text-muted-foreground font-mono">
          Стоимость по договору, планируемую стоимость строительства и оплату агенту можно изменить на странице администратора.
        </p>
      </main>
    </div>
  );
};

export default Balance;