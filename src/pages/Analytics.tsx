import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { api, BuildObject, Inspection, Purchase } from '@/lib/api';

const fmt = (n?: number) =>
  n == null || n === 0 ? '—' : new Intl.NumberFormat('ru-RU').format(n) + ' ₽';

const dateRu = (s?: string) =>
  s ? new Date(s).toLocaleDateString('ru-RU') : '—';

type SortDir = 'asc' | 'desc';

const Analytics = () => {
  const navigate = useNavigate();
  const [objects, setObjects] = useState<BuildObject[]>([]);
  const [inspections, setInspections] = useState<Inspection[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [stages, setStages] = useState<string[]>([]);
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  useEffect(() => {
    api<{ objects: BuildObject[] }>('list_objects').then((d) => setObjects(d.objects || []));
    api<{ inspections: Inspection[] }>('list_inspections').then((d) => setInspections(d.inspections || []));
    api<{ purchases: Purchase[] }>('list_purchases').then((d) => setPurchases(d.purchases || []));
    api<{ stages: string[] }>('get_settings').then((d) => setStages(d.stages || []));
  }, []);

  const done = inspections.filter((i) => i.stage === 'Дом сдан').length;
  const active = objects.length - done;

  const stageMap: Record<string, string> = {};
  const completionMap: Record<string, number | null> = {};
  inspections.forEach((i) => {
    if (i.object_name && !stageMap[i.object_name]) {
      stageMap[i.object_name] = i.stage || '';
      completionMap[i.object_name] = i.stage_completion ?? null;
    }
  });

  // Для каждого объекта строим карту: этап → последний % (берём последний осмотр по каждому этапу)
  // inspections уже отсортированы DESC по created_at
  const getStagePercents = (o: BuildObject): Record<string, number> => {
    const lastName = o.customer_last_name;
    const objInspections = inspections.filter(
      (i) => i.object_name && i.object_name.startsWith(lastName)
    );
    const result: Record<string, number> = {};
    objInspections.forEach((i) => {
      if (!i.stage) return;
      if (i.stage in result) return;
      if (i.stage_passed === 'Да') {
        result[i.stage] = 100;
      } else if (i.stage_completion != null) {
        result[i.stage] = i.stage_completion;
      }
    });
    return result;
  };

  const cards = [
    { l: 'Объектов всего', v: objects.length, icon: 'Building2' },
    { l: 'В работе', v: active < 0 ? 0 : active, icon: 'Hammer' },
    { l: 'Сдано', v: done, icon: 'CheckCircle2' },
    { l: 'Осмотров', v: inspections.length, icon: 'ClipboardCheck' },
    { l: 'Закупок активно', v: purchases.length, icon: 'Truck' },
  ];

  // Сортировка таблицы по сроку окончания договора
  const sortedObjects = [...objects].sort((a, b) => {
    const da = a.contract_end_date ? new Date(a.contract_end_date).getTime() : Infinity;
    const db = b.contract_end_date ? new Date(b.contract_end_date).getTime() : Infinity;
    return sortDir === 'asc' ? da - db : db - da;
  });

  const toggleSort = () => setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));

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
                const pct = stageKey ? completionMap[stageKey] : null;
                return (
                  <div key={o.id} className="flex items-center gap-3 border-b border-border pb-3 last:border-0">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-display uppercase tracking-wide text-sm">{name}</span>
                        {o.completion_type && (
                          <span className="font-mono text-[10px] px-1.5 py-0.5 bg-secondary rounded-sm">
                            {o.completion_type}
                          </span>
                        )}
                      </div>
                      {pct != null && (
                        <div className="flex items-center gap-2 mt-1.5">
                          <div className="flex-1 max-w-[120px] bg-secondary rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${pct >= 100 ? 'bg-emerald-500' : 'bg-accent'}`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                          <span className="font-mono text-[11px] text-muted-foreground">{pct}%</span>
                        </div>
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

        {/* Детальная таблица объектов с этапами */}
        <div className="bg-card border border-border rounded-sm animate-fade-up overflow-hidden">
          <div className="flex items-center justify-between gap-2 p-5 pb-0">
            <div className="flex items-center gap-2">
              <Icon name="TableProperties" size={15} className="text-accent" />
              <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                объекты · детальный прогресс по этапам
              </p>
            </div>
            <span className="font-mono text-[11px] text-muted-foreground">
              сортировка по сроку договора
            </span>
          </div>

          {objects.length === 0 ? (
            <p className="text-muted-foreground text-sm p-5">Нет данных.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm border-collapse min-w-[700px]">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="text-left px-4 py-2.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground whitespace-nowrap">Фамилия</th>
                    <th className="text-left px-4 py-2.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground whitespace-nowrap">Адрес</th>
                    <th className="text-left px-4 py-2.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground whitespace-nowrap">Проект</th>
                    <th className="px-4 py-2.5 whitespace-nowrap">
                      <button
                        onClick={toggleSort}
                        className="flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-accent hover:text-accent/80 transition"
                      >
                        Срок договора
                        <Icon
                          name={sortDir === 'asc' ? 'ArrowUp' : 'ArrowDown'}
                          size={11}
                        />
                      </button>
                    </th>
                    {stages.map((s) => (
                      <th key={s} className="text-center px-3 py-2.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground whitespace-nowrap max-w-[80px]">
                        <span className="block truncate max-w-[72px]" title={s}>{s}</span>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {sortedObjects.map((o, idx) => {
                    const percents = getStagePercents(o);
                    return (
                      <tr
                        key={o.id}
                        className={`border-b border-border last:border-0 ${idx % 2 === 1 ? 'bg-secondary/20' : ''}`}
                      >
                        <td className="px-4 py-3 font-display uppercase tracking-wide text-sm whitespace-nowrap">
                          {[o.customer_last_name, o.customer_first_name].filter(Boolean).join(' ')}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs max-w-[160px]">
                          <span className="block truncate" title={o.address || ''}>
                            {o.address || '—'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs whitespace-nowrap">
                          {o.project || '—'}
                        </td>
                        <td className="px-4 py-3 font-mono text-xs whitespace-nowrap">
                          {dateRu(o.contract_end_date)}
                        </td>
                        {stages.map((s) => {
                          const pct = percents[s];
                          const isDone = pct === 100;
                          const hasData = pct != null;
                          return (
                            <td key={s} className="px-3 py-3 text-center">
                              {hasData ? (
                                <div className="flex flex-col items-center gap-1">
                                  <div className="w-10 bg-secondary rounded-full h-1.5 overflow-hidden">
                                    <div
                                      className={`h-full rounded-full transition-all ${isDone ? 'bg-emerald-500' : 'bg-accent'}`}
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                  <span className={`font-mono text-[10px] ${isDone ? 'text-emerald-600 dark:text-emerald-400 font-600' : 'text-muted-foreground'}`}>
                                    {pct}%
                                  </span>
                                </div>
                              ) : (
                                <span className="text-border font-mono text-[10px]">—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Analytics;
