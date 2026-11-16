/**
 * SupportFlow Precision Enterprise - Feature Bootstrapper & Utilities
 * Provides feature initialization hooks, application metadata, and runtime utilities.
 */
(function() {
  'use strict';

  if (typeof window !== 'undefined') {
    window.SupportFlow = window.SupportFlow || {
      version: '1.0.0',
      initializedAt: new Date().toISOString(),
      getEnvironment: function() {
        return window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
          ? 'development'
          : 'production';
      }
    };
  }
})();

