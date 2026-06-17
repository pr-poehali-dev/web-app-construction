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

const cardStyle = (p: Purchase) => {
  if (p.status === 'paid') return 'bg-blue-600 text-white border-blue-700';
  // Срочность по дате оплаты если есть, иначе по дате поставки
  const dl = daysLeft(p.payment_date || p.delivery_date);
  if (p.status === 'ordered') {
    if (dl <= 1) return 'bg-red-800 text-white border-red-900';
    if (dl < 3) return 'bg-red-600 text-white border-red-700';
    if (dl < 7) return 'bg-amber-400 text-amber-950 border-amber-500';
    return 'bg-emerald-600 text-white border-emerald-700';
  }
  const dlDelivery = daysLeft(p.delivery_date);
  if (dlDelivery <= 1) return 'bg-red-800 text-white border-red-900';
  if (dlDelivery < 3) return 'bg-red-600 text-white border-red-700';
  if (dlDelivery < 7) return 'bg-amber-400 text-amber-950 border-amber-500';
  return 'bg-card text-foreground border-border';
};

const urgencyLabel = (p: Purchase) => {
  if (p.status === 'paid') return 'Оплачено';
  const dl = daysLeft(p.delivery_date);
  if (dl <= 0) return 'Сегодня';
  if (dl === 1) return 'Завтра';
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

  // Локальное обновление + сохранение в БД
  const update = async (id: number, patch: Record<string, unknown>) => {
    setItems((prev) => prev.map((p) => (p.id === id ? { ...p, ...patch } : p)));
    await api('update_purchase', { id, ...patch });
  };

  const onPaymentDate = (p: Purchase, val: string) => {
    update(p.id, { payment_date: val });
  };

  const onOrdered = (p: Purchase) => {
    if (!p.payment_date) {
      toast({ title: 'Сначала укажите дату оплаты', variant: 'destructive' });
      return;
    }
    const next = p.status === 'ordered' ? 'new' : 'ordered';
    update(p.id, { status: next });
    toast({ title: next === 'ordered' ? 'Отмечено: заказано' : 'Снято: заказано' });
  };

  const onPaid = (p: Purchase) => {
    update(p.id, { status: 'paid' });
    toast({ title: 'Отмечено: оплачено' });
  };

  const isLight = (p: Purchase) =>
    p.status !== 'paid' && p.status !== 'ordered' && daysLeft(p.delivery_date) >= 7;

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
            <p className="text-xs text-muted-foreground font-mono mt-0.5">
              сортировка по дате поставки
            </p>
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
              {/* Заголовок */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <p className="font-display text-base font-600 uppercase tracking-wide leading-tight truncate">
                    {p.supply}
                  </p>
                  <p className="text-sm opacity-75 truncate">{p.object_name}</p>
                </div>
                <span className={`font-mono text-xs px-2 py-1 rounded-sm whitespace-nowrap ${isLight(p) ? 'bg-foreground/10' : 'bg-black/20'}`}>
                  {urgencyLabel(p)}
                </span>
              </div>

              {/* Даты */}
              <div className={`flex flex-wrap items-center gap-x-4 gap-y-1 text-sm font-mono mb-4 ${isLight(p) ? 'text-muted-foreground' : 'opacity-85'}`}>
                <span className="flex items-center gap-1">
                  <Icon name="Truck" size={13} />
                  поставка: {p.delivery_date}
                </span>
                {p.payment_date && (
                  <span className="flex items-center gap-1">
                    <Icon name="CreditCard" size={13} />
                    оплата: {p.payment_date}
                  </span>
                )}
              </div>

              {/* Кнопки — строгий порядок: Дата оплаты → Заказано → Оплачено */}
              <div className="flex flex-wrap gap-2 items-center">

                {/* 1. Поле даты оплаты — всегда, если не оплачено */}
                {p.status !== 'paid' && (
                  <label className={`flex items-center gap-1.5 px-3 h-9 rounded-sm text-xs font-mono cursor-pointer border transition ${
                    isLight(p)
                      ? 'bg-secondary border-border text-foreground'
                      : 'bg-black/15 border-transparent text-current'
                  }`}>
                    <Icon name="Calendar" size={14} />
                    <span className="uppercase tracking-wide">Дата оплаты</span>
                    <input
                      type="date"
                      value={p.payment_date || ''}
                      onChange={(e) => onPaymentDate(p, e.target.value)}
                      className="bg-transparent outline-none cursor-pointer w-[110px]"
                    />
                  </label>
                )}

                {/* 2. Кнопка Заказано — только если не оплачено */}
                {p.status !== 'paid' && (
                  <button
                    onClick={() => onOrdered(p)}
                    title={!p.payment_date ? 'Сначала укажите дату оплаты' : ''}
                    className={`flex items-center gap-1.5 px-3 h-9 rounded-sm font-display uppercase text-xs tracking-wide border transition ${
                      p.status === 'ordered'
                        ? 'bg-black/20 border-transparent'
                        : !p.payment_date
                          ? isLight(p)
                            ? 'bg-muted text-muted-foreground border-border cursor-not-allowed opacity-50'
                            : 'bg-black/10 border-transparent cursor-not-allowed opacity-50'
                          : isLight(p)
                            ? 'bg-foreground text-primary-foreground border-foreground hover:opacity-90'
                            : 'bg-black/25 border-transparent hover:bg-black/35'
                    }`}
                  >
                    <Icon name={p.status === 'ordered' ? 'CheckCheck' : 'Check'} size={14} />
                    {p.status === 'ordered' ? 'Заказано ✓' : 'Заказано'}
                  </button>
                )}

                {/* 3. Кнопка Оплачено — только если уже «Заказано» */}
                {p.status === 'ordered' && (
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

        {/* Легенда */}
        <div className="bg-card border border-border rounded-sm p-4 mt-2 animate-fade-up">
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
          <p className="font-mono text-[11px] text-muted-foreground mt-3 leading-relaxed">
            Порядок: сначала укажите дату оплаты → нажмите «Заказано» → затем «Оплачено»
          </p>
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
