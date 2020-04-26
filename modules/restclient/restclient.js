import fetch from 'node-fetch';
import config from 'config';
import cron from 'node-cron';
import sortBy from 'lodash/sortBy.js';
import sumBy from 'lodash/sumBy.js';
import max from 'lodash/max.js';
import min from 'lodash/min.js';
import keyBy from 'lodash/keyBy.js';
import groupBy from 'lodash/groupBy.js';
import moment from 'moment-timezone';
import rates from '../database/rates.js';
import users from '../database/users.js';
import logger from '../utils/logger.js';

class RestClient {
  constructor(bot) {
    this.state = [];
    this.bot = bot;
    this.parseMBResult = this.parseMBResult.bind(this);
    this.fetchData = this.fetchData.bind(this);
    this.fetchHistory = this.fetchHistory.bind(this);
    this.updateState = this.updateState.bind(this);
    this.updateMetrics = this.updateMetrics.bind(this);
  }

  async fetchData(date) {
    try {
      const url = config.get('api.mburl');
      const token = config.get('api.token');

      logger.info(`${new moment().format()}: Fetch triggered`);

      const response = await fetch(
        `${url}/${token}/${date ? `${date}/` : ''}`,
        {
          headers: {
            'user-agent': 'FollowUahBot/1.0 (https://t.me/FollowUahBot)'
          }
        }
      );
      const json = await response.json();

      if (!json.length) {
        return [];
      }

      const nextState = this.parseMBResult(json);

      if (
        !this.state ||
        !this.state.length ||
        !this.state[0].pointDate.isSame(nextState[0].pointDate)
      ) {
        nextState.forEach(rates.addRate, rates);
      }

      return nextState;
    } catch (e) {
      logger.error(e);
    }
  }

  async fetchHistory() {
    if (!this.nextHistory) {
      this.nextHistory = await rates.getEarliestDate();
    }

    logger.info(`${new moment().format()}: Fetch history triggered`);
    this.nextHistory.add(-1, 'd');
    const result = await this.fetchData(this.nextHistory.format('YYYY-MM-DD'));
    logger.info(`Got data for ${this.nextHistory.format('YYYY-MM-DD')}`);

    if (!config.get('api.getHistory')) {
      this.historyUpdates.stop();
    }
    return result;
  }

  start() {
    const that = this;
    const options = {
      scheduled: true,
      timezone: config.get('default_timezone')
    };

    this.updates = cron.schedule(
      '30 10-18 * * 1-5',
      () => this.fetchData().then(this.updateState),
      options
    );

    if (config.get('api.getHistory')) {
      this.historyUpdates = cron.schedule(
        '30 0-9,19-23 * * *',
        this.fetchHistory,
        options
      );
    }

    rates.getLatestDates(2).then((response) => {
      const today = response[0].date;
      const yesterday = response[response.length - 1].date;

      that.state = response.filter((r) => r.date.isSame(today));
      that.stateYesterday = response.filter((r) => r.date.isSame(yesterday));

      if (
        that.state[0].pointDate.add(2, 'h').isBefore(new moment()) &&
        new moment().hour() > 9 &&
        new moment().hour() < 19
      ) {
        that.fetchData().then(that.updateState);
      }
    });
  }

  parseMBResult(data) {
    const type = 'MB';
    const usd = this.parseByCurrency(data, 'usd', type);
    const eur = this.parseByCurrency(data, 'eur', type);

    return [usd, eur];
  }

  parseByCurrency(data, currency, type) {
    const latest = sortBy(
      data.filter((r) => r.currency === currency),
      'date'
    );
    const { date, pointDate, ask, bid } = latest[latest.length - 1];

    const result = {
      date: new moment(date),
      pointDate: new moment(pointDate),
      currency,
      ask: +ask,
      bid: +bid,
      type,
      trendAsk: sumBy(latest, ({ trendAsk }) => +trendAsk),
      trendBid: sumBy(latest, ({ trendBid }) => +trendBid),
      maxAsk: max(latest.map(({ ask }) => +ask)),
      minBid: min(latest.map(({ bid }) => +bid))
    };

    return result;
  }

  async getCurrentState() {
    if (!this.state.length) {
      this.state = await this.fetchData();
      return this.state;
    }

    return this.state;
  }

  async updateState(result) {
    if (
      !this.stateYesterday ||
      !this.stateYesterday.length ||
      this.stateYesterday[0].date.isSame(result[0].date, 'd')
    ) {
      this.stateYesterday = this.state;
    }

    this.state = result;
    this.updateMetrics(result, this.stateYesterday);
  }

  updateMetrics(today, yesterday, dontSend) {
    const todayByCurrency = keyBy(today, 'currency');
    const yesterdayByCurrency = keyBy(yesterday, 'currency');

    const changes = today.map((t) => {
      const y = yesterdayByCurrency[t.currency];

      if (!y) {
        return {
          currency: t.currency,
          trend: 0
        };
      }

      // rate has changed direction since yesterday
      if (y.trendAsk * t.trendAsk < 0 || y.trendBid * t.trendBid < 0) {
        // minimum is more than 1% higher than maximum yesterday
        if (t.bid /*- y.maxAsk * 0.01*/ > y.maxAsk && t.trendBid > 0) {
          return {
            currency: t.currency,
            trend: 1
          };
        }

        // maximum is more than 1% lower than minimum yesterday
        if (t.ask /*+ y.minBid * 0.01*/ < y.minBid && t.trendAsk < 0) {
          return {
            currency: t.currency,
            trend: -1
          };
        }
      }

      return {
        currency: t.currency,
        trend: 0
      };
    });

    /*logger.info(
      `Metrics evaluation results:\n${changes
        .map(({ currency, trend }) => `${currency}: ${trend}`)
        .join('\n')}`
    );*/
    if (!dontSend && changes.some((r) => r.trend !== 0)) {
      users
        .getSubscribedChats('all')
        .then((chats) =>
          changes
            .filter((r) => r.trend !== 0)
            .forEach((change) =>
              this.bot.notifyUsers(
                change,
                todayByCurrency[change.currency],
                chats
              )
            )
        );
    }

    return changes;
  }
}

const restClient = new RestClient();
restClient.tests = {
  async history() {
    return await restClient.fetchHistory();
  },

  async getrates() {
    return await rates.getRates(new moment('2020-04-17'), 'MB');
  },

  async allusers() {
    return await users.getSubscribedChats();
  },

  async compare() {
    const today = await this.getrates();

    setTimeout(
      () =>
        restClient.updateMetrics(today, [
          {
            currency: 'usd',
            ask: 26.09,
            bid: 26.06,
            trendAsk: -0.15,
            trendBid: -0.15,
            maxAsk: 26.09,
            minBid: 26.06
          },
          {
            currency: 'eur',
            ask: 30.09,
            bid: 30.06,
            trendAsk: 0.15,
            trendBid: 0.15,
            maxAsk: 30.09,
            minBid: 30.06
          }
        ]),
      1000
    );

    return 'Started';
  },

  async metrics() {
    const allData = await rates.getEverything();
    const currencies = groupBy(allData, 'currency');
    console.log('*** Start instant metrics test ***');

    for (const c in currencies) {
      const list = currencies[c];
      console.log(`Evaluating ${c}`);
      for (let i = 0; i < list.length - 2; i++) {
        const today = [list[i]];
        const yesterday = [list[i + 1]];

        const result = restClient.updateMetrics(today, yesterday, true);
        console.log(
          `Result for ${today[0].date} (${today[0].ask}, ${
            today[0].trendAsk
          }): ${JSON.stringify(result[0])}`
        );
      }
    }
    return 'Done';
  }
};

export default restClient;
