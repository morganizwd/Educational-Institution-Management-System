let currentUser = null;

// Загрузка профиля пользователя
async function loadUserProfile() {
    try {
        const response = await fetch('/api/me');
        if (!response.ok) {
            // Если не авторизован, перенаправляем на страницу входа
            window.location.href = '/login.html';
            return;
        }

        currentUser = await response.json();
        const profileInfo = document.getElementById('profile-info');
        
        if (profileInfo) {
            profileInfo.innerHTML = `
                <p><strong>Имя пользователя:</strong> ${currentUser.username}</p>
                <p><strong>Email:</strong> ${currentUser.email}</p>
                <p><strong>Полное имя:</strong> ${currentUser.fullName || 'Не указано'}</p>
                <p><strong>Роль:</strong> ${currentUser.role === 'admin' ? 'Администратор' : 'Студент'}</p>
            `;
        }
    } catch (error) {
        console.error('Ошибка загрузки профиля:', error);
        window.location.href = '/login.html';
    }
}

// Загрузка записей на курсы
async function loadEnrollments() {
    const loading = document.getElementById('enrollments-loading');
    const emptyMessage = document.getElementById('enrollments-empty');
    const enrollmentsList = document.getElementById('enrollments-list');

    try {
        loading.style.display = 'block';
        emptyMessage.style.display = 'none';

        const response = await fetch('/api/my-enrollments');
        if (!response.ok) {
            throw new Error('Ошибка загрузки записей');
        }

        const enrollments = await response.json();
        loading.style.display = 'none';

        if (enrollments.length === 0) {
            emptyMessage.style.display = 'block';
            enrollmentsList.innerHTML = '';
            return;
        }

        enrollmentsList.innerHTML = enrollments.map(enrollment => {
            const course = enrollment.course;
            const statusText = enrollment.status === 'active' ? 'Активен' : 
                              enrollment.status === 'completed' ? 'Завершен' : enrollment.status;
            const statusClass = enrollment.status === 'active' ? 'active' : 
                              enrollment.status === 'completed' ? 'completed' : '';

            return `
                <div class="enrollment-item">
                    <h4>${course ? course.title : 'Курс не найден'}</h4>
                    ${course ? `<p>${course.description}</p>` : ''}
                    <p><strong>Статус:</strong> <span class="enrollment-status ${statusClass}">${statusText}</span></p>
                    <p><strong>Дата записи:</strong> ${new Date(enrollment.enrolledAt).toLocaleDateString('ru-RU')}</p>
                    <p><strong>Прогресс:</strong> ${enrollment.progress}%</p>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${enrollment.progress}%"></div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        loading.style.display = 'none';
        console.error('Ошибка загрузки записей:', error);
        enrollmentsList.innerHTML = '<p class="error-message">Ошибка загрузки записей на курсы.</p>';
    }
}

// Переключение между вкладками
document.addEventListener('DOMContentLoaded', () => {
    loadUserProfile().then(() => {
        loadEnrollments();
    });

    const tabButtons = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');

    tabButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const tab = btn.dataset.tab;

            // Обновление активных кнопок
            tabButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            // Переключение контента
            tabContents.forEach(content => {
                content.classList.remove('active');
            });

            const targetTab = document.getElementById(`${tab}-tab`);
            if (targetTab) {
                targetTab.classList.add('active');
            }

            // Загрузка данных для вкладки истории при необходимости
            if (tab === 'history') {
                // Здесь можно добавить загрузку истории просмотров
            }
        });
    });
});

