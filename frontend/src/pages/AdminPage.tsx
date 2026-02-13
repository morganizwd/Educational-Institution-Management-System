import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';
import { useNavigate } from 'react-router-dom';

type UserRow = {
  id: number;
  username: string;
  email: string;
  fullName: string;
  role: string;
  createdAt: string;
};

type Course = {
  id: number;
  title: string;
  description: string;
  duration: string;
  instructor: string;
  price: number;
  category: string;
  available: boolean;
  createdAt: string;
};

type Schedule = {
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
};

type Process = {
  id: number;
  courseId: number;
  title: string;
  description: string;
  order: number;
  materials: string[];
  deadline: string | null;
  active: boolean;
  createdAt: string;
  courseTitle: string;
};

type Feedback = {
  id: number;
  userId: number | null;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
  status: string;
};

export const AdminPage: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string>('users');
  
  // Users state
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [userRoleFilter, setUserRoleFilter] = useState<string>('');
  const [showUserForm, setShowUserForm] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  
  // Schedule state
  const [schedule, setSchedule] = useState<Schedule[]>([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);
  const [showScheduleForm, setShowScheduleForm] = useState(false);
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [teachers, setTeachers] = useState<UserRow[]>([]);
  
  // Processes state
  const [processes, setProcesses] = useState<Process[]>([]);
  const [loadingProcesses, setLoadingProcesses] = useState(false);
  const [showProcessForm, setShowProcessForm] = useState(false);
  const [editingProcess, setEditingProcess] = useState<Process | null>(null);
  
  // Courses state
  const [allCourses, setAllCourses] = useState<Course[]>([]);
  const [loadingCourses, setLoadingCourses] = useState(false);
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  
  // Feedback state
  const [feedback, setFeedback] = useState<Feedback[]>([]);
  const [loadingFeedback, setLoadingFeedback] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
      return;
    }
    if (!loading && user && user.role !== 'admin') {
      navigate('/');
    }
  }, [loading, user, navigate]);

  // Load users
  const loadUsers = async () => {
    try {
      setLoadingUsers(true);
      const url = userRoleFilter 
        ? `/api/admin/users?role=${userRoleFilter}`
        : '/api/admin/users';
      const res = await fetch(url);
      if (!res.ok) throw new Error();
      const data: UserRow[] = await res.json();
      setUsers(data);
    } catch {
      alert('Ошибка загрузки пользователей');
    } finally {
      setLoadingUsers(false);
    }
  };

  // Handle user form submit
  const handleUserSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      username: formData.get('username') as string,
      email: formData.get('email') as string,
      fullName: formData.get('fullName') as string,
      role: formData.get('role') as string,
      password: formData.get('password') as string || undefined,
    };

    try {
      const url = editingUser 
        ? `/api/admin/users/${editingUser.id}`
        : '/api/admin/users';
      const method = editingUser ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Ошибка сохранения');
      }

      alert(editingUser ? 'Пользователь обновлен' : 'Пользователь создан');
      setShowUserForm(false);
      setEditingUser(null);
      void loadUsers();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка сохранения пользователя');
    }
  };

  // Delete user
  const handleDeleteUser = async (id: number) => {
    if (!confirm('Удалить этого пользователя? Это действие нельзя отменить.')) return;
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      alert('Пользователь удален');
      void loadUsers();
    } catch {
      alert('Ошибка удаления пользователя');
    }
  };

  // Load schedule
  const loadSchedule = async () => {
    try {
      setLoadingSchedule(true);
      const res = await fetch('/api/admin/schedule');
      if (!res.ok) throw new Error();
      const data: Schedule[] = await res.json();
      setSchedule(data);
    } catch {
      alert('Ошибка загрузки расписания');
    } finally {
      setLoadingSchedule(false);
    }
  };

  // Load processes
  const loadProcesses = async () => {
    try {
      setLoadingProcesses(true);
      const res = await fetch('/api/admin/processes');
      if (!res.ok) throw new Error();
      const data: Process[] = await res.json();
      setProcesses(data);
    } catch {
      alert('Ошибка загрузки учебных процессов');
    } finally {
      setLoadingProcesses(false);
    }
  };

  // Load courses
  const loadCourses = async () => {
    try {
      setLoadingCourses(true);
      const res = await fetch('/api/courses');
      if (!res.ok) throw new Error();
      const data: Course[] = await res.json();
      setAllCourses(data);
    } catch {
      alert('Ошибка загрузки курсов');
    } finally {
      setLoadingCourses(false);
    }
  };

  // Load feedback
  const loadFeedback = async () => {
    try {
      setLoadingFeedback(true);
      const res = await fetch('/api/admin/feedback');
      if (!res.ok) throw new Error();
      const data: Feedback[] = await res.json();
      setFeedback(data);
    } catch {
      alert('Ошибка загрузки обратной связи');
    } finally {
      setLoadingFeedback(false);
    }
  };

  // Load teachers for schedule form
  const loadTeachers = async () => {
    try {
      const res = await fetch('/api/admin/users?role=teacher');
      if (!res.ok) throw new Error();
      const data: UserRow[] = await res.json();
      setTeachers(data);
    } catch {
      alert('Ошибка загрузки преподавателей');
    }
  };

  // Load data when tab changes
  useEffect(() => {
    if (user?.role === 'admin') {
      if (activeTab === 'users') {
        void loadUsers();
      } else if (activeTab === 'schedule') {
        void loadSchedule();
        void loadCourses();
        void loadTeachers();
      } else if (activeTab === 'processes') {
        void loadProcesses();
        void loadCourses();
      } else if (activeTab === 'courses') {
        void loadCourses();
      } else if (activeTab === 'feedback') {
        void loadFeedback();
      }
    }
  }, [activeTab, user]);

  // Handle schedule form submit
  const handleScheduleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      courseId: Number(formData.get('courseId')),
      instructorId: Number(formData.get('instructorId')),
      title: formData.get('title') as string,
      content: formData.get('content') as string,
      dayOfWeek: formData.get('dayOfWeek') as string,
      time: formData.get('time') as string,
      room: formData.get('room') as string,
      type: formData.get('type') as string,
    };

    try {
      const url = editingSchedule 
        ? `/api/admin/schedule/${editingSchedule.id}`
        : '/api/admin/schedule';
      const method = editingSchedule ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Ошибка сохранения');
      }

      alert(editingSchedule ? 'Занятие обновлено' : 'Занятие создано');
      setShowScheduleForm(false);
      setEditingSchedule(null);
      void loadSchedule();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка сохранения занятия');
    }
  };

  // Handle process form submit
  const handleProcessSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      courseId: Number(formData.get('courseId')),
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      order: Number(formData.get('order')),
      deadline: formData.get('deadline') as string || null,
    };

    try {
      const url = editingProcess 
        ? `/api/admin/processes/${editingProcess.id}`
        : '/api/admin/processes';
      const method = editingProcess ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Ошибка сохранения');
      }

      alert(editingProcess ? 'Модуль обновлен' : 'Модуль создан');
      setShowProcessForm(false);
      setEditingProcess(null);
      void loadProcesses();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка сохранения модуля');
    }
  };

  // Delete schedule
  const handleDeleteSchedule = async (id: number) => {
    if (!confirm('Удалить это занятие?')) return;
    try {
      const res = await fetch(`/api/admin/schedule/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      alert('Занятие удалено');
      void loadSchedule();
    } catch {
      alert('Ошибка удаления занятия');
    }
  };

  // Delete process
  const handleDeleteProcess = async (id: number) => {
    if (!confirm('Удалить этот модуль?')) return;
    try {
      const res = await fetch(`/api/admin/processes/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      alert('Модуль удален');
      void loadProcesses();
    } catch {
      alert('Ошибка удаления модуля');
    }
  };

  // Handle course form submit
  const handleCourseSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      title: formData.get('title') as string,
      description: formData.get('description') as string,
      duration: formData.get('duration') as string,
      instructor: formData.get('instructor') as string,
      price: Number(formData.get('price')),
      category: formData.get('category') as string,
      available: formData.get('available') === 'true',
    };

    try {
      const url = editingCourse 
        ? `/api/admin/courses/${editingCourse.id}`
        : '/api/admin/courses';
      const method = editingCourse ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.error || 'Ошибка сохранения');
      }

      alert(editingCourse ? 'Курс обновлен' : 'Курс создан');
      setShowCourseForm(false);
      setEditingCourse(null);
      void loadCourses();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Ошибка сохранения курса');
    }
  };

  // Delete course
  const handleDeleteCourse = async (id: number) => {
    if (!confirm('Удалить этот курс?')) return;
    try {
      const res = await fetch(`/api/admin/courses/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      alert('Курс удален');
      void loadCourses();
    } catch {
      alert('Ошибка удаления курса');
    }
  };

  // Update feedback status
  const handleUpdateFeedbackStatus = async (id: number, status: string) => {
    try {
      const res = await fetch(`/api/admin/feedback/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error();
      void loadFeedback();
    } catch {
      alert('Ошибка обновления статуса');
    }
  };

  if (loading) {
    return <div className="loading">Загрузка...</div>;
  }

  if (!user || user.role !== 'admin') {
    return null;
  }

  return (
    <section className="admin-section">
      <div className="container">
        <h2>Управление системой</h2>

        <div className="admin-tabs">
          <button 
            className={`tab-btn ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            Пользователи
          </button>
          <button 
            className={`tab-btn ${activeTab === 'schedule' ? 'active' : ''}`}
            onClick={() => setActiveTab('schedule')}
          >
            Расписание
          </button>
          <button 
            className={`tab-btn ${activeTab === 'processes' ? 'active' : ''}`}
            onClick={() => setActiveTab('processes')}
          >
            Учебные процессы
          </button>
          <button 
            className={`tab-btn ${activeTab === 'courses' ? 'active' : ''}`}
            onClick={() => setActiveTab('courses')}
          >
            Курсы
          </button>
          <button 
            className={`tab-btn ${activeTab === 'feedback' ? 'active' : ''}`}
            onClick={() => setActiveTab('feedback')}
          >
            Обратная связь
          </button>
        </div>

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="tab-content active">
            <div className="admin-header">
              <h3>Управление пользователями</h3>
              <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                <button 
                  className="btn btn-primary"
                  onClick={() => {
                    setEditingUser(null);
                    setShowUserForm(true);
                  }}
                >
                  Добавить пользователя
                </button>
                <label>
                  Фильтр по роли:
                  <select 
                    value={userRoleFilter} 
                    onChange={(e) => {
                      setUserRoleFilter(e.target.value);
                      void loadUsers();
                    }}
                    style={{ marginLeft: '10px' }}
                  >
                    <option value="">Все</option>
                    <option value="student">Студенты</option>
                    <option value="teacher">Преподаватели</option>
                    <option value="admin">Администраторы</option>
                  </select>
                </label>
              </div>
            </div>

            {showUserForm && (
              <div className="admin-form-container" style={{ marginBottom: '20px', padding: '20px', border: '1px solid #ddd', borderRadius: '5px' }}>
                <h4>{editingUser ? 'Редактировать пользователя' : 'Новый пользователь'}</h4>
                <form onSubmit={handleUserSubmit}>
                  <div style={{ marginBottom: '10px' }}>
                    <label>Имя пользователя: *</label>
                    <input 
                      type="text" 
                      name="username" 
                      required
                      defaultValue={editingUser?.username || ''}
                    />
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <label>Email: *</label>
                    <input 
                      type="email" 
                      name="email" 
                      required
                      defaultValue={editingUser?.email || ''}
                    />
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <label>Полное имя: *</label>
                    <input 
                      type="text" 
                      name="fullName" 
                      required
                      defaultValue={editingUser?.fullName || ''}
                    />
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <label>Роль: *</label>
                    <select name="role" required defaultValue={editingUser?.role || 'student'}>
                      <option value="student">Студент</option>
                      <option value="teacher">Преподаватель</option>
                      <option value="admin">Администратор</option>
                    </select>
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <label>Пароль: {editingUser ? '(оставьте пустым, чтобы не менять)' : '*'}</label>
                    <input 
                      type="password" 
                      name="password" 
                      required={!editingUser}
                      placeholder={editingUser ? 'Оставьте пустым, чтобы не менять' : 'Введите пароль'}
                    />
                  </div>
                  <div>
                    <button type="submit" className="btn btn-primary">
                      {editingUser ? 'Сохранить' : 'Создать'}
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-secondary"
                      onClick={() => {
                        setShowUserForm(false);
                        setEditingUser(null);
                      }}
                      style={{ marginLeft: '10px' }}
                    >
                      Отмена
                    </button>
                  </div>
                </form>
              </div>
            )}

            {loadingUsers ? (
              <div className="loading">Загрузка пользователей...</div>
            ) : (
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Имя пользователя</th>
                      <th>Email</th>
                      <th>Полное имя</th>
                      <th>Роль</th>
                      <th>Дата регистрации</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td>{u.id}</td>
                        <td>{u.username}</td>
                        <td>{u.email}</td>
                        <td>{u.fullName}</td>
                        <td>{u.role}</td>
                        <td>{new Date(u.createdAt).toLocaleDateString('ru-RU')}</td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-start' }}>
                            <button 
                              className="btn btn-small"
                              onClick={() => {
                                setEditingUser(u);
                                setShowUserForm(true);
                              }}
                            >
                              Редактировать
                            </button>
                            <button 
                              className="btn btn-small btn-danger"
                              onClick={() => handleDeleteUser(u.id)}
                            >
                              Удалить
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center' }}>
                          Пользователи не найдены
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Schedule Tab */}
        {activeTab === 'schedule' && (
          <div className="tab-content active">
            <div className="admin-header">
              <h3>Управление расписанием</h3>
              <button 
                className="btn btn-primary"
                onClick={() => {
                  setEditingSchedule(null);
                  setShowScheduleForm(true);
                }}
              >
                Добавить занятие
              </button>
            </div>

            {showScheduleForm && (
              <div className="admin-form-container" style={{ marginBottom: '20px', padding: '20px', border: '1px solid #ddd', borderRadius: '5px' }}>
                <h4>{editingSchedule ? 'Редактировать занятие' : 'Новое занятие'}</h4>
                <form onSubmit={handleScheduleSubmit}>
                  <div style={{ marginBottom: '10px' }}>
                    <label>Курс: *</label>
                    <select name="courseId" required defaultValue={editingSchedule?.courseId}>
                      <option value="">Выберите курс</option>
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <label>Преподаватель: *</label>
                    <select name="instructorId" required defaultValue={editingSchedule?.instructorId}>
                      <option value="">Выберите преподавателя</option>
                      {teachers.map((t) => (
                        <option key={t.id} value={t.id}>{t.fullName}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <label>Название темы:</label>
                    <input 
                      type="text" 
                      name="title" 
                      defaultValue={editingSchedule?.title || ''}
                      placeholder="Введите название темы"
                    />
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <label>Содержание:</label>
                    <textarea 
                      name="content" 
                      rows={4}
                      defaultValue={editingSchedule?.content || ''}
                      placeholder="Текст лекции, ссылки, изображения..."
                    />
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <label>День недели: *</label>
                    <select name="dayOfWeek" required defaultValue={editingSchedule?.dayOfWeek}>
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
                  <div style={{ marginBottom: '10px' }}>
                    <label>Время: *</label>
                    <input 
                      type="text" 
                      name="time" 
                      required
                      defaultValue={editingSchedule?.time || ''}
                      placeholder="10:00-12:00"
                    />
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <label>Аудитория: *</label>
                    <input 
                      type="text" 
                      name="room" 
                      required
                      defaultValue={editingSchedule?.room || ''}
                      placeholder="Аудитория 101"
                    />
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <label>Тип: *</label>
                    <select name="type" required defaultValue={editingSchedule?.type}>
                      <option value="">Выберите тип</option>
                      <option value="Лекция">Лекция</option>
                      <option value="Практика">Практика</option>
                      <option value="Лабораторная">Лабораторная</option>
                    </select>
                  </div>
                  <div>
                    <button type="submit" className="btn btn-primary">
                      {editingSchedule ? 'Сохранить' : 'Создать'}
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-secondary"
                      onClick={() => {
                        setShowScheduleForm(false);
                        setEditingSchedule(null);
                      }}
                      style={{ marginLeft: '10px' }}
                    >
                      Отмена
                    </button>
                  </div>
                </form>
              </div>
            )}

            {loadingSchedule ? (
              <div className="loading">Загрузка расписания...</div>
            ) : (
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Курс</th>
                      <th>Тема</th>
                      <th>Преподаватель</th>
                      <th>День</th>
                      <th>Время</th>
                      <th>Аудитория</th>
                      <th>Тип</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {schedule.map((s) => (
                      <tr key={s.id}>
                        <td>{s.id}</td>
                        <td>{s.courseTitle}</td>
                        <td>{s.title || '-'}</td>
                        <td>{s.instructorName}</td>
                        <td>{s.dayOfWeek}</td>
                        <td>{s.time}</td>
                        <td>{s.room}</td>
                        <td>{s.type}</td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-start' }}>
                            <button 
                              className="btn btn-small"
                              onClick={() => {
                                setEditingSchedule(s);
                                setShowScheduleForm(true);
                              }}
                            >
                              Редактировать
                            </button>
                            <button 
                              className="btn btn-small btn-danger"
                              onClick={() => handleDeleteSchedule(s.id)}
                            >
                              Удалить
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {schedule.length === 0 && (
                      <tr>
                        <td colSpan={9} style={{ textAlign: 'center' }}>
                          Занятия не найдены
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Processes Tab */}
        {activeTab === 'processes' && (
          <div className="tab-content active">
            <div className="admin-header">
              <h3>Управление учебными процессами</h3>
              <button 
                className="btn btn-primary"
                onClick={() => {
                  setEditingProcess(null);
                  setShowProcessForm(true);
                }}
              >
                Добавить модуль
              </button>
            </div>

            {showProcessForm && (
              <div className="admin-form-container" style={{ marginBottom: '20px', padding: '20px', border: '1px solid #ddd', borderRadius: '5px' }}>
                <h4>{editingProcess ? 'Редактировать модуль' : 'Новый модуль'}</h4>
                <form onSubmit={handleProcessSubmit}>
                  <div style={{ marginBottom: '10px' }}>
                    <label>Курс: *</label>
                    <select name="courseId" required defaultValue={editingProcess?.courseId}>
                      <option value="">Выберите курс</option>
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>{c.title}</option>
                      ))}
                    </select>
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <label>Название: *</label>
                    <input 
                      type="text" 
                      name="title" 
                      required
                      defaultValue={editingProcess?.title || ''}
                    />
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <label>Описание: *</label>
                    <textarea 
                      name="description" 
                      rows={4}
                      required
                      defaultValue={editingProcess?.description || ''}
                    />
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <label>Порядок: *</label>
                    <input 
                      type="number" 
                      name="order" 
                      required
                      min="1"
                      defaultValue={editingProcess?.order || ''}
                    />
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <label>Срок сдачи:</label>
                    <input 
                      type="date" 
                      name="deadline"
                      defaultValue={editingProcess?.deadline ? editingProcess.deadline.split('T')[0] : ''}
                    />
                  </div>
                  <div>
                    <button type="submit" className="btn btn-primary">
                      {editingProcess ? 'Сохранить' : 'Создать'}
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-secondary"
                      onClick={() => {
                        setShowProcessForm(false);
                        setEditingProcess(null);
                      }}
                      style={{ marginLeft: '10px' }}
                    >
                      Отмена
                    </button>
                  </div>
                </form>
              </div>
            )}

            {loadingProcesses ? (
              <div className="loading">Загрузка модулей...</div>
            ) : (
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Курс</th>
                      <th>Название</th>
                      <th>Описание</th>
                      <th>Порядок</th>
                      <th>Срок сдачи</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processes.map((p) => (
                      <tr key={p.id}>
                        <td>{p.id}</td>
                        <td>{p.courseTitle}</td>
                        <td>{p.title}</td>
                        <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {p.description}
                        </td>
                        <td>{p.order}</td>
                        <td>{p.deadline ? new Date(p.deadline).toLocaleDateString('ru-RU') : '-'}</td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-start' }}>
                            <button 
                              className="btn btn-small"
                              onClick={() => {
                                setEditingProcess(p);
                                setShowProcessForm(true);
                              }}
                            >
                              Редактировать
                            </button>
                            <button 
                              className="btn btn-small btn-danger"
                              onClick={() => handleDeleteProcess(p.id)}
                            >
                              Удалить
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {processes.length === 0 && (
                      <tr>
                        <td colSpan={7} style={{ textAlign: 'center' }}>
                          Модули не найдены
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Courses Tab */}
        {activeTab === 'courses' && (
          <div className="tab-content active">
            <div className="admin-header">
              <h3>Управление курсами</h3>
              <button 
                className="btn btn-primary"
                onClick={() => {
                  setEditingCourse(null);
                  setShowCourseForm(true);
                }}
              >
                Добавить курс
              </button>
            </div>

            {showCourseForm && (
              <div className="admin-form-container" style={{ marginBottom: '20px', padding: '20px', border: '1px solid #ddd', borderRadius: '5px' }}>
                <h4>{editingCourse ? 'Редактировать курс' : 'Новый курс'}</h4>
                <form onSubmit={handleCourseSubmit}>
                  <div style={{ marginBottom: '10px' }}>
                    <label>Название: *</label>
                    <input 
                      type="text" 
                      name="title" 
                      required
                      defaultValue={editingCourse?.title || ''}
                    />
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <label>Описание: *</label>
                    <textarea 
                      name="description" 
                      rows={4}
                      required
                      defaultValue={editingCourse?.description || ''}
                    />
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <label>Длительность: *</label>
                    <input 
                      type="text" 
                      name="duration" 
                      required
                      defaultValue={editingCourse?.duration || ''}
                      placeholder="3 месяца"
                    />
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <label>Преподаватель: *</label>
                    <input 
                      type="text" 
                      name="instructor" 
                      required
                      defaultValue={editingCourse?.instructor || ''}
                    />
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <label>Цена: *</label>
                    <input 
                      type="number" 
                      name="price" 
                      required
                      min="0"
                      defaultValue={editingCourse?.price || ''}
                    />
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <label>Категория: *</label>
                    <input 
                      type="text" 
                      name="category" 
                      required
                      defaultValue={editingCourse?.category || ''}
                      placeholder="Программирование"
                    />
                  </div>
                  <div style={{ marginBottom: '10px' }}>
                    <label>Доступен:</label>
                    <select name="available" defaultValue={editingCourse?.available ? 'true' : 'false'}>
                      <option value="true">Да</option>
                      <option value="false">Нет</option>
                    </select>
                  </div>
                  <div>
                    <button type="submit" className="btn btn-primary">
                      {editingCourse ? 'Сохранить' : 'Создать'}
                    </button>
                    <button 
                      type="button" 
                      className="btn btn-secondary"
                      onClick={() => {
                        setShowCourseForm(false);
                        setEditingCourse(null);
                      }}
                      style={{ marginLeft: '10px' }}
                    >
                      Отмена
                    </button>
                  </div>
                </form>
              </div>
            )}

            {loadingCourses ? (
              <div className="loading">Загрузка курсов...</div>
            ) : (
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Название</th>
                      <th>Описание</th>
                      <th>Длительность</th>
                      <th>Преподаватель</th>
                      <th>Цена</th>
                      <th>Категория</th>
                      <th>Доступен</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allCourses.map((c) => (
                      <tr key={c.id}>
                        <td>{c.id}</td>
                        <td>{c.title}</td>
                        <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {c.description}
                        </td>
                        <td>{c.duration}</td>
                        <td>{c.instructor}</td>
                        <td>{c.price} ₽</td>
                        <td>{c.category}</td>
                        <td>{c.available ? 'Да' : 'Нет'}</td>
                        <td>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-start' }}>
                            <button 
                              className="btn btn-small"
                              onClick={() => {
                                setEditingCourse(c);
                                setShowCourseForm(true);
                              }}
                            >
                              Редактировать
                            </button>
                            <button 
                              className="btn btn-small btn-danger"
                              onClick={() => handleDeleteCourse(c.id)}
                            >
                              Удалить
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {allCourses.length === 0 && (
                      <tr>
                        <td colSpan={9} style={{ textAlign: 'center' }}>
                          Курсы не найдены
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Feedback Tab */}
        {activeTab === 'feedback' && (
          <div className="tab-content active">
            <div className="admin-header">
              <h3>Обратная связь</h3>
            </div>
            {loadingFeedback ? (
              <div className="loading">Загрузка обратной связи...</div>
            ) : (
              <div className="admin-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Имя</th>
                      <th>Email</th>
                      <th>Тема</th>
                      <th>Сообщение</th>
                      <th>Дата</th>
                      <th>Статус</th>
                      <th>Действия</th>
                    </tr>
                  </thead>
                  <tbody>
                    {feedback.map((f) => (
                      <tr key={f.id}>
                        <td>{f.id}</td>
                        <td>{f.name}</td>
                        <td>{f.email}</td>
                        <td>{f.subject}</td>
                        <td style={{ maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {f.message}
                        </td>
                        <td>{new Date(f.createdAt).toLocaleDateString('ru-RU')}</td>
                        <td>{f.status}</td>
                        <td>
                          <select 
                            value={f.status}
                            onChange={(e) => handleUpdateFeedbackStatus(f.id, e.target.value)}
                            style={{ padding: '5px' }}
                          >
                            <option value="new">Новое</option>
                            <option value="read">Прочитано</option>
                            <option value="resolved">Решено</option>
                            <option value="archived">Архив</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                    {feedback.length === 0 && (
                      <tr>
                        <td colSpan={8} style={{ textAlign: 'center' }}>
                          Сообщения не найдены
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
