import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { api, BuildObject, Inspection, Purchase } from '@/lib/api';

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

  // прогресс по объекту = последний осмотренный этап / всего
  const stageMap: Record<string, string> = {};
  inspections.forEach((i) => {
    if (i.object_name && !stageMap[i.object_name]) stageMap[i.object_name] = i.stage || '';
  });

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

        <div className="bg-card border border-border rounded-sm p-5 animate-fade-up">
          <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-4">
            этап по объектам
          </p>
          {objects.length === 0 ? (
            <p className="text-muted-foreground text-sm">Нет данных.</p>
          ) : (
            <div className="space-y-3">
              {objects.map((o) => {
                const name = [o.customer_last_name, o.customer_first_name].filter(Boolean).join(' ');
                const stage = Object.keys(stageMap).find((k) => k.includes(o.customer_last_name));
                return (
                  <div key={o.id} className="flex items-center justify-between gap-3 border-b border-border pb-2 last:border-0">
                    <span className="font-display uppercase tracking-wide text-sm">{name}</span>
                    <span className="font-mono text-xs px-2 py-1 bg-secondary rounded-sm">
                      {stage ? stageMap[stage] : 'нет осмотров'}
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
