import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { api, BuildObject } from '@/lib/api';
import InspectionObjectStageBlock from './inspection/InspectionObjectStageBlock';
import InspectionWorkBlock from './inspection/InspectionWorkBlock';
import InspectionFinalBlock from './inspection/InspectionFinalBlock';

const Inspection = () => {
  const navigate = useNavigate();
  const [objects, setObjects] = useState<BuildObject[]>([]);
  const [stages, setStages] = useState<string[]>([]);
  const [supplies, setSupplies] = useState<string[]>([]);

  const [object, setObject] = useState('');
  const [stage, setStage] = useState('');

  // Последний осмотр по выбранному объекту
  const [lastStage, setLastStage] = useState<string | null>(null);
  const [lastStagePassed, setLastStagePassed] = useState<string | null>(null);
  const [loadingLast, setLoadingLast] = useState(false);

  // Блок: выбран неверный этап
  const [stageWarning, setStageWarning] = useState(false);

  const [stagePassed, setStagePassed] = useState('');
  const [stageCompletion, setStageCompletion] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [supply, setSupply] = useState('');
  const [nextStart, setNextStart] = useState('');
  const [nextEnd, setNextEnd] = useState('');
  const [note, setNote] = useState('');

  const [houseDone, setHouseDone] = useState('');
  const [ownerMeeting, setOwnerMeeting] = useState('');
  const [actDate, setActDate] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api<{ objects: BuildObject[] }>('list_objects').then((d) => setObjects(d.objects || []));
    api<{ stages: string[]; supplies: string[] }>('get_settings').then((d) => {
      setStages(d.stages || []);
      setSupplies(d.supplies || []);
    });
  }, []);

  // При смене объекта — загружаем его последний этап
  const handleObjectChange = (val: string) => {
    setObject(val);
    setStage('');
    setStageWarning(false);
    setLastStage(null);
    setLastStagePassed(null);
    setLoadingLast(true);
    api<{ stage: string | null; stage_passed: string | null }>('get_last_stage', {
      object_name: val,
    }).then((d) => {
      setLastStage(d.stage ?? null);
      setLastStagePassed(d.stage_passed ?? null);
      setLoadingLast(false);
    });
  };

  // Вычисляем «разрешённый» следующий этап
  const allowedStage = (() => {
    if (!lastStage) return stages[0] ?? null; // нет осмотров — первый этап
    const idx = stages.indexOf(lastStage);
    if (idx === -1) return null;
    // Если последний этап был принят — следующий по порядку
    if (lastStagePassed === 'Да') return stages[idx + 1] ?? null;
    // Если не принят — повторить тот же
    return lastStage;
  })();

  // Обработка выбора этапа: проверяем совпадение с allowedStage
  const handleStageChange = (val: string) => {
    if (allowedStage && val !== allowedStage && val !== lastStage) {
      // Этап выбран, но он не является ожидаемым следующим
      setStage(val);
      setStageWarning(true);
    } else {
      setStage(val);
      setStageWarning(false);
    }
  };

  const isFinal = stage === 'Дом сдан';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!object || !stage) {
      toast({ title: 'Заполните название объекта и этап', variant: 'destructive' });
      return;
    }
    if (stageWarning) {
      toast({
        title: 'Вы не завершили прошлый этап',
        description: `Ожидаемый этап: «${allowedStage}»`,
        variant: 'destructive',
      });
      return;
    }
    setSaving(true);
    try {
      await api('add_inspection', {
        object_name: object,
        stage,
        stage_passed: stagePassed,
        stage_completion: stagePassed === 'Нет' ? (parseInt(stageCompletion) || 0) : undefined,
        delivery_date: deliveryDate,
        supply,
        next_start_date: nextStart,
        next_end_date: nextEnd,
        note,
        house_done: houseDone,
        owner_meeting_date: ownerMeeting,
        act_date: actDate,
      });
      toast({ title: 'Осмотр сохранён', description: `${object} · ${stage}` });
      navigate('/');
    } catch {
      toast({ title: 'Не удалось сохранить', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

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
              Новый осмотр
            </h1>
            <p className="text-xs text-muted-foreground font-mono mt-0.5">
              заполните карточку проверки
            </p>
          </div>
        </div>
      </header>

      <main className="container max-w-2xl py-8 sm:py-10">
        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Выбор объекта и этапа */}
          <InspectionObjectStageBlock
            objects={objects}
            stages={stages}
            object={object}
            stage={stage}
            lastStage={lastStage}
            lastStagePassed={lastStagePassed}
            loadingLast={loadingLast}
            stageWarning={stageWarning}
            allowedStage={allowedStage}
            onObjectChange={handleObjectChange}
            onStageChange={handleStageChange}
          />

          {/* Ход работ (не финальный этап) */}
          {stage && !isFinal && !stageWarning && (
            <InspectionWorkBlock
              supplies={supplies}
              stagePassed={stagePassed}
              stageCompletion={stageCompletion}
              deliveryDate={deliveryDate}
              supply={supply}
              nextStart={nextStart}
              nextEnd={nextEnd}
              note={note}
              onStagePassedChange={setStagePassed}
              onStageCompletionChange={setStageCompletion}
              onDeliveryDateChange={setDeliveryDate}
              onSupplyChange={setSupply}
              onNextStartChange={setNextStart}
              onNextEndChange={setNextEnd}
              onNoteChange={setNote}
            />
          )}

          {/* Финальный этап «Дом сдан» */}
          {isFinal && !stageWarning && (
            <InspectionFinalBlock
              houseDone={houseDone}
              ownerMeeting={ownerMeeting}
              actDate={actDate}
              onHouseDoneChange={setHouseDone}
              onOwnerMeetingChange={setOwnerMeeting}
              onActDateChange={setActDate}
            />
          )}

          {/* Кнопки */}
          {stage && (
            <div className="flex gap-3 animate-fade-up">
              <Button
                type="submit"
                disabled={saving || stageWarning}
                title={stageWarning ? 'Вы не завершили прошлый этап' : ''}
                className={`flex-1 h-12 font-display uppercase tracking-wider text-base rounded-sm transition ${
                  stageWarning
                    ? 'bg-muted text-muted-foreground cursor-not-allowed'
                    : 'bg-accent text-accent-foreground hover:bg-accent/90'
                }`}
              >
                <Icon
                  name={saving ? 'Loader' : stageWarning ? 'Lock' : 'Check'}
                  size={18}
                  className={`mr-2 ${saving ? 'animate-spin' : ''}`}
                />
                {saving ? 'Сохраняю…' : stageWarning ? 'Завершите прошлый этап' : 'Сохранить осмотр'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/')}
                className="h-12 rounded-sm font-display uppercase tracking-wide"
              >
                Отмена
              </Button>
            </div>
          )}
        </form>
      </main>
    </div>
  );
};

export default Inspection;
