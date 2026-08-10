// scripts/update-html.js
// Applies audit improvements to all HTML files:
// 1. Adds preconnect links for Google Fonts
// 2. Adds favicon (SVG + PNG fallback)
// 3. Fixes apple-touch-icon to point to generated PNG 180x180
// 4. Bumps CSS version to v1.20
// 5. Fixes video: adds preload=none, poster, aria-label (only index pages)
// 6. Replaces inline script with home.js reference (only index pages)

const fs = require('fs');
const path = require('path');

const WEB_ROOT = path.join(__dirname, '..');
const CSS_VERSION = '1.20';

// All HTML files to process (relative to WEB_ROOT)
const ALL_HTML = [
    'index.html',
    'programacio.html',
    'noticies.html',
    'galeria.html',
    'quisom.html',
    'temps.html',
    'contacte.html',
    'avis-legal.html',
    'privacitat.html',
    'cookies.html',
    'es/index.html',
    'es/programacio.html',
    'es/noticies.html',
    'es/galeria.html',
    'es/quisom.html',
    'es/temps.html',
    'es/contacte.html',
    'es/avis-legal.html',
    'es/privacitat.html',
    'es/cookies.html',
];

// Index pages where video + inline script changes apply
const INDEX_PAGES = ['index.html', 'es/index.html'];

function processHtml(relPath) {
    const filePath = path.join(WEB_ROOT, relPath);
    if (!fs.existsSync(filePath)) {
        console.log(`  SKIP (not found): ${relPath}`);
        return;
    }

    let html = fs.readFileSync(filePath, 'utf8');
    let changed = false;

    // --- 1. Add preconnect hints (only if not already present) ---
    if (!html.includes('fonts.googleapis.com" crossorigin') && !html.includes('preconnect" href="https://fonts.googleapis.com"')) {
        html = html.replace(
            '<meta charset="UTF-8">',
            '<meta charset="UTF-8">\n    <!-- Preconnect per a Google Fonts (millora rendiment) -->\n    <link rel="preconnect" href="https://fonts.googleapis.com">\n    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>'
        );
        changed = true;
    }

    // --- 2. Fix apple-touch-icon to PNG (if it still points to SVG) ---
    if (html.includes('<link rel="apple-touch-icon" href="/img/icon-512.svg">')) {
        html = html.replace(
            '<link rel="apple-touch-icon" href="/img/icon-512.svg">',
            '<link rel="apple-touch-icon" href="/img/apple-touch-icon.png">'
        );
        changed = true;
    }

    // --- 3. Add favicon link (only if not already present) ---
    if (!html.includes('rel="icon" href="/img/logo.svg"')) {
        html = html.replace(
            '    <link rel="apple-touch-icon" href="/img/apple-touch-icon.png">',
            '    <link rel="apple-touch-icon" href="/img/apple-touch-icon.png">\n    <link rel="icon" href="/img/logo.svg" type="image/svg+xml">\n    <link rel="icon" href="/favicon.png" type="image/png">'
        );
        changed = true;
    }

    // --- 4. Bump CSS version ---
    const cssVersionRegex = /\/css\/styles\.css\?v=[0-9.]+/g;
    if (cssVersionRegex.test(html)) {
        html = html.replace(/\/css\/styles\.css\?v=[0-9.]+/g, `/css/styles.css?v=${CSS_VERSION}`);
        changed = true;
    }

    // --- 5 & 6. Index-page-specific changes ---
    if (INDEX_PAGES.includes(relPath)) {

        // 5a. Add preload=none, poster, aria-label to video (only if not already present)
        if (html.includes('<video autoplay muted loop playsinline>')) {
            html = html.replace(
                '<video autoplay muted loop playsinline>',
                '<video autoplay muted loop playsinline preload="none" poster="/img/portada.webp" aria-label="Entorn i Ball Pla d\'Ares del Maestrat">'
            );
            changed = true;
        }

        // 5b. Remove the unused portada.jpg <source> if present (we already removed the static image)
        // (skip if already absent)

        // 6. Replace inline script block with external home.js reference
        // Find the inline <script> that starts with DOMContentLoaded
        const scriptStartSearch = '    <script>\n        document.addEventListener(\'DOMContentLoaded\', async () => {';
        const scriptStartSearchCRLF = '    <script>\r\n        document.addEventListener(\'DOMContentLoaded\', async () => {';
        const metricoolSearch = '    <!-- Metricool';

        let scriptStart = html.indexOf(scriptStartSearch);
        if (scriptStart === -1) scriptStart = html.indexOf(scriptStartSearchCRLF);

        const metricoolPos = html.indexOf(metricoolSearch);

        if (scriptStart !== -1 && metricoolPos !== -1) {
            // Find the </script> right before Metricool
            const scriptEndTag = '</script>';
            // Look backward from metricoolPos
            let scriptEndPos = html.lastIndexOf(scriptEndTag, metricoolPos);
            if (scriptEndPos !== -1 && scriptEndPos > scriptStart) {
                const before = html.substring(0, scriptStart);
                const after = html.substring(scriptEndPos + scriptEndTag.length);
                html = before + '    <script src="/js/home.js?v=' + CSS_VERSION + '" defer></script>' + after;
                console.log(`  -> Replaced inline script with home.js ref`);
                changed = true;
            }
        } else if (html.includes('/js/home.js')) {
            console.log(`  -> home.js already referenced`);
        } else {
            console.log(`  WARNING: Could not find inline script block in ${relPath}`);
        }
    }

    if (changed) {
        fs.writeFileSync(filePath, html, 'utf8');
        console.log(`  UPDATED: ${relPath}`);
    } else {
        console.log(`  OK (no changes needed): ${relPath}`);
    }
}

console.log('=== Applying audit improvements to HTML files ===\n');
ALL_HTML.forEach(f => {
    process.stdout.write(`Processing ${f}...\n`);
    processHtml(f);
});
console.log('\n=== Done ===');
