const { Telegraf, Scenes, session } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);

const recruitWizard = new Scenes.WizardScene(
    'RECRUIT_SCENE',
    (ctx) => {
        ctx.reply('👋 Привет! Давай заполним анкету на вакансию.\n\nКак тебя зовут? (ФИО)');
        return ctx.wizard.next();
    },
    (ctx) => {
        ctx.wizard.state.name = ctx.message.text;
        ctx.reply('Сколько тебе полных лет?');
        return ctx.wizard.next();
    },
    (ctx) => {
        ctx.wizard.state.age = ctx.message.text;
        ctx.reply('Какой у тебя опыт работы в арбитраже/крипте?');
        return ctx.wizard.next();
    },
    (ctx) => {
        ctx.wizard.state.experience = ctx.message.text;
        ctx.reply('Оставь свои контакты для связи (номер телефона или юзернейм в Telegram):');
        return ctx.wizard.next();
    },
    async (ctx) => {
        const contacts = ctx.message.text;
        const { name, age, experience } = ctx.wizard.state;
        const adminId = process.env.ADMIN_ID; // Берем ID из настроек Vercel
        
        // ПРОВЕРКА: Если ты забыл добавить переменную в Vercel
        if (!adminId) {
            return ctx.reply('❌ Ошибка: В настройках Vercel не найден ADMIN_ID. Проверь Environment Variables!');
        }

        const report = `🔥 НОВАЯ АНКЕТА!\n\n👤 Имя: ${name}\n🎂 Возраст: ${age}\n💼 Опыт: ${experience}\n📞 Контакты: ${contacts}`;

        try {
            // Пытаемся отправить отчет тебе
            await ctx.telegram.sendMessage(adminId, report);
            await ctx.reply('✅ Спасибо! Твои контакты переданы менеджеру. Ожидай звонка или сообщения.');
        } catch (err) {
            // Если Telegram не разрешил отправить сообщение
            console.error(err);
            await ctx.reply(`❌ Ошибка Telegram: ${err.description || 'Бот не может написать админу. Ты нажал Start у бота?'}`);
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
        } catch (err) {
            res.status(500).send('Error');
        }
    } else {
        res.status(200).send('Bot Status: Online');
    }
};
