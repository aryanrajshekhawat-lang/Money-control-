/**
 * UI Service Layer
 * 
 * Handles:
 * - Loading states and animations
 * - Error display and recovery
 * - Chart rendering (requires Chart.js)
 * - Formatting and display utilities
 */

class UIService {
  /**
   * Show loading state
   */
  static showLoading(elementId, message = 'Loading...') {
    const el = document.getElementById(elementId);
    if (!el) return;
    
    el.innerHTML = `
      <div class="loading-state">
        <div class="spinner"></div>
        <p>${this.escapeHtml(message)}</p>
      </div>
    `;
    el.classList.add('loading');
  }

  /**
   * Show error state with optional retry
   */
  static showError(elementId, message = 'Error loading data', onRetry = null) {
    const el = document.getElementById(elementId);
    if (!el) return;

    let html = `
      <div class="error-state">
        <p class="error-icon">⚠️</p>
        <p class="error-message">${this.escapeHtml(message)}</p>
    `;

    if (onRetry) {
      html += `<button class="retry-btn" onclick="this.parentElement.parentElement.retryAction()">Retry</button>`;
    }

    html += '</div>';
    el.innerHTML = html;
    el.classList.add('error');

    if (onRetry) {
      el.retryAction = onRetry;
    }
  }

  /**
   * Render NAV chart using Chart.js
   */
  static renderNAVChart(canvasId, navHistory, period = '1Y') {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return null;

    // Filter data by period
    const filtered = this.filterNAVByPeriod(navHistory, period);
    
    if (!filtered || filtered.length === 0) {
      canvas.parentElement.innerHTML = '<p>Insufficient data for chart</p>';
      return null;
    }

    // Destroy existing chart if any
    if (canvas.chart) {
      canvas.chart.destroy();
    }

    const ctx = canvas.getContext('2d');
    const dates = filtered.map(d => this.formatDate(d.date, 'short'));
    const navs = filtered.map(d => parseFloat(d.nav));

    // Calculate min/max for scaling
    const min = Math.min(...navs);
    const max = Math.max(...navs);
    const range = max - min;

    canvas.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: dates,
        datasets: [{
          label: 'NAV',
          data: navs,
          borderColor: '#2563eb',
          backgroundColor: 'rgba(37, 99, 235, 0.05)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 0,
          pointHoverRadius: 4,
          pointBackgroundColor: '#2563eb'
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        interaction: { mode: 'index', intersect: false },
        plugins: {
          legend: { display: false },
          filler: { propagate: true }
        },
        scales: {
          y: {
            min: min * 0.98,
            max: max * 1.02,
            ticks: {
              callback: v => '₹' + v.toFixed(0)
            }
          }
        }
      }
    });

    return canvas.chart;
  }

  /**
   * Render comparison chart
   */
  static renderComparisonChart(canvasId, funds, metric = 'returns') {
    const canvas = document.getElementById(canvasId);
    if (!canvas || !funds || funds.length === 0) return null;

    if (canvas.chart) {
      canvas.chart.destroy();
    }

    const labels = ['1M', '3M', '6M', '1Y', '3Y', '5Y', '10Y'];
    const ctx = canvas.getContext('2d');
    
    const datasets = funds.map((fund, idx) => {
      const colors = ['#2563eb', '#dc2626', '#16a34a', '#ea580c'];
      const data = labels.map(period => {
        const val = fund.returns?.[period];
        return val ? parseFloat(val) : null;
      });

      return {
        label: fund.schemeName || `Fund ${idx + 1}`,
        data: data,
        borderColor: colors[idx % colors.length],
        backgroundColor: colors[idx % colors.length] + '20',
        borderWidth: 2,
        fill: false,
        tension: 0.4,
        pointRadius: 4
      };
    });

    canvas.chart = new Chart(ctx, {
      type: 'line',
      data: { labels, datasets },
      options: {
        responsive: true,
        plugins: { legend: { position: 'bottom' } },
        scales: {
          y: { title: { display: true, text: 'Return (%)' } }
        }
      }
    });

    return canvas.chart;
  }

  /**
   * Format currency
   */
  static formatCurrency(value, decimals = 2) {
    if (value === null || value === undefined) return '—';
    const num = parseFloat(value);
    return '₹' + num.toLocaleString('en-IN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  }

  /**
   * Format percentage
   */
  static formatPercent(value, decimals = 2) {
    if (value === null || value === undefined) return '—';
    const num = parseFloat(value);
    const sign = num >= 0 ? '' : '';
    return sign + num.toFixed(decimals) + '%';
  }

  /**
   * Format date
   */
  static formatDate(dateStr, format = 'full') {
    const date = new Date(dateStr);
    if (isNaN(date)) return dateStr;

    if (format === 'short') {
      return date.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
    }
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  /**
   * Filter NAV history by period
   */
  static filterNAVByPeriod(history, period) {
    if (!history || history.length === 0) return [];

    const days = {
      '1M': 30,
      '3M': 90,
      '6M': 180,
      '1Y': 365,
      '3Y': 1095,
      '5Y': 1825,
      '10Y': 3650,
      'MAX': Infinity
    }[period] || 365;

    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);

    return history.filter(h => new Date(h.date) >= cutoff);
  }

  /**
   * Escape HTML to prevent XSS
   */
  static escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * Show toast notification
   */
  static showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.textContent = message;

    document.body.appendChild(toast);
    
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);

    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  /**
   * Debounce function for search input
   */
  static debounce(func, delay) {
    let timeout;
    return function (...args) {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), delay);
    };
  }
}

window.UIService = UIService;
