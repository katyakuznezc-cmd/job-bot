const { Telegraf, Scenes, session } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);

const recruitWizard = new Scenes.WizardScene(
    'RECRUIT_SCENE',
    (ctx) => {
        ctx.reply('👋 Привет! Как тебя зовут?');
        return ctx.wizard.next();
    },
    (ctx) => {
        ctx.wizard.state.name = ctx.message.text;
        ctx.reply('Сколько тебе лет?');
        return ctx.wizard.next();
    },
    (ctx) => {
        ctx.wizard.state.age = ctx.message.text;
        ctx.reply('Какой у тебя опыт работы?');
        return ctx.wizard.next();
    },
    async (ctx) => {
        const experience = ctx.message.text;
        const { name, age } = ctx.wizard.state;
        const user = ctx.from.username ? `@${ctx.from.username}` : `ID: ${ctx.from.id}`;
        
        const report = `🔥 Новая анкета!\n👤 Имя: ${name}\n🎂 Возраст: ${age}\n💼 Опыт: ${experience}\n🔗 Контакт: ${user}`;

        await ctx.telegram.sendMessage(process.env.ADMIN_ID, report);
        await ctx.reply('✅ Данные отправлены!');
        return ctx.scene.leave();
    }
);

const stage = new Scenes.Stage([recruitWizard]);
bot.use(session());
bot.use(stage.middleware());
bot.start((ctx) => ctx.scene.enter('RECRUIT_SCENE'));

module.exports = async (req, res) => {
    if (req.method === 'POST') {
        await bot.handleUpdate(req.body);
        res.status(200).send('OK');
    } else {
        res.status(200).send('Bot Online');
    }
};
