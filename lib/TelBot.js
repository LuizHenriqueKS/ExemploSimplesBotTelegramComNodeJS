const axios = require('axios');

class TelBot {
  constructor(token) {
    this.delayUpdates = 3000;
    this.listening = false;
    this.token = token;
    this.cmds = [];
  }

  listen() {
    const it = this;
    return new Promise((resolve, reject) => {
      const url = this.buildUrl('getMe');
      axios
        .get(url)
        .then(evt => {
          it.username = evt.data.result.username;
          it.listening = true;
          it.listenUpdates({ keep: true, ignoreFirstMessages: true });
          resolve(evt.data);
        })
        .catch(evt => reject(evt));
    });
  }

  listenUpdates(args) {
    const it = this;
    const offset = (args && args.offset) ? args.offset : undefined;
    this.getUpdates({ offset }).then(evt => {
      if (!evt.result) {
        console.warn('[getUpdates]', evt);
      } else if (evt.result.length > 0) {
        args.offset = evt.result[evt.result.length - 1].update_id;
        if (!args || !args.ignoreFirstMessages) {
          const msgs = evt.result.filter(update => update.message).map(update => update.message);
          it.readMsgs(msgs);
        }
      }
      if (args && args.keep && it.listening) {
        args.ignoreFirstMessages = false;
        setTimeout(() => it.listenUpdates(args), it.delayUpdates);
      }
    });
  }

  getUpdates(args) {
    return new Promise((resolve, reject) => {
      const endPoint = (args && args.offset) ? `getUpdates?offset=${args.offset + 1}` : 'getUpdates';
      const url = this.buildUrl(endPoint);
      axios
        .get(url)
        .then(evt => {
          resolve(evt.data);
        })
        .catch(evt => {
          resolve(evt.data || { result: false });
        });
    });
  }

  addCmd(cmdName, listener) {
    this.cmds.push({ cmdName, listener });
  }

  getCmd(cmdName) {
    return this.cmds.find(cmd => cmd.cmdName === cmdName);
  }

  getCmdName(text) {
    let cmdName = text;
    if (cmdName.indexOf(' ') > -1) {
      cmdName = cmdName.split(' ')[0];
    }
    if (cmdName.indexOf('@') > -1) {
      cmdName = cmdName.split('@')[0];
    }
    return cmdName.substr(1);
  }

  buildReply(msg) {
    const it = this;
    return (text) => {
      const url = it.buildUrl('sendMessage');
      const data = { text, chat_id: msg.chat.id, reply_to_message_id: msg.message_id };
      console.log(`@${it.username}:`, text);
      axios.post(url, data).then();
    };
  }

  readMsgs(msgs) {
    for (const msg of msgs) {
      if (msg.text) {
        const name = msg.from.first_name || msg.from.username;
        console.log(`$${name}:`, msg.text);
        this.fireCmds(msg);
      }
    }
  }

  fireCmds(msg) {
    if (msg.text.indexOf('/') === 0) { // VERIFICA SE É UM COMANDO
      const cmdName = this.getCmdName(msg.text);
      const cmd = this.getCmd(cmdName);
      if (cmd) {
        cmd.listener({ msg, reply: this.buildReply(msg) });
      } else {
        console.warn('Comando não encontrado:', cmdName);
      }
    }
  }

  buildUrl(relativePath) {
    return new URL(relativePath, `https://api.telegram.org/bot${this.token}/`).toString();
  }
}

module.exports = TelBot;
