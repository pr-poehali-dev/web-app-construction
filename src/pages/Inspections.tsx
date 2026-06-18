import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { api, Inspection } from '@/lib/api';

const Inspections = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<Inspection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api<{ inspections: Inspection[] }>('list_inspections').then((d) => {
      setItems(d.inspections || []);
      setLoading(false);
    });
  }, []);

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
              Последние осмотры
            </h1>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">история проверок</p>
          </div>
        </div>
      </header>

      <main className="container max-w-3xl py-8 sm:py-10 space-y-3">
        {loading ? (
          <p className="text-muted-foreground font-mono text-sm">Загрузка…</p>
        ) : items.length === 0 ? (
          <div className="bg-card border border-border rounded-sm p-10 text-center animate-fade-up">
            <Icon name="ClipboardList" size={32} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Осмотров пока нет.</p>
          </div>
        ) : (
          items.map((ins, i) => (
            <div
              key={ins.id}
              style={{ animationDelay: `${i * 50}ms` }}
              className="bg-card border border-border rounded-sm p-5 animate-fade-up hover:border-accent transition"
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <h3 className="font-display text-base font-600 uppercase tracking-wide leading-tight">
                  {ins.object_name}
                </h3>
                {ins.created_at && (
                  <span className="font-mono text-xs text-muted-foreground whitespace-nowrap flex items-center gap-1.5">
                    <Icon name="Clock" size={12} />
                    {new Date(ins.created_at).toLocaleDateString('ru-RU', { timeZone: 'Asia/Yekaterinburg' })}{' '}
                    {new Date(ins.created_at).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Yekaterinburg' })}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2 text-xs font-mono">
                <span className="px-2 py-1 bg-foreground text-primary-foreground rounded-sm">
                  {ins.stage}
                </span>
                {ins.house_done && (
                  <span className="px-2 py-1 bg-accent text-accent-foreground rounded-sm">
                    {ins.house_done}
                  </span>
                )}
                {ins.stage_passed && (
                  <span className={`px-2 py-1 rounded-sm ${ins.stage_passed === 'Да' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-400' : 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-400'}`}>
                    {ins.stage_passed === 'Да' ? '✓ Пройден' : `Не пройден`}
                    {ins.stage_passed === 'Нет' && ins.stage_completion != null && ` · ${ins.stage_completion}%`}
                  </span>
                )}
                {ins.supply && <span className="px-2 py-1 bg-secondary rounded-sm">{ins.supply}</span>}
              </div>
              {(ins.next_start_date || ins.delivery_date || ins.note) && (
                <div className="mt-3 pt-3 border-t border-border text-sm text-muted-foreground space-y-1">
                  {ins.delivery_date && <p>Поставка: {ins.delivery_date}</p>}
                  {ins.next_start_date && (
                    <p>
                      След. этап: {ins.next_start_date}
                      {ins.next_end_date ? ` — ${ins.next_end_date}` : ''}
                    </p>
                  )}
                  {ins.note && <p className="italic">«{ins.note}»</p>}
                </div>
              )}
            </div>
          ))
        )}
      </main>
    </div>
  );
};

export default Inspections;