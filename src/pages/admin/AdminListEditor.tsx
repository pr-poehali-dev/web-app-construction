import Icon from '@/components/ui/icon';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Section } from './AdminShared';

export const ListEditor = ({
  title,
  icon,
  items,
  setItems,
  onSave,
}: {
  title: string;
  icon: string;
  items: string[];
  setItems: (v: string[]) => void;
  onSave: (items: string[]) => void;
}) => {
  const update = (i: number, v: string) => setItems(items.map((x, idx) => (idx === i ? v : x)));
  const remove = (i: number) => setItems(items.filter((_, idx) => idx !== i));
  const add = () => setItems([...items, '']);

  return (
    <Section title={title} icon={icon}>
      <div className="space-y-2">
        {items.map((it, i) => (
          <div key={i} className="flex gap-2">
            <Input value={it} onChange={(e) => update(i, e.target.value)} className="h-10" />
            <button
              onClick={() => remove(i)}
              className="flex h-10 w-10 items-center justify-center rounded-sm border border-border text-muted-foreground hover:text-destructive hover:border-destructive transition shrink-0"
            >
              <Icon name="Trash2" size={15} />
            </button>
          </div>
        ))}
      </div>
      <div className="flex gap-2 mt-3">
        <Button onClick={add} variant="outline" className="h-9 rounded-sm font-display uppercase text-xs tracking-wide">
          <Icon name="Plus" size={13} className="mr-1" /> Добавить
        </Button>
        <Button onClick={() => onSave(items)} className="h-9 bg-foreground text-primary-foreground hover:opacity-90 font-display uppercase text-xs tracking-wide rounded-sm">
          Сохранить список
        </Button>
      </div>
    </Section>
  );
};
