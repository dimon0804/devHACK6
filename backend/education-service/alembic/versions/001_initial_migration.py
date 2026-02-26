"""Initial migration with quizzes, questions, badges and guided mode

Revision ID: 001_initial
Revises: 
Create Date: 2024-01-01 00:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001_initial'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create quizzes table
    op.create_table(
        'quizzes',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('difficulty', sa.String(), nullable=False),
        sa.Column('xp_reward', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_quizzes_id'), 'quizzes', ['id'], unique=False)

    # Create questions table
    op.create_table(
        'questions',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('quiz_id', sa.Integer(), nullable=False),
        sa.Column('question', sa.String(), nullable=False),
        sa.Column('options', postgresql.JSON(astext_type=sa.Text()), nullable=False),
        sa.Column('correct_answer', sa.Integer(), nullable=False),
        sa.Column('explanation', sa.String(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_foreign_key(
        'fk_questions_quiz_id',
        'questions',
        'quizzes',
        ['quiz_id'],
        ['id'],
        ondelete='CASCADE'
    )
    op.create_index(op.f('ix_questions_id'), 'questions', ['id'], unique=False)
    op.create_index(op.f('ix_questions_quiz_id'), 'questions', ['quiz_id'], unique=False)

    # Create quiz_progress table
    op.create_table(
        'quiz_progress',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('quiz_id', sa.Integer(), nullable=False),
        sa.Column('score', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('completed', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('answers', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('completed_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_foreign_key(
        'fk_quiz_progress_quiz_id',
        'quiz_progress',
        'quizzes',
        ['quiz_id'],
        ['id'],
        ondelete='CASCADE'
    )
    op.create_index(op.f('ix_quiz_progress_id'), 'quiz_progress', ['id'], unique=False)
    op.create_index(op.f('ix_quiz_progress_user_id'), 'quiz_progress', ['user_id'], unique=False)
    op.create_index(op.f('ix_quiz_progress_quiz_id'), 'quiz_progress', ['quiz_id'], unique=False)

    # Create badges table
    op.create_table(
        'badges',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(), nullable=False),
        sa.Column('title', sa.String(), nullable=False),
        sa.Column('description', sa.String(), nullable=True),
        sa.Column('icon', sa.String(), nullable=True),
        sa.Column('condition', postgresql.JSON(astext_type=sa.Text()), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )
    op.create_index(op.f('ix_badges_id'), 'badges', ['id'], unique=False)

    # Create user_badges table
    op.create_table(
        'user_badges',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.Integer(), nullable=False),
        sa.Column('badge_id', sa.Integer(), nullable=False),
        sa.Column('earned_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_foreign_key(
        'fk_user_badges_badge_id',
        'user_badges',
        'badges',
        ['badge_id'],
        ['id'],
        ondelete='CASCADE'
    )
    op.create_index(op.f('ix_user_badges_id'), 'user_badges', ['id'], unique=False)
    op.create_index(op.f('ix_user_badges_user_id'), 'user_badges', ['user_id'], unique=False)
    op.create_index(op.f('ix_user_badges_badge_id'), 'user_badges', ['badge_id'], unique=False)

    # Add foreign key for user_id in quiz_progress and user_badges
    op.execute("""
        ALTER TABLE quiz_progress 
        ADD CONSTRAINT fk_quiz_progress_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    """)
    
    op.execute("""
        ALTER TABLE user_badges 
        ADD CONSTRAINT fk_user_badges_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE;
    """)

    # Insert seed data for quizzes
    op.execute("""
        INSERT INTO quizzes (id, title, difficulty, xp_reward, description) VALUES
        (1, 'Что такое бюджет?', 'easy', 30, 'Проверьте свои знания о бюджете и планировании финансов'),
        (2, 'Что такое накопления?', 'easy', 30, 'Узнайте больше о накоплениях и сбережениях'),
        (3, 'Чем отличается доход от прибыли?', 'medium', 50, 'Разберитесь в разнице между доходом и прибылью'),
        (4, 'Что такое инвестиции?', 'medium', 50, 'Изучите основы инвестирования'),
        (5, 'Что такое финансовая подушка?', 'medium', 50, 'Узнайте о важности финансовой подушки безопасности'),
        (6, 'Основы финансовой грамотности', 'hard', 100, 'Комплексный тест по финансовой грамотности'),
        (7, 'Планирование и управление бюджетом', 'hard', 100, 'Продвинутый тест по планированию бюджета');
    """)

    # Insert questions for quiz 1: Что такое бюджет?
    op.execute("""
        INSERT INTO questions (quiz_id, question, options, correct_answer, explanation) VALUES
        (1, 'Что такое бюджет?', '["План доходов и расходов", "Сумма всех денег", "Только расходы", "Только доходы"]', 0, 'Бюджет - это план, который показывает, сколько денег вы получаете и сколько тратите.'),
        (1, 'Зачем нужен бюджет?', '["Чтобы контролировать расходы", "Чтобы тратить больше", "Чтобы не думать о деньгах", "Чтобы брать кредиты"]', 0, 'Бюджет помогает контролировать расходы и планировать финансы.'),
        (1, 'Что включает в себя бюджет?', '["Доходы и расходы", "Только доходы", "Только расходы", "Кредиты"]', 0, 'Бюджет включает в себя все доходы и все расходы.'),
        (1, 'Как часто нужно планировать бюджет?', '["Регулярно (ежемесячно)", "Раз в год", "Никогда", "Только когда закончатся деньги"]', 0, 'Бюджет лучше планировать регулярно, например, каждый месяц.'),
        (1, 'Что такое категории в бюджете?', '["Группы расходов (еда, транспорт и т.д.)", "Типы доходов", "Банковские счета", "Кредитные карты"]', 0, 'Категории помогают группировать расходы по типам для лучшего контроля.');
    """)

    # Insert questions for quiz 2: Что такое накопления?
    op.execute("""
        INSERT INTO questions (quiz_id, question, options, correct_answer, explanation) VALUES
        (2, 'Что такое накопления?', '["Деньги, отложенные на будущее", "Все ваши деньги", "Только зарплата", "Кредиты"]', 0, 'Накопления - это деньги, которые вы откладываете на конкретные цели.'),
        (2, 'Зачем нужны накопления?', '["Для достижения финансовых целей", "Чтобы тратить больше", "Чтобы не думать о деньгах", "Чтобы брать кредиты"]', 0, 'Накопления помогают достигать финансовых целей без кредитов.'),
        (2, 'Сколько рекомендуется откладывать?', '["10-20% от дохода", "Все деньги", "Ничего", "Только когда останется"]', 0, 'Финансовые эксперты рекомендуют откладывать 10-20% от дохода.'),
        (2, 'Что такое финансовая цель?', '["Конкретная сумма на конкретную цель", "Просто копить деньги", "Тратить все", "Брать кредиты"]', 0, 'Финансовая цель - это конкретная сумма, которую вы хотите накопить на что-то важное.'),
        (2, 'Что помогает быстрее накопить?', '["Регулярные отчисления и проценты", "Тратить все", "Брать кредиты", "Не планировать"]', 0, 'Регулярные отчисления и проценты на вклад помогают быстрее достичь цели.');
    """)

    # Insert questions for quiz 3: Доход vs Прибыль
    op.execute("""
        INSERT INTO questions (quiz_id, question, options, correct_answer, explanation) VALUES
        (3, 'Что такое доход?', '["Все деньги, которые вы получаете", "Только зарплата", "Только прибыль", "Расходы"]', 0, 'Доход - это все деньги, которые вы получаете из разных источников.'),
        (3, 'Что такое прибыль?', '["Доход минус расходы", "Только доход", "Только расходы", "Все деньги"]', 0, 'Прибыль - это то, что остается после вычета всех расходов из дохода.'),
        (3, 'Может ли доход быть больше прибыли?', '["Да, если есть расходы", "Нет, никогда", "Они всегда равны", "Прибыль всегда больше"]', 0, 'Да, доход может быть больше прибыли, если есть расходы.'),
        (3, 'Что важнее для финансового здоровья?', '["И доход, и прибыль важны", "Только доход", "Только прибыль", "Ничего не важно"]', 0, 'И доход, и прибыль важны для финансового здоровья.'),
        (3, 'Как увеличить прибыль?', '["Увеличить доход или уменьшить расходы", "Только увеличить доход", "Только уменьшить расходы", "Взять кредит"]', 0, 'Прибыль можно увеличить, увеличив доход или уменьшив расходы.');
    """)

    # Insert questions for quiz 4: Инвестиции
    op.execute("""
        INSERT INTO questions (quiz_id, question, options, correct_answer, explanation) VALUES
        (4, 'Что такое инвестиции?', '["Вложение денег для получения дохода", "Трата денег", "Хранение денег дома", "Кредиты"]', 0, 'Инвестиции - это вложение денег с целью получить доход в будущем.'),
        (4, 'Какая главная цель инвестиций?', '["Увеличить капитал", "Потратить деньги", "Взять кредит", "Ничего не делать"]', 0, 'Главная цель инвестиций - увеличить капитал со временем.'),
        (4, 'Что такое риск в инвестициях?', '["Возможность потерять деньги", "Гарантированная прибыль", "Отсутствие прибыли", "Только прибыль"]', 0, 'Риск - это возможность потерять часть или все вложенные деньги.'),
        (4, 'Что такое диверсификация?', '["Распределение инвестиций по разным активам", "Инвестирование в один актив", "Трата всех денег", "Хранение денег дома"]', 0, 'Диверсификация - это распределение инвестиций по разным активам для снижения риска.'),
        (4, 'Когда лучше начинать инвестировать?', '["После создания финансовой подушки", "Сразу все деньги", "Никогда", "Только в кредит"]', 0, 'Инвестировать лучше после создания финансовой подушки безопасности.');
    """)

    # Insert questions for quiz 5: Финансовая подушка
    op.execute("""
        INSERT INTO questions (quiz_id, question, options, correct_answer, explanation) VALUES
        (5, 'Что такое финансовая подушка?', '["Резерв денег на непредвиденные расходы", "Все ваши деньги", "Только зарплата", "Кредиты"]', 0, 'Финансовая подушка - это резерв денег на непредвиденные расходы.'),
        (5, 'На сколько месяцев расходов должна быть подушка?', '["3-6 месяцев", "1 месяц", "1 год", "Не нужна"]', 0, 'Финансовая подушка должна покрывать 3-6 месяцев ваших расходов.'),
        (5, 'Зачем нужна финансовая подушка?', '["Для защиты от непредвиденных ситуаций", "Чтобы тратить больше", "Чтобы не думать о деньгах", "Чтобы брать кредиты"]', 0, 'Подушка защищает от непредвиденных ситуаций, таких как потеря работы или болезнь.'),
        (5, 'Где лучше хранить финансовую подушку?', '["На отдельном счете с легким доступом", "Дома наличными", "Только в инвестициях", "В кредитах"]', 0, 'Подушку лучше хранить на отдельном счете с легким доступом, но не в инвестициях.'),
        (5, 'Когда можно использовать подушку?', '["Только в экстренных ситуациях", "Всегда", "Никогда", "Для развлечений"]', 0, 'Финансовую подушку используют только в экстренных ситуациях.');
    """)

    # Insert badges
    op.execute("""
        INSERT INTO badges (name, title, description, icon, condition) VALUES
        ('budget_master', 'Мастер бюджета', 'Пройден квиз "Что такое бюджет?"', '📊', '{"type": "quiz_completed", "quiz_id": 1}'),
        ('savings_expert', 'Эксперт по накоплениям', 'Пройден квиз "Что такое накопления?"', '💰', '{"type": "quiz_completed", "quiz_id": 2}'),
        ('income_professional', 'Профессионал доходов', 'Пройден квиз "Доход vs Прибыль"', '💵', '{"type": "quiz_completed", "quiz_id": 3}'),
        ('investment_guru', 'Гуру инвестиций', 'Пройден квиз "Что такое инвестиции?"', '📈', '{"type": "quiz_completed", "quiz_id": 4}'),
        ('safety_guardian', 'Хранитель безопасности', 'Пройден квиз "Финансовая подушка"', '🛡️', '{"type": "quiz_completed", "quiz_id": 5}'),
        ('guided_learner', 'Обучающийся', 'Пройден Guided Mode', '🎓', '{"type": "guided_completed"}'),
        ('first_budget', 'Первый бюджет', 'Создан первый бюджет', '📝', '{"type": "budget_created"}'),
        ('goal_achiever', 'Достигатель целей', 'Достигнута первая цель', '🎯', '{"type": "goal_completed"}');
    """)


def downgrade() -> None:
    op.drop_index(op.f('ix_user_badges_badge_id'), table_name='user_badges')
    op.drop_index(op.f('ix_user_badges_user_id'), table_name='user_badges')
    op.drop_index(op.f('ix_user_badges_id'), table_name='user_badges')
    op.drop_table('user_badges')
    op.drop_index(op.f('ix_badges_id'), table_name='badges')
    op.drop_table('badges')
    op.drop_index(op.f('ix_quiz_progress_quiz_id'), table_name='quiz_progress')
    op.drop_index(op.f('ix_quiz_progress_user_id'), table_name='quiz_progress')
    op.drop_index(op.f('ix_quiz_progress_id'), table_name='quiz_progress')
    op.drop_table('quiz_progress')
    op.drop_index(op.f('ix_questions_quiz_id'), table_name='questions')
    op.drop_index(op.f('ix_questions_id'), table_name='questions')
    op.drop_table('questions')
    op.drop_index(op.f('ix_quizzes_id'), table_name='quizzes')
    op.drop_table('quizzes')
