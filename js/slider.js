// Слайдер для главной страницы
document.addEventListener('DOMContentLoaded', () => {
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    const prevBtn = document.getElementById('prevBtn');
    const nextBtn = document.getElementById('nextBtn');
    let currentSlide = 0;
    let slideInterval;

    // Показать конкретный слайд
    function showSlide(index) {
        // Удаляем активный класс со всех слайдов и точек
        slides.forEach(slide => slide.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));

        // Добавляем активный класс к текущему слайду и точке
        if (slides[index]) {
            slides[index].classList.add('active');
        }
        if (dots[index]) {
            dots[index].classList.add('active');
        }

        currentSlide = index;
    }

    // Следующий слайд
    function nextSlide() {
        const next = (currentSlide + 1) % slides.length;
        showSlide(next);
    }

    // Предыдущий слайд
    function prevSlide() {
        const prev = (currentSlide - 1 + slides.length) % slides.length;
        showSlide(prev);
    }

    // Запуск автоматической смены слайдов
    function startSlider() {
        slideInterval = setInterval(nextSlide, 5000); // Меняем слайд каждые 5 секунд
    }

    // Остановка автоматической смены слайдов
    function stopSlider() {
        clearInterval(slideInterval);
    }

    // Обработчики событий для кнопок
    if (nextBtn) {
        nextBtn.addEventListener('click', () => {
            nextSlide();
            stopSlider();
            startSlider(); // Перезапускаем таймер
        });
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => {
            prevSlide();
            stopSlider();
            startSlider(); // Перезапускаем таймер
        });
    }

    // Обработчики для точек навигации
    dots.forEach((dot, index) => {
        dot.addEventListener('click', () => {
            showSlide(index);
            stopSlider();
            startSlider(); // Перезапускаем таймер
        });
    });

    // Остановка слайдера при наведении мыши
    const sliderContainer = document.querySelector('.slider-container');
    if (sliderContainer) {
        sliderContainer.addEventListener('mouseenter', stopSlider);
        sliderContainer.addEventListener('mouseleave', startSlider);
    }

    // Запуск слайдера
    if (slides.length > 0) {
        startSlider();
    }
});

