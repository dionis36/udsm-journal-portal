/**
 * UDSM Journal Portal - Shadow DOM Heatmap Loader
 * This script allows the high-performance heatmap to be embedded into 
 * OJS/Legacy platforms while maintaining perfect CSS isolation.
 */
(function () {
    const CONFIG = {
        containerId: 'udsm-reader-heatmap',
        rootId: 'uds-heatmap-root',
        bundleUrl: '/_next/static/chunks/main.js', // Target the main bundle
        stylesUrl: '/_next/static/css/app/layout.css'
    };

    function init() {
        const target = document.getElementById(CONFIG.containerId);
        if (!target) {
            console.warn(`[UDSM-Insight] Target element #${CONFIG.containerId} not found.`);
            return;
        }

        // Create Shadow Root for total isolation
        const shadow = target.attachShadow({ mode: 'open' });

        // Inject Stylesheet link
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = CONFIG.stylesUrl;
        shadow.appendChild(link);

        // Create Root Element
        const root = document.createElement('div');
        root.id = CONFIG.rootId;
        root.style.width = '100%';
        root.style.height = '600px';
        root.style.borderRadius = '1.5rem';
        root.style.overflow = 'hidden';
        shadow.appendChild(root);

        // Inject Font Imports manually since Shadow DOM isolates them
        const fonts = document.createElement('style');
        fonts.textContent = `
            @import url('https://fonts.googleapis.com/css2?family=Montserrat:wght@700;900&family=Noto+Serif:ital,wght@1,700&display=swap');
        `;
        shadow.appendChild(fonts);

        console.info('[UDSM-Insight] Heatmap Shadow DOM initialized.');
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
