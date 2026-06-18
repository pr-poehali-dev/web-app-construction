import Icon from '@/components/ui/icon';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { BuildObject } from '@/lib/api';
import { Field } from './InspectionField';
import { objectLabel } from './inspection-shared';

interface Props {
  objects: BuildObject[];
  stages: string[];
  object: string;
  stage: string;
  lastStage: string | null;
  lastStagePassed: string | null;
  loadingLast: boolean;
  stageWarning: boolean;
  allowedStage: string | null;
  onObjectChange: (val: string) => void;
  onStageChange: (val: string) => void;
}

const InspectionObjectStageBlock = ({
  objects,
  stages,
  object,
  stage,
  lastStage,
  lastStagePassed,
  loadingLast,
  stageWarning,
  allowedStage,
  onObjectChange,
  onStageChange,
}: Props) => (
  <div className="bg-card border border-border rounded-sm p-5 sm:p-6 space-y-5 animate-fade-up">
    <Field label="Название объекта" required>
      <Select value={object} onValueChange={onObjectChange}>
        <SelectTrigger className="h-11">
          <SelectValue placeholder="Выберите объект" />
        </SelectTrigger>
        <SelectContent>
          {objects.length === 0 && (
            <div className="px-3 py-2 text-sm text-muted-foreground">
              Сначала добавьте объект
            </div>
          )}
          {objects.map((o) => (
            <SelectItem key={o.id} value={objectLabel(o)}>
              {objectLabel(o)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>

    {/* Подсказка о текущем состоянии объекта */}
    {object && !loadingLast && (
      <div className="flex items-start gap-2 rounded-sm border border-border bg-secondary/60 px-3 py-2.5 text-sm">
        <Icon name="Info" size={15} className="text-muted-foreground mt-0.5 shrink-0" />
        <div>
          {lastStage ? (
            <>
              <span className="text-muted-foreground">Последний осмотр: </span>
              <span className="font-display uppercase tracking-wide">{lastStage}</span>
              <span className={`ml-2 font-mono text-xs px-1.5 py-0.5 rounded-sm ${lastStagePassed === 'Да' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {lastStagePassed === 'Да' ? 'принят' : 'не принят'}
              </span>
            </>
          ) : (
            <span className="text-muted-foreground">Осмотров по этому объекту ещё не было</span>
          )}
          {allowedStage && (
            <p className="text-muted-foreground mt-0.5">
              Ожидаемый этап:{' '}
              <span className="font-medium text-foreground">{allowedStage}</span>
            </p>
          )}
        </div>
      </div>
    )}
    {loadingLast && (
      <p className="text-xs text-muted-foreground font-mono">Загружаю данные объекта…</p>
    )}

    <Field label="Текущий этап" required>
      <Select value={stage} onValueChange={onStageChange}>
        <SelectTrigger className={`h-11 ${stageWarning ? 'border-destructive ring-1 ring-destructive' : ''}`}>
          <SelectValue placeholder="Выберите этап" />
        </SelectTrigger>
        <SelectContent>
          {stages.map((s) => {
            const isAllowed = s === allowedStage;
            const isPrev = lastStage && stages.indexOf(s) < stages.indexOf(lastStage ?? '') && lastStagePassed === 'Да';
            return (
              <SelectItem
                key={s}
                value={s}
                className={isPrev ? 'opacity-40' : ''}
              >
                <span className="flex items-center gap-2">
                  {s}
                  {isAllowed && (
                    <span className="ml-1 text-[10px] font-mono bg-accent/20 text-accent px-1 rounded">
                      ожидается
                    </span>
                  )}
                </span>
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </Field>

    {/* Предупреждение о несовпадении этапа */}
    {stageWarning && (
      <div className="flex items-start gap-2 rounded-sm border border-destructive/50 bg-destructive/8 px-3 py-2.5">
        <Icon name="TriangleAlert" size={16} className="text-destructive mt-0.5 shrink-0" />
        <div>
          <p className="text-sm font-display uppercase tracking-wide text-destructive">
            Вы не завершили прошлый этап
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">
            Ожидается этап «{allowedStage}». Выберите его или сначала завершите предыдущий.
          </p>
        </div>
      </div>
    )}
  </div>
);

export default InspectionObjectStageBlock;
