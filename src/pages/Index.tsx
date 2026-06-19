import { useNavigate } from 'react-router-dom';
import Icon from '@/components/ui/icon';
import { useAuth } from '@/lib/auth';

const sections = [
  {
    title: 'Новый осмотр',
    desc: 'Зафиксировать этап и поставки по объекту',
    icon: 'ClipboardCheck',
    to: '/inspection',
    accent: true,
  },
  {
    title: 'Все объекты',
    desc: 'В работе и готовые — этапы, сроки, финансы',
    icon: 'Building2',
    to: '/objects',
  },
  {
    title: 'Ближайшие закупки',
    desc: 'Что и когда нужно привезти на объекты',
    icon: 'Truck',
    to: '/purchases',
  },
  {
    title: 'Подать на оплату',
    desc: 'Заявка на закупку материалов или зарплату',
    icon: 'Send',
    to: '/payment-request',
  },
  {
    title: 'Последние осмотры',
    desc: 'История проведённых проверок',
    icon: 'History',
    to: '/inspections',
  },
  {
    title: 'Баланс объектов',
    desc: 'Финансовое состояние по каждому объекту',
    icon: 'Scale',
    to: '/balance',
  },
  {
    title: 'Анализ объектов',
    desc: 'Прогресс, сроки и статистика',
    icon: 'ChartColumn',
    to: '/analytics',
  },
  {
    title: 'Добавить объект',
    desc: 'Завести новый строительный объект',
    icon: 'Plus',
    to: '/add-object',
  },
  {
    title: 'Страница администратора',
    desc: 'Настройка этапов и списков поставок',
    icon: 'Settings',
    to: '/admin',
  },
];

const Index = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-card/70 backdrop-blur-sm">
        <div className="container max-w-5xl flex items-center justify-between py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center bg-foreground rounded-sm overflow-hidden p-1.5">
              <img
                src="https://cdn.poehali.dev/projects/c00b6d94-7991-4278-a41e-54f2a348ad20/bucket/480fcb47-c795-4ae7-a82c-ab902467d38c.png"
                alt="СтройКонтроль"
                className="w-full h-full object-contain invert"
              />
            </div>
            <div>
              <h1 className="font-display text-xl font-600 uppercase tracking-wider leading-none">
                СтройКонтроль
              </h1>
              <p className="text-xs text-muted-foreground font-mono mt-0.5">
                панель управления объектами
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-accent animate-pulse" />
              {user?.username}
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 h-8 px-3 rounded-sm border border-border text-xs font-mono text-muted-foreground hover:text-foreground hover:border-foreground transition"
            >
              <Icon name="LogOut" size={13} />
              <span className="hidden sm:inline">Выйти</span>
            </button>
          </div>
        </div>
      </header>

      <main className="container max-w-5xl py-10 sm:py-14">
        <div className="mb-9 animate-fade-up">
          <p className="font-mono text-xs uppercase tracking-[0.2em] text-accent mb-2">
            Рабочее пространство
          </p>
          <h2 className="font-display text-3xl sm:text-4xl font-600 uppercase tracking-tight max-w-xl leading-[1.05]">
            Выберите раздел для работы
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {sections.map((s, i) => (
            <button
              key={s.title}
              onClick={() => navigate(s.to)}
              style={{ animationDelay: `${i * 60}ms` }}
              className={`group relative text-left p-5 rounded-sm border transition-all duration-200 animate-fade-up overflow-hidden ${
                s.accent
                  ? 'bg-foreground text-primary-foreground border-foreground hover:-translate-y-1'
                  : 'bg-card border-border hover:border-accent hover:-translate-y-1 hover:shadow-[6px_6px_0_0_hsl(var(--accent))]'
              }`}
            >
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-sm mb-7 transition-colors ${
                  s.accent
                    ? 'bg-accent text-accent-foreground'
                    : 'bg-secondary text-foreground group-hover:bg-accent group-hover:text-accent-foreground'
                }`}
              >
                <Icon name={s.icon} size={22} />
              </div>
              <h3 className="font-display text-lg font-500 uppercase tracking-wide leading-tight mb-1">
                {s.title}
              </h3>
              <p
                className={`text-sm leading-snug ${
                  s.accent ? 'text-primary-foreground/70' : 'text-muted-foreground'
                }`}
              >
                {s.desc}
              </p>
              <Icon
                name="ArrowUpRight"
                size={18}
                className={`absolute top-5 right-5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 ${
                  s.accent ? 'text-accent' : 'text-muted-foreground/40'
                }`}
              />
            </button>
          ))}
        </div>
      </main>

      <footer className="container max-w-5xl py-8 text-xs font-mono text-muted-foreground border-t border-border mt-6">
        СтройКонтроль · версия 0.1 · данные хранятся в облаке
      </footer>
    </div>
  );
};

export default Index;