// js/main.js

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
});

function renderHeader() {
    const headerPlaceholder = document.getElementById('header-placeholder');
    if (!headerPlaceholder) return;

    // Get current filename to highlight active page
    const path = window.location.pathname;
    const page = path.split("/").pop() || 'index.html';

    const menuItems = [
        { name: 'Inici', file: 'index.html' },
        { name: 'Notícies', file: 'noticies.html' },
        { name: 'Programació', file: 'programacio.html' },
        { name: 'Galeria', file: 'galeria.html' },
        { name: 'Qui Som', file: 'quisom.html' },
        { name: 'Contacte', file: 'contacte.html' }
    ];

    let menuHTML = '';
    menuItems.forEach(item => {
        const isActive = page === item.file ? 'class="active"' : '';
        menuHTML += `<li><a href="${item.file}" ${isActive}>${item.name}</a></li>`;
    });

    headerPlaceholder.innerHTML = `
        <header class="main-header">
            <div class="container">
                <a href="index.html" class="logo" style="display: flex; align-items: center; height: 100%;">
                    <img src="img/logo.svg" alt="Logo Comissió Ares" style="height: 40px; width: auto;">
                </a>
                <button class="nav-toggle" id="nav-toggle" aria-label="Toggle Menu">
                    <i data-lucide="menu"></i>
                </button>
                <nav class="nav-menu" id="nav-menu">
                    <ul>
                        ${menuHTML}
                    </ul>
                </nav>
            </div>
        </header>
    `;
}

function renderFooter() {
    const footerPlaceholder = document.getElementById('footer-placeholder');
    if (!footerPlaceholder) return;

    footerPlaceholder.innerHTML = `
        <footer class="main-footer">
            <div class="container">
                <a href="index.html" class="logo" style="font-size: 1.5rem;">
                    Comissió de Festes d'Ares
                </a>
                <ul class="footer-nav">
                    <li><a href="index.html">Inici</a></li>
                    <li><a href="noticies.html">Notícies</a></li>
                    <li><a href="programacio.html">Programació</a></li>
                    <li><a href="galeria.html">Galeria</a></li>
                    <li><a href="quisom.html">Qui Som</a></li>
                    <li><a href="contacte.html">Contacte</a></li>
                </ul>
                <div class="social-links">
                    <a href="https://www.instagram.com/comi_ares" target="_blank" class="social-btn" aria-label="Instagram">
                        <svg xmlns="http://www.w3.org/2000/svg" width="45" height="45" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="12" fill="#000000"/>
                            <rect x="7" y="7" width="10" height="10" rx="2.5" stroke="#ffffff" stroke-width="1.2"/>
                            <circle cx="12" cy="12" r="2.2" stroke="#ffffff" stroke-width="1.2"/>
                            <circle cx="15.5" cy="8.5" r="0.6" fill="#ffffff"/>
                        </svg>
                    </a>
                    <a href="https://www.facebook.com/profile.php?id=61572448208798#" target="_blank" class="social-btn" aria-label="Facebook">
                        <svg xmlns="http://www.w3.org/2000/svg" width="45" height="45" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="12" fill="#000000"/>
                            <path d="M14 18.5V12h2.2l.3-2.6H14V7.8c0-.7.2-1.2 1.3-1.2H16.5V4.3c-.3 0-1.2-.1-2.2-.1-2.2 0-3.7 1.3-3.7 3.8V9.4H8.4V12h2.2v6.5H14z" fill="#ffffff"/>
                        </svg>
                    </a>
                    <a href="https://www.youtube.com/@comi_ares" target="_blank" class="social-btn" aria-label="Youtube">
                        <svg xmlns="http://www.w3.org/2000/svg" width="45" height="45" viewBox="0 0 24 24" fill="none">
                            <path d="M22.54 6.42a2.78 2.78 0 0 0-1.95-1.96C18.88 4 12 4 12 4s-6.88 0-8.59.46a2.78 2.78 0 0 0-1.95 1.96A29 29 0 0 0 1 12a29 29 0 0 0 .46 5.58 2.78 2.78 0 0 0 1.95 1.96C5.12 20 12 20 12 20s6.88 0 8.59-.46a2.78 2.78 0 0 0 1.95-1.96A29 29 0 0 0 23 12a29 29 0 0 0-.46-5.58z" fill="#000000"/>
                            <polygon points="9.75 15.02 15.5 12 9.75 8.98 9.75 15.02" fill="#ffffff"/>
                        </svg>
                    </a>
                    <a href="mailto:info@comiares.es" class="social-btn" aria-label="Email">
                        <svg xmlns="http://www.w3.org/2000/svg" width="45" height="45" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="12" fill="#000000"/>
                            <rect x="6" y="8" width="12" height="8" rx="1.5" stroke="#ffffff" stroke-width="1.2" fill="none"/>
                            <path d="M6 9l6 4 6-4" stroke="#ffffff" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
                        </svg>
                    </a>
                </div>
                <div class="copyright">
                    &copy; ${new Date().getFullYear()} Comissió de Festes d'Ares del Maestrat.
                </div>
            </div>
        </footer>
    `;
}
