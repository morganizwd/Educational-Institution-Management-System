import React, { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';

export const FeedbackPage: React.FC = () => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [statusError, setStatusError] = useState(false);

  useEffect(() => {
    if (user) {
      setName(user.fullName ?? user.username);
      setEmail(user.email);
    }
  }, [user]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    try {
      const res = await fetch('/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message }),
      });
      const data = await res.json();
      if (res.ok) {
        setStatusError(false);
        setStatusMsg('Ваше сообщение успешно отправлено! Спасибо за обратную связь.');
        setSubject('');
        setMessage('');
        if (user) {
          setName(user.fullName ?? user.username);
          setEmail(user.email);
        } else {
          setName('');
          setEmail('');
        }
      } else {
        setStatusError(true);
        setStatusMsg(data.error || 'Ошибка отправки сообщения');
      }
    } catch {
      setStatusError(true);
      setStatusMsg('Ошибка соединения с сервером');
    }
  };

  return (
    <section className="feedback-section">
      <div className="container">
        <h2>Обратная связь</h2>
        <p>Мы будем рады услышать ваше мнение о наших курсах и системе обучения</p>

        <div className="feedback-form-container">
          <form id="feedbackForm" className="feedback-form" onSubmit={onSubmit}>
            <div className="form-group">
              <label htmlFor="feedback-name">Ваше имя</label>
              <input
                id="feedback-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="feedback-email">Email</label>
              <input
                id="feedback-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="feedback-subject">Тема сообщения</label>
              <input
                id="feedback-subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="feedback-message">Сообщение</label>
              <textarea
                id="feedback-message"
                rows={6}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Отправить
            </button>
          </form>
          {statusMsg && (
            <div
              id="feedback-status-message"
              className={`message ${statusError ? 'error' : 'success'}`}
            >
              {statusMsg}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

