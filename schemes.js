// GET /api/schemes?q=flexicap&limit=50
// Server-side catalogue proxy. The upstream returns a large scheme catalogue.
export default async function handler(req,res){
  const q=String(req.query.q||"").trim().toLowerCase();
  const limit=Math.min(Math.max(Number(req.query.limit||80),10),200);
  try{
    const r=await fetch("https://api.mfapi.in/mf");
    if(!r.ok) return res.status(502).json({error:"Scheme catalogue unavailable"});
    const raw=await r.json();
    const list=Array.isArray(raw)?raw:[];
    const filtered=q?list.filter(x=>String(x.schemeName||"").toLowerCase().includes(q)):list;
    const out=filtered.slice(0,limit).map(x=>({
      schemeCode:String(x.schemeCode),
      schemeName:x.schemeName
    }));
    res.setHeader("Cache-Control","s-maxage=21600, stale-while-revalidate=86400");
    res.setHeader("Access-Control-Allow-Origin","*");
    return res.status(200).json({count:filtered.length,schemes:out});
  }catch(e){return res.status(500).json({error:"Unable to load scheme catalogue"});}
}