// js/home.js
// Logic for the home page (index.html and es/index.html)
// Extracted from inline script to allow browser caching between visits.

    document.addEventListener('DOMContentLoaded', async () => {
        // Wait for DB to be initialized
        setTimeout(async () => {
        await initHomeLayout();
        await loadHomeData();
        await loadWeather();
        }, 100);

        // Smooth scroll for hero button
        document.getElementById('scroll-down').addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('welcome-section').scrollIntoView({ behavior: 'smooth' });
        });

        // Start countdown
        initCountdown();
    });

    async function initHomeLayout() {
        const container = document.getElementById('home-sections-container');
        if (!container) return;

        let config = null;
        if (window.db && typeof window.db.getHomeConfig === 'function') {
        config = await window.db.getHomeConfig();
        } else {
        const stored = localStorage.getItem('ares_home_config');
        if (stored) {
            try { config = JSON.parse(stored); } catch (e) {}
        }
        }

        if (!config) return;

        // 1. Update Welcome text
        const welcomeP = document.getElementById('welcome-text-p');
        const isEs = window.location.pathname.startsWith('/es/');
        const welcomeText = isEs ? (config.welcome_text_es || config.welcome_text) : (config.welcome_text || config.welcome_text_es);
        if (welcomeP && welcomeText) {
        welcomeP.textContent = welcomeText;
        }

        // 2. Reorder blocks DOM nodes
        const blockOrder = config.block_order || [];
        const hiddenBlocks = config.hidden_blocks || [];

        blockOrder.forEach(blockId => {
        const sec = document.getElementById(blockId);
        if (sec) {
            container.appendChild(sec);
            if (hiddenBlocks.includes(blockId)) {
            sec.style.display = 'none';
            } else if (blockId !== 'countdown-section') {
            sec.style.display = '';
            }
        }
        });

        hiddenBlocks.forEach(blockId => {
        const sec = document.getElementById(blockId);
        if (sec) {
            sec.style.display = 'none';
        }
        });
    }

    async function initCountdown() {
        const section = document.getElementById('countdown-section');
        if (!section) return;

        let config = null;
        if (window.db && typeof window.db.getCountdown === 'function') {
        config = await window.db.getCountdown();
        } else {
        const stored = localStorage.getItem('ares_countdown');
        if (stored) {
            try { config = JSON.parse(stored); } catch (e) {}
        }
        }

        if (!config) {
        config = {
            enabled: true,
            title: "FESTES D'ARES 2026",
            target_date: "2026-08-16T00:00:00",
            description: "Les Festes Patronals d'Ares del Maestrat 2026 tindran lloc del 16 al 25 d'agost."
        };
        }

        if (config.enabled === false) {
        section.style.display = 'none';
        return;
        } else {
        section.style.display = 'block';
        }

        const titleHeading = document.getElementById('countdown-title-heading');
        if (titleHeading && config.title) {
        titleHeading.textContent = config.title;
        }

        const descText = document.getElementById('countdown-desc-text');
        if (descText && config.description) {
        descText.textContent = config.description;
        }

        const targetDate = new Date(config.target_date || "2026-08-16T00:00:00");

        // Rule: Auto-disable if target date has already passed
        if (targetDate - new Date() <= 0) {
        section.style.display = 'none';
        if (config.enabled !== false) {
            config.enabled = false;
            if (window.db && typeof window.db.saveCountdown === 'function') {
            window.db.saveCountdown(config).catch(() => {});
            }
        }
        return;
        }

        function updateValue(id, newValue) {
        const el = document.getElementById(id);
        if (!el) return;
        if (el.textContent !== newValue) {
            el.textContent = newValue;
            el.classList.remove('animate-roll');
            void el.offsetWidth; // Force reflow
            el.classList.add('animate-roll');
        }
        }

        let countdownTimer = null;

        function update() {
        const currentDate = new Date();
        let diffMs = targetDate - currentDate;

        if (diffMs <= 0) {
            if (countdownTimer) clearInterval(countdownTimer);
            section.style.display = 'none';
            if (config.enabled !== false) {
            config.enabled = false;
            if (window.db && typeof window.db.saveCountdown === 'function') {
                window.db.saveCountdown(config).catch(() => {});
            }
            }
            return;
        }

        // Month calculation
        let months = (targetDate.getFullYear() - currentDate.getFullYear()) * 12 + (targetDate.getMonth() - currentDate.getMonth());
        
        let tempDate = new Date(currentDate.getTime());
        tempDate.setMonth(tempDate.getMonth() + months);
        if (tempDate > targetDate) {
            months--;
            tempDate = new Date(currentDate.getTime());
            tempDate.setMonth(tempDate.getMonth() + months);
        }

        const oneDay = 24 * 60 * 60 * 1000;
        let diffDaysMs = targetDate - tempDate;
        const days = Math.floor(diffDaysMs / oneDay);

        tempDate.setTime(tempDate.getTime() + days * oneDay);
        let remainingMs = targetDate - tempDate;

        const hours = Math.floor(remainingMs / (60 * 60 * 1000));
        remainingMs %= 60 * 60 * 1000;

        const minutes = Math.floor(remainingMs / (60 * 1000));
        remainingMs %= 60 * 1000;

        const seconds = Math.floor(remainingMs / 1000);

        updateValue('countdown-months', String(months).padStart(2, '0'));
        updateValue('countdown-days', String(days).padStart(2, '0'));
        updateValue('countdown-hours', String(hours).padStart(2, '0'));
        updateValue('countdown-minutes', String(minutes).padStart(2, '0'));
        updateValue('countdown-seconds', String(seconds).padStart(2, '0'));
        }

        countdownTimer = setInterval(update, 1000);
        update();
    }

    async function loadHomeData() {
        try {
        // Load News (Max 3)
        const newsList = await window.db.getNews();
        const newsContainer = document.getElementById('news-container');
        
        // Filter out drafts
        const publicNewsList = (newsList || []).filter(item => (item.status || 'published') !== 'draft');
        
        if (publicNewsList && publicNewsList.length > 0) {
            newsContainer.innerHTML = publicNewsList.slice(0, 3).map((item, idx) => {
            const plainContent = stripHTML(item.content);
            const excerpt = item.subtitle || (plainContent.length > 100 ? plainContent.substring(0, 100) + '...' : plainContent);
            const escTitle = window.db.escapeHTML(item.title);
            const escExcerpt = window.db.escapeHTML(excerpt);
            const escAlt = item.image_alt ? window.db.escapeHTML(item.image_alt) : escTitle;
            const articleUrl = item.slug ? `noticies?slug=${item.slug}` : `noticies?id=${item.id}`;
            return `
                <article class="news-card animate-fade-in-up" style="cursor: pointer; transition-delay: ${idx * 0.05}s;" onclick="window.location.href='${articleUrl}'">
                <div class="news-img-wrapper">
                    ${window.getNewsImageHTML(item.image_url, escAlt)}
                </div>
                <div class="news-info">
                    <span class="news-date">${formatNewsDate(item.created_at)}</span>
                    <h3 class="news-title" style="margin-top: 0.5rem; margin-bottom: 0.5rem;">${escTitle}</h3>
                    <p class="news-excerpt" style="display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.4; font-size: 0.9rem;">${escExcerpt}</p>
                    <a href="${articleUrl}" class="news-more" style="margin-top: auto;">Llegir més <i data-lucide="arrow-right" style="width: 14px; height: 14px;"></i></a>
                </div>
                </article>
            `;
            }).join('');
        } else {
            newsContainer.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 2rem; color: var(--text-muted);">No hi ha notícies publicades actualment.</div>';
        }

        // Load Events (Max 3 upcoming)
        const eventsList = await window.db.getEvents();
        const eventsContainer = document.getElementById('events-highlight-container');
        const colors = window.db.getCategoryColors();

        if (eventsList && eventsList.length > 0) {
            // Filter upcoming events (or just show the first 3 if none are future)
            const today = new Date().toISOString().split('T')[0];
            let upcoming = eventsList.filter(e => e.date >= today);
            if (upcoming.length === 0) upcoming = eventsList; // fallback to all if none in future

            eventsContainer.innerHTML = upcoming.slice(0, 3).map((item, idx) => {
            const escTitle = window.db.escapeHTML(item.title);
            const escDesc = window.db.escapeHTML(item.description);
            const escLoc = window.db.escapeHTML(item.location);
            const escId = window.db.escapeHTML(item.id);
            const formattedDate = formatDate(item.date);
            return `
                <div class="home-event-card animate-fade-in-up" data-id="${escId}" style="transition-delay: ${idx * 0.05}s;" onclick="window.location.href='programacio'">
                <div class="event-title-row">
                    <h3>${escTitle}</h3>
                    <div style="display: flex; gap: 0.25rem;">
                    ${window.renderCategoryBadges(item.category)}
                    </div>
                </div>
                ${escDesc ? `<p class="event-desc">${escDesc}</p>` : ''}
                <div class="event-footer">
                    <div class="event-meta">
                    <span class="event-date-time">${formattedDate} — ${item.time}h</span>
                    <div class="event-location">
                        <i data-lucide="map-pin" style="width: 12px; height: 12px;"></i>
                        <span>${escLoc}</span>
                    </div>
                    </div>
                    <div class="event-arrow">
                    <i data-lucide="chevron-right"></i>
                    </div>
                </div>
                </div>
            `;
            }).join('');
        } else {
            eventsContainer.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--text-muted);">No hi ha esdeveniments programats.</div>';
        }

        // Load FAQs
        await loadHomeFaqs();

        // Refresh Lucide icons loaded dynamically
        if (window.lucide) {
            window.lucide.createIcons();
        }
        } catch (err) {
        console.error("Error loading home data:", err);
        }
    }

    async function loadHomeFaqs() {
        try {
        const faqs = await window.db.getFAQs();
        const container = document.getElementById('faqs-accordion-container');
        if (!container) return;

        if (!faqs || faqs.length === 0) {
            container.innerHTML = '<p style="color: var(--text-muted);">No hi ha preguntes disponibles.</p>';
            return;
        }

        container.innerHTML = faqs.map((faq, idx) => {
            const question = faq.question;
            const answer = faq.answer;
            const escQuestion = window.db.escapeHTML(question);
            const escAnswer = window.db.escapeHTML(answer);
            const faqId = window.db.escapeHTML(faq.id);

            return `
            <div class="faq-item" id="item-${faqId}">
                <button class="faq-trigger" aria-expanded="false" aria-controls="content-${faqId}">
                <h3 class="faq-question-text">${escQuestion}</h3>
                <div class="faq-toggle-icon">
                    <i data-lucide="plus" style="width: 14px; height: 14px;"></i>
                </div>
                </button>
                <div class="faq-content" id="content-${faqId}">
                <p>${escAnswer}</p>
                </div>
            </div>
            `;
        }).join('');

        // Bind accordion triggers
        container.querySelectorAll('.faq-item').forEach(item => {
            const trigger = item.querySelector('.faq-trigger');
            const content = item.querySelector('.faq-content');
            const icon = item.querySelector('.faq-toggle-icon');

            trigger.addEventListener('click', () => {
            const isOpen = item.classList.contains('active');
            
            // Close all other items
            container.querySelectorAll('.faq-item').forEach(otherItem => {
                if (otherItem !== item) {
                otherItem.classList.remove('active');
                otherItem.querySelector('.faq-trigger').setAttribute('aria-expanded', 'false');
                otherItem.querySelector('.faq-toggle-icon').innerHTML = '<i data-lucide="plus" style="width: 14px; height: 14px;"></i>';
                }
            });

            if (isOpen) {
                item.classList.remove('active');
                trigger.setAttribute('aria-expanded', 'false');
                icon.innerHTML = '<i data-lucide="plus" style="width: 14px; height: 14px;"></i>';
            } else {
                item.classList.add('active');
                trigger.setAttribute('aria-expanded', 'true');
                icon.innerHTML = '<i data-lucide="minus" style="width: 14px; height: 14px;"></i>';
            }

            if (window.lucide) window.lucide.createIcons();
            });
        });

        // Inject FAQ Schema (Structured Data)
        injectFaqSchema(faqs);

        if (window.lucide) window.lucide.createIcons();
        } catch (err) {
        console.error("Error loading FAQs on home:", err);
        }
    }

    function injectFaqSchema(faqs) {
        // Remove existing FAQ schema if present
        const oldSchema = document.getElementById('faq-schema-jsonld');
        if (oldSchema) oldSchema.remove();

        const schema = {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": faqs.map(faq => ({
            "@type": "Question",
            "name": faq.question,
            "acceptedAnswer": {
            "@type": "Answer",
            "text": faq.answer
            }
        }))
        };

        const script = document.createElement('script');
        script.type = 'application/ld+json';
        script.id = 'faq-schema-jsonld';
        script.textContent = JSON.stringify(schema, null, 2);
        document.head.appendChild(script);
    }

    function formatDate(dateStr) {
        const options = { day: 'numeric', month: 'short' };
        const date = new Date(dateStr);
        return date.toLocaleDateString('ca-ES', options).toUpperCase();
    }

    function formatNewsDate(dateStr) {
        if (!dateStr) return '';
        const options = { day: 'numeric', month: 'long', year: 'numeric' };
        const date = new Date(dateStr);
        return date.toLocaleDateString('ca-ES', options);
    }

    function stripHTML(html) {
        if (!html) return '';
        const doc = new DOMParser().parseFromString(html, 'text/html');
        return doc.body.textContent || "";
    }

    function getWeatherIconName(stateValue, description) {
        const val = String(stateValue);
        const desc = (description || '').toLowerCase();
        if (desc.includes('tormenta') || val === '43' || val === '44' || val === '45' || val === '46') return 'cloud-lightning';
        if (desc.includes('lluvia') || desc.includes('llovinna') || desc.includes('chubasco') || ['16', '17', '23', '24', '25', '26', '33', '34', '35', '36'].includes(val)) return 'cloud-rain';
        if (desc.includes('nieve') || ['71', '72', '73', '74', '37', '38'].includes(val)) return 'cloud-snow';
        if (desc.includes('cubierto') || desc.includes('muy nuboso') || ['14', '15'].includes(val)) return 'cloud';
        if (desc.includes('nuboso') || desc.includes('intervalos') || ['12', '13'].includes(val)) return 'cloud-sun';
        return 'sun';
    }

    const descTranslation = {
        'despejado': 'clar',
        'poco nuboso': 'poc núvol',
        'nuboso': 'núvol',
        'muy nuboso': 'molt núvol',
        'cubierto': 'cobert',
        'nubes altas': 'núvols alts',
        'intervalos nubosos': 'intervals de núvols',
        'lluvia': 'pluja',
        'lluvias': 'plujes',
        'chubasco': 'ruixat',
        'chubascos': 'ruixats',
        'tormenta': 'tempesta',
        'nieve': 'neu',
        'niebla': 'boira',
        'intervalos nubosos con lluvia escasa': 'intervals de núvols amb pluja escassa',
        'nuboso con lluvia': 'núvol amb pluja',
        'muy nuboso con lluvia': 'molt núvol amb pluja'
    };

    function renderWeather(forecast) {
        const container = document.getElementById('weather-forecast-container');
        if (!container || !forecast || forecast.length === 0) return;

        const isEs = window.location.pathname.includes('/es/');
        
        // Actualizar panel izquierdo con los datos de hoy
        const today = forecast[0];
        const todayMaxVal = today.tempMax !== null ? `${today.tempMax}°` : '--°';
        const todayMinVal = today.tempMin !== null ? `${today.tempMin}°` : '--°';
        
        const maxTitle = isEs ? 'Temperatura máxima' : 'Temperatura màxima';
        const minTitle = isEs ? 'Temperatura mínima' : 'Temperatura mínima';
        
        const tempHuge = document.getElementById('weather-temp-huge');
        if (tempHuge) {
        tempHuge.textContent = today.currentTemp !== undefined && today.currentTemp !== null 
            ? `${today.currentTemp}°` 
            : (today.tempMax !== null ? `${today.tempMax}°` : '--°');
        }
        
        const tempRangeSub = document.getElementById('weather-temp-range-sub');
        if (tempRangeSub) {
        tempRangeSub.innerHTML = `
            <span style="color: #ef4444;" title="${maxTitle}">${todayMaxVal}</span>
            <span style="color: var(--text-secondary); font-weight: 300; margin: 0 0.25rem;">/</span>
            <span style="color: #3b82f6;" title="${minTitle}">${todayMinVal}</span>
        `;
        }

        container.innerHTML = forecast.map((day, idx) => {
        const dateObj = new Date(day.date);
        const dayLabel = idx === 0 
            ? (isEs ? 'HOY' : 'HUI') 
            : idx === 1 
            ? (isEs ? 'MAÑANA' : 'DEMÀ') 
            : (isEs 
                ? ['DOMINGO', 'LUNES', 'MARTES', 'MIÉRCOLES', 'JUEVES', 'VIERNES', 'SÁBADO'][dateObj.getDay()]
                : ['DIUMENGE', 'DILLUNS', 'DIMARTS', 'DIMECRES', 'DIJOUS', 'DIVENDRES', 'DISSABTE'][dateObj.getDay()]
              );

        const iconName = getWeatherIconName(day.skyValue, day.skyDescription);
        
        let descText = day.skyDescription;
        if (!isEs) {
            const cleanDesc = descText.toLowerCase().trim();
            descText = descTranslation[cleanDesc] || descText;
        }

        const maxTemp = day.tempMax !== null ? `${day.tempMax}°C` : '--';
        const minTemp = day.tempMin !== null ? `${day.tempMin}°C` : '--';
        
        return `
            <div class="weather-day-item">
            <span class="weather-day-label">${dayLabel}</span>
            <i data-lucide="${iconName}" style="width: 36px; height: 36px; color: var(--text-primary); margin-bottom: 0.75rem;"></i>
            <span style="font-size: 0.8rem; font-weight: 300; color: var(--text-secondary); margin-bottom: 0.5rem; text-transform: capitalize; height: 2.4em; display: flex; align-items: center; justify-content: center; line-height: 1.2;">
                ${descText}
            </span>
            <div class="weather-day-temp-wrapper">
                <div class="weather-day-temp">
                <span style="color: #ef4444;" title="${maxTitle}">${maxTemp}</span>
                <span style="color: var(--text-muted); font-weight: 300;">/</span>
                <span style="color: #3b82f6;" title="${minTitle}">${minTemp}</span>
                </div>
                ${day.precipProb > 0 ? `
                <div class="weather-day-precip" style="margin-top: 0.25rem; font-size: 0.7rem; color: #3b82f6; display: flex; align-items: center; gap: 0.15rem; font-weight: 500;">
                    <i data-lucide="droplet" style="width: 10px; height: 10px;"></i> ${day.precipProb}%
                </div>
                ` : ''}
            </div>
            </div>
        `;
        }).join('');

        if (window.lucide) {
        window.lucide.createIcons();
        }
    }

    function getLocalDateStr(offsetDays = 0) {
        const d = new Date();
        if (offsetDays !== 0) {
        d.setDate(d.getDate() + offsetDays);
        }
        return d.toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' });
    }

    async function loadWeather() {
        const weatherWidget = document.getElementById('weather-widget');
        if (!weatherWidget) return;
        
        weatherWidget.style.display = 'flex';
        
        try {
        let forecast = null;
        const dbStatus = window.db ? window.db.getStatus() : 'local';
        
        if (dbStatus === 'supabase' && window.db.supabase) {
            try {
            const { data, error } = await window.db.supabase.functions.invoke('aemet-weather');
            if (error) {
                console.warn("Error invoking aemet-weather function, falling back to mock data:", error);
            } else if (data && data.forecast) {
                forecast = data.forecast;
            }
            } catch (e) {
            console.warn("Failed to fetch weather from Supabase function, falling back to mock data:", e);
            }
        }
        
        const mockForecast = [
            {
            date: getLocalDateStr(0),
            tempMax: 22,
            tempMin: 12,
            skyDescription: 'Despejado',
            skyValue: '11',
            precipProb: 0,
            windSpeed: 15,
            windDir: 'O'
            },
            {
            date: getLocalDateStr(1),
            tempMax: 24,
            tempMin: 13,
            skyDescription: 'Poco nuboso',
            skyValue: '12',
            precipProb: 10,
            windSpeed: 10,
            windDir: 'SO'
            },
            {
            date: getLocalDateStr(2),
            tempMax: 21,
            tempMin: 14,
            skyDescription: 'Intervalos nubosos con lluvia',
            skyValue: '23',
            precipProb: 65,
            windSpeed: 20,
            windDir: 'E'
            }
        ];

        if (!forecast) {
            forecast = mockForecast;
        }

        // Filter out past days so that today (current local date in Spain) is the first day
        const localTodayStr = getLocalDateStr(0);
        forecast = forecast.filter(day => day.date >= localTodayStr);
        
        if (forecast.length === 0) {
            forecast = mockForecast;
        }
        
        renderWeather(forecast.slice(0, 3));
        } catch (err) {
        console.error("Error loading weather:", err);
        const container = document.getElementById('weather-forecast-container');
        const isEs = window.location.pathname.includes('/es/');
        const errMsg = isEs ? "No se ha podido cargar la previsión del tiempo." : "No s'ha pogut carregar la previsió del temps.";
        if (container) {
            container.innerHTML = `<div style="grid-column: 1/-1; text-align: center; color: #ef4444; font-size: 0.85rem;">${errMsg}</div>`;
        }
        }
    }
