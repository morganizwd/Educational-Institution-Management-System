// Проверка авторизации и обновление UI
async function checkAuth() {
    try {
        const response = await fetch('/api/me');
        if (response.ok) {
            const user = await response.json();
            updateAuthUI(user);
            return user;
        } else {
            updateAuthUI(null);
            return null;
        }
    } catch (error) {
        console.error('Ошибка проверки авторизации:', error);
        updateAuthUI(null);
        return null;
    }
}

// Обновление UI в зависимости от статуса авторизации
function updateAuthUI(user) {
    const loginLink = document.getElementById('login-link');
    const logoutLink = document.getElementById('logout-link');
    const userInfo = document.getElementById('user-info');
    const dashboardLink = document.getElementById('dashboard-link');
    const adminLink = document.getElementById('admin-link');
    const authMenu = document.getElementById('auth-menu');

    if (user) {
        // Скрываем ссылку на вход
        if (loginLink) loginLink.style.display = 'none';
        
        // Скрываем информацию о пользователе
        if (userInfo) {
            userInfo.style.display = 'none';
        }
        
        // Показываем ссылку на личный кабинет
        if (dashboardLink) dashboardLink.style.display = 'inline';
        
        // Показываем ссылку на админ-панель только для администраторов
        if (adminLink) {
            if (user.role === 'admin') {
                adminLink.style.display = 'inline';
            } else {
                adminLink.style.display = 'none';
            }
        }
        
        // Показываем ссылку на выход
        if (logoutLink) logoutLink.style.display = 'inline';
    } else {
        // Неавторизованный пользователь
        if (loginLink) loginLink.style.display = 'inline';
        if (logoutLink) logoutLink.style.display = 'none';
        if (userInfo) userInfo.style.display = 'none';
        if (dashboardLink) dashboardLink.style.display = 'none';
        if (adminLink) adminLink.style.display = 'none';
    }
}

// Выход из системы
async function logout() {
    try {
        const response = await fetch('/api/logout', {
            method: 'POST'
        });
        
        if (response.ok) {
            updateAuthUI(null);
            window.location.href = '/';
        }
    } catch (error) {
        console.error('Ошибка выхода:', error);
    }
}

// Мобильное меню
function initMobileMenu() {
    const menuToggle = document.getElementById('menuToggle');
    const navMenu = document.getElementById('navMenu');
    
    if (menuToggle && navMenu) {
        menuToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
        });
        
        // Закрытие меню при клике на ссылку
        const navLinks = navMenu.querySelectorAll('a');
        navLinks.forEach(link => {
            link.addEventListener('click', () => {
                navMenu.classList.remove('active');
            });
        });
    }
}

// Обработчик выхода
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    initMobileMenu();
    
    const logoutLink = document.getElementById('logout-link');
    if (logoutLink) {
        logoutLink.addEventListener('click', (e) => {
            e.preventDefault();
            logout();
        });
    }
});

