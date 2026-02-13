import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async (e: React.MouseEvent) => {
    e.preventDefault();
    await logout();
    navigate('/');
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className="app-root">
      <header>
        <nav className="navbar">
          <div className="container">
            <div className="nav-brand">
              <h1>Образовательная Система</h1>
            </div>
            <button
              className="menu-toggle"
              id="menuToggle"
              onClick={() => {
                const menu = document.getElementById('navMenu');
                menu?.classList.toggle('active');
              }}
            >
              ☰
            </button>
            <ul className="nav-menu" id="navMenu">
              <li>
                <Link to="/" className={isActive('/') ? 'active' : ''}>
                  Главная
                </Link>
              </li>
              <li>
                <Link to="/courses" className={isActive('/courses') ? 'active' : ''}>
                  Курсы
                </Link>
              </li>
              <li>
                <Link to="/feedback" className={isActive('/feedback') ? 'active' : ''}>
                  Обратная связь
                </Link>
              </li>
              <li id="auth-menu">
                {!user && (
                  <Link
                    to="/login"
                    id="login-link"
                    className={isActive('/login') ? 'active' : ''}
                  >
                    Вход
                  </Link>
                )}
                {user && (
                  <>
                    {user.role === 'admin' && (
                      <Link
                        to="/admin"
                        id="admin-link"
                        className={isActive('/admin') ? 'active' : ''}
                      >
                        Админ
                      </Link>
                    )}
                    <Link
                      to="/dashboard"
                      id="dashboard-link"
                      className={isActive('/dashboard') ? 'active' : ''}
                    >
                      Кабинет
                    </Link>
                    <a href="#" id="logout-link" onClick={handleLogout}>
                      Выход
                    </a>
                  </>
                )}
              </li>
            </ul>
          </div>
        </nav>
      </header>

      <main>{children}</main>

      <footer>
        <div className="container">
          <div className="footer-content">
            <div className="footer-column">
              <h3>О системе</h3>
              <ul>
                <li>
                  <Link to="/">Главная</Link>
                </li>
                <li>
                  <Link to="/courses">Курсы</Link>
                </li>
                <li>
                  <Link to="/feedback">Обратная связь</Link>
                </li>
                <li>
                  <Link to="/login">Вход в систему</Link>
                </li>
              </ul>
            </div>
            <div className="footer-column">
              <h3>Для студентов</h3>
              <ul>
                <li>
                  <Link to="/courses">Каталог курсов</Link>
                </li>
                <li>
                  <Link to="/dashboard">Личный кабинет</Link>
                </li>
                <li>
                  <Link to="/feedback">Задать вопрос</Link>
                </li>
                <li>
                  <Link to="/login">Регистрация</Link>
                </li>
              </ul>
            </div>
            <div className="footer-column">
              <h3>Контакты</h3>
              <ul>
                <li>Email: info@edu-system.ru</li>
                <li>Телефон: +7 (495) 123-45-67</li>
                <li>Адрес: г. Москва, ул. Образовательная, д. 1</li>
              </ul>
            </div>
            <div className="footer-column">
              <h3>Социальные сети</h3>
              <ul>
                <li>
                  <a href="#">ВКонтакте</a>
                </li>
                <li>
                  <a href="#">Telegram</a>
                </li>
                <li>
                  <a href="#">YouTube</a>
                </li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>
              &copy; 2024 Система управления образовательными учреждениями. Все права
              защищены.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

