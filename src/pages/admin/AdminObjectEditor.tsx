import { useEffect, useState } from 'react';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { api, BuildObject } from '@/lib/api';
import { Lbl, Section, dateInputClass, fullName } from './AdminShared';

const COMPLETION_TYPES = ['Теплый контур', 'Черновая отделка', 'White Box'];

// ─── Редактор объекта ─────────────────────────────────────────────────────────

const ObjectEditor = ({
  obj,
  stages,
  onSave,
  onDelete,
}: {
  obj: BuildObject;
  stages: string[];
  onSave: (o: BuildObject) => void;
  onDelete: (id: number) => void;
}) => {
  const [o, setO] = useState<BuildObject>({ ...obj });
  const [stageCosts, setStageCosts] = useState<Record<string, number>>({});
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<'info' | 'stages'>('info');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

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

  const handleDelete = async () => {
    setDeleting(true);
    await api('delete_object', { id: obj.id });
    onDelete(obj.id);
  };

  return (
    <div className="border border-border rounded-sm overflow-hidden">
      {/* Шапка аккордеона */}
      <div className="flex items-center bg-background hover:bg-secondary transition">
        <button
          onClick={() => setOpen((p) => !p)}
          className="flex-1 flex items-center justify-between px-4 py-3 text-left min-w-0"
        >
          <span className="font-display uppercase tracking-wide text-sm truncate">{fullName(obj)}</span>
          <div className="flex items-center gap-2 shrink-0 ml-2">
            {obj.address && (
              <span className="font-mono text-xs text-muted-foreground hidden sm:block truncate max-w-[180px]">
                {obj.address}
              </span>
            )}
            <Icon name={open ? 'ChevronUp' : 'ChevronDown'} size={16} className="text-muted-foreground" />
          </div>
        </button>

        {/* Кнопка удаления */}
        {!confirmDelete ? (
          <button
            onClick={(e) => { e.stopPropagation(); setConfirmDelete(true); }}
            title="Удалить объект"
            className="flex h-full px-3 py-3 items-center border-l border-border text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition shrink-0"
          >
            <Icon name="Trash2" size={15} />
          </button>
        ) : (
          <div className="flex items-center gap-1 border-l border-border px-2 py-2 shrink-0 bg-destructive/5">
            <span className="text-xs text-destructive font-mono hidden sm:block">Удалить?</span>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="flex items-center gap-1 px-2 h-7 rounded-sm bg-destructive text-white text-xs font-display uppercase tracking-wide hover:bg-destructive/90 transition disabled:opacity-60"
            >
              {deleting ? <Icon name="Loader" size={12} className="animate-spin" /> : <Icon name="Check" size={12} />}
              Да
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              className="flex items-center px-2 h-7 rounded-sm border border-border text-xs font-display uppercase tracking-wide hover:bg-secondary transition"
            >
              Нет
            </button>
          </div>
        )}
      </div>

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
                  <Lbl>Площадь общая (м²)</Lbl>
                  <Input type="number" step="0.01" value={o.area_total ?? ''} onChange={(e) => set('area_total', e.target.value)} className="h-10" />
                </div>
                <div>
                  <Lbl>Адрес</Lbl>
                  <Input value={o.address || ''} onChange={(e) => set('address', e.target.value)} className="h-10" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Lbl>Номер предварительного договора</Lbl>
                  <Input value={o.contract_prelim_number || ''} onChange={(e) => set('contract_prelim_number', e.target.value)} className="h-10" />
                </div>
                <div>
                  <Lbl>Номер основного договора</Lbl>
                  <Input value={o.contract_main_number || ''} onChange={(e) => set('contract_main_number', e.target.value)} className="h-10" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

              {/* Проектное финансирование */}
              <div className="space-y-3">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <Checkbox
                    checked={!!o.project_finance}
                    onCheckedChange={(v) => setO((p) => ({ ...p, project_finance: !!v, project_finance_amount: v ? p.project_finance_amount : 0 }))}
                  />
                  <Lbl>Проектное финансирование</Lbl>
                </label>
                {o.project_finance && (
                  <div>
                    <Lbl>Сумма проектного финансирования (₽)</Lbl>
                    <Input
                      type="number"
                      step="0.01"
                      value={o.project_finance_amount ?? 0}
                      onChange={(e) => set('project_finance_amount', e.target.value)}
                      className="h-10"
                    />
                  </div>
                )}
              </div>

              {/* Комплектация */}
              <div>
                <Lbl>Комплектация</Lbl>
                <Select
                  value={o.completion_type || ''}
                  onValueChange={(v) => setO((p) => ({ ...p, completion_type: v }))}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Выберите вариант…" />
                  </SelectTrigger>
                  <SelectContent>
                    {COMPLETION_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
  onDelete,
}: {
  objects: BuildObject[];
  stages: string[];
  onSave: (o: BuildObject) => void;
  onDelete: (id: number) => void;
}) => (
  <Section title="Редактирование объектов" icon="Building2">
    {objects.length === 0 ? (
      <p className="text-muted-foreground text-sm">Объектов нет.</p>
    ) : (
      <div className="space-y-2">
        {objects.map((o) => (
          <ObjectEditor key={o.id} obj={o} stages={stages} onSave={onSave} onDelete={onDelete} />
        ))}
      </div>
    )}
  </Section>
);