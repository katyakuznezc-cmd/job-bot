const { Telegraf, Scenes, session, Markup } = require('telegraf');

const bot = new Telegraf(process.env.BOT_TOKEN);

const recruitWizard = new Scenes.WizardScene(
    'RECRUIT_SCENE',
    (ctx) => {
        ctx.reply('👋 Привіт! Починаємо заповнення анкети.\n\nЯк тебе звати? (ПІБ)');
        return ctx.wizard.next();
    },
    (ctx) => {
        ctx.wizard.state.name = ctx.message.text;
        ctx.reply('Скільки тобі повних років?');
        return ctx.wizard.next();
    },
    (ctx) => {
        ctx.wizard.state.age = ctx.message.text;
        ctx.reply('З якого ти міста?');
        return ctx.wizard.next();
    },
    (ctx) => {
        ctx.wizard.state.city = ctx.message.text;
        ctx.reply('Де раніше навчався або працював?');
        return ctx.wizard.next();
    },
    (ctx) => {
        ctx.wizard.state.past_experience = ctx.message.text;
        ctx.reply('Який у тебе досвід роботи з ПК?');
        return ctx.wizard.next();
    },
    (ctx) => {
        ctx.wizard.state.pc_experience = ctx.message.text;
        ctx.reply('Залиш свій контакт для зв\'язку (номер телефону або @username):');
        return ctx.wizard.next();
    },
    async (ctx) => {
        const userContactInput = ctx.message.text;
        const { name, age, city, past_experience, pc_experience } = ctx.wizard.state;
        
        // Отримуємо ID обох адмінів
        const adminId1 = process.env.ADMIN_ID;
        const adminId2 = process.env.ADMIN_ID_2;

        const date = new Date();
        const kyivTime = date.toLocaleString("uk-UA", {timeZone: "Europe/Kiev"});
        const isPremium = ctx.from.is_premium ? '🌟 Так' : '❌ Ні';

        const report = `
📅 <b>НОВА АНКЕТА [${kyivTime}]</b>
━━━━━━━━━━━━━━━━━━
👤 <b>ПІБ:</b> ${name}
🎂 <b>Вік:</b> ${age}
📍 <b>Місто:</b> ${city}
🎓 <b>Минуле (навч/роб):</b> ${past_experience}
💻 <b>Досвід з ПК:</b> ${pc_experience}
━━━━━━━━━━━━━━━━━━
📞 <b>КОНТАКТ:</b> <code>${userContactInput}</code>
━━━━━━━━━━━━━━━━━━
🛡 <b>АККАУНТ:</b>
● <b>Premium:</b> ${isPremium}
● <b>Username:</b> @${ctx.from.username || 'приховано'}
● <b>ID:</b> <code>${ctx.from.id}</code>`;

        try {
            let keyboard = [];
            if (ctx.from.username) {
                keyboard.push([Markup.button.url('🚀 ПЕРЕЙТИ ДО ЧАТУ', `https://t.me/${ctx.from.username}`)]);
            }

            // Функція для відправки повідомлення адміну
            const sendToAdmin = async (id) => {
                if (id) {
                    await ctx.telegram.sendMessage(id, report, { 
                        parse_mode: 'HTML',
                        ...Markup.inlineKeyboard(keyboard)
                    });
                }
            };

            // Відправляємо обом
            await Promise.all([
                sendToAdmin(adminId1),
                sendToAdmin(adminId2)
            ]);

            await ctx.reply('✅ Дякуємо! Твої дані надіслані менеджерам. Чекай на відповідь!');
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
        res.status(200).send('Online');
    }
};
