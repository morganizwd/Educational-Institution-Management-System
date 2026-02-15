require('dotenv').config();

const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

const frontendDistPath = path.join(__dirname, '..', 'frontend', 'dist');
app.use(express.static(frontendDistPath));
async function getUserBySession(sessionToken) {
  if (!sessionToken) return null;
  const sessionRes = await db.query(
    'SELECT user_id FROM sessions WHERE token = $1',
    [sessionToken]
  );
  if (sessionRes.rowCount === 0) return null;
  const userRes = await db.query(
    'SELECT id, username, email, full_name AS "fullName", role FROM users WHERE id = $1',
    [sessionRes.rows[0].user_id]
  );
  return userRes.rows[0] || null;
}

function generateSessionToken() {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

app.use(async (req, res, next) => {
  try {
    const cookies = req.cookies || {};
    const sessionToken = cookies.session;
    req.currentUser = await getUserBySession(sessionToken);
  } catch (e) {
    console.error('Error resolving current user', e);
    req.currentUser = null;
  }
  next();
});

function requireAuth(req, res, next) {
  if (!req.currentUser) {
    return res.status(401).json({ error: 'Не авторизован' });
  }
  next();
}

function requireAdmin(req, res, next) {
  if (!req.currentUser || req.currentUser.role !== 'admin') {
    return res
      .status(403)
      .json({ error: 'Доступ запрещен. Требуются права администратора' });
  }
  next();
}


app.post('/api/register', async (req, res) => {
  const { username, email, password, fullName } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ error: 'Не заполнены обязательные поля' });
  }
  try {
    const exists = await db.query(
      'SELECT 1 FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );
    if (exists.rowCount > 0) {
      return res
        .status(400)
        .json({ error: 'Пользователь с таким именем или email уже существует' });
    }
    const insertRes = await db.query(
      `INSERT INTO users (username, email, password, role, full_name)
       VALUES ($1, $2, $3, 'student', $4)
       RETURNING id`,
      [username, email, password, fullName || username]
    );
    return res
      .status(201)
      .json({ message: 'Регистрация успешна', userId: insertRes.rows[0].id });
  } catch (e) {
    console.error('Register error', e);
    return res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.post('/api/login', async (req, res) => {
  const { login, password } = req.body;
  if (!login || !password) {
    return res.status(400).json({ error: 'Не заполнены обязательные поля' });
  }
  try {
    const userRes = await db.query(
      `SELECT id, username, email, password, full_name AS "fullName", role
       FROM users
       WHERE (username = $1 OR email = $1)`,
      [login]
    );
    const user = userRes.rows[0];
    if (!user || user.password !== password) {
      return res
        .status(401)
        .json({ error: 'Неверное имя пользователя или пароль' });
    }

    const token = generateSessionToken();
    await db.query(
      'INSERT INTO sessions (token, user_id) VALUES ($1, $2)',
      [token, user.id]
    );

    res.cookie('session', token, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    });
    return res.status(200).json({
      message: 'Вход выполнен успешно',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      },
    });
  } catch (e) {
    console.error('Login error', e);
    return res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.post('/api/logout', async (req, res) => {
  const token = req.cookies.session;
  try {
    if (token) {
      await db.query('DELETE FROM sessions WHERE token = $1', [token]);
    }
    res.cookie('session', '', {
      httpOnly: true,
      expires: new Date(0),
      path: '/',
    });
    return res.status(200).json({ message: 'Выход выполнен успешно' });
  } catch (e) {
    console.error('Logout error', e);
    return res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/api/me', requireAuth, (req, res) => {
  const user = req.currentUser;
  return res.status(200).json({
    id: user.id,
    username: user.username,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
  });
});


app.get('/api/courses', async (_req, res) => {
  try {
    const result = await db.query(
      'SELECT id, title, description, duration, instructor, price, category, image_url AS "imageUrl", available, created_at AS "createdAt" FROM courses ORDER BY id'
    );
    return res.status(200).json(result.rows);
  } catch (e) {
    console.error('Get courses error', e);
    return res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/api/courses/:id', async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'Неверный ID курса' });
  }
  try {
    const result = await db.query(
      'SELECT id, title, description, duration, instructor, price, category, image_url AS "imageUrl", available, created_at AS "createdAt" FROM courses WHERE id = $1',
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Курс не найден' });
    }
    return res.status(200).json(result.rows[0]);
  } catch (e) {
    console.error('Get course by id error', e);
    return res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.post('/api/enroll', requireAuth, async (req, res) => {
  const user = req.currentUser;
  const { courseId } = req.body;
  const cid = Number(courseId);
  if (Number.isNaN(cid)) {
    return res.status(400).json({ error: 'Неверный ID курса' });
  }
  try {
    const courseRes = await db.query('SELECT id FROM courses WHERE id = $1', [
      cid,
    ]);
    if (courseRes.rowCount === 0) {
      return res.status(404).json({ error: 'Курс не найден' });
    }
    const existing = await db.query(
      'SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2',
      [user.id, cid]
    );
    if (existing.rowCount > 0) {
      return res
        .status(400)
        .json({ error: 'Вы уже записаны на этот курс' });
    }
    const insertRes = await db.query(
      `INSERT INTO enrollments (user_id, course_id, status, progress)
       VALUES ($1, $2, 'active', 0)
       RETURNING id, user_id AS "userId", course_id AS "courseId",
                 status, enrolled_at AS "enrolledAt", progress`,
      [user.id, cid]
    );
    return res
      .status(201)
      .json({ message: 'Запись на курс успешна', enrollment: insertRes.rows[0] });
  } catch (e) {
    console.error('Enroll error', e);
    return res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/api/my-enrollments', requireAuth, async (req, res) => {
  const user = req.currentUser;
  try {
    const result = await db.query(
      `SELECT e.id,
              e.user_id   AS "userId",
              e.course_id AS "courseId",
              e.status,
              e.enrolled_at AS "enrolledAt",
              e.progress,
              json_build_object(
                'id', c.id,
                'title', c.title,
                'description', c.description,
                'duration', c.duration,
                'instructor', c.instructor,
                'price', c.price,
                'category', c.category,
                'available', c.available,
                'createdAt', c.created_at
              ) AS course
       FROM enrollments e
       JOIN courses c ON c.id = e.course_id
       WHERE e.user_id = $1
       ORDER BY e.enrolled_at DESC`,
      [user.id]
    );
    return res.status(200).json(result.rows);
  } catch (e) {
    console.error('My enrollments error', e);
    return res.status(500).json({ error: 'Ошибка сервера' });
  }
});


app.post('/api/feedback', async (req, res) => {
  const currentUser = req.currentUser;
  const { name, email, subject, message } = req.body;
  const finalName = name || (currentUser ? currentUser.fullName : 'Гость');
  const finalEmail = email || (currentUser ? currentUser.email : '');
  if (!finalName || !finalEmail || !subject || !message) {
    return res.status(400).json({ error: 'Не заполнены обязательные поля' });
  }
  try {
    const insertRes = await db.query(
      `INSERT INTO feedback (user_id, name, email, subject, message, status)
       VALUES ($1, $2, $3, $4, $5, 'new')
       RETURNING id, user_id AS "userId", name, email, subject, message,
                 created_at AS "createdAt", status`,
      [currentUser ? currentUser.id : null, finalName, finalEmail, subject, message]
    );
    return res.status(201).json({
      message: 'Сообщение отправлено успешно',
      feedback: insertRes.rows[0],
    });
  } catch (e) {
    console.error('Feedback error', e);
    return res.status(500).json({ error: 'Ошибка сервера' });
  }
});


app.get('/api/admin/users', requireAdmin, async (req, res) => {
  const { role } = req.query;
  try {
    let result;
    if (role) {
      result = await db.query(
        `SELECT id, username, email, full_name AS "fullName",
                role, created_at AS "createdAt"
         FROM users
         WHERE role = $1
         ORDER BY id`,
        [role]
      );
    } else {
      result = await db.query(
        `SELECT id, username, email, full_name AS "fullName",
                role, created_at AS "createdAt"
         FROM users
         ORDER BY id`
      );
    }
    return res.status(200).json(result.rows);
  } catch (e) {
    console.error('Admin get users error', e);
    return res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/api/admin/users/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'Неверный ID пользователя' });
  }
  try {
    const result = await db.query(
      `SELECT id, username, email, full_name AS "fullName",
              role, created_at AS "createdAt"
       FROM users
       WHERE id = $1`,
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    return res.status(200).json(result.rows[0]);
  } catch (e) {
    console.error('Admin get user by id error', e);
    return res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.post('/api/admin/users', requireAdmin, async (req, res) => {
  const { username, email, password, role, fullName } = req.body;
  if (!username || !email || !fullName) {
    return res.status(400).json({ error: 'Не заполнены обязательные поля' });
  }
  try {
    const exists = await db.query(
      'SELECT 1 FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );
    if (exists.rowCount > 0) {
      return res
        .status(400)
        .json({ error: 'Пользователь с таким именем или email уже существует' });
    }
    const insertRes = await db.query(
      `INSERT INTO users (username, email, password, role, full_name)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, username, email, full_name AS "fullName",
                 role, created_at AS "createdAt"`,
      [username, email, password || 'default123', role || 'student', fullName]
    );
    return res
      .status(201)
      .json({ message: 'Пользователь создан', user: insertRes.rows[0] });
  } catch (e) {
    console.error('Admin create user error', e);
    return res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.put('/api/profile', requireAuth, async (req, res) => {
  const currentUser = req.currentUser;
  const { username, fullName, password } = req.body;
  
  if (!username || !fullName) {
    return res.status(400).json({ error: 'Имя пользователя и полное имя обязательны' });
  }
  
  try {
    const existing = await db.query(
      `SELECT 1 FROM users WHERE username = $1 AND id <> $2`,
      [username, currentUser.id]
    );
    if (existing.rowCount > 0) {
      return res.status(400).json({ error: 'Пользователь с таким именем уже существует' });
    }
    
    if (password) {
      await db.query(
        `UPDATE users
         SET username = $1, full_name = $2, password = $3
         WHERE id = $4`,
        [username, fullName, password, currentUser.id]
      );
    } else {
      await db.query(
        `UPDATE users
         SET username = $1, full_name = $2
         WHERE id = $3`,
        [username, fullName, currentUser.id]
      );
    }
    
    const result = await db.query(
      `SELECT id, username, email, full_name AS "fullName",
              role, created_at AS "createdAt"
       FROM users
       WHERE id = $1`,
      [currentUser.id]
    );
    
    return res.status(200).json({ 
      message: 'Профиль обновлен', 
      user: result.rows[0] 
    });
  } catch (e) {
    console.error('Update profile error', e);
    return res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.put('/api/admin/users/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'Неверный ID пользователя' });
  }
  const { username, email, fullName, role, password } = req.body;
  try {
    const existing = await db.query(
      `SELECT 1 FROM users
       WHERE (username = $1 OR email = $2) AND id <> $3`,
      [username, email, id]
    );
    if (existing.rowCount > 0) {
      return res
        .status(400)
        .json({ error: 'Пользователь с таким именем или email уже существует' });
    }
    const currentRes = await db.query(
      'SELECT id FROM users WHERE id = $1',
      [id]
    );
    if (currentRes.rowCount === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    if (password) {
      await db.query(
        `UPDATE users
         SET username = $1, email = $2, full_name = $3, role = $4, password = $5
         WHERE id = $6`,
        [username, email, fullName, role, password, id]
      );
    } else {
      await db.query(
        `UPDATE users
         SET username = $1, email = $2, full_name = $3, role = $4
         WHERE id = $5`,
        [username, email, fullName, role, id]
      );
    }
    const result = await db.query(
      `SELECT id, username, email, full_name AS "fullName",
              role, created_at AS "createdAt"
       FROM users
       WHERE id = $1`,
      [id]
    );
    return res
      .status(200)
      .json({ message: 'Пользователь обновлен', user: result.rows[0] });
  } catch (e) {
    console.error('Admin update user error', e);
    return res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.delete('/api/admin/users/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'Неверный ID пользователя' });
  }
  try {
    const resDel = await db.query('DELETE FROM users WHERE id = $1', [id]);
    if (resDel.rowCount === 0) {
      return res.status(404).json({ error: 'Пользователь не найден' });
    }
    return res.status(200).json({ message: 'Пользователь удален' });
  } catch (e) {
    console.error('Admin delete user error', e);
    return res.status(500).json({ error: 'Ошибка сервера' });
  }
});


app.post('/api/admin/courses', requireAdmin, async (req, res) => {
  const {
    title,
    description,
    duration,
    instructor,
    price,
    category,
    imageUrl,
    available,
  } = req.body;
  if (!title || !description || !duration || !instructor || !category) {
    return res.status(400).json({ error: 'Не заполнены обязательные поля' });
  }
  try {
    const insertRes = await db.query(
      `INSERT INTO courses (title, description, duration, instructor, price, category, image_url, available)
       VALUES ($1, $2, $3, $4, $5, $6, $7, COALESCE($8, TRUE))
       RETURNING id, title, description, duration, instructor, price, category,
                 image_url AS "imageUrl", available, created_at AS "createdAt"`,
      [title, description, duration, instructor, Number(price), category, imageUrl || null, available]
    );
    return res
      .status(201)
      .json({ message: 'Курс создан', course: insertRes.rows[0] });
  } catch (e) {
    console.error('Admin create course error', e);
    return res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.put('/api/admin/courses/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'Неверный ID курса' });
  }
  const {
    title,
    description,
    duration,
    instructor,
    price,
    category,
    imageUrl,
    available,
  } = req.body;
  try {
    const exists = await db.query('SELECT id FROM courses WHERE id = $1', [id]);
    if (exists.rowCount === 0) {
      return res.status(404).json({ error: 'Курс не найден' });
    }
    await db.query(
      `UPDATE courses
       SET title = $1,
           description = $2,
           duration = $3,
           instructor = $4,
           price = $5,
           category = $6,
           image_url = $7,
           available = COALESCE($8, available)
       WHERE id = $9`,
      [title, description, duration, instructor, Number(price), category, imageUrl || null, available, id]
    );
    const result = await db.query(
      `SELECT id, title, description, duration, instructor,
              price, category, image_url AS "imageUrl", available, created_at AS "createdAt"
       FROM courses
       WHERE id = $1`,
      [id]
    );
    return res
      .status(200)
      .json({ message: 'Курс обновлен', course: result.rows[0] });
  } catch (e) {
    console.error('Admin update course error', e);
    return res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.delete('/api/admin/courses/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'Неверный ID курса' });
  }
  try {
    const result = await db.query('DELETE FROM courses WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Курс не найден' });
    }
    return res.status(200).json({ message: 'Курс удален' });
  } catch (e) {
    console.error('Admin delete course error', e);
    return res.status(500).json({ error: 'Ошибка сервера' });
  }
});


app.get('/api/admin/feedback', requireAdmin, async (_req, res) => {
  try {
    const result = await db.query(
      `SELECT id, user_id AS "userId", name, email, subject, message,
              created_at AS "createdAt", status
       FROM feedback
       ORDER BY created_at DESC`
    );
    return res.status(200).json(result.rows);
  } catch (e) {
    console.error('Admin get feedback error', e);
    return res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.put('/api/admin/feedback/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'Неверный ID сообщения' });
  }
  const { status } = req.body;
  try {
    const result = await db.query(
      `UPDATE feedback
       SET status = $1
       WHERE id = $2
       RETURNING id, user_id AS "userId", name, email, subject, message,
                 created_at AS "createdAt", status`,
      [status, id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Сообщение не найдено' });
    }
    return res.status(200).json({
      message: 'Статус обновлен',
      feedback: result.rows[0],
    });
  } catch (e) {
    console.error('Admin update feedback error', e);
    return res.status(500).json({ error: 'Ошибка сервера' });
  }
});


app.get('/api/admin/schedule', requireAdmin, async (_req, res) => {
  try {
    const result = await db.query(
      `SELECT s.id,
              s.course_id     AS "courseId",
              s.instructor_id AS "instructorId",
              s.title,
              s.content,
              s.day_of_week   AS "dayOfWeek",
              s.time,
              s.room,
              s.type,
              s.active,
              s.created_at    AS "createdAt",
              c.title         AS "courseTitle",
              u.full_name     AS "instructorName"
       FROM schedule s
       JOIN courses c ON c.id = s.course_id
       JOIN users u   ON u.id = s.instructor_id
       ORDER BY s.id`
    );
    return res.status(200).json(result.rows);
  } catch (e) {
    console.error('Admin get schedule error', e);
    return res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/api/admin/schedule/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'Неверный ID занятия' });
  }
  try {
    const result = await db.query(
      `SELECT id,
              course_id     AS "courseId",
              instructor_id AS "instructorId",
              title,
              content,
              day_of_week   AS "dayOfWeek",
              time,
              room,
              type,
              active,
              created_at    AS "createdAt"
       FROM schedule
       WHERE id = $1`,
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Занятие не найдено' });
    }
    return res.status(200).json(result.rows[0]);
  } catch (e) {
    console.error('Admin get schedule by id error', e);
    return res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.post('/api/admin/schedule', requireAdmin, async (req, res) => {
  const {
    courseId,
    instructorId,
    title,
    content,
    dayOfWeek,
    time,
    room,
    type,
  } = req.body;
  if (!courseId || !instructorId || !dayOfWeek || !time || !room || !type) {
    return res.status(400).json({ error: 'Не заполнены обязательные поля' });
  }
  try {
    const insertRes = await db.query(
      `INSERT INTO schedule (course_id, instructor_id, title, content, day_of_week, time, room, type, active)
       VALUES ($1, $2, COALESCE($3, ''), COALESCE($4, ''), $5, $6, $7, $8, TRUE)
       RETURNING id,
                 course_id     AS "courseId",
                 instructor_id AS "instructorId",
                 title,
                 content,
                 day_of_week   AS "dayOfWeek",
                 time,
                 room,
                 type,
                 active,
                 created_at    AS "createdAt"`,
      [Number(courseId), Number(instructorId), title ?? null, content ?? null, dayOfWeek, time, room, type]
    );
    return res
      .status(201)
      .json({ message: 'Занятие создано', schedule: insertRes.rows[0] });
  } catch (e) {
    console.error('Admin create schedule error', e);
    return res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.put('/api/admin/schedule/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'Неверный ID занятия' });
  }
  const {
    courseId,
    instructorId,
    title,
    content,
    dayOfWeek,
    time,
    room,
    type,
  } = req.body;
  try {
    const exists = await db.query('SELECT id FROM schedule WHERE id = $1', [
      id,
    ]);
    if (exists.rowCount === 0) {
      return res.status(404).json({ error: 'Занятие не найдено' });
    }
    await db.query(
      `UPDATE schedule
       SET course_id     = $1,
           instructor_id = $2,
           title         = COALESCE($3, title),
           content       = COALESCE($4, content),
           day_of_week   = $5,
           time          = $6,
           room          = $7,
           type          = $8
       WHERE id = $9`,
      [
        Number(courseId),
        Number(instructorId),
        title ?? null,
        content ?? null,
        dayOfWeek,
        time,
        room,
        type,
        id
      ]
    );
    const result = await db.query(
      `SELECT id,
              course_id     AS "courseId",
              instructor_id AS "instructorId",
              title,
              content,
              day_of_week   AS "dayOfWeek",
              time,
              room,
              type,
              active,
              created_at    AS "createdAt"
       FROM schedule
       WHERE id = $1`,
      [id]
    );
    return res
      .status(200)
      .json({ message: 'Занятие обновлено', schedule: result.rows[0] });
  } catch (e) {
    console.error('Admin update schedule error', e);
    return res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.delete('/api/admin/schedule/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'Неверный ID занятия' });
  }
  try {
    const result = await db.query('DELETE FROM schedule WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Занятие не найдено' });
    }
    return res.status(200).json({ message: 'Занятие удалено' });
  } catch (e) {
    console.error('Admin delete schedule error', e);
    return res.status(500).json({ error: 'Ошибка сервера' });
  }
});


app.get('/api/admin/processes', requireAdmin, async (_req, res) => {
  try {
    const result = await db.query(
      `SELECT p.id,
              p.course_id   AS "courseId",
              p.title,
              p.description,
              p."order",
              p.materials,
              p.deadline,
              p.active,
              p.created_at  AS "createdAt",
              c.title       AS "courseTitle"
       FROM educational_processes p
       JOIN courses c ON c.id = p.course_id
       ORDER BY p.course_id, p."order"`
    );
    return res.status(200).json(result.rows);
  } catch (e) {
    console.error('Admin get processes error', e);
    return res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/api/admin/processes/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'Неверный ID модуля' });
  }
  try {
    const result = await db.query(
      `SELECT id,
              course_id   AS "courseId",
              title,
              description,
              "order",
              materials,
              deadline,
              active,
              created_at  AS "createdAt"
       FROM educational_processes
       WHERE id = $1`,
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Модуль не найден' });
    }
    return res.status(200).json(result.rows[0]);
  } catch (e) {
    console.error('Admin get process by id error', e);
    return res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/api/my-schedule', requireAuth, async (req, res) => {
  const currentUser = req.currentUser;
  try {
    const result = await db.query(
      `SELECT s.id,
              s.course_id      AS "courseId",
              s.instructor_id  AS "instructorId",
              s.title,
              s.content,
              s.day_of_week    AS "dayOfWeek",
              s.time,
              s.room,
              s.type,
              s.active,
              s.created_at     AS "createdAt",
              c.title          AS "courseTitle",
              u.full_name      AS "instructorName",
              e.id             AS "enrollmentId",
              ls.id            AS "submissionId",
              ls.answer        AS "answer",
              ls.is_approved   AS "isApproved"
       FROM enrollments e
       JOIN schedule s ON s.course_id = e.course_id
       JOIN courses c  ON c.id = s.course_id
       JOIN users u    ON u.id = s.instructor_id
       LEFT JOIN lesson_submissions ls
              ON ls.enrollment_id = e.id AND ls.schedule_id = s.id
       WHERE e.user_id = $1
       ORDER BY s.day_of_week, s.time`,
      [currentUser.id]
    );
    return res.status(200).json(result.rows);
  } catch (e) {
    console.error('My schedule error', e);
    return res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get('/api/teacher/schedule', requireAuth, async (req, res) => {
  const currentUser = req.currentUser;
  if (currentUser.role !== 'teacher' && currentUser.role !== 'admin') {
    return res
      .status(403)
      .json({ error: 'Доступ запрещен. Требуются права преподавателя' });
  }
  try {
    const query =
      currentUser.role === 'admin'
        ? `SELECT s.id,
              s.course_id     AS "courseId",
              s.instructor_id AS "instructorId",
              s.title,
              s.content,
              s.day_of_week   AS "dayOfWeek",
              s.time,
              s.room,
              s.type,
              s.active,
              s.created_at    AS "createdAt",
              c.title         AS "courseTitle",
              u.full_name     AS "instructorName"
       FROM schedule s
       JOIN courses c ON c.id = s.course_id
       JOIN users u ON u.id = s.instructor_id
       ORDER BY s.day_of_week, s.time`
        : `SELECT s.id,
              s.course_id     AS "courseId",
              s.instructor_id AS "instructorId",
              s.title,
              s.content,
              s.day_of_week   AS "dayOfWeek",
              s.time,
              s.room,
              s.type,
              s.active,
              s.created_at    AS "createdAt",
              c.title         AS "courseTitle",
              u.full_name     AS "instructorName"
       FROM schedule s
       JOIN courses c ON c.id = s.course_id
       JOIN users u ON u.id = s.instructor_id
       WHERE s.instructor_id = $1
       ORDER BY s.day_of_week, s.time`;
    const params = currentUser.role === 'admin' ? [] : [currentUser.id];
    const result = await db.query(query, params);
    return res.status(200).json(result.rows);
  } catch (e) {
    console.error('Teacher schedule error', e);
    return res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.post('/api/teacher/schedule', requireAuth, async (req, res) => {
  const currentUser = req.currentUser;
  if (currentUser.role !== 'teacher' && currentUser.role !== 'admin') {
    return res
      .status(403)
      .json({ error: 'Доступ запрещен. Требуются права преподавателя' });
  }
  const {
    courseId,
    title,
    content,
    dayOfWeek,
    time,
    room,
    type,
  } = req.body;
  if (!courseId || !title || !dayOfWeek || !time || !room || !type) {
    return res.status(400).json({ error: 'Не заполнены обязательные поля' });
  }
  try {
    const courseRes = await db.query(
      'SELECT id, instructor FROM courses WHERE id = $1',
      [Number(courseId)]
    );
    if (courseRes.rowCount === 0) {
      return res.status(404).json({ error: 'Курс не найден' });
    }
    const course = courseRes.rows[0];
    if (
      currentUser.role === 'teacher' &&
      course.instructor &&
      course.instructor !== currentUser.fullName
    ) {
      return res.status(403).json({
        error: 'Вы не назначены преподавателем на этот курс',
      });
    }

    const insertRes = await db.query(
      `INSERT INTO schedule (course_id, instructor_id, title, content, day_of_week, time, room, type, active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, TRUE)
       RETURNING id,
                 course_id     AS "courseId",
                 instructor_id AS "instructorId",
                 title,
                 content,
                 day_of_week   AS "dayOfWeek",
                 time,
                 room,
                 type,
                 active,
                 created_at    AS "createdAt"`,
      [
        Number(courseId),
        currentUser.id,
        title,
        content ?? '',
        dayOfWeek,
        time,
        room,
        type,
      ]
    );
    return res
      .status(201)
      .json({ message: 'Занятие создано', schedule: insertRes.rows[0] });
  } catch (e) {
    console.error('Teacher create schedule error', e);
    return res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.post('/api/lessons/:id/answer', requireAuth, async (req, res) => {
  const currentUser = req.currentUser;
  if (currentUser.role !== 'student') {
    return res
      .status(403)
      .json({ error: 'Только студенты могут отправлять ответы' });
  }
  const scheduleId = Number(req.params.id);
  const { answer } = req.body;
  if (Number.isNaN(scheduleId) || !answer) {
    return res.status(400).json({ error: 'Неверные данные' });
  }
  try {
    const scheduleRes = await db.query(
      'SELECT course_id FROM schedule WHERE id = $1',
      [scheduleId]
    );
    if (scheduleRes.rowCount === 0) {
      return res.status(404).json({ error: 'Занятие не найдено' });
    }
    const courseId = scheduleRes.rows[0].course_id;

    const enrollmentRes = await db.query(
      'SELECT id FROM enrollments WHERE user_id = $1 AND course_id = $2',
      [currentUser.id, courseId]
    );
    if (enrollmentRes.rowCount === 0) {
      return res
        .status(403)
        .json({ error: 'Вы не записаны на этот курс' });
    }
    const enrollmentId = enrollmentRes.rows[0].id;

    const upsertRes = await db.query(
      `INSERT INTO lesson_submissions (enrollment_id, schedule_id, answer, is_approved)
       VALUES ($1, $2, $3, FALSE)
       ON CONFLICT (enrollment_id, schedule_id)
       DO UPDATE SET answer = EXCLUDED.answer,
                     is_approved = FALSE,
                     updated_at = NOW()
       RETURNING id, enrollment_id AS "enrollmentId", schedule_id AS "scheduleId",
                 answer, is_approved AS "isApproved", created_at AS "createdAt",
                 updated_at AS "updatedAt"`,
      [enrollmentId, scheduleId, answer]
    );
    return res.status(201).json({
      message: 'Ответ отправлен',
      submission: upsertRes.rows[0],
    });
  } catch (e) {
    console.error('Lesson answer error', e);
    return res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.get(
  '/api/teacher/lessons/:id/submissions',
  requireAuth,
  async (req, res) => {
    const currentUser = req.currentUser;
    if (currentUser.role !== 'teacher' && currentUser.role !== 'admin') {
      return res
        .status(403)
        .json({ error: 'Доступ запрещен. Требуются права преподавателя' });
    }
    const scheduleId = Number(req.params.id);
    if (Number.isNaN(scheduleId)) {
      return res.status(400).json({ error: 'Неверный ID занятия' });
    }
    try {
      const scheduleRes = await db.query(
        'SELECT instructor_id FROM schedule WHERE id = $1',
        [scheduleId]
      );
      if (scheduleRes.rowCount === 0) {
        return res.status(404).json({ error: 'Занятие не найдено' });
      }
      if (
        currentUser.role === 'teacher' &&
        scheduleRes.rows[0].instructor_id !== currentUser.id
      ) {
        return res
          .status(403)
          .json({ error: 'Вы не являетесь преподавателем этого занятия' });
      }

      const result = await db.query(
        `SELECT ls.id,
                ls.enrollment_id AS "enrollmentId",
                ls.schedule_id   AS "scheduleId",
                ls.answer,
                ls.is_approved   AS "isApproved",
                ls.created_at    AS "createdAt",
                ls.updated_at    AS "updatedAt",
                u.full_name      AS "studentName",
                u.email          AS "studentEmail"
         FROM lesson_submissions ls
         JOIN enrollments e ON e.id = ls.enrollment_id
         JOIN users u       ON u.id = e.user_id
         WHERE ls.schedule_id = $1
         ORDER BY ls.created_at`,
        [scheduleId]
      );
      return res.status(200).json(result.rows);
    } catch (e) {
      console.error('Teacher lesson submissions error', e);
      return res.status(500).json({ error: 'Ошибка сервера' });
    }
  }
);

app.post(
  '/api/teacher/lessons/:lessonId/submissions/:submissionId/review',
  requireAuth,
  async (req, res) => {
    const currentUser = req.currentUser;
    if (currentUser.role !== 'teacher' && currentUser.role !== 'admin') {
      return res
        .status(403)
        .json({ error: 'Доступ запрещен. Требуются права преподавателя' });
    }
    const lessonId = Number(req.params.lessonId);
    const submissionId = Number(req.params.submissionId);
    const { approved } = req.body;
    if (Number.isNaN(lessonId) || Number.isNaN(submissionId)) {
      return res.status(400).json({ error: 'Неверные идентификаторы' });
    }
    try {
      const scheduleRes = await db.query(
        'SELECT course_id, instructor_id FROM schedule WHERE id = $1',
        [lessonId]
      );
      if (scheduleRes.rowCount === 0) {
        return res.status(404).json({ error: 'Занятие не найдено' });
      }
      const { course_id: courseId, instructor_id: instructorId } =
        scheduleRes.rows[0];

      if (
        currentUser.role === 'teacher' &&
        instructorId !== currentUser.id
      ) {
        return res
          .status(403)
          .json({ error: 'Вы не являетесь преподавателем этого занятия' });
      }

      const updRes = await db.query(
        `UPDATE lesson_submissions
         SET is_approved = $1,
             updated_at  = NOW()
         WHERE id = $2
           AND schedule_id = $3
         RETURNING enrollment_id AS "enrollmentId"`,
        [Boolean(approved), submissionId, lessonId]
      );
      if (updRes.rowCount === 0) {
        return res.status(404).json({ error: 'Ответ не найден' });
      }
      const enrollmentId = updRes.rows[0].enrollmentId;

      const enrRes = await db.query(
        'SELECT user_id FROM enrollments WHERE id = $1',
        [enrollmentId]
      );
      if (enrRes.rowCount === 0) {
        return res.status(404).json({ error: 'Запись на курс не найдена' });
      }
      const userId = enrRes.rows[0].user_id;

      const totalRes = await db.query(
        'SELECT COUNT(*)::int AS total FROM schedule WHERE course_id = $1',
        [courseId]
      );
      const completedRes = await db.query(
        `SELECT COUNT(DISTINCT ls.schedule_id)::int AS completed
         FROM lesson_submissions ls
         JOIN enrollments e ON e.id = ls.enrollment_id
         JOIN schedule s    ON s.id = ls.schedule_id
         WHERE e.user_id = $1
           AND e.course_id = $2
           AND ls.is_approved = TRUE`,
        [userId, courseId]
      );
      const total = totalRes.rows[0].total;
      const completed = completedRes.rows[0].completed;
      const progress =
        total > 0 ? Math.round((completed * 100) / total) : 0;

      await db.query(
        `UPDATE enrollments
         SET progress = $1
         WHERE user_id = $2 AND course_id = $3`,
        [progress, userId, courseId]
      );

      return res.status(200).json({
        message: 'Ответ обновлен',
        progress,
      });
    } catch (e) {
      console.error('Teacher review submission error', e);
      return res.status(500).json({ error: 'Ошибка сервера' });
    }
  }
);

app.post('/api/admin/processes', requireAdmin, async (req, res) => {
  const { courseId, title, description, order, deadline } = req.body;
  if (!courseId || !title || !description || !order) {
    return res.status(400).json({ error: 'Не заполнены обязательные поля' });
  }
  try {
    const insertRes = await db.query(
      `INSERT INTO educational_processes (course_id, title, description, "order", materials, deadline, active)
       VALUES ($1, $2, $3, $4, $5, $6, TRUE)
       RETURNING id,
                 course_id   AS "courseId",
                 title,
                 description,
                 "order",
                 materials,
                 deadline,
                 active,
                 created_at  AS "createdAt"`,
      [Number(courseId), title, description, Number(order), [], deadline || null]
    );
    return res
      .status(201)
      .json({ message: 'Модуль создан', process: insertRes.rows[0] });
  } catch (e) {
    console.error('Admin create process error', e);
    return res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.put('/api/admin/processes/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'Неверный ID модуля' });
  }
  const { courseId, title, description, order, deadline } = req.body;
  try {
    const exists = await db.query(
      'SELECT id FROM educational_processes WHERE id = $1',
      [id]
    );
    if (exists.rowCount === 0) {
      return res.status(404).json({ error: 'Модуль не найден' });
    }
    await db.query(
      `UPDATE educational_processes
       SET course_id   = $1,
           title       = $2,
           description = $3,
           "order"     = $4,
           deadline    = $5
       WHERE id = $6`,
      [Number(courseId), title, description, Number(order), deadline || null, id]
    );
    const result = await db.query(
      `SELECT id,
              course_id   AS "courseId",
              title,
              description,
              "order",
              materials,
              deadline,
              active,
              created_at  AS "createdAt"
       FROM educational_processes
       WHERE id = $1`,
      [id]
    );
    return res
      .status(200)
      .json({ message: 'Модуль обновлен', process: result.rows[0] });
  } catch (e) {
    console.error('Admin update process error', e);
    return res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.delete('/api/admin/processes/:id', requireAdmin, async (req, res) => {
  const id = Number(req.params.id);
  if (Number.isNaN(id)) {
    return res.status(400).json({ error: 'Неверный ID модуля' });
  }
  try {
    const result = await db.query(
      'DELETE FROM educational_processes WHERE id = $1',
      [id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Модуль не найден' });
    }
    return res.status(200).json({ message: 'Модуль удален' });
  } catch (e) {
    console.error('Admin delete process error', e);
    return res.status(500).json({ error: 'Ошибка сервера' });
  }
});

app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'API endpoint не найден' });
});

app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ error: 'API endpoint не найден' });
  }
  res.sendFile(path.join(frontendDistPath, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`PERN backend server running on http://localhost:${PORT}`);
  console.log(`Make sure to build the frontend first: cd frontend && npm run build`);
});

