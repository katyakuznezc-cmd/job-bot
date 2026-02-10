const { Telegraf, Scenes, session } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);

const recruitWizard = new Scenes.WizardScene(
    'RECRUIT_SCENE',
    // 1. Имя
    (ctx) => {
        ctx.reply('👋 Привет! Давай заполним анкету на вакансию.\n\nКак тебя зовут? (ФИО)');
        return ctx.wizard.next();
    },
    // 2. Возраст
    (ctx) => {
        ctx.wizard.state.name = ctx.message.text;
        ctx.reply('Сколько тебе полных лет?');
        return ctx.wizard.next();
    },
    // 3. Опыт
    (ctx) => {
        ctx.wizard.state.age = ctx.message.text;
        ctx.reply('Какой у тебя опыт работы в арбитраже/крипте?');
        return ctx.wizard.next();
    },
    // 4. Контакты (НОВОЕ)
    (ctx) => {
        ctx.wizard.state.experience = ctx.message.text;
        ctx.reply('Оставь свои контакты для связи (номер телефона или юзернейм в Telegram):');
        return ctx.wizard.next();
    },
    // Финал
    async (ctx) => {
        const contacts = ctx.message.text;
        const { name, age, experience } = ctx.wizard.state;
        const user = ctx.from.username ? `@${ctx.from.username}` : `ID: ${ctx.from.id}`;
        
        const report = `🔥 НОВАЯ АНКЕТА!\n\n👤 Имя: ${name}\n🎂 Возраст: ${age}\n💼 Опыт: ${experience}\n📞 Контакты: ${contacts}\n🔗 Профиль: ${user}`;

        try {
            await ctx.telegram.sendMessage(process.env.ADMIN_ID, report);
            await ctx.reply('✅ Спасибо! Твои контакты переданы менеджеру. Ожидай звонка или сообщения в ближайшее время.');
        } catch (err) {
            console.error('Ошибка:', err);
            await ctx.reply('❌ Ошибка отправки. Напиши менеджеру напрямую.');
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
