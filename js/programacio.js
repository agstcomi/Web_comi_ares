// js/programacio.js

document.addEventListener('DOMContentLoaded', () => {
    let allEvents = [];
    let activeFilteredEvents = [];
    let currentCategory = 'all';
    let searchQuery = '';

    // Wait for DB initialization
    setTimeout(async () => {
        await initProgramacio();
    }, 100);

    async function initProgramacio() {
        try {
            allEvents = await window.db.getEvents();
            
            // Render category filters dynamically
            renderCategoryFilters();

            renderEvents();

            // Set up search box input
            const searchInput = document.getElementById('search-input');
            if (searchInput) {
                searchInput.addEventListener('input', (e) => {
                    searchQuery = e.target.value.toLowerCase().trim();
                    renderEvents();
                });
            }

            // Set up download calendar button
            const downloadCalBtn = document.getElementById('btn-download-full-calendar');
            if (downloadCalBtn) {
                downloadCalBtn.addEventListener('click', () => {
                    const isEs = window.location.pathname.includes('/es/');
                    if (activeFilteredEvents.length === 0) {
                        const alertMsg = isEs ? "No hay actos para exportar." : "No hi ha actes per exportar.";
                        alert(alertMsg);
                        return;
                    }
                    downloadICS(activeFilteredEvents, 'programa-festes-ares.ics');

                    // Visual confirmation micro-interaction
                    const originalHTML = downloadCalBtn.innerHTML;
                    const successText = isEs ? '¡Exportado!' : 'Exportat!';
                    downloadCalBtn.innerHTML = `<i data-lucide="check" style="width: 14px; height: 14px;"></i> <span>${successText}</span>`;
                    downloadCalBtn.classList.remove('btn-secondary');
                    downloadCalBtn.style.backgroundColor = '#10b981'; // Success Green
                    downloadCalBtn.style.color = '#ffffff';
                    downloadCalBtn.style.borderColor = '#10b981';
                    downloadCalBtn.style.pointerEvents = 'none';

                    if (window.lucide) {
                        window.lucide.createIcons();
                    }

                    setTimeout(() => {
                        downloadCalBtn.innerHTML = originalHTML;
                        downloadCalBtn.classList.add('btn-secondary');
                        downloadCalBtn.style.backgroundColor = '';
                        downloadCalBtn.style.color = '';
                        downloadCalBtn.style.borderColor = '';
                        downloadCalBtn.style.pointerEvents = 'auto';
                        if (window.lucide) {
                            window.lucide.createIcons();
                        }
                    }, 2500);
                });
            }
        } catch (error) {
            console.error("Error initializing programacio:", error);
            const isEs = window.location.pathname.includes('/es/');
            const errorMsg = isEs 
                ? 'Error al cargar los actos. Reinténtalo más tarde.'
                : 'Error al carregar els actes. Reintenta-ho més tard.';
            document.getElementById('events-timeline').innerHTML = 
                `<div style="text-align: center; color: red; padding: 2rem;">${errorMsg}</div>`;
        }
    }

    function renderEvents() {
        const timeline = document.getElementById('events-timeline');
        if (!timeline) return;

        const colors = window.db.getCategoryColors();
        const isEs = window.location.pathname.includes('/es/');

        // Filter events
        activeFilteredEvents = allEvents.filter(e => {
            const title = isEs && e.title_es ? e.title_es : e.title;
            const desc = isEs && e.description_es ? e.description_es : e.description;
            const loc = isEs && e.location_es ? e.location_es : e.location;

            const eventCategories = e.category ? e.category.split(',').map(c => c.trim()) : [];
            const matchesCategory = currentCategory === 'all' || eventCategories.includes(currentCategory);
            const matchesSearch = (title || '').toLowerCase().includes(searchQuery) || 
                                  (desc || '').toLowerCase().includes(searchQuery) ||
                                  (loc || '').toLowerCase().includes(searchQuery);
            return matchesCategory && matchesSearch;
        });

        if (activeFilteredEvents.length === 0) {
            const emptyText = isEs 
                ? 'No se ha encontrado ningún acto que coincida con los criterios de búsqueda.'
                : "No s'ha trobat cap acte que coincidisca amb els criteris de cerca.";
            timeline.innerHTML = `
                <div style="text-align: center; padding: 4rem 2rem; color: var(--text-muted);">
                    <i data-lucide="calendar-x" style="width: 48px; height: 48px; margin-bottom: 1rem; color: var(--text-muted);"></i>
                    <p>${emptyText}</p>
                </div>
            `;
            if (window.lucide) window.lucide.createIcons();
            return;
        }

        // Group filtered events by date
        const grouped = {};
        activeFilteredEvents.forEach(event => {
            if (!grouped[event.date]) {
                grouped[event.date] = [];
            }
            grouped[event.date].push(event);
        });

        // Sort dates chronologically
        const sortedDates = Object.keys(grouped).sort((a, b) => new Date(a) - new Date(b));

        let timelineHTML = '';
        sortedDates.forEach(dateStr => {
            const events = grouped[dateStr];
            const dateObj = new Date(dateStr);
            
            const daysCa = ['Diumenge', 'Dilluns', 'Dimarts', 'Dimecres', 'Dijous', 'Divendres', 'Dissabte'];
            const daysEs = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
            const monthsCa = ['de Gener', 'de Febrer', 'de Març', 'd\'Abril', 'de Maig', 'de Juny', 'de Juliol', 'd\'Agost', 'de Setembre', 'd\'Octubre', 'de Novembre', 'de Desembre'];
            const monthsEs = ['de Enero', 'de Febrero', 'de Marzo', 'de Abril', 'de Mayo', 'de Junio', 'de Julio', 'de Agosto', 'de Septiembre', 'de Octubre', 'de Noviembre', 'de Diciembre'];
            
            const dayOfWeek = isEs ? daysEs[dateObj.getDay()] : daysCa[dateObj.getDay()];
            const dayOfMonth = dateObj.getDate();
            const monthName = isEs ? monthsEs[dateObj.getMonth()] : monthsCa[dateObj.getMonth()];
            const year = dateObj.getFullYear();

            timelineHTML += `
                <div class="timeline-day-group animate-fade-in-up">
                    <div class="timeline-date-container">
                        <h3 class="timeline-date-full">${dayOfMonth} ${monthName} ${year}</h3>
                        <p class="timeline-date-day">${dayOfWeek}</p>
                    </div>
                    <div class="timeline-events-list">
                        ${events.map((event, idx) => {
                            const title = isEs && event.title_es ? event.title_es : event.title;
                            const desc = isEs && event.description_es ? event.description_es : event.description;
                            const loc = isEs && event.location_es ? event.location_es : event.location;

                            const escTitle = window.db.escapeHTML(title);
                            const escTime = window.db.escapeHTML(event.time);
                            const escDesc = window.db.escapeHTML(desc || '');
                            const escLoc = window.db.escapeHTML(loc || '');
                            const escId = window.db.escapeHTML(event.id);
                            const addText = isEs ? "Añadir" : "Afegir";
                            return `
                                <div class="event-row" data-id="${escId}" style="cursor: pointer;">
                                    <div class="event-content-col">
                                        <div class="event-title-row">
                                            <h3>${escTitle}</h3>
                                            <div style="display: flex; gap: 0.25rem; flex-wrap: wrap;">
                                                ${window.renderCategoryBadges(event.category)}
                                            </div>
                                        </div>
                                        <div class="event-meta-row">
                                            <span class="event-meta-time">${escTime} h</span>
                                            <span class="event-meta-separator">•</span>
                                            <div class="event-meta-location">
                                                <i data-lucide="map-pin" style="width: 12px; height: 12px;"></i>
                                                <span>${escLoc}</span>
                                            </div>
                                        </div>
                                        ${escDesc ? `<p class="event-desc">${escDesc}</p>` : ''}
                                    </div>
                                    <div class="event-actions-col">
                                        <button class="btn-add-cal" data-id="${escId}">
                                            <i data-lucide="calendar-plus" style="width: 12px; height: 12px;"></i>
                                            <span>${addText}</span>
                                        </button>
                                    </div>
                                </div>
                            `;
                        }).join('')}
                    </div>
                </div>
            `;
        });

        timeline.innerHTML = timelineHTML;

        // Bind click events to open event detail modal
        timeline.querySelectorAll('.event-row').forEach(row => {
            row.addEventListener('click', (e) => {
                if (e.target.closest('.event-actions-col') || e.target.closest('.btn-add-cal')) {
                    return;
                }
                const id = row.getAttribute('data-id');
                const selectedEvent = allEvents.find(event => event.id === id);
                if (selectedEvent) {
                    openEventModal(selectedEvent);
                }
            });
        });

        // Bind click events for individual event downloads
        timeline.querySelectorAll('.btn-add-cal').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation(); // Avoid triggering details modal
                const id = btn.getAttribute('data-id');
                const selectedEvent = allEvents.find(event => event.id === id);
                if (selectedEvent) {
                    downloadICS([selectedEvent], `${selectedEvent.title.toLowerCase().replace(/[^a-z0-9]/g, '-')}.ics`);

                    // Visual confirmation
                    const originalHTML = btn.innerHTML;
                    const successText = isEs ? '¡Añadido!' : 'Afegit!';
                    btn.innerHTML = `<i data-lucide="check" style="width: 12px; height: 12px;"></i> <span>${successText}</span>`;
                    btn.style.backgroundColor = '#d1fae5'; // Soft green background
                    btn.style.color = '#065f46'; // Dark green text
                    btn.style.borderColor = '#34d399';
                    btn.style.pointerEvents = 'none';

                    if (window.lucide) {
                        window.lucide.createIcons();
                    }

                    setTimeout(() => {
                        btn.innerHTML = originalHTML;
                        btn.style.backgroundColor = '';
                        btn.style.color = '';
                        btn.style.borderColor = '';
                        btn.style.pointerEvents = 'auto';
                        if (window.lucide) {
                            window.lucide.createIcons();
                        }
                    }, 2000);
                }
            });
        });

        // Initialize any new Lucide icons
        if (window.lucide) {
            window.lucide.createIcons();
        }

        // Inyectar datos estructurados JSON-LD (Schema Event)
        const oldJsonLd = document.getElementById('dynamic-event-jsonld');
        if (oldJsonLd) oldJsonLd.remove();

        const eventSchemas = activeFilteredEvents.map(event => {
            const title = isEs && event.title_es ? event.title_es : event.title;
            const desc = isEs && event.description_es ? event.description_es : event.description;
            const loc = isEs && event.location_es ? event.location_es : event.location;

            // Fecha de inicio (ISO 8601) con zona horaria de Madrid (+02:00 en agosto/verano)
            const startIso = `${event.date}T${event.time}:00+02:00`;
            // Calcular fecha de fin estimada (por defecto, hora de inicio + 2 horas)
            let endHour = parseInt(event.time.split(':')[0]) + 2;
            let endDateStr = event.date;
            if (endHour >= 24) {
                endHour = endHour - 24;
                const dateObj = new Date(event.date);
                dateObj.setDate(dateObj.getDate() + 1);
                endDateStr = dateObj.toISOString().split('T')[0];
            }
            const endHourStr = String(endHour).padStart(2, '0');
            const endMinuteStr = event.time.split(':')[1] || '00';
            const endIso = `${endDateStr}T${endHourStr}:${endMinuteStr}:00+02:00`;

            return {
                "@context": "https://schema.org",
                "@type": "Event",
                "name": title,
                "description": desc || title,
                "startDate": startIso,
                "endDate": endIso,
                "eventStatus": "https://schema.org/EventScheduled",
                "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
                "location": {
                    "@type": "Place",
                    "name": loc || "Ares del Maestrat",
                    "address": {
                        "@type": "PostalAddress",
                        "streetAddress": loc || "Ares del Maestrat",
                        "addressLocality": "Ares del Maestrat",
                        "addressRegion": "Castellón",
                        "addressCountry": "ES",
                        "postalCode": "12165"
                    }
                },
                "organizer": {
                    "@type": "Organization",
                    "name": "Comissió de Festes d'Ares del Maestrat",
                    "url": "https://www.comiares.es/"
                }
            };
        });

        if (eventSchemas.length > 0) {
            const script = document.createElement('script');
            script.type = 'application/ld+json';
            script.id = 'dynamic-event-jsonld';
            script.text = JSON.stringify(eventSchemas);
            document.head.appendChild(script);
        }
    }

    function downloadICS(events, filename) {
        let icsContent = "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Comissio de Festes d Ares//NONSGML//CA\r\nCALSCALE:GREGORIAN\r\n";
        const isEs = window.location.pathname.includes('/es/');

        events.forEach(e => {
            // Parse date
            const dateParts = e.date.split('-');
            const timeParts = e.time.split(':');
            const year = dateParts[0];
            const month = dateParts[1];
            const day = dateParts[2];
            const hour = timeParts[0] || '00';
            const minute = timeParts[1] || '00';
            
            const dtStart = `${year}${month}${day}T${hour}${minute}00`;
            
            // End time: start + 2 hours (default for a festival event)
            let endHour = parseInt(hour) + 2;
            let endDateStr = `${year}${month}${day}`;
            
            if (endHour >= 24) {
                endHour = endHour - 24;
                // Add 1 day
                const eventDate = new Date(e.date);
                const nextDay = new Date(eventDate.getTime() + 24 * 60 * 60 * 1000);
                endDateStr = nextDay.toISOString().split('T')[0].replace(/-/g, '');
            }
            
            const endTimeStr = String(endHour).padStart(2, '0') + String(minute).padStart(2, '0') + '00';
            const dtEnd = `${endDateStr}T${endTimeStr}`;

            const title = isEs && e.title_es ? e.title_es : e.title;
            const desc = isEs && e.description_es ? e.description_es : e.description;
            const loc = isEs && e.location_es ? e.location_es : e.location;
            
            icsContent += "BEGIN:VEVENT\r\n";
            icsContent += `UID:${e.id}@comissiodefestesares.cat\r\n`;
            icsContent += `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z\r\n`;
            icsContent += `DTSTART;TZID=Europe/Madrid:${dtStart}\r\n`;
            icsContent += `DTEND;TZID=Europe/Madrid:${dtEnd}\r\n`;
            icsContent += `SUMMARY:${title.replace(/,/g, '\\,')}\r\n`;
            icsContent += `DESCRIPTION:${desc.replace(/,/g, '\\,')}\r\n`;
            icsContent += `LOCATION:${loc.replace(/,/g, '\\,')}\r\n`;
            icsContent += "END:VEVENT\r\n";
        });
        
        icsContent += "END:VCALENDAR";
        
        const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement("a");
        if (link.download !== undefined) {
            link.setAttribute("href", url);
            link.setAttribute("download", filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    function formatFullDate(dateStr) {
        const isEs = window.location.pathname.includes('/es/');
        if (isEs) {
            const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
            const months = [
                'de Enero', 'de Febrero', 'de Marzo', 'de Abril', 'de Mayo', 'de Junio', 
                'de Julio', 'de Agosto', 'de Septiembre', 'de Octubre', 'de Noviembre', 'de Diciembre'
            ];
            
            const date = new Date(dateStr);
            const dayOfWeek = days[date.getDay()];
            const dayOfMonth = date.getDate();
            const monthName = months[date.getMonth()];
            const year = date.getFullYear();

            return `${dayOfWeek}, ${dayOfMonth} ${monthName} ${year}`;
        } else {
            const days = ['Diumenge', 'Dilluns', 'Dimarts', 'Dimecres', 'Dijous', 'Divendres', 'Dissabte'];
            const months = [
                'de Gener', 'de Febrer', 'de Març', 'd\'Abril', 'de Maig', 'de Juny', 
                'de Juliol', 'd\'Agost', 'de Setembre', 'd\'Octubre', 'de Novembre', 'de Desembre'
            ];
            
            const date = new Date(dateStr);
            const dayOfWeek = days[date.getDay()];
            const dayOfMonth = date.getDate();
            const monthName = months[date.getMonth()];
            const year = date.getFullYear();

            return `${dayOfWeek}, ${dayOfMonth} ${monthName} ${year}`;
        }
    }

    function renderCategoryFilters() {
        const container = document.getElementById('categories-container');
        if (!container) return;

        const colors = window.db.getCategoryColors();
        const isEs = window.location.pathname.includes('/es/');
        const allBtnText = isEs ? 'Todos los actos' : 'Tots els actes';
        
        let html = `<button class="filter-btn active" data-category="all">${allBtnText}</button>`;
        Object.keys(colors).forEach(cat => {
            const displayName = window.getCategoryName(cat);
            const safeCat = window.db.escapeHTML(cat);
            const safeDisplayName = window.db.escapeHTML(displayName);
            html += `<button class="filter-btn" data-category="${safeCat}">${safeDisplayName}</button>`;
        });
        container.innerHTML = html;

        const filterButtons = container.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentCategory = btn.getAttribute('data-category');
                renderEvents();
            });
        });
    }

    // Event Modal functions
    function openEventModal(event) {
        const modal = document.getElementById('event-detail-modal');
        const modalBody = document.getElementById('event-detail-modal-body');
        if (!modal || !modalBody) return;

        const isEs = window.location.pathname.includes('/es/');

        const title = isEs && event.title_es ? event.title_es : event.title;
        const desc = isEs && event.description_es ? event.description_es : event.description;
        const longDesc = isEs && event.long_description_es ? event.long_description_es : event.long_description;
        const loc = isEs && event.location_es ? event.location_es : event.location;

        const escTitle = window.db.escapeHTML(title);
        const escTime = window.db.escapeHTML(event.time);
        const escDate = formatFullDate(event.date);
        const escDesc = window.db.escapeHTML(desc || '');
        const sanitizedLongDesc = window.db.sanitizeHTML(longDesc || '');
        const escLoc = window.db.escapeHTML(loc || '');

        let imageHTML = '';
        if (event.image_url) {
            const escImg = window.db.escapeHTML(window.getAssetPath(event.image_url));
            let webpImg = escImg;
            const lastDot = escImg.lastIndexOf('.');
            if (lastDot !== -1) {
                const ext = escImg.substring(lastDot).toLowerCase();
                if (ext === '.jpg' || ext === '.jpeg' || ext === '.png') {
                    webpImg = escImg.substring(0, lastDot) + '.webp';
                }
            }
            imageHTML = `
                <div class="event-modal-img-wrapper">
                    <picture>
                        <source srcset="${webpImg}" type="image/webp">
                        <img src="${escImg}" alt="${escTitle}" style="width: 100%; height: auto; display: block; max-height: 320px; object-fit: cover;">
                    </picture>
                </div>
            `;
        }

        modalBody.innerHTML = `
            ${imageHTML}
            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem; flex-wrap: wrap;">
                <div style="display: flex; gap: 0.25rem; flex-wrap: wrap;">
                    ${window.renderCategoryBadges(event.category, 'margin-top: 0;')}
                </div>
                <span style="font-size: 0.85rem; color: var(--text-secondary); font-weight: 700;">${escDate} — ${escTime}h</span>
            </div>
            <h2 style="font-family: var(--font-heading); font-size: 1.75rem; margin-bottom: 1rem; color: var(--text-primary); text-transform: uppercase;">${escTitle}</h2>
            
            <div style="display: flex; align-items: center; gap: 0.5rem; color: var(--text-secondary); margin-bottom: 1.5rem; font-size: 0.9rem;">
                <i data-lucide="map-pin" style="width: 16px; height: 16px;"></i>
                <span>${escLoc}</span>
            </div>

            <p style="font-size: 1rem; line-height: 1.6; color: var(--text-primary); margin-bottom: 1.5rem; font-weight: 300;">
                ${escDesc}
            </p>

            ${sanitizedLongDesc ? `
                <div style="margin-top: 1.5rem; padding-top: 1.5rem; border-top: 1px solid var(--border-color); font-size: 0.95rem; line-height: 1.7; color: var(--text-secondary); font-weight: 300;">
                    ${sanitizedLongDesc}
                </div>
            ` : ''}
        `;

        modal.classList.add('active');
        document.body.style.overflow = 'hidden';

        if (window.lucide) window.lucide.createIcons();
    }

    function closeEventModal() {
        const modal = document.getElementById('event-detail-modal');
        if (modal) {
            modal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    // Modal Close event listeners
    const modalCloseBtn = document.getElementById('event-detail-close');
    const modalOverlay = document.getElementById('event-detail-modal');
    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeEventModal);
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) closeEventModal();
        });
    }
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeEventModal();
    });
});
