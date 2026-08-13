# FundWise — Mutual Fund Portal MVP

A mobile-first mutual-fund research portal.

## Current modules
- Mutual fund search
- Fund cards
- Fund comparison
- Mutual fund screener
- SIP calculator
- Learning section
- Responsive mobile design

## Data
The MVP uses illustrative sample data. Before public launch, connect the backend to properly licensed/authorized data sources for NAV, returns, AUM, portfolio holdings, TER, benchmarks and other scheme information.

AMFI publishes NAV resources and historical NAV downloads. SEBI also publishes regulatory/disclosure information and requires periodic portfolio disclosures by mutual funds/AMCs.

## Run
Open `index.html` in a browser.

## Production roadmap
1. Add real mutual-fund data ingestion.
2. Create a backend + database.
3. Add scheme detail pages.
4. Add rolling returns, CAGR, XIRR, Sharpe, Sortino, alpha, beta, volatility and drawdown.
5. Add portfolio and watchlist.
6. Add authentication.
7. Add compliant research/disclaimer/advertising framework.


## API integration — v1

This version connects the browser to **MFapi.in** for a live NAV lookup of:
- Scheme: ICICI Prudential Flexicap Fund - Direct Plan - Growth
- Scheme code: 148990

The documented endpoint is `GET https://api.mfapi.in/mf/{scheme_code}/latest`.

For a production website, do not rely on a free public API as the sole source of financial data. Evaluate licensing, uptime, rate limits, redistribution rights and data accuracy, and consider an authorized/licensed provider or an ingestion layer based on official AMFI/AMC disclosures. AMFI provides current and historical NAV download resources and scheme-data resources.


## v3 fund navigation
Search results and fund cards are now clickable. The first fund opens a detail view using the live NAV-history API; other sample funds open the same detail interface with their current demo metadata until scheme-specific API mapping is added.

\n## v4 dynamic scheme mapping
Fund detail pages now attempt to resolve each fund to a real MFapi scheme code from the API's scheme catalog, then fetch that scheme's NAV history dynamically. The first featured fund keeps its explicit verified demo mapping. This is still a prototype: production should use a controlled backend, verified scheme-code mapping, caching, rate limits, error handling, and an appropriately licensed/authorized data source.

\n## v5 research features
- FundWise Score with transparent sub-scores
- ₹10,000 growth comparison versus benchmark/category
- Rolling-return consistency view
- Maximum drawdown view
- Portfolio X-Ray: asset allocation, market-cap mix, sectors and top holdings
- Advanced fund comparison
- Research tabs for overview, portfolio, risk and comparison

The current research values are illustrative placeholders except for NAV/history fields already connected to the API. Replace them with verified data before public launch.

\n## v6 data engine
- Added a Vercel serverless `/api/fund?code=` endpoint.
- Browser now requests FundWise's backend rather than calling the upstream NAV API directly.
- Real NAV-derived 1Y/3Y/5Y CAGR, volatility, Sharpe and maximum drawdown are calculated server-side.
- Added caching headers to reduce upstream requests.
- Added explicit data-source/methodology disclosure.
- Portfolio, AUM, TER, benchmark, manager and risk-o-meter are intentionally not fabricated. The next production ingestion adapter should use verified AMC/AMFI/SEBI disclosures and an appropriate data licence.

AMFI states that scheme NAVs are published daily and provides NAV history downloads; its research/data area also exposes scheme details, scheme performance and portfolio-disclosure resources. SEBI's March 2026 Master Circular requires monthly portfolio disclosures with ISINs on AMC/AMFI websites within the prescribed timeline.
