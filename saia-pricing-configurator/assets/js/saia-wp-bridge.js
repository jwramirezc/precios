/**
 * SAIA WordPress Bridge
 *
 * Loaded FIRST before any other SAIA script.
 * Provides global helpers for resolving data URLs and tooltip containers
 * when running inside WordPress via the SAIA plugin.
 *
 * Standalone (HTML opened directly): falls back to relative paths.
 * WordPress: uses saiaData.dataUrl injected by wp_localize_script.
 */

(function () {
    'use strict';

    /**
     * Returns the base URL for fetching JSON data files.
     * - In WordPress: saiaData.dataUrl (absolute URL to plugin's assets/data/)
     * - Standalone:   'assets/data/' (relative)
     */
    window.getDataUrl = function () {
        if (typeof saiaData !== 'undefined' && saiaData.dataUrl) {
            return saiaData.dataUrl;
        }
        return 'assets/data/';
    };

    /**
     * Returns the DOM element where tooltips should be appended.
     * - In WordPress: the scoped tooltip container inside #saia-app-root
     * - Standalone:   document.body (original behavior)
     */
    window.getSaiaTooltipContainer = function () {
        var container = document.querySelector('#saia-app-root .saia-tooltip-container');
        return container || document.body;
    };
})();
