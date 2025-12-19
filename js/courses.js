let currentUser = null;

// Загрузка курсов
async function loadCourses() {
    const loading = document.getElementById('loading');
    const errorMessage = document.getElementById('error-message');
    const coursesList = document.getElementById('courses-list');

    try {
        loading.style.display = 'block';
        errorMessage.style.display = 'none';

        const response = await fetch('/api/courses');
        if (!response.ok) {
            throw new Error('Ошибка загрузки курсов');
        }

        const courses = await response.json();
        loading.style.display = 'none';

        if (courses.length === 0) {
            coursesList.innerHTML = '<p>Курсы пока не добавлены.</p>';
            return;
        }

        coursesList.innerHTML = courses.map(course => `
            <div class="course-card">
                <div class="course-card-header">
                    <h3>${course.title}</h3>
                    <p>${course.category}</p>
                </div>
                <div class="course-card-body">
                    <p>${course.description}</p>
                    <div class="course-info">
                        <span>Преподаватель: ${course.instructor}</span>
                        <span>${course.duration}</span>
                    </div>
                    <div class="course-price">${course.price.toLocaleString()} ₽</div>
                    ${currentUser ? `
                        <button class="btn btn-success btn-block enroll-btn" data-course-id="${course.id}">
                            Записаться на курс
                        </button>
                    ` : `
                        <a href="/login.html" class="btn btn-primary btn-block">Войти для записи</a>
                    `}
                </div>
            </div>
        `).join('');

        // Добавление обработчиков для кнопок записи
        if (currentUser) {
            document.querySelectorAll('.enroll-btn').forEach(btn => {
                btn.addEventListener('click', async (e) => {
                    const courseId = e.target.dataset.courseId;
                    await enrollInCourse(courseId);
                });
            });
        }
    } catch (error) {
        loading.style.display = 'none';
        errorMessage.textContent = 'Ошибка загрузки курсов. Попробуйте обновить страницу.';
        errorMessage.style.display = 'block';
        console.error('Ошибка:', error);
    }
}

// Запись на курс
async function enrollInCourse(courseId) {
    try {
        const response = await fetch('/api/enroll', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ courseId })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Вы успешно записались на курс!');
            loadCourses(); // Обновляем список курсов
        } else {
            alert(data.error || 'Ошибка записи на курс');
        }
    } catch (error) {
        alert('Ошибка соединения с сервером');
        console.error('Ошибка:', error);
    }
}

// Инициализация страницы курсов
document.addEventListener('DOMContentLoaded', async () => {
    // Проверяем авторизацию
    try {
        const response = await fetch('/api/me');
        if (response.ok) {
            currentUser = await response.json();
        }
    } catch (error) {
        console.error('Ошибка проверки авторизации:', error);
    }

    loadCourses();
});

