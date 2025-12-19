// Загрузка популярных курсов на главной странице
async function loadPopularCourses() {
    try {
        const response = await fetch('/api/courses');
        if (!response.ok) {
            throw new Error('Ошибка загрузки курсов');
        }
        
        const courses = await response.json();
        const preview = courses.slice(0, 3); // Показываем только первые 3 курса
        
        const container = document.getElementById('courses-preview');
        if (container) {
            container.innerHTML = preview.map(course => `
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
                        <a href="/courses.html" class="btn btn-primary">Подробнее</a>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Ошибка загрузки курсов:', error);
    }
}

// Инициализация главной страницы
document.addEventListener('DOMContentLoaded', () => {
    loadPopularCourses();
});

