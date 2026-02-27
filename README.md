# FinTeen — твоя первая финансовая стратегия

t.me/finteenhack_bot - ссылка на бота 

Production-ready микросервисная платформа для обучения детей финансовой грамотности. Современный fintech продукт уровня 2026 с геймификацией, визуализацией данных и интуитивным интерфейсом.

## 🎯 О платформе

**FinTeen** — интерактивная образовательная платформа, которая помогает детям освоить основы финансовой грамотности через практические сценарии в безопасной виртуальной среде. Платформа использует геймификацию, систему уровней и наград для мотивации к обучению.

### Ключевые особенности

- 🎮 **Геймификация** — система уровней, XP, достижений, бейджей, daily challenges
- 📊 **Визуализация** — графики доходов/расходов, категорий, прогресса, статистика
- 💰 **Виртуальный баланс** — безопасное обучение без реальных денег
- 🎯 **Практические сценарии** — планирование бюджета, накопления, симулятор вклада
- 📚 **Образовательный модуль** — квизы по финансовой грамотности, пошаговое обучение
- 🛡️ **Антискам обучение** — специальные квизы про финансовые мошенничества
- 👨‍👩‍👧 **Родительский режим** — просмотр прогресса ребенка и рекомендации
- 📄 **Отчеты** — экспорт финансового отчета в PDF
- 🎲 **Демо-режим** — предзаполненные данные для демонстрации
- 📈 **Админ-панель** — полная аналитика платформы, проблемные темы, метрики
- 📱 **Адаптивный дизайн** — работает на всех устройствах (mobile-first)
- 🌍 **Мультиязычность** — русский и английский языки с сохранением выбора
- 🎨 **Современный UI** — дизайн уровня Revolut/Monzo 2026 с анимациями
- 🔄 **Event-driven архитектура** — Redis pub/sub для межсервисного взаимодействия
- 📝 **Структурированное логирование** — correlation-id для трейсинга запросов

## 🏗 Архитектура

Проект построен на микросервисной архитектуре с четким разделением ответственности:

```
┌─────────────┐
│   Frontend  │ (Next.js 14, TypeScript, TailwindCSS, Framer Motion)
└──────┬──────┘
       │
       ▼
┌─────────────┐
│ API Gateway │ (FastAPI, роутинг, проксирование)
└──────┬──────┘
       │
       ├──────────┬──────────┬──────────┐
       ▼          ▼          ▼          ▼
┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐
│   Auth   │ │   User   │ │   Game   │ │ Progress │
│ Service  │ │ Service  │ │ Service  │ │ Service  │
└────┬─────┘ └────┬─────┘ └────┬─────┘ └────┬─────┘
     │           │            │            │
     └───────────┴────────────┴────────────┘
                    │
         ┌──────────┴──────────┐
         ▼                     ▼
    ┌─────────┐          ┌─────────┐
    │PostgreSQL│          │  Redis  │
    └─────────┘          └─────────┘
```

### Сервисы

- **api-gateway** (8000) — единая точка входа, роутинг запросов к микросервисам, проксирование
- **auth-service** (8001) — аутентификация и авторизация (JWT access + refresh токены)
- **user-service** (8002) — управление пользователями, баланс, уровни, XP, обработка событий из Redis (pub/sub)
- **game-service** (8003) — игровая логика: планирование бюджета, накопления, цели, генерация событий (`goal_completed`, `budget_planned`, `xp_added`)
- **progress-service** (8004) — транзакции, квесты, история прогресса (raw SQL для обхода FK валидации)
- **education-service** (8005) — квизы, бейджи, достижения, guided mode, daily challenges, антискам обучение
- **admin-service** (8010) — админ-панель с аналитикой, статистикой платформы, проблемными темами
- **analytics-service** (8011) — сбор анонимных метрик, аналитика ошибок и эффективности сценариев
- **frontend** (3000) — Next.js приложение с UI-kit, i18n, темами и богатой анимацией
- **postgres** (5432) — база данных PostgreSQL
- **redis** (6379) — кеширование и шина событий (pub/sub для межсервисного взаимодействия)
- **adminer** (8080) — веб-интерфейс для управления БД

## 🚀 Быстрый старт

### Требования

- Docker 20.10+
- Docker Compose 2.0+

### Запуск

1. Клонируйте репозиторий:
```bash
git clone <repository-url>
cd devhack
```

2. Создайте файл `.env` на основе `.env.example`:
```bash
cp .env.example .env
```

3. Отредактируйте `.env` и установите необходимые значения:
```env
JWT_SECRET_KEY=your-secret-key-min-32-chars
POSTGRES_USER=fintech_user
POSTGRES_PASSWORD=fintech_pass
POSTGRES_DB=fintech_db
```

4. Запустите все сервисы:
```bash
docker-compose up -d
```

5. Дождитесь инициализации всех сервисов (проверьте логи):
```bash
docker-compose logs -f
```

6. Откройте в браузере:
- **Frontend**: http://localhost:3000
- **API Gateway**: http://localhost:8000
- **Adminer** (БД): http://localhost:8080
- **Swagger документация**:
  - API Gateway: http://localhost:8000/docs
  - Auth Service: http://localhost:8001/docs
  - User Service: http://localhost:8002/docs
  - Game Service: http://localhost:8003/docs
  - Progress Service: http://localhost:8004/docs
  - Education Service: http://localhost:8005/docs
  - Admin Service: http://localhost:8010/docs
  - Analytics Service: http://localhost:8011/docs

## 📦 Структура проекта

```
.
├── docker-compose.yml          # Оркестрация всех сервисов
├── .env.example                # Пример конфигурации
├── README.md                   # Документация
├── Makefile                    # Утилиты для управления
├── backend/                    # Backend сервисы
│   ├── api-gateway/           # API Gateway
│   ├── auth-service/          # Сервис аутентификации
│   ├── user-service/          # Сервис пользователей
│   ├── game-service/          # Игровая логика
│   ├── progress-service/      # Прогресс и транзакции
│   ├── education-service/     # Образовательный модуль
│   ├── admin-service/         # Админ-панель
│   └── analytics-service/      # Аналитика
└── frontend/                   # Next.js приложение
    ├── src/
    │   ├── app/               # App Router страницы
    │   │   ├── dashboard/     # Дашборд
    │   │   ├── budget/        # Планирование бюджета
    │   │   ├── savings/       # Накопления
    │   │   ├── quizzes/       # Квизы
    │   │   ├── badges/        # Бейджи
    │   │   ├── achievements/  # Достижения
    │   │   ├── history/       # История транзакций
    │   │   ├── demo/          # Демо-режим
    │   │   ├── parent/        # Родительский режим
    │   │   ├── reports/       # Отчеты
    │   │   ├── deposit-simulator/ # Симулятор вклада
    │   │   └── admin/         # Админ-панель
    │   ├── components/        # React компоненты
    │   │   ├── ui/            # UI-kit компоненты
    │   │   ├── layout/        # Layout компоненты
    │   │   └── onboarding/    # Onboarding
    │   ├── lib/               # Утилиты, API клиент
    │   ├── store/             # Zustand state management
    │   └── locales/           # i18n переводы (ru.json, en.json)
```

Каждый backend сервис имеет структуру:
```
service-name/
├── app/
│   ├── main.py               # Точка входа FastAPI
│   ├── core/                 # Конфигурация, БД, безопасность
│   ├── models/               # SQLAlchemy модели
│   ├── schemas/              # Pydantic схемы
│   ├── services/             # Бизнес-логика
│   └── routers/              # API endpoints
├── alembic/                  # Миграции БД
├── Dockerfile
└── requirements.txt
```

## 🎮 Функциональность

### MVP функции

- ✅ **Регистрация и авторизация** — JWT токены, безопасное хеширование паролей
- ✅ **Профиль пользователя** — редактирование данных, просмотр статистики
- ✅ **Виртуальный баланс** — управление виртуальными деньгами
- ✅ **Планирование бюджета** — интерактивный сценарий с категориями
- ✅ **Накопления** — создание целей, пополнение, проценты (5%)
- ✅ **Система уровней и XP** — прогрессия, награды за действия
- ✅ **История транзакций** — полная история с фильтрацией и пагинацией
- ✅ **Дашборд** — обзор баланса, уровня, XP, быстрые действия
- ✅ **Визуализация данных** — графики доходов/расходов, категорий
- ✅ **Сохранение прогресса** — все данные сохраняются в БД

### Дополнительно

- ✅ **Обучающий модуль** — мини-квизы по ключевым финансовым терминам, Guided Mode (пошаговое обучение)
- ✅ **Бейджи и достижения** — награды за первый бюджет, накопления, квизы и серию действий
- ✅ **Daily Challenge** — ежедневное задание с наградой XP
- ✅ **Demo-режим** — авто-создание демо-аккаунта с красивой статистикой для жюри
- ✅ **Родительский режим** — отдельная страница с индикаторами поведения и рекомендациями
- ✅ **PDF-отчет** — страница отчета с экспортом через `Print to PDF`
- ✅ **Симулятор вклада** — сравнение ставок и риск-профилей (консервативный / сбалансированный / агрессивный)
- ✅ **Русский и английский язык** (i18n) — переключение на лету
- ✅ **Светлая и тёмная тема** — автоматическое определение системной темы
- ✅ **Адаптивный дизайн** (mobile-first) — работает на всех устройствах
- ✅ **UI-kit компонентов** — переиспользуемые компоненты
- ✅ **Swagger документация** — для всех сервисов
- ✅ **Cookie consent** — согласие на использование cookies
- ✅ **Legal pages** — Privacy Policy, Terms of Service, Public Offer
- ✅ **Contact/Support** — страницы контактов и поддержки
- ✅ **404 страница** — красивая и запоминающаяся страница ошибки

## 🎨 Дизайн

### Цветовая палитра

- **Primary**: `#50B848` (зеленый) — основной цвет бренда
- **Secondary**: `#BDCBEC` (голубой) — акцентный цвет
- **Gradients** — плавные переходы для современного вида
- **Glassmorphism** — эффекты прозрачности и размытия

### UI-kit включает

- **Button** — primary/secondary/ghost варианты с анимациями
- **Card** — карточки с эффектами глубины и hover
- **Modal** — модальные окна с анимациями
- **ProgressBar** — анимированные индикаторы прогресса
- **CircularProgress** — круговые индикаторы (для XP)
- **Badge** — бейджи для статусов
- **AnimatedCounter** — плавный счетчик чисел
- **Chart** — графики (recharts)

### Дизайн-система

- **Радиусы**: 20-28px для современного вида
- **Тени**: мягкие, многослойные для глубины
- **Анимации**: 150-300ms для плавности
- **Типографика**: гибкая система размеров
- **Spacing**: консистентные отступы

## 🔐 Безопасность

- **JWT access + refresh токены** — безопасная аутентификация
- **Хеширование паролей** (bcrypt) — пароли не хранятся в открытом виде
- **CORS конфигурация** — защита от межсайтовых запросов
- **Валидация всех входных данных** (Pydantic) — защита от некорректных данных
- **Структурированная обработка ошибок** — безопасные сообщения об ошибках
- **Environment-based settings** — конфигурация через переменные окружения

## 📊 Game Logic

### Сценарий 1: Планирование бюджета

1. Пользователь получает доход (виртуальные деньги)
2. Распределяет доход по категориям (еда, транспорт, развлечения и т.д.)
3. Система проверяет баланс:
   - Если распределение сбалансировано (в пределах 10%) → награда **50 XP**
   - Если нет → обучающий фидбек + **10 XP**
4. Создается транзакция типа "income"
5. Баланс обновляется

**Критерии успеха:**
- Распределение должно быть в пределах 10% от дохода
- Минимум 3 категории для лучшего планирования

### Сценарий 2: Накопления

1. Пользователь создает цель накопления (название + сумма)
2. Пополняет цель из виртуального баланса
3. Может применить проценты (5% от текущей суммы)
4. При достижении цели:
   - Цель помечается как завершенная
   - Награда **100 XP**
   - Создается транзакция "goal_completed"

**Особенности:**
- Проценты начисляются только на незавершенные цели
- Нельзя пополнить завершенную цель
- Нельзя пополнить больше, чем есть на балансе

### XP система

- **Level = floor(xp / 100) + 1** — уровень рассчитывается автоматически
- **Награды:**
  - Планирование бюджета (сбалансированное): 50 XP
  - Планирование бюджета (несбалансированное): 10 XP
  - Достижение цели накопления: 100 XP
- **Постепенное усложнение** — чем выше уровень, тем сложнее задачи

## 🗄 База данных

### Основные сущности

- **User**: id, email, username, hashed_password, level, xp, balance, created_at
- **Goal**: id, user_id, title, target_amount, current_amount, completed, created_at
- **Transaction**: id, user_id, type, amount, description, created_at
  - Типы: `income`, `expense`, `savings_deposit`, `interest`, `goal_completed`
- **Quest**: id, title, difficulty, reward_xp
- **QuestProgress**: id, user_id, quest_id, completed, score
 - **Quiz**: id, title, difficulty, xp_reward
 - **Question**: id, quiz_id, question, options (JSON), correct_answer
 - **QuizProgress**: id, user_id, quiz_id, score, completed
 - **Badge**: id, title, description, icon, condition (JSONB)
 - **UserBadge**: user_id, badge_id, unlocked_at
 - **Achievement**: id, title, description, icon, condition (JSONB)
 - **UserAchievement**: user_id, achievement_id, unlocked_at
 - **DailyChallenge**: id, title, description, challenge_type, xp_reward, condition (JSONB)
 - **UserDailyChallenge**: user_id, daily_challenge_id, completed_at

### Особенности

- Все связи через foreign keys на уровне БД
- Миграции через Alembic (автоматическое применение при старте)
- **Transaction модель** — использует raw SQL для обхода SQLAlchemy FK валидации
- Индексы на часто используемых полях (user_id, created_at)

## 🐳 Docker

Все сервисы контейнеризированы с:

- **Multi-stage builds** — оптимизация размера образов
- **Healthchecks** — проверка работоспособности сервисов
- **Volume для БД** — персистентное хранение данных
- **Internal network** — изолированная сеть для сервисов
- **Depends_on** — правильный порядок запуска
- **Entrypoint скрипты** — автоматическое применение миграций

## 🔄 Git Workflow

Проект использует Conventional Commits:

- `feat:` - новая функциональность
- `fix:` - исправление багов
- `refactor:` - рефакторинг кода
- `chore:` - обновление зависимостей, конфигурации
- `docs:` - документация

## 📈 API Endpoints

**Все запросы проходят через API Gateway**: `http://localhost:8000/api/v1/{service}/{endpoint}`

**Аутентификация**: Все защищенные endpoints требуют заголовок `Authorization: Bearer <access_token>`

### Auth Service (`/api/v1/auth`)

- `POST /api/v1/auth/register` - Регистрация нового пользователя
  - Body: `{email, username, password}`
  - Response: `{access_token, refresh_token, user}`
- `POST /api/v1/auth/login` - Вход в систему
  - Body: `{email, password}`
  - Response: `{access_token, refresh_token, user}`
- `POST /api/v1/auth/refresh` - Обновление access токена
  - Body: `{refresh_token}`
  - Response: `{access_token, refresh_token}`
- `GET /api/v1/auth/me` - Информация о текущем пользователе (требует токен)

### User Service (`/api/v1/users`)

- `GET /api/v1/users/me` - Получение профиля (требует токен)
- `PUT /api/v1/users/me` - Обновление профиля (требует токен)
  - Body: `{username?, email?}`
- `POST /api/v1/users/balance` - Изменение баланса (требует токен)
  - Body: `{amount}` (положительное/отрицательное)
- `POST /api/v1/users/xp` - Добавление XP (требует токен)
  - Body: `{xp}` (положительное число)
- `GET /api/v1/users/me/level` - Информация об уровне и прогрессе (требует токен)

### Game Service (`/api/v1/budget`, `/api/v1/savings`)

- `POST /api/v1/budget/plan` - Планирование бюджета (требует токен)
  - Body: `{income, categories: [{name, amount}]}`
  - Response: `{success, xp_reward, feedback, balance_updated}`
- `POST /api/v1/savings/goals` - Создание цели накопления (требует токен)
  - Body: `{title, target_amount}`
  - Response: `{id, title, target_amount, current_amount, completed}`
- `GET /api/v1/savings/goals` - Список целей пользователя (требует токен)
- `POST /api/v1/savings/deposit` - Пополнение цели (требует токен)
  - Body: `{goal_id, amount}`
  - Response: `{success, goal, balance_updated}`
- `POST /api/v1/savings/interest/{goal_id}` - Применение процентов к цели (требует токен)
  - Response: `{success, interest_amount, goal}`

### Progress Service (`/api/v1/transactions`, `/api/v1/quests`)

- `POST /api/v1/transactions` - Создание транзакции (требует токен)
  - Body: `{type, amount, description}`
  - Types: `income`, `expense`, `savings_deposit`, `interest`, `goal_completed`
- `GET /api/v1/transactions` - История транзакций (требует токен)
  - Query params: `page` (default: 1), `page_size` (default: 10, max: 100)
  - Response: `{transactions: [], total, page, page_size}`
- `GET /api/v1/quests` - Список доступных квестов
- `GET /api/v1/quests/progress` - Прогресс пользователя по квестам (требует токен)
- `POST /api/v1/quests/progress` - Обновление прогресса по квесту (требует токен)
  - Body: `{quest_id, completed, score}`

### Education Service (`/api/v1/quizzes`, `/api/v1/badges`, `/api/v1/achievements`, `/api/v1/daily-challenges`, `/api/v1/guided`)

#### Quizzes
- `GET /api/v1/quizzes` - Список всех доступных квизов
  - Response: `[{id, title, difficulty, xp_reward}]`
- `GET /api/v1/quizzes/{quiz_id}` - Детали квиза с вопросами (требует токен)
  - Response: `{id, title, questions: [{id, question, options}]}` (без правильных ответов)
- `POST /api/v1/quizzes/{quiz_id}/submit` - Отправка ответов на квиз (требует токен)
  - Body: `{answers: [{question_id, answer}]}`
  - Response: `{score, xp_reward, badge_awarded?, achievement_awarded?}`
- `GET /api/v1/quizzes/progress` - Прогресс пользователя по квизам (требует токен)
  - Response: `[{quiz_id, score, completed}]`

#### Badges
- `GET /api/v1/badges` - Все бейджи и полученные пользователем (требует токен)
  - Response: `{badges: [], user_badges: [badge_ids]}`
- `GET /api/v1/badges/my` - Полученные бейджи пользователя (требует токен)
  - Response: `[{badge_id, title, description, icon, unlocked_at}]`
- `POST /api/v1/badges/check` - Проверка и награждение бейджа (требует токен, внутренний)
  - Body: `{badge_type, condition: {}}`
  - Используется другими сервисами для проверки условий

#### Achievements
- `GET /api/v1/achievements` - Все достижения и разблокированные пользователем (требует токен)
  - Response: `{achievements: [], user_achievements: [achievement_ids]}`
- `GET /api/v1/achievements/my` - Разблокированные достижения пользователя (требует токен)
  - Response: `[{achievement_id, title, description, icon, unlocked_at}]`
- `POST /api/v1/achievements/check` - Проверка и награждение достижения (требует токен, внутренний)
  - Body: `{achievement_type, condition: {}}`

#### Daily Challenges
- `GET /api/v1/daily-challenges/today` - Сегодняшний челлендж (требует токен)
  - Response: `{challenge: {}, user_progress: {completed_at?}}`
- `POST /api/v1/daily-challenges/check` - Проверка выполнения челленджа (требует токен)
  - Body: `{challenge_type, condition_data: {}}`
  - Response: `{completed: bool, challenge?: {}}`

#### Guided Mode
- `GET /api/v1/guided/steps` - Список шагов обучения (требует токен)
  - Response: `[{id, title, description, completed}]`
- `GET /api/v1/guided/steps/{step_id}` - Детали шага (требует токен)

### Admin Service (`/api/v1/admin`)

- `GET /api/v1/admin/dashboard` - Статистика платформы (требует admin token)
  - Query param: `token` (admin secret key)
  - Response: `{users: {}, transactions: {}, quizzes: {}, goals: {}, analytics: {}}`
- `GET /api/v1/admin/stats` - Детальная статистика (требует admin token)

### Analytics Service (`/api/v1/analytics`)

- `POST /api/v1/analytics/events` - Логирование события (внутренний)
  - Body: `{event_type, event_category?, event_data: {}}`
- `GET /api/v1/analytics/events` - Получение событий (требует admin token)
  - Query params: `event_type?`, `start_date?`, `end_date?`

## 🎯 Как это работает

### Пользовательский поток

1. **Регистрация/Вход**
   - Пользователь регистрируется или входит в систему
   - Получает JWT токены (access + refresh)
   - Токены сохраняются в localStorage

2. **Дашборд**
   - Отображается баланс, уровень, XP
   - Круговой индикатор прогресса до следующего уровня
   - Быстрые действия: планирование бюджета, накопления, история

3. **Планирование бюджета**
   - Пользователь вводит доход
   - Добавляет категории с суммами
   - Система проверяет баланс и начисляет XP
   - Создается транзакция "income"
   - Баланс обновляется

4. **Накопления**
   - Пользователь создает цель (название + сумма)
   - Пополняет цель из баланса
   - Может применить проценты
   - При достижении цели получает XP и транзакцию

5. **История транзакций**
   - Просмотр всех транзакций с фильтрацией
   - Графики доходов/расходов за последние 7 дней
   - Круговая диаграмма по категориям
   - Статистика: общий доход, расходы, текущий баланс

### Технические детали

- **Микросервисы** общаются через HTTP (внутренняя сеть Docker)
- **API Gateway** проксирует все запросы к нужным сервисам
- **JWT токены** передаются в заголовке `Authorization: Bearer <token>`
- **Транзакции** создаются автоматически при всех операциях
- **Баланс и XP** обновляются через вызовы к user-service
- **Миграции** применяются автоматически при старте progress-service

## 🛠 Разработка

### Локальная разработка

Для разработки отдельного сервиса:

```bash
cd backend/auth-service
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8001
```

### Миграции

Создание новой миграции:
```bash
cd backend/auth-service
alembic revision --autogenerate -m "description"
```

Применение миграций:
```bash
alembic upgrade head
```

**Примечание**: Миграции progress-service применяются автоматически через entrypoint.sh

### Логирование

Все сервисы логируют:
- HTTP запросы (FastAPI автоматически)
- Ошибки с полным traceback
- Создание транзакций
- Обновление баланса/XP

Просмотр логов:
```bash
docker-compose logs -f <service-name>
```

## 🐛 Известные особенности

- **Transaction модель** использует raw SQL вместо ORM для обхода проблем с foreign key валидацией в SQLAlchemy
- **Миграции** применяются автоматически только для progress-service (через entrypoint.sh)
- **Баланс** может быть отрицательным (для обучения)

## 📝 Лицензия

Проект создан для хакатона DevHack №6, Центр-Инвест.

## 👥 Команда

Разработано командой **CLV-DIGITAL**

- Website: https://clv-digital.tech
- Contact: тестовые контакты (см. страницу /contact)

---

**FinTeen** — твоя первая финансовая стратегия 🚀
