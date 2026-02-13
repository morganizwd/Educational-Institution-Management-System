import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<'login' | 'register'>('login');
  const [loginLogin, setLoginLogin] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginMessage, setLoginMessage] = useState<string | null>(null);
  const [loginError, setLoginError] = useState(false);

  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regFullName, setRegFullName] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regMessage, setRegMessage] = useState<string | null>(null);
  const [regError, setRegError] = useState(false);

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginMessage(null);
    const err = await login(loginLogin, loginPassword);
    if (err) {
      setLoginError(true);
      setLoginMessage(err);
    } else {
      setLoginError(false);
      setLoginMessage('Вход выполнен успешно!');
      setTimeout(() => navigate('/dashboard'), 800);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegMessage(null);
    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: regUsername,
          email: regEmail,
          fullName: regFullName,
          password: regPassword,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRegError(true);
        setRegMessage(data.error || 'Ошибка регистрации');
      } else {
        setRegError(false);
        setRegMessage('Регистрация успешна! Теперь вы можете войти.');
        setTimeout(() => {
          setActiveTab('login');
        }, 1500);
      }
    } catch {
      setRegError(true);
      setRegMessage('Ошибка соединения с сервером');
    }
  };

  return (
    <section className="auth-section">
      <div className="container">
        <div className="auth-container">
          <div className="auth-tabs">
            <button
              className={`tab-btn ${activeTab === 'login' ? 'active' : ''}`}
              onClick={() => setActiveTab('login')}
            >
              Вход
            </button>
            <button
              className={`tab-btn ${activeTab === 'register' ? 'active' : ''}`}
              onClick={() => setActiveTab('register')}
            >
              Регистрация
            </button>
          </div>

          {activeTab === 'login' && (
            <div id="login-form" className="auth-form active">
              <h2>Вход в систему</h2>
              <form onSubmit={handleLoginSubmit}>
                <div className="form-group">
                  <label htmlFor="login-username">Имя пользователя или Email</label>
                  <input
                    id="login-username"
                    value={loginLogin}
                    onChange={(e) => setLoginLogin(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="login-password">Пароль</label>
                  <input
                    id="login-password"
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary btn-block">
                  Войти
                </button>
              </form>
              {loginMessage && (
                <div className={`message ${loginError ? 'error' : 'success'}`}>
                  {loginMessage}
                </div>
              )}
            </div>
          )}

          {activeTab === 'register' && (
            <div id="register-form" className="auth-form active">
              <h2>Регистрация</h2>
              <form onSubmit={handleRegisterSubmit}>
                <div className="form-group">
                  <label htmlFor="reg-username">Имя пользователя</label>
                  <input
                    id="reg-username"
                    value={regUsername}
                    onChange={(e) => setRegUsername(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="reg-email">Email</label>
                  <input
                    id="reg-email"
                    type="email"
                    value={regEmail}
                    onChange={(e) => setRegEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="reg-fullname">Полное имя</label>
                  <input
                    id="reg-fullname"
                    value={regFullName}
                    onChange={(e) => setRegFullName(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="reg-password">Пароль</label>
                  <input
                    id="reg-password"
                    type="password"
                    value={regPassword}
                    onChange={(e) => setRegPassword(e.target.value)}
                    required
                  />
                </div>
                <button type="submit" className="btn btn-primary btn-block">
                  Зарегистрироваться
                </button>
              </form>
              {regMessage && (
                <div className={`message ${regError ? 'error' : 'success'}`}>
                  {regMessage}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

