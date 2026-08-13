// Vercel serverless API: /api/fund?code=SCHEME_CODE
// Proxies the NAV history from MFapi and calculates research metrics from NAV history.
// For production, replace the upstream with an appropriately licensed/authorized provider.
export default async function handler(req, res) {
  const code = String(req.query.code || "").trim();
  if (!/^\d+$/.test(code)) return res.status(400).json({error:"Invalid scheme code"});

  try {
    const upstream = await fetch(`https://api.mfapi.in/mf/${code}`);
    if (!upstream.ok) return res.status(502).json({error:"Upstream NAV service unavailable"});
    const json = await upstream.json();
    const raw = Array.isArray(json.data) ? json.data : [];
    const rows = raw
      .map(x => ({date:x.date, nav:Number(x.nav)}))
      .filter(x => x.date && Number.isFinite(x.nav))
      .sort((a,b) => new Date(a.date)-new Date(b.date));

    if (!rows.length) return res.status(404).json({error:"No NAV history found"});

    const latest = rows[rows.length-1];
    const daysBetween=(a,b)=>(new Date(b)-new Date(a))/(1000*60*60*24);
    const navOnOrBefore=(target)=>{
      let best=null;
      for (const r of rows) {
        if (new Date(r.date)<=target) best=r; else break;
      }
      return best || rows[0];
    };
    const cagr=(years)=>{
      const target=new Date(latest.date);
      target.setFullYear(target.getFullYear()-years);
      const old=navOnOrBefore(target);
      const actualYears=Math.max(daysBetween(new Date(old.date),new Date(latest.date))/365.25, 0.01);
      return Math.pow(latest.nav/old.nav,1/actualYears)-1;
    };
    const oneY=cagr(1), threeY=cagr(3), fiveY=cagr(5);

    // Approximate daily returns from available NAV observations.
    const returns=[];
    for(let i=1;i<rows.length;i++){
      if(rows[i-1].nav>0) returns.push(rows[i].nav/rows[i-1].nav-1);
    }
    const mean=returns.reduce((a,b)=>a+b,0)/(returns.length||1);
    const variance=returns.reduce((a,b)=>a+(b-mean)**2,0)/(Math.max(returns.length-1,1));
    const volatility=Math.sqrt(variance)*Math.sqrt(252);
    const annualizedMean=Math.pow(1+mean,252)-1;
    const riskFree=0.065;
    const sharpe=volatility?((annualizedMean-riskFree)/volatility):null;

    let peak=rows[0].nav, maxDD=0;
    for(const r of rows){
      peak=Math.max(peak,r.nav);
      maxDD=Math.min(maxDD,r.nav/peak-1);
    }

    // 5-year rolling annualized return observations, sampled monthly-ish.
    const rolling=[];
    for(let i=0;i<rows.length;i++){
      const end=rows[i], target=new Date(end.date); target.setFullYear(target.getFullYear()-5);
      const start=navOnOrBefore(target);
      if(start && daysBetween(new Date(start.date),new Date(end.date))>=365*4.8){
        const yrs=daysBetween(new Date(start.date),new Date(end.date))/365.25;
        rolling.push(Math.pow(end.nav/start.nav,1/yrs)-1);
      }
    }

    res.setHeader("Cache-Control","s-maxage=3600, stale-while-revalidate=86400");
    res.setHeader("Access-Control-Allow-Origin","*");
    return res.status(200).json({
      source:"MFapi upstream NAV history",
      meta:json.meta || {},
      latest,
      history:rows.slice(-1300),
      metrics:{
        oneY, threeY, fiveY, volatility, sharpe, maxDrawdown:maxDD,
        rolling5YBeatRate:null,
        rolling5YCount:rolling.length
      }
    });
  } catch(e) {
    return res.status(500).json({error:"Unable to retrieve fund data"});
  }
}
