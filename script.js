// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;

// Расширяем на весь экран
tg.expand();

// Состояние игры
const gameState = {
    score: 0,
    clickPower: 0,
    autoClickers: 0,
    multiplier: 1,
    autoInterval: null
};

// Загрузка сохранений
function loadGame() {
    const saved = localStorage.getItem('clickerGame');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            Object.assign(gameState, data);
            if (gameState.autoClickers > 0) {
                startAutoClicker();
            }
        } catch (e) {
            console.error('Ошибка загрузки', e);
        }
    }
}

// Сохранение игры
function saveGame() {
    localStorage.setItem('clickerGame', JSON.stringify(gameState));
}

// Обновление UI
function updateUI() {
    document.getElementById('score').textContent = gameState.score;
    document.getElementById('clickPower').textContent = gameState.clickPower * gameState.multiplier;
    
    // Обновляем кнопки магазина
    document.querySelectorAll('.buy-btn').forEach(btn => {
        const price = parseInt(btn.dataset.price);
        btn.disabled = gameState.score < price;
    });
}

// Показать эффект клика
function showClickEffect() {
    const effect = document.getElementById('clickEffect');
    effect.classList.remove('show');
    void effect.offsetWidth; // Триггер рефлоу
    effect.classList.add('show');
}

// Функция клика
function handleClick() {
    const points = gameState.clickPower * gameState.multiplier;
    gameState.score += points;
    showClickEffect();
    updateUI();
    saveGame();
    
    // Виброотклик на мобильных
    if (navigator.vibrate) {
        navigator.vibrate(10);
    }
}

// Автокликер
function startAutoClicker() {
    if (gameState.autoInterval) {
        clearInterval(gameState.autoInterval);
    }
    gameState.autoInterval = setInterval(() => {
        const points = gameState.autoClickers * gameState.multiplier;
        gameState.score += points;
        updateUI();
        saveGame();
    }, 1000);
}

// Покупка
function buyItem(type, price) {
    if (gameState.score < price) {
        showNotification('❌ Недостаточно средств!');
        return false;
    }

    gameState.score -= price;

    switch(type) {
        case 'click':
            gameState.clickPower += 1;
            showNotification('⚡ Сила клика увеличена!');
            break;
        case 'auto':
            gameState.autoClickers += 1;
            startAutoClicker();
            showNotification('🤖 Автокликер активирован!');
            break;
        case 'multiplier':
            gameState.multiplier *= 2;
            showNotification('💎 Множитель x2 активирован!');
            break;
        default:
            return false;
    }

    updateUI();
    saveGame();
    return true;
}

// Уведомления
function showNotification(message) {
    const old = document.querySelector('.notification');
    if (old) old.remove();

    const notif = document.createElement('div');
    notif.className = 'notification';
    notif.textContent = message;
    document.body.appendChild(notif);

    setTimeout(() => {
        notif.style.opacity = '0';
        notif.style.transform = 'translateX(100%)';
        setTimeout(() => notif.remove(), 300);
    }, 2000);
}

// Инициализация событий
function init() {
    // Загружаем игру
    loadGame();

    // Кнопка клика
    document.getElementById('clickButton').addEventListener('click', handleClick);
    
    // Кнопки магазина
    document.querySelectorAll('.buy-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const type = this.dataset.type;
            const price = parseInt(this.dataset.price);
            buyItem(type, price);
        });
    });

    updateUI();

    // Обновление через Telegram при сворачивании
    tg.onEvent('viewportChanged', () => {
        saveGame();
    });
}

// Запуск
document.addEventListener('DOMContentLoaded', init);