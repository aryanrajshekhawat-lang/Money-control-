// GET /api/fund?code=<schemeCode>
// Fetches detailed fund data including NAV history, calculated returns and risk metrics
import fetch from 'node-fetch';

const CACHE_TTL = 21600; // 6 hours
const NAV_HISTORY_LIMIT = 1000; // ~4 years of business days

export default async function handler(req, res) {
  const schemeCode = String(req.query.code || '').trim();
  
  if (!schemeCode) {
    return res.status(400).json({ error: 'scheme code required' });
  }

  try {
    // Fetch latest NAV
    const navRes = await fetch(`https://api.mfapi.in/mf/${schemeCode}/latest`);
    if (!navRes.ok) {
      return res.status(404).json({ error: 'scheme not found' });
    }
    const navData = await navRes.json();
    const latestNav = navData.data?.[0];
    
    if (!latestNav) {
      return res.status(404).json({ error: 'NAV data unavailable' });
    }

    // Fetch NAV history
    const histRes = await fetch(`https://api.mfapi.in/mf/${schemeCode}`);
    if (!histRes.ok) {
      return res.status(502).json({ error: 'history unavailable' });
    }
    const histData = await histRes.json();
    const navHistory = (histData.data || []).slice(0, NAV_HISTORY_LIMIT);

    // Calculate returns and risk metrics
    const metrics = calculateMetrics(navHistory);

    // Build response
    const fundData = {
      schemeCode,
      schemeName: navData.meta?.scheme_name || 'Unknown Scheme',
      isin: navData.meta?.isin || null,
      category: navData.meta?.category || 'Other',
      
      nav: {
        latest: parseFloat(latestNav.nav),
        date: latestNav.date,
        history: navHistory.map(h => ({
          date: h.date,
          nav: parseFloat(h.nav)
        }))
      },
      
      returns: metrics.returns,
      riskMetrics: metrics.risk,
      
      // Placeholders for fields requiring verified production data
      aum: null,
      expenseRatio: null,
      benchmark: null,
      riskOMeter: null,
      fundManager: null,
      portfolio: null
    };

    res.setHeader('Cache-Control', `s-maxage=${CACHE_TTL}, stale-while-revalidate=86400`);
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(200).json(fundData);
    
  } catch (e) {
    console.error('Fund detail error:', e);
    return res.status(500).json({ error: 'unable to load fund details' });
  }
}

function calculateMetrics(navHistory) {
  if (!navHistory || navHistory.length < 2) {
    return { returns: {}, risk: {} };
  }

  // Sort chronologically (oldest first)
  const sorted = [...navHistory].reverse();
  
  // Helper: calculate CAGR
  const calculateCAGR = (startNav, endNav, years) => {
    if (startNav <= 0 || years <= 0) return 0;
    return (Math.pow(endNav / startNav, 1 / years) - 1) * 100;
  };

  // Helper: calculate daily returns
  const dailyReturns = [];
  for (let i = 1; i < sorted.length; i++) {
    const prev = parseFloat(sorted[i - 1].nav);
    const curr = parseFloat(sorted[i].nav);
    if (prev > 0) {
      dailyReturns.push((curr - prev) / prev);
    }
  }

  // Calculate standard deviation (volatility)
  const volatility = dailyReturns.length > 1 ? calculateStdDev(dailyReturns) * Math.sqrt(252) : 0;

  // Helper: get NAV for periods ago
  const getNavXPeriodAgo = (days) => {
    const idx = Math.min(days, sorted.length - 1);
    return parseFloat(sorted[idx].nav);
  };

  const latestNav = parseFloat(sorted[0].nav);
  const nav1MAgo = getNavXPeriodAgo(21);
  const nav3MAgo = getNavXPeriodAgo(63);
  const nav6MAgo = getNavXPeriodAgo(126);
  const nav1YAgo = getNavXPeriodAgo(252);
  const nav3YAgo = getNavXPeriodAgo(756);
  const nav5YAgo = getNavXPeriodAgo(1260);
  const nav10YAgo = getNavXPeriodAgo(2520);

  const returns = {
    '1M': latestNav > 0 ? ((latestNav - nav1MAgo) / nav1MAgo * 100).toFixed(2) : null,
    '3M': latestNav > 0 ? ((latestNav - nav3MAgo) / nav3MAgo * 100).toFixed(2) : null,
    '6M': latestNav > 0 ? ((latestNav - nav6MAgo) / nav6MAgo * 100).toFixed(2) : null,
    '1Y': latestNav > 0 ? calculateCAGR(nav1YAgo, latestNav, 1).toFixed(2) : null,
    '3Y': latestNav > 0 ? calculateCAGR(nav3YAgo, latestNav, 3).toFixed(2) : null,
    '5Y': latestNav > 0 ? calculateCAGR(nav5YAgo, latestNav, 5).toFixed(2) : null,
    '10Y': latestNav > 0 ? calculateCAGR(nav10YAgo, latestNav, 10).toFixed(2) : null,
  };

  // Calculate maximum drawdown
  let maxDrawdown = 0;
  let peak = parseFloat(sorted[0].nav);
  for (let i = 1; i < sorted.length; i++) {
    const current = parseFloat(sorted[i].nav);
    if (current > peak) {
      peak = current;
    } else {
      const drawdown = ((current - peak) / peak) * 100;
      if (drawdown < maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }
  }

  // Sharpe ratio (assuming 6% risk-free rate)
  const sharpe = dailyReturns.length > 1 && volatility > 0
    ? ((calculateAvg(dailyReturns) * 252 - 0.06) / volatility).toFixed(2)
    : null;

  const risk = {
    volatility: volatility.toFixed(2),
    maxDrawdown: maxDrawdown.toFixed(2),
    sharpeRatio: sharpe,
    // Sortino, Beta, Alpha require benchmark data (production)
    sortino: null,
    beta: null,
    alpha: null
  };

  return { returns, risk };
}

function calculateStdDev(values) {
  if (values.length === 0) return 0;
  const avg = calculateAvg(values);
  const variance = values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length;
  return Math.sqrt(variance);
}

function calculateAvg(values) {
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}
