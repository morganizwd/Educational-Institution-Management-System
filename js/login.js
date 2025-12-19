// Переключение между вкладками входа и регистрации
document.addEventListener('DOMContentLoaded', () => {
    const tabButtons = document.querySelectorAll('.tab-btn');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;
            
            // Обновление активных кнопок
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            // Переключение форм
            if (tab === 'login') {
                loginForm.classList.add('active');
                registerForm.classList.remove('active');
            } else {
                loginForm.classList.remove('active');
                registerForm.classList.add('active');
            }
        });
    });

    // Обработка формы входа
    const loginFormElement = document.getElementById('loginForm');
    if (loginFormElement) {
        loginFormElement.addEventListener('submit', async (e) => {
            e.preventDefault();
            const messageDiv = document.getElementById('login-message');
            
            const formData = {
                login: document.getElementById('login-username').value,
                password: document.getElementById('login-password').value
            };

            try {
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                const data = await response.json();

                if (response.ok) {
                    messageDiv.textContent = 'Вход выполнен успешно!';
                    messageDiv.className = 'message success';
                    setTimeout(() => {
                        window.location.href = '/dashboard.html';
                    }, 1000);
                } else {
                    messageDiv.textContent = data.error || 'Ошибка входа';
                    messageDiv.className = 'message error';
                }
            } catch (error) {
                messageDiv.textContent = 'Ошибка соединения с сервером';
                messageDiv.className = 'message error';
            }
        });
    }

    // Обработка формы регистрации
    const registerFormElement = document.getElementById('registerForm');
    if (registerFormElement) {
        registerFormElement.addEventListener('submit', async (e) => {
            e.preventDefault();
            const messageDiv = document.getElementById('register-message');
            
            const formData = {
                username: document.getElementById('reg-username').value,
                email: document.getElementById('reg-email').value,
                fullName: document.getElementById('reg-fullname').value,
                password: document.getElementById('reg-password').value
            };

            try {
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                const data = await response.json();

                if (response.ok) {
                    messageDiv.textContent = 'Регистрация успешна! Теперь вы можете войти.';
                    messageDiv.className = 'message success';
                    // Переключение на вкладку входа
                    setTimeout(() => {
                        tabButtons[0].click();
                        registerFormElement.reset();
                    }, 2000);
                } else {
                    messageDiv.textContent = data.error || 'Ошибка регистрации';
                    messageDiv.className = 'message error';
                }
            } catch (error) {
                messageDiv.textContent = 'Ошибка соединения с сервером';
                messageDiv.className = 'message error';
            }
        });
    }
});

