import { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { api, Purchase, PurchaseAmount } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/lib/auth';

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
  if (p.status === 'ordered') {
    const dlPay = daysLeft(p.payment_date);
    if (dlPay === 0) return 'bg-red-900 text-white border-red-950';
    if (dlPay < 3)  return 'bg-red-600 text-white border-red-700';
    if (dlPay < 7)  return 'bg-amber-400 text-amber-950 border-amber-500';
    return 'bg-emerald-600 text-white border-emerald-700';
  }
  const dlDelivery = daysLeft(p.delivery_date);
  if (dlDelivery === 0) return 'bg-red-900 text-white border-red-950';
  if (dlDelivery < 3)   return 'bg-red-600 text-white border-red-700';
  if (dlDelivery < 7)   return 'bg-amber-400 text-amber-950 border-amber-500';
  return 'bg-card text-foreground border-border';
};

const urgencyLabel = (p: Purchase) => {
  if (p.status === 'paid') return 'Оплачено';
  const dl = daysLeft(p.delivery_date);
  if (dl <= 0) return 'Сегодня';
  if (dl === 1) return 'Завтра';
  return `Через ${dl} дн.`;
};

const fmtAmount = (v: number) =>
  v.toLocaleString('ru-RU', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// ── Блок стоимостей для одной закупки ─────────────────────────────────────
const AmountsBlock = ({ purchase, isLight, canEdit }: { purchase: Purchase; isLight: boolean; canEdit: boolean }) => {
  const [rows, setRows] = useState<PurchaseAmount[]>(
    purchase.amounts && purchase.amounts.length > 0
      ? purchase.amounts
      : [{ amount: 0, supplier: '' }]
  );
  const [saving, setSaving] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const saveToServer = (updated: PurchaseAmount[]) => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      setSaving(true);
      await api('save_purchase_amounts', {
        purchase_id: purchase.id,
        amounts: updated,
      });
      setSaving(false);
    }, 800);
  };

  const updateRow = (idx: number, field: keyof PurchaseAmount, val: string) => {
    const updated = rows.map((r, i) => {
      if (i !== idx) return r;
      if (field === 'amount') {
        const clean = val.replace(/[^\d.,]/g, '').replace(',', '.');
        return { ...r, amount: parseFloat(clean) || 0, _raw: clean } as PurchaseAmount & { _raw?: string };
      }
      return { ...r, [field]: val };
    });
    setRows(updated);
    saveToServer(updated);
  };

  const addRow = () => {
    const updated = [...rows, { amount: 0, supplier: '' }];
    setRows(updated);
    saveToServer(updated);
  };

  const removeRow = (idx: number) => {
    if (rows.length === 1) {
      const updated = [{ ...rows[0], amount: 0, supplier: '' }];
      setRows(updated);
      saveToServer(updated);
      return;
    }
    const updated = rows.filter((_, i) => i !== idx);
    setRows(updated);
    saveToServer(updated);
  };

  const total = rows.reduce((s, r) => s + (r.amount || 0), 0);

  const inputBase = isLight
    ? 'bg-background border border-border text-foreground placeholder:text-muted-foreground focus:border-accent'
    : 'bg-black/15 border border-white/20 text-current placeholder:text-white/50 focus:border-white/50';

  const readonlyBase = isLight
    ? 'bg-muted/50 border border-border text-foreground'
    : 'bg-black/10 border border-white/10 text-current opacity-80';

  // Если нет данных и нельзя редактировать — не показываем блок
  const hasData = rows.some((r) => r.amount > 0 || r.supplier);
  if (!canEdit && !hasData) return null;

  return (
    <div className={`mt-3 pt-3 border-t ${isLight ? 'border-border' : 'border-white/20'}`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`font-mono text-[11px] uppercase tracking-wider flex items-center gap-1.5 ${isLight ? 'text-muted-foreground' : 'opacity-70'}`}>
          Стоимость
          {!canEdit && <Icon name="Lock" size={11} className="opacity-50" />}
        </span>
        {saving && <Icon name="Loader" size={12} className="animate-spin opacity-50" />}
      </div>

      <div className="space-y-1.5">
        {rows.map((row, idx) => (
          <div key={idx} className="flex items-center gap-1.5">
            {/* Сумма */}
            <div className="relative flex items-center">
              <input
                type="text"
                inputMode="decimal"
                placeholder="0.00"
                readOnly={!canEdit}
                value={canEdit
                  ? ((row as PurchaseAmount & { _raw?: string })._raw ?? (row.amount > 0 ? String(row.amount) : ''))
                  : (row.amount > 0 ? fmtAmount(row.amount) : '—')}
                onChange={canEdit ? (e) => updateRow(idx, 'amount', e.target.value) : undefined}
                onBlur={canEdit ? (e) => {
                  const v = parseFloat(e.target.value.replace(',', '.')) || 0;
                  const updated = rows.map((r, i) => i === idx ? { ...r, amount: Math.max(0, v), _raw: undefined } as PurchaseAmount : r);
                  setRows(updated);
                  saveToServer(updated);
                } : undefined}
                className={`h-8 w-32 rounded-sm px-2 text-sm font-mono outline-none transition ${canEdit ? inputBase : readonlyBase} ${!canEdit ? 'cursor-default' : ''}`}
              />
              <span className={`absolute right-2 text-xs font-mono ${isLight ? 'text-muted-foreground' : 'opacity-60'}`}>₽</span>
            </div>

            {/* Поставщик */}
            <input
              type="text"
              placeholder={canEdit ? 'Поставщик' : ''}
              readOnly={!canEdit}
              value={row.supplier}
              onChange={canEdit ? (e) => updateRow(idx, 'supplier', e.target.value) : undefined}
              className={`h-8 flex-1 rounded-sm px-2 text-sm outline-none transition ${canEdit ? inputBase : readonlyBase} ${!canEdit ? 'cursor-default' : ''}`}
            />

            {/* Удалить строку — только если можно редактировать */}
            {canEdit && (
              <button
                onClick={() => removeRow(idx)}
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-sm transition ${
                  isLight
                    ? 'text-muted-foreground hover:text-destructive hover:bg-destructive/10'
                    : 'opacity-60 hover:opacity-100 hover:bg-white/10'
                }`}
              >
                <Icon name="X" size={13} />
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between mt-2">
        {canEdit ? (
          <button
            onClick={addRow}
            className={`flex items-center gap-1 text-xs font-mono transition ${
              isLight ? 'text-muted-foreground hover:text-foreground' : 'opacity-60 hover:opacity-100'
            }`}
          >
            <Icon name="Plus" size={13} />
            добавить сумму
          </button>
        ) : (
          <span />
        )}
        {rows.length > 1 && total > 0 && (
          <span className={`font-mono text-xs font-600 ${isLight ? 'text-foreground' : ''}`}>
            Итого: {fmtAmount(total)} ₽
          </span>
        )}
      </div>
    </div>
  );
};

// ── Основная страница ──────────────────────────────────────────────────────
const Purchases = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
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

  const onPaymentDate = (p: Purchase, val: string) => update(p.id, { payment_date: val });

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

              {/* Стоимости */}
              <AmountsBlock
                purchase={p}
                isLight={isLight(p)}
                canEdit={p.status !== 'paid' || (user?.isAdmin ?? false)}
              />

              {/* Кнопки */}
              <div className="flex flex-wrap gap-2 items-center mt-4">
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
            <Legend color="bg-red-900 border-red-950" label="сегодня (день оплаты)" />
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