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
  
  // Search and filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [priceFilter, setPriceFilter] = useState<string>('all'); // all, free, low, medium, high
  const [sortBy, setSortBy] = useState<string>('title'); // title, price-asc, price-desc, duration

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
        credentials: 'include',
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

  // Get unique categories
  const categories = Array.from(new Set(courses.map(c => c.category))).sort();

  // Filter and sort courses
  const filteredAndSortedCourses = React.useMemo(() => {
    let filtered = [...courses];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        course =>
          course.title.toLowerCase().includes(query) ||
          course.description.toLowerCase().includes(query) ||
          course.instructor.toLowerCase().includes(query) ||
          course.category.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter(course => course.category === selectedCategory);
    }

    // Price filter
    if (priceFilter !== 'all') {
      filtered = filtered.filter(course => {
        const price = course.price;
        switch (priceFilter) {
          case 'free':
            return price === 0;
          case 'low':
            return price > 0 && price <= 10000;
          case 'medium':
            return price > 10000 && price <= 25000;
          case 'high':
            return price > 25000;
          default:
            return true;
        }
      });
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'title':
          return a.title.localeCompare(b.title, 'ru');
        case 'price-asc':
          return a.price - b.price;
        case 'price-desc':
          return b.price - a.price;
        case 'duration':
          // Extract numbers from duration string for comparison
          const aDuration = parseInt(a.duration.match(/\d+/)?.[0] || '0');
          const bDuration = parseInt(b.duration.match(/\d+/)?.[0] || '0');
          return aDuration - bDuration;
        default:
          return 0;
      }
    });

    return filtered;
  }, [courses, searchQuery, selectedCategory, priceFilter, sortBy]);

  return (
    <section className="courses-section">
      <div className="container">
        <h2>Доступные курсы</h2>
        
        {/* Search and Filters */}
        {!loading && !error && courses.length > 0 && (
          <div className="courses-filters" style={{ 
            marginBottom: '2rem', 
            padding: '1.5rem', 
            background: 'white', 
            borderRadius: '12px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
          }}>
            {/* Search */}
            <div style={{ marginBottom: '1rem' }}>
              <input
                type="text"
                placeholder="Поиск по названию, описанию, преподавателю..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  border: '2px solid #e0e0e0',
                  fontSize: '1rem',
                  transition: 'border-color 0.3s'
                }}
                onFocus={(e) => e.target.style.borderColor = '#667eea'}
                onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
              />
            </div>

            {/* Filters Row */}
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '1rem' 
            }}>
              {/* Category Filter */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#2c3e50' }}>
                  Категория:
                </label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '2px solid #e0e0e0',
                    fontSize: '1rem',
                    background: 'white',
                    cursor: 'pointer'
                  }}
                >
                  <option value="">Все категории</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Price Filter */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#2c3e50' }}>
                  Цена:
                </label>
                <select
                  value={priceFilter}
                  onChange={(e) => setPriceFilter(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '2px solid #e0e0e0',
                    fontSize: '1rem',
                    background: 'white',
                    cursor: 'pointer'
                  }}
                >
                  <option value="all">Все цены</option>
                  <option value="free">Бесплатные</option>
                  <option value="low">До 10 000 ₽</option>
                  <option value="medium">10 000 - 25 000 ₽</option>
                  <option value="high">От 25 000 ₽</option>
                </select>
              </div>

              {/* Sort */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600, color: '#2c3e50' }}>
                  Сортировка:
                </label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    borderRadius: '8px',
                    border: '2px solid #e0e0e0',
                    fontSize: '1rem',
                    background: 'white',
                    cursor: 'pointer'
                  }}
                >
                  <option value="title">По названию (А-Я)</option>
                  <option value="price-asc">По цене (возрастание)</option>
                  <option value="price-desc">По цене (убывание)</option>
                  <option value="duration">По длительности</option>
                </select>
              </div>
            </div>

            {/* Results count */}
            <div style={{ 
              marginTop: '1rem', 
              padding: '0.75rem', 
              background: '#f8f9fa', 
              borderRadius: '8px',
              textAlign: 'center',
              color: '#666',
              fontSize: '0.9rem'
            }}>
              Найдено курсов: <strong>{filteredAndSortedCourses.length}</strong> из {courses.length}
            </div>
          </div>
        )}

        {loading && <div className="loading">Загрузка курсов...</div>}
        {error && <div className="error-message">{error}</div>}
        {!loading && !error && (
          <div id="courses-list" className="courses-grid">
            {courses.length === 0 && <p>Курсы пока не добавлены.</p>}
            {courses.length > 0 && filteredAndSortedCourses.length === 0 && (
              <div style={{ 
                gridColumn: '1 / -1', 
                textAlign: 'center', 
                padding: '3rem',
                background: 'white',
                borderRadius: '12px',
                boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
              }}>
                <p style={{ fontSize: '1.2rem', color: '#666', marginBottom: '0.5rem' }}>
                  Курсы не найдены
                </p>
                <p style={{ color: '#999' }}>
                  Попробуйте изменить параметры поиска или фильтры
                </p>
              </div>
            )}
            {filteredAndSortedCourses.map((course) => (
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

