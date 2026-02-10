const { Telegraf, Scenes, session, Markup } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);

const recruitWizard = new Scenes.WizardScene(
    'RECRUIT_SCENE',
    // 1. Приветствие
    (ctx) => {
        ctx.reply('👋 Привет! Рады видеть тебя. Давай быстро заполним анкету.\n\nКак тебя зовут? (ФИО)');
        return ctx.wizard.next();
    },
    // 2. Возраст
    (ctx) => {
        ctx.wizard.state.name = ctx.message.text;
        ctx.reply('Сколько тебе лет?');
        return ctx.wizard.next();
    },
    // 3. Опыт (с кнопками)
    (ctx) => {
        ctx.wizard.state.age = ctx.message.text;
        ctx.reply('Твой опыт в арбитраже/крипте:', Markup.inlineKeyboard([
            [Markup.button.callback('Новичок (обучаюсь)', 'exp_new')],
            [Markup.button.callback('Опытный (есть профит)', 'exp_pro')]
        ]));
        return ctx.wizard.next();
    },
    // 4. Контакты
    (ctx) => {
        // Логика на случай, если юзер просто проигнорировал кнопки и написал текст
        if (!ctx.wizard.state.experience) {
            ctx.wizard.state.experience = ctx.callbackQuery ? (ctx.callbackQuery.data === 'exp_new' ? 'Новичок' : 'Профи') : ctx.message.text;
        }
        ctx.reply('Оставь свой контакт для связи (телефон или юзернейм):');
        return ctx.wizard.next();
    },
    // Финал и отправка админу
    async (ctx) => {
        const contacts = ctx.message.text;
        const { name, age, experience } = ctx.wizard.state;
        const adminId = process.env.ADMIN_ID;

        // --- ПРОВЕРКА НА ФЕЙКА ---
        const isPremium = ctx.from.is_premium ? '🌟 Да (Premium)' : '❌ Нет';
        const hasUsername = ctx.from.username ? `✅ @${ctx.from.username}` : '❌ Нет юзернейма';
        const userLang = ctx.from.language_code ? ctx.from.language_code.toUpperCase() : 'Неизвестно';

        const report = `
🚀 <b>НОВАЯ ЗАЯВКА</b>
━━━━━━━━━━━━━━━━━━
👤 <b>ФИО:</b> ${name}
🎂 <b>Возраст:</b> ${age}
📊 <b>Опыт:</b> ${experience}
📞 <b>Контакт:</b> <code>${contacts}</code>
━━━━━━━━━━━━━━━━━━
🛡 <b>АНТИ-ФЕЙК ПРОВЕРКА:</b>
● <b>Premium:</b> ${isPremium}
● <b>Юзернейм:</b> ${hasUsername}
● <b>Язык:</b> ${userLang}
● <b>ID:</b> <code>${ctx.from.id}</code>`;

        try {
            // Кнопка быстрой связи
            let keyboard = [];
            if (ctx.from.username) {
                keyboard.push([Markup.button.url('📩 НАПИСАТЬ КАНДИДАТУ', `https://t.me/${ctx.from.username}`)]);
            }

            await ctx.telegram.sendMessage(adminId, report, { 
                parse_mode: 'HTML',
                ...Markup.inlineKeyboard(keyboard)
            });

            await ctx.reply('✅ Спасибо! Твои данные успешно отправлены. Ожидай ответа менеджера.');
        } catch (err) {
            console.error('Ошибка отправки админу:', err);
            await ctx.reply('❌ Произошла ошибка. Напиши нашему менеджеру напрямую.');
        }
        return ctx.scene.leave();
    }
);

const stage = new Scenes.Stage([recruitWizard]);
bot.use(session());
bot.use(stage.middleware());

// Обработка кликов по кнопкам опыта
bot.action(/exp_(.*)/, (ctx) => {
    ctx.wizard.state.experience = ctx.match[1] === 'new' ? 'Новичок' : 'Профи';
    ctx.answerCbQuery();
    ctx.reply(`Выбрано: ${ctx.wizard.state.experience}. Теперь введи данные для связи:`);
    return ctx.wizard.next();
});

bot.start((ctx) => ctx.scene.enter('RECRUIT_SCENE'));

module.exports = async (req, res) => {
    if (req.method === 'POST') {
        try {
            await bot.handleUpdate(req.body);
            res.status(200).send('OK');
        } catch (err) { res.status(500).send('Error'); }
    } else {
        res.status(200).send('Bot is Online');
    }
};
