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

export const DashboardPage: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [enrollmentsLoading, setEnrollmentsLoading] = useState(true);
  const [schedule, setSchedule] = useState<MyScheduleItem[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'enrollments' | 'history' | 'schedule'>(
    'enrollments'
  );
  const [answerDrafts, setAnswerDrafts] = useState<Record<number, string>>({});

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
        const res = await fetch('/api/my-schedule');
        if (!res.ok) {
          throw new Error('Ошибка загрузки расписания');
        }
        const data: MyScheduleItem[] = await res.json();
        setSchedule(data);
      } catch (e) {
        console.error(e);
      } finally {
        setScheduleLoading(false);
      }
    };
    if (user && user.role === 'student') {
      void loadSchedule();
    }
  }, [user]);

  const renderProfile = (u: User) => (
    <div id="user-profile" className="profile-card">
      <h3>Профиль пользователя</h3>
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
          <strong>Роль:</strong> {u.role === 'admin' ? 'Администратор' : 'Студент'}
        </p>
      </div>
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

  const renderSchedule = () => {
    if (user?.role !== 'student') {
      return (
        <p className="empty-message">
          Расписание в этом разделе доступно только для студентов.
        </p>
      );
    }
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
                <p>
                  <strong>Материалы:</strong> {item.content}
                </p>
              )}
              <p>
                <strong>Преподаватель:</strong> {item.instructorName}
              </p>
              {approved ? (
                <p>
                  <strong>Статус урока:</strong>{' '}
                  <span className="enrollment-status completed">
                    Пройден
                  </span>
                </p>
              ) : (
                <>
                  <p>
                    <strong>Статус урока:</strong>{' '}
                    <span className="enrollment-status active">
                      Ожидает выполнения
                    </span>
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
                    />
                  </div>
                  <button
                    className="btn btn-primary"
                    onClick={() => sendAnswer(item.id, item.enrollmentId)}
                  >
                    {hasAnswer ? 'Обновить ответ' : 'Отправить ответ'}
                  </button>
                </>
              )}
            </div>
          );
        })}
      </div>
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

