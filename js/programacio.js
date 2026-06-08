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
                    if (activeFilteredEvents.length === 0) {
                        alert("No hi ha actes per exportar.");
                        return;
                    }
                    downloadICS(activeFilteredEvents, 'programa-festes-ares.ics');
                });
            }
        } catch (error) {
            console.error("Error initializing programacio:", error);
            document.getElementById('events-timeline').innerHTML = 
                '<div style="text-align: center; color: red; padding: 2rem;">Error al carregar els actes. Reintenta-ho més tard.</div>';
        }
    }

    function renderEvents() {
        const timeline = document.getElementById('events-timeline');
        if (!timeline) return;

        const colors = window.db.getCategoryColors();

        // Filter events
        activeFilteredEvents = allEvents.filter(e => {
            const matchesCategory = currentCategory === 'all' || e.category === currentCategory;
            const matchesSearch = (e.title || '').toLowerCase().includes(searchQuery) || 
                                  (e.description || '').toLowerCase().includes(searchQuery) ||
                                  (e.location || '').toLowerCase().includes(searchQuery);
            return matchesCategory && matchesSearch;
        });

        if (activeFilteredEvents.length === 0) {
            timeline.innerHTML = `
                <div style="text-align: center; padding: 4rem 2rem; color: var(--text-muted);">
                    <i data-lucide="calendar-x" style="width: 48px; height: 48px; margin-bottom: 1rem; color: var(--text-muted);"></i>
                    <p>No s'ha trobat cap acte que coincidisca amb els criteris de cerca.</p>
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
            timelineHTML += `
                <div class="timeline-day-group">
                    <h3 class="timeline-date-header">${formatFullDate(dateStr)}</h3>
                    <div class="timeline-events-list">
                        ${events.map(event => {
                            const catColors = colors[event.category] || { bg: '#e4e4e7', text: '#18181b' };
                            const escTitle = window.db.escapeHTML(event.title);
                            const escTime = window.db.escapeHTML(event.time);
                            const escDesc = window.db.escapeHTML(event.description || '');
                            const escLoc = window.db.escapeHTML(event.location || '');
                            const escCat = window.db.escapeHTML(event.category || '');
                            const escId = window.db.escapeHTML(event.id);
                            return `
                                <div class="event-row" data-id="${escId}" style="cursor: pointer;">
                                    <div class="event-time">${escTime}</div>
                                    <div class="event-detail">
                                        <h3>${escTitle}</h3>
                                        <p>${escDesc}</p>
                                        <div class="event-location">
                                            <i data-lucide="map-pin" style="width: 14px; height: 14px;"></i>
                                            <span>${escLoc}</span>
                                        </div>
                                    </div>
                                    <div class="event-actions-col" style="justify-self: end; display: flex; flex-direction: column; align-items: flex-end; gap: 0.5rem;">
                                        <span class="event-tag" style="background-color: ${catColors.bg}; color: ${catColors.text};">${escCat}</span>
                                        <button class="btn btn-sm btn-secondary btn-add-cal" data-id="${escId}" style="padding: 0.35rem 0.6rem; font-size: 0.65rem; display: flex; align-items: center; gap: 0.25rem;">
                                            <i data-lucide="calendar-plus" style="width: 12px; height: 12px;"></i>
                                            <span>Afegir</span>
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
                }
            });
        });

        // Initialize any new Lucide icons
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    function downloadICS(events, filename) {
        let icsContent = "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nPRODID:-//Comissio de Festes d Ares//NONSGML//CA\r\nCALSCALE:GREGORIAN\r\n";
        
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
            
            icsContent += "BEGIN:VEVENT\r\n";
            icsContent += `UID:${e.id}@comissiodefestesares.cat\r\n`;
            icsContent += `DTSTAMP:${new Date().toISOString().replace(/[-:]/g, '').split('.')[0]}Z\r\n`;
            icsContent += `DTSTART;TZID=Europe/Madrid:${dtStart}\r\n`;
            icsContent += `DTEND;TZID=Europe/Madrid:${dtEnd}\r\n`;
            icsContent += `SUMMARY:${e.title.replace(/,/g, '\\,')}\r\n`;
            icsContent += `DESCRIPTION:${e.description.replace(/,/g, '\\,')}\r\n`;
            icsContent += `LOCATION:${e.location.replace(/,/g, '\\,')}\r\n`;
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

    function renderCategoryFilters() {
        const container = document.getElementById('categories-container');
        if (!container) return;

        const colors = window.db.getCategoryColors();
        let html = '<button class="filter-btn active" data-category="all">Tots els actes</button>';
        Object.keys(colors).forEach(cat => {
            const displayName = cat.charAt(0).toUpperCase() + cat.slice(1);
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

        const colors = window.db.getCategoryColors();
        const catColors = colors[event.category] || { bg: '#e4e4e7', text: '#18181b' };

        const escTitle = window.db.escapeHTML(event.title);
        const escTime = window.db.escapeHTML(event.time);
        const escDate = formatFullDate(event.date);
        const escDesc = window.db.escapeHTML(event.description || '');
        const sanitizedLongDesc = window.db.sanitizeHTML(event.long_description || '');
        const escLoc = window.db.escapeHTML(event.location || '');
        const escCat = window.db.escapeHTML(event.category || '');

        let imageHTML = '';
        if (event.image_url) {
            const escImg = window.db.escapeHTML(event.image_url);
            imageHTML = `
                <div class="event-modal-img-wrapper" style="width: 100%; margin-bottom: 1.5rem; border-radius: 8px; overflow: hidden; border: 1px solid var(--border-color);">
                    <img src="${escImg}" alt="${escTitle}" style="width: 100%; height: auto; display: block; max-height: 320px; object-fit: cover;">
                </div>
            `;
        }

        modalBody.innerHTML = `
            ${imageHTML}
            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
                <span class="event-tag" style="background-color: ${catColors.bg}; color: ${catColors.text}; margin-top: 0;">${escCat}</span>
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
