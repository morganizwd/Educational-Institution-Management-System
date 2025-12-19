// Админ-панель
let currentUser = null;
let currentFilter = 'all';

// Проверка прав администратора
async function checkAdminAccess() {
    try {
        const response = await fetch('/api/me');
        if (!response.ok) {
            window.location.href = '/login.html';
            return false;
        }
        
        currentUser = await response.json();
        if (currentUser.role !== 'admin') {
            alert('У вас нет прав доступа к этой странице');
            window.location.href = '/';
            return false;
        }
        return true;
    } catch (error) {
        console.error('Ошибка проверки доступа:', error);
        window.location.href = '/login.html';
        return false;
    }
}

// Переключение вкладок
function initTabs() {
    const tabButtons = document.querySelectorAll('.admin-tabs .tab-btn');
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

            // Загрузка данных для активной вкладки
            loadTabData(tab);
        });
    });
}

// Загрузка данных для вкладки
function loadTabData(tab) {
    switch(tab) {
        case 'users':
            loadUsers();
            break;
        case 'schedule':
            loadSchedule();
            break;
        case 'processes':
            loadProcesses();
            break;
        case 'courses':
            loadCourses();
            break;
        case 'feedback':
            loadFeedback();
            break;
    }
}

// Загрузка пользователей
async function loadUsers() {
    const loading = document.getElementById('users-loading');
    const tableBody = document.getElementById('users-table-body');

    try {
        loading.style.display = 'block';
        tableBody.innerHTML = '';

        const response = await fetch('/api/admin/users');
        if (!response.ok) throw new Error('Ошибка загрузки пользователей');

        const users = await response.json();
        loading.style.display = 'none';

        // Фильтрация пользователей
        const filteredUsers = currentFilter === 'all' 
            ? users 
            : users.filter(u => u.role === currentFilter);

        if (filteredUsers.length === 0) {
            tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center;">Пользователи не найдены</td></tr>';
            return;
        }

        tableBody.innerHTML = filteredUsers.map(user => `
            <tr>
                <td>${user.id}</td>
                <td>${user.username}</td>
                <td>${user.email}</td>
                <td>${user.fullName || '-'}</td>
                <td><span class="role-badge ${user.role}">${getRoleName(user.role)}</span></td>
                <td>${new Date(user.createdAt).toLocaleDateString('ru-RU')}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn btn-small" onclick="editUser(${user.id})">Редактировать</button>
                        <button class="btn btn-small btn-danger" onclick="deleteUser(${user.id})">Удалить</button>
                    </div>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        loading.style.display = 'none';
        tableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: red;">Ошибка загрузки пользователей</td></tr>';
        console.error('Ошибка:', error);
    }
}

// Получение названия роли
function getRoleName(role) {
    const roles = {
        'student': 'Студент',
        'teacher': 'Преподаватель',
        'admin': 'Администратор'
    };
    return roles[role] || role;
}

// Загрузка расписания
async function loadSchedule() {
    const loading = document.getElementById('schedule-loading');
    const scheduleList = document.getElementById('schedule-list');

    try {
        loading.style.display = 'block';
        scheduleList.innerHTML = '';

        const response = await fetch('/api/admin/schedule');
        if (!response.ok) throw new Error('Ошибка загрузки расписания');

        const schedule = await response.json();
        loading.style.display = 'none';

        if (schedule.length === 0) {
            scheduleList.innerHTML = '<p style="text-align: center; color: #666;">Расписание пусто</p>';
            return;
        }

        scheduleList.innerHTML = schedule.map(item => `
            <div class="schedule-card">
                <h4>${item.courseTitle || 'Курс не найден'}</h4>
                <p><strong>Преподаватель:</strong> ${item.instructorName || 'Не назначен'}</p>
                <p><strong>День:</strong> ${item.dayOfWeek}</p>
                <p><strong>Время:</strong> ${item.time}</p>
                <p><strong>Аудитория:</strong> ${item.room}</p>
                <p><strong>Тип:</strong> ${item.type}</p>
                <div class="schedule-meta">
                    <button class="btn btn-small" onclick="editSchedule(${item.id})">Редактировать</button>
                    <button class="btn btn-small btn-danger" onclick="deleteSchedule(${item.id})">Удалить</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        loading.style.display = 'none';
        scheduleList.innerHTML = '<p style="text-align: center; color: red;">Ошибка загрузки расписания</p>';
        console.error('Ошибка:', error);
    }
}

// Загрузка учебных процессов
async function loadProcesses() {
    const loading = document.getElementById('processes-loading');
    const processesList = document.getElementById('processes-list');

    try {
        loading.style.display = 'block';
        processesList.innerHTML = '';

        const response = await fetch('/api/admin/processes');
        if (!response.ok) throw new Error('Ошибка загрузки учебных процессов');

        const processes = await response.json();
        loading.style.display = 'none';

        if (processes.length === 0) {
            processesList.innerHTML = '<p style="text-align: center; color: #666;">Учебные процессы не найдены</p>';
            return;
        }

        processesList.innerHTML = processes.map(process => `
            <div class="process-card">
                <h4>${process.title}</h4>
                <p><strong>Курс:</strong> ${process.courseTitle || 'Не указан'}</p>
                <p>${process.description}</p>
                <div class="process-meta">
                    <span><strong>Порядок:</strong> ${process.order}</span>
                    <span><strong>Дедлайн:</strong> ${new Date(process.deadline).toLocaleDateString('ru-RU')}</span>
                </div>
                <div class="action-buttons" style="margin-top: 1rem;">
                    <button class="btn btn-small" onclick="editProcess(${process.id})">Редактировать</button>
                    <button class="btn btn-small btn-danger" onclick="deleteProcess(${process.id})">Удалить</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        loading.style.display = 'none';
        processesList.innerHTML = '<p style="text-align: center; color: red;">Ошибка загрузки учебных процессов</p>';
        console.error('Ошибка:', error);
    }
}

// Загрузка курсов
async function loadCourses() {
    const loading = document.getElementById('courses-admin-loading');
    const coursesList = document.getElementById('courses-admin-list');

    try {
        loading.style.display = 'block';
        coursesList.innerHTML = '';

        const response = await fetch('/api/courses');
        if (!response.ok) throw new Error('Ошибка загрузки курсов');

        const courses = await response.json();
        loading.style.display = 'none';

        if (courses.length === 0) {
            coursesList.innerHTML = '<p style="text-align: center; color: #666;">Курсы не найдены</p>';
            return;
        }

        coursesList.innerHTML = courses.map(course => `
            <div class="course-admin-card">
                <h4>${course.title}</h4>
                <p>${course.description}</p>
                <p><strong>Категория:</strong> ${course.category}</p>
                <p><strong>Преподаватель:</strong> ${course.instructor}</p>
                <p><strong>Длительность:</strong> ${course.duration}</p>
                <p><strong>Цена:</strong> ${course.price.toLocaleString()} ₽</p>
                <div class="action-buttons" style="margin-top: 1rem;">
                    <button class="btn btn-small" onclick="editCourse(${course.id})">Редактировать</button>
                    <button class="btn btn-small btn-danger" onclick="deleteCourse(${course.id})">Удалить</button>
                </div>
            </div>
        `).join('');
    } catch (error) {
        loading.style.display = 'none';
        coursesList.innerHTML = '<p style="text-align: center; color: red;">Ошибка загрузки курсов</p>';
        console.error('Ошибка:', error);
    }
}

// Загрузка обратной связи
let currentFeedbackFilter = 'all';

async function loadFeedback() {
    const loading = document.getElementById('feedback-loading');
    const feedbackList = document.getElementById('feedback-list');

    try {
        loading.style.display = 'block';
        feedbackList.innerHTML = '';

        const response = await fetch('/api/admin/feedback');
        if (!response.ok) throw new Error('Ошибка загрузки обратной связи');

        const feedback = await response.json();
        loading.style.display = 'none';

        // Фильтрация обратной связи
        const filteredFeedback = currentFeedbackFilter === 'all' 
            ? feedback 
            : feedback.filter(f => f.status === currentFeedbackFilter);

        if (filteredFeedback.length === 0) {
            feedbackList.innerHTML = '<p style="text-align: center; color: #666;">Обратная связь не найдена</p>';
            return;
        }

        feedbackList.innerHTML = filteredFeedback.map(item => {
            const statusText = {
                'new': 'Новое',
                'read': 'Прочитано',
                'resolved': 'Решено'
            }[item.status] || item.status;

            return `
                <div class="feedback-card ${item.status}">
                    <div class="feedback-card-header">
                        <h4>${item.subject}</h4>
                        <span class="feedback-status-badge ${item.status}">${statusText}</span>
                    </div>
                    <div class="feedback-card-body">
                        <p><strong>От:</strong> ${item.name}</p>
                        <p><strong>Email:</strong> ${item.email}</p>
                        <p><strong>Сообщение:</strong></p>
                        <p style="background-color: #f8f9fa; padding: 1rem; border-radius: 4px; margin-top: 0.5rem;">${item.message}</p>
                    </div>
                    <div class="feedback-card-meta">
                        <span>Дата: ${new Date(item.createdAt).toLocaleString('ru-RU')}</span>
                        <div class="action-buttons">
                            ${item.status !== 'read' ? `<button class="btn btn-small" onclick="updateFeedbackStatus(${item.id}, 'read')">Отметить прочитанным</button>` : ''}
                            ${item.status !== 'resolved' ? `<button class="btn btn-small btn-success" onclick="updateFeedbackStatus(${item.id}, 'resolved')">Отметить решенным</button>` : ''}
                            ${item.status === 'resolved' ? `<button class="btn btn-small" onclick="updateFeedbackStatus(${item.id}, 'new')">Вернуть в новые</button>` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    } catch (error) {
        loading.style.display = 'none';
        feedbackList.innerHTML = '<p style="text-align: center; color: red;">Ошибка загрузки обратной связи</p>';
        console.error('Ошибка:', error);
    }
}

// Обновление статуса обратной связи
async function updateFeedbackStatus(feedbackId, newStatus) {
    try {
        const response = await fetch(`/api/admin/feedback/${feedbackId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });

        if (response.ok) {
            loadFeedback();
        } else {
            const data = await response.json();
            alert(data.error || 'Ошибка обновления статуса');
        }
    } catch (error) {
        alert('Ошибка соединения с сервером');
        console.error('Ошибка:', error);
    }
}

// Модальные окна
function initModals() {
    const modals = document.querySelectorAll('.modal');
    const closeButtons = document.querySelectorAll('.close');

    closeButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            modals.forEach(modal => modal.classList.remove('active'));
        });
    });

    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            modals.forEach(modal => modal.classList.remove('active'));
        }
    });
}

// Управление пользователями
function openUserModal(userId = null) {
    const modal = document.getElementById('user-modal');
    const form = document.getElementById('user-form');
    const title = document.getElementById('modal-user-title');

    if (userId) {
        title.textContent = 'Редактировать пользователя';
        // Загрузка данных пользователя
        fetch(`/api/admin/users/${userId}`)
            .then(res => res.json())
            .then(user => {
                document.getElementById('user-id').value = user.id;
                document.getElementById('modal-username').value = user.username;
                document.getElementById('modal-email').value = user.email;
                document.getElementById('modal-fullname').value = user.fullName || '';
                document.getElementById('modal-role').value = user.role;
                document.getElementById('modal-password').value = '';
            });
    } else {
        title.textContent = 'Добавить пользователя';
        form.reset();
        document.getElementById('user-id').value = '';
    }

    modal.classList.add('active');
}

function editUser(id) {
    openUserModal(id);
}

async function deleteUser(id) {
    if (!confirm('Вы уверены, что хотите удалить этого пользователя?')) return;

    try {
        const response = await fetch(`/api/admin/users/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            alert('Пользователь удален');
            loadUsers();
        } else {
            const data = await response.json();
            alert(data.error || 'Ошибка удаления пользователя');
        }
    } catch (error) {
        alert('Ошибка соединения с сервером');
        console.error('Ошибка:', error);
    }
}

// Управление расписанием
function openScheduleModal(scheduleId = null) {
    const modal = document.getElementById('schedule-modal');
    const form = document.getElementById('schedule-form');
    const title = document.getElementById('modal-schedule-title');

    // Загрузка курсов и преподавателей
    Promise.all([
        fetch('/api/courses').then(r => r.json()),
        fetch('/api/admin/users?role=teacher').then(r => r.json())
    ]).then(([courses, teachers]) => {
        const courseSelect = document.getElementById('schedule-course');
        const instructorSelect = document.getElementById('schedule-instructor');

        courseSelect.innerHTML = courses.map(c => 
            `<option value="${c.id}">${c.title}</option>`
        ).join('');

        instructorSelect.innerHTML = teachers.map(t => 
            `<option value="${t.id}">${t.fullName || t.username}</option>`
        ).join('');

        if (scheduleId) {
            title.textContent = 'Редактировать занятие';
            fetch(`/api/admin/schedule/${scheduleId}`)
                .then(res => res.json())
                .then(schedule => {
                    document.getElementById('schedule-id').value = schedule.id;
                    document.getElementById('schedule-course').value = schedule.courseId;
                    document.getElementById('schedule-instructor').value = schedule.instructorId;
                    document.getElementById('schedule-day').value = schedule.dayOfWeek;
                    document.getElementById('schedule-time').value = schedule.time;
                    document.getElementById('schedule-room').value = schedule.room;
                    document.getElementById('schedule-type').value = schedule.type;
                });
        } else {
            title.textContent = 'Добавить занятие';
            form.reset();
            document.getElementById('schedule-id').value = '';
        }

        modal.classList.add('active');
    });
}

function editSchedule(id) {
    openScheduleModal(id);
}

async function deleteSchedule(id) {
    if (!confirm('Вы уверены, что хотите удалить это занятие?')) return;

    try {
        const response = await fetch(`/api/admin/schedule/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            alert('Занятие удалено');
            loadSchedule();
        } else {
            const data = await response.json();
            alert(data.error || 'Ошибка удаления занятия');
        }
    } catch (error) {
        alert('Ошибка соединения с сервером');
        console.error('Ошибка:', error);
    }
}

// Управление учебными процессами
function openProcessModal(processId = null) {
    const modal = document.getElementById('process-modal');
    const form = document.getElementById('process-form');
    const title = document.getElementById('modal-process-title');

    fetch('/api/courses').then(r => r.json()).then(courses => {
        const courseSelect = document.getElementById('process-course');
        courseSelect.innerHTML = courses.map(c => 
            `<option value="${c.id}">${c.title}</option>`
        ).join('');

        if (processId) {
            title.textContent = 'Редактировать модуль';
            fetch(`/api/admin/processes/${processId}`)
                .then(res => res.json())
                .then(process => {
                    document.getElementById('process-id').value = process.id;
                    document.getElementById('process-course').value = process.courseId;
                    document.getElementById('process-title').value = process.title;
                    document.getElementById('process-description').value = process.description;
                    document.getElementById('process-order').value = process.order;
                    document.getElementById('process-deadline').value = process.deadline.split('T')[0];
                });
        } else {
            title.textContent = 'Добавить модуль';
            form.reset();
            document.getElementById('process-id').value = '';
        }

        modal.classList.add('active');
    });
}

function editProcess(id) {
    openProcessModal(id);
}

async function deleteProcess(id) {
    if (!confirm('Вы уверены, что хотите удалить этот модуль?')) return;

    try {
        const response = await fetch(`/api/admin/processes/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            alert('Модуль удален');
            loadProcesses();
        } else {
            const data = await response.json();
            alert(data.error || 'Ошибка удаления модуля');
        }
    } catch (error) {
        alert('Ошибка соединения с сервером');
        console.error('Ошибка:', error);
    }
}

// Управление курсами
function openCourseModal(courseId = null) {
    const modal = document.getElementById('course-modal');
    const form = document.getElementById('course-form');
    const title = document.getElementById('modal-course-title');
    const instructorSelect = document.getElementById('course-instructor');

    // Загружаем список преподавателей
    fetch('/api/admin/users?role=teacher')
        .then(res => res.json())
        .then(teachers => {
            // Заполняем выпадающий список преподавателями
            instructorSelect.innerHTML = '<option value="">Выберите преподавателя</option>';
            teachers.forEach(teacher => {
                const option = document.createElement('option');
                option.value = teacher.fullName || teacher.username;
                option.textContent = teacher.fullName || teacher.username;
                instructorSelect.appendChild(option);
            });

            // Если редактируем курс, загружаем его данные
            if (courseId) {
                title.textContent = 'Редактировать курс';
                fetch(`/api/courses/${courseId}`)
                    .then(res => res.json())
                    .then(course => {
                        document.getElementById('course-id').value = course.id;
                        document.getElementById('course-title').value = course.title;
                        document.getElementById('course-description').value = course.description;
                        document.getElementById('course-category').value = course.category;
                        document.getElementById('course-instructor').value = course.instructor;
                        document.getElementById('course-duration').value = course.duration;
                        document.getElementById('course-price').value = course.price;
                    });
            } else {
                title.textContent = 'Добавить курс';
                form.reset();
                document.getElementById('course-id').value = '';
                // Восстанавливаем список преподавателей после reset
                instructorSelect.innerHTML = '<option value="">Выберите преподавателя</option>';
                teachers.forEach(teacher => {
                    const option = document.createElement('option');
                    option.value = teacher.fullName || teacher.username;
                    option.textContent = teacher.fullName || teacher.username;
                    instructorSelect.appendChild(option);
                });
            }

            modal.classList.add('active');
        })
        .catch(error => {
            console.error('Ошибка загрузки преподавателей:', error);
            alert('Ошибка загрузки списка преподавателей');
        });
}

function editCourse(id) {
    openCourseModal(id);
}

async function deleteCourse(id) {
    if (!confirm('Вы уверены, что хотите удалить этот курс?')) return;

    try {
        const response = await fetch(`/api/admin/courses/${id}`, {
            method: 'DELETE'
        });

        if (response.ok) {
            alert('Курс удален');
            loadCourses();
        } else {
            const data = await response.json();
            alert(data.error || 'Ошибка удаления курса');
        }
    } catch (error) {
        alert('Ошибка соединения с сервером');
        console.error('Ошибка:', error);
    }
}

// Обработка форм
document.addEventListener('DOMContentLoaded', async () => {
    const hasAccess = await checkAdminAccess();
    if (!hasAccess) return;

    initTabs();
    initModals();
    loadUsers();

    // Фильтры пользователей
    document.querySelectorAll('#users-tab .filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#users-tab .filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFilter = btn.dataset.filter;
            loadUsers();
        });
    });

    // Фильтры обратной связи
    document.querySelectorAll('#feedback-tab .filter-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('#feedback-tab .filter-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentFeedbackFilter = btn.dataset.filter;
            loadFeedback();
        });
    });

    // Кнопки добавления
    document.getElementById('add-user-btn')?.addEventListener('click', () => openUserModal());
    document.getElementById('add-schedule-btn')?.addEventListener('click', () => openScheduleModal());
    document.getElementById('add-process-btn')?.addEventListener('click', () => openProcessModal());
    document.getElementById('add-course-btn')?.addEventListener('click', () => openCourseModal());

    // Форма пользователя
    document.getElementById('user-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        
        if (!data.password) delete data.password;

        const userId = data.id;
        const method = userId ? 'PUT' : 'POST';
        const url = userId ? `/api/admin/users/${userId}` : '/api/admin/users';

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            const messageDiv = document.getElementById('user-modal-message');

            if (response.ok) {
                messageDiv.textContent = 'Пользователь сохранен';
                messageDiv.className = 'message success';
                setTimeout(() => {
                    document.getElementById('user-modal').classList.remove('active');
                    loadUsers();
                }, 1000);
            } else {
                messageDiv.textContent = result.error || 'Ошибка сохранения';
                messageDiv.className = 'message error';
            }
        } catch (error) {
            document.getElementById('user-modal-message').textContent = 'Ошибка соединения';
            document.getElementById('user-modal-message').className = 'message error';
        }
    });

    // Форма расписания
    document.getElementById('schedule-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        
        const scheduleId = data.id;
        const method = scheduleId ? 'PUT' : 'POST';
        const url = scheduleId ? `/api/admin/schedule/${scheduleId}` : '/api/admin/schedule';

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            const messageDiv = document.getElementById('schedule-modal-message');

            if (response.ok) {
                messageDiv.textContent = 'Занятие сохранено';
                messageDiv.className = 'message success';
                setTimeout(() => {
                    document.getElementById('schedule-modal').classList.remove('active');
                    loadSchedule();
                }, 1000);
            } else {
                messageDiv.textContent = result.error || 'Ошибка сохранения';
                messageDiv.className = 'message error';
            }
        } catch (error) {
            document.getElementById('schedule-modal-message').textContent = 'Ошибка соединения';
            document.getElementById('schedule-modal-message').className = 'message error';
        }
    });

    // Форма учебного процесса
    document.getElementById('process-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        
        const processId = data.id;
        const method = processId ? 'PUT' : 'POST';
        const url = processId ? `/api/admin/processes/${processId}` : '/api/admin/processes';

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            const messageDiv = document.getElementById('process-modal-message');

            if (response.ok) {
                messageDiv.textContent = 'Модуль сохранен';
                messageDiv.className = 'message success';
                setTimeout(() => {
                    document.getElementById('process-modal').classList.remove('active');
                    loadProcesses();
                }, 1000);
            } else {
                messageDiv.textContent = result.error || 'Ошибка сохранения';
                messageDiv.className = 'message error';
            }
        } catch (error) {
            document.getElementById('process-modal-message').textContent = 'Ошибка соединения';
            document.getElementById('process-modal-message').className = 'message error';
        }
    });

    // Форма курса
    document.getElementById('course-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const formData = new FormData(e.target);
        const data = Object.fromEntries(formData);
        
        // Преобразуем price в число
        data.price = parseInt(data.price);
        data.available = true;
        
        const courseId = data.id;
        const method = courseId ? 'PUT' : 'POST';
        const url = courseId ? `/api/admin/courses/${courseId}` : '/api/admin/courses';

        try {
            const response = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });

            const result = await response.json();
            const messageDiv = document.getElementById('course-modal-message');

            if (response.ok) {
                messageDiv.textContent = 'Курс сохранен';
                messageDiv.className = 'message success';
                setTimeout(() => {
                    document.getElementById('course-modal').classList.remove('active');
                    loadCourses();
                }, 1000);
            } else {
                messageDiv.textContent = result.error || 'Ошибка сохранения';
                messageDiv.className = 'message error';
            }
        } catch (error) {
            document.getElementById('course-modal-message').textContent = 'Ошибка соединения';
            document.getElementById('course-modal-message').className = 'message error';
        }
    });
});

