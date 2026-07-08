// js/programacio.js

document.addEventListener('DOMContentLoaded', () => {
    let allEvents = [];
    let activeFilteredEvents = [];
    let selectedCategories = [];
    let searchQuery = '';

    // Calendar state
    let selectedDate = null;
    let currentCalendarYear = null;
    let currentCalendarMonth = null; // 0-indexed
    let calendarAnimationClass = '';
    let calendarViewMode = 'month'; // 'month' or 'week'
    let weekAnchorDate = new Date(); // Date object for tracking week view

    function getLocalDateStr(offsetDays = 0) {
        const d = new Date();
        if (offsetDays !== 0) { d.setDate(d.getDate() + offsetDays); }
        return d.toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' });
    }

    // Wait for DB initialization
    setTimeout(async () => {
        await initProgramacio();
    }, 100);

    async function initProgramacio() {
        try {
            allEvents = await window.db.getEvents();
            
            // Render category filters dynamically
            renderCategoryDropdown();

            // Initialize calendar
            initCalendar();

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

        const todayStr = getLocalDateStr();

        // Filter events
        activeFilteredEvents = allEvents.filter(e => {
            const title = isEs && e.title_es ? e.title_es : e.title;
            const desc = isEs && e.description_es ? e.description_es : e.description;
            const loc = isEs && e.location_es ? e.location_es : e.location;

            const eventCategories = e.category ? e.category.split(',').map(c => c.trim()) : [];
            const matchesCategory = selectedCategories.length === 0 || 
                                    eventCategories.some(cat => selectedCategories.includes(cat));
            const matchesSearch = (title || '').toLowerCase().includes(searchQuery) || 
                                  (desc || '').toLowerCase().includes(searchQuery) ||
                                  (loc || '').toLowerCase().includes(searchQuery);

            let matchesDate = false;
            if (selectedDate) {
                matchesDate = (e.date === selectedDate);
            } else {
                matchesDate = (e.date >= todayStr);
            }

            return matchesCategory && matchesSearch && matchesDate;
        });

        if (activeFilteredEvents.length === 0) {
            const emptyText = selectedDate
                ? (isEs ? 'No hay ningún acto programado para este día.' : 'No hi ha cap acte programat per a aquest dia.')
                : (isEs ? 'No se ha encontrado ningún acto que coincida con los criterios de búsqueda o no hay próximos actos.' : "No s'ha trobat cap acte que coincidisca amb els criteris de cerca o no hi ha pròxims actes.");
            timeline.innerHTML = `
                <div style="text-align: center; padding: 4rem 2rem; color: var(--text-muted);">
                    <i data-lucide="calendar-x" style="width: 48px; height: 48px; margin-bottom: 1rem; color: var(--text-muted);"></i>
                    <p>${emptyText}</p>
                </div>
            `;
            if (window.lucide) window.lucide.createIcons();

            // Update events header info
            updateEventsHeader();

            // Refresh calendar widget to show selected date & active dots
            renderCalendar(currentCalendarYear, currentCalendarMonth);
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

        // Sort dates chronologically (using safe parser to prevent UTC shifts)
        const sortedDates = Object.keys(grouped).sort((a, b) => {
            const partsA = a.split('-').map(Number);
            const partsB = b.split('-').map(Number);
            return new Date(partsA[0], partsA[1] - 1, partsA[2]) - new Date(partsB[0], partsB[1] - 1, partsB[2]);
        });

        let timelineHTML = '';
        sortedDates.forEach(dateStr => {
            const events = grouped[dateStr];
            const parts = dateStr.split('-').map(Number);
            const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
            
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

        // Update events header info
        updateEventsHeader();

        // Refresh calendar widget to show selected date & active dots
        renderCalendar(currentCalendarYear, currentCalendarMonth);
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
        const parts = dateStr.split('-').map(Number);
        const date = new Date(parts[0], parts[1] - 1, parts[2]);

        if (isEs) {
            const days = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
            const months = [
                'de Enero', 'de Febrero', 'de Marzo', 'de Abril', 'de Mayo', 'de Junio', 
                'de Julio', 'de Agosto', 'de Septiembre', 'de Octubre', 'de Noviembre', 'de Diciembre'
            ];
            
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
            
            const dayOfWeek = days[date.getDay()];
            const dayOfMonth = date.getDate();
            const monthName = months[date.getMonth()];
            const year = date.getFullYear();

            return `${dayOfWeek}, ${dayOfMonth} ${monthName} ${year}`;
        }
    }

    function renderCategoryDropdown() {
        const dropdownBtn = document.getElementById('filter-dropdown-btn');
        const dropdownContent = document.getElementById('filter-dropdown-content');
        const dropdownLabel = document.getElementById('filter-dropdown-label');
        if (!dropdownBtn || !dropdownContent) return;

        const colors = window.db.getCategoryColors();
        const isEs = window.location.pathname.includes('/es/');

        // Populate dropdown items
        let html = '';
        Object.keys(colors).forEach(cat => {
            const displayName = window.getCategoryName(cat);
            const safeCat = window.db.escapeHTML(cat);
            const safeDisplayName = window.db.escapeHTML(displayName);
            const isChecked = selectedCategories.includes(cat);
            html += `
                <label class="filter-dropdown-item">
                    <input type="checkbox" value="${safeCat}" ${isChecked ? 'checked' : ''}>
                    <span>${safeDisplayName}</span>
                </label>
            `;
        });

        // Add clear button
        const clearText = isEs ? 'Limpiar filtros' : 'Netejar filtres';
        html += `
            <div class="filter-dropdown-clear">
                <button class="filter-dropdown-clear-btn" id="filter-dropdown-clear-btn">${clearText}</button>
            </div>
        `;

        dropdownContent.innerHTML = html;

        // Toggle dropdown open/close on button click
        dropdownBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownContent.classList.toggle('show');
            dropdownBtn.classList.toggle('active-dropdown');
        });

        // Prevent dropdown from closing when clicking inside content
        dropdownContent.addEventListener('click', (e) => {
            e.stopPropagation();
        });

        // Handle checkbox changes
        dropdownContent.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
            checkbox.addEventListener('change', () => {
                const val = checkbox.value;
                if (checkbox.checked) {
                    if (!selectedCategories.includes(val)) {
                        selectedCategories.push(val);
                    }
                } else {
                    selectedCategories = selectedCategories.filter(c => c !== val);
                }
                updateDropdownButtonUI();
                renderEvents();
            });
        });

        // Handle clear button
        const clearBtn = document.getElementById('filter-dropdown-clear-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                selectedCategories = [];
                dropdownContent.querySelectorAll('input[type="checkbox"]').forEach(checkbox => {
                    checkbox.checked = false;
                });
                updateDropdownButtonUI();
                renderEvents();
            });
        }

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!dropdownBtn.contains(e.target) && !dropdownContent.contains(e.target)) {
                dropdownContent.classList.remove('show');
                dropdownBtn.classList.remove('active-dropdown');
            }
        });

        function updateDropdownButtonUI() {
            if (selectedCategories.length === 0) {
                dropdownLabel.textContent = isEs ? 'Categorías' : 'Categories';
                dropdownBtn.classList.remove('active-filter');
            } else if (selectedCategories.length === 1) {
                const displayName = window.getCategoryName(selectedCategories[0]);
                dropdownLabel.textContent = displayName;
                dropdownBtn.classList.add('active-filter');
            } else {
                dropdownLabel.textContent = isEs 
                    ? `Categorías (${selectedCategories.length})` 
                    : `Categories (${selectedCategories.length})`;
                dropdownBtn.classList.add('active-filter');
            }
        }
        
        // Run initial button text configuration
        updateDropdownButtonUI();
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
            const isLocal = event.image_url.startsWith('img/') || event.image_url.startsWith('/img/') || (!event.image_url.startsWith('http') && !event.image_url.startsWith('data:'));
            
            if (isLocal) {
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
            } else {
                imageHTML = `
                    <div class="event-modal-img-wrapper">
                        <img src="${escImg}" alt="${escTitle}" style="width: 100%; height: auto; display: block; max-height: 320px; object-fit: cover;">
                    </div>
                `;
            }
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

    // ==========================================
    // CALENDAR WIDGET LOGIC
    // ==========================================

    function initCalendar() {
        const todayStr = getLocalDateStr();
        const isEs = window.location.pathname.includes('/es/');
        
        // Find the first upcoming event (date >= todayStr)
        const upcomingEvent = allEvents.find(e => e.date >= todayStr);
        let targetDate = new Date();
        
        if (upcomingEvent) {
            const parts = upcomingEvent.date.split('-');
            currentCalendarYear = parseInt(parts[0]);
            currentCalendarMonth = parseInt(parts[1]) - 1; // 0-indexed
            targetDate = new Date(currentCalendarYear, currentCalendarMonth, parseInt(parts[2]));
        } else if (allEvents.length > 0) {
            // Fallback to the month of the last event
            const parts = allEvents[allEvents.length - 1].date.split('-');
            currentCalendarYear = parseInt(parts[0]);
            currentCalendarMonth = parseInt(parts[1]) - 1;
            targetDate = new Date(currentCalendarYear, currentCalendarMonth, parseInt(parts[2]));
        } else {
            // Fallback to today
            const parts = todayStr.split('-');
            currentCalendarYear = parseInt(parts[0]);
            currentCalendarMonth = parseInt(parts[1]) - 1;
            targetDate = new Date();
        }

        weekAnchorDate = targetDate;

        // Set up touch swipe gestures on the calendar widget for mobile
        let touchStartX = 0;
        let touchStartY = 0;
        let touchEndX = 0;
        let touchEndY = 0;

        const calendarElement = document.getElementById('calendar-widget');
        if (calendarElement) {
            calendarElement.addEventListener('touchstart', (e) => {
                touchStartX = e.changedTouches[0].screenX;
                touchStartY = e.changedTouches[0].screenY;
            }, { passive: true });

            calendarElement.addEventListener('touchend', (e) => {
                touchEndX = e.changedTouches[0].screenX;
                touchEndY = e.changedTouches[0].screenY;
                
                const deltaX = touchEndX - touchStartX;
                const deltaY = touchEndY - touchStartY;
                
                // Swipe threshold of 50px, horizontal dominant
                if (Math.abs(deltaX) > 50 && Math.abs(deltaX) > Math.abs(deltaY)) {
                    if (deltaX < 0) {
                        // Swipe left -> Next month/week
                        const nextBtn = document.getElementById('calendar-next-btn');
                        if (nextBtn) nextBtn.click();
                    } else {
                        // Swipe right -> Prev month/week
                        const prevBtn = document.getElementById('calendar-prev-btn');
                        if (prevBtn) prevBtn.click();
                    }
                }
            }, { passive: true });
        }

        // Set up clear day filter button
        const clearBtn = document.getElementById('btn-clear-day-filter');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => {
                selectedDate = null;
                // Re-render calendar to clear selection dot
                renderCalendar(currentCalendarYear, currentCalendarMonth);
                renderEvents();
            });
        }
    }

    function renderCalendar(year, month) {
        const widgetContainer = document.getElementById('calendar-widget');
        if (!widgetContainer) return;

        const isEs = window.location.pathname.includes('/es/');
        const todayStr = getLocalDateStr();

        const monthsCa = ['Gener', 'Febrer', 'Març', 'Abril', 'Maig', 'Juny', 'Juliol', 'Agost', 'Setembre', 'Octubre', 'Novembre', 'Desembre'];
        const monthsEs = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        const monthName = isEs ? monthsEs[month] : monthsCa[month];

        // Get matching events for dots (respecting active category and search filter)
        const eventsForDots = allEvents.filter(e => {
            const title = isEs && e.title_es ? e.title_es : e.title;
            const desc = isEs && e.description_es ? e.description_es : e.description;
            const loc = isEs && e.location_es ? e.location_es : e.location;

            const eventCategories = e.category ? e.category.split(',').map(c => c.trim()) : [];
            const matchesCategory = selectedCategories.length === 0 || 
                                    eventCategories.some(cat => selectedCategories.includes(cat));
            const matchesSearch = (title || '').toLowerCase().includes(searchQuery) || 
                                  (desc || '').toLowerCase().includes(searchQuery) ||
                                  (loc || '').toLowerCase().includes(searchQuery);
            return matchesCategory && matchesSearch;
        });

        // Set of date strings that have events matching current filters
        const eventDatesSet = new Set(eventsForDots.map(e => e.date));

        // Create the header HTML with toggle buttons
        let headerHtml = `
            <div class="calendar-header">
                <button class="calendar-nav-btn" id="calendar-prev-btn" title="${isEs ? 'Anterior' : 'Anterior'}">
                    <i data-lucide="chevron-left"></i>
                </button>
                <div class="calendar-title-toggle-group">
                    <h3 class="calendar-month-year" id="calendar-month-year">${monthName} ${year}</h3>
                    <!-- View toggle visible on mobile -->
                    <div class="calendar-mode-toggle">
                        <button class="mode-toggle-btn ${calendarViewMode === 'month' ? 'active' : ''}" data-mode="month">${isEs ? 'Mes' : 'Mes'}</button>
                        <button class="mode-toggle-btn ${calendarViewMode === 'week' ? 'active' : ''}" data-mode="week">${isEs ? 'Semana' : 'Setmana'}</button>
                    </div>
                </div>
                <button class="calendar-nav-btn" id="calendar-next-btn" title="${isEs ? 'Siguiente' : 'Següent'}">
                    <i data-lucide="chevron-right"></i>
                </button>
            </div>
        `;

        let bodyHtml = '';

        if (calendarViewMode === 'month') {
            const weekdaysCa = ['Dl', 'Dm', 'Dx', 'Dj', 'Dv', 'Ds', 'Dg'];
            const weekdaysEs = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];
            const weekdays = isEs ? weekdaysEs : weekdaysCa;

            bodyHtml = `
                <div class="calendar-weekdays">
                    ${weekdays.map(d => `<div>${d}</div>`).join('')}
                </div>
                <div class="calendar-days ${calendarAnimationClass}">
            `;

            // Calculate days
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            const prevMonthDays = new Date(year, month, 0).getDate();
            
            let firstDayIndex = new Date(year, month, 1).getDay(); // 0 = Sun, 1 = Mon...
            let startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

            // Days from previous month
            for (let i = startOffset - 1; i >= 0; i--) {
                const dayNum = prevMonthDays - i;
                let prevMonthIndex = month - 1;
                let prevYear = year;
                if (prevMonthIndex < 0) {
                    prevMonthIndex = 11;
                    prevYear--;
                }
                const dateStr = `${prevYear}-${String(prevMonthIndex + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                const hasEvent = eventDatesSet.has(dateStr);
                const isToday = dateStr === todayStr;
                const isSelected = dateStr === selectedDate;
                bodyHtml += `<div class="calendar-day other-month ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${hasEvent ? 'has-event' : ''}" data-date="${dateStr}">${dayNum}</div>`;
            }

            // Days from current month
            for (let day = 1; day <= daysInMonth; day++) {
                const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const hasEvent = eventDatesSet.has(dateStr);
                const isToday = dateStr === todayStr;
                const isSelected = dateStr === selectedDate;
                bodyHtml += `<div class="calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${hasEvent ? 'has-event' : ''}" data-date="${dateStr}">${day}</div>`;
            }

            // Days from next month (fill up grid to 42 cells)
            const totalRenderedDays = startOffset + daysInMonth;
            const nextMonthDaysNeeded = 42 - totalRenderedDays;
            for (let day = 1; day <= nextMonthDaysNeeded; day++) {
                let nextMonthIndex = month + 1;
                let nextYear = year;
                if (nextMonthIndex > 11) {
                    nextMonthIndex = 0;
                    nextYear++;
                }
                const dateStr = `${nextYear}-${String(nextMonthIndex + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const hasEvent = eventDatesSet.has(dateStr);
                const isToday = dateStr === todayStr;
                const isSelected = dateStr === selectedDate;
                bodyHtml += `<div class="calendar-day other-month ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${hasEvent ? 'has-event' : ''}" data-date="${dateStr}">${day}</div>`;
            }

            bodyHtml += `</div>`;
        } else {
            // Week View: 7 days horizontal layout
            bodyHtml = `
                <div class="calendar-week-row ${calendarAnimationClass}">
            `;

            // Calculate Mon-Sun for weekAnchorDate
            const anchor = new Date(weekAnchorDate.getTime());
            const dayOfWeek = anchor.getDay(); // 0 = Sun, 1 = Mon...
            const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
            
            const monday = new Date(anchor.getTime());
            monday.setDate(anchor.getDate() + daysToMonday);

            const weekdaysShortCa = ['Dl', 'Dm', 'Dx', 'Dj', 'Dv', 'Ds', 'Dg'];
            const weekdaysShortEs = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sá', 'Do'];
            const weekdaysShort = isEs ? weekdaysShortEs : weekdaysShortCa;

            for (let i = 0; i < 7; i++) {
                const dayDate = new Date(monday.getTime());
                dayDate.setDate(monday.getDate() + i);
                
                const dateStr = dayDate.toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' });
                const dayNum = dayDate.getDate();
                const weekdayLabel = weekdaysShort[i];

                const hasEvent = eventDatesSet.has(dateStr);
                const isToday = dateStr === todayStr;
                const isSelected = dateStr === selectedDate;
                const isOtherMonth = dayDate.getMonth() !== currentCalendarMonth;

                bodyHtml += `
                    <div class="calendar-week-day ${isOtherMonth ? 'other-month' : ''} ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${hasEvent ? 'has-event' : ''}" data-date="${dateStr}">
                        <span class="week-day-num">${dayNum}</span>
                        <span class="week-day-label">${weekdayLabel}</span>
                    </div>
                `;
            }

            bodyHtml += `</div>`;
        }

        widgetContainer.innerHTML = headerHtml + bodyHtml;
        calendarAnimationClass = '';

        // Recreate icons inside calendar navigation
        if (window.lucide) {
            window.lucide.createIcons();
        }

        // Bind navigation events
        document.getElementById('calendar-prev-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            if (calendarViewMode === 'month') {
                calendarAnimationClass = 'slide-from-left';
                currentCalendarMonth--;
                if (currentCalendarMonth < 0) {
                    currentCalendarMonth = 11;
                    currentCalendarYear--;
                }
                renderCalendar(currentCalendarYear, currentCalendarMonth);
            } else {
                calendarAnimationClass = 'slide-from-left';
                weekAnchorDate.setDate(weekAnchorDate.getDate() - 7);
                // Sync month/year text to week anchor
                currentCalendarMonth = weekAnchorDate.getMonth();
                currentCalendarYear = weekAnchorDate.getFullYear();
                renderCalendar(currentCalendarYear, currentCalendarMonth);
            }
        });

        document.getElementById('calendar-next-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            if (calendarViewMode === 'month') {
                calendarAnimationClass = 'slide-from-right';
                currentCalendarMonth++;
                if (currentCalendarMonth > 11) {
                    currentCalendarMonth = 0;
                    currentCalendarYear++;
                }
                renderCalendar(currentCalendarYear, currentCalendarMonth);
            } else {
                calendarAnimationClass = 'slide-from-right';
                weekAnchorDate.setDate(weekAnchorDate.getDate() + 7);
                // Sync month/year text to week anchor
                currentCalendarMonth = weekAnchorDate.getMonth();
                currentCalendarYear = weekAnchorDate.getFullYear();
                renderCalendar(currentCalendarYear, currentCalendarMonth);
            }
        });

        // Bind mode toggles
        const toggleButtons = widgetContainer.querySelectorAll('.mode-toggle-btn');
        toggleButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const mode = btn.getAttribute('data-mode');
                if (mode !== calendarViewMode) {
                    calendarViewMode = mode;
                    // If switching to week view, anchor it on the selectedDate or today
                    if (calendarViewMode === 'week') {
                        if (selectedDate) {
                            const parts = selectedDate.split('-');
                            weekAnchorDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
                        } else {
                            weekAnchorDate = new Date();
                        }
                        currentCalendarMonth = weekAnchorDate.getMonth();
                        currentCalendarYear = weekAnchorDate.getFullYear();
                    }
                    renderCalendar(currentCalendarYear, currentCalendarMonth);
                }
            });
        });

        // Day click listeners (handles both normal month cells and week cells)
        const cellSelector = calendarViewMode === 'month' ? '.calendar-day' : '.calendar-week-day';
        widgetContainer.querySelectorAll(cellSelector).forEach(cell => {
            cell.addEventListener('click', () => {
                const clickedDateStr = cell.getAttribute('data-date');
                
                // Toggle selection
                if (selectedDate === clickedDateStr) {
                    selectedDate = null;
                } else {
                    selectedDate = clickedDateStr;
                    
                    // If clicked date belongs to another month, adjust the calendar visible month
                    const [cYear, cMonth, cDay] = clickedDateStr.split('-').map(Number);
                    if (cYear !== currentCalendarYear || (cMonth - 1) !== currentCalendarMonth) {
                        currentCalendarYear = cYear;
                        currentCalendarMonth = cMonth - 1;
                    }
                    
                    // Update week anchor to the clicked day
                    weekAnchorDate = new Date(cYear, cMonth - 1, cDay);
                }
                
                // Keep view mode state but force re-render of calendar to show selection dot/active background
                renderCalendar(currentCalendarYear, currentCalendarMonth);
                renderEvents();
            });
        });
    }

    function updateEventsHeader() {
        const viewTitle = document.getElementById('events-view-title');
        const clearBtn = document.getElementById('btn-clear-day-filter');
        if (!viewTitle) return;

        const isEs = window.location.pathname.includes('/es/');

        if (selectedDate) {
            const formatted = formatFullDate(selectedDate);
            viewTitle.textContent = isEs ? `Actos del ${formatted}` : `Actes del ${formatted}`;
            if (clearBtn) clearBtn.style.display = 'flex';
        } else {
            viewTitle.textContent = isEs ? 'Próximos actos' : 'Pròxims actes';
            if (clearBtn) clearBtn.style.display = 'none';
        }
    }
});
