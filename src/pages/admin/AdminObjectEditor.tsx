import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { api, BuildObject } from '@/lib/api';
import { Lbl, Section, dateInputClass, fullName } from './AdminShared';

// ─── Редактор объекта ─────────────────────────────────────────────────────────

const ObjectEditor = ({
  obj,
  stages,
  onSave,
}: {
  obj: BuildObject;
  stages: string[];
  onSave: (o: BuildObject) => void;
}) => {
  const [o, setO] = useState<BuildObject>({ ...obj });
  const [stageCosts, setStageCosts] = useState<Record<string, number>>({});
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'info' | 'stages'>('info');

  useEffect(() => {
    if (open) {
      api<{ costs: Record<string, number> }>('get_stage_costs', { object_id: obj.id }).then((d) =>
        setStageCosts(d.costs || {})
      );
    }
  }, [open, obj.id]);

  const set = (k: keyof BuildObject, v: string | number) =>
    setO((p) => ({ ...p, [k]: v }));

  const saveStageCost = async (stage: string, cost: number) => {
    setStageCosts((p) => ({ ...p, [stage]: cost }));
    await api('set_stage_cost', { object_id: obj.id, stage, cost });
  };

  return (
    <div className="border border-border rounded-sm overflow-hidden">
      <button
        onClick={() => setOpen((p) => !p)}
        className="w-full flex items-center justify-between px-4 py-3 bg-background hover:bg-secondary transition text-left"
      >
        <span className="font-display uppercase tracking-wide text-sm">{fullName(obj)}</span>
        <div className="flex items-center gap-2">
          {obj.address && (
            <span className="font-mono text-xs text-muted-foreground hidden sm:block truncate max-w-[200px]">
              {obj.address}
            </span>
          )}
          <Icon name={open ? 'ChevronUp' : 'ChevronDown'} size={16} className="text-muted-foreground shrink-0" />
        </div>
      </button>

      {open && (
        <div className="border-t border-border p-4 space-y-4">
          {/* Табы */}
          <div className="flex gap-1 p-1 bg-secondary rounded-sm w-fit">
            {(['info', 'stages'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 h-8 rounded-sm font-display uppercase text-xs tracking-wide transition ${
                  tab === t ? 'bg-foreground text-primary-foreground' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t === 'info' ? 'Данные объекта' : 'Стоимость этапов'}
              </button>
            ))}
          </div>

          {tab === 'info' && (
            <div className="space-y-4">
              {/* Заказчик */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Lbl>Фамилия</Lbl>
                  <Input value={o.customer_last_name || ''} onChange={(e) => set('customer_last_name', e.target.value)} className="h-10" />
                </div>
                <div>
                  <Lbl>Имя</Lbl>
                  <Input value={o.customer_first_name || ''} onChange={(e) => set('customer_first_name', e.target.value)} className="h-10" />
                </div>
                <div>
                  <Lbl>Отчество</Lbl>
                  <Input value={o.customer_middle_name || ''} onChange={(e) => set('customer_middle_name', e.target.value)} className="h-10" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Lbl>Телефон</Lbl>
                  <Input value={o.customer_phone || ''} onChange={(e) => set('customer_phone', e.target.value)} className="h-10" />
                </div>
                <div>
                  <Lbl>Проект</Lbl>
                  <Input value={o.project || ''} onChange={(e) => set('project', e.target.value)} className="h-10" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Lbl>Площадь по ДСП (м²)</Lbl>
                  <Input type="number" step="0.01" value={o.area_dsp ?? ''} onChange={(e) => set('area_dsp', e.target.value)} className="h-10" />
                </div>
                <div>
                  <Lbl>Адрес</Lbl>
                  <Input value={o.address || ''} onChange={(e) => set('address', e.target.value)} className="h-10" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Lbl>Номер договора</Lbl>
                  <Input value={o.contract_number || ''} onChange={(e) => set('contract_number', e.target.value)} className="h-10" />
                </div>
                <div>
                  <Lbl>Дата подписания</Lbl>
                  <input type="date" value={o.contract_sign_date || ''} onChange={(e) => set('contract_sign_date', e.target.value)} className={dateInputClass} />
                </div>
                <div>
                  <Lbl>Дата окончания</Lbl>
                  <input type="date" value={o.contract_end_date || ''} onChange={(e) => set('contract_end_date', e.target.value)} className={dateInputClass} />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <Lbl>Стоимость по договору (₽)</Lbl>
                  <Input type="number" value={o.cost ?? 0} onChange={(e) => set('cost', e.target.value)} className="h-10" />
                </div>
                <div>
                  <Lbl>Планируемая стоимость строительства (₽)</Lbl>
                  <Input type="number" value={o.self_cost ?? 0} onChange={(e) => set('self_cost', e.target.value)} className="h-10" />
                </div>
                <div>
                  <Lbl>Оплата агенту (₽)</Lbl>
                  <Input type="number" value={o.mortgage_cost ?? 0} onChange={(e) => set('mortgage_cost', e.target.value)} className="h-10" />
                </div>
              </div>

              <div>
                <Lbl>Банк</Lbl>
                <Input value={o.bank || ''} onChange={(e) => set('bank', e.target.value)} className="h-10" />
              </div>

              <div>
                <Lbl>Примечание</Lbl>
                <Textarea value={o.note || ''} onChange={(e) => set('note', e.target.value)} className="min-h-20 resize-none" />
              </div>

              <Button
                onClick={() => onSave(o)}
                className="h-10 bg-foreground text-primary-foreground hover:opacity-90 font-display uppercase text-xs tracking-wide rounded-sm"
              >
                <Icon name="Save" size={14} className="mr-1.5" />
                Сохранить изменения
              </Button>
            </div>
          )}

          {tab === 'stages' && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground font-mono mb-3">
                Стоимость каждого этапа вычитается из планируемой стоимости строительства при принятии осмотра.
              </p>
              {stages.map((stage) => (
                <div key={stage} className="flex items-center gap-3">
                  <span className="flex-1 text-sm truncate">{stage}</span>
                  <Input
                    type="number"
                    step="0.01"
                    value={stageCosts[stage] ?? 0}
                    onChange={(e) => setStageCosts((p) => ({ ...p, [stage]: Number(e.target.value) }))}
                    onBlur={(e) => saveStageCost(stage, Number(e.target.value))}
                    className="w-36 h-9 text-right"
                    placeholder="₽"
                  />
                </div>
              ))}
              <p className="text-xs text-muted-foreground font-mono mt-2">
                Изменения сохраняются автоматически при выходе из поля.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Секция редактирования объектов ──────────────────────────────────────────

export const ObjectsSection = ({
  objects,
  stages,
  onSave,
}: {
  objects: BuildObject[];
  stages: string[];
  onSave: (o: BuildObject) => void;
}) => (
  <Section title="Редактирование объектов" icon="Building2">
    {objects.length === 0 ? (
      <p className="text-muted-foreground text-sm">Объектов нет.</p>
    ) : (
      <div className="space-y-2">
        {objects.map((o) => (
          <ObjectEditor key={o.id} obj={o} stages={stages} onSave={onSave} />
        ))}
      </div>
    )}
  </Section>
);
