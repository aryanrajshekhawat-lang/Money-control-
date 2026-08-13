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
