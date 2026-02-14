import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, User } from '../auth/AuthContext';

type Enrollment = {
  id: number;
  userId: number;
  courseId: number;
  status: string;
  enrolledAt: string;
  progress: number;
  course?: {
    id: number;
    title: string;
    description: string;
  };
};

type MyScheduleItem = {
  id: number;
  courseId: number;
  instructorId: number;
  title: string | null;
  content: string | null;
  dayOfWeek: string;
  time: string;
  room: string;
  type: string;
  active: boolean;
  createdAt: string;
  courseTitle: string;
  instructorName: string;
  enrollmentId: number;
  submissionId: number | null;
  answer: string | null;
  isApproved: boolean | null;
};

type TeacherScheduleItem = {
  id: number;
  courseId: number;
  instructorId: number;
  title: string | null;
  content: string | null;
  dayOfWeek: string;
  time: string;
  room: string;
  type: string;
  active: boolean;
  createdAt: string;
  courseTitle: string;
  instructorName?: string;
};

type StudentSubmission = {
  id: number;
  enrollmentId: number;
  scheduleId: number;
  answer: string;
  isApproved: boolean | null;
  createdAt: string;
  updatedAt: string;
  studentName: string;
  studentEmail: string;
};

type Course = {
  id: number;
  title: string;
  description: string;
  duration: string;
  instructor: string;
  price: number;
  category: string;
};

export const DashboardPage: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(true);
  const [schedule, setSchedule] = useState<MyScheduleItem[]>([]);
  const [teacherSchedule, setTeacherSchedule] = useState<TeacherScheduleItem[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [coursesLoading, setCoursesLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'enrollments' | 'history' | 'schedule'>(
    'enrollments'
  );
  const [answerDrafts, setAnswerDrafts] = useState<Record<number, string>>({});
  const [showAddLessonForm, setShowAddLessonForm] = useState(false);
  const [newLesson, setNewLesson] = useState({
    courseId: '',
    title: '',
    content: '',
    dayOfWeek: '',
    time: '',
    room: '',
    type: 'lecture',
  });
  const [submissions, setSubmissions] = useState<Record<number, StudentSubmission[]>>({});
  const [submissionsLoading, setSubmissionsLoading] = useState<Record<number, boolean>>({});
  const [expandedLessons, setExpandedLessons] = useState<Set<number>>(new Set());
  const [showEditProfile, setShowEditProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({
    username: '',
    fullName: '',
    password: '',
  });

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [loading, user, navigate]);

  useEffect(() => {
    const loadEnrollments = async () => {
      try {
        setEnrollmentsLoading(true);
        const res = await fetch('/api/my-enrollments');
        if (!res.ok) {
          throw new Error('Ошибка загрузки записей');
        }
        const data: Enrollment[] = await res.json();
        setEnrollments(data);
      } catch (e) {
        console.error(e);
      } finally {
        setEnrollmentsLoading(false);
      }
    };
    if (user) {
      void loadEnrollments();
    }
  }, [user]);

  useEffect(() => {
    const loadSchedule = async () => {
      try {
        setScheduleLoading(true);
        if (user?.role === 'student') {
          const res = await fetch('/api/my-schedule');
          if (!res.ok) {
            throw new Error('Ошибка загрузки расписания');
          }
          const data: MyScheduleItem[] = await res.json();
          setSchedule(data);
        } else if (user?.role === 'teacher' || user?.role === 'admin') {
          const res = await fetch('/api/teacher/schedule', {
            credentials: 'include',
          });
          if (!res.ok) {
            throw new Error('Ошибка загрузки расписания');
          }
          const data: TeacherScheduleItem[] = await res.json();
          setTeacherSchedule(data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setScheduleLoading(false);
      }
    };
    if (user) {
      void loadSchedule();
    }
  }, [user]);

  useEffect(() => {
    const loadCourses = async () => {
      if (user && (user.role === 'teacher' || user.role === 'admin')) {
        try {
          setCoursesLoading(true);
          const res = await fetch('/api/courses', {
            credentials: 'include',
          });
          if (res.ok) {
            const data: Course[] = await res.json();
            // Фильтруем курсы, где текущий пользователь является преподавателем (для учителей)
            if (user.role === 'teacher') {
              const filtered = data.filter(
                (c) => c.instructor === user.fullName || user.role === 'admin'
              );
              setCourses(filtered);
            } else {
              setCourses(data);
            }
          }
        } catch (e) {
          console.error(e);
        } finally {
          setCoursesLoading(false);
        }
      }
    };
    if (user && showAddLessonForm) {
      void loadCourses();
    }
  }, [user, showAddLessonForm]);

  useEffect(() => {
    if (user) {
      setProfileForm({
        username: user.username || '',
        fullName: user.fullName || '',
        password: '',
      });
    }
  }, [user]);

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data: { username: string; fullName: string; password?: string } = {
        username: profileForm.username,
        fullName: profileForm.fullName,
      };
      
      if (profileForm.password && profileForm.password.trim() !== '') {
        data.password = profileForm.password;
      }
      
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      
      const result = await res.json();
      if (!res.ok) {
        // eslint-disable-next-line no-alert
        alert(result.error || 'Ошибка обновления профиля');
        return;
      }
      
      // eslint-disable-next-line no-alert
      alert('Профиль успешно обновлен');
      setShowEditProfile(false);
      setProfileForm({ ...profileForm, password: '' });
      // Обновляем данные пользователя
      await refresh();
    } catch (e) {
      console.error(e);
      // eslint-disable-next-line no-alert
      alert('Ошибка соединения с сервером');
    }
  };

  const renderProfile = (u: User) => (
    <div id="user-profile" className="profile-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3>Профиль пользователя</h3>
        <button
          className="btn btn-primary"
          onClick={() => setShowEditProfile(!showEditProfile)}
        >
          {showEditProfile ? 'Отменить' : 'Редактировать'}
        </button>
      </div>
      
      {showEditProfile ? (
        <form onSubmit={handleProfileUpdate}>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label>Имя пользователя: *</label>
            <input
              type="text"
              value={profileForm.username}
              onChange={(e) => setProfileForm({ ...profileForm, username: e.target.value })}
              required
              style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
            />
          </div>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label>Полное имя: *</label>
            <input
              type="text"
              value={profileForm.fullName}
              onChange={(e) => setProfileForm({ ...profileForm, fullName: e.target.value })}
              required
              style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
            />
          </div>
          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label>Новый пароль (оставьте пустым, чтобы не менять):</label>
            <input
              type="password"
              value={profileForm.password}
              onChange={(e) => setProfileForm({ ...profileForm, password: e.target.value })}
              placeholder="Введите новый пароль"
              style={{ width: '100%', padding: '0.5rem', borderRadius: '4px', border: '1px solid #ddd' }}
            />
          </div>
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="submit" className="btn btn-success">
              Сохранить
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => {
                setShowEditProfile(false);
                if (user) {
                  setProfileForm({
                    username: user.username || '',
                    fullName: user.fullName || '',
                    password: '',
                  });
                }
              }}
            >
              Отмена
            </button>
          </div>
        </form>
      ) : (
        <div id="profile-info">
          <p>
            <strong>Имя пользователя:</strong> {u.username}
          </p>
          <p>
            <strong>Email:</strong> {u.email}
          </p>
          <p>
            <strong>Полное имя:</strong> {u.fullName || 'Не указано'}
          </p>
          <p>
            <strong>Роль:</strong>{' '}
            {u.role === 'admin'
              ? 'Администратор'
              : u.role === 'teacher'
              ? 'Преподаватель'
              : 'Студент'}
          </p>
        </div>
      )}
    </div>
  );

  const renderEnrollments = () => {
    if (enrollmentsLoading) {
      return <div id="enrollments-loading" className="loading">Загрузка...</div>;
    }
    if (enrollments.length === 0) {
      return (
        <div id="enrollments-empty" className="empty-message">
          <p>
            У вас пока нет записей на курсы.{' '}
            <a href="/courses">Посмотреть доступные курсы</a>
          </p>
        </div>
      );
    }
    return (
      <div id="enrollments-list" className="enrollments-list">
        {enrollments.map((e) => {
          const statusText =
            e.status === 'active'
              ? 'Активен'
              : e.status === 'completed'
              ? 'Завершен'
              : e.status;
          const statusClass =
            e.status === 'active'
              ? 'active'
              : e.status === 'completed'
              ? 'completed'
              : '';
          return (
            <div key={e.id} className="enrollment-item">
              <h4>{e.course ? e.course.title : 'Курс не найден'}</h4>
              {e.course && <p>{e.course.description}</p>}
              <p>
                <strong>Статус:</strong>{' '}
                <span className={`enrollment-status ${statusClass}`}>
                  {statusText}
                </span>
              </p>
              <p>
                <strong>Дата записи:</strong>{' '}
                {new Date(e.enrolledAt).toLocaleDateString('ru-RU')}
              </p>
              <p>
                <strong>Прогресс:</strong> {e.progress}%
              </p>
              <div className="progress-bar">
                <div
                  className="progress-fill"
                  style={{ width: `${e.progress}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  const sendAnswer = async (lessonId: number, enrollmentId: number) => {
    const text = answerDrafts[lessonId];
    if (!text) {
      // eslint-disable-next-line no-alert
      alert('Ответ не может быть пустым');
      return;
    }
    try {
      const res = await fetch(`/api/lessons/${lessonId}/answer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer: text }),
      });
      const data = await res.json();
      if (!res.ok) {
        // eslint-disable-next-line no-alert
        alert(data.error || 'Ошибка отправки ответа');
        return;
      }
      // eslint-disable-next-line no-alert
      alert('Ответ отправлен на проверку');
      // Обновляем расписание
      const resSchedule = await fetch('/api/my-schedule');
      if (resSchedule.ok) {
        const scheduleData: MyScheduleItem[] = await resSchedule.json();
        setSchedule(scheduleData);
      }
    } catch (e) {
      console.error(e);
      // eslint-disable-next-line no-alert
      alert('Ошибка соединения с сервером');
    }
  };

  const loadSubmissions = async (lessonId: number) => {
    try {
      setSubmissionsLoading((prev) => ({ ...prev, [lessonId]: true }));
      const res = await fetch(`/api/teacher/lessons/${lessonId}/submissions`, {
        credentials: 'include',
      });
      if (!res.ok) {
        throw new Error('Ошибка загрузки ответов');
      }
      const data: StudentSubmission[] = await res.json();
      setSubmissions((prev) => ({ ...prev, [lessonId]: data }));
    } catch (e) {
      console.error(e);
    } finally {
      setSubmissionsLoading((prev) => ({ ...prev, [lessonId]: false }));
    }
  };

  const toggleLessonSubmissions = (lessonId: number) => {
    const newExpanded = new Set(expandedLessons);
    if (newExpanded.has(lessonId)) {
      newExpanded.delete(lessonId);
    } else {
      newExpanded.add(lessonId);
      if (!submissions[lessonId]) {
        void loadSubmissions(lessonId);
      }
    }
    setExpandedLessons(newExpanded);
  };

  const reviewSubmission = async (
    lessonId: number,
    submissionId: number,
    approved: boolean
  ) => {
    try {
      const res = await fetch(
        `/api/teacher/lessons/${lessonId}/submissions/${submissionId}/review`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({ approved }),
        }
      );
      const data = await res.json();
      if (!res.ok) {
        // eslint-disable-next-line no-alert
        alert(data.error || 'Ошибка проверки ответа');
        return;
      }
      // eslint-disable-next-line no-alert
      alert(approved ? 'Ответ одобрен' : 'Ответ отклонен');
      // Обновляем список ответов
      void loadSubmissions(lessonId);
    } catch (e) {
      console.error(e);
      // eslint-disable-next-line no-alert
      alert('Ошибка соединения с сервером');
    }
  };

  const handleAddLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !newLesson.courseId ||
      !newLesson.title ||
      !newLesson.dayOfWeek ||
      !newLesson.time ||
      !newLesson.room ||
      !newLesson.type
    ) {
      // eslint-disable-next-line no-alert
      alert('Заполните все обязательные поля');
      return;
    }
    try {
      const res = await fetch('/api/teacher/schedule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          courseId: Number(newLesson.courseId),
          title: newLesson.title,
          content: newLesson.content || '',
          dayOfWeek: newLesson.dayOfWeek,
          time: newLesson.time,
          room: newLesson.room,
          type: newLesson.type,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        // eslint-disable-next-line no-alert
        alert(data.error || 'Ошибка создания занятия');
        return;
      }
      // eslint-disable-next-line no-alert
      alert('Занятие успешно добавлено');
      setShowAddLessonForm(false);
      setNewLesson({
        courseId: '',
        title: '',
        content: '',
        dayOfWeek: '',
        time: '',
        room: '',
        type: 'lecture',
      });
      // Обновляем расписание
      const resSchedule = await fetch('/api/teacher/schedule', {
        credentials: 'include',
      });
      if (resSchedule.ok) {
        const scheduleData: TeacherScheduleItem[] = await resSchedule.json();
        setTeacherSchedule(scheduleData);
      }
    } catch (e) {
      console.error(e);
      // eslint-disable-next-line no-alert
      alert('Ошибка соединения с сервером');
    }
  };

  const renderSchedule = () => {
    if (user?.role === 'student') {
      if (scheduleLoading) {
        return <div className="loading">Загрузка расписания...</div>;
      }
      if (schedule.length === 0) {
        return (
          <div className="empty-message">
            <p>Для ваших курсов пока нет занятий в расписании.</p>
          </div>
        );
      }
      return (
        <div className="enrollments-list">
          {schedule.map((item) => {
            const approved = item.isApproved === true;
            const hasAnswer = item.answer && item.answer.length > 0;
            return (
              <div key={item.id} className="enrollment-item">
                <h4>
                  {item.courseTitle} — {item.title || item.type}
                </h4>
                <p>
                  <strong>День:</strong> {item.dayOfWeek}; <strong>Время:</strong>{' '}
                  {item.time}; <strong>Аудитория:</strong> {item.room}
                </p>
                {item.content && (
                  <div>
                    <strong>Материалы:</strong>
                    <div
                      dangerouslySetInnerHTML={{ __html: item.content }}
                      style={{
                        marginTop: '8px',
                        padding: '10px',
                        backgroundColor: '#f5f5f5',
                        borderRadius: '4px',
                      }}
                    />
                  </div>
                )}
                <p>
                  <strong>Преподаватель:</strong> {item.instructorName}
                </p>
                {approved ? (
                  <p>
                    <strong>Статус урока:</strong>{' '}
                    <span className="enrollment-status completed">Пройден</span>
                  </p>
                ) : (
                  <>
                    <p>
                      <strong>Статус урока:</strong>{' '}
                      {item.isApproved === false ? (
                        <span
                          className="enrollment-status"
                          style={{
                            backgroundColor: '#e74c3c',
                            color: 'white',
                            padding: '4px 8px',
                            borderRadius: '4px',
                          }}
                        >
                          Ответ отклонен - необходимо изменить ответ
                        </span>
                      ) : hasAnswer ? (
                        <span className="enrollment-status active">
                          Ожидает проверки
                        </span>
                      ) : (
                        <span className="enrollment-status active">
                          Ожидает выполнения
                        </span>
                      )}
                    </p>
                    <div className="form-group">
                      <label>Ваш ответ по этому занятию</label>
                      <textarea
                        rows={4}
                        value={answerDrafts[item.id] ?? item.answer ?? ''}
                        onChange={(e) =>
                          setAnswerDrafts((prev) => ({
                            ...prev,
                            [item.id]: e.target.value,
                          }))
                        }
                        placeholder={
                          item.isApproved === false
                            ? 'Ваш ответ был отклонен. Пожалуйста, исправьте ответ и отправьте снова.'
                            : 'Введите ваш ответ по этому занятию'
                        }
                      />
                    </div>
                    <button
                      className="btn btn-primary"
                      onClick={() => sendAnswer(item.id, item.enrollmentId)}
                    >
                      {hasAnswer
                        ? item.isApproved === false
                          ? 'Исправить и отправить снова'
                          : 'Обновить ответ'
                        : 'Отправить ответ'}
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      );
    } else if (user?.role === 'teacher' || user?.role === 'admin') {
      if (scheduleLoading) {
        return <div className="loading">Загрузка расписания...</div>;
      }
      return (
        <div>
          <div style={{ marginBottom: '20px' }}>
            <button
              className="btn btn-primary"
              onClick={() => setShowAddLessonForm(!showAddLessonForm)}
            >
              {showAddLessonForm ? 'Отменить' : '+ Добавить занятие'}
            </button>
          </div>

          {showAddLessonForm && (
            <form onSubmit={handleAddLesson} className="form-card" style={{ marginBottom: '30px' }}>
              <h3>Добавить новое занятие</h3>
              <div className="form-group">
                <label>
                  Курс <span style={{ color: 'red' }}>*</span>
                </label>
                {coursesLoading ? (
                  <div>Загрузка курсов...</div>
                ) : (
                  <select
                    value={newLesson.courseId}
                    onChange={(e) =>
                      setNewLesson({ ...newLesson, courseId: e.target.value })
                    }
                    required
                  >
                    <option value="">Выберите курс</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div className="form-group">
                <label>
                  Тема занятия <span style={{ color: 'red' }}>*</span>
                </label>
                <input
                  type="text"
                  value={newLesson.title}
                  onChange={(e) =>
                    setNewLesson({ ...newLesson, title: e.target.value })
                  }
                  required
                  placeholder="Например: Введение в JavaScript"
                />
              </div>
              <div className="form-group">
                <label>Содержание лекции (текст, ссылки, изображения)</label>
                <textarea
                  rows={8}
                  value={newLesson.content}
                  onChange={(e) =>
                    setNewLesson({ ...newLesson, content: e.target.value })
                  }
                  placeholder="Вы можете вставить текст, ссылки (например: https://example.com) и изображения (например: ![Описание](https://example.com/image.jpg) или HTML теги)"
                />
                <small style={{ color: '#666', fontSize: '12px' }}>
                  Поддерживаются Markdown и HTML. Для ссылок используйте формат: [Текст](URL).
                  Для изображений: ![Описание](URL) или HTML тег &lt;img src="URL" alt="Описание"&gt;
                </small>
              </div>
              <div className="form-group">
                <label>
                  День недели <span style={{ color: 'red' }}>*</span>
                </label>
                <select
                  value={newLesson.dayOfWeek}
                  onChange={(e) =>
                    setNewLesson({ ...newLesson, dayOfWeek: e.target.value })
                  }
                  required
                >
                  <option value="">Выберите день</option>
                  <option value="Понедельник">Понедельник</option>
                  <option value="Вторник">Вторник</option>
                  <option value="Среда">Среда</option>
                  <option value="Четверг">Четверг</option>
                  <option value="Пятница">Пятница</option>
                  <option value="Суббота">Суббота</option>
                  <option value="Воскресенье">Воскресенье</option>
                </select>
              </div>
              <div className="form-group">
                <label>
                  Время <span style={{ color: 'red' }}>*</span>
                </label>
                <input
                  type="time"
                  value={newLesson.time}
                  onChange={(e) =>
                    setNewLesson({ ...newLesson, time: e.target.value })
                  }
                  required
                />
              </div>
              <div className="form-group">
                <label>
                  Аудитория <span style={{ color: 'red' }}>*</span>
                </label>
                <input
                  type="text"
                  value={newLesson.room}
                  onChange={(e) =>
                    setNewLesson({ ...newLesson, room: e.target.value })
                  }
                  required
                  placeholder="Например: 101, А-205"
                />
              </div>
              <div className="form-group">
                <label>
                  Тип занятия <span style={{ color: 'red' }}>*</span>
                </label>
                <select
                  value={newLesson.type}
                  onChange={(e) =>
                    setNewLesson({ ...newLesson, type: e.target.value })
                  }
                  required
                >
                  <option value="lecture">Лекция</option>
                  <option value="seminar">Семинар</option>
                  <option value="practice">Практика</option>
                  <option value="lab">Лабораторная работа</option>
                </select>
              </div>
              <button type="submit" className="btn btn-success">
                Создать занятие
              </button>
            </form>
          )}

          {teacherSchedule.length === 0 ? (
            <div className="empty-message">
              <p>У вас пока нет занятий в расписании.</p>
            </div>
          ) : (
            <div className="enrollments-list">
              {teacherSchedule.map((item) => {
                const isExpanded = expandedLessons.has(item.id);
                const lessonSubmissions = submissions[item.id] || [];
                const isLoading = submissionsLoading[item.id] || false;
                return (
                  <div key={item.id} className="enrollment-item">
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <h4>
                        {item.courseTitle} — {item.title || item.type}
                        {user?.role === 'admin' && item.instructorName && (
                          <span style={{ fontSize: '14px', fontWeight: 'normal', color: '#666' }}>
                            {' '}
                            (Преподаватель: {item.instructorName})
                          </span>
                        )}
                      </h4>
                      <button
                        className="btn btn-secondary"
                        onClick={() => toggleLessonSubmissions(item.id)}
                        style={{ marginLeft: '10px' }}
                      >
                        {isExpanded ? 'Скрыть ответы' : 'Просмотреть ответы'}
                      </button>
                    </div>
                    <p>
                      <strong>День:</strong> {item.dayOfWeek}; <strong>Время:</strong>{' '}
                      {item.time}; <strong>Аудитория:</strong> {item.room}
                    </p>
                    {item.content && (
                      <div>
                        <strong>Материалы:</strong>
                        <div
                          dangerouslySetInnerHTML={{ __html: item.content }}
                          style={{
                            marginTop: '8px',
                            padding: '10px',
                            backgroundColor: '#f5f5f5',
                            borderRadius: '4px',
                          }}
                        />
                      </div>
                    )}
                    <p>
                      <strong>Тип:</strong> {item.type}
                    </p>
                    <p>
                      <strong>Создано:</strong>{' '}
                      {new Date(item.createdAt).toLocaleDateString('ru-RU')}
                    </p>

                    {isExpanded && (
                      <div
                        style={{
                          marginTop: '20px',
                          padding: '15px',
                          backgroundColor: '#f9f9f9',
                          borderRadius: '8px',
                          border: '1px solid #ddd',
                        }}
                      >
                        <h5 style={{ marginTop: 0, marginBottom: '15px' }}>
                          Ответы студентов ({lessonSubmissions.length})
                        </h5>
                        {isLoading ? (
                          <div className="loading">Загрузка ответов...</div>
                        ) : lessonSubmissions.length === 0 ? (
                          <p className="empty-message">
                            Пока нет ответов от студентов по этому занятию.
                          </p>
                        ) : (
                          <div>
                            {lessonSubmissions.map((submission) => (
                              <div
                                key={submission.id}
                                style={{
                                  marginBottom: '15px',
                                  padding: '15px',
                                  backgroundColor: '#fff',
                                  borderRadius: '6px',
                                  border: '1px solid #e0e0e0',
                                }}
                              >
                                <div
                                  style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'flex-start',
                                    marginBottom: '10px',
                                  }}
                                >
                                  <div>
                                    <strong>{submission.studentName}</strong>
                                    <br />
                                    <small style={{ color: '#666' }}>
                                      {submission.studentEmail}
                                    </small>
                                  </div>
                                  <div>
                                    {submission.isApproved === true ? (
                                      <span
                                        className="enrollment-status completed"
                                        style={{ marginRight: '10px' }}
                                      >
                                        Одобрено
                                      </span>
                                    ) : submission.isApproved === false ? (
                                      <span
                                        className="enrollment-status"
                                        style={{
                                          marginRight: '10px',
                                          backgroundColor: '#e74c3c',
                                          color: 'white',
                                        }}
                                      >
                                        Отклонено
                                      </span>
                                    ) : (
                                      <span
                                        className="enrollment-status active"
                                        style={{ marginRight: '10px' }}
                                      >
                                        Ожидает проверки
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div
                                  style={{
                                    padding: '10px',
                                    backgroundColor: '#f5f5f5',
                                    borderRadius: '4px',
                                    marginBottom: '10px',
                                    whiteSpace: 'pre-wrap',
                                  }}
                                >
                                  {submission.answer}
                                </div>
                                <div style={{ display: 'flex', gap: '10px' }}>
                                  {submission.isApproved !== true && (
                                    <button
                                      className="btn btn-success"
                                      onClick={() =>
                                        reviewSubmission(item.id, submission.id, true)
                                      }
                                    >
                                      Одобрить
                                    </button>
                                  )}
                                  {submission.isApproved !== false && (
                                    <button
                                      className="btn btn-danger"
                                      onClick={() =>
                                        reviewSubmission(item.id, submission.id, false)
                                      }
                                    >
                                      Отклонить
                                    </button>
                                  )}
                                </div>
                                <small style={{ color: '#999', display: 'block', marginTop: '8px' }}>
                                  Отправлено:{' '}
                                  {new Date(submission.createdAt).toLocaleString('ru-RU')}
                                  {submission.updatedAt !== submission.createdAt && (
                                    <>
                                      <br />
                                      Обновлено:{' '}
                                      {new Date(submission.updatedAt).toLocaleString('ru-RU')}
                                    </>
                                  )}
                                </small>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      );
    }
    return (
      <p className="empty-message">
        Расписание в этом разделе доступно только для студентов и преподавателей.
      </p>
    );
  };

  if (!user) {
    return null;
  }

  return (
    <section className="dashboard-section">
      <div className="container">
        <h2>Личный кабинет</h2>
        {renderProfile(user)}

        <div className="dashboard-tabs">
          <button
            className={`tab-btn ${activeTab === 'enrollments' ? 'active' : ''}`}
            data-tab="enrollments"
            onClick={() => setActiveTab('enrollments')}
          >
            Мои курсы
          </button>
          <button
            className={`tab-btn ${activeTab === 'schedule' ? 'active' : ''}`}
            data-tab="schedule"
            onClick={() => setActiveTab('schedule')}
          >
            Расписание
          </button>
          <button
            className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            data-tab="history"
            onClick={() => setActiveTab('history')}
          >
            История
          </button>
        </div>

        <div
          id="enrollments-tab"
          className={`tab-content ${activeTab === 'enrollments' ? 'active' : ''}`}
        >
          <h3>Мои записи на курсы</h3>
          {renderEnrollments()}
        </div>

        <div
          id="schedule-tab"
          className={`tab-content ${activeTab === 'schedule' ? 'active' : ''}`}
        >
          <h3>Расписание занятий</h3>
          {renderSchedule()}
        </div>

        <div
          id="history-tab"
          className={`tab-content ${activeTab === 'history' ? 'active' : ''}`}
        >
          <h3>История просмотров</h3>
          <div id="history-list" className="history-list">
            <p>История просмотров курсов будет отображаться здесь.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

