// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;

// Расширяем на весь экран
tg.expand();

// ===== СОСТОЯНИЕ ИГРЫ =====
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
        basePrice: 100,
        priceMultiplier: 1.5,
        owned: 0,
        effect: 1
    },
    auto: {
        basePrice: 250,
        priceMultiplier: 1.6,
        owned: 0,
        effect: 1
    },
    multiplier: {
        basePrice: 10000,
        priceMultiplier: 2.5,
        owned: 0,
        effect: 2
    }
};

// ===== КОМБО-СИСТЕМА =====
const comboState = {
    count: 0,
    timer: null
};

// ===== РАСЧЁТ ЦЕНЫ =====
function getPrice(type) {
    const item = shopConfig[type];
    return Math.floor(item.basePrice * Math.pow(item.priceMultiplier, item.owned));
}

// ===== ЗАГРУЗКА ИГРЫ =====
function loadGame() {
    const saved = localStorage.getItem('clickerGame_v1');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            gameState.score = Number(data.score) || 0;
            gameState.clickPower = Number(data.clickPower) || 1;
            gameState.autoClickers = Number(data.autoClickers) || 0;
            gameState.multiplier = Number(data.multiplier) || 1;
            
            if (gameState.autoClickers > 0) {
                startAutoClicker();
            }
        } catch (e) {
            console.error('Ошибка загрузки', e);
        }
    }
    
    const savedShop = localStorage.getItem('clickerShop_v1');
    if (savedShop) {
        try {
            const data = JSON.parse(savedShop);
            ['click', 'auto', 'multiplier'].forEach(type => {
                if (data[type] && typeof data[type].owned === 'number') {
                    shopConfig[type].owned = data[type].owned;
                }
            });
        } catch (e) {
            console.error('Ошибка загрузки магазина', e);
        }
    }
}

// ===== СОХРАНЕНИЕ ИГРЫ =====
function saveGame() {
    localStorage.setItem('clickerGame_v1', JSON.stringify({
        score: gameState.score,
        clickPower: gameState.clickPower,
        autoClickers: gameState.autoClickers,
        multiplier: gameState.multiplier
    }));
    
    localStorage.setItem('clickerShop_v1', JSON.stringify({
        click: { owned: shopConfig.click.owned },
        auto: { owned: shopConfig.auto.owned },
        multiplier: { owned: shopConfig.multiplier.owned }
    }));
}

// ===== ОБНОВЛЕНИЕ UI =====
function updateUI() {
    // Счёт
    document.getElementById('score').textContent = Math.floor(gameState.score);
    
    // За клик
    const clickValue = gameState.clickPower * gameState.multiplier;
    document.getElementById('clickPower').textContent = clickValue;
    
    // В секунду
    const passiveValue = gameState.autoClickers * gameState.multiplier;
    document.getElementById('passiveIncome').textContent = passiveValue;
    
    // Магазин
    updateShop();
}

// ===== ОБНОВЛЕНИЕ МАГАЗИНА =====
function updateShop() {
    ['click', 'auto', 'multiplier'].forEach(type => {
        const price = getPrice(type);
        const priceEl = document.getElementById(`price-${type}`);
        const ownedEl = document.getElementById(`owned-${type}`);
        const btn = document.getElementById(`btn-${type}`);
        
        if (priceEl) priceEl.textContent = price;
        if (ownedEl) ownedEl.textContent = shopConfig[type].owned;
        if (btn) btn.disabled = gameState.score < price;
    });
}

// ===== ЭФФЕКТ КЛИКА =====
function showClickEffect(text) {
    const effect = document.getElementById('clickEffect');
    if (!effect) return;
    effect.textContent = text || '+1';
    effect.classList.remove('show');
    void effect.offsetWidth;
    effect.classList.add('show');
}

// ===== КЛИК =====
function handleClick() {
    const points = gameState.clickPower * gameState.multiplier;
    gameState.score += points;
    showClickEffect(`+${points}`);
    updateUI();
    saveGame();
    
    // Комбо
    comboState.count++;
    updateCombo();
    
    if (navigator.vibrate) {
        navigator.vibrate(10);
    }
}

// ===== КОМБО =====
function updateCombo() {
    const comboEl = document.getElementById('comboCounter');
    if (!comboEl) return;
    
    if (comboState.count > 1) {
        comboEl.textContent = `🔥 x${comboState.count}`;
        comboEl.classList.add('show');
    } else {
        comboEl.classList.remove('show');
    }
    
    clearTimeout(comboState.timer);
    comboState.timer = setTimeout(() => {
        comboState.count = 0;
        comboEl.classList.remove('show');
    }, 2000);
}

// ===== АВТОКЛИКЕР =====
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

// ===== ПОКУПКА =====
function buyItem(type) {
    const price = getPrice(type);
    
    if (gameState.score < price) {
        showNotification('❌ Недостаточно средств!');
        return false;
    }

    gameState.score -= price;
    shopConfig[type].owned++;

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

// ===== УВЕДОМЛЕНИЯ =====
function showNotification(message) {
    const old = document.querySelector('.notification');
    if (old) old.remove();

    const notif = document.createElement('div');
    notif.className = 'notification';
    notif.textContent = message;
    document.body.appendChild(notif);

    setTimeout(() => {
        notif.classList.add('hide');
        setTimeout(() => notif.remove(), 400);
    }, 2000);
}

// ===== ИНИЦИАЛИЗАЦИЯ =====
function init() {
    loadGame();

    document.getElementById('clickButton').addEventListener('click', handleClick);
    
    document.querySelectorAll('.buy-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const type = this.dataset.type;
            buyItem(type);
        });
    });

    updateUI();

    tg.onEvent('viewportChanged', () => {
        saveGame();
    });
}

document.addEventListener('DOMContentLoaded', init);