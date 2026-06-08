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
            showDashboard(user);
        } else {
            showLogin();
        }
    }

    function showLogin() {
        loginContainer.style.display = 'block';
        dashboardContainer.style.display = 'none';
    }

    function showDashboard(user) {
        loginContainer.style.display = 'none';
        dashboardContainer.style.display = 'block';
        userGreeting.textContent = `Hola, ${user.email.split('@')[0]}!`;
        
        // Update database connection status badge
        updateDbStatusBadge();
        
        // Load configurations into input fields if present
        loadDbConfigFields();

        // Load tables data
        loadNewsTable();
        loadEventsTable();
        loadPhotosTable();
        loadCategorySelects();
        loadCategoryColorsForm();
    }

    function updateDbStatusBadge() {
        const status = window.db.getStatus();
        dbStatusBadge.className = 'db-status-badge'; // reset
        if (status === 'supabase') {
            dbStatusBadge.classList.add('status-supabase');
            dbStatusBadge.textContent = 'Supabase Cloud';
        } else {
            dbStatusBadge.classList.add('status-local');
            dbStatusBadge.textContent = 'Mode Demo (Local)';
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
                showDashboard(result.user);
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
            return `
                <tr>
                    <td><img class="admin-table-img" src="${escImgUrl}" alt="Notícia"></td>
                    <td style="font-weight: 600;">${escTitle}</td>
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
            const catColors = colors[item.category] || { bg: '#e4e4e7', text: '#18181b' };
            const escDate = window.db.escapeHTML(item.date);
            const escTime = window.db.escapeHTML(item.time);
            const escTitle = window.db.escapeHTML(item.title);
            const escLoc = window.db.escapeHTML(item.location);
            const escCat = window.db.escapeHTML(item.category);
            const escId = window.db.escapeHTML(item.id);
            return `
                <tr>
                    <td style="font-weight: 600;">${escDate} <span style="font-weight: 300;">(${escTime})</span></td>
                    <td>${escTitle}</td>
                    <td>${escLoc}</td>
                    <td><span class="event-tag" style="margin-top:0; background-color: ${catColors.bg}; color: ${catColors.text};">${escCat}</span></td>
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
                    document.getElementById('event-category').value = item.category;
                    document.getElementById('event-description').value = item.description || '';
                    document.getElementById('event-long-description').value = item.long_description || '';
                    document.getElementById('event-image').value = item.image_url || '';
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
            if (newCategoryGroup) newCategoryGroup.style.display = 'none';
            modalPhoto.classList.add('active');
        });
    }

    // Bind event listeners for dropdown category assignment and category filter
    const selectCategory = document.getElementById('photo-category-select');
    const newCategoryGroup = document.getElementById('new-category-group');
    const inputNewCategory = document.getElementById('photo-category-new');
    
    if (selectCategory) {
        selectCategory.addEventListener('change', () => {
            if (selectCategory.value === '__new__') {
                if (newCategoryGroup) newCategoryGroup.style.display = 'block';
                if (inputNewCategory) {
                    inputNewCategory.required = true;
                    inputNewCategory.focus();
                }
            } else {
                if (newCategoryGroup) newCategoryGroup.style.display = 'none';
                if (inputNewCategory) inputNewCategory.required = false;
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
                const category = document.getElementById('event-category').value;
                const description = document.getElementById('event-description').value;
                const long_description = document.getElementById('event-long-description').value;
                
                const fileInput = document.getElementById('event-image-file');
                let image_url = document.getElementById('event-image').value.trim();

                if (fileInput && fileInput.files.length > 0) {
                    image_url = await window.db.uploadImage(fileInput.files[0]);
                }

                const eventData = { title, date, time, location, category, description, long_description, image_url };

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

                        await window.db.addPhoto({ title: photoTitle, image_url: fileUrl, category });
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
                    await window.db.addPhoto({ title: photoTitle, image_url, category });
                }
                
                modalPhoto.classList.remove('active');
                formPhoto.reset();
                if (newCategoryGroup) newCategoryGroup.style.display = 'none';
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
                    await window.db.deleteCategory(cat);
                    loadCategoryColorsForm();
                    loadCategorySelects();
                    loadEventsTable();
                }
            });
        });

        if (window.lucide) window.lucide.createIcons();
    }

    function loadCategorySelects() {
        const colors = window.db.getCategoryColors();
        const select = document.getElementById('event-category');
        if (select) {
            select.innerHTML = Object.keys(colors).map(cat => {
                const displayName = cat.charAt(0).toUpperCase() + cat.slice(1);
                const safeCat = window.db.escapeHTML(cat);
                const safeDisplayName = window.db.escapeHTML(displayName);
                return `<option value="${safeCat}">${safeDisplayName}</option>`;
            }).join('');
        }
    }

    const btnNewCategory = document.getElementById('btn-new-category');
    if (btnNewCategory) {
        btnNewCategory.addEventListener('click', async () => {
            const name = prompt("Introdueix el nom de la nova etiqueta (ej. taurins, jocs, etc.):");
            if (name) {
                const key = await window.db.addCategory(name);
                if (key) {
                    loadCategoryColorsForm();
                    loadCategorySelects();
                } else {
                    alert("Aquesta etiqueta ja existeix o el nom no és vàlid.");
                }
            }
        });
    }

    const formColors = document.getElementById('form-category-colors');
    if (formColors) {
        formColors.addEventListener('submit', (e) => {
            e.preventDefault();
            const colors = {};
            const cards = formColors.querySelectorAll('.category-card');
            cards.forEach(card => {
                const cat = card.getAttribute('data-cat');
                const bg = card.querySelector('.color-bg-input').value;
                const text = card.querySelector('.color-text-input').value;
                colors[cat] = { bg, text };
            });
            window.db.saveCategoryColors(colors);
            alert('Colors de categoria guardats correctament.');
            loadEventsTable();
        });
    }

    const btnResetColors = document.getElementById('btn-reset-colors');
    if (btnResetColors) {
        btnResetColors.addEventListener('click', () => {
            if (confirm('Vols restablir els colors per defecte de les categories?')) {
                localStorage.removeItem('ares_category_colors');
                loadCategoryColorsForm();
                loadCategorySelects();
                loadEventsTable();
            }
        });
    }

});
