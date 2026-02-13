import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';

type Course = {
  id: number;
  title: string;
  description: string;
  duration: string;
  instructor: string;
  price: number;
  category: string;
};

export const CoursesPage: React.FC = () => {
  const { user } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCourses = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/courses');
      if (!res.ok) {
        throw new Error('Ошибка загрузки курсов');
      }
      const data: Course[] = await res.json();
      setCourses(data);
    } catch (e) {
      console.error(e);
      setError('Ошибка загрузки курсов. Попробуйте обновить страницу.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadCourses();
  }, []);

  const enroll = async (courseId: number) => {
    try {
      const res = await fetch('/api/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId }),
      });
      const data = await res.json();
      if (res.ok) {
        alert('Вы успешно записались на курс!');
        void loadCourses();
      } else {
        alert(data.error || 'Ошибка записи на курс');
      }
    } catch {
      alert('Ошибка соединения с сервером');
    }
  };

  return (
    <section className="courses-section">
      <div className="container">
        <h2>Доступные курсы</h2>
        {loading && <div className="loading">Загрузка курсов...</div>}
        {error && <div className="error-message">{error}</div>}
        {!loading && !error && (
          <div id="courses-list" className="courses-grid">
            {courses.length === 0 && <p>Курсы пока не добавлены.</p>}
            {courses.map((course) => (
              <div key={course.id} className="course-card">
                <div className="course-card-header">
                  <h3>{course.title}</h3>
                  <p>{course.category}</p>
                </div>
                <div className="course-card-body">
                  <p>{course.description}</p>
                  <div className="course-info">
                    <span>Преподаватель: {course.instructor}</span>
                    <span>{course.duration}</span>
                  </div>
                  <div className="course-price">
                    {course.price.toLocaleString()} BYN
                  </div>
                  {user ? (
                    <button
                      className="btn btn-success btn-block"
                      onClick={() => enroll(course.id)}
                    >
                      Записаться на курс
                    </button>
                  ) : (
                    <a
                      href="/login"
                      className="btn btn-primary btn-block"
                    >
                      Войти для записи
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

