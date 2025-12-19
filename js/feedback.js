let currentUser = null;

// Загрузка данных пользователя для формы обратной связи
async function loadUserData() {
    try {
        const response = await fetch('/api/me');
        if (response.ok) {
            currentUser = await response.json();
            // Автозаполнение формы, если пользователь авторизован
            const nameInput = document.getElementById('feedback-name');
            const emailInput = document.getElementById('feedback-email');
            
            if (nameInput && currentUser.fullName) {
                nameInput.value = currentUser.fullName;
            }
            if (emailInput && currentUser.email) {
                emailInput.value = currentUser.email;
            }
        }
    } catch (error) {
        console.error('Ошибка загрузки данных пользователя:', error);
    }
}

// Обработка формы обратной связи
document.addEventListener('DOMContentLoaded', () => {
    loadUserData();

    const feedbackForm = document.getElementById('feedbackForm');
    const messageDiv = document.getElementById('feedback-status-message');

    if (feedbackForm) {
        feedbackForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = {
                name: document.getElementById('feedback-name').value,
                email: document.getElementById('feedback-email').value,
                subject: document.getElementById('feedback-subject').value,
                message: document.getElementById('feedback-message').value
            };

            try {
                const response = await fetch('/api/feedback', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(formData)
                });

                const data = await response.json();

                if (response.ok) {
                    messageDiv.textContent = 'Ваше сообщение успешно отправлено! Спасибо за обратную связь.';
                    messageDiv.className = 'message success';
                    feedbackForm.reset();
                    
                    // Если пользователь авторизован, восстанавливаем его данные
                    if (currentUser) {
                        setTimeout(() => {
                            loadUserData();
                        }, 2000);
                    }
                } else {
                    messageDiv.textContent = data.error || 'Ошибка отправки сообщения';
                    messageDiv.className = 'message error';
                }
            } catch (error) {
                messageDiv.textContent = 'Ошибка соединения с сервером';
                messageDiv.className = 'message error';
                console.error('Ошибка:', error);
            }
        });
    }
});

