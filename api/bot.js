const { Telegraf, Scenes, session, Markup } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);

const recruitWizard = new Scenes.WizardScene(
    'RECRUIT_SCENE',
    // 1. Приветствие
    (ctx) => {
        ctx.reply('👋 Привет! Рады, что ты решил присоединиться к команде.\n\nКак тебя зовут? (ФИО)');
        return ctx.wizard.next();
    },
    // 2. Возраст
    (ctx) => {
        ctx.wizard.state.name = ctx.message.text;
        ctx.reply('Сколько тебе полных лет?');
        return ctx.wizard.next();
    },
    // 3. Опыт (КНОПКИ)
    (ctx) => {
        ctx.wizard.state.age = ctx.message.text;
        ctx.reply('Какой у тебя опыт в арбитраже/крипте?', Markup.inlineKeyboard([
            [Markup.button.callback('Новичок (0-6 мес)', 'exp_low')],
            [Markup.button.callback('Средний (от 1 года)', 'exp_mid')],
            [Markup.button.callback('Профи (Топ)', 'exp_high')]
        ]));
        return ctx.wizard.next();
    },
    // 4. Контакты
    (ctx) => {
        // Сохраняем текст из кнопки или обычный ввод
        ctx.wizard.state.experience = ctx.callbackQuery ? ctx.callbackQuery.data : ctx.message.text;
        ctx.reply('Оставь свои контакты (номер или @username):');
        return ctx.wizard.next();
    },
    // Финал
    async (ctx) => {
        const contacts = ctx.message.text;
        const { name, age, experience } = ctx.wizard.state;
        const adminId = process.env.ADMIN_ID;
        const time = new Date().toLocaleString('ru-RU', { timeZone: 'Europe/Moscow' });
        
        // Красивое оформление для админа
        const report = `
🆕 <b>НОВАЯ АНКЕТА</b>
──────────────────
👤 <b>ФИО:</b> ${name}
🎂 <b>Возраст:</b> ${age}
📊 <b>Опыт:</b> ${experience}
📞 <b>Связь:</b> <code>${contacts}</code>
──────────────────
⏰ <i>Время: ${time} (МСК)</i>
🔗 <b>Профиль:</b> @${ctx.from.username || 'скрыт'}`;

        try {
            await ctx.telegram.sendMessage(adminId, report, { parse_mode: 'HTML' });
            await ctx.reply('✅ Спасибо! Твоя заявка принята. Менеджер свяжется с тобой в ближайшее время.');
        } catch (err) {
            await ctx.reply('❌ Ошибка при отправке. Попробуй позже.');
        }
        return ctx.scene.leave();
    }
);

const stage = new Scenes.Stage([recruitWizard]);
bot.use(session());
bot.use(stage.middleware());

// Обработка кнопок опыта, чтобы сцена не ломалась
bot.action(/exp_(.*)/, (ctx) => {
    const mapping = { 'exp_low': 'Новичок', 'exp_mid': 'Средний', 'exp_high': 'Профи' };
    ctx.wizard.state.experience = mapping[ctx.match[1]];
    ctx.answerCbQuery();
    ctx.reply(`Выбрано: ${mapping[ctx.match[1]]}. Теперь оставь свои контакты:`);
    return ctx.wizard.next();
});

bot.start((ctx) => ctx.scene.enter('RECRUIT_SCENE'));

module.exports = async (req, res) => {
    if (req.method === 'POST') {
        await bot.handleUpdate(req.body);
        res.status(200).send('OK');
    } else {
        res.status(200).send('Bot is ready');
    }
};
