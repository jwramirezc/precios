/**
 * SAIA Tooltips — WordPress version (ultra-simple)
 * Creates/destroys a single popup div on hover. No caching, no CSS dependency.
 * NOTE: Element IDs avoid the word "tooltip" entirely because Bootstrap/WP themes
 * may have CSS rules targeting [id*="tooltip"] with opacity:0 / visibility:hidden.
 */

var SAIA_HINTS_CONFIG = null;

async function loadTooltipsConfig() {
    try {
        var baseUrl = typeof getDataUrl === 'function' ? getDataUrl() : 'assets/data/';
        var r = await fetch(baseUrl + 'tooltips-config.json');
        if (!r.ok) throw new Error('HTTP ' + r.status);
        SAIA_HINTS_CONFIG = await r.json();
        bindHintEvents();
    } catch (e) {
        console.warn('Hints:', e);
    }
}

function bindHintEvents() {
    var root = document.getElementById('saia-app-root') || document;

    root.addEventListener('mouseover', function (e) {
        var trigger = e.target.closest('[data-tooltip-id]');
        if (!trigger || !SAIA_HINTS_CONFIG) return;
        if (document.getElementById('saia-info-popup')) return;

        var id = trigger.getAttribute('data-tooltip-id');
        var data = SAIA_HINTS_CONFIG[id];
        if (!data) return;

        var rect = trigger.getBoundingClientRect();

        var d = document.createElement('div');
        d.id = 'saia-info-popup';
        d.innerHTML =
            '<div><strong>' + escapeHtml(data.titulo) + '</strong>' +
            '<p>' + escapeHtml(data.texto) + '</p></div>' +
            '<div id="saia-popup-arrow"></div>';
        document.body.appendChild(d);

        // All styles inline — no classes, no external CSS dependency
        var s = d.style;
        s.position = 'fixed';
        s.zIndex = '999999';
        s.maxWidth = '280px';
        s.background = '#1f2937';
        s.color = '#fff';
        s.padding = '12px 16px';
        s.borderRadius = '12px';
        s.fontSize = '14px';
        s.lineHeight = '1.5';
        s.fontFamily = 'Outfit, Inter, system-ui, sans-serif';
        s.boxShadow = '0 10px 15px -3px rgba(0,0,0,.1), 0 4px 6px -2px rgba(0,0,0,.05)';
        s.pointerEvents = 'none';
        s.opacity = '1';
        s.visibility = 'visible';
        s.display = 'block';

        // Style title
        var title = d.querySelector('strong');
        if (title) { title.style.display = 'block'; title.style.marginBottom = '6px'; title.style.fontWeight = '600'; }

        // Style paragraph
        var para = d.querySelector('p');
        if (para) { para.style.margin = '0'; para.style.color = 'rgba(255,255,255,.9)'; para.style.fontSize = '14px'; }

        // Style arrow
        var arrow = document.getElementById('saia-popup-arrow');
        if (arrow) {
            arrow.style.position = 'absolute';
            arrow.style.top = '-6px';
            arrow.style.left = '50%';
            arrow.style.transform = 'translateX(-50%)';
            arrow.style.width = '0';
            arrow.style.height = '0';
            arrow.style.borderLeft = '6px solid transparent';
            arrow.style.borderRight = '6px solid transparent';
            arrow.style.borderBottom = '6px solid #1f2937';
        }

        // Position below trigger
        var tw = d.offsetWidth;
        var top = rect.bottom + 8;
        var left = rect.left + (rect.width / 2) - (tw / 2);
        var vw = window.innerWidth;
        if (left + tw > vw - 10) left = vw - tw - 10;
        if (left < 10) left = 10;

        s.top = top + 'px';
        s.left = left + 'px';
    });

    root.addEventListener('mouseout', function (e) {
        var trigger = e.target.closest('[data-tooltip-id]');
        if (!trigger) return;
        if (trigger.contains(e.relatedTarget)) return;
        var tip = document.getElementById('saia-info-popup');
        if (tip) tip.remove();
    });

    root.addEventListener('click', function (e) {
        var trigger = e.target.closest('[data-tooltip-id]');
        if (!trigger) {
            var tip = document.getElementById('saia-info-popup');
            if (tip) tip.remove();
            return;
        }
        e.preventDefault();
        var existing = document.getElementById('saia-info-popup');
        if (existing) { existing.remove(); return; }
        trigger.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    });
}

function escapeHtml(text) {
    var d = document.createElement('div');
    d.textContent = text;
    return d.innerHTML;
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadTooltipsConfig);
} else {
    loadTooltipsConfig();
}
