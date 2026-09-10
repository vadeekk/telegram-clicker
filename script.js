// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;

// Расширяем на весь экран
tg.expand();

// Состояние игры
const gameState = {
    score: 0,
    clickPower: 1,
    autoClickers: 0,
    multiplier: 1,
    autoInterval: null
};

// ===== КОНФИГ МАГАЗИНА =====
const shopConfig = {
    click: {
        basePrice: 10,      // начальная цена
        multiplier: 1.5,    // во сколько раз растёт цена
        owned: 0,           // сколько куплено
        effect: 1           // сколько даёт за покупку
    },
    auto: {
        basePrice: 50,
        multiplier: 1.6,
        owned: 0,
        effect: 1
    },
    multiplier: {
        basePrice: 100,
        multiplier: 2.5,    // множитель дорожает быстрее
        owned: 0,
        effect: 2
    }
};

// Функция расчёта текущей цены
function getPrice(type) {
    const item = shopConfig[type];
    return Math.floor(item.basePrice * Math.pow(item.multiplier, item.owned));
}

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
    
    // Загружаем магазин
    const savedShop = localStorage.getItem('clickerShop');
    if (savedShop) {
        try {
            const data = JSON.parse(savedShop);
            Object.keys(data).forEach(key => {
                if (shopConfig[key]) {
                    shopConfig[key].owned = data[key].owned || 0;
                }
            });
        } catch (e) {
            console.error('Ошибка загрузки магазина', e);
        }
    }
}

// Сохранение игры
function saveGame() {
    localStorage.setItem('clickerGame', JSON.stringify(gameState));
    localStorage.setItem('clickerShop', JSON.stringify(shopConfig));
}
// Обновление UI
function updateUI() {
    // Счёт
    document.getElementById('score').textContent = gameState.score;
    
    // За клик
    const clickValue = gameState.clickPower * gameState.multiplier;
    document.getElementById('clickPower').textContent = clickValue;
    
    // В секунду
    const passiveValue = gameState.autoClickers * gameState.multiplier;
    document.getElementById('passiveIncome').textContent = passiveValue;
    
    // Обновляем цены и кнопки магазина
    updateShop();
}

// Обновление магазина
function updateShop() {
    ['click', 'auto', 'multiplier'].forEach(type => {
        const price = getPrice(type);
        
        // Обновляем цену
        document.getElementById(`price-${type}`).textContent = price;
        
        // Обновляем "Куплено"
        document.getElementById(`owned-${type}`).textContent = shopConfig[type].owned;
        
        // Обновляем кнопку
        const btn = document.getElementById(`btn-${type}`);
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
function buyItem(type) {
    const price = getPrice(type);
    
    if (gameState.score < price) {
        showNotification('❌ Недостаточно средств!');
        return false;
    }

    // Списываем деньги
    gameState.score -= price;
    
    // Увеличиваем счётчик покупок
    shopConfig[type].owned++;

    // Применяем эффект
    switch(type) {
        case 'click':
            gameState.clickPower += shopConfig.click.effect;
            showNotification(`⚡ Сила клика: ${gameState.clickPower}`);
            break;
        case 'auto':
            gameState.autoClickers += shopConfig.auto.effect;
            startAutoClicker();
            showNotification(`🤖 Автокликеров: ${gameState.autoClickers}`);
            break;
        case 'multiplier':
            gameState.multiplier *= shopConfig.multiplier.effect;
            showNotification(`💎 Множитель: x${gameState.multiplier}`);
            break;
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
    
  document.querySelectorAll('.buy-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
        e.stopPropagation();
        const type = this.dataset.type;
        buyItem(type);
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