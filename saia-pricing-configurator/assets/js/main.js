/**
 * Shared Logic for Pricing System
 * Handles common interactions and WordPress theme compatibility
 */

/**
 * WordPress/Avada Theme Compatibility
 * Removes bottom padding/margin from ALL ancestor containers of plugin wrappers
 * to prevent extra space below the footer in WordPress pages.
 */
(function () {
  'use strict';

  function removeAncestorBottomSpacing() {
    var selectors = [
      '.saia-configurator-wrapper',
      '.saia-plans-wrapper',
      '.saia-comparison-wrapper'
    ];

    selectors.forEach(function (sel) {
      var wrapper = document.querySelector(sel);
      if (!wrapper) return;

      var el = wrapper.parentElement;
      while (el && el !== document.body && el !== document.documentElement) {
        el.style.paddingBottom = '0';
        el.style.marginBottom = '0';
        el = el.parentElement;
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', removeAncestorBottomSpacing);
  } else {
    removeAncestorBottomSpacing();
  }
})();
