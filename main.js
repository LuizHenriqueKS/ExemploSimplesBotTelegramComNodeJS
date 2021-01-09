const TelBot = require('./lib/TelBot.js');
const BOT_TOKEN = process.env.BOT_TOKEN;

if (!BOT_TOKEN) {
  console.error('É preciso definir o token do bot como um variável de ambiente (BOT_TOKEN).');
}

const myBot = new TelBot(BOT_TOKEN);

myBot.addCmd('ping', evt => evt.reply('Pong!'));
myBot.addCmd('hello', evt => evt.reply('Hello my friend!'));

myBot.listen().then(evt => {
  console.log('Bot iniciado com sucesso:', evt.result.username);
});
