import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { api, BuildObject, Inspection, Purchase } from '@/lib/api';

const COMPLETION_TYPES = ['Теплый контур', 'Черновая отделка', 'White Box'];

const fmt = (n?: number) =>
  n == null || n === 0 ? '—' : new Intl.NumberFormat('ru-RU').format(n) + ' ₽';

const Analytics = () => {
  const navigate = useNavigate();
  const [objects, setObjects] = useState<BuildObject[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);

  useEffect(() => {
    api<{ objects: BuildObject[] }>('list_objects').then((d) => setObjects(d.objects || []));
    api<{ inspections: Inspection[] }>('list_inspections').then((d) => setInspections(d.inspections || []));
    api<{ purchases: Purchase[] }>('list_purchases').then((d) => setPurchases(d.purchases || []));
  }, []);

  const done = inspections.filter((i) => i.stage === 'Дом сдан').length;
  const active = objects.length - done;

  const stageMap: Record<string, string> = {};
  inspections.forEach((i) => {
    if (i.object_name && !stageMap[i.object_name]) stageMap[i.object_name] = i.stage || '';
  });

  // Статистика по комплектации
  const completionStats = COMPLETION_TYPES.map((type) => ({
    type,
    count: objects.filter((o) => o.completion_type === type).length,
  }));
  const noCompletion = objects.filter((o) => !o.completion_type).length;

  // Проектное финансирование
  const pfObjects = objects.filter((o) => o.project_finance);
  const pfTotal = pfObjects.reduce((s, o) => s + (o.project_finance_amount || 0), 0);

  const cards = [
    { l: 'Объектов всего', v: objects.length, icon: 'Building2' },
    { l: 'В работе', v: active < 0 ? 0 : active, icon: 'Hammer' },
    { l: 'Сдано', v: done, icon: 'CheckCircle2' },
    { l: 'Осмотров', v: inspections.length, icon: 'ClipboardCheck' },
    { l: 'Закупок активно', v: purchases.length, icon: 'Truck' },
  ];

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
              Анализ объектов
            </h1>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">сводная статистика</p>
          </div>
        </div>
      </header>

      <main className="container max-w-4xl py-8 sm:py-10 space-y-6">
        {/* Основные метрики */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 animate-fade-up">
          {cards.map((c) => (
            <div key={c.l} className="bg-card border border-border rounded-sm p-4">
              <Icon name={c.icon} size={18} className="text-accent mb-3" />
              <p className="font-display text-3xl font-700 leading-none">{c.v}</p>
              <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground mt-2">
                {c.l}
              </p>
            </div>
          ))}
        </div>

        {/* Комплектация */}
        <div className="bg-card border border-border rounded-sm p-5 animate-fade-up">
          <div className="flex items-center gap-2 mb-4">
            <Icon name="Package" size={15} className="text-accent" />
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              комплектация
            </p>
          </div>
          {objects.length === 0 ? (
            <p className="text-muted-foreground text-sm">Нет данных.</p>
          ) : (
            <div className="space-y-2">
              {completionStats.map(({ type, count }) => (
                <div key={type} className="flex items-center gap-3">
                  <span className="font-display uppercase tracking-wide text-sm flex-1">{type}</span>
                  <div className="flex-1 bg-secondary rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full bg-accent rounded-full transition-all"
                      style={{ width: objects.length ? `${(count / objects.length) * 100}%` : '0%' }}
                    />
                  </div>
                  <span className="font-mono text-xs text-muted-foreground w-6 text-right">{count}</span>
                </div>
              ))}
              {noCompletion > 0 && (
                <div className="flex items-center gap-3">
                  <span className="font-display uppercase tracking-wide text-sm flex-1 text-muted-foreground">Не указана</span>
                  <div className="flex-1 bg-secondary rounded-full h-1.5 overflow-hidden">
                    <div
                      className="h-full bg-muted-foreground/30 rounded-full transition-all"
                      style={{ width: objects.length ? `${(noCompletion / objects.length) * 100}%` : '0%' }}
                    />
                  </div>
                  <span className="font-mono text-xs text-muted-foreground w-6 text-right">{noCompletion}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Проектное финансирование */}
        <div className="bg-card border border-border rounded-sm p-5 animate-fade-up">
          <div className="flex items-center gap-2 mb-4">
            <Icon name="Landmark" size={15} className="text-accent" />
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              проектное финансирование
            </p>
          </div>
          {objects.length === 0 ? (
            <p className="text-muted-foreground text-sm">Нет данных.</p>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="border border-border rounded-sm px-3 py-3 bg-background/40">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Объектов с ПФ</p>
                  <p className="font-display text-2xl font-700 mt-1">{pfObjects.length}</p>
                </div>
                <div className="border border-accent/30 rounded-sm px-3 py-3 bg-accent/5">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-accent">Сумма ПФ</p>
                  <p className="font-display text-lg font-700 mt-1 text-accent">{fmt(pfTotal)}</p>
                </div>
                <div className="border border-border rounded-sm px-3 py-3 bg-background/40">
                  <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">Без ПФ</p>
                  <p className="font-display text-2xl font-700 mt-1">{objects.length - pfObjects.length}</p>
                </div>
              </div>
              {pfObjects.length > 0 && (
                <div className="space-y-2 pt-1">
                  {pfObjects.map((o) => {
                    const name = [o.customer_last_name, o.customer_first_name].filter(Boolean).join(' ');
                    return (
                      <div key={o.id} className="flex items-center justify-between gap-3 border-b border-border pb-2 last:border-0">
                        <span className="font-display uppercase tracking-wide text-sm">{name}</span>
                        <span className="font-mono text-xs text-accent font-600">{fmt(o.project_finance_amount)}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Этап по объектам */}
        <div className="bg-card border border-border rounded-sm p-5 animate-fade-up">
          <div className="flex items-center gap-2 mb-4">
            <Icon name="ListChecks" size={15} className="text-accent" />
            <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
              этап по объектам
            </p>
          </div>
          {objects.length === 0 ? (
            <p className="text-muted-foreground text-sm">Нет данных.</p>
          ) : (
            <div className="space-y-3">
              {objects.map((o) => {
                const name = [o.customer_last_name, o.customer_first_name].filter(Boolean).join(' ');
                const stageKey = Object.keys(stageMap).find((k) => k.includes(o.customer_last_name));
                return (
                  <div key={o.id} className="flex items-center justify-between gap-3 border-b border-border pb-2 last:border-0">
                    <div className="min-w-0">
                      <span className="font-display uppercase tracking-wide text-sm">{name}</span>
                      {o.completion_type && (
                        <span className="ml-2 font-mono text-[10px] px-1.5 py-0.5 bg-secondary rounded-sm">
                          {o.completion_type}
                        </span>
                      )}
                    </div>
                    <span className="font-mono text-xs px-2 py-1 bg-secondary rounded-sm whitespace-nowrap shrink-0">
                      {stageKey ? stageMap[stageKey] : 'нет осмотров'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Analytics;