import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { api, Purchase } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

const daysLeft = (dateStr?: string) => {
  if (!dateStr) return 999;
  const d = new Date(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  d.setHours(0, 0, 0, 0);
  return Math.round((d.getTime() - today.getTime()) / 86400000);
};

// Возвращает классы карточки по статусу и срочности
const cardStyle = (p: Purchase) => {
  if (p.status === 'paid') return 'bg-blue-600 text-white border-blue-700';
  const dl = daysLeft(p.delivery_date);
  if (p.status === 'ordered') {
    // заказано — зелёный, но срочность всё равно подсвечивается рамкой
    if (dl <= 1) return 'bg-red-800 text-white border-red-900';
    if (dl < 3) return 'bg-red-600 text-white border-red-700';
    if (dl < 7) return 'bg-amber-400 text-amber-950 border-amber-500';
    return 'bg-emerald-600 text-white border-emerald-700';
  }
  // не заказано
  if (dl <= 1) return 'bg-red-800 text-white border-red-900';
  if (dl < 3) return 'bg-red-600 text-white border-red-700';
  if (dl < 7) return 'bg-amber-400 text-amber-950 border-amber-500';
  return 'bg-card text-foreground border-border';
};

const urgencyLabel = (p: Purchase) => {
  if (p.status === 'paid') return 'Оплачено';
  const dl = daysLeft(p.delivery_date);
  if (dl <= 0) return 'Сегодня';
  if (dl === 1) return 'Завтра';
  if (dl < 3) return `Через ${dl} дн.`;
  if (dl < 7) return `Через ${dl} дн.`;
  return `Через ${dl} дн.`;
};

const Purchases = () => {
  const navigate = useNavigate();
  const [items, setItems] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    api<{ purchases: Purchase[] }>('list_purchases').then((d) => {
      setItems(d.purchases || []);
      setLoading(false);
    });
  };
  useEffect(load, []);

  const update = async (id: number, patch: Record<string, unknown>) => {
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    await api('update_purchase', { id, ...patch });
  };

  const onOrdered = (p: Purchase) => {
    const next = p.status === 'ordered' ? 'new' : 'ordered';
    update(p.id, { status: next });
    toast({ title: next === 'ordered' ? 'Отмечено: заказано' : 'Снято: заказано' });
  };

  const onPaid = (p: Purchase) => {
    update(p.id, { status: 'paid' });
    toast({ title: 'Отмечено: оплачено' });
  };

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
              Ближайшие закупки
            </h1>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">сортировка по дате поставки</p>
          </div>
        </div>
      </header>

      <main className="container max-w-3xl py-8 sm:py-10 space-y-3">
        {loading ? (
          <p className="text-muted-foreground font-mono text-sm">Загрузка…</p>
        ) : items.length === 0 ? (
          <div className="bg-card border border-border rounded-sm p-10 text-center animate-fade-up">
            <Icon name="PackageCheck" size={32} className="mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">Активных закупок нет.</p>
          </div>
        ) : (
          items.map((p, i) => (
            <div
              key={p.id}
              style={{ animationDelay: `${i * 50}ms` }}
              className={`rounded-sm border p-4 sm:p-5 animate-fade-up transition-colors duration-300 ${cardStyle(p)}`}
            >
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <p className="font-display text-base font-600 uppercase tracking-wide leading-tight truncate">
                    {p.supply}
                  </p>
                  <p className="text-sm opacity-80 truncate">{p.object_name}</p>
                </div>
                <span className="font-mono text-xs px-2 py-1 rounded-sm bg-black/15 whitespace-nowrap">
                  {urgencyLabel(p)}
                </span>
              </div>

              <div className="flex items-center gap-2 text-sm font-mono mb-4 opacity-90">
                <Icon name="Truck" size={14} />
                поставка: {p.delivery_date}
                {p.payment_date && (
                  <span className="ml-3 flex items-center gap-1">
                    <Icon name="CreditCard" size={14} /> оплата: {p.payment_date}
                  </span>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => onOrdered(p)}
                  className={`flex items-center gap-1.5 px-3 h-9 rounded-sm font-display uppercase text-xs tracking-wide border transition ${
                    p.status === 'ordered' || p.status === 'paid'
                      ? 'bg-black/20 border-transparent'
                      : 'bg-foreground text-primary-foreground border-foreground hover:opacity-90'
                  }`}
                >
                  <Icon name="Check" size={14} />
                  {p.status === 'ordered' ? 'Заказано ✓' : 'Заказано'}
                </button>

                {(p.status === 'ordered' || p.status === 'paid') && (
                  <label className="flex items-center gap-1.5 px-3 h-9 rounded-sm bg-black/15 border border-transparent text-xs font-mono cursor-pointer">
                    <Icon name="Calendar" size={14} />
                    <span className="uppercase tracking-wide">Дата оплаты</span>
                    <input
                      type="date"
                      value={p.payment_date || ''}
                      onChange={(e) => update(p.id, { payment_date: e.target.value })}
                      className="bg-transparent outline-none cursor-pointer"
                    />
                  </label>
                )}

                {p.status !== 'paid' && (
                  <button
                    onClick={() => onPaid(p)}
                    className="flex items-center gap-1.5 px-3 h-9 rounded-sm font-display uppercase text-xs tracking-wide bg-blue-600 text-white border border-blue-700 hover:bg-blue-700 transition"
                  >
                    <Icon name="BadgeCheck" size={14} />
                    Оплачено
                  </button>
                )}
              </div>
            </div>
          ))
        )}

        <div className="bg-card border border-border rounded-sm p-4 mt-4 animate-fade-up">
          <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground mb-3">
            легенда срочности
          </p>
          <div className="flex flex-wrap gap-3 text-xs">
            <Legend color="bg-card border-border" label="более 7 дней" />
            <Legend color="bg-amber-400 border-amber-500" label="менее 7 дней" />
            <Legend color="bg-red-600 border-red-700" label="менее 3 дней" />
            <Legend color="bg-red-800 border-red-900" label="сегодня / завтра" />
            <Legend color="bg-emerald-600 border-emerald-700" label="заказано" />
            <Legend color="bg-blue-600 border-blue-700" label="оплачено" />
          </div>
        </div>
      </main>
    </div>
  );
};

const Legend = ({ color, label }: { color: string; label: string }) => (
  <span className="flex items-center gap-1.5">
    <span className={`h-3 w-3 rounded-sm border ${color}`} />
    <span className="text-muted-foreground">{label}</span>
  </span>
);

export default Purchases;
