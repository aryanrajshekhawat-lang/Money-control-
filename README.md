# FundWise — Mutual Fund Portal

A comprehensive mutual-fund research portal powered by real AMFI data. Search 1,500+ schemes, view detailed performance, compare funds, and calculate SIP returns.

## 🎯 Features (v11+)

### Universal Fund Coverage
- **All available schemes**: Access the complete AMFI/MFapi catalogue (~1,500+ mutual funds)
- **Search & discovery**: Full-text search across scheme names and codes
- **Universal detail pages**: Every scheme gets a dedicated page with complete metrics
- **Dynamic content**: No hard-coded sample data—all content derived from live NAV API

### Performance & Returns
- **Multiple time periods**: 1M / 3M / 6M / 1Y / 3Y / 5Y / 10Y / MAX
- **Latest NAV + history**: Real-time NAV with historical data spanning years
- **Calculated metrics**: CAGR, volatility, Sharpe ratio, maximum drawdown
- **Interactive charts**: Visualize NAV trends across any time period

### Fund Research
- **Core metrics**: AUM, expense ratio, benchmark, category, risk level
- **Fund manager info**: AMC details and fund house information
- **Portfolio & holdings**: Asset allocation, market cap mix, sector exposure (where available)
- **Fund comparison**: Side-by-side comparison of returns, risk, and performance across all periods

### Tools
- **SIP Calculator**: Calculate maturity amount with adjustable monthly investment and return rates
- **Performance comparison**: View funds ranked by returns, category, or risk
- **Screener**: Filter schemes by category, risk level, and performance metrics

### Data Quality
- **Proper loading states**: Visual feedback during API calls with spinners
- **Error handling**: Graceful degradation and retry options when data unavailable
- **Caching**: Client-side caching reduces API calls, faster navigation
- **Status indicators**: Clear data freshness labels and last-update timestamps

## 🏗️ Architecture

### Data Layer
The app uses a two-tier data architecture that doesn't depend on hard-coded figures:

```
Browser → FundWise Backend APIs → Upstream Data Sources
                ↓
         Client-side Caching (DataService)
```

### API Endpoints

**`/api/schemes?q=<query>&limit=<limit>`**
- Returns matching schemes from the full AMFI catalogue
- Supports relevance-based sorting
- Cached for 24 hours server-side
- Example: `/api/schemes?q=flexicap&limit=50`

**`/api/fund?code=<schemeCode>`**
- Fetches complete fund details including NAV history
- Calculates 1M/3M/6M/1Y/3Y/5Y/10Y returns + CAGR
- Computes risk metrics: volatility, Sharpe, max drawdown
- Cached for 6 hours server-side
- Example: `/api/fund?code=102949`

### Client-Side Services

**`data-service.js`** (DataService)
- Unified fund data access layer
- 1-hour client-side caching
- Request deduplication (pending requests)
- Methods:
  - `getFund(schemeCode)` — fetches fund detail
  - `searchSchemes(query, limit)` — searches catalogue
  - `getNAVHistory(schemeCode)` — retrieves NAV timeseries
  - `compareFunds(schemeCodes)` — fetches multiple funds
  - `calculateSIP(amount, rate, months)` — SIP computation

**`ui-service.js`** (UIService)
- UI state management and rendering
- Chart generation (requires Chart.js)
- Formatting utilities (currency, percent, dates)
- Loading/error state display
- Methods:
  - `showLoading()` / `showError()` — state display
  - `renderNAVChart()` / `renderComparisonChart()` — chart rendering
  - `formatCurrency()`, `formatPercent()`, `formatDate()`
  - `filterNAVByPeriod()` — period-based filtering
  - `debounce()` — search input throttling

### Data Flow Example

1. User searches for "Flexi Cap"
2. `searchAllSchemes()` calls `dataService.searchSchemes("Flexi Cap")`
3. DataService checks client cache; if miss, fetches `/api/schemes?q=flexi+cap`
4. Results displayed with scheme names and codes
5. User clicks a scheme → navigation to `/fund/<scheme-slug>/`
6. Fund page calls `dataService.getFund(schemeCode)`
7. DataService calls `/api/fund?code=<code>`
8. Backend fetches NAV history from MFapi.in, calculates returns/risk
9. Results cached in DataService and rendered with charts

## 📊 Data Sources

### NAV & Performance
- **Source**: [MFapi.in](https://mfapi.in/) — public mutual fund data API
- **Freshness**: Daily (business days only)
- **Coverage**: ~1,500+ registered schemes from AMFI
- **Scope**: Scheme code, name, category, NAV history

### Calculated Metrics
**Server-side** (`/api/fund` endpoint):
- CAGR for all periods (1M, 3M, 6M, 1Y, 3Y, 5Y, 10Y)
- Volatility (annualized standard deviation of daily returns)
- Sharpe ratio (return premium above 6% risk-free rate)
- Maximum drawdown (largest peak-to-trough decline)

**Client-side** (`data-service.js`):
- SIP maturity calculation (future value of annuity formula)

### Not Yet Included (Production Data)
The following fields are intentionally placeholders because they require verified, properly licensed sources:
- **AUM** (Assets Under Management)
- **Expense Ratio (TER)**
- **Benchmark**
- **Risk-o-Meter** (SEBI risk rating)
- **Fund Manager** details
- **Portfolio holdings** & asset allocation (requires SEBI monthly disclosures)

To add production data:
1. Integrate with AMFI's official API/feeds for scheme metadata
2. Fetch TER and benchmark from SEBI's mutual fund database
3. Parse monthly portfolio disclosures (Form N1, N2) from AMC websites or SEBI
4. Add `AUM` data from AMFI or commercial data providers
5. Implement proper data validation and error handling

## 🚀 Running Locally

### Prerequisites
- Node.js 14+ (for Vercel CLI if running serverless APIs locally)
- Modern browser (Chrome, Firefox, Safari, Edge)

### Static Files
```bash
# Simply open index.html in your browser
open index.html
```

### Serverless APIs (Vercel)
```bash
# Install Vercel CLI
npm install -g vercel

# Run locally (requires vercel.json config)
vercel dev

# Open http://localhost:3000
```

The app will fetch data from:
- `/api/schemes` → MFapi.in catalogue
- `/api/fund` → MFapi.in NAV history + calculated metrics

## 📈 Roadmap

### Phase 1 ✅ (Current)
- All-fund NAV platform with full scheme catalogue
- Dynamic fund detail pages for any scheme code
- Client & server-side caching
- SIP calculator
- Fund comparison
- Proper loading/error states

### Phase 2 (Planned)
- [ ] Integrate SEBI portfolio disclosures (holdings, asset allocation)
- [ ] Add AUM from AMFI/commercial sources
- [ ] Implement fund rating/scoring (consistency, risk-adjusted returns)
- [ ] Advanced screener (sector exposure, market cap filter)
- [ ] Watchlist & portfolio tracking
- [ ] User authentication
- [ ] Mobile app (React Native)

### Phase 3 (Production)
- [ ] Add expense ratio data
- [ ] Integrate benchmark returns for alpha calculation
- [ ] Implement SEBI risk-o-meter display
- [ ] Fund manager profiles
- [ ] Regulatory compliance & disclaimers
- [ ] Commercial licensing for redistribution

## 🔧 Development

### File Structure
```
├── index.html          # Home page
├── fund.html           # Fund detail template
├── app.js              # Main application logic
├── fund.js             # Fund page logic
├── data-service.js     # Data layer (caching, API calls)
├── ui-service.js       # UI utilities (charts, formatting, states)
├── styles.css          # Styles
├── vercel.json         # Vercel config
└── api/
    ├── fund.js         # GET /api/fund?code=<schemeCode>
    └── schemes.js      # GET /api/schemes?q=<query>&limit=<limit>
```

### Key Dependencies
- **Chart.js** (optional, for charts) — loaded from CDN
- **MFapi.in** (free public API) — upstream NAV data
- **Vercel** (free tier) — hosting + serverless APIs

### Adding a Feature
1. Add data-fetching logic to `DataService` in `data-service.js`
2. Add UI rendering to `UIService` in `ui-service.js`
3. Create/update API endpoint in `/api/*.js` if needed
4. Update HTML structure in `index.html` or `fund.html`
5. Wire up event listeners in `app.js` or `fund.js`

## 📝 Disclaimers

- **Not Financial Advice**: FundWise provides research data only, not investment recommendations
- **Data Accuracy**: NAV data is from MFapi.in/AMFI; verification recommended before decisions
- **Illustrative Fields**: Calculated returns, risk metrics, and all performance data are illustrative
- **Production Use**: Before public launch, verify licensing, data sources, and regulatory compliance with legal counsel

## 📚 References

- [AMFI (Association of Mutual Funds in India)](https://www.amfiindia.com/)
  - NAV downloads: https://www.amfiindia.com/net-asset-value
  - Scheme details & classification
- [SEBI (Securities and Exchange Board of India)](https://www.sebi.gov.in/)
  - Mutual fund regulations & master circular
  - Portfolio disclosure requirements
  - Risk-o-meter framework
- [MFapi.in](https://mfapi.in/) — Public mutual fund data API
- [XIRR Calculator Docs](https://en.wikipedia.org/wiki/Internal_rate_of_return) — For future XIRR implementation

## 📄 License

This project is provided as-is for learning and research purposes.

---

**Questions?** Check the [GitHub Issues](https://github.com/aryanrajshekhawat-lang/Money-control-/issues) or submit a PR.
