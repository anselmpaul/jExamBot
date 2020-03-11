const CronJob = require('cron');
const Parser = require('rss-parser');
const moment = require('moment');
const parser = new Parser();

const log = message => {
    const now = moment().format('YY-MM-D HH:m');
    console.log(now + ': ' + message);
};

const job = new CronJob.CronJob('* * * * *', function() {
    getExams();
});

let latestExams = [];
let latestPostContent = '';

job.start();

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

    // reset values for next run
    latestExams = entries;
    latestPostContent = first.content;
};
