// GET /api/fund?code=<schemeCode>
//
// Universal mutual-fund detail API.
// Uses MFAPI for NAV + historical NAV data.
// Metadata not available from the NAV feed is returned as null.
// Never fabricate fund information.

import fetch from "node-fetch";

const CACHE_TTL = 21600; // 6 hours
const NAV_HISTORY_LIMIT = 10000;

// Approximate trading-day periods
const PERIODS = {
  "1M": { days: 21, years: 1 / 12 },
  "3M": { days: 63, years: 3 / 12 },
  "6M": { days: 126, years: 6 / 12 },
  "1Y": { days: 252, years: 1 },
  "3Y": { days: 756, years: 3 },
  "5Y": { days: 1260, years: 5 },
  "10Y": { days: 2520, years: 10 },
};

export default async function handler(req, res) {
  const schemeCode = String(req.query.code || "").trim();

  if (!schemeCode) {
    return res.status(400).json({
      error: "scheme code required",
    });
  }

  try {
    const baseUrl = `https://api.mfapi.in/mf/${encodeURIComponent(
      schemeCode
    )}`;

    // Fetch latest NAV and complete history simultaneously.
    const [latestResponse, historyResponse] = await Promise.all([
      fetch(`${baseUrl}/latest`),
      fetch(baseUrl),
    ]);

    if (!latestResponse.ok) {
      return res.status(404).json({
        error: "scheme not found",
      });
    }

    if (!historyResponse.ok) {
      return res.status(502).json({
        error: "NAV history unavailable",
      });
    }

    const latestData = await latestResponse.json();
    const historyData = await historyResponse.json();

    const latest = latestData.data?.[0];

    if (!latest) {
      return res.status(404).json({
        error: "NAV data unavailable",
      });
    }

    const navHistory = normalizeHistory(
      historyData.data || []
    ).slice(0, NAV_HISTORY_LIMIT);

    const metrics = calculateMetrics(navHistory);

    const fundData = {
      schemeCode,

      schemeName:
        latestData.meta?.scheme_name ||
        "Unknown Scheme",

      isin:
        latestData.meta?.isin ||
        null,

      category:
        latestData.meta?.category ||
        "Other",

      fundHouse:
        latestData.meta?.fund_house ||
        null,

      schemeType:
        latestData.meta?.scheme_type ||
        null,

      nav: {
        latest: Number(latest.nav),
        date: latest.date,

        history: navHistory,
      },

      returns: metrics.returns,

      riskMetrics: metrics.risk,

      /*
       * These fields require verified AMC/AMFI
       * disclosure data.
       *
       * DO NOT insert guessed values.
       */

      aum: null,

      expenseRatio: null,

      benchmark: null,

      riskOMeter: null,

      fundManager: null,

      portfolio: null,

      assetAllocation: null,

      dataSource:
        "MFAPI / public mutual-fund NAV data",
    };

    res.setHeader(
      "Cache-Control",
      `s-maxage=${CACHE_TTL}, stale-while-revalidate=86400`
    );

    res.setHeader(
      "Access-Control-Allow-Origin",
      "*"
    );

    return res.status(200).json(fundData);

  } catch (error) {

    console.error(
      "Fund detail error:",
      error
    );

    return res.status(500).json({
      error: "unable to load fund details",
    });
  }
}


/**
 * Convert MFAPI history into a consistent format.
 */
function normalizeHistory(history) {

  return history
    .map((item) => ({
      date: item.date,
      nav: Number(item.nav),
    }))

    .filter(
      (item) =>
        item.date &&
        Number.isFinite(item.nav) &&
        item.nav > 0
    )

    .sort(
      (a, b) =>
        parseDate(a.date) -
        parseDate(b.date)
    );
}


/**
 * MFAPI normally uses DD-MM-YYYY.
 */
function parseDate(value) {

  const parts = String(value).split("-");

  if (parts.length === 3) {

    const [day, month, year] =
      parts.map(Number);

    return new Date(
      year,
      month - 1,
      day
    ).getTime();
  }

  return new Date(value).getTime();
}


/**
 * Calculate all performance and risk metrics.
 */
function calculateMetrics(navHistory) {

  if (navHistory.length < 2) {

    return {
      returns: {},
      risk: {},
    };
  }

  const sorted = [...navHistory].sort(
    (a, b) =>
      parseDate(a.date) -
      parseDate(b.date)
  );

  const latest =
    sorted[sorted.length - 1].nav;


  /*
   * ------------------------------------
   * PERIOD RETURNS
   * ------------------------------------
   */

  const returns = {};

  for (const [period, config] of Object.entries(
    PERIODS
  )) {

    if (sorted.length > config.days) {

      const start =
        sorted[
          sorted.length -
          1 -
          config.days
        ].nav;

      returns[period] =
        calculateCAGR(
          start,
          latest,
          config.years
        );

    } else {

      returns[period] = null;
    }
  }


  /*
   * ------------------------------------
   * MAX RETURN
   * ------------------------------------
   */

  const first =
    sorted[0].nav;

  const firstDate =
    parseDate(sorted[0].date);

  const lastDate =
    parseDate(
      sorted[sorted.length - 1].date
    );

  const years =
    (lastDate - firstDate) /
    (365.25 *
      24 *
      60 *
      60 *
      1000);

  returns.MAX =
    years > 0
      ? calculateCAGR(
          first,
          latest,
          years
        )
      : null;


  /*
   * ------------------------------------
   * DAILY RETURNS
   * ------------------------------------
   */

  const dailyReturns = [];

  for (
    let i = 1;
    i < sorted.length;
    i++
  ) {

    const previous =
      sorted[i - 1].nav;

    const current =
      sorted[i].nav;

    if (previous > 0) {

      dailyReturns.push(
        (current - previous) /
          previous
      );
    }
  }


  /*
   * ------------------------------------
   * VOLATILITY
   * ------------------------------------
   */

  const volatility =
    dailyReturns.length > 1
      ? calculateStdDev(
          dailyReturns
        ) *
        Math.sqrt(252) *
        100
      : null;


  /*
   * ------------------------------------
   * MAXIMUM DRAWDOWN
   * ------------------------------------
   */

  let peak =
    sorted[0].nav;

  let maxDrawdown = 0;

  for (const point of sorted) {

    if (point.nav > peak) {

      peak = point.nav;
    }

    const drawdown =
      ((point.nav - peak) /
        peak) *
      100;

    if (
      drawdown <
      maxDrawdown
    ) {

      maxDrawdown =
        drawdown;
    }
  }


  /*
   * ------------------------------------
   * SHARPE RATIO
   * ------------------------------------
   *
   * Assumption:
   * Risk-free rate = 6%
   */

  const annualizedReturn =
    dailyReturns.length
      ? calculateAvg(
          dailyReturns
        ) * 252
      : null;

  const sharpe =
    volatility !== null &&
    volatility > 0
      ? (
          (annualizedReturn - 0.06) /
          (volatility / 100)
        ).toFixed(2)
      : null;


  return {

    returns,

    risk: {

      volatility:
        volatility === null
          ? null
          : volatility.toFixed(2),

      maxDrawdown:
        maxDrawdown.toFixed(2),

      sharpeRatio:
        sharpe,

      /*
       * These require benchmark
       * return data.
       */

      sortino: null,

      beta: null,

      alpha: null,
    },
  };
}


/**
 * CAGR calculation.
 */
function calculateCAGR(
  startNav,
  endNav,
  years
) {

  if (
    !(startNav > 0) ||
    !(endNav > 0) ||
    !(years > 0)
  ) {

    return null;
  }

  return Number(
    (
      (Math.pow(
        endNav / startNav,
        1 / years
      ) - 1) *
      100
    ).toFixed(2)
  );
}


/**
 * Standard deviation.
 */
function calculateStdDev(values) {

  if (!values.length) {
    return 0;
  }

  const average =
    calculateAvg(values);

  const variance =
    values.reduce(
      (sum, value) =>
        sum +
        Math.pow(
          value - average,
          2
        ),
      0
    ) / values.length;

  return Math.sqrt(
    variance
  );
}


/**
 * Average.
 */
function calculateAvg(values) {

  return (
    values.reduce(
      (sum, value) =>
        sum + value,
      0
    ) / values.length
  );
}
