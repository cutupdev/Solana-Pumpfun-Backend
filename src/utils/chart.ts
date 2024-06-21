import Coin from "../models/Coin";
import CoinStatus from "../models/CoinsStatus";
import { logger } from "../sockets/logger";
import { CandlePrice, priceFeedInfo } from "./type";

export async function fetchPriceChartData(pairIndex: number, start: number, end: number, range: number, token: string) {
  logger.info(`  fetching chart data for pairIndex: ${pairIndex}, start: ${start}, end: ${end}, range: ${range}, token: ${token}`);

  // load price histories from DB
  const priceFeeds: priceFeedInfo[] | undefined = await Coin.findOne({ token })
    .then(async (coin) => {
      const data = await CoinStatus.findOne({ coinId: coin?._id }, { 'record.price': 1, 'record.time': 1 })
      if (data == undefined) return;
      return data?.record;
    });
    if(priceFeeds== undefined) return;
    const priceHistory = priceFeeds.map((feed) => {
    let price = feed.price;

    return {
      price: price,
      ts: feed.time.getTime() / 1000,
    };
  }).sort((price1, price2) => price1.ts - price2.ts);

  if (!priceHistory.length) return [];

  let candlePeriod = 60; // 1 min  default
  switch (range) {
    case 1:
      // default candle period
      break;
    case 5:
      candlePeriod = 300; // 5 mins
      break;
    case 15:
      candlePeriod = 1_800; // 30 mins
      break;
    case 60:
      candlePeriod = 3_600; // 1 hr
      break;
    case 120:
      candlePeriod = 7_200; // 2 hrs
      break;
  }

  // convert price feed to candle price data
  let cdStart = Math.floor(priceHistory[0].ts / candlePeriod) * candlePeriod;
  let cdEnd = Math.floor(priceHistory[priceHistory.length - 1].ts / candlePeriod) * candlePeriod;

  let cdFeeds: CandlePrice[] = [];
  let pIndex = 0;
  for (let curCdStart = cdStart; curCdStart <= cdEnd; curCdStart += candlePeriod) {
    let st = priceHistory[pIndex].price;
    let hi = priceHistory[pIndex].price;
    let lo = priceHistory[pIndex].price;
    let en = priceHistory[pIndex].price;
    let prevIndex = pIndex;
    for (; pIndex < priceHistory.length; ) {
      if (hi < priceHistory[pIndex].price) hi = priceHistory[pIndex].price;
      if (lo > priceHistory[pIndex].price) lo = priceHistory[pIndex].price;
      en = priceHistory[pIndex].price;

      // break new candle data starts
      if (priceHistory[pIndex].ts >= curCdStart + candlePeriod) break;
      pIndex++;
    }
    if (prevIndex !== pIndex)
      cdFeeds.push({
        open: st,
        high: hi,
        low: lo,
        close: en,
        time: curCdStart,
      });
  }

  return cdFeeds;
}
