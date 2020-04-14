import TelegramBot from 'node-telegram-bot-api';
import config from 'config';
import users from '../database/users.js';
import restClient from '../restclient/restclient.js';

export default class UahTelegramBot {
  constructor() {
    const token = config.get('telegram.token');

    // Create a bot that uses 'polling' to fetch new updates
    this.bot = new TelegramBot(token, { polling: true });

    this.bot.onText(/\/start/, this.addUser.bind(this));
    this.bot.onText(/\/stop/, this.removeUser.bind(this));
    this.bot.onText(/\/current/, this.getCurrentRate.bind(this));
  }

  addUser(msg) {
    const chatId = msg.chat.id;

    users.addUser({
      chatId,
      firstName: msg.from.first_name,
      preferences: {}
    });
    this.bot.sendMessage(chatId, config.get('telegram.text.welcome'));
  }

  removeUser(msg) {
    const chatId = msg.chat.id;

    users.removeUser(chatId);
    this.bot.sendMessage(chatId, config.get('telegram.text.goodbye'));
  }

  getCurrentRate(msg) {
    restClient
      .getCurrentState()
      .then((rates) =>
        this.bot.sendMessage(
          msg.chat.id,
          rates
            .map(
              (
                {
                  latest: { currency, ask, bid, pointDate, askTrend, bidTrend }
                },
                index,
                all
              ) =>
                `${currency.toUpperCase()}: ${ask} ${getTrend(
                  askTrend
                )} ${bid} ${getTrend(bidTrend)}${
                  index === all.length - 1
                    ? `\nОстаннє оновлення: ${pointDate}`
                    : ''
                }`
            )
            .join('\n')
        )
      )
      .catch((err) => {
        console.error(err);
        this.bot.sendMessage(msg.chat.id, 'Помилка :(');
      });
  }
}

function getTrend(value) {
  if (value === 0) {
    return '(0)';
  }

  return value > 0 ? `(+${value})` : `(-${value})`;
}
