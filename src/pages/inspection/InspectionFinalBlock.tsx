import { Field } from './InspectionField';
import { dateInputClass } from './inspection-shared';

interface Props {
  houseDone: string;
  ownerMeeting: string;
  actDate: string;
  onHouseDoneChange: (v: string) => void;
  onOwnerMeetingChange: (v: string) => void;
  onActDateChange: (v: string) => void;
}

const InspectionFinalBlock = ({
  houseDone,
  ownerMeeting,
  actDate,
  onHouseDoneChange,
  onOwnerMeetingChange,
  onActDateChange,
}: Props) => (
  <div className="bg-card border border-border rounded-sm p-5 sm:p-6 space-y-5 animate-fade-up">
    <div className="flex items-center gap-2 pb-1">
      <span className="h-2 w-2 rounded-full bg-accent" />
      <p className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
        завершение объекта
      </p>
    </div>

    <Field label="Дом сдан">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {['Да', 'Нет', 'Дом готов. Ждём подписания'].map((v) => (
          <button
            key={v}
            type="button"
            onClick={() => onHouseDoneChange(v)}
            className={`min-h-11 px-3 py-2 rounded-sm border font-display uppercase tracking-wide text-sm transition leading-tight ${
              houseDone === v
                ? 'bg-foreground text-primary-foreground border-foreground'
                : 'bg-card border-input hover:border-accent'
            }`}
          >
            {v}
          </button>
        ))}
      </div>
    </Field>

    <Field label="Встреча с хозяином">
      <input
        type="date"
        value={ownerMeeting}
        onChange={(e) => onOwnerMeetingChange(e.target.value)}
        className={dateInputClass}
      />
    </Field>

    <Field label="Дата сдачи по акту">
      <input
        type="date"
        value={actDate}
        onChange={(e) => onActDateChange(e.target.value)}
        className={dateInputClass}
      />
    </Field>
  </div>
);

export default InspectionFinalBlock;
