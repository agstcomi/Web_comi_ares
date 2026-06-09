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
                <div class="footer-top-row">
                    <a href="index.html" class="footer-brand">
                        <img src="img/logo.svg" alt="Logo Comissió Ares">
                    </a>
                    <ul class="footer-nav">
                        <li><a href="index.html">Inici</a></li>
                        <li><a href="noticies.html">Notícies</a></li>
                        <li><a href="programacio.html">Programació</a></li>
                        <li><a href="galeria.html">Galeria</a></li>
                        <li><a href="quisom.html">Qui Som</a></li>
                        <li><a href="contacte.html">Contacte</a></li>
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
                        <a href="contacte.html" class="footer-contact-pill">Contacta'ns</a>
                        <div class="footer-contact-info">
                            <div><strong>Email:</strong> <a href="mailto:info@comiares.es">info@comiares.es</a></div>
                            <div><strong>Adreça:</strong> Plaça Major, 1. 12165 Ares del Maestrat (Castelló)</div>
                        </div>
                    </div>
                </div>
                
                <div class="footer-bottom-row">
                    <div class="footer-copyright">
                        &copy; ${new Date().getFullYear()} Comissió de Festes d'Ares del Maestrat. Tots els drets reservats.
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
