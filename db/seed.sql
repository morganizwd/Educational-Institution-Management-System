TRUNCATE TABLE lesson_submissions, educational_processes, schedule, feedback, enrollments, courses, users, sessions CASCADE;

INSERT INTO users (username, email, password, role, full_name) VALUES
('admin', 'admin@edu.ru', 'admin123', 'admin', 'Администратор Системы'),
('teacher1', 'teacher1@edu.ru', 'teacher123', 'teacher', 'Иванов Иван Иванович'),
('teacher2', 'teacher2@edu.ru', 'teacher123', 'teacher', 'Петрова Мария Сергеевна'),
('teacher3', 'teacher3@edu.ru', 'teacher123', 'teacher', 'Сидоров Петр Александрович'),
('student1', 'student1@edu.ru', 'student123', 'student', 'Козлов Алексей Дмитриевич'),
('student2', 'student2@edu.ru', 'student123', 'student', 'Морозова Анна Викторовна'),
('student3', 'student3@edu.ru', 'student123', 'student', 'Волков Дмитрий Сергеевич'),
('student4', 'student4@edu.ru', 'student123', 'student', 'Новикова Елена Петровна'),
('student5', 'student5@edu.ru', 'student123', 'student', 'Лебедев Максим Игоревич'),
('student6', 'student6@edu.ru', 'student123', 'student', 'Соколова Ольга Андреевна')
ON CONFLICT (username) DO NOTHING;

INSERT INTO courses (title, description, duration, instructor, price, category, image_url) VALUES
('Основы программирования на Python', 'Изучение базовых концепций программирования на языке Python. Включает работу с переменными, циклами, функциями и структурами данных.', '3 месяца', 'Иванов Иван Иванович', 15000, 'Программирование', 'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?w=800'),
('Веб-разработка: HTML, CSS, JavaScript', 'Полный курс по созданию современных веб-сайтов. Изучение HTML5, CSS3 и JavaScript с практическими проектами.', '4 месяца', 'Петрова Мария Сергеевна', 20000, 'Веб-разработка', 'https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800'),
('Базы данных и SQL', 'Изучение реляционных баз данных, проектирование схем, написание SQL-запросов и оптимизация производительности.', '2 месяца', 'Сидоров Петр Александрович', 12000, 'Базы данных', 'https://images.unsplash.com/photo-1544383835-bda2bc66a55d?w=800'),
('React и современный фронтенд', 'Продвинутый курс по разработке пользовательских интерфейсов с использованием React, TypeScript и современных инструментов.', '3 месяца', 'Петрова Мария Сергеевна', 25000, 'Веб-разработка', 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=800'),
('Node.js и серверная разработка', 'Создание серверных приложений на Node.js, работа с Express, базами данных и API.', '3 месяца', 'Иванов Иван Иванович', 22000, 'Backend', 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800'),
('Машинное обучение для начинающих', 'Введение в машинное обучение: алгоритмы, библиотеки Python, практические примеры.', '4 месяца', 'Сидоров Петр Александрович', 30000, 'Data Science', 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=800'),
('Мобильная разработка на React Native', 'Создание мобильных приложений для iOS и Android с использованием React Native.', '3 месяца', 'Петрова Мария Сергеевна', 28000, 'Мобильная разработка', 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=800'),
('DevOps и CI/CD', 'Автоматизация процессов разработки, настройка CI/CD пайплайнов, Docker, Kubernetes.', '2 месяца', 'Иванов Иван Иванович', 18000, 'DevOps', 'https://images.unsplash.com/photo-1667372393119-3d4c48d07fc9?w=800')
ON CONFLICT DO NOTHING;

INSERT INTO enrollments (user_id, course_id, status, progress) VALUES
((SELECT id FROM users WHERE username = 'student1'), (SELECT id FROM courses WHERE title = 'Основы программирования на Python'), 'active', 45),
((SELECT id FROM users WHERE username = 'student1'), (SELECT id FROM courses WHERE title = 'Веб-разработка: HTML, CSS, JavaScript'), 'active', 30),
((SELECT id FROM users WHERE username = 'student2'), (SELECT id FROM courses WHERE title = 'Базы данных и SQL'), 'active', 60),
((SELECT id FROM users WHERE username = 'student2'), (SELECT id FROM courses WHERE title = 'React и современный фронтенд'), 'active', 20),
((SELECT id FROM users WHERE username = 'student3'), (SELECT id FROM courses WHERE title = 'Node.js и серверная разработка'), 'active', 75),
((SELECT id FROM users WHERE username = 'student3'), (SELECT id FROM courses WHERE title = 'Основы программирования на Python'), 'active', 90),
((SELECT id FROM users WHERE username = 'student4'), (SELECT id FROM courses WHERE title = 'Машинное обучение для начинающих'), 'active', 15),
((SELECT id FROM users WHERE username = 'student5'), (SELECT id FROM courses WHERE title = 'Мобильная разработка на React Native'), 'active', 50),
((SELECT id FROM users WHERE username = 'student6'), (SELECT id FROM courses WHERE title = 'DevOps и CI/CD'), 'active', 40),
((SELECT id FROM users WHERE username = 'student6'), (SELECT id FROM courses WHERE title = 'Веб-разработка: HTML, CSS, JavaScript'), 'active', 10)
ON CONFLICT (user_id, course_id) DO NOTHING;

INSERT INTO schedule (course_id, instructor_id, title, content, day_of_week, time, room, type) VALUES
((SELECT id FROM courses WHERE title = 'Основы программирования на Python'), (SELECT id FROM users WHERE username = 'teacher1'), 
 'Введение в Python', 'На этом уроке мы изучим основы Python: синтаксис, переменные, типы данных. Материалы: https://docs.python.org/3/tutorial/', 
 'Понедельник', '10:00-12:00', 'Аудитория 101', 'Лекция'),
((SELECT id FROM courses WHERE title = 'Основы программирования на Python'), (SELECT id FROM users WHERE username = 'teacher1'), 
 'Циклы и условия', 'Изучение условных операторов (if/else) и циклов (for, while). Практические задания по программированию.', 
 'Среда', '10:00-12:00', 'Аудитория 101', 'Практика'),
((SELECT id FROM courses WHERE title = 'Веб-разработка: HTML, CSS, JavaScript'), (SELECT id FROM users WHERE username = 'teacher2'), 
 'HTML основы', 'Структура HTML документа, теги, семантика. Создание первой веб-страницы.', 
 'Вторник', '14:00-16:00', 'Аудитория 205', 'Лекция'),
((SELECT id FROM courses WHERE title = 'Базы данных и SQL'), (SELECT id FROM users WHERE username = 'teacher3'), 
 'Введение в SQL', 'Основы SQL: SELECT, INSERT, UPDATE, DELETE. Работа с таблицами и связями.', 
 'Четверг', '11:00-13:00', 'Аудитория 302', 'Лекция'),
((SELECT id FROM courses WHERE title = 'React и современный фронтенд'), (SELECT id FROM users WHERE username = 'teacher2'), 
 'Компоненты React', 'Создание компонентов, props, state. Практика: создание Todo-приложения.', 
 'Пятница', '15:00-17:00', 'Аудитория 205', 'Практика'),
((SELECT id FROM courses WHERE title = 'Node.js и серверная разработка'), (SELECT id FROM users WHERE username = 'teacher1'), 
 'Express.js основы', 'Создание REST API с Express. Роутинг, middleware, обработка запросов.', 
 'Понедельник', '16:00-18:00', 'Аудитория 101', 'Лекция'),
((SELECT id FROM courses WHERE title = 'Машинное обучение для начинающих'), (SELECT id FROM users WHERE username = 'teacher3'), 
 'Введение в ML', 'Основные концепции машинного обучения: обучение с учителем и без учителя. Библиотека scikit-learn.', 
 'Среда', '13:00-15:00', 'Аудитория 302', 'Лекция'),
((SELECT id FROM courses WHERE title = 'DevOps и CI/CD'), (SELECT id FROM users WHERE username = 'teacher1'), 
 'Docker основы', 'Контейнеризация приложений с Docker. Создание Dockerfile, работа с образами и контейнерами.', 
 'Вторник', '10:00-12:00', 'Аудитория 101', 'Практика')
ON CONFLICT DO NOTHING;

INSERT INTO lesson_submissions (enrollment_id, schedule_id, answer, is_approved) VALUES
((SELECT e.id FROM enrollments e JOIN users u ON e.user_id = u.id JOIN courses c ON e.course_id = c.id WHERE u.username = 'student1' AND c.title = 'Основы программирования на Python' LIMIT 1),
 (SELECT id FROM schedule WHERE title = 'Введение в Python' LIMIT 1),
 'Изучил основы Python. Переменные используются для хранения данных. Типы данных включают int, float, str, bool, list, dict. Python - интерпретируемый язык с динамической типизацией.', true),
((SELECT e.id FROM enrollments e JOIN users u ON e.user_id = u.id JOIN courses c ON e.course_id = c.id WHERE u.username = 'student1' AND c.title = 'Основы программирования на Python' LIMIT 1),
 (SELECT id FROM schedule WHERE title = 'Циклы и условия' LIMIT 1),
 'Изучил условные операторы if/else и циклы for/while. Написал программу для вычисления факториала числа.', false),
((SELECT e.id FROM enrollments e JOIN users u ON e.user_id = u.id JOIN courses c ON e.course_id = c.id WHERE u.username = 'student2' AND c.title = 'Базы данных и SQL' LIMIT 1),
 (SELECT id FROM schedule WHERE title = 'Введение в SQL' LIMIT 1),
 'Изучил основные SQL команды: SELECT для выборки данных, INSERT для добавления, UPDATE для обновления, DELETE для удаления. Понял важность нормализации базы данных.', true),
((SELECT e.id FROM enrollments e JOIN users u ON e.user_id = u.id JOIN courses c ON e.course_id = c.id WHERE u.username = 'student3' AND c.title = 'Node.js и серверная разработка' LIMIT 1),
 (SELECT id FROM schedule WHERE title = 'Express.js основы' LIMIT 1),
 'Создал простое REST API с Express. Реализовал эндпоинты для CRUD операций. Использовал middleware для обработки JSON и логирования запросов.', true),
((SELECT e.id FROM enrollments e JOIN users u ON e.user_id = u.id JOIN courses c ON e.course_id = c.id WHERE u.username = 'student4' AND c.title = 'Машинное обучение для начинающих' LIMIT 1),
 (SELECT id FROM schedule WHERE title = 'Введение в ML' LIMIT 1),
 'Изучил основные типы машинного обучения: обучение с учителем (supervised) и без учителя (unsupervised). Попробовал использовать scikit-learn для простой классификации.', false)
ON CONFLICT (enrollment_id, schedule_id) DO NOTHING;

INSERT INTO educational_processes (course_id, title, description, "order", materials, deadline) VALUES
((SELECT id FROM courses WHERE title = 'Основы программирования на Python'), 
 'Модуль 1: Основы синтаксиса', 
 'Изучение базового синтаксиса Python, переменных, типов данных и операторов.', 
 1, 
 ARRAY['https://docs.python.org/3/tutorial/', 'https://www.python.org/about/gettingstarted/'], 
 CURRENT_DATE + INTERVAL '2 weeks'),
((SELECT id FROM courses WHERE title = 'Веб-разработка: HTML, CSS, JavaScript'), 
 'Модуль 1: HTML и CSS', 
 'Создание структуры веб-страницы с HTML и стилизация с помощью CSS.', 
 1, 
 ARRAY['https://developer.mozilla.org/en-US/docs/Web/HTML', 'https://developer.mozilla.org/en-US/docs/Web/CSS'], 
 CURRENT_DATE + INTERVAL '3 weeks'),
((SELECT id FROM courses WHERE title = 'Базы данных и SQL'), 
 'Модуль 1: Проектирование БД', 
 'Нормализация базы данных, создание ER-диаграмм, выбор типов данных.', 
 1, 
 ARRAY['https://www.postgresql.org/docs/current/ddl.html'], 
 CURRENT_DATE + INTERVAL '1 week'),
((SELECT id FROM courses WHERE title = 'React и современный фронтенд'), 
 'Модуль 1: React основы', 
 'Изучение компонентов React, JSX, props и state. Создание первого React приложения.', 
 1, 
 ARRAY['https://react.dev/learn', 'https://react.dev/reference/react'], 
 CURRENT_DATE + INTERVAL '2 weeks')
ON CONFLICT DO NOTHING;

INSERT INTO feedback (user_id, name, email, subject, message, status) VALUES
((SELECT id FROM users WHERE username = 'student1'), 'Козлов Алексей', 'student1@edu.ru', 'Вопрос по курсу Python', 'Здравствуйте! У меня возник вопрос по домашнему заданию по циклам. Можно ли получить дополнительную консультацию?', 'new'),
((SELECT id FROM users WHERE username = 'student2'), 'Морозова Анна', 'student2@edu.ru', 'Благодарность', 'Спасибо за отличный курс по базам данных! Материал изложен очень понятно.', 'new'),
(NULL, 'Иванов Петр', 'ivanov@example.com', 'Вопрос о записи на курс', 'Добрый день! Хотел бы узнать, когда начинается следующий набор на курс по веб-разработке?', 'new'),
((SELECT id FROM users WHERE username = 'student3'), 'Волков Дмитрий', 'student3@edu.ru', 'Техническая проблема', 'Не могу войти в личный кабинет. Постоянно выдает ошибку авторизации.', 'new'),
((SELECT id FROM users WHERE username = 'student4'), 'Новикова Елена', 'student4@edu.ru', 'Предложение', 'Предлагаю добавить больше практических заданий по машинному обучению. Спасибо!', 'new')
ON CONFLICT DO NOTHING;
