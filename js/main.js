// js/main.js

// 0. Redirección de URLs con extensión .html a URLs limpias
(function() {
    const currentPath = window.location.pathname;
    if (currentPath.endsWith('.html')) {
        let cleanPath = currentPath.slice(0, -5); // Quita '.html'
        if (cleanPath.endsWith('/index')) {
            cleanPath = cleanPath.slice(0, -5); // Convierte /index a / o /es/index a /es/
        }
        if (cleanPath === '' || cleanPath === '/es') {
            cleanPath = cleanPath + '/';
        }
        window.location.replace(cleanPath + window.location.search + window.location.hash);
    }
})();

document.addEventListener('DOMContentLoaded', () => {
    // 1. Render Header and Footer dynamically if container exists
    renderHeader();
    renderFooter();

    // 2. Mobile Menu Toggle
    const navToggle = document.getElementById('nav-toggle');
    const navMenu = document.getElementById('nav-menu');

    if (navToggle && navMenu) {
        navToggle.addEventListener('click', () => {
            navMenu.classList.toggle('active');
            // Toggle icon between menu and close
            const icon = navToggle.querySelector('i');
            if (icon) {
                if (navMenu.classList.contains('active')) {
                    icon.setAttribute('data-lucide', 'x');
                } else {
                    icon.setAttribute('data-lucide', 'menu');
                }
                if (window.lucide) window.lucide.createIcons();
            }
        });

        // Close menu when clicking on the dark overlay (navMenu itself)
        navMenu.addEventListener('click', (e) => {
            if (e.target === navMenu) {
                navMenu.classList.remove('active');
                const icon = navToggle.querySelector('i');
                if (icon) {
                    icon.setAttribute('data-lucide', 'menu');
                    if (window.lucide) window.lucide.createIcons();
                }
            }
        });
    }

    // 3. Scroll Header Effect
    const header = document.querySelector('header.main-header');
    const heroSection = document.querySelector('.hero');
    
    if (header) {
        if (heroSection) {
            header.classList.add('on-hero');
            const handleScroll = () => {
                if (window.scrollY > 50) {
                    header.classList.add('scrolled');
                    header.classList.remove('on-hero');
                } else {
                    header.classList.remove('scrolled');
                    header.classList.add('on-hero');
                }
            };
            window.addEventListener('scroll', handleScroll);
            handleScroll();
        } else {
            window.addEventListener('scroll', () => {
                if (window.scrollY > 50) {
                    header.classList.add('scrolled');
                } else {
                    header.classList.remove('scrolled');
                }
            });
        }
    }

    // 4. Initialize Lucide Icons
    if (window.lucide) {
        window.lucide.createIcons();
    }

    // 5. Scroll to top when clicking links of the current page
    document.addEventListener('click', (e) => {
        const anchor = e.target.closest('header.main-header a');
        if (!anchor) return;

        const href = anchor.getAttribute('href');
        if (!href) return;

        const path = window.location.pathname;
        let page = path.split("/").pop() || '';
        if (page === 'es' && path.endsWith('/es/')) {
            page = '';
        }

        // Match if href points to the current page
        const isCurrentPage = href === page || 
                              ((href === '.' || href === '') && page === '');

        if (isCurrentPage) {
            e.preventDefault();
            // Close mobile menu if active
            const navMenu = document.getElementById('nav-menu');
            if (navMenu && navMenu.classList.contains('active')) {
                navMenu.classList.remove('active');
                const navToggle = document.getElementById('nav-toggle');
                const icon = navToggle ? navToggle.querySelector('i') : null;
                if (icon) {
                    icon.setAttribute('data-lucide', 'menu');
                    if (window.lucide) window.lucide.createIcons();
                }
            }
            
            // Scroll to top smoothly
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        }
    });

    // 6. Scroll & Entrance Animation Observer
    const initEntranceAnimations = () => {
        if (!('IntersectionObserver' in window)) return;

        const scrollObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('visible');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            root: null,
            rootMargin: '0px 0px -40px 0px',
            threshold: 0.05
        });

        // Function to find and observe candidates
        const observeNewElements = (container) => {
            if (!container) return;
            const targets = container.querySelectorAll ? container.querySelectorAll('.animate-fade-in-up') : [];
            targets.forEach(target => scrollObserver.observe(target));
            // Check container itself
            if (container.classList && container.classList.contains('animate-fade-in-up')) {
                scrollObserver.observe(container);
            }
        };

        // Observe initial elements in the DOM
        observeNewElements(document);

        // Setup MutationObserver to watch for dynamic DOM updates (news grid, events grid, etc.)
        if ('MutationObserver' in window) {
            const mutObserver = new MutationObserver((mutations) => {
                mutations.forEach(mutation => {
                    mutation.addedNodes.forEach(node => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            observeNewElements(node);
                        }
                    });
                });
            });
            mutObserver.observe(document.body, {
                childList: true,
                subtree: true
            });
        }
    };
    initEntranceAnimations();
});

function renderHeader() {
    const headerPlaceholder = document.getElementById('header-placeholder');
    if (!headerPlaceholder) return;

    // Get current filename to highlight active page
    const path = window.location.pathname;
    const isEs = path.includes('/es/');
    let page = path.split("/").pop() || '';
    if (page === 'es' && path.endsWith('/es/')) {
        page = '';
    }

    const menuItems = isEs ? [
        { name: 'Inicio', file: '.' },
        { name: 'Noticias', file: 'noticies' },
        { name: 'Programación', file: 'programacio' },
        { name: 'Galería', file: 'galeria' },
        { name: 'Quiénes Somos', file: 'quisom' },
        { name: 'Tiempo', file: 'temps' },
        { name: 'Contacto', file: 'contacte' }
    ] : [
        { name: 'Inici', file: '.' },
        { name: 'Notícies', file: 'noticies' },
        { name: 'Programació', file: 'programacio' },
        { name: 'Galeria', file: 'galeria' },
        { name: 'Qui Som', file: 'quisom' },
        { name: 'Temps', file: 'temps' },
        { name: 'Contacte', file: 'contacte' }
    ];

    let menuHTML = '';
    menuItems.forEach(item => {
        const isActive = (page === item.file || (item.file === '.' && page === '')) ? 'class="active"' : '';
        menuHTML += `<li><a href="${item.file}" ${isActive}>${item.name}</a></li>`;
    });

    // Generate language switcher HTML with dropdown
    const searchParams = window.location.search;
    const valLink = isEs ? `../${page}${searchParams}` : `${page}${searchParams}`;
    const esLink = isEs ? `${page}${searchParams}` : `es/${page}${searchParams}`;

    const langDropdownHTML = `
        <div class="lang-dropdown">
            <button class="lang-dropdown-btn" aria-label="Seleccionar idioma">
                <span>${isEs ? 'ESP' : 'VAL'}</span>
                <i data-lucide="chevron-down" style="width: 14px; height: 14px; margin-left: 4px;"></i>
            </button>
            <div class="lang-dropdown-content">
                <a href="${valLink}" class="${!isEs ? 'active' : ''}">Valencià</a>
                <a href="${esLink}" class="${isEs ? 'active' : ''}">Castellano</a>
            </div>
        </div>
    `;

    const logoPath = isEs ? '../img/logo.svg' : 'img/logo.svg';

    headerPlaceholder.innerHTML = `
        <header class="main-header">
            <div class="container">
                <a href="." class="logo" style="display: flex; align-items: center; height: 100%;">
                    <img src="${logoPath}" alt="Logo Comissió Ares" style="height: 40px; width: auto;">
                </a>
                <button class="nav-toggle" id="nav-toggle" aria-label="Toggle Menu">
                    <i data-lucide="menu"></i>
                </button>
                <nav class="nav-menu" id="nav-menu">
                    <ul>
                        ${menuHTML}
                        <!-- Mobile-only language switcher -->
                        <li class="mobile-lang-switch">
                            ${langDropdownHTML}
                        </li>
                    </ul>
                </nav>
                <!-- Desktop-only language switcher -->
                <div class="desktop-lang-switch">
                    ${langDropdownHTML}
                </div>
            </div>
        </header>
    `;

    // Bind events to toggle language dropdown (especially for touch/mobile devices)
    document.querySelectorAll('.lang-dropdown-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Close other dropdowns
            document.querySelectorAll('.lang-dropdown-content').forEach(d => {
                if (d !== btn.nextElementSibling) {
                    d.classList.remove('show');
                    const otherBtn = d.previousElementSibling;
                    if (otherBtn) otherBtn.classList.remove('active');
                }
            });

            const content = btn.nextElementSibling;
            if (content) {
                const isShowing = content.classList.contains('show');
                content.classList.toggle('show');
                btn.classList.toggle('active');
            }
        });
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', () => {
        document.querySelectorAll('.lang-dropdown-content').forEach(d => {
            d.classList.remove('show');
        });
        document.querySelectorAll('.lang-dropdown-btn').forEach(btn => {
            btn.classList.remove('active');
        });
    });

    if (window.lucide) window.lucide.createIcons();
}

function renderFooter() {
    const footerPlaceholder = document.getElementById('footer-placeholder');
    if (!footerPlaceholder) return;

    const path = window.location.pathname;
    const isEs = path.includes('/es/');
    const logoPath = isEs ? '../img/logo.svg' : 'img/logo.svg';

    const menuItems = isEs ? [
        { name: 'Inicio', file: '.' },
        { name: 'Noticias', file: 'noticies' },
        { name: 'Programación', file: 'programacio' },
        { name: 'Galería', file: 'galeria' },
        { name: 'Quiénes Somos', file: 'quisom' },
        { name: 'Tiempo', file: 'temps' },
        { name: 'Contacto', file: 'contacte' }
    ] : [
        { name: 'Inici', file: '.' },
        { name: 'Notícies', file: 'noticies' },
        { name: 'Programació', file: 'programacio' },
        { name: 'Galeria', file: 'galeria' },
        { name: 'Qui Som', file: 'quisom' },
        { name: 'Temps', file: 'temps' },
        { name: 'Contacte', file: 'contacte' }
    ];

    let navHTML = '';
    menuItems.forEach(item => {
        navHTML += `<li><a href="${item.file}">${item.name}</a></li>`;
    });

    const contactText = isEs ? 'Contáctanos' : "Contacta'ns";
    const emailLabel = 'Email:';
    const addressLabel = isEs ? 'Dirección:' : 'Adreça:';
    const addressValue = 'Pl. Major, 9, 12165 Ares del Maestrat, Castelló';
    
    const copyrightText = isEs 
        ? `&copy; ${new Date().getFullYear()} Comisión de Fiestas de Ares del Maestrat. Todos los derechos reservados.`
        : `&copy; ${new Date().getFullYear()} Comissió de Festes d'Ares del Maestrat. Tots els drets reservats.`;

    footerPlaceholder.innerHTML = `
        <footer class="main-footer">
            <div class="container">
                <div class="footer-top-row">
                    <a href="." class="footer-brand">
                        <img src="${logoPath}" alt="Logo Comissió Ares">
                    </a>
                    <ul class="footer-nav">
                        ${navHTML}
                    </ul>
                    <div class="footer-socials">
                        <a href="https://instagram.com/comi_ares" target="_blank" class="footer-social-circle" aria-label="Instagram">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: block;"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                        </a>
                        <a href="https://www.facebook.com/profile.php?id=61572448208798#" target="_blank" class="footer-social-circle" aria-label="Facebook">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: block;"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                        </a>
                        <a href="https://www.youtube.com/@comi_ares" target="_blank" class="footer-social-circle" aria-label="YouTube">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="display: block;"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17z"/><path d="m10 15 5-3-5-3z"/></svg>
                        </a>
                    </div>
                </div>
                
                <div class="footer-middle-grid">
                    <div class="footer-contact-col">
                        <a href="contacte" class="footer-contact-pill">${contactText}</a>
                        <div class="footer-contact-info">
                            <div><strong>${emailLabel}</strong> <a href="mailto:info@comiares.es">info@comiares.es</a></div>
                            <div><strong>${addressLabel}</strong> ${addressValue}</div>
                        </div>
                    </div>
                </div>
                
                <div class="footer-bottom-row">
                    <div class="footer-copyright">
                        ${copyrightText}
                    </div>
                </div>
            </div>
        </footer>
    `;

    // Initialize Lucide icons if available
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

// Asset helper for multi-language directory paths
window.getAssetPath = function(url) {
    if (!url) return '';
    if (url.startsWith('http') || url.startsWith('data:image') || url.startsWith('/')) {
        return url;
    }
    const isEs = window.location.pathname.includes('/es/');
    return isEs ? '../' + url : url;
};

// Category translator for events and gallery
window.getCategoryName = function(category) {
    if (!category) return '';
    const isEs = window.location.pathname.includes('/es/');
    const catLower = category.toLowerCase().trim();
    
    const translations = {
        ca: {
            'musica': 'Música',
            'cultura': 'Cultura',
            'menjars': 'Menjars',
            'populars': 'Populars',
            'ball pla': 'Ball pla'
        },
        es: {
            'musica': 'Música',
            'cultura': 'Cultura',
            'menjars': 'Comidas',
            'populars': 'Populares',
            'ball pla': 'Ball pla'
        }
    };
    
    const lang = isEs ? 'es' : 'ca';
    if (translations[lang] && translations[lang][catLower]) {
        return translations[lang][catLower];
    }
    
    // Capitalize first letter as fallback
    return category.charAt(0).toUpperCase() + category.slice(1);
};
