import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Field } from './InspectionField';
import { dateInputClass, tomorrow, twoMonths } from './inspection-shared';

interface Props {
  supplies: string[];
  stagePassed: string;
  stageCompletion: string;
  deliveryDate: string;
  supply: string;
  nextStart: string;
  nextEnd: string;
  note: string;
  onStagePassedChange: (v: string) => void;
  onStageCompletionChange: (v: string) => void;
  onDeliveryDateChange: (v: string) => void;
  onSupplyChange: (v: string) => void;
  onNextStartChange: (v: string) => void;
  onNextEndChange: (v: string) => void;
  onNoteChange: (v: string) => void;
}

const InspectionWorkBlock = ({
  supplies,
  stagePassed,
  stageCompletion,
  deliveryDate,
  supply,
  nextStart,
  nextEnd,
  note,
  onStagePassedChange,
  onStageCompletionChange,
  onDeliveryDateChange,
  onSupplyChange,
  onNextStartChange,
  onNextEndChange,
  onNoteChange,
}: Props) => (
  <div className="bg-card border border-border rounded-sm p-5 sm:p-6 space-y-5 animate-fade-up">
    <div className="flex items-center gap-2 pb-1">
      <span className="h-2 w-2 rounded-full bg-accent" />
      <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
        ход работ
      </p>
    </div>

    <Field label="Этап пройден">
      <div className="grid grid-cols-2 gap-3">
        {['Да', 'Нет'].map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => {
              onStagePassedChange(v);
              if (v === 'Да') onStageCompletionChange('');
            }}
            className={`h-11 rounded-sm border font-display uppercase tracking-wide text-sm transition ${
              stagePassed === v
                ? 'bg-foreground text-primary-foreground border-foreground'
                : 'bg-card border-input hover:border-accent'
            }`}
          >
            {v}
          </button>
        ))}
      </div>
    </Field>

    {/* % выполнения — только при ответе "Нет" */}
    {stagePassed === 'Нет' && (
      <Field label="% выполнения">
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Input
              type="number"
              min={0}
              max={100}
              value={stageCompletion}
              onChange={(e) => {
                const v = Math.max(0, Math.min(100, parseInt(e.target.value) || 0));
                onStageCompletionChange(String(v));
              }}
              className="h-11 w-28 font-mono text-base"
              placeholder="0"
              autoFocus
            />
            <span className="font-mono text-lg text-muted-foreground">%</span>
          </div>
          {stageCompletion !== '' && (
            <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-accent rounded-full transition-all"
                style={{ width: `${Math.max(0, Math.min(100, parseInt(stageCompletion) || 0))}%` }}
              />
            </div>
          )}
        </div>
      </Field>
    )}

    <Field label="Дата поставки">
      <input
        type="date"
        min={tomorrow}
        max={twoMonths}
        value={deliveryDate}
        onChange={(e) => onDeliveryDateChange(e.target.value)}
        className={dateInputClass}
      />
      <p className="text-xs text-muted-foreground font-mono">
        с завтрашнего дня, не дальше 2 месяцев
      </p>
    </Field>

    <Field label="Что привезти">
      <Select value={supply} onValueChange={onSupplyChange}>
        <SelectTrigger className="h-11">
          <SelectValue placeholder="Выберите комплект" />
        </SelectTrigger>
        <SelectContent>
          {supplies.map((s) => (
            <SelectItem key={s} value={s}>
              {s}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>

    <Field label="Дата начала следующего этапа">
      <input
        type="date"
        min={tomorrow}
        value={nextStart}
        onChange={(e) => onNextStartChange(e.target.value)}
        className={dateInputClass}
      />
    </Field>

    <Field label="Дата окончания следующих работ">
      <input
        type="date"
        min={nextStart || tomorrow}
        value={nextEnd}
        onChange={(e) => onNextEndChange(e.target.value)}
        className={dateInputClass}
      />
    </Field>

    <Field label="Примечание">
      <Textarea
        value={note}
        onChange={(e) => onNoteChange(e.target.value)}
        placeholder="Дополнительные комментарии по объекту…"
        className="min-h-24 resize-none"
      />
    </Field>
  </div>
);

export default InspectionWorkBlock;
