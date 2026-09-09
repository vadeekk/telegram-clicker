const TelegramBot = require('node-telegram-bot-api');
//require('dotenv').config();

//const token = process.env.BOT_TOKEN;
const token = '8637346424:AAH7I-65IsjNQX_s7fZqHa2MAkqrqcgahuQ';
const bot = new TelegramBot(token, { polling: true });

const webAppUrl = 'https://web.telegram.org/k/#@klicker_laba9_bot'; // Замени на свой URL

bot.onText(/\/start/, (msg) => {
    const chatId = msg.chat.id;
    
    bot.sendMessage(chatId, '🎮 Добро пожаловать в игру-кликер!', {
        reply_markup: {
            inline_keyboard: [
                [
                    {
                        text: '🚀 Играть',
                        web_app: { url: webAppUrl }
                    }
                ],
                [
                    {
                        text: '📊 Статистика',
                        callback_data: 'stats'
                    }
                ]
            ]
        }
    });
});

bot.on('callback_query', (query) => {
    const chatId = query.message.chat.id;
    
    if (query.data === 'stats') {
        bot.sendMessage(chatId, '📊 Статистика игры:\n\n' +
            '• Топ игроков скоро будет добавлен\n' +
            '• Продолжай кликать! 🎯'
        );
    }
    
    bot.answerCallbackQuery(query.id);
});

console.log('Бот запущен!');