// admin/gestio.js

document.addEventListener('DOMContentLoaded', () => {
    // Check initial user state
    setTimeout(async () => {
        await checkAuthState();
    }, 100);

    // Listen for news updates from full-screen editor tab
    window.addEventListener('message', (event) => {
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
            const parsed = JSON.parse(config);
            document.getElementById('config-url').value = parsed.url || '';
            document.getElementById('config-key').value = parsed.key || '';
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
            const targetPanel = document.getElementById(tab.getAttribute('data-tab'));
            if (targetPanel) targetPanel.classList.add('active');
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
            
            const status = item.status || 'published';
            const isDraft = status === 'draft';
            const badgeBg = isDraft ? '#e2e8f0' : '#dcfce7';
            const badgeTextColors = isDraft ? '#475569' : '#15803d';
            const badgeText = isDraft ? 'Esborrany' : 'Publicat';
            
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
                        <div>Pub: ${escCreatedAt}</div>
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
            return;
        }

        tbody.innerHTML = events.map(item => {
            const escDate = window.db.escapeHTML(item.date);
            const escTime = window.db.escapeHTML(item.time);
            const escTitle = window.db.escapeHTML(item.title);
            const escLoc = window.db.escapeHTML(item.location);
            const escId = window.db.escapeHTML(item.id);
            return `
                <tr>
                    <td style="font-weight: 600;">${escDate} <span style="font-weight: 300;">(${escTime})</span></td>
                    <td>${escTitle}</td>
                    <td>${escLoc}</td>
                    <td>
                        <div style="display: flex; gap: 0.25rem; flex-wrap: wrap;">
                            ${window.renderCategoryBadges(item.category, 'margin-top:0;')}
                        </div>
                    </td>
                    <td>
                        <button class="btn btn-sm btn-edit-event" data-id="${escId}" style="padding: 0.35rem 0.6rem; margin-right: 0.5rem; background-color: var(--text-primary); color: var(--bg-primary); border-color: var(--text-primary);">
                            <i data-lucide="edit-3" style="width: 12px; height: 12px;"></i> Editar
                        </button>
                        <button class="btn btn-sm btn-danger btn-delete-event" data-id="${escId}" style="padding: 0.35rem 0.75rem;">
                            <i data-lucide="trash-2" style="width: 12px; height: 12px;"></i> Borrar
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        tbody.querySelectorAll('.btn-edit-event').forEach(btn => {
            btn.addEventListener('click', () => {
                const id = btn.getAttribute('data-id');
                const item = events.find(e => e.id === id);
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
                    loadEventsTable();
                }
            });
        });

        if (window.lucide) window.lucide.createIcons();
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
            const url = document.getElementById('config-url').value.trim();
            const key = document.getElementById('config-key').value.trim();

            if (url && key) {
                const connected = window.db.setConfig(url, key);
                if (connected) {
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
                    
                    const countNews = data.news ? data.news.length : 0;
                    const countEvents = data.events ? data.events.length : 0;
                    const countPhotos = data.photos ? data.photos.length : 0;
                    
                    const confirmMsg = `Es restauraran:\n- ${countNews} notícies\n- ${countEvents} actes\n- ${countPhotos} fotos\n\nEstàs segur que vols continuar? Les dades existents es sobreescriuran/actualitzaran.`;
                    
                    if (confirm(confirmMsg)) {
                        const result = await window.db.importBackup(data);
                        if (result.success) {
                            alert("Còpia de seguretat importada correctament!");
                            checkAuthState(); // reload tables
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

});

