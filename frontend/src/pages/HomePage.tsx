import React, { useEffect, useState } from 'react';

type Course = {
  id: number;
  title: string;
  description: string;
  duration: string;
  instructor: string;
  price: number;
  category: string;
  imageUrl?: string | null;
};

export const HomePage: React.FC = () => {
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    const loadPopularCourses = async () => {
      try {
        const res = await fetch('/api/courses');
        if (!res.ok) return;
        const data: Course[] = await res.json();
        setCourses(data.slice(0, 3));
      } catch {
      }
    };
    void loadPopularCourses();
  }, []);

  const [currentSlide, setCurrentSlide] = useState(0);
  useEffect(() => {
    const id = setInterval(
      () => setCurrentSlide((prev) => (prev + 1) % 3),
      5000
    );
    return () => clearInterval(id);
  }, []);

  const slides = [
    {
      title: 'Добро пожаловать в систему управления образовательными учреждениями',
      text: 'Мы предлагаем широкий спектр образовательных программ для вашего профессионального развития',
      btnText: 'Посмотреть курсы',
      href: '/courses',
    },
    {
      title: 'Онлайн обучение нового поколения',
      text: 'Современные технологии и инновационные методики преподавания',
      btnText: 'Начать обучение',
      href: '/login',
    },
    {
      title: 'Профессиональные преподаватели',
      text: 'Опытные специалисты с многолетним стажем помогут вам достичь ваших целей',
      btnText: 'Связаться с нами',
      href: '/feedback',
    },
  ];

  return (
    <>
      <section className="slider-section">
        <div className="slider-container">
          <div className="slider-wrapper">
            {slides.map((s, idx) => (
              <div
                key={idx}
                className={`slide ${idx === currentSlide ? 'active' : ''}`}
              >
                <div className="slide-content">
                  <h2>{s.title}</h2>
                  <p>{s.text}</p>
                  <a href={s.href} className="btn btn-primary">
                    {s.btnText}
                  </a>
                </div>
              </div>
            ))}
          </div>
          <div className="slider-controls">
            <button
              className="slider-btn prev"
              id="prevBtn"
              onClick={() =>
                setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length)
              }
            >
              ‹
            </button>
            <button
              className="slider-btn next"
              id="nextBtn"
              onClick={() =>
                setCurrentSlide((prev) => (prev + 1) % slides.length)
              }
            >
              ›
            </button>
          </div>
          <div className="slider-dots">
            {slides.map((_, idx) => (
              <span
                key={idx}
                className={`dot ${idx === currentSlide ? 'active' : ''}`}
                data-slide={idx}
                onClick={() => setCurrentSlide(idx)}
              />
            ))}
          </div>
        </div>
      </section>

      <section className="info-blocks">
        <div className="container">
          <div className="info-grid">
            <div className="info-block">
              <div className="info-icon">📚</div>
              <h3>Более 50 курсов</h3>
              <p>Широкий выбор образовательных программ по различным направлениям</p>
            </div>
            <div className="info-block">
              <div className="info-icon">👥</div>
              <h3>5000+ студентов</h3>
              <p>Присоединяйтесь к тысячам довольных студентов по всему миру</p>
            </div>
            <div className="info-block">
              <div className="info-icon">⭐</div>
              <h3>Высокий рейтинг</h3>
              <p>Наши курсы получили высокие оценки от студентов и экспертов</p>
            </div>
            <div className="info-block">
              <div className="info-icon">🎓</div>
              <h3>Сертификаты</h3>
              <p>Получите официальный сертификат по окончании каждого курса</p>
            </div>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="container">
          <h2 className="section-title">Наши возможности</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">💻</div>
              <h3>Онлайн обучение</h3>
              <p>
                Доступ к курсам в любое время и в любом месте. Учитесь из дома,
                офиса или в дороге
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">👨‍🏫</div>
              <h3>Профессиональные преподаватели</h3>
              <p>
                Опытные специалисты с многолетним стажем и практическим опытом в
                индустрии
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📜</div>
              <h3>Сертификаты</h3>
              <p>
                Получите официальный сертификат по окончании курса, признанный
                работодателями
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">⏰</div>
              <h3>Гибкий график</h3>
              <p>
                Учитесь в удобном для вас темпе без жестких дедлайнов и ограничений
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">💬</div>
              <h3>Поддержка 24/7</h3>
              <p>
                Наша команда поддержки всегда готова помочь вам с любыми вопросами
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🔄</div>
              <h3>Обновляемый контент</h3>
              <p>
                Материалы курсов регулярно обновляются в соответствии с актуальными
                трендами
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="popular-courses">
        <div className="container">
          <h2>Популярные курсы</h2>
          <div id="courses-preview" className="courses-grid">
            {courses.map((course) => (
              <div key={course.id} className="course-card">
                {course.imageUrl && course.imageUrl.trim() !== '' && (
                  <div className="course-image-container">
                    <img 
                      src={course.imageUrl} 
                      alt={course.title}
                      className="course-image"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                  </div>
                )}
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
                  <a href="/courses" className="btn btn-primary">
                    Подробнее
                  </a>
                </div>
              </div>
            ))}
          </div>
          <div className="text-center">
            <a href="/courses" className="btn">
              Все курсы
            </a>
          </div>
        </div>
      </section>
    </>
  );
};

