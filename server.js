const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');
const querystring = require('querystring');

const PORT = 3000;
const DATA_DIR = path.join(__dirname, 'data');

// Вспомогательные функции для работы с JSON файлами
function readJSONFile(filename) {
  try {
    const filePath = path.join(DATA_DIR, filename);
    const data = fs.readFileSync(filePath, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    return [];
  }
}

function writeJSONFile(filename, data) {
  const filePath = path.join(DATA_DIR, filename);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
}

// Генерация уникального ID
function generateId(data) {
  return data.length > 0 ? Math.max(...data.map(item => item.id)) + 1 : 1;
}

// Генерация токена сессии
function generateSessionToken() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Получение пользователя по токену сессии
function getUserBySession(sessionToken) {
  const sessions = readJSONFile('sessions.json');
  const session = sessions.find(s => s.token === sessionToken);
  if (!session) return null;
  
  const users = readJSONFile('users.json');
  return users.find(u => u.id === session.userId) || null;
}

// Определение MIME типа
function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.gif': 'image/gif',
    '.svg': 'image/svg+xml'
  };
  return mimeTypes[ext] || 'application/octet-stream';
}

// Отправка ответа
function sendResponse(res, statusCode, contentType, data) {
  res.writeHead(statusCode, { 'Content-Type': contentType });
  res.end(data);
}

// Отправка JSON ответа
function sendJSON(res, statusCode, data) {
  sendResponse(res, statusCode, 'application/json', JSON.stringify(data));
}

// Отправка HTML страницы
function sendHTML(res, statusCode, html) {
  sendResponse(res, statusCode, 'text/html', html);
}

// Отправка файла
function sendFile(res, filePath) {
  if (!fs.existsSync(filePath)) {
    sendErrorPage(res, 404);
    return;
  }
  
  const content = fs.readFileSync(filePath);
  const mimeType = getMimeType(filePath);
  sendResponse(res, 200, mimeType, content);
}

// Страница ошибки 404
function sendErrorPage(res, errorCode) {
  const errorPages = {
    400: {
      title: '400 - Неверный запрос',
      message: 'Запрос содержит синтаксическую ошибку или не может быть выполнен.'
    },
    401: {
      title: '401 - Не авторизован',
      message: 'Для доступа к этому ресурсу требуется авторизация.'
    },
    403: {
      title: '403 - Доступ запрещен',
      message: 'У вас нет прав для доступа к этому ресурсу.'
    },
    404: {
      title: '404 - Страница не найдена',
      message: 'Запрашиваемая страница не существует.'
    }
  };
  
  const error = errorPages[errorCode] || {
    title: `${errorCode} - Ошибка`,
    message: 'Произошла ошибка при обработке запроса.'
  };
  
  const html = `
    <!DOCTYPE html>
    <html lang="ru">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${error.title}</title>
      <link rel="stylesheet" href="/css/style.css">
    </head>
    <body>
      <header>
        <nav class="navbar">
          <div class="container">
            <div class="nav-brand">
              <h1>Образовательная Система</h1>
            </div>
            <button class="menu-toggle" id="menuToggle">☰</button>
            <ul class="nav-menu" id="navMenu">
              <li><a href="/">Главная</a></li>
              <li><a href="/courses.html">Курсы</a></li>
              <li><a href="/feedback.html">Обратная связь</a></li>
              <li><a href="/login.html">Вход</a></li>
            </ul>
          </div>
        </nav>
      </header>
      <main>
        <div class="error-container">
          <h1>${error.title}</h1>
          <p>${error.message}</p>
          <a href="/" class="btn btn-primary">Вернуться на главную</a>
        </div>
      </main>
      <footer>
        <div class="container">
          <div class="footer-content">
            <div class="footer-column">
              <h3>О системе</h3>
              <ul>
                <li><a href="/">Главная</a></li>
                <li><a href="/courses.html">Курсы</a></li>
                <li><a href="/feedback.html">Обратная связь</a></li>
                <li><a href="/login.html">Вход в систему</a></li>
              </ul>
            </div>
            <div class="footer-column">
              <h3>Для студентов</h3>
              <ul>
                <li><a href="/courses.html">Каталог курсов</a></li>
                <li><a href="/dashboard.html">Личный кабинет</a></li>
                <li><a href="/feedback.html">Задать вопрос</a></li>
                <li><a href="/login.html">Регистрация</a></li>
              </ul>
            </div>
            <div class="footer-column">
              <h3>Контакты</h3>
              <ul>
                <li>Email: info@edu-system.ru</li>
                <li>Телефон: +7 (495) 123-45-67</li>
                <li>Адрес: г. Москва, ул. Образовательная, д. 1</li>
              </ul>
            </div>
            <div class="footer-column">
              <h3>Социальные сети</h3>
              <ul>
                <li><a href="#">ВКонтакте</a></li>
                <li><a href="#">Telegram</a></li>
                <li><a href="#">YouTube</a></li>
              </ul>
            </div>
          </div>
          <div class="footer-bottom">
            <p>&copy; 2024 Система управления образовательными учреждениями. Все права защищены.</p>
          </div>
        </div>
      </footer>
      <script src="/js/auth.js"></script>
    </body>
    </html>
  `;
  
  sendHTML(res, errorCode, html);
}

// Обработка POST данных
function getPostData(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
    });
    req.on('end', () => {
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        resolve(querystring.parse(body));
      }
    });
    req.on('error', reject);
  });
}

// API маршруты
async function handleAPI(req, res, pathname, method) {
  // Получение токена из cookies
  const cookies = req.headers.cookie || '';
  const sessionToken = cookies.split(';')
    .find(c => c.trim().startsWith('session='))
    ?.split('=')[1];

  // Получение текущего пользователя
  const currentUser = sessionToken ? getUserBySession(sessionToken) : null;
  
  // Парсинг URL для получения query параметров
  const parsedUrl = url.parse(req.url, true);

  // Проверка прав администратора (определяем в начале функции)
  function checkAdminAccess() {
    if (!currentUser || currentUser.role !== 'admin') {
      sendJSON(res, 403, { error: 'Доступ запрещен. Требуются права администратора' });
      return false;
    }
    return true;
  }

  // Регистрация
  if (pathname === '/api/register' && method === 'POST') {
    const data = await getPostData(req);
    const users = readJSONFile('users.json');
    
    if (users.find(u => u.username === data.username || u.email === data.email)) {
      sendJSON(res, 400, { error: 'Пользователь с таким именем или email уже существует' });
      return;
    }
    
    const newUser = {
      id: generateId(users),
      username: data.username,
      email: data.email,
      password: data.password,
      role: 'student',
      fullName: data.fullName || data.username,
      createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    writeJSONFile('users.json', users);
    
    sendJSON(res, 201, { message: 'Регистрация успешна', userId: newUser.id });
    return;
  }

  // Вход
  if (pathname === '/api/login' && method === 'POST') {
    const data = await getPostData(req);
    const users = readJSONFile('users.json');
    const user = users.find(u => 
      (u.username === data.login || u.email === data.login) && 
      u.password === data.password
    );
    
    if (!user) {
      sendJSON(res, 401, { error: 'Неверное имя пользователя или пароль' });
      return;
    }
    
    const token = generateSessionToken();
    const sessions = readJSONFile('sessions.json');
    sessions.push({
      token,
      userId: user.id,
      createdAt: new Date().toISOString()
    });
    writeJSONFile('sessions.json', sessions);
    
    res.setHeader('Set-Cookie', `session=${token}; HttpOnly; Path=/`);
    sendJSON(res, 200, { 
      message: 'Вход выполнен успешно',
      user: { id: user.id, username: user.username, email: user.email, fullName: user.fullName, role: user.role }
    });
    return;
  }

  // Выход
  if (pathname === '/api/logout' && method === 'POST') {
    if (sessionToken) {
      const sessions = readJSONFile('sessions.json');
      const filtered = sessions.filter(s => s.token !== sessionToken);
      writeJSONFile('sessions.json', filtered);
    }
    res.setHeader('Set-Cookie', 'session=; HttpOnly; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT');
    sendJSON(res, 200, { message: 'Выход выполнен успешно' });
    return;
  }

  // Получение текущего пользователя
  if (pathname === '/api/me' && method === 'GET') {
    if (!currentUser) {
      sendJSON(res, 401, { error: 'Не авторизован' });
      return;
    }
    sendJSON(res, 200, { 
      id: currentUser.id, 
      username: currentUser.username, 
      email: currentUser.email, 
      fullName: currentUser.fullName,
      role: currentUser.role
    });
    return;
  }

  // ========== АДМИНИСТРАТИВНЫЕ API (обрабатываются первыми) ==========
  
  // Проверка прав администратора
  function checkAdminAccess() {
    if (!currentUser || currentUser.role !== 'admin') {
      sendJSON(res, 403, { error: 'Доступ запрещен. Требуются права администратора' });
      return false;
    }
    return true;
  }

  // Управление курсами - Создание (должно быть до /api/courses)
  if (pathname === '/api/admin/courses' && method === 'POST') {
    if (!checkAdminAccess()) return;
    
    const data = await getPostData(req);
    const courses = readJSONFile('courses.json');
    
    const newCourse = {
      id: generateId(courses),
      title: data.title,
      description: data.description,
      duration: data.duration,
      instructor: data.instructor,
      price: parseInt(data.price),
      category: data.category,
      available: data.available !== undefined ? data.available : true,
      createdAt: new Date().toISOString()
    };
    
    courses.push(newCourse);
    writeJSONFile('courses.json', courses);
    
    sendJSON(res, 201, { message: 'Курс создан', course: newCourse });
    return;
  }

  // Управление курсами - Обновление
  if (pathname.startsWith('/api/admin/courses/') && method === 'PUT') {
    if (!checkAdminAccess()) return;
    
    const courseId = parseInt(pathname.split('/')[4]);
    const data = await getPostData(req);
    const courses = readJSONFile('courses.json');
    const courseIndex = courses.findIndex(c => c.id === courseId);
    
    if (courseIndex === -1) {
      sendJSON(res, 404, { error: 'Курс не найден' });
      return;
    }
    
    courses[courseIndex] = {
      ...courses[courseIndex],
      title: data.title,
      description: data.description,
      duration: data.duration,
      instructor: data.instructor,
      price: parseInt(data.price),
      category: data.category
    };
    
    writeJSONFile('courses.json', courses);
    sendJSON(res, 200, { message: 'Курс обновлен', course: courses[courseIndex] });
    return;
  }

  // Управление курсами - Удаление
  if (pathname.startsWith('/api/admin/courses/') && method === 'DELETE') {
    if (!checkAdminAccess()) return;
    
    const courseId = parseInt(pathname.split('/')[4]);
    const courses = readJSONFile('courses.json');
    const filtered = courses.filter(c => c.id !== courseId);
    
    if (courses.length === filtered.length) {
      sendJSON(res, 404, { error: 'Курс не найден' });
      return;
    }
    
    writeJSONFile('courses.json', filtered);
    sendJSON(res, 200, { message: 'Курс удален' });
    return;
  }

  // Управление обратной связью - Получение списка (должно быть до /api/feedback)
  if (pathname === '/api/admin/feedback' && method === 'GET') {
    if (!checkAdminAccess()) return;
    
    const feedback = readJSONFile('feedback.json');
    // Сортируем по дате создания (новые первыми)
    feedback.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    sendJSON(res, 200, feedback);
    return;
  }

  // Управление обратной связью - Обновление статуса
  if (pathname.startsWith('/api/admin/feedback/') && method === 'PUT') {
    if (!checkAdminAccess()) return;
    
    const feedbackId = parseInt(pathname.split('/')[4]);
    const data = await getPostData(req);
    const feedback = readJSONFile('feedback.json');
    const feedbackIndex = feedback.findIndex(f => f.id === feedbackId);
    
    if (feedbackIndex === -1) {
      sendJSON(res, 404, { error: 'Сообщение не найдено' });
      return;
    }
    
    feedback[feedbackIndex] = {
      ...feedback[feedbackIndex],
      status: data.status
    };
    
    writeJSONFile('feedback.json', feedback);
    sendJSON(res, 200, { message: 'Статус обновлен', feedback: feedback[feedbackIndex] });
    return;
  }

  // Получение курсов
  if (pathname === '/api/courses' && method === 'GET') {
    const courses = readJSONFile('courses.json');
    sendJSON(res, 200, courses);
    return;
  }

  // Получение курса по ID
  if (pathname.startsWith('/api/courses/') && method === 'GET') {
    const courseId = parseInt(pathname.split('/')[3]);
    const courses = readJSONFile('courses.json');
    const course = courses.find(c => c.id === courseId);
    
    if (!course) {
      sendJSON(res, 404, { error: 'Курс не найден' });
      return;
    }
    
    sendJSON(res, 200, course);
    return;
  }

  // Запись на курс
  if (pathname === '/api/enroll' && method === 'POST') {
    if (!currentUser) {
      sendJSON(res, 401, { error: 'Требуется авторизация' });
      return;
    }
    
    const data = await getPostData(req);
    const enrollments = readJSONFile('enrollments.json');
    const courses = readJSONFile('courses.json');
    
    const course = courses.find(c => c.id === parseInt(data.courseId));
    if (!course) {
      sendJSON(res, 404, { error: 'Курс не найден' });
      return;
    }
    
    const existing = enrollments.find(e => 
      e.userId === currentUser.id && e.courseId === parseInt(data.courseId)
    );
    
    if (existing) {
      sendJSON(res, 400, { error: 'Вы уже записаны на этот курс' });
      return;
    }
    
    const enrollment = {
      id: generateId(enrollments),
      userId: currentUser.id,
      courseId: parseInt(data.courseId),
      status: 'active',
      enrolledAt: new Date().toISOString(),
      progress: 0
    };
    
    enrollments.push(enrollment);
    writeJSONFile('enrollments.json', enrollments);
    
    sendJSON(res, 201, { message: 'Запись на курс успешна', enrollment });
    return;
  }

  // Получение записей пользователя
  if (pathname === '/api/my-enrollments' && method === 'GET') {
    if (!currentUser) {
      sendJSON(res, 401, { error: 'Требуется авторизация' });
      return;
    }
    
    const enrollments = readJSONFile('enrollments.json');
    const courses = readJSONFile('courses.json');
    const userEnrollments = enrollments
      .filter(e => e.userId === currentUser.id)
      .map(e => {
        const course = courses.find(c => c.id === e.courseId);
        return { ...e, course };
      });
    
    sendJSON(res, 200, userEnrollments);
    return;
  }

  // Отправка обратной связи
  if (pathname === '/api/feedback' && method === 'POST') {
    const data = await getPostData(req);
    const feedback = readJSONFile('feedback.json');
    
    const newFeedback = {
      id: generateId(feedback),
      userId: currentUser ? currentUser.id : null,
      name: data.name || (currentUser ? currentUser.fullName : 'Гость'),
      email: data.email || (currentUser ? currentUser.email : ''),
      subject: data.subject,
      message: data.message,
      createdAt: new Date().toISOString(),
      status: 'new'
    };
    
    feedback.push(newFeedback);
    writeJSONFile('feedback.json', feedback);
    
    sendJSON(res, 201, { message: 'Сообщение отправлено успешно', feedback: newFeedback });
    return;
  }

  // ========== АДМИНИСТРАТИВНЫЕ API ==========
  
  // Проверка прав администратора
  function checkAdminAccess() {
    if (!currentUser || currentUser.role !== 'admin') {
      sendJSON(res, 403, { error: 'Доступ запрещен. Требуются права администратора' });
      return false;
    }
    return true;
  }

  // Управление пользователями - Получение списка
  if (pathname === '/api/admin/users' && method === 'GET') {
    if (!checkAdminAccess()) return;
    
    const users = readJSONFile('users.json');
    const query = parsedUrl.query;
    
    // Фильтрация по роли
    if (query.role) {
      const filtered = users.filter(u => u.role === query.role);
      sendJSON(res, 200, filtered);
      return;
    }
    
    sendJSON(res, 200, users);
    return;
  }

  // Управление пользователями - Получение по ID
  if (pathname.startsWith('/api/admin/users/') && method === 'GET') {
    if (!checkAdminAccess()) return;
    
    const userId = parseInt(pathname.split('/')[4]);
    const users = readJSONFile('users.json');
    const user = users.find(u => u.id === userId);
    
    if (!user) {
      sendJSON(res, 404, { error: 'Пользователь не найден' });
      return;
    }
    
    sendJSON(res, 200, user);
    return;
  }

  // Управление пользователями - Создание
  if (pathname === '/api/admin/users' && method === 'POST') {
    if (!checkAdminAccess()) return;
    
    const data = await getPostData(req);
    const users = readJSONFile('users.json');
    
    if (users.find(u => u.username === data.username || u.email === data.email)) {
      sendJSON(res, 400, { error: 'Пользователь с таким именем или email уже существует' });
      return;
    }
    
    const newUser = {
      id: generateId(users),
      username: data.username,
      email: data.email,
      password: data.password || 'default123',
      role: data.role || 'student',
      fullName: data.fullName || data.username,
      createdAt: new Date().toISOString()
    };
    
    users.push(newUser);
    writeJSONFile('users.json', users);
    
    sendJSON(res, 201, { message: 'Пользователь создан', user: newUser });
    return;
  }

  // Управление пользователями - Обновление
  if (pathname.startsWith('/api/admin/users/') && method === 'PUT') {
    if (!checkAdminAccess()) return;
    
    const userId = parseInt(pathname.split('/')[4]);
    const data = await getPostData(req);
    const users = readJSONFile('users.json');
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      sendJSON(res, 404, { error: 'Пользователь не найден' });
      return;
    }
    
    // Проверка уникальности username и email
    const existing = users.find(u => 
      u.id !== userId && (u.username === data.username || u.email === data.email)
    );
    if (existing) {
      sendJSON(res, 400, { error: 'Пользователь с таким именем или email уже существует' });
      return;
    }
    
    users[userIndex] = {
      ...users[userIndex],
      username: data.username,
      email: data.email,
      fullName: data.fullName,
      role: data.role
    };
    
    if (data.password) {
      users[userIndex].password = data.password;
    }
    
    writeJSONFile('users.json', users);
    sendJSON(res, 200, { message: 'Пользователь обновлен', user: users[userIndex] });
    return;
  }

  // Управление пользователями - Удаление
  if (pathname.startsWith('/api/admin/users/') && method === 'DELETE') {
    if (!checkAdminAccess()) return;
    
    const userId = parseInt(pathname.split('/')[4]);
    const users = readJSONFile('users.json');
    const filtered = users.filter(u => u.id !== userId);
    
    if (users.length === filtered.length) {
      sendJSON(res, 404, { error: 'Пользователь не найден' });
      return;
    }
    
    writeJSONFile('users.json', filtered);
    sendJSON(res, 200, { message: 'Пользователь удален' });
    return;
  }

  // Управление расписанием - Получение списка
  if (pathname === '/api/admin/schedule' && method === 'GET') {
    if (!checkAdminAccess()) return;
    
    const schedule = readJSONFile('schedule.json');
    const courses = readJSONFile('courses.json');
    const users = readJSONFile('users.json');
    
    const scheduleWithDetails = schedule.map(item => {
      const course = courses.find(c => c.id === item.courseId);
      const instructor = users.find(u => u.id === item.instructorId);
      return {
        ...item,
        courseTitle: course ? course.title : 'Неизвестный курс',
        instructorName: instructor ? (instructor.fullName || instructor.username) : 'Не назначен'
      };
    });
    
    sendJSON(res, 200, scheduleWithDetails);
    return;
  }

  // Управление расписанием - Получение по ID
  if (pathname.startsWith('/api/admin/schedule/') && method === 'GET') {
    if (!checkAdminAccess()) return;
    
    const scheduleId = parseInt(pathname.split('/')[4]);
    const schedule = readJSONFile('schedule.json');
    const item = schedule.find(s => s.id === scheduleId);
    
    if (!item) {
      sendJSON(res, 404, { error: 'Занятие не найдено' });
      return;
    }
    
    sendJSON(res, 200, item);
    return;
  }

  // Управление расписанием - Создание
  if (pathname === '/api/admin/schedule' && method === 'POST') {
    if (!checkAdminAccess()) return;
    
    const data = await getPostData(req);
    const schedule = readJSONFile('schedule.json');
    
    const newItem = {
      id: generateId(schedule),
      courseId: parseInt(data.courseId),
      instructorId: parseInt(data.instructorId),
      dayOfWeek: data.dayOfWeek,
      time: data.time,
      room: data.room,
      type: data.type,
      active: true,
      createdAt: new Date().toISOString()
    };
    
    schedule.push(newItem);
    writeJSONFile('schedule.json', schedule);
    
    sendJSON(res, 201, { message: 'Занятие создано', schedule: newItem });
    return;
  }

  // Управление расписанием - Обновление
  if (pathname.startsWith('/api/admin/schedule/') && method === 'PUT') {
    if (!checkAdminAccess()) return;
    
    const scheduleId = parseInt(pathname.split('/')[4]);
    const data = await getPostData(req);
    const schedule = readJSONFile('schedule.json');
    const itemIndex = schedule.findIndex(s => s.id === scheduleId);
    
    if (itemIndex === -1) {
      sendJSON(res, 404, { error: 'Занятие не найдено' });
      return;
    }
    
    schedule[itemIndex] = {
      ...schedule[itemIndex],
      courseId: parseInt(data.courseId),
      instructorId: parseInt(data.instructorId),
      dayOfWeek: data.dayOfWeek,
      time: data.time,
      room: data.room,
      type: data.type
    };
    
    writeJSONFile('schedule.json', schedule);
    sendJSON(res, 200, { message: 'Занятие обновлено', schedule: schedule[itemIndex] });
    return;
  }

  // Управление расписанием - Удаление
  if (pathname.startsWith('/api/admin/schedule/') && method === 'DELETE') {
    if (!checkAdminAccess()) return;
    
    const scheduleId = parseInt(pathname.split('/')[4]);
    const schedule = readJSONFile('schedule.json');
    const filtered = schedule.filter(s => s.id !== scheduleId);
    
    if (schedule.length === filtered.length) {
      sendJSON(res, 404, { error: 'Занятие не найдено' });
      return;
    }
    
    writeJSONFile('schedule.json', filtered);
    sendJSON(res, 200, { message: 'Занятие удалено' });
    return;
  }

  // Управление учебными процессами - Получение списка
  if (pathname === '/api/admin/processes' && method === 'GET') {
    if (!checkAdminAccess()) return;
    
    const processes = readJSONFile('educational-processes.json');
    const courses = readJSONFile('courses.json');
    
    const processesWithDetails = processes.map(process => {
      const course = courses.find(c => c.id === process.courseId);
      return {
        ...process,
        courseTitle: course ? course.title : 'Неизвестный курс'
      };
    });
    
    sendJSON(res, 200, processesWithDetails);
    return;
  }

  // Управление учебными процессами - Получение по ID
  if (pathname.startsWith('/api/admin/processes/') && method === 'GET') {
    if (!checkAdminAccess()) return;
    
    const processId = parseInt(pathname.split('/')[4]);
    const processes = readJSONFile('educational-processes.json');
    const process = processes.find(p => p.id === processId);
    
    if (!process) {
      sendJSON(res, 404, { error: 'Модуль не найден' });
      return;
    }
    
    sendJSON(res, 200, process);
    return;
  }

  // Управление учебными процессами - Создание
  if (pathname === '/api/admin/processes' && method === 'POST') {
    if (!checkAdminAccess()) return;
    
    const data = await getPostData(req);
    const processes = readJSONFile('educational-processes.json');
    
    const newProcess = {
      id: generateId(processes),
      courseId: parseInt(data.courseId),
      title: data.title,
      description: data.description,
      order: parseInt(data.order),
      materials: [],
      deadline: data.deadline,
      active: true,
      createdAt: new Date().toISOString()
    };
    
    processes.push(newProcess);
    writeJSONFile('educational-processes.json', processes);
    
    sendJSON(res, 201, { message: 'Модуль создан', process: newProcess });
    return;
  }

  // Управление учебными процессами - Обновление
  if (pathname.startsWith('/api/admin/processes/') && method === 'PUT') {
    if (!checkAdminAccess()) return;
    
    const processId = parseInt(pathname.split('/')[4]);
    const data = await getPostData(req);
    const processes = readJSONFile('educational-processes.json');
    const processIndex = processes.findIndex(p => p.id === processId);
    
    if (processIndex === -1) {
      sendJSON(res, 404, { error: 'Модуль не найден' });
      return;
    }
    
    processes[processIndex] = {
      ...processes[processIndex],
      courseId: parseInt(data.courseId),
      title: data.title,
      description: data.description,
      order: parseInt(data.order),
      deadline: data.deadline
    };
    
    writeJSONFile('educational-processes.json', processes);
    sendJSON(res, 200, { message: 'Модуль обновлен', process: processes[processIndex] });
    return;
  }

  // Управление учебными процессами - Удаление
  if (pathname.startsWith('/api/admin/processes/') && method === 'DELETE') {
    if (!checkAdminAccess()) return;
    
    const processId = parseInt(pathname.split('/')[4]);
    const processes = readJSONFile('educational-processes.json');
    const filtered = processes.filter(p => p.id !== processId);
    
    if (processes.length === filtered.length) {
      sendJSON(res, 404, { error: 'Модуль не найден' });
      return;
    }
    
    writeJSONFile('educational-processes.json', filtered);
    sendJSON(res, 200, { message: 'Модуль удален' });
    return;
  }

  sendJSON(res, 404, { error: 'API endpoint не найден' });
}

// Обработка статических файлов и маршрутов
function handleRequest(req, res) {
  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // API запросы
  if (pathname.startsWith('/api/')) {
    handleAPI(req, res, pathname, method);
    return;
  }

  // Статические файлы
  if (pathname.startsWith('/css/') || pathname.startsWith('/js/')) {
    const filePath = path.join(__dirname, pathname);
    sendFile(res, filePath);
    return;
  }

  // HTML страницы
  let htmlFile = 'index.html';
  
  if (pathname === '/' || pathname === '/index.html') {
    htmlFile = 'index.html';
  } else if (pathname === '/login.html') {
    htmlFile = 'login.html';
  } else if (pathname === '/dashboard.html') {
    htmlFile = 'dashboard.html';
  } else if (pathname === '/courses.html') {
    htmlFile = 'courses.html';
  } else if (pathname === '/feedback.html') {
    htmlFile = 'feedback.html';
  } else if (pathname === '/admin.html') {
    htmlFile = 'admin.html';
  } else {
    sendErrorPage(res, 404);
    return;
  }

  const filePath = path.join(__dirname, htmlFile);
  sendFile(res, filePath);
}

// Создание сервера
const server = http.createServer(handleRequest);

server.listen(PORT, () => {
  console.log(`Сервер запущен на http://localhost:${PORT}`);
});

