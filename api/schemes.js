// GET /api/schemes?q=<query>&limit=<limit>
// Returns matching schemes from the full mutual-fund catalogue
export default async function handler(req, res) {
  const q = String(req.query.q || '').trim().toLowerCase();
  const limit = Math.min(Math.max(Number(req.query.limit || 80), 10), 200);
  
  try {
    // Fetch the full scheme catalogue from MFapi.in
    const r = await fetch('https://api.mfapi.in/mf', {
      headers: { 'Accept': 'application/json' }
    });
    
    if (!r.ok) {
      return res.status(502).json({ error: 'Scheme catalogue unavailable' });
    }
    
    const raw = await r.json();
    const list = Array.isArray(raw) ? raw : [];
    
    // Filter by query
    let filtered = list;
    if (q) {
      filtered = list.filter(scheme => {
        const name = String(scheme.schemeName || '').toLowerCase();
        const code = String(scheme.schemeCode || '').toLowerCase();
        return name.includes(q) || code.includes(q);
      });
    }
    
    // Sort by relevance (exact match first, then prefix, then anywhere)
    if (q) {
      filtered.sort((a, b) => {
        const aName = String(a.schemeName || '').toLowerCase();
        const bName = String(b.schemeName || '').toLowerCase();
        
        const aExact = aName === q ? 3 : aName.startsWith(q) ? 2 : 1;
        const bExact = bName === q ? 3 : bName.startsWith(q) ? 2 : 1;
        
        return bExact - aExact;
      });
    }
    
    // Limit results
    const out = filtered.slice(0, limit).map(scheme => ({
      schemeCode: String(scheme.schemeCode),
      schemeName: scheme.schemeName,
      category: scheme.schemeCategory || null
    }));
    
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=604800');
    res.setHeader('Access-Control-Allow-Origin', '*');
    
    return res.status(200).json({
      count: filtered.length,
      returned: out.length,
      schemes: out
    });
    
  } catch (e) {
    console.error('Schemes API error:', e);
    return res.status(500).json({ error: 'Unable to load scheme catalogue' });
  }
}
