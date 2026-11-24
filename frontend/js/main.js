/**
 * SupportFlow Precision Enterprise - Feature Bootstrapper & Utilities
 * Provides feature initialization hooks, application metadata, security helpers, and runtime utilities.
 */
(function() {
  'use strict';

  var SupportFlow = {
    version: '1.0.0',
    initializedAt: new Date().toISOString(),

    getEnvironment: function() {
      return (typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'))
        ? 'development'
        : 'production';
    },

    /**
     * Complete HTML entity escaping for XSS prevention
     */
    escapeHtml: function(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    },

    /**
     * High-performance debounce utility for responsive input filtering
     */
    debounce: function(fn, delay) {
      var timeoutId;
      delay = typeof delay === 'number' ? delay : 150;
      return function() {
        var context = this;
        var args = arguments;
        clearTimeout(timeoutId);
        timeoutId = setTimeout(function() {
          fn.apply(context, args);
        }, delay);
      };
    },

    /**
     * Formats ISO date string to localized readable format
     */
    formatDate: function(dateStr, options) {
      if (!dateStr) return '';
      try {
        var d = new Date(dateStr);
        return isNaN(d.getTime()) ? dateStr : d.toLocaleDateString(undefined, options || {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      } catch (e) {
        return dateStr;
      }
    }
  };

  if (typeof window !== 'undefined') {
    window.SupportFlow = window.SupportFlow || SupportFlow;
  }
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = SupportFlow;
  }
})();
