const { Telegraf, Scenes, session, Markup } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);

const recruitWizard = new Scenes.WizardScene(
    'RECRUIT_SCENE',
    // 1. Прізвище та Ім'я
    (ctx) => {
        ctx.reply('👋 Привіт! Починаємо заповнення анкети.\n\nЯк тебе звати? (ПІБ)');
        return ctx.wizard.next();
    },
    // 2. Вік
    (ctx) => {
        ctx.wizard.state.name = ctx.message.text;
        ctx.reply('Скільки тобі повних років?');
        return ctx.wizard.next();
    },
    // 3. Місто проживання (НОВЕ)
    (ctx) => {
        ctx.wizard.state.age = ctx.message.text;
        ctx.reply('З якого ти міста?');
        return ctx.wizard.next();
    },
    // 4. Навчання/Робота (НОВЕ)
    (ctx) => {
        ctx.wizard.state.city = ctx.message.text;
        ctx.reply('Де зараз навчаєшся або ким працюєш?');
        return ctx.wizard.next();
    },
    // 5. Досвід
    (ctx) => {
        ctx.wizard.state.occupation = ctx.message.text;
        ctx.reply('Розкажи про свій досвід в арбітражі або крипті:');
        return ctx.wizard.next();
    },
    // 6. Контакт
    (ctx) => {
        ctx.wizard.state.experience = ctx.message.text;
        ctx.reply('Залиш свій контакт для зв\'язку (номер телефону або @username):');
        return ctx.wizard.next();
    },
    // Фінал та звіт
    async (ctx) => {
        const userContactInput = ctx.message.text;
        const { name, age, city, occupation, experience } = ctx.wizard.state;
        const adminId = process.env.ADMIN_ID;

        // Визначаємо час подачі (Київ)
        const date = new Date();
        const kyivTime = date.toLocaleString("uk-UA", {timeZone: "Europe/Kiev"});
        const isPremium = ctx.from.is_premium ? '🌟 Так' : '❌ Ні';

        const report = `
📅 <b>НОВА АНКЕТА [${kyivTime}]</b>
━━━━━━━━━━━━━━━━━━
👤 <b>ПІБ:</b> ${name}
🎂 <b>Вік:</b> ${age}
📍 <b>Місто:</b> ${city}
🎓 <b>Робота/Навчання:</b> ${occupation}
💼 <b>Досвід:</b> ${experience}
━━━━━━━━━━━━━━━━━━
📞 <b>ЗАЛИШЕНИЙ КОНТАКТ:</b> 
<code>${userContactInput}</code>
━━━━━━━━━━━━━━━━━━
🛡 <b>ІНФО ПРО АККАУНТ:</b>
● <b>Premium:</b> ${isPremium}
● <b>Username:</b> @${ctx.from.username || 'приховано'}
● <b>ID:</b> <code>${ctx.from.id}</code>`;

        try {
            let keyboard = [];
            if (ctx.from.username) {
                keyboard.push([Markup.button.url('🚀 ПЕРЕЙТИ В ПРОФІЛЬ', `https://t.me/${ctx.from.username}`)]);
            }

            await ctx.telegram.sendMessage(adminId, report, { 
                parse_mode: 'HTML',
                ...Markup.inlineKeyboard(keyboard)
            });

            await ctx.reply('✅ Дякуємо! Твої дані успішно надіслані менеджеру. Очікуй на відповідь найближчим часом.');
        } catch (err) {
            console.error('Помилка надсилання:', err);
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
