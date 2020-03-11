const CronJob = require('cron');
const Parser = require('rss-parser');
const moment = require('moment');
const parser = new Parser();
const Telegraf = require('telegraf');

const log = message => {
    const now = moment().format('YY-MM-D HH:m');
    console.log(now + ': ' + message);
};

const subs = [];
let latestExams = [];
let latestPostContent = '';

const bot = new Telegraf(process.env.BOT_TOKEN);
bot.start((ctx) => {
    subs.push(ctx.chat.id);
    ctx.reply('Hey! I\'m gonna keep you updated on the latest released grades on jExam!')
});
bot.launch();

const getExams = async () => {
    let feed = await parser.parseURL('https://feeds.feedburner.com/jExam?');
    const first = feed.items[0];

    if (!first.title.includes('Prüfungsergebnisse')) {
        log('no Prüfungsergebnisse');
        return;
    }

    if (first.content === latestPostContent) {
        log('no updates');
        return;
    }

    const regex = /((?:<li>.*?<\/li>))/ig;
    const listItems = first.content.match(regex);
    const entries = listItems.map(li => li
        .replace('<li>', '')
        .replace('</li>', ''))
        .filter(li => li.startsWith('INF'));
    const newEntries = entries.filter(e => !latestExams.includes(e));
    log('new results');
    log(newEntries);
    const examsString = newEntries.join(' <br />');
    const message = '🚨 New Exam Results Released! 🚨 <br />' + examsString +  '<a hre="https://jexam.inf.tu-dresden.de/">Open jExam</a>';

    subs.map(subscriber => {
        bot.telegram.sendMessage(subscriber, message, {parse_mode: 'HTML'});
    });

    // reset values for next run
    latestExams = entries;
    latestPostContent = first.content;
};

// every hour between 8am and 8pm on mo-fri
const job = new CronJob.CronJob('0 8-20 * * 1-5', function() {
    getExams();
});

job.start();
