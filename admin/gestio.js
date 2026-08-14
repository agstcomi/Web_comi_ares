// admin/gestio.js

document.addEventListener('DOMContentLoaded', () => {
    // Check initial user state
    setTimeout(async () => {
        await checkAuthState();
    }, 100);

    // Escoltar actualitzacions de noticíies des de la pestanya de l'editor
    // F6: Validar event.origin per evitar missatges de finestres externes malicioses
    window.addEventListener('message', (event) => {
        if (event.origin !== window.location.origin) return;
        if (event.data === 'news-saved') {
            loadNewsTable();
        }
    });

    // Dom Elements
    const loginContainer = document.getElementById('login-container');
    const dashboardContainer = document.getElementById('dashboard-container');
    const loginForm = document.getElementById('login-form');
    const loginError = document.getElementById('login-error');
    const logoutBtn = document.getElementById('logout-btn');
    const dbStatusBadge = document.getElementById('db-status-badge');
    const userGreeting = document.getElementById('user-greeting');

    // Modals & Forms
    const modalEvent = document.getElementById('modal-event');
    const modalPhoto = document.getElementById('modal-photo');
    
    const btnNewNews = document.getElementById('btn-new-news');
    const btnNewEvent = document.getElementById('btn-new-event');
    const btnNewPhoto = document.getElementById('btn-new-photo');

    const formEvent = document.getElementById('form-event');
    const formPhoto = document.getElementById('form-photo');
    const configForm = document.getElementById('config-form');
    const btnResetDb = document.getElementById('btn-reset-db');
    // Calendar State for Admin
    let selectedDate = null;
    let currentCalendarYear = null;
    let currentCalendarMonth = null; // 0-indexed
    let calendarAnimationClass = '';
    let calendarViewMode = 'month'; // 'month' or 'week'
    let weekAnchorDate = new Date();
    
    const btnClearDateFilter = document.getElementById('btn-clear-date-filter');
    if (btnClearDateFilter) {
        btnClearDateFilter.addEventListener('click', () => {
            selectedDate = null;
            loadEventsTable();
        });
    }

    // 1. Authentication Check & Login Flow
    async function checkAuthState() {
        const user = await window.db.getCurrentUser();
        if (user) {
            await showDashboard(user);
        } else {
            showLogin();
        }
    }

    function showLogin() {
        loginContainer.style.display = 'block';
        dashboardContainer.style.display = 'none';
        loadDbConfigFields();
        if (window.lucide) window.lucide.createIcons();
    }

    let currentUser = null;

    // Helper functions for user profile persistence in local storage and cloud database (Supabase)
    function getProfile(user) {
        const defaultAvatar = "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100";
        const defaultName = user.email ? user.email.split('@')[0] : "Admin";

        // 1. Try to get metadata from Supabase user object if available (highest priority)
        if (user && user.user_metadata) {
            const metaName = user.user_metadata.display_name;
            const metaAvatar = user.user_metadata.avatar_url;
            if (metaName || metaAvatar) {
                return {
                    name: metaName || defaultName,
                    avatarUrl: metaAvatar || defaultAvatar
                };
            }
        }

        // 2. Fallback to localStorage
        const emailKey = user.email || 'default_admin';
        const stored = localStorage.getItem(`ares_profile_${emailKey}`);
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                // ignore
            }
        }
        return { name: defaultName, avatarUrl: defaultAvatar };
    }

    async function saveProfile(user, name, avatarUrl) {
        const emailKey = user.email || 'default_admin';

        // 1. If Supabase is configured and online, update user_metadata in Supabase Auth so it synchronizes across devices
        if (window.db && typeof window.db.isSupabaseConfigured === 'function' && window.db.isSupabaseConfigured() && window.db.supabase) {
            
            // Validate if the avatarUrl is a large Base64 image
            if (avatarUrl && avatarUrl.startsWith('data:')) {
                throw new Error("No es pot desar una imatge local (Base64) com a avatar en el servidor de Supabase. Assegura't que s'hagi pujat correctament al storage o utilitza una URL d'imatge externa vàlida.");
            }

            try {
                const { data, error } = await window.db.supabase.auth.updateUser({
                    data: {
                        display_name: name,
                        avatar_url: avatarUrl
                    }
                });
                if (error) throw error;
                if (data && data.user) {
                    currentUser = data.user; // update active user object reference
                }
            } catch (e) {
                console.error("Error saving profile in Supabase Auth user_metadata:", e);
                throw new Error("Error en desar el perfil a Supabase: " + (e.message || e));
            }
        }

        // 2. Save in localStorage as cache or fallback
        localStorage.setItem(`ares_profile_${emailKey}`, JSON.stringify({ name, avatarUrl }));
    }

    async function showDashboard(user) {
        currentUser = user;
        loginContainer.style.display = 'none';
        dashboardContainer.style.display = 'block';
        
        const profile = getProfile(user);
        userGreeting.textContent = `Hola, ${profile.name}!`;
        
        // Update database connection status badge
        updateDbStatusBadge();

        // Update profile card in sidebar
        const profileName = document.querySelector('.admin-profile-name');
        const profileRole = document.querySelector('.admin-profile-role');
        const profileAvatar = document.querySelector('.admin-profile-avatar img');
        if (profileName) {
            profileName.textContent = profile.name;
        }
        if (profileRole) {
            profileRole.textContent = user.email;
        }
        if (profileAvatar && profile.avatarUrl) {
            profileAvatar.src = profile.avatarUrl;
        }

        // Populate profile form inputs
        const profileNameInput = document.getElementById('profile-name-input');
        const profileAvatarUrlInput = document.getElementById('profile-avatar-url-input');
        const profilePreviewImg = document.getElementById('profile-preview-img');
        if (profileNameInput) {
            profileNameInput.value = profile.name;
        }
        if (profileAvatarUrlInput) {
            profileAvatarUrlInput.value = profile.avatarUrl;
        }
        if (profilePreviewImg) {
            profilePreviewImg.src = profile.avatarUrl;
        }
        
        // Load configurations into input fields if present
        loadDbConfigFields();

        // Load tables data
        loadNewsTable();
        await loadEventsTable();
        loadPhotosTable();
        loadCategorySelects();
        loadCategoryColorsForm();
        await loadFaqsAdmin();
        await loadCountdownAdmin();
        await loadHomeAdmin();
        await loadReservationsTab();
    }

    function updateDbStatusBadge() {
        const status = window.db.getStatus();
        dbStatusBadge.className = 'db-status-badge'; // reset
        if (status === 'supabase') {
            dbStatusBadge.classList.add('status-supabase');
            dbStatusBadge.textContent = 'Supabase Cloud';
        } else {
            dbStatusBadge.classList.add('status-local');
            dbStatusBadge.textContent = 'Mode Local';
        }
    }

    function loadDbConfigFields() {
        const config = localStorage.getItem('supabase_config');
        if (config) {
            try {
                const parsed = JSON.parse(config);
                const url = parsed.url || '';
                const key = parsed.key || '';
                
                const dashUrl = document.getElementById('config-url');
                const dashKey = document.getElementById('config-key');
                if (dashUrl) dashUrl.value = url;
                if (dashKey) dashKey.value = key;
                
                const loginUrl = document.getElementById('login-config-url');
                const loginKey = document.getElementById('login-config-key');
                if (loginUrl) loginUrl.value = url;
                if (loginKey) loginKey.value = key;
            } catch (e) {
                console.error("Error parsing stored Supabase config:", e);
            }
        }
    }

    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('login-email').value;
            const password = document.getElementById('login-password').value;

            loginError.style.display = 'none';
            const result = await window.db.login(email, password);

            if (result.success) {
                await showDashboard(result.user);
            } else {
                loginError.textContent = result.error || "Error de connexió.";
                loginError.style.display = 'block';
            }
        });
    }

    const loginConfigForm = document.getElementById('login-config-form');
    if (loginConfigForm) {
        loginConfigForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const urlInput = document.getElementById('login-config-url');
            const keyInput = document.getElementById('login-config-key');
            const url = urlInput.value.trim();
            const key = keyInput.value.trim();

            if (url && key) {
                const connected = window.db.setConfig(url, key);
                if (connected) {
                    loadDbConfigFields();
                    alert('Base de dades Supabase configurada correctament. Ja pots iniciar sessió.');
                    
                    const detailsEl = document.getElementById('login-config-details');
                    if (detailsEl) detailsEl.removeAttribute('open');
                    
                    if (loginError) loginError.style.display = 'none';
                } else {
                    alert('Error en configurar la base de dades.');
                }
            }
        });
    }

    if (logoutBtn) {
        logoutBtn.addEventListener('click', async () => {
            await window.db.logout();
            showLogin();
        });
    }

    // Explicit Modal Close Handlers (Addresses issue with close button)
    document.querySelectorAll('.admin-modal-close').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            const modal = btn.closest('.admin-form-modal');
            if (modal) modal.classList.remove('active');
        });
    });

    // Close modal by clicking background overlay
    document.querySelectorAll('.admin-form-modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });

    // 2. Tab Navigation
    const tabs = document.querySelectorAll('.admin-tab-btn');
    const panels = document.querySelectorAll('.admin-panel');

    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Ignore if it's the logout button (which has same class)
            if (tab.id === 'logout-btn') return;

            tabs.forEach(t => t.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));

            tab.classList.add('active');
            const targetTab = tab.getAttribute('data-tab');
            const targetPanel = document.getElementById(targetTab);
            if (targetPanel) targetPanel.classList.add('active');

            if (targetTab === 'tab-camisetes') {
                loadReservationsTab();
            }
        });
    });

    const profileClickable = document.querySelector('.admin-profile-clickable');
    if (profileClickable) {
        profileClickable.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            panels.forEach(p => p.classList.remove('active'));

            const targetPanel = document.getElementById('tab-profile');
            if (targetPanel) targetPanel.classList.add('active');
        });
    }

    // Mobile sidebar drawer toggle
    const sidebarToggle = document.querySelector('.admin-sidebar-toggle');
    const sidebar = document.querySelector('.admin-sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');

    if (sidebarToggle && sidebar && sidebarOverlay) {
        const toggleSidebar = () => {
            sidebar.classList.toggle('active');
            sidebarOverlay.classList.toggle('active');
        };

        sidebarToggle.addEventListener('click', toggleSidebar);
        sidebarOverlay.addEventListener('click', toggleSidebar);

        // Close sidebar when clicking any of the tab buttons on mobile
        const sidebarButtons = document.querySelectorAll('.admin-tab-btn, .admin-profile-clickable');
        sidebarButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    sidebar.classList.remove('active');
                    sidebarOverlay.classList.remove('active');
                }
            });
        });
    }

    // 3. Populate and Manage News Table
    async function loadNewsTable() {
        const tbody = document.getElementById('table-news-body');
        if (!tbody) return;

        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Carregant dades...</td></tr>';
        const news = await window.db.getNews();

        if (news.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No hi ha notícies guardades.</td></tr>';
            return;
        }

        tbody.innerHTML = news.map(item => {
            const imgUrl = (!item.image_url) 
                ? 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=800'
                : (item.image_url.startsWith('http') || item.image_url.startsWith('data:image') || item.image_url.startsWith('/'))
                    ? item.image_url
                    : '../' + item.image_url;
            const escImgUrl = window.db.escapeHTML(imgUrl);
            const escTitle = window.db.escapeHTML(item.title);
            const escCreatedAt = window.db.escapeHTML(item.created_at);
            const escUpdatedAt = item.updated_at ? window.db.escapeHTML(item.updated_at) : '';
            const escId = window.db.escapeHTML(item.id);
            
            const now = new Date();
            const status = item.status || 'published';
            const pubDateStr = item.published_at || item.created_at;
            const isFuturePub = pubDateStr && !isNaN(new Date(pubDateStr).getTime()) && new Date(pubDateStr) > now;
            const isScheduled = status === 'scheduled' || isFuturePub;
            const isDraft = status === 'draft';

            let badgeBg = '#dcfce7';
            let badgeTextColors = '#15803d';
            let badgeText = 'Publicat';

            if (isDraft) {
                badgeBg = '#e2e8f0';
                badgeTextColors = '#475569';
                badgeText = 'Esborrany';
            } else if (isScheduled) {
                badgeBg = '#dbeafe';
                badgeTextColors = '#1e40af';
                badgeText = '⏰ Programat';
            }

            let displayDate = escCreatedAt;
            if (pubDateStr) {
                try {
                    const d = new Date(pubDateStr);
                    if (!isNaN(d.getTime())) {
                        displayDate = d.toLocaleString('ca-ES', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
                    }
                } catch (e) {}
            }
            
            return `
                <tr>
                    <td><img class="admin-table-img" src="${escImgUrl}" alt="Notícia"></td>
                    <td style="font-weight: 600;">
                        <div>${escTitle}</div>
                        <div style="margin-top: 0.35rem;">
                            <span style="font-size: 0.7rem; font-weight: 700; padding: 0.15rem 0.4rem; background-color: ${badgeBg}; color: ${badgeTextColors}; border-radius: 4px; text-transform: uppercase; display: inline-block; border: 1px solid rgba(0,0,0,0.05);">${badgeText}</span>
                        </div>
                    </td>
                    <td>
                        <div>Pub: ${displayDate}</div>
                        ${escUpdatedAt ? `<div style="font-size:0.75rem; color:var(--text-muted); margin-top:0.25rem;">Ed: ${escUpdatedAt}</div>` : ''}
                    </td>
                    <td>
                        <button class="btn btn-sm btn-edit-news" data-id="${escId}" style="padding: 0.35rem 0.6rem; margin-right: 0.5rem; background-color: var(--text-primary); color: var(--bg-primary); border-color: var(--text-primary);">
                            <i data-lucide="edit-3" style="width: 12px; height: 12px;"></i> Editar
                        </button>
                        <button class="btn btn-sm btn-danger btn-delete-news" data-id="${escId}" style="padding: 0.35rem 0.6rem;">
                            <i data-lucide="trash-2" style="width: 12px; height: 12px;"></i> Borrar
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        // Attach event listeners
        tbody.querySelectorAll('.btn-edit-news').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                window.open(`editor.html?id=${id}`, '_blank');
            });
        });

        tbody.querySelectorAll('.btn-delete-news').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (confirm('Estàs segur que vols esborrar aquesta notícia?')) {
                    const id = btn.getAttribute('data-id');
                    await window.db.deleteNews(id);
                    loadNewsTable();
                }
            });
        });

        if (window.lucide) window.lucide.createIcons();
    }

    // 4. Populate and Manage Events Table
    async function loadEventsTable() {
        const tbody = document.getElementById('table-events-body');
        if (!tbody) return;

        tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Carregant dades...</td></tr>';
        const events = await window.db.getEvents();
        const colors = window.db.getCategoryColors();

        if (events.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No hi ha actes registrats.</td></tr>';
            renderCalendarAdmin([]);
            return;
        }

        // Inicialitzar dates del calendari per defecte si estan buides
        if (currentCalendarYear === null || currentCalendarMonth === null) {
            const today = new Date();
            currentCalendarYear = today.getFullYear();
            currentCalendarMonth = today.getMonth();
        }

        // Control de visibilitat del botó per a netejar el filtre
        const clearBtn = document.getElementById('btn-clear-date-filter');
        if (clearBtn) {
            clearBtn.style.display = selectedDate ? 'block' : 'none';
        }

        // Filtrar els actes segons el dia seleccionat al calendari
        const eventsToShow = selectedDate 
            ? events.filter(e => e.date === selectedDate)
            : events;

        // Renderitzar el calendari passant tots els actes per dibuixar els punts negres
        renderCalendarAdmin(events);

        if (eventsToShow.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">No hi ha actes registrats per a aquest dia.</td></tr>';
            return;
        }

        tbody.innerHTML = eventsToShow.map(item => {
            const escDate = window.db.escapeHTML(item.date);
            const escTime = window.db.escapeHTML(item.time);
            const escTitle = window.db.escapeHTML(item.title);
            const escLoc = window.db.escapeHTML(item.location);
            const escId = window.db.escapeHTML(item.id);
            return `
                <tr>
                    <td>
                        <div class="event-date-cell">
                            <span class="event-date-val">${escDate}</span>
                            <span class="event-time-val"><i data-lucide="clock" style="width:11px; height:11px; display:inline; vertical-align:-1px; margin-right:2px;"></i>${escTime}</span>
                        </div>
                    </td>
                    <td style="font-weight: 500; word-break: break-word;">${escTitle}</td>
                    <td style="color: var(--text-secondary); word-break: break-word;">${escLoc}</td>
                    <td>
                        <div style="display: flex; gap: 0.2rem; flex-wrap: wrap;">
                            ${window.renderCategoryBadges(item.category, 'margin-top:0; padding: 2px 6px; font-size: 0.68rem;')}
                        </div>
                    </td>
                    <td>
                        <div class="event-actions">
                            <button class="btn-action btn-action-edit btn-edit-event" data-id="${escId}" title="Editar acte" aria-label="Editar acte">
                                <i data-lucide="edit-3" style="width: 14px; height: 14px;"></i>
                            </button>
                            <button class="btn-action btn-action-delete btn-delete-event" data-id="${escId}" title="Eliminar acte" aria-label="Eliminar acte">
                                <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
                            </button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        tbody.querySelectorAll('.btn-edit-event').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const item = events.find(e => e.id === id); // buscar en la llista completa
                if (item) {
                    formEvent.reset();
                    document.getElementById('event-id').value = item.id;
                    document.getElementById('event-title').value = item.title;
                    document.getElementById('event-date').value = item.date;
                    document.getElementById('event-time').value = item.time;
                    document.getElementById('event-location').value = item.location;
                    const eventCats = item.category ? item.category.split(',').map(c => c.trim()) : [];
                    const checkboxes = document.querySelectorAll('input[name="event-category-check"]');
                    checkboxes.forEach(cb => {
                        cb.checked = eventCats.includes(cb.value);
                    });
                    document.getElementById('event-description').value = item.description || '';
                    document.getElementById('event-long-description').value = item.long_description || '';
                    document.getElementById('event-image').value = item.image_url || '';
                    
                    // Spanish fields
                    document.getElementById('event-title-es').value = item.title_es || '';
                    document.getElementById('event-location-es').value = item.location_es || '';
                    document.getElementById('event-description-es').value = item.description_es || '';
                    document.getElementById('event-long-description-es').value = item.long_description_es || '';

                    document.getElementById('event-modal-title').textContent = 'Editar Acte';
                    modalEvent.classList.add('active');
                }
            });
        });

        tbody.querySelectorAll('.btn-delete-event').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (confirm('Estàs segur que vols esborrar aquest acte del programa?')) {
                    const id = btn.getAttribute('data-id');
                    await window.db.deleteEvent(id);
                    loadEventsTable(); // recarregar i repopular
                }
            });
        });

        if (window.lucide) window.lucide.createIcons();
    }

    // Funció per a renderitzar el widget de calendari al panell d'admin
    function renderCalendarAdmin(allEvents) {
        const widgetContainer = document.getElementById('admin-calendar-widget');
        if (!widgetContainer) return;

        const todayStr = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Madrid' });
        const monthsCa = ['Gener', 'Febrer', 'Març', 'Abril', 'Maig', 'Juny', 'Juliol', 'Agost', 'Setembre', 'Octubre', 'Novembre', 'Desembre'];
        const monthName = monthsCa[currentCalendarMonth];

        // Conjunt de dates que tenen actes en el sistema
        const eventDatesSet = new Set(allEvents.map(e => e.date));

        // Estructura de capçalera del calendari
        let headerHtml = `
            <div class="calendar-header" style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <button class="calendar-nav-btn" id="admin-calendar-prev-btn" style="background: none; border: 1px solid var(--border-color); border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--text-primary);" title="Anterior">
                    <i data-lucide="chevron-left" style="width: 14px; height: 14px;"></i>
                </button>
                <h3 class="calendar-month-year" style="font-size: 0.95rem; font-family: var(--font-heading); margin: 0; color: var(--text-primary); font-weight: 600;">${monthName} ${currentCalendarYear}</h3>
                <button class="calendar-nav-btn" id="admin-calendar-next-btn" style="background: none; border: 1px solid var(--border-color); border-radius: 50%; width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--text-primary);" title="Següent">
                    <i data-lucide="chevron-right" style="width: 14px; height: 14px;"></i>
                </button>
            </div>
        `;

        let weekdaysCa = ['Dl', 'Dm', 'Dx', 'Dj', 'Dv', 'Ds', 'Dg'];
        let bodyHtml = `
            <div class="calendar-weekdays">
                ${weekdaysCa.map(d => `<div>${d}</div>`).join('')}
            </div>
            <div class="calendar-days ${calendarAnimationClass}">
        `;

        // Calcular dies
        const daysInMonth = new Date(currentCalendarYear, currentCalendarMonth + 1, 0).getDate();
        const prevMonthDays = new Date(currentCalendarYear, currentCalendarMonth, 0).getDate();
        
        let firstDayIndex = new Date(currentCalendarYear, currentCalendarMonth, 1).getDay(); // 0 = Dg, 1 = Dl...
        let startOffset = firstDayIndex === 0 ? 6 : firstDayIndex - 1;

        // Dies del mes anterior
        for (let i = startOffset - 1; i >= 0; i--) {
            const dayNum = prevMonthDays - i;
            let prevMonthIndex = currentCalendarMonth - 1;
            let prevYear = currentCalendarYear;
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

        // Dies del mes actual
        for (let day = 1; day <= daysInMonth; day++) {
            const dateStr = `${currentCalendarYear}-${String(currentCalendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
            const hasEvent = eventDatesSet.has(dateStr);
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDate;
            
            bodyHtml += `<div class="calendar-day ${isToday ? 'today' : ''} ${isSelected ? 'selected' : ''} ${hasEvent ? 'has-event' : ''}" data-date="${dateStr}">${day}</div>`;
        }

        // Dies del mes següent
        const totalRenderedDays = startOffset + daysInMonth;
        const nextMonthDaysNeeded = 42 - totalRenderedDays;
        for (let day = 1; day <= nextMonthDaysNeeded; day++) {
            let nextMonthIndex = currentCalendarMonth + 1;
            let nextYear = currentCalendarYear;
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
        widgetContainer.innerHTML = headerHtml + bodyHtml;
        calendarAnimationClass = '';

        if (window.lucide) {
            window.lucide.createIcons();
        }

        // Navegació de mesos
        document.getElementById('admin-calendar-prev-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            calendarAnimationClass = 'slide-from-left';
            currentCalendarMonth--;
            if (currentCalendarMonth < 0) {
                currentCalendarMonth = 11;
                currentCalendarYear--;
            }
            renderCalendarAdmin(allEvents);
        });

        document.getElementById('admin-calendar-next-btn').addEventListener('click', (e) => {
            e.stopPropagation();
            calendarAnimationClass = 'slide-from-right';
            currentCalendarMonth++;
            if (currentCalendarMonth > 11) {
                currentCalendarMonth = 0;
                currentCalendarYear++;
            }
            renderCalendarAdmin(allEvents);
        });

        // Click en els dies per a filtrar
        widgetContainer.querySelectorAll('.calendar-day').forEach(cell => {
            cell.addEventListener('click', () => {
                const clickedDateStr = cell.getAttribute('data-date');
                
                if (selectedDate === clickedDateStr) {
                    selectedDate = null;
                } else {
                    selectedDate = clickedDateStr;
                    
                    const [cYear, cMonth, cDay] = clickedDateStr.split('-').map(Number);
                    if (cYear !== currentCalendarYear || (cMonth - 1) !== currentCalendarMonth) {
                        currentCalendarYear = cYear;
                        currentCalendarMonth = cMonth - 1;
                    }
                }
                
                loadEventsTable(); // recarregar la taula amb el filtre de data
            });
        });
    }

    // 5. Populate and Manage Photos Table
    async function loadPhotosTable() {
        const tbody = document.getElementById('table-photos-body');
        if (!tbody) return;

        tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">Carregant dades...</td></tr>';
        const photos = await window.db.getPhotos();

        // Populate category filter dropdown
        const categories = [...new Set(photos.map(p => p.category))].filter(Boolean);
        const filterSelect = document.getElementById('admin-photo-filter');
        const currentFilter = filterSelect ? filterSelect.value : 'all';
        if (filterSelect) {
            let filterHTML = '<option value="all">Totes les categories</option>';
            categories.forEach(cat => {
                const safeCat = window.db.escapeHTML(cat);
                const selected = cat === currentFilter ? 'selected' : '';
                filterHTML += `<option value="${safeCat}" ${selected}>${safeCat}</option>`;
            });
            filterSelect.innerHTML = filterHTML;
        }

        // Populate category select in upload modal
        const selectCategory = document.getElementById('photo-category-select');
        if (selectCategory) {
            let selectHTML = '<option value="" disabled selected>Selecciona una categoria...</option>';
            categories.forEach(cat => {
                const safeCat = window.db.escapeHTML(cat);
                selectHTML += `<option value="${safeCat}">${safeCat}</option>`;
            });
            selectHTML += '<option value="__new__">+ Crear nova categoria...</option>';
            selectCategory.innerHTML = selectHTML;
        }

        const filterValue = filterSelect ? filterSelect.value : 'all';
        const filteredPhotos = filterValue === 'all' 
            ? photos 
            : photos.filter(p => p.category === filterValue);

        if (filteredPhotos.length === 0) {
            tbody.innerHTML = '<tr><td colspan="4" style="text-align: center;">No hi ha fotografies en aquesta categoria.</td></tr>';
            return;
        }

        tbody.innerHTML = filteredPhotos.map(item => {
            const imgUrl = (item.image_url.startsWith('http') || item.image_url.startsWith('data:image') || item.image_url.startsWith('/'))
                ? item.image_url
                : '../' + item.image_url;
            const escImgUrl = window.db.escapeHTML(imgUrl);
            const escTitle = window.db.escapeHTML(item.title);
            const escCat = window.db.escapeHTML(item.category || '');
            const escId = window.db.escapeHTML(item.id);
            return `
                <tr>
                    <td><img class="admin-table-img" src="${escImgUrl}" alt="Foto"></td>
                    <td style="font-weight: 600;">${escTitle}</td>
                    <td>${escCat}</td>
                    <td>
                        <button class="btn btn-sm btn-danger btn-delete-photo" data-id="${escId}" style="padding: 0.35rem 0.75rem;">
                            <i data-lucide="trash-2" style="width: 12px; height: 12px;"></i> Borrar
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        tbody.querySelectorAll('.btn-delete-photo').forEach(btn => {
            btn.addEventListener('click', async () => {
                if (confirm('Estàs segur que vols eliminar aquesta foto de la galeria?')) {
                    const id = btn.getAttribute('data-id');
                    await window.db.deletePhoto(id);
                    loadPhotosTable();
                }
            });
        });

        if (window.lucide) window.lucide.createIcons();
    }

    // 6. Modal Openers
    if (btnNewNews) {
        btnNewNews.addEventListener('click', () => {
            window.open('editor.html', '_blank');
        });
    }

    if (btnNewEvent) {
        btnNewEvent.addEventListener('click', () => {
            formEvent.reset();
            document.getElementById('event-id').value = '';
            document.getElementById('event-modal-title').textContent = 'Nou Acte';
            // Set default date as today
            document.getElementById('event-date').value = new Date().toISOString().split('T')[0];
            modalEvent.classList.add('active');
        });
    }

    if (btnNewPhoto) {
        btnNewPhoto.addEventListener('click', () => {
            formPhoto.reset();
            const newCategoryGroup = document.getElementById('new-category-group');
            const newCategoryGroupEs = document.getElementById('new-category-group-es');
            if (newCategoryGroup) newCategoryGroup.style.display = 'none';
            if (newCategoryGroupEs) newCategoryGroupEs.style.display = 'none';
            modalPhoto.classList.add('active');
        });
    }

    // Bind event listeners for dropdown category assignment and category filter
    const selectCategory = document.getElementById('photo-category-select');
    const newCategoryGroup = document.getElementById('new-category-group');
    const newCategoryGroupEs = document.getElementById('new-category-group-es');
    const inputNewCategory = document.getElementById('photo-category-new');
    const inputNewCategoryEs = document.getElementById('photo-category-new-es');
    
    if (selectCategory) {
        selectCategory.addEventListener('change', () => {
            if (selectCategory.value === '__new__') {
                if (newCategoryGroup) newCategoryGroup.style.display = 'block';
                if (newCategoryGroupEs) newCategoryGroupEs.style.display = 'block';
                if (inputNewCategory) {
                    inputNewCategory.required = true;
                    inputNewCategory.focus();
                }
                if (inputNewCategoryEs) {
                    inputNewCategoryEs.required = true;
                }
            } else {
                if (newCategoryGroup) newCategoryGroup.style.display = 'none';
                if (newCategoryGroupEs) newCategoryGroupEs.style.display = 'none';
                if (inputNewCategory) inputNewCategory.required = false;
                if (inputNewCategoryEs) inputNewCategoryEs.required = false;
            }
        });
    }

    const adminPhotoFilter = document.getElementById('admin-photo-filter');
    if (adminPhotoFilter) {
        adminPhotoFilter.addEventListener('change', () => {
            loadPhotosTable();
        });
    }

    // 7. Form Submissions (Add Content)


    if (formEvent) {
        formEvent.addEventListener('submit', async (e) => {
            e.preventDefault();
            const submitBtn = formEvent.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Guardant acte...';

            try {
                const id = document.getElementById('event-id').value;
                const title = document.getElementById('event-title').value;
                const date = document.getElementById('event-date').value;
                const time = document.getElementById('event-time').value;
                const location = document.getElementById('event-location').value;
                const checkboxes = document.querySelectorAll('input[name="event-category-check"]:checked');
                const category = Array.from(checkboxes).map(cb => cb.value).join(', ');

                if (category === '') {
                    alert("Si us plau, selecciona almenys una categoria.");
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Guardar';
                    return;
                }
                const description = document.getElementById('event-description').value;
                const long_description = document.getElementById('event-long-description').value;

                // Spanish fields
                const title_es = document.getElementById('event-title-es').value;
                const location_es = document.getElementById('event-location-es').value;
                const description_es = document.getElementById('event-description-es').value;
                const long_description_es = document.getElementById('event-long-description-es').value;
                
                const fileInput = document.getElementById('event-image-file');
                let image_url = document.getElementById('event-image').value.trim();

                if (fileInput && fileInput.files.length > 0) {
                    image_url = await window.db.uploadImage(fileInput.files[0]);
                }

                const eventData = { 
                    title, 
                    date, 
                    time, 
                    location, 
                    category, 
                    description, 
                    long_description, 
                    image_url,
                    title_es,
                    location_es,
                    description_es,
                    long_description_es
                };

                if (id) {
                    await window.db.editEvent(id, eventData);
                } else {
                    await window.db.addEvent(eventData);
                }
                
                modalEvent.classList.remove('active');
                formEvent.reset();
                loadEventsTable();
            } catch (err) {
                console.error("Error saving event:", err);
                alert("S'ha produït un error al guardar l'acte.");
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Guardar Acte';
            }
        });
    }

    if (formPhoto) {
        formPhoto.addEventListener('submit', async (e) => {
            e.preventDefault();
            const titleInput = document.getElementById('photo-title').value.trim();
            const fileInput = document.getElementById('photo-file');
            
            let category = selectCategory ? selectCategory.value : '';
            if (category === '__new__' && inputNewCategory) {
                category = inputNewCategory.value.trim();
            }

            if (!category) {
                alert("Si us plau, selecciona o crea una categoria.");
                return;
            }

            const submitBtn = formPhoto.querySelector('button[type="submit"]');
            submitBtn.disabled = true;

            try {
                // If local files are selected, process multiple uploads
                if (fileInput && fileInput.files.length > 0) {
                    const files = fileInput.files;
                    submitBtn.textContent = `Pujant 1/${files.length} imatges...`;
                    
                    for (let i = 0; i < files.length; i++) {
                        const file = files[i];
                        submitBtn.textContent = `Pujant ${i + 1}/${files.length} imatges...`;
                        
                        const fileUrl = await window.db.uploadImage(file);
                        
                        // Determine photo title
                        let photoTitle = titleInput;
                        if (files.length > 1) {
                            if (photoTitle) {
                                photoTitle = `${photoTitle} (${i + 1})`;
                            } else {
                                photoTitle = file.name.split('.').slice(0, -1).join('.') || `Foto ${Date.now()}`;
                            }
                        } else if (!photoTitle) {
                            photoTitle = file.name.split('.').slice(0, -1).join('.') || `Foto ${Date.now()}`;
                        }

                        // Spanish photo title (we can append number just like Valencian)
                        const title_es_val = document.getElementById('photo-title-es').value.trim();
                        let photoTitleEs = title_es_val;
                        if (files.length > 1) {
                            if (photoTitleEs) {
                                photoTitleEs = `${photoTitleEs} (${i + 1})`;
                            } else {
                                photoTitleEs = photoTitle; // Fallback to Valencian title
                            }
                        } else if (!photoTitleEs) {
                            photoTitleEs = photoTitle;
                        }

                        // Spanish Category (if category is custom new category)
                        let category_es = category;
                        const selectCategory = document.getElementById('photo-category-select');
                        const inputNewCategoryEs = document.getElementById('photo-category-new-es');
                        if (selectCategory.value === '__new__' && inputNewCategoryEs) {
                            category_es = inputNewCategoryEs.value.trim() || category;
                        }

                        await window.db.addPhoto({ 
                            title: photoTitle, 
                            title_es: photoTitleEs,
                            image_url: fileUrl, 
                            category,
                            category_es
                        });
                    }
                } else {
                    // Single upload via URL
                    let image_url = document.getElementById('photo-image').value.trim();
                    if (!image_url) {
                        alert("Si us plau, introdueix una URL de la imatge o selecciona un o més fitxers locals.");
                        submitBtn.disabled = false;
                        submitBtn.textContent = 'Pujar Imatge';
                        return;
                    }
                    
                    let photoTitle = titleInput || `Foto URL ${Date.now()}`;
                    const title_es_val = document.getElementById('photo-title-es').value.trim();
                    let photoTitleEs = title_es_val || photoTitle;

                    let category_es = category;
                    const selectCategory = document.getElementById('photo-category-select');
                    const inputNewCategoryEs = document.getElementById('photo-category-new-es');
                    if (selectCategory.value === '__new__' && inputNewCategoryEs) {
                        category_es = inputNewCategoryEs.value.trim() || category;
                    }

                    await window.db.addPhoto({ 
                        title: photoTitle, 
                        title_es: photoTitleEs,
                        image_url, 
                        category,
                        category_es
                    });
                }
                
                modalPhoto.classList.remove('active');
                formPhoto.reset();
                const newCategoryGroup = document.getElementById('new-category-group');
                const newCategoryGroupEs = document.getElementById('new-category-group-es');
                if (newCategoryGroup) newCategoryGroup.style.display = 'none';
                if (newCategoryGroupEs) newCategoryGroupEs.style.display = 'none';
                loadPhotosTable();
            } catch (err) {
                console.error("Error adding photo:", err);
                alert("S'ha produït un error en pujar la imatge.");
            } finally {
                submitBtn.disabled = false;
                submitBtn.textContent = 'Pujar Imatge';
            }
        });
    }

    // 8. DB Connection Config Submissions
    if (configForm) {
        configForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const urlInput = document.getElementById('config-url');
            const keyInput = document.getElementById('config-key');
            const url = urlInput.value.trim();
            const key = keyInput.value.trim();

            if (url && key) {
                const connected = window.db.setConfig(url, key);
                if (connected) {
                    if (window.db.config && window.db.config.url) {
                        urlInput.value = window.db.config.url;
                    }
                    alert('Base de dades Supabase configurada correctament. Intentant carregar dades del núvol...');
                    // Reload everything in current view context
                    checkAuthState();
                } else {
                    alert('Error en configurar la base de dades.');
                }
            }
        });
    }

    if (btnResetDb) {
        btnResetDb.addEventListener('click', () => {
            if (confirm('Vols desconnectar Supabase? Es tornaran a utilitzar les dades locals de prova.')) {
                window.db.setConfig(null, null);
                document.getElementById('config-url').value = '';
                document.getElementById('config-key').value = '';
                checkAuthState();
            }
        });
    }

    // Profile Form Event Listeners
    const profileForm = document.getElementById('profile-form');
    const profileNameInput = document.getElementById('profile-name-input');
    const profileAvatarUrlInput = document.getElementById('profile-avatar-url-input');
    const profileAvatarFile = document.getElementById('profile-avatar-file');
    const profilePreviewImg = document.getElementById('profile-preview-img');

    if (profileAvatarUrlInput && profilePreviewImg) {
        profileAvatarUrlInput.addEventListener('input', () => {
            profilePreviewImg.src = profileAvatarUrlInput.value || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100";
        });
    }

    if (profileAvatarFile && profilePreviewImg && profileAvatarUrlInput) {
        profileAvatarFile.addEventListener('change', async (e) => {
            const file = e.target.files[0];
            if (!file) return;

            profilePreviewImg.style.opacity = "0.5";

            try {
                let url = "";
                // Always use window.db.uploadImage to enable client-side compression & avoid QuotaExceededError in localStorage
                if (window.db && typeof window.db.uploadImage === 'function') {
                    url = await window.db.uploadImage(file);
                    
                    // If Supabase is configured but the returned url is a local Base64 string, the upload to Storage failed
                    if (url.startsWith('data:') && window.db.isSupabaseConfigured()) {
                        throw new Error("No s'ha pogut pujar la imatge al servidor de Supabase (bucket 'photos'). Comprova la teva connexió o els permisos d'emmagatzematge del servidor.");
                    }
                } else {
                    const reader = new FileReader();
                    url = await new Promise((resolve) => {
                        reader.onload = (event) => resolve(event.target.result);
                        reader.readAsDataURL(file);
                    });
                }
                profileAvatarUrlInput.value = url;
                profilePreviewImg.src = url;
            } catch (err) {
                console.error("Error uploading profile photo:", err);
                alert("Error al carregar la foto de perfil: " + err.message);
                profileAvatarFile.value = ""; // clear selected file
            } finally {
                profilePreviewImg.style.opacity = "1";
            }
        });
    }

    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            if (!currentUser) return;

            const submitBtn = profileForm.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                submitBtn.innerHTML = '<i class="spin" data-lucide="loader" style="width: 14px; height: 14px; margin-right: 0.5rem; display: inline-block;"></i> Guardant...';
                if (window.lucide) window.lucide.createIcons();
            }

            try {
                const name = profileNameInput.value.trim();
                const avatarUrl = profileAvatarUrlInput.value.trim();

                await saveProfile(currentUser, name, avatarUrl);

                userGreeting.textContent = `Hola, ${name}!`;
                const profileName = document.querySelector('.admin-profile-name');
                const profileAvatar = document.querySelector('.admin-profile-avatar img');
                if (profileName) profileName.textContent = name;
                if (profileAvatar) profileAvatar.src = avatarUrl || "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=100";

                alert("Perfil actualitzat correctament.");
            } catch (err) {
                console.error("Error saving profile:", err);
                alert("S'ha produït un error al guardar el perfil: " + err.message);
            } finally {
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.innerHTML = '<i data-lucide="save" style="width: 14px; height: 14px;"></i> Guardar Canvis';
                    if (window.lucide) window.lucide.createIcons();
                }
            }
        });
    }

    // Backup & Sync listeners
    const btnExportDb = document.getElementById('btn-export-db');
    const inputImportDb = document.getElementById('input-import-db');

    if (btnExportDb) {
        btnExportDb.addEventListener('click', async () => {
            try {
                const data = await window.db.exportLocalData();
                const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
                const downloadAnchor = document.createElement('a');
                downloadAnchor.setAttribute("href", dataStr);
                downloadAnchor.setAttribute("download", `ares_backup_${new Date().toISOString().split('T')[0]}.json`);
                document.body.appendChild(downloadAnchor);
                downloadAnchor.click();
                downloadAnchor.remove();
            } catch (err) {
                alert("Error en exportar la còpia de seguretat: " + err.message);
            }
        });
    }

    if (inputImportDb) {
        inputImportDb.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async (event) => {
                try {
                    const data = JSON.parse(event.target.result);
                    if (!data.news && !data.events && !data.photos) {
                        throw new Error("El fitxer no té el format de còpia de seguretat correcte.");
                    }

                    // F9: Validació profunda de l'esquema de cada ítem abans d'importar
                    function validateNewsItem(item) {
                        if (!item || typeof item !== 'object') return false;
                        if (typeof item.id !== 'string' || item.id.length > 100) return false;
                        if (typeof item.title !== 'string' || item.title.length > 500) return false;
                        if (item.content && typeof item.content !== 'string') return false;
                        if (item.image_url && typeof item.image_url !== 'string') return false;
                        if (item.image_url && item.image_url.length > 2000) return false;
                        return true;
                    }
                    function validateEventItem(item) {
                        if (!item || typeof item !== 'object') return false;
                        if (typeof item.id !== 'string' || item.id.length > 100) return false;
                        if (typeof item.title !== 'string' || item.title.length > 500) return false;
                        if (item.date && !/^\d{4}-\d{2}-\d{2}$/.test(item.date)) return false;
                        return true;
                    }
                    function validatePhotoItem(item) {
                        if (!item || typeof item !== 'object') return false;
                        if (typeof item.id !== 'string' || item.id.length > 100) return false;
                        if (typeof item.image_url !== 'string') return false;
                        return true;
                    }

                    const validNews = (data.news || []).filter(validateNewsItem);
                    const validEvents = (data.events || []).filter(validateEventItem);
                    const validPhotos = (data.photos || []).filter(validatePhotoItem);
                    const skipped = (data.news || []).length - validNews.length +
                                    (data.events || []).length - validEvents.length +
                                    (data.photos || []).length - validPhotos.length;

                    const countNews = validNews.length;
                    const countEvents = validEvents.length;
                    const countPhotos = validPhotos.length;

                    let confirmMsg = `Es restauraran:\n- ${countNews} notícies\n- ${countEvents} actes\n- ${countPhotos} fotos\n`;
                    if (skipped > 0) {
                        confirmMsg += `\n⚠️ ${skipped} ítem(s) descartats per tenir un format invàlid.\n`;
                    }
                    confirmMsg += "\nEstàs segur que vols continuar? Les dades existents es sobreescriuran/actualitzaran.";

                    if (confirm(confirmMsg)) {
                        // Importar només els ítems validats
                        const safeData = { news: validNews, events: validEvents, photos: validPhotos };
                        const result = await window.db.importBackup(safeData);
                        if (result.success) {
                            alert("Còpia de seguretat importada correctament!");
                            checkAuthState();
                        } else {
                            alert("S'han produït errors durant la importació:\n" + result.errors.join("\n"));
                            checkAuthState();
                        }
                    }
                } catch (err) {
                    alert("Error en llegir o importar el fitxer: " + err.message);
                }
                inputImportDb.value = "";
            };
            reader.readAsText(file);
        });
    }

    // Category Colors Management functions & listeners
    function loadCategoryColorsForm() {
        const colors = window.db.getCategoryColors();
        const container = document.getElementById('category-cards-container');
        if (!container) return;

        container.innerHTML = Object.keys(colors).map(cat => {
            const catColors = colors[cat];
            const displayName = cat.charAt(0).toUpperCase() + cat.slice(1);
            const safeCat = window.db.escapeHTML(cat);
            const safeDisplayName = window.db.escapeHTML(displayName);
            const safeBg = window.db.escapeHTML(catColors.bg || '#e4e4e7');
            const safeText = window.db.escapeHTML(catColors.text || '#18181b');
            return `
                <div class="category-card" data-cat="${safeCat}" style="border: 1px solid var(--border-color); padding: 1.25rem; border-radius: 8px; background-color: var(--bg-secondary); position: relative;">
                    <button type="button" class="btn-delete-cat" data-cat="${safeCat}" style="position: absolute; top: 0.75rem; right: 0.75rem; background: none; border: none; color: #ef4444; cursor: pointer; padding: 0.25rem;" title="Eliminar Etiqueta">
                        <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
                    </button>
                    <h5 style="margin-bottom: 1rem; text-transform: uppercase; font-size: 0.85rem; letter-spacing: 0.05em; font-family: var(--font-heading); border-left: 3px solid var(--text-primary); padding-left: 0.5rem; padding-right: 2rem; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${safeDisplayName}</h5>
                    <div class="form-group" style="margin-bottom: 0.75rem;">
                        <label style="font-size: 0.75rem; display: block; margin-bottom: 0.25rem; font-weight: 700; color: var(--text-secondary);">Color de fons</label>
                        <input type="color" class="color-bg-input" value="${safeBg}" style="width: 100%; height: 38px; padding: 0.25rem; border: 1px solid var(--border-color); cursor: pointer; border-radius: 4px; background: none;">
                    </div>
                    <div class="form-group" style="margin-bottom: 0;">
                        <label style="font-size: 0.75rem; display: block; margin-bottom: 0.25rem; font-weight: 700; color: var(--text-secondary);">Color del text</label>
                        <input type="color" class="color-text-input" value="${safeText}" style="width: 100%; height: 38px; padding: 0.25rem; border: 1px solid var(--border-color); cursor: pointer; border-radius: 4px; background: none;">
                    </div>
                </div>
            `;
        }).join('');

        // Re-attach delete listeners
        container.querySelectorAll('.btn-delete-cat').forEach(btn => {
            btn.addEventListener('click', async () => {
                const cat = btn.getAttribute('data-cat');
                if (confirm(`Estàs segur que vols esborrar l'etiqueta "${cat}"? Els actes d'aquesta categoria s'hauran de reassignar.`)) {
                    try {
                        await window.db.deleteCategory(cat);
                        loadCategoryColorsForm();
                        loadCategorySelects();
                        loadEventsTable();
                    } catch (err) {
                        console.error("Error deleting category:", err);
                        alert("Error en esborrar la categoria: " + (err.message || err));
                    }
                }
            });
        });

        if (window.lucide) window.lucide.createIcons();
    }

    function loadCategorySelects() {
        const colors = window.db.getCategoryColors();
        const container = document.getElementById('event-categories-checkboxes');
        if (container) {
            container.innerHTML = Object.keys(colors).map(cat => {
                const displayName = cat.charAt(0).toUpperCase() + cat.slice(1);
                const safeCat = window.db.escapeHTML(cat);
                const safeDisplayName = window.db.escapeHTML(displayName);
                return `
                    <label style="display: inline-flex; align-items: center; gap: 0.5rem; background-color: var(--bg-secondary); border: 1px solid var(--border-color); padding: 0.4rem 0.75rem; border-radius: 6px; cursor: pointer; font-size: 0.85rem; user-select: none;">
                        <input type="checkbox" name="event-category-check" value="${safeCat}" style="cursor: pointer;">
                        <span>${safeDisplayName}</span>
                    </label>
                `;
            }).join('');
        }
    }

    const btnNewCategory = document.getElementById('btn-new-category');
    if (btnNewCategory) {
        btnNewCategory.addEventListener('click', async () => {
            const name = prompt("Introdueix el nom de la nova etiqueta (ej. taurins, jocs, etc.):");
            if (name) {
                try {
                    const key = await window.db.addCategory(name);
                    if (key) {
                        loadCategoryColorsForm();
                        loadCategorySelects();
                    } else {
                        alert("Aquesta etiqueta ja existeix o el nom no és vàlid.");
                    }
                } catch (err) {
                    console.error("Error adding category:", err);
                    alert("Error en afegir la categoria: " + (err.message || err));
                }
            }
        });
    }

    const formColors = document.getElementById('form-category-colors');
    if (formColors) {
        formColors.addEventListener('submit', async (e) => {
            e.preventDefault();
            const colors = {};
            const cards = formColors.querySelectorAll('.category-card');
            cards.forEach(card => {
                const cat = card.getAttribute('data-cat');
                const bg = card.querySelector('.color-bg-input').value;
                const text = card.querySelector('.color-text-input').value;
                colors[cat] = { bg, text };
            });
            try {
                await window.db.saveCategoryColors(colors);
                alert('Colors de categoria guardats correctament.');
                loadEventsTable();
            } catch (err) {
                console.error("Error saving category colors:", err);
                alert("Error en guardar els colors: " + (err.message || err));
            }
        });
    }

    const btnResetColors = document.getElementById('btn-reset-colors');
    if (btnResetColors) {
        btnResetColors.addEventListener('click', async () => {
            if (confirm('Vols restablir els colors per defecte de les categories?')) {
                localStorage.removeItem('ares_category_colors');
                const defaults = window.db.getCategoryColors();
                try {
                    await window.db.saveCategoryColors(defaults);
                    loadCategoryColorsForm();
                    loadCategorySelects();
                    await loadEventsTable();
                } catch (err) {
                    console.error("Error resetting category colors:", err);
                    alert("Error en restablir els colors: " + (err.message || err));
                }
            }
        });
    }

    // Setup event translation button handler
    const btnTranslateEvent = document.getElementById('btn-translate-event');
    if (btnTranslateEvent) {
        btnTranslateEvent.addEventListener('click', async () => {
            const title = document.getElementById('event-title').value.trim();
            const location = document.getElementById('event-location').value.trim();
            const description = document.getElementById('event-description').value.trim();
            const longDesc = document.getElementById('event-long-description').value.trim();

            if (!title && !description) {
                alert("Si us plau, introdueix primer el títol o la descripció de l'acte en Valencià.");
                return;
            }

            const originalHTML = btnTranslateEvent.innerHTML;
            btnTranslateEvent.disabled = true;
            btnTranslateEvent.innerHTML = '<i data-lucide="loader" class="spin" style="width: 14px; height: 14px;"></i> Traduint...';
            if (window.lucide) window.lucide.createIcons();

            try {
                if (title) {
                    document.getElementById('event-title-es').value = await translateText(title);
                }
                if (location) {
                    document.getElementById('event-location-es').value = await translateText(location);
                }
                if (description) {
                    document.getElementById('event-description-es').value = await translateText(description);
                }
                if (longDesc) {
                    document.getElementById('event-long-description-es').value = await translateHTML(longDesc);
                }
            } catch (error) {
                console.error("Error durant la traducció de l'acte:", error);
                alert("S'ha produït un error durant la traducció automàtica: " + error.message);
            } finally {
                btnTranslateEvent.disabled = false;
                btnTranslateEvent.innerHTML = originalHTML;
                if (window.lucide) window.lucide.createIcons();
            }
        });
    }

    function chunkTextBySentences(text, maxLength = 450) {
        if (text.length <= maxLength) return [text];
        
        const sentences = text.match(/[^.!?]+[.!?]+(\s+|$)|[^.!?]+$/g) || [text];
        const chunks = [];
        let currentChunk = '';
        
        for (const sentence of sentences) {
            if ((currentChunk + sentence).length > maxLength) {
                if (currentChunk.trim()) {
                    chunks.push(currentChunk.trim());
                }
                currentChunk = sentence;
                
                // If a single sentence is still longer than maxLength, force split it
                while (currentChunk.length > maxLength) {
                    let splitIdx = currentChunk.lastIndexOf(' ', maxLength);
                    if (splitIdx === -1) splitIdx = maxLength;
                    chunks.push(currentChunk.substring(0, splitIdx).trim());
                    currentChunk = currentChunk.substring(splitIdx);
                }
            } else {
                currentChunk += sentence;
            }
        }
        
        if (currentChunk.trim()) {
            chunks.push(currentChunk.trim());
        }
        
        return chunks;
    }

    async function translateTextDirect(text) {
        if (!text || !text.trim()) return '';
        try {
            let email = '';
            if (window.db && typeof window.db.getCurrentUser === 'function') {
                const user = await window.db.getCurrentUser();
                if (user && user.email) {
                    email = user.email;
                }
            }
            if (!email) {
                email = 'comissio@aresdelmaestrat.com';
            }
            if (window.db && window.db.supabase) {
                const { data, error } = await window.db.supabase.functions.invoke('translate-text', {
                    body: { text: text, email: email }
                });
                if (error) throw error;
                return data.translatedText;
            } else {
                const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=ca|es&de=${encodeURIComponent(email)}`;
                const res = await fetch(url);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                if (data && data.responseStatus && data.responseStatus !== 200) {
                    throw new Error(data.responseDetails || `API status ${data.responseStatus}`);
                }
                if (data && data.responseData && data.responseData.translatedText) {
                    return data.responseData.translatedText;
                }
                throw new Error('Invalid response format');
            }
        } catch (err) {
            console.error('Translation API call error:', err);
            throw err;
        }
    }

    async function translateText(text) {
        if (!text || !text.trim()) return '';
        
        if (text.length <= 450) {
            return await translateTextDirect(text);
        }
        
        const chunks = chunkTextBySentences(text, 450);
        const translatedChunks = [];
        
        for (const chunk of chunks) {
            if (!chunk.trim()) {
                translatedChunks.push(chunk);
                continue;
            }
            const translated = await translateTextDirect(chunk);
            translatedChunks.push(translated);
        }
        
        return translatedChunks.join(' ');
    }

    async function translateNode(node) {
        if (node.nodeType === Node.TEXT_NODE) {
            const text = node.textContent;
            if (!text.trim()) return text;
            return await translateText(text);
        }
        
        if (node.nodeType === Node.ELEMENT_NODE) {
            const innerHTML = node.innerHTML;
            if (!innerHTML.trim()) return node.outerHTML;
            
            // Case 1: Fits in a single API query (preserves context and tags perfectly)
            if (innerHTML.length <= 450) {
                const translatedInner = await translateTextDirect(innerHTML);
                const clone = node.cloneNode(false);
                clone.innerHTML = translatedInner;
                return clone.outerHTML;
            }
            
            // Case 2: Exceeds 450 characters.
            // Check if it has any element children.
            const hasElementChildren = Array.from(node.childNodes).some(child => child.nodeType === Node.ELEMENT_NODE);
            
            if (!hasElementChildren) {
                // It's a plain block of text without inline tags, so we can chunk it safely by sentences.
                const translatedInner = await translateText(node.textContent);
                const clone = node.cloneNode(false);
                clone.innerHTML = translatedInner;
                return clone.outerHTML;
            }
            
            // Case 3: It is long and contains inline tags. We must recurse to translate each child separately.
            const clone = node.cloneNode(false);
            for (const child of node.childNodes) {
                clone.innerHTML += await translateNode(child);
            }
            return clone.outerHTML;
        }
        return '';
    }

    async function translateHTML(htmlStr) {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlStr;
        let result = '';
        for (const node of tempDiv.childNodes) {
            result += await translateNode(node);
        }
        return result;
    }

    // FAQs Management
    let faqsList = [];

    async function loadFaqsAdmin() {
        try {
            faqsList = await window.db.getFAQs();
            renderFaqsTable();
        } catch (err) {
            console.error("Error loading FAQs in admin:", err);
        }
    }

    function renderFaqsTable() {
        const container = document.getElementById('faqs-list-container');
        if (!container) return;

        if (faqsList.length === 0) {
            container.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: var(--text-muted); background-color: var(--bg-secondary); border-radius: 8px; border: 1px dashed var(--border-color);">
                    No hi ha preguntes freqüents configurades.
                </div>
            `;
            return;
        }

        container.innerHTML = faqsList.map((faq, idx) => {
            const escQuestion = window.db.escapeHTML(faq.question);
            const escQuestionEs = window.db.escapeHTML(faq.question_es || faq.question);
            const escAnswer = window.db.escapeHTML(faq.answer);
            const escAnswerEs = window.db.escapeHTML(faq.answer_es || faq.answer);
            const escId = window.db.escapeHTML(faq.id);

            return `
                <div class="faq-admin-card" data-id="${escId}" style="border: 1px solid var(--border-color); border-radius: 8px; background-color: var(--bg-secondary); padding: 1.25rem; display: flex; flex-direction: column; gap: 0.75rem; position: relative;">
                    <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 1rem;">
                        <div style="flex-grow: 1; min-width: 0;">
                            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                                <span style="font-size: 0.65rem; background-color: var(--text-primary); color: var(--bg-primary); padding: 0.15rem 0.4rem; border-radius: 4px; font-weight: 700; text-transform: uppercase;">VAL</span>
                                <h4 style="margin: 0; font-size: 0.95rem; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escQuestion}</h4>
                            </div>
                            <div style="display: flex; align-items: center; gap: 0.5rem;">
                                <span style="font-size: 0.65rem; background-color: var(--text-muted); color: var(--bg-primary); padding: 0.15rem 0.4rem; border-radius: 4px; font-weight: 700; text-transform: uppercase;">ESP</span>
                                <h4 style="margin: 0; font-size: 0.95rem; font-weight: 700; color: var(--text-secondary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${escQuestionEs}</h4>
                            </div>
                        </div>
                        <div style="display: flex; gap: 0.35rem; flex-shrink: 0;">
                            <button type="button" class="btn-move-faq-up" data-index="${idx}" ${idx === 0 ? 'disabled' : ''} style="background: none; border: 1px solid var(--border-color); color: var(--text-primary); cursor: pointer; padding: 0.35rem; border-radius: 4px; opacity: ${idx === 0 ? '0.3' : '1'};" title="Pujar">
                                <i data-lucide="arrow-up" style="width: 14px; height: 14px;"></i>
                            </button>
                            <button type="button" class="btn-move-faq-down" data-index="${idx}" ${idx === faqsList.length - 1 ? 'disabled' : ''} style="background: none; border: 1px solid var(--border-color); color: var(--text-primary); cursor: pointer; padding: 0.35rem; border-radius: 4px; opacity: ${idx === faqsList.length - 1 ? '0.3' : '1'};" title="Baixar">
                                <i data-lucide="arrow-down" style="width: 14px; height: 14px;"></i>
                            </button>
                            <button type="button" class="btn-edit-faq" data-id="${escId}" style="background: none; border: 1px solid var(--border-color); color: var(--text-primary); cursor: pointer; padding: 0.35rem; border-radius: 4px;" title="Editar">
                                <i data-lucide="edit-3" style="width: 14px; height: 14px;"></i>
                            </button>
                            <button type="button" class="btn-delete-faq" data-id="${escId}" style="background: none; border: 1px solid #ef4444; color: #ef4444; cursor: pointer; padding: 0.35rem; border-radius: 4px;" title="Eliminar">
                                <i data-lucide="trash-2" style="width: 14px; height: 14px;"></i>
                            </button>
                        </div>
                    </div>
                    <div style="font-size: 0.8rem; line-height: 1.4; color: var(--text-secondary); border-top: 1px solid var(--border-color); padding-top: 0.5rem; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">
                        ${escAnswer}
                    </div>
                </div>
            `;
        }).join('');

        // Bind delete buttons
        container.querySelectorAll('.btn-delete-faq').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                if (confirm('Vols esborrar aquesta pregunta freqüent?')) {
                    faqsList = faqsList.filter(f => f.id !== id);
                    renderFaqsTable();
                }
            });
        });

        // Bind edit buttons
        container.querySelectorAll('.btn-edit-faq').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const faq = faqsList.find(f => f.id === id);
                if (faq) {
                    openFaqModal(faq);
                }
            });
        });

        // Bind move buttons
        container.querySelectorAll('.btn-move-faq-up').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.getAttribute('data-index'), 10);
                if (index > 0) {
                    const temp = faqsList[index];
                    faqsList[index] = faqsList[index - 1];
                    faqsList[index - 1] = temp;
                    renderFaqsTable();
                }
            });
        });

        container.querySelectorAll('.btn-move-faq-down').forEach(btn => {
            btn.addEventListener('click', () => {
                const index = parseInt(btn.getAttribute('data-index'), 10);
                if (index < faqsList.length - 1) {
                    const temp = faqsList[index];
                    faqsList[index] = faqsList[index + 1];
                    faqsList[index + 1] = temp;
                    renderFaqsTable();
                }
            });
        });

        if (window.lucide) window.lucide.createIcons();
    }

    function openFaqModal(faq = null) {
        const modal = document.getElementById('modal-faq');
        const form = document.getElementById('form-faq');
        const modalTitle = document.getElementById('faq-modal-title');
        
        if (!modal || !form) return;

        form.reset();
        
        if (faq) {
            modalTitle.textContent = "Editar FAQ";
            document.getElementById('faq-id').value = faq.id;
            document.getElementById('faq-question').value = faq.question;
            document.getElementById('faq-question-es').value = faq.question_es || faq.question;
            document.getElementById('faq-answer').value = faq.answer;
            document.getElementById('faq-answer-es').value = faq.answer_es || faq.answer;
        } else {
            modalTitle.textContent = "Nova FAQ";
            document.getElementById('faq-id').value = '';
        }

        modal.classList.add('active');
        if (window.lucide) window.lucide.createIcons();
    }

    // Setup FAQ management form and action buttons
    const btnNewFaq = document.getElementById('btn-new-faq');
    if (btnNewFaq) {
        btnNewFaq.addEventListener('click', () => {
            openFaqModal();
        });
    }

    const formFaq = document.getElementById('form-faq');
    if (formFaq) {
        formFaq.addEventListener('submit', (e) => {
            e.preventDefault();
            const id = document.getElementById('faq-id').value;
            const question = document.getElementById('faq-question').value.trim();
            const question_es = document.getElementById('faq-question-es').value.trim();
            const answer = document.getElementById('faq-answer').value.trim();
            const answer_es = document.getElementById('faq-answer-es').value.trim();

            if (id) {
                // Edit existing
                const index = faqsList.findIndex(f => f.id === id);
                if (index !== -1) {
                    faqsList[index] = { id, question, question_es, answer, answer_es };
                }
            } else {
                // Add new
                faqsList.push({
                    id: 'faq-' + Date.now(),
                    question,
                    question_es,
                    answer,
                    answer_es
                });
            }

            closeModal('modal-faq');
            renderFaqsTable();
        });
    }

    const btnSaveFaqs = document.getElementById('btn-save-faqs');
    if (btnSaveFaqs) {
        btnSaveFaqs.addEventListener('click', async () => {
            try {
                btnSaveFaqs.disabled = true;
                const originalText = btnSaveFaqs.innerHTML;
                btnSaveFaqs.innerHTML = '<i data-lucide="loader-2" class="animate-spin" style="width: 16px; height: 16px; margin-right: 0.5rem;"></i> Guardant...';
                if (window.lucide) window.lucide.createIcons();

                await window.db.saveFAQs(faqsList);
                alert('Preguntes freqüents (FAQs) guardades correctament.');

                btnSaveFaqs.innerHTML = originalText;
                btnSaveFaqs.disabled = false;
                if (window.lucide) window.lucide.createIcons();
            } catch (err) {
                console.error("Error saving FAQs:", err);
                alert("Error en guardar les FAQs: " + (err.message || err));
                btnSaveFaqs.disabled = false;
            }
        });
    }

    const btnResetFaqs = document.getElementById('btn-reset-faqs');
    if (btnResetFaqs) {
        btnResetFaqs.addEventListener('click', async () => {
            if (confirm('Vols restablir les FAQs a la configuració per defecte? Es perdran les modificacions actuals.')) {
                localStorage.removeItem('ares_faqs');
                try {
                    btnResetFaqs.disabled = true;
                    faqsList = await window.db.getFAQs();
                    await window.db.saveFAQs(faqsList);
                    renderFaqsTable();
                    alert('FAQs restablides correctament.');
                    btnResetFaqs.disabled = false;
                } catch (err) {
                    console.error("Error resetting FAQs:", err);
                    alert("Error en restablir les FAQs: " + (err.message || err));
                    btnResetFaqs.disabled = false;
                }
            }
        });
    }

    // Countdown Config Management
    async function loadCountdownAdmin() {
        try {
            const config = await window.db.getCountdown();
            const enabledInput = document.getElementById('countdown-enabled');
            const statusText = document.getElementById('countdown-status-text');
            const titleInput = document.getElementById('countdown-title');
            const titleEsInput = document.getElementById('countdown-title-es');
            const targetDateInput = document.getElementById('countdown-target-date');
            const targetTimeInput = document.getElementById('countdown-target-time');
            const descInput = document.getElementById('countdown-description');
            const descEsInput = document.getElementById('countdown-description-es');

            if (enabledInput) {
                enabledInput.checked = config.enabled !== false;
                if (statusText) statusText.textContent = enabledInput.checked ? 'ACTIVAT' : 'DESACTIVAT';
            }
            if (titleInput) titleInput.value = config.title || '';
            if (titleEsInput) titleEsInput.value = config.title_es || '';
            if (descInput) descInput.value = config.description || '';
            if (descEsInput) descEsInput.value = config.description_es || '';

            if (config.target_date) {
                const parts = config.target_date.split('T');
                if (targetDateInput) targetDateInput.value = parts[0] || '2026-08-16';
                if (targetTimeInput && parts[1]) {
                    targetTimeInput.value = parts[1].substring(0, 5) || '00:00';
                } else if (targetTimeInput) {
                    targetTimeInput.value = '00:00';
                }
            }
        } catch (err) {
            console.error("Error loading countdown config in admin:", err);
        }
    }

    const countdownEnabledCheckbox = document.getElementById('countdown-enabled');
    if (countdownEnabledCheckbox) {
        countdownEnabledCheckbox.addEventListener('change', () => {
            const statusText = document.getElementById('countdown-status-text');
            if (statusText) {
                statusText.textContent = countdownEnabledCheckbox.checked ? 'ACTIVAT' : 'DESACTIVAT';
            }
        });
    }

    const countdownForm = document.getElementById('countdown-form');
    if (countdownForm) {
        countdownForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btnSave = document.getElementById('btn-save-countdown');
            try {
                if (btnSave) {
                    btnSave.disabled = true;
                    btnSave.innerHTML = '<i data-lucide="loader-2" class="animate-spin" style="width: 16px; height: 16px;"></i> Guardant...';
                    if (window.lucide) window.lucide.createIcons();
                }

                const enabled = document.getElementById('countdown-enabled').checked;
                const title = document.getElementById('countdown-title').value.trim();
                const title_es = document.getElementById('countdown-title-es').value.trim();
                const dateVal = document.getElementById('countdown-target-date').value;
                const timeVal = document.getElementById('countdown-target-time').value || '00:00';
                const description = document.getElementById('countdown-description').value.trim();
                const description_es = document.getElementById('countdown-description-es').value.trim();

                const target_date = `${dateVal}T${timeVal}:00`;

                const configData = {
                    enabled,
                    title,
                    title_es,
                    target_date,
                    description,
                    description_es
                };

                await window.db.saveCountdown(configData);
                alert('Configuració del compte enrere guardada correctament.');

            } catch (err) {
                console.error("Error saving countdown config:", err);
                alert("Error en guardar la configuració del compte enrere: " + (err.message || err));
            } finally {
                if (btnSave) {
                    btnSave.disabled = false;
                    btnSave.innerHTML = '<i data-lucide="save" style="width: 16px; height: 16px;"></i> Guardar Canvis';
                    if (window.lucide) window.lucide.createIcons();
                }
            }
        });
    }

    const btnResetCountdown = document.getElementById('btn-reset-countdown');
    if (btnResetCountdown) {
        btnResetCountdown.addEventListener('click', async () => {
            if (confirm('Vols restablir el compte enrere a la configuració per defecte?')) {
                localStorage.removeItem('ares_countdown');
                try {
                    const defaults = window.db.getDefaultCountdown();
                    await window.db.saveCountdown(defaults);
                    await loadCountdownAdmin();
                    alert('Compte enrere restablit correctament.');
                } catch (err) {
                    console.error("Error resetting countdown:", err);
                    alert("Error en restablir el compte enrere: " + (err.message || err));
                }
            }
        });
    }

    // Home Layout & Module Management
    const HOME_BLOCK_NAMES = {
        'welcome-section': { name: '📝 Missatge de Benvinguda (Capçalera)', desc: 'Mòdul de text inicial de la portada' },
        'countdown-section': { name: '⏱️ Compte Enrere', desc: 'Temporitzador d\'inici de les festes' },
        'noticies': { name: '📰 Últimes Notícies', desc: 'Carrusel / Llistat de les 3 últimes notícies' },
        'events-highlight-section': { name: '📅 Pròxims Actes Destacats', desc: 'Tarjetes de pròxims actes del programa' },
        'oratge': { name: '☀️ Previsió del Temps', desc: 'Widget del clima a Ares del Maestrat' },
        'faqs-section': { name: '❓ Preguntes Freqüents (FAQs)', desc: 'Acordeó de dubtes habituals' },
        'cta-section': { name: '📣 Banner Final (Crida a l\'Acció)', desc: 'Banner inferior d\'enllaç a la programació' }
    };

    let currentHomeConfig = null;

    async function loadHomeAdmin() {
        try {
            currentHomeConfig = await window.db.getHomeConfig();

            const welcomeInput = document.getElementById('home-welcome-text');
            const welcomeEsInput = document.getElementById('home-welcome-text-es');

            if (welcomeInput) welcomeInput.value = currentHomeConfig.welcome_text || '';
            if (welcomeEsInput) welcomeEsInput.value = currentHomeConfig.welcome_text_es || '';

            renderHomeBlocksList();
        } catch (err) {
            console.error("Error loading home config in admin:", err);
        }
    }

    function renderHomeBlocksList() {
        const container = document.getElementById('home-blocks-reorder-container');
        if (!container || !currentHomeConfig) return;

        const allBlockKeys = Object.keys(HOME_BLOCK_NAMES);
        let blockOrder = currentHomeConfig.block_order || [];
        
        allBlockKeys.forEach(key => {
            if (!blockOrder.includes(key)) {
                blockOrder.push(key);
            }
        });
        currentHomeConfig.block_order = blockOrder;

        const hiddenBlocks = currentHomeConfig.hidden_blocks || [];

        container.innerHTML = blockOrder.map((blockKey, index) => {
            const blockInfo = HOME_BLOCK_NAMES[blockKey] || { name: blockKey, desc: '' };
            const isHidden = hiddenBlocks.includes(blockKey);
            const isFirst = index === 0;
            const isLast = index === blockOrder.length - 1;

            let editBtnHtml = '';
            if (blockKey === 'welcome-section') {
                editBtnHtml = `
                    <button type="button" class="btn btn-sm btn-secondary" onclick="openWelcomeModal()" style="padding: 0.35rem 0.65rem; font-size: 0.75rem; display: inline-flex; align-items: center; gap: 0.35rem;" title="Editar missatge de benvinguda en pop-up">
                        <i data-lucide="edit-3" style="width: 14px; height: 14px;"></i>
                        <span>Editar</span>
                    </button>
                `;
            } else if (blockKey === 'countdown-section') {
                editBtnHtml = `
                    <button type="button" class="btn btn-sm btn-secondary" onclick="openCountdownModal()" style="padding: 0.35rem 0.65rem; font-size: 0.75rem; display: inline-flex; align-items: center; gap: 0.35rem;" title="Editar compte enrere en pop-up">
                        <i data-lucide="edit-3" style="width: 14px; height: 14px;"></i>
                        <span>Editar</span>
                    </button>
                `;
            }

            return `
                <div class="home-block-item ${isHidden ? 'is-hidden-block' : ''}" draggable="true" data-block-key="${blockKey}" style="display: flex; align-items: center; justify-content: space-between; padding: 0.85rem 1.25rem; background: var(--bg-tertiary); border: 1px solid var(--border-color); border-radius: 8px; flex-wrap: wrap; gap: 0.75rem; opacity: ${isHidden ? '0.5' : '1'}; transition: all 0.2s ease; cursor: grab;">
                    <div style="display: flex; align-items: center; gap: 0.75rem; min-width: 250px; user-select: none;">
                        <i data-lucide="grip-vertical" style="width: 18px; height: 18px; color: var(--text-muted); flex-shrink: 0;"></i>
                        <span style="font-size: 0.8rem; font-weight: 700; font-family: var(--font-heading); color: var(--text-muted); width: 24px;">#${index + 1}</span>
                        <div>
                            <strong style="display: block; font-size: 0.95rem; color: var(--text-primary);">${blockInfo.name}</strong>
                            <span style="font-size: 0.8rem; color: var(--text-secondary); font-weight: 300;">${blockInfo.desc}</span>
                        </div>
                    </div>

                    <div style="display: flex; align-items: center; gap: 0.5rem;">
                        ${editBtnHtml}

                        <button type="button" class="btn btn-sm ${isHidden ? 'btn-secondary' : ''}" onclick="toggleHomeBlockVisibility('${blockKey}')" style="padding: 0.35rem 0.65rem; font-size: 0.75rem;" title="${isHidden ? 'Mostrar bloc' : 'Ocultar bloc'}">
                            <i data-lucide="${isHidden ? 'eye-off' : 'eye'}" style="width: 14px; height: 14px;"></i>
                            <span>${isHidden ? 'Ocult' : 'Visible'}</span>
                        </button>

                        <button type="button" class="btn btn-sm btn-secondary" onclick="moveHomeBlock('${blockKey}', -1)" ${isFirst ? 'disabled style="opacity:0.4;"' : ''} title="Pujar posició">
                            <i data-lucide="chevron-up" style="width: 14px; height: 14px;"></i>
                        </button>

                        <button type="button" class="btn btn-sm btn-secondary" onclick="moveHomeBlock('${blockKey}', 1)" ${isLast ? 'disabled style="opacity:0.4;"' : ''} title="Baixar posició">
                            <i data-lucide="chevron-down" style="width: 14px; height: 14px;"></i>
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        if (window.lucide) window.lucide.createIcons();
        initHomeDragAndDrop();
    }

    function initHomeDragAndDrop() {
        const container = document.getElementById('home-blocks-reorder-container');
        if (!container) return;

        let draggedKey = null;

        const items = container.querySelectorAll('.home-block-item');
        items.forEach(item => {
            item.addEventListener('dragstart', (e) => {
                draggedKey = item.getAttribute('data-block-key');
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', draggedKey);
                item.style.opacity = '0.4';
                item.style.transform = 'scale(0.98)';
            });

            item.addEventListener('dragend', () => {
                item.style.opacity = item.classList.contains('is-hidden-block') ? '0.5' : '1';
                item.style.transform = 'none';
                items.forEach(el => el.style.border = '1px solid var(--border-color)');
            });

            item.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                item.style.border = '2px dashed var(--text-primary)';
            });

            item.addEventListener('dragleave', () => {
                item.style.border = '1px solid var(--border-color)';
            });

            item.addEventListener('drop', (e) => {
                e.preventDefault();
                item.style.border = '1px solid var(--border-color)';
                const targetKey = item.getAttribute('data-block-key');

                if (draggedKey && targetKey && draggedKey !== targetKey) {
                    const order = currentHomeConfig.block_order;
                    const fromIdx = order.indexOf(draggedKey);
                    const toIdx = order.indexOf(targetKey);

                    if (fromIdx !== -1 && toIdx !== -1) {
                        order.splice(fromIdx, 1);
                        order.splice(toIdx, 0, draggedKey);
                        renderHomeBlocksList();
                    }
                }
            });
        });
    }

    window.openWelcomeModal = async function() {
        if (!currentHomeConfig) {
            currentHomeConfig = await window.db.getHomeConfig();
        }
        const wIn = document.getElementById('modal-welcome-text');
        const wEsIn = document.getElementById('modal-welcome-text-es');
        if (wIn) wIn.value = currentHomeConfig.welcome_text || '';
        if (wEsIn) wEsIn.value = currentHomeConfig.welcome_text_es || '';
        if (typeof window.openModal === 'function') {
            window.openModal('modal-edit-welcome');
        } else {
            const el = document.getElementById('modal-edit-welcome');
            if (el) el.classList.add('active');
        }
    };

    window.openCountdownModal = async function() {
        const config = await window.db.getCountdown();
        const enabledCb = document.getElementById('modal-countdown-enabled');
        const dateIn = document.getElementById('modal-countdown-date');
        const timeIn = document.getElementById('modal-countdown-time');
        const titleIn = document.getElementById('modal-countdown-title');
        const titleEsIn = document.getElementById('modal-countdown-title-es');
        const descIn = document.getElementById('modal-countdown-desc');
        const descEsIn = document.getElementById('modal-countdown-desc-es');

        if (enabledCb) enabledCb.checked = config.enabled !== false;
        if (dateIn) dateIn.value = config.target_date || '2026-08-16';
        if (timeIn) timeIn.value = config.target_time || '12:00';
        if (titleIn) titleIn.value = config.title || 'FESTES D\'ARES 2026';
        if (titleEsIn) titleEsIn.value = config.title_es || 'FIESTAS DE ARES 2026';
        if (descIn) descIn.value = config.description || '';
        if (descEsIn) descEsIn.value = config.description_es || '';

        if (typeof window.openModal === 'function') {
            window.openModal('modal-edit-countdown');
        } else {
            const el = document.getElementById('modal-edit-countdown');
            if (el) el.classList.add('active');
        }
    };

    window.moveHomeBlock = function(blockKey, direction) {
        if (!currentHomeConfig || !currentHomeConfig.block_order) return;
        const index = currentHomeConfig.block_order.indexOf(blockKey);
        if (index === -1) return;
        const targetIndex = index + direction;
        if (targetIndex < 0 || targetIndex >= currentHomeConfig.block_order.length) return;

        const temp = currentHomeConfig.block_order[index];
        currentHomeConfig.block_order[index] = currentHomeConfig.block_order[targetIndex];
        currentHomeConfig.block_order[targetIndex] = temp;

        renderHomeBlocksList();
    };

    window.toggleHomeBlockVisibility = function(blockKey) {
        if (!currentHomeConfig) return;
        if (!currentHomeConfig.hidden_blocks) currentHomeConfig.hidden_blocks = [];
        const idx = currentHomeConfig.hidden_blocks.indexOf(blockKey);
        if (idx === -1) {
            currentHomeConfig.hidden_blocks.push(blockKey);
        } else {
            currentHomeConfig.hidden_blocks.splice(idx, 1);
        }
        renderHomeBlocksList();
    };

    const btnGoToCountdown = document.getElementById('btn-go-to-countdown');
    if (btnGoToCountdown) {
        btnGoToCountdown.addEventListener('click', () => {
            window.openCountdownModal();
        });
    }

    const formModalWelcome = document.getElementById('form-modal-welcome');
    if (formModalWelcome) {
        formModalWelcome.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('btn-save-modal-welcome');
            try {
                if (btn) {
                    btn.disabled = true;
                    btn.innerHTML = '<i data-lucide="loader-2" class="animate-spin" style="width: 16px; height: 16px;"></i> Guardant...';
                    if (window.lucide) window.lucide.createIcons();
                }

                if (!currentHomeConfig) currentHomeConfig = await window.db.getHomeConfig();

                const welcomeVal = document.getElementById('modal-welcome-text').value.trim();
                const welcomeEsVal = document.getElementById('modal-welcome-text-es').value.trim();

                currentHomeConfig.welcome_text = welcomeVal;
                currentHomeConfig.welcome_text_es = welcomeEsVal;

                await window.db.saveHomeConfig(currentHomeConfig);

                const wIn = document.getElementById('home-welcome-text');
                const wEsIn = document.getElementById('home-welcome-text-es');
                if (wIn) wIn.value = welcomeVal;
                if (wEsIn) wEsIn.value = welcomeEsVal;

                const modal = document.getElementById('modal-edit-welcome');
                if (modal) modal.classList.remove('active');

                alert('Missatge de benvinguda actualitzat correctament.');

            } catch (err) {
                console.error("Error saving welcome text from modal:", err);
                alert("Error en guardar el missatge de benvinguda: " + (err.message || err));
            } finally {
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = '<i data-lucide="save" style="width: 16px; height: 16px;"></i> Guardar Canvis';
                    if (window.lucide) window.lucide.createIcons();
                }
            }
        });
    }

    const formModalCountdown = document.getElementById('form-modal-countdown');
    if (formModalCountdown) {
        formModalCountdown.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = document.getElementById('btn-save-modal-countdown');
            try {
                if (btn) {
                    btn.disabled = true;
                    btn.innerHTML = '<i data-lucide="loader-2" class="animate-spin" style="width: 16px; height: 16px;"></i> Guardant...';
                    if (window.lucide) window.lucide.createIcons();
                }

                const updatedConfig = {
                    enabled: document.getElementById('modal-countdown-enabled').checked,
                    target_date: document.getElementById('modal-countdown-date').value,
                    target_time: document.getElementById('modal-countdown-time').value,
                    title: document.getElementById('modal-countdown-title').value.trim(),
                    title_es: document.getElementById('modal-countdown-title-es').value.trim(),
                    description: document.getElementById('modal-countdown-desc').value.trim(),
                    description_es: document.getElementById('modal-countdown-desc-es').value.trim()
                };

                await window.db.saveCountdown(updatedConfig);
                await loadCountdownAdmin();

                const modal = document.getElementById('modal-edit-countdown');
                if (modal) modal.classList.remove('active');

                alert('Compte enrere actualitzat correctament.');

            } catch (err) {
                console.error("Error saving countdown from modal:", err);
                alert("Error en guardar el compte enrere: " + (err.message || err));
            } finally {
                if (btn) {
                    btn.disabled = false;
                    btn.innerHTML = '<i data-lucide="save" style="width: 16px; height: 16px;"></i> Guardar Canvis';
                    if (window.lucide) window.lucide.createIcons();
                }
            }
        });
    }

    const homeForm = document.getElementById('home-form');
    if (homeForm) {
        homeForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btnSave = document.getElementById('btn-save-home');
            try {
                if (btnSave) {
                    btnSave.disabled = true;
                    btnSave.innerHTML = '<i data-lucide="loader-2" class="animate-spin" style="width: 16px; height: 16px;"></i> Guardant...';
                    if (window.lucide) window.lucide.createIcons();
                }

                if (!currentHomeConfig) currentHomeConfig = await window.db.getHomeConfig();

                const welcomeInput = document.getElementById('home-welcome-text');
                const welcomeEsInput = document.getElementById('home-welcome-text-es');
                if (welcomeInput) currentHomeConfig.welcome_text = welcomeInput.value.trim();
                if (welcomeEsInput) currentHomeConfig.welcome_text_es = welcomeEsInput.value.trim();

                await window.db.saveHomeConfig(currentHomeConfig);
                alert('Configuració de la Home guardada correctament.');

            } catch (err) {
                console.error("Error saving home config:", err);
                alert("Error en guardar la configuració de la home: " + (err.message || err));
            } finally {
                if (btnSave) {
                    btnSave.disabled = false;
                    btnSave.innerHTML = '<i data-lucide="save" style="width: 16px; height: 16px;"></i> Guardar Canvis de la Home';
                    if (window.lucide) window.lucide.createIcons();
                }
            }
        });
    }

    const btnResetHome = document.getElementById('btn-reset-home');
    if (btnResetHome) {
        btnResetHome.addEventListener('click', async () => {
            if (confirm('Vols restablir l\'ordre i els textos de la home per defecte?')) {
                localStorage.removeItem('ares_home_config');
                try {
                    const defaults = window.db.getDefaultHomeConfig();
                    await window.db.saveHomeConfig(defaults);
                    await loadHomeAdmin();
                    alert('Home restablida per defecte correctament.');
                } catch (err) {
                    console.error("Error resetting home config:", err);
                    alert("Error en restablir la home: " + (err.message || err));
                }
            }
        });
    }

    // =============================================
    // CAMISETES / RESERVATIONS MANAGEMENT
    // =============================================
    
    const SIZES_ORDER = ['S','M','L','XL','2XL','3XL','4XL','5XL','6XL','7XL'];
    let reservationsOpen = true;
    let allReservations = [];

    async function loadReservationsTab() {
        await loadShopConfig();
        await loadReservationsTable();
        await loadProductsTable();
    }

    async function loadShopConfig() {
        try {
            const config = await window.db.getShopConfig();
            reservationsOpen = config.open !== false;
            updateReservationsToggleUI();
        } catch (e) {
            reservationsOpen = true;
            updateReservationsToggleUI();
        }
    }

    function updateReservationsToggleUI() {
        const btn = document.getElementById('btn-toggle-reservations');
        const label = document.getElementById('toggle-reservations-label');
        const banner = document.getElementById('reservations-status-banner');
        if (!btn || !label || !banner) return;

        if (reservationsOpen) {
            label.textContent = 'Tancar Reserves';
            btn.style.backgroundColor = '#ef4444';
            btn.style.color = '#fff';
            btn.style.borderColor = '#ef4444';
            banner.style.display = 'block';
            banner.style.background = '#dcfce7';
            banner.style.color = '#15803d';
            banner.style.border = '1px solid #bbf7d0';
            banner.textContent = '✅ Les reserves estan OBERTES. Els usuaris poden fer reserves a la web.';
        } else {
            label.textContent = 'Obrir Reserves';
            btn.style.backgroundColor = '';
            btn.style.color = '';
            btn.style.borderColor = '';
            banner.style.display = 'block';
            banner.style.background = '#fee2e2';
            banner.style.color = '#b91c1c';
            banner.style.border = '1px solid #fecaca';
            banner.textContent = '🔒 Les reserves estan TANCADES. El formulari de reserves no és visible a la web.';
        }
    }

    async function loadReservationsTable() {
        const tbody = document.getElementById('reservations-tbody');
        const statsEl = document.getElementById('reservations-stats');
        if (!tbody) return;

        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:2rem;color:var(--text-muted);">Carregant...</td></tr>';

        try {
            allReservations = await window.db.getReservations();

            if (!allReservations || allReservations.length === 0) {
                tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:2rem;color:var(--text-muted);">No hi ha reserves encara.</td></tr>';
                if (statsEl) statsEl.innerHTML = '';
                return;
            }

            // Stats
            const activeReservations = allReservations.filter(r => r.status !== 'cancelled');
            const totalUnits = activeReservations.reduce((a, r) => a + (r.quantity || 1), 0);
            const totalRevenue = activeReservations.filter(r => r.status === 'paid').reduce((a, r) => a + (r.amount_cents || 0), 0);
            const paidCount = allReservations.filter(r => r.status === 'paid').length;
            const pendingCount = allReservations.filter(r => r.status === 'pending' || r.status === 'pending_transfer').length;
            const cancelledCount = allReservations.filter(r => r.status === 'cancelled').length;

            const sizeCounts = {};
            activeReservations.forEach(r => {
                sizeCounts[r.size] = (sizeCounts[r.size] || 0) + (r.quantity || 1);
            });
            const topSize = Object.entries(sizeCounts).sort((a, b) => b[1] - a[1])[0];

            if (statsEl) {
                statsEl.innerHTML = [
                    { icon: 'users', val: allReservations.length, label: 'Reserves totals' },
                    { icon: 'package', val: totalUnits, label: 'Camisetes' },
                    { icon: 'check-circle', val: paidCount, label: 'Pagades' },
                    { icon: 'clock', val: pendingCount, label: 'Pendents' },
                    { icon: 'x-circle', val: cancelledCount, label: 'Cancel·lades' },
                    { icon: 'euro', val: (totalRevenue / 100).toFixed(2) + '€', label: 'Recaptat' },
                    { icon: 'tag', val: topSize ? topSize[0] : '-', label: 'Talla + venuda' },
                ].map(s => `
                    <div style="border:1px solid var(--border-color);border-radius:8px;padding:0.75rem 1rem;background:var(--bg-secondary);text-align:center;">
                        <div style="font-size:1.35rem;font-weight:800;font-family:var(--font-heading);">${s.val}</div>
                        <div style="font-size:0.68rem;text-transform:uppercase;color:var(--text-muted);margin-top:0.2rem;">${s.label}</div>
                    </div>
                `).join('');
            }

            // Table rows (No horizontal scroll needed)
            tbody.innerHTML = allReservations.map(r => {
                const isPaid = r.status === 'paid';
                const isCancelled = r.status === 'cancelled';

                let statusBadge = '';
                if (isPaid) {
                    statusBadge = '<span style="font-size:0.72rem;font-weight:700;padding:0.25rem 0.5rem;background:#dcfce7;color:#15803d;border-radius:6px;text-transform:uppercase;white-space:nowrap;display:inline-flex;align-items:center;gap:0.3rem;"><i data-lucide="check-circle-2" style="width:12px;height:12px;"></i> Pagat</span>';
                } else if (isCancelled) {
                    statusBadge = '<span style="font-size:0.72rem;font-weight:700;padding:0.25rem 0.5rem;background:#fee2e2;color:#b91c1c;border-radius:6px;text-transform:uppercase;white-space:nowrap;display:inline-flex;align-items:center;gap:0.3rem;"><i data-lucide="x-circle" style="width:12px;height:12px;"></i> Cancel·lada</span>';
                } else {
                    statusBadge = '<span style="font-size:0.72rem;font-weight:700;padding:0.25rem 0.5rem;background:#fef9c3;color:#854d0e;border-radius:6px;text-transform:uppercase;white-space:nowrap;display:inline-flex;align-items:center;gap:0.3rem;"><i data-lucide="clock" style="width:12px;height:12px;"></i> Pendent</span>';
                }

                const dateStr = r.created_at ? new Date(r.created_at).toLocaleDateString('ca-ES', { day:'2-digit', month:'2-digit', hour:'2-digit', minute:'2-digit' }) : '-';
                const amount = r.amount_cents ? (r.amount_cents / 100).toFixed(2) + '€' : '-';
                const escId = window.db.escapeHTML ? window.db.escapeHTML(String(r.id || '')) : String(r.id || '');
                const escName = window.db.escapeHTML ? window.db.escapeHTML(r.name + ' ' + r.surname) : (r.name + ' ' + r.surname);
                const escEmail = window.db.escapeHTML ? window.db.escapeHTML(r.email || '') : (r.email || '');
                const escSize = window.db.escapeHTML ? window.db.escapeHTML(r.size || '') : (r.size || '');

                let actionsHtml = '';
                if (isPaid) {
                    actionsHtml = `
                        <button class="btn btn-sm btn-secondary btn-toggle-status" data-id="${escId}" data-target="pending_transfer" style="padding:0.25rem 0.5rem;font-size:0.7rem;white-space:nowrap;" title="Tornar a pendent">
                            <i data-lucide="rotate-ccw" style="width:11px;height:11px;"></i> Pendent
                        </button>
                        <button class="btn btn-sm btn-secondary btn-toggle-status" data-id="${escId}" data-target="cancelled" style="padding:0.25rem 0.5rem;font-size:0.7rem;color:#ef4444;white-space:nowrap;" title="Cancel·lar reserva">
                            <i data-lucide="x" style="width:11px;height:11px;"></i> Cancel·lar
                        </button>
                    `;
                } else if (isCancelled) {
                    actionsHtml = `
                        <button class="btn btn-sm btn-secondary btn-toggle-status" data-id="${escId}" data-target="pending_transfer" style="padding:0.25rem 0.5rem;font-size:0.7rem;white-space:nowrap;" title="Reactivar reserva">
                            <i data-lucide="rotate-ccw" style="width:11px;height:11px;"></i> Reactivar
                        </button>
                    `;
                } else {
                    actionsHtml = `
                        <button class="btn btn-sm btn-toggle-status" data-id="${escId}" data-target="paid" style="padding:0.25rem 0.55rem;font-size:0.7rem;background:#15803d;color:#fff;border-color:#15803d;white-space:nowrap;" title="Validar transferència rebuda">
                            <i data-lucide="check" style="width:11px;height:11px;"></i> Validar
                        </button>
                        <button class="btn btn-sm btn-secondary btn-toggle-status" data-id="${escId}" data-target="cancelled" style="padding:0.25rem 0.5rem;font-size:0.7rem;color:#ef4444;white-space:nowrap;" title="Cancel·lar reserva">
                            <i data-lucide="x" style="width:11px;height:11px;"></i> Cancel·lar
                        </button>
                    `;
                }

                return `<tr style="${isCancelled ? 'opacity: 0.6; background: rgba(0,0,0,0.02);' : ''}">
                    <td style="padding:0.75rem 1rem;">
                        <div style="font-weight:700;font-size:0.9rem;line-height:1.2;">${escName}</div>
                        <div style="font-size:0.75rem;color:var(--text-secondary);margin-top:0.15rem;">${escEmail}</div>
                    </td>
                    <td style="text-align:center;padding:0.75rem 0.75rem;white-space:nowrap;">
                        <span style="font-weight:800;font-size:0.95rem;">${escSize}</span>
                        <span style="font-size:0.75rem;color:var(--text-secondary);"> × ${r.quantity || 1}</span>
                    </td>
                    <td style="font-weight:700;font-size:0.9rem;padding:0.75rem 0.75rem;white-space:nowrap;">${amount}</td>
                    <td style="padding:0.75rem 0.75rem;white-space:nowrap;">${statusBadge}</td>
                    <td style="font-size:0.75rem;color:var(--text-secondary);padding:0.75rem 0.75rem;white-space:nowrap;">${dateStr}</td>
                    <td style="white-space:nowrap;text-align:right;padding:0.75rem 1rem;">
                        <div style="display:inline-flex;gap:0.35rem;align-items:center;">
                            ${actionsHtml}
                            <button class="btn-action btn-action-delete btn-delete-reservation" data-id="${escId}" title="Eliminar del registre" style="width:26px;height:26px;display:inline-flex;align-items:center;justify-content:center;border:1px solid #ef4444;background:transparent;color:#ef4444;border-radius:6px;cursor:pointer;">
                                <i data-lucide="trash-2" style="width:12px;height:12px;"></i>
                            </button>
                        </div>
                    </td>
                </tr>`;
            }).join('');

            // Attach toggle status listeners
            tbody.querySelectorAll('.btn-toggle-status').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const id = btn.dataset.id;
                    const targetStatus = btn.dataset.target;
                    try {
                        await window.db.updateReservationStatus(id, targetStatus);
                        await loadReservationsTable();
                    } catch(e) {
                        alert('Error en actualitzar l\'estat: ' + e.message);
                    }
                });
            });

            // Attach delete listeners
            tbody.querySelectorAll('.btn-delete-reservation').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const id = btn.dataset.id;
                    if (!confirm('Segur que vols eliminar aquesta reserva?')) return;
                    try {
                        await window.db.deleteReservation(id);
                        await loadReservationsTable();
                    } catch(e) {
                        alert('Error en eliminar la reserva: ' + e.message);
                    }
                });
            });

            if (window.lucide) window.lucide.createIcons();
        } catch (err) {
            console.error('Error loading reservations:', err);
            tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:2rem;color:#ef4444;">Error: ${err.message}</td></tr>`;
        }
    }

    function downloadReservationsCSV() {
        if (!allReservations || allReservations.length === 0) {
            alert('No hi ha reserves per descarregar.');
            return;
        }
        const headers = ['Nom', 'Cognoms', 'Email', 'Talla', 'Quantitat', 'Import (€)', 'Estat', 'Data', 'Observacions'];
        const rows = allReservations.map(r => [
            `"${(r.name || '').replace(/"/g, '""')}"`,
            `"${(r.surname || '').replace(/"/g, '""')}"`,
            `"${(r.email || '').replace(/"/g, '""')}"`,
            `"${(r.size || '').replace(/"/g, '""')}"`,
            r.quantity || 1,
            r.amount_cents ? (r.amount_cents / 100).toFixed(2) : '0.00',
            `"${r.status === 'paid' ? 'Pagat' : 'Pendent Transferència'}"`,
            r.created_at ? new Date(r.created_at).toLocaleString('ca-ES') : '',
            `"${(r.notes || '').replace(/"/g, '""')}"`
        ]);
        const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
        const bom = '\uFEFF'; // UTF-8 BOM for Excel
        const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reserves-camisetes-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    // Attach tab-click to load data
    document.querySelectorAll('.admin-tab-btn').forEach(btn => {
        if (btn.dataset.tab === 'tab-camisetes') {
            btn.addEventListener('click', () => {
                setTimeout(loadReservationsTab, 100);
            });
        }
    });

    // Toggle reservations button
    const btnToggle = document.getElementById('btn-toggle-reservations');
    if (btnToggle) {
        btnToggle.addEventListener('click', async () => {
            reservationsOpen = !reservationsOpen;
            try {
                await window.db.saveShopConfig({ open: reservationsOpen, price_cents: 3500 });
                updateReservationsToggleUI();
            } catch(e) {
                alert('Error en canviar l\'estat de les reserves: ' + e.message);
                reservationsOpen = !reservationsOpen; // revert
                updateReservationsToggleUI();
            }
        });
    }

    // Download CSV button
    const btnDownloadCsv = document.getElementById('btn-download-reservations-csv');
    if (btnDownloadCsv) {
        btnDownloadCsv.addEventListener('click', downloadReservationsCSV);
    }

    // =============================================
    // PRODUCT CATALOG MANAGEMENT
    // =============================================
    async function loadProductsTable() {
        const tbody = document.getElementById('products-tbody');
        if (!tbody) return;

        tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--text-muted);">Carregant productes...</td></tr>';

        try {
            const products = await window.db.getProducts();

            if (!products || products.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--text-muted);">No hi ha productes al catàleg.</td></tr>';
                return;
            }

            tbody.innerHTML = products.map(p => {
                const imgUrl = (!p.image_url)
                    ? 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&q=80&w=400'
                    : (p.image_url.startsWith('http') || p.image_url.startsWith('data:image') || p.image_url.startsWith('/'))
                        ? p.image_url
                        : '../' + p.image_url;

                const escImgUrl = window.db.escapeHTML ? window.db.escapeHTML(imgUrl) : imgUrl;
                const escName = window.db.escapeHTML ? window.db.escapeHTML(p.name || '') : (p.name || '');
                const escCat = window.db.escapeHTML ? window.db.escapeHTML(p.category || '-') : (p.category || '-');
                const priceFormatted = (typeof p.price === 'number') ? p.price.toFixed(2) + ' €' : (p.price ? p.price + ' €' : '0.00 €');
                const escId = window.db.escapeHTML ? window.db.escapeHTML(String(p.id)) : String(p.id);

                let statusBadge = '';
                if (p.status === 'open') {
                    statusBadge = '<span style="font-size:0.7rem;font-weight:700;padding:0.2rem 0.4rem;background:#dcfce7;color:#15803d;border-radius:4px;text-transform:uppercase;">Reserves Obertes</span>';
                } else if (p.status === 'closed') {
                    statusBadge = '<span style="font-size:0.7rem;font-weight:700;padding:0.2rem 0.4rem;background:#fee2e2;color:#b91c1c;border-radius:4px;text-transform:uppercase;">Reserves Tancades</span>';
                } else if (p.status === 'sold_out') {
                    statusBadge = '<span style="font-size:0.7rem;font-weight:700;padding:0.2rem 0.4rem;background:#fef9c3;color:#854d0e;border-radius:4px;text-transform:uppercase;">Esgotat</span>';
                } else {
                    statusBadge = `<span style="font-size:0.7rem;font-weight:700;padding:0.2rem 0.4rem;background:#e2e8f0;color:#475569;border-radius:4px;text-transform:uppercase;">${window.db.escapeHTML ? window.db.escapeHTML(p.status || '') : (p.status || '')}</span>`;
                }

                return `<tr>
                    <td><img class="admin-table-img" src="${escImgUrl}" alt="${escName}"></td>
                    <td style="font-weight:600;">${escName}</td>
                    <td style="font-size:0.85rem;color:var(--text-secondary);">${escCat}</td>
                    <td style="font-weight:700;">${priceFormatted}</td>
                    <td>${statusBadge}</td>
                    <td>
                        <button class="btn btn-sm btn-edit-product" data-id="${escId}" style="padding: 0.35rem 0.6rem; margin-right: 0.5rem; background-color: var(--text-primary); color: var(--bg-primary); border-color: var(--text-primary);">
                            <i data-lucide="edit-3" style="width: 12px; height: 12px;"></i> Editar
                        </button>
                        <button class="btn btn-sm btn-danger btn-delete-product" data-id="${escId}" style="padding: 0.35rem 0.6rem;">
                            <i data-lucide="trash-2" style="width: 12px; height: 12px;"></i> Borrar
                        </button>
                    </td>
                </tr>`;
            }).join('');

            // Attach edit listeners
            tbody.querySelectorAll('.btn-edit-product').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const id = btn.getAttribute('data-id');
                    const productsList = await window.db.getProducts();
                    const prod = productsList.find(item => String(item.id) === id);
                    if (prod) {
                        document.getElementById('product-id').value = prod.id || '';
                        document.getElementById('product-name').value = prod.name || '';
                        document.getElementById('product-name-es').value = prod.name_es || '';
                        document.getElementById('product-slug').value = prod.slug || '';
                        document.getElementById('product-category').value = prod.category || '';
                        document.getElementById('product-category-es').value = prod.category_es || '';
                        document.getElementById('product-price').value = (prod.price !== undefined && prod.price !== null) ? prod.price : '';
                        document.getElementById('product-status').value = prod.status || 'open';
                        document.getElementById('product-image-url').value = prod.image_url || '';
                        document.getElementById('product-images').value = Array.isArray(prod.images) ? prod.images.join(', ') : (prod.images || '');
                        document.getElementById('product-description').value = prod.description || '';
                        document.getElementById('product-description-es').value = prod.description_es || '';

                        const fileMain = document.getElementById('product-file-main');
                        if (fileMain) fileMain.value = '';
                        const fileExtra = document.getElementById('product-files-extra');
                        if (fileExtra) fileExtra.value = '';

                        const preview = document.getElementById('product-preview-main');
                        if (preview) {
                            if (prod.image_url) {
                                preview.src = prod.image_url;
                                preview.style.display = 'block';
                            } else {
                                preview.style.display = 'none';
                            }
                        }

                        const titleEl = document.getElementById('product-modal-title');
                        if (titleEl) titleEl.textContent = 'Editar Producte';

                        const modal = document.getElementById('modal-product');
                        if (modal) modal.classList.add('active');
                        if (typeof openModal === 'function') openModal('modal-product');
                    }
                });
            });

            // Attach delete listeners
            tbody.querySelectorAll('.btn-delete-product').forEach(btn => {
                btn.addEventListener('click', async () => {
                    const id = btn.getAttribute('data-id');
                    if (confirm('Estàs segur que vols eliminar aquest producte del catàleg?')) {
                        try {
                            await window.db.deleteProduct(id);
                            await loadProductsTable();
                        } catch (e) {
                            alert('Error en eliminar el producte: ' + e.message);
                        }
                    }
                });
            });

            if (window.lucide) window.lucide.createIcons();

        } catch (err) {
            console.error('Error loading products table:', err);
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center;padding:2rem;color:#ef4444;">Error: ${err.message}</td></tr>`;
        }
    }

    const btnNewProduct = document.getElementById('btn-new-product');
    if (btnNewProduct) {
        btnNewProduct.addEventListener('click', () => {
            const form = document.getElementById('form-product');
            if (form) form.reset();
            const idInput = document.getElementById('product-id');
            if (idInput) idInput.value = '';
            const preview = document.getElementById('product-preview-main');
            if (preview) preview.style.display = 'none';
            const titleEl = document.getElementById('product-modal-title');
            if (titleEl) titleEl.textContent = 'Nou Producte';
            const modal = document.getElementById('modal-product');
            if (modal) modal.classList.add('active');
            if (typeof openModal === 'function') openModal('modal-product');
        });
    }

    // Live preview for main product image file input
    const fileMainInput = document.getElementById('product-file-main');
    if (fileMainInput) {
        fileMainInput.addEventListener('change', (e) => {
            const file = e.target.files && e.target.files[0];
            const preview = document.getElementById('product-preview-main');
            if (file && preview) {
                const reader = new FileReader();
                reader.onload = (ev) => {
                    preview.src = ev.target.result;
                    preview.style.display = 'block';
                };
                reader.readAsDataURL(file);
            }
        });
    }

    const formProduct = document.getElementById('form-product');
    if (formProduct) {
        formProduct.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btnSave = document.getElementById('btn-save-product');
            const originalBtnText = btnSave ? btnSave.innerHTML : 'Guardar Producte';
            try {
                if (btnSave) {
                    btnSave.disabled = true;
                    btnSave.innerHTML = '<span style="display:inline-block;animation:spin 1s linear infinite;">⟳</span> Guardant...';
                }

                const id = document.getElementById('product-id').value;
                const name = document.getElementById('product-name').value.trim();
                const name_es = document.getElementById('product-name-es').value.trim();
                const slug = document.getElementById('product-slug').value.trim();
                const category = document.getElementById('product-category').value.trim();
                const category_es = document.getElementById('product-category-es').value.trim();
                const price = parseFloat(document.getElementById('product-price').value) || 0;
                const status = document.getElementById('product-status').value;
                let image_url = document.getElementById('product-image-url').value.trim();
                const imagesRaw = document.getElementById('product-images').value.trim();
                let images = imagesRaw ? imagesRaw.split(',').map(s => s.trim()).filter(Boolean) : [];
                const description = document.getElementById('product-description').value.trim();
                const description_es = document.getElementById('product-description-es').value.trim();

                // 1. Upload main image file if selected
                const mainFileInput = document.getElementById('product-file-main');
                if (mainFileInput && mainFileInput.files && mainFileInput.files[0]) {
                    try {
                        image_url = await window.db.uploadImage(mainFileInput.files[0]);
                    } catch (uploadErr) {
                        console.warn("Could not upload main image to storage, using fallback:", uploadErr);
                    }
                }

                // 2. Upload extra gallery image files if selected
                const extraFilesInput = document.getElementById('product-files-extra');
                if (extraFilesInput && extraFilesInput.files && extraFilesInput.files.length > 0) {
                    for (let i = 0; i < extraFilesInput.files.length; i++) {
                        try {
                            const extraUrl = await window.db.uploadImage(extraFilesInput.files[i]);
                            if (extraUrl) images.push(extraUrl);
                        } catch (uploadErr) {
                            console.warn("Could not upload extra image:", uploadErr);
                        }
                    }
                }

                if (!image_url && images.length > 0) {
                    image_url = images[0];
                }

                const productData = {
                    name,
                    name_es,
                    slug,
                    category,
                    category_es,
                    price,
                    status,
                    image_url,
                    images,
                    description,
                    description_es
                };

                if (id) {
                    productData.id = id;
                }

                await window.db.saveProduct(productData);

                const modal = document.getElementById('modal-product');
                if (modal) modal.classList.remove('active');
                if (typeof closeModal === 'function') closeModal('modal-product');

                await loadProductsTable();

            } catch (err) {
                console.error("Error saving product:", err);
                alert("Error en desar el producte: " + (err.message || err));
            } finally {
                if (btnSave) {
                    btnSave.disabled = false;
                    btnSave.innerHTML = originalBtnText;
                }
            }
        });
    }

});

