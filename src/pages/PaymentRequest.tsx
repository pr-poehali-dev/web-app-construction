import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { api, BuildObject } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

type ReqType = 'purchase' | 'salary' | null;

const PaymentRequest = () => {
  const navigate = useNavigate();
  const [objects, setObjects] = useState<BuildObject[]>([]);
  const [supplies, setSupplies] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [objectId, setObjectId] = useState<number | ''>('');
  const [reqType, setReqType] = useState<ReqType>(null);

  // Закупка
  const [supply, setSupply] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [purchasePayDate, setPurchasePayDate] = useState('');
  const [purchaseAmount, setPurchaseAmount] = useState('');

  // Зарплата
  const [salaryAmount, setSalaryAmount] = useState('');
  const [salaryDate, setSalaryDate] = useState('');

  useEffect(() => {
    Promise.all([
      api<{ objects: BuildObject[] }>('list_objects'),
      api<{ supplies: string[] }>('get_settings'),
    ]).then(([od, sd]) => {
      setObjects(od.objects || []);
      setSupplies((sd as { supplies?: string[] }).supplies || []);
      setLoading(false);
    });
  }, []);

  const selectedObject = objects.find((o) => o.id === objectId);
  const objectName = selectedObject
    ? [selectedObject.customer_last_name, selectedObject.customer_first_name].filter(Boolean).join(' ')
    : '';

  const canSubmit = () => {
    if (!objectId || !reqType) return false;
    if (reqType === 'purchase') return !!supply && !!deliveryDate;
    if (reqType === 'salary') return !!salaryAmount && !!salaryDate;
    return false;
  };

  const handleSubmit = async () => {
    if (!canSubmit()) return;
    setSaving(true);
    try {
      if (reqType === 'purchase') {
        await api('create_request', {
          type: 'purchase',
          object_name: objectName,
          supply,
          delivery_date: deliveryDate,
          payment_date: purchasePayDate || null,
          amount: parseFloat(purchaseAmount.replace(',', '.')) || 0,
        });
      } else {
        await api('create_request', {
          type: 'salary',
          object_name: objectName,
          amount: parseFloat(salaryAmount.replace(',', '.')) || 0,
          payment_date: salaryDate,
        });
      }
      toast({ title: 'Заявка подана', description: 'Она появится в Ближайших закупках' });
      navigate('/purchases');
    } catch {
      toast({ title: 'Ошибка при отправке', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    'w-full h-10 rounded-sm border border-border bg-background px-3 text-sm outline-none focus:border-accent transition';
  const labelCls = 'font-mono text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5 block';

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
              Подать на оплату
            </h1>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">
              закупка или зарплата
            </p>
          </div>
        </div>
      </header>

      <main className="container max-w-2xl py-8 sm:py-10">
        {loading ? (
          <p className="text-muted-foreground font-mono text-sm">Загрузка…</p>
        ) : (
          <div className="space-y-5">

            {/* Шаг 1: Выбор объекта */}
            <div className="bg-card border border-border rounded-sm p-5 animate-fade-up">
              <div className="flex items-center gap-2 mb-4">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-accent-foreground font-mono text-[10px] font-700">1</span>
                <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Объект строительства</p>
              </div>
              <label className={labelCls}>Выберите объект</label>
              <select
                value={objectId}
                onChange={(e) => {
                  setObjectId(e.target.value ? Number(e.target.value) : '');
                  setReqType(null);
                }}
                className={inputCls}
              >
                <option value="">— выберите объект —</option>
                {objects.map((o) => (
                  <option key={o.id} value={o.id}>
                    {[o.customer_last_name, o.customer_first_name].filter(Boolean).join(' ')}
                    {o.address ? ` · ${o.address}` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Шаг 2: Тип заявки */}
            {objectId && (
              <div className="bg-card border border-border rounded-sm p-5 animate-fade-up">
                <div className="flex items-center gap-2 mb-4">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-accent-foreground font-mono text-[10px] font-700">2</span>
                  <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Тип заявки</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setReqType('purchase')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-sm border transition ${
                      reqType === 'purchase'
                        ? 'bg-accent/10 border-accent text-accent'
                        : 'border-border hover:border-accent/50'
                    }`}
                  >
                    <Icon name="Truck" size={22} />
                    <span className="font-display uppercase tracking-wide text-sm">Закупки</span>
                    <span className="font-mono text-[10px] text-muted-foreground text-center leading-snug">
                      Материалы и поставки на объект
                    </span>
                  </button>
                  <button
                    onClick={() => setReqType('salary')}
                    className={`flex flex-col items-center gap-2 p-4 rounded-sm border transition ${
                      reqType === 'salary'
                        ? 'bg-accent/10 border-accent text-accent'
                        : 'border-border hover:border-accent/50'
                    }`}
                  >
                    <Icon name="Banknote" size={22} />
                    <span className="font-display uppercase tracking-wide text-sm">Зарплата</span>
                    <span className="font-mono text-[10px] text-muted-foreground text-center leading-snug">
                      Выплата рабочим на объекте
                    </span>
                  </button>
                </div>
              </div>
            )}

            {/* Шаг 3: Детали закупки */}
            {reqType === 'purchase' && (
              <div className="bg-card border border-border rounded-sm p-5 animate-fade-up">
                <div className="flex items-center gap-2 mb-4">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-accent-foreground font-mono text-[10px] font-700">3</span>
                  <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Детали закупки</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className={labelCls}>Поставка *</label>
                    <select
                      value={supply}
                      onChange={(e) => setSupply(e.target.value)}
                      className={inputCls}
                    >
                      <option value="">— выберите поставку —</option>
                      {supplies.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={labelCls}>Срок доставки *</label>
                    <input
                      type="date"
                      value={deliveryDate}
                      onChange={(e) => setDeliveryDate(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Дата оплаты</label>
                    <input
                      type="date"
                      value={purchasePayDate}
                      onChange={(e) => setPurchasePayDate(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Сумма (₽)</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={purchaseAmount}
                      onChange={(e) => setPurchaseAmount(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Шаг 3: Детали зарплаты */}
            {reqType === 'salary' && (
              <div className="bg-card border border-border rounded-sm p-5 animate-fade-up">
                <div className="flex items-center gap-2 mb-4">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-accent-foreground font-mono text-[10px] font-700">3</span>
                  <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">Детали выплаты</p>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className={labelCls}>Сумма к выплате (₽) *</label>
                    <input
                      type="text"
                      inputMode="decimal"
                      placeholder="0.00"
                      value={salaryAmount}
                      onChange={(e) => setSalaryAmount(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className={labelCls}>Дата выплаты *</label>
                    <input
                      type="date"
                      value={salaryDate}
                      onChange={(e) => setSalaryDate(e.target.value)}
                      className={inputCls}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Кнопка отправки */}
            {reqType && (
              <button
                onClick={handleSubmit}
                disabled={!canSubmit() || saving}
                className="w-full h-12 rounded-sm font-display uppercase tracking-wide text-sm bg-foreground text-primary-foreground hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition animate-fade-up flex items-center justify-center gap-2"
              >
                {saving ? (
                  <Icon name="Loader" size={16} className="animate-spin" />
                ) : (
                  <Icon name="Send" size={16} />
                )}
                {saving ? 'Отправляю…' : 'Подать заявку'}
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default PaymentRequest;