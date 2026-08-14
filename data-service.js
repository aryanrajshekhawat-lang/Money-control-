/**
 * Data Service Layer
 * 
 * Provides unified access to fund data with:
 * - Client-side caching
 * - Error handling and fallbacks
 * - Loading state management
 * - Standardized data format
 */

class DataService {
  constructor() {
    this.cache = new Map();
    this.pendingRequests = new Map();
    this.CACHE_TTL = 3600000; // 1 hour
  }

  /**
   * Get fund details by scheme code
   * Returns: { schemeCode, schemeName, nav, returns, riskMetrics, ... }
   */
  async getFund(schemeCode) {
    if (!schemeCode) throw new Error('Scheme code required');

    const cacheKey = `fund:${schemeCode}`;
    
    // Check cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.CACHE_TTL) {
        return cached.data;
      }
    }

    // Return pending request if already in flight
    if (this.pendingRequests.has(cacheKey)) {
      return this.pendingRequests.get(cacheKey);
    }

    // Fetch fund details
    const promise = fetch(`/api/fund?code=${encodeURIComponent(schemeCode)}`)
      .then(r => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(data => {
        // Cache the result
        this.cache.set(cacheKey, { data, timestamp: Date.now() });
        this.pendingRequests.delete(cacheKey);
        return data;
      })
      .catch(err => {
        this.pendingRequests.delete(cacheKey);
        throw err;
      });

    this.pendingRequests.set(cacheKey, promise);
    return promise;
  }

  /**
   * Search schemes by query
   * Returns: { count, returned, schemes: [{ schemeCode, schemeName, category }] }
   */
  async searchSchemes(query, limit = 50) {
    const cacheKey = `search:${query}:${limit}`;
    
    // Check cache
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.CACHE_TTL) {
        return cached.data;
      }
    }

    try {
      const response = await fetch(
        `/api/schemes?q=${encodeURIComponent(query)}&limit=${limit}`,
        { cache: 'no-store' }
      );

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const data = await response.json();

      // Cache the result
      this.cache.set(cacheKey, { data, timestamp: Date.now() });
      return data;

    } catch (error) {
      console.error('Search failed:', error);
      throw error;
    }
  }

  /**
   * Get NAV history for a scheme
   * Returns: [{ date, nav }, ...]
   */
  async getNAVHistory(schemeCode) {
    const fund = await this.getFund(schemeCode);
    return fund.nav?.history || [];
  }

  /**
   * Compare multiple funds
   * Returns: array of fund objects with returns and risk metrics aligned
   */
  async compareFunds(schemeCodes) {
    try {
      const funds = await Promise.all(
        schemeCodes.map(code => this.getFund(code))
      );
      return funds;
    } catch (error) {
      console.error('Comparison failed:', error);
      throw error;
    }
  }

  /**
   * Calculate SIP returns
   * Params: monthlyAmount, annualReturn (%), months
   * Returns: { invested, growth, maturityAmount }
   */
  calculateSIP(monthlyAmount, annualReturn, months) {
    if (monthlyAmount <= 0 || months <= 0) {
      return { invested: 0, growth: 0, maturityAmount: 0 };
    }

    const monthlyRate = (annualReturn / 100) / 12;
    const invested = monthlyAmount * months;
    
    // Future value of annuity formula
    let maturityAmount = 0;
    if (monthlyRate > 0) {
      maturityAmount = monthlyAmount * (
        (Math.pow(1 + monthlyRate, months) - 1) / monthlyRate
      ) * (1 + monthlyRate);
    } else {
      maturityAmount = invested;
    }

    const growth = maturityAmount - invested;

    return {
      invested: Math.round(invested),
      growth: Math.round(growth),
      maturityAmount: Math.round(maturityAmount),
      totalReturn: growth > 0 ? ((growth / invested) * 100).toFixed(2) : '0'
    };
  }

  /**
   * Clear cache
   */
  clearCache() {
    this.cache.clear();
  }

  /**
   * Get cache stats (for debugging)
   */
  getCacheStats() {
    return {
      entries: this.cache.size,
      pending: this.pendingRequests.size
    };
  }
}

// Export singleton instance
window.dataService = new DataService();
