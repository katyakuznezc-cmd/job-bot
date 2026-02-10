const { Telegraf, Scenes, session, Markup } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);

const recruitWizard = new Scenes.WizardScene(
    'RECRUIT_SCENE',
    // 1. Имя
    (ctx) => {
        ctx.reply('👋 Привет! Начинаем заполнение анкеты.\n\nКак тебя зовут? (ФИО)');
        return ctx.wizard.next();
    },
    // 2. Возраст
    (ctx) => {
        ctx.wizard.state.name = ctx.message.text;
        ctx.reply('Сколько тебе полных лет?');
        return ctx.wizard.next();
    },
    // 3. Опыт (ТЕПЕРЬ ПРОСТО ТЕКСТ)
    (ctx) => {
        ctx.wizard.state.age = ctx.message.text;
        ctx.reply('Расскажи о своем опыте в арбитраже или крипте:');
        return ctx.wizard.next();
    },
    // 4. Контакт
    (ctx) => {
        ctx.wizard.state.experience = ctx.message.text;
        ctx.reply('Оставь свой контакт для связи (номер телефона или @username):');
        return ctx.wizard.next();
    },
    // Финал и отчет
    async (ctx) => {
        const userContactInput = ctx.message.text;
        const { name, age, experience } = ctx.wizard.state;
        const adminId = process.env.ADMIN_ID;

        // Определяем время подачи (МСК)
        const date = new Date();
        const moscowTime = date.toLocaleString("ru-RU", {timeZone: "Europe/Moscow"});
        const isPremium = ctx.from.is_premium ? '🌟 Да' : '❌ Нет';

        const report = `
📅 <b>НОВАЯ ЗАЯВКА [${moscowTime}]</b>
━━━━━━━━━━━━━━━━━━
👤 <b>ФИО:</b> ${name}
🎂 <b>Возраст:</b> ${age}
💼 <b>Опыт:</b> ${experience}
━━━━━━━━━━━━━━━━━━
📞 <b>ОСТАВЛЕННЫЙ КОНТАКТ:</b> 
<code>${userContactInput}</code>
━━━━━━━━━━━━━━━━━━
🛡 <b>ИНФО ОБ АККАУНТЕ:</b>
● <b>Premium:</b> ${isPremium}
● <b>Username:</b> @${ctx.from.username || 'скрыт'}
● <b>ID:</b> <code>${ctx.from.id}</code>`;

        try {
            let keyboard = [];
            if (ctx.from.username) {
                keyboard.push([Markup.button.url('🚀 ПЕРЕЙТИ В ПРОФИЛЬ', `https://t.me/${ctx.from.username}`)]);
            }

            await ctx.telegram.sendMessage(adminId, report, { 
                parse_mode: 'HTML',
                ...Markup.inlineKeyboard(keyboard)
            });

            await ctx.reply('✅ Спасибо! Твои данные успешно отправлены менеджеру. Ожидай ответа в ближайшее время.');
        } catch (err) {
            console.error('Ошибка отправки:', err);
        }
        return ctx.scene.leave();
    }
);

const stage = new Scenes.Stage([recruitWizard]);
bot.use(session());
bot.use(stage.middleware());

bot.start((ctx) => ctx.scene.enter('RECRUIT_SCENE'));

module.exports = async (req, res) => {
    if (req.method === 'POST') {
        try {
            await bot.handleUpdate(req.body);
            res.status(200).send('OK');
        } catch (err) { res.status(500).send('Error'); }
    } else {
        res.status(200).send('Bot Status: Online');
    }
};
