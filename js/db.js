// js/db.js

// CONFIGURACIÓ DE SUPABASE (PRODUCCIÓ)
// Introdueix la teva URL i Anon Key per connectar la base de dades a producció per a qualsevol ordinador:
const SUPABASE_URL = "https://wqelwzlnxhbhiedmxona.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_INr3m7b6-y55MSRt9c9-ew_paoZMPan";

// Mock Data representing real events/news of Comissió de Festes d'Ares
const MOCK_NEWS = [
    {
        id: "news-1",
        title: "Ja està disponible la Loteria de Nadal de la Comissió 2026!",
        subtitle: "Col·labora amb la comissió comprant participacions del número 48.293",
        content: "Com cada any, la Comissió de Festes d'Ares posa a la venda les participacions per al sorteig de Nadal. Enguany juguem el número 48.293. Pots adquirir els teus dècims a través de qualsevol membre de la comissió o en els comerços locals associats. No te quedes sense el teu número i col·labora amb les festes del nostre poble!",
        image_url: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=800",
        created_at: "2026-06-01",
        author: "Comissió de Festes",
        additional_images: []
    },
    {
        id: "news-2",
        title: "Èxit rotund en la celebració de Sant Antoni",
        subtitle: "Gran ambient i participació en els tradicionals actes d'hivern",
        content: "Volem agrair a tot el poble d'Ares i visitants la gran participació en els actes de Sant Antoni. Des de la tradicional arrossegada de troncs amb els cavalls fins a la foguera en la plaça i el posterior repartiment de coquetes. Les fotos de la jornada ja estan disponibles a la nostra galeria web. Gràcies a tots per fer-ho possible una vegada més!",
        image_url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=800",
        created_at: "2026-05-15",
        author: "Comissió de Festes",
        additional_images: []
    },
    {
        id: "news-3",
        title: "Es busquen voluntaris per a les Festes Patronals 2026",
        subtitle: "Inscriu-te per a col·laborar amb la preparació de les calderes i el muntatge de la plaça",
        content: "Queden pocs mesos per a les nostres festes grans d'agost i estem ultimant els detalls. Necesitem voluntaris per a la preparació de les calderes, el muntatge de la plaça de bous i la coordinació dels jocs infantils. Si vols ajudar a fer d'enguany unes festes inoblidables, apunta't en el formulari de contacte o parla amb nosaltres.",
        image_url: "https://images.unsplash.com/photo-1511578314322-379afb476865?auto=format&fit=crop&q=80&w=800",
        created_at: "2026-05-02",
        author: "Comissió de Festes",
        additional_images: []
    }
];

const MOCK_EVENTS = [
    {
        id: "event-1",
        title: "Chupinazo d'Inici de Festes i Cercavila",
        description: "Inici oficial de les festes de la joventut amb el tradicional chupinazo des del balcó de l'Ajuntament, seguit de cercavila pels carrers del poble acompanyats per la xaranga local.",
        date: "2026-08-14",
        time: "12:00",
        location: "Plaça Major d'Ares",
        category: "populars"
    },
    {
        id: "event-2",
        title: "Dinar Popular i Campionat de Truc",
        description: "Paella gegant per a tots els veïns i visitants en el poliesportiu municipal. En acabar el dinar, es realitzarà el sorteig i començarà el tradicional campionat de truc amb premis per als finalistes.",
        date: "2026-08-14",
        time: "14:00",
        location: "Poliesportiu Municipal",
        category: "menjars"
    },
    {
        id: "event-3",
        title: "Actuació de la Gran Orquestra 'Centauro'",
        description: "Gran vetlada musical a càrrec d'una de les millors orquestres de la Comunitat. En la mitja part hi haurà servei de barra i bingo organitzat per la comissió de festes.",
        date: "2026-08-14",
        time: "23:59",
        location: "Plaça de Bous",
        category: "musica"
    },
    {
        id: "event-4",
        title: "Parc Infantil i Jocs Tradicionals",
        description: "Matí ple de diversió per als més menuts amb inflables, tallers i jocs d'aigua a la plaça del poble.",
        date: "2026-08-15",
        time: "10:30",
        location: "Plaça de l'Església",
        category: "populars"
    },
    {
        id: "event-5",
        title: "Missa en honor a la Mare de Déu de l'Assumpció",
        description: "Solemnitat religiosa a l'Església Parroquial d'Ares amb la participació del cor local, seguida de processó de veneració pels carrers de costum.",
        date: "2026-08-15",
        time: "12:00",
        location: "Església Parroquial d'Ares",
        category: "cultura"
    },
    {
        id: "event-6",
        title: "Vesprada de Bous de la Ramaderia 'Armando Beltrán'",
        description: "Tradicional exhibició taurina amb vaquetes i bou de capllaç de la prestigiosa ramaderia local. Es prega màxima precaució i respecte als animals.",
        date: "2026-08-15",
        time: "17:30",
        location: "Carrers de la Vila",
        category: "populars"
    }
];

const MOCK_PHOTOS = [
    {
        id: "photo-1",
        title: "Parelles ballant el Ball Pla",
        image_url: "img/ballpla1.jpg",
        category: "Ball pla",
        created_at: "2026-06-04"
    },
    {
        id: "photo-2",
        title: "Jove ballador en atenció",
        image_url: "img/ballpla2.jpg",
        category: "Ball pla",
        created_at: "2026-06-04"
    },
    {
        id: "photo-3",
        title: "Roba i mantó tradicional",
        image_url: "img/ballpla3.jpg",
        category: "Ball pla",
        created_at: "2026-06-04"
    },
    {
        id: "photo-4",
        title: "Vista de la plaça durant el Ball Pla",
        image_url: "img/ballpla4.jpg",
        category: "Ball pla",
        created_at: "2026-06-04"
    },
    {
        id: "photo-5",
        title: "Detall del mantó de seda brodat",
        image_url: "img/ballpla5.jpg",
        category: "Ball pla",
        created_at: "2026-06-04"
    }
];

class AppDatabase {
    constructor() {
        this.supabase = null;
        this.config = null;
        this.dbName = 'AresLocalDB';
        this.dbVersion = 1;
        this.idb = null;
        this.dbPromise = this.initIDB();
        this.init();
    }

    initIDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);
            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains('news')) {
                    db.createObjectStore('news', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('events')) {
                    db.createObjectStore('events', { keyPath: 'id' });
                }
                if (!db.objectStoreNames.contains('photos')) {
                    db.createObjectStore('photos', { keyPath: 'id' });
                }
            };
            request.onsuccess = async (e) => {
                this.idb = e.target.result;
                await this.migrateFromLocalStorage();
                resolve();
            };
            request.onerror = (e) => {
                console.error("IndexedDB initialization error:", e.target.error);
                reject(e.target.error);
            };
        });
    }

    async migrateFromLocalStorage() {
        const migratedKey = 'ares_indexeddb_migrated_v1';
        if (localStorage.getItem(migratedKey)) return;

        console.log("Migrating database storage from localStorage to IndexedDB...");
        try {
            // Read from local storage (or default to mock data if empty)
            const localNews = JSON.parse(localStorage.getItem('ares_news') || '[]');
            const newsToMigrate = localNews.length > 0 ? localNews : MOCK_NEWS;

            const localEvents = JSON.parse(localStorage.getItem('ares_events') || '[]');
            const eventsToMigrate = localEvents.length > 0 ? localEvents : MOCK_EVENTS;

            const localPhotos = JSON.parse(localStorage.getItem('ares_photos') || '[]');
            const photosToMigrate = localPhotos.length > 0 ? localPhotos : MOCK_PHOTOS;

            // Save to IndexedDB
            for (const item of newsToMigrate) {
                await this.putIDB('news', item);
            }
            for (const item of eventsToMigrate) {
                await this.putIDB('events', item);
            }
            for (const item of photosToMigrate) {
                await this.putIDB('photos', item);
            }

            localStorage.setItem(migratedKey, 'true');
            console.log("Database migration successful!");
        } catch (err) {
            console.error("Database migration failed:", err);
        }
    }

    getIDB(storeName, id) {
        return new Promise((resolve, reject) => {
            if (!this.idb) return resolve(null);
            const tx = this.idb.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const req = store.get(id);
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }

    getAllIDB(storeName) {
        return new Promise((resolve, reject) => {
            if (!this.idb) return resolve([]);
            const tx = this.idb.transaction(storeName, 'readonly');
            const store = tx.objectStore(storeName);
            const req = store.getAll();
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => reject(req.error);
        });
    }

    putIDB(storeName, item) {
        return new Promise((resolve, reject) => {
            if (!this.idb) return resolve(item);
            const tx = this.idb.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const req = store.put(item);
            req.onsuccess = () => resolve(item);
            req.onerror = () => reject(req.error);
        });
    }

    deleteIDB(storeName, id) {
        return new Promise((resolve, reject) => {
            if (!this.idb) return resolve(true);
            const tx = this.idb.transaction(storeName, 'readwrite');
            const store = tx.objectStore(storeName);
            const req = store.delete(id);
            req.onsuccess = () => resolve(true);
            req.onerror = () => reject(req.error);
        });
    }

    init() {
        // 1. Check if we have Supabase configuration stored in localStorage (allows override)
        const storedConfig = localStorage.getItem('supabase_config');
        if (storedConfig) {
            try {
                this.config = JSON.parse(storedConfig);
                if (this.config.url && this.config.key && window.supabase) {
                    this.supabase = window.supabase.createClient(this.config.url, this.config.key);
                    console.log("Supabase client initialized successfully from localStorage.");
                    return;
                }
            } catch (e) {
                console.error("Error parsing stored Supabase config:", e);
            }
        }

        // 2. Fallback to hardcoded configuration in the code
        if (typeof SUPABASE_URL !== 'undefined' && typeof SUPABASE_ANON_KEY !== 'undefined' && SUPABASE_URL && SUPABASE_ANON_KEY) {
            try {
                if (window.supabase) {
                    this.supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
                    this.config = { url: SUPABASE_URL, key: SUPABASE_ANON_KEY };
                    console.log("Supabase client initialized successfully with hardcoded config.");
                }
            } catch (e) {
                console.error("Error initializing hardcoded Supabase config:", e);
            }
        }
    }

    isSupabaseConfigured() {
        const session = localStorage.getItem('ares_mock_session');
        if (session) {
            return false;
        }
        return this.supabase !== null;
    }

    // Set configuration dynamically (from the gestio dashboard)
    setConfig(url, key) {
        if (url && key) {
            const config = { url, key };
            localStorage.setItem('supabase_config', JSON.stringify(config));
            this.init();
            return true;
        } else {
            localStorage.removeItem('supabase_config');
            this.supabase = null;
            this.config = null;
            return false;
        }
    }

    // Get DB Status
    getStatus() {
        return this.isSupabaseConfigured() ? 'supabase' : 'local';
    }

    // News Actions
    async getNews() {
        if (this.isSupabaseConfigured()) {
            try {
                const { data, error } = await this.supabase
                    .from('news')
                    .select('*')
                    .order('created_at', { ascending: false });
                if (error) throw error;
                return data;
            } catch (err) {
                console.error("Error loading news from Supabase:", err);
                return await this.getLocalNews();
            }
        } else {
            return await this.getLocalNews();
        }
    }

    async getLocalNews() {
        await this.dbPromise;
        const news = await this.getAllIDB('news');
        return news.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    async addNews(item) {
        const newItem = {
            id: 'news-' + Date.now(),
            created_at: item.created_at || new Date().toISOString().split('T')[0],
            author: item.author || "Comissió de Festes",
            additional_images: item.additional_images || [],
            ...item
        };

        if (this.isSupabaseConfigured()) {
            try {
                const { data, error } = await this.supabase
                    .from('news')
                    .insert([newItem])
                    .select();
                if (error) throw error;
                return data[0];
            } catch (err) {
                console.error("Error adding news to Supabase:", err);
                return await this.addLocalNews(newItem);
            }
        } else {
            return await this.addLocalNews(newItem);
        }
    }

    async addLocalNews(item) {
        await this.dbPromise;
        await this.putIDB('news', item);
        return item;
    }

    async editNews(id, item) {
        const updatedItem = {
            id: id,
            updated_at: new Date().toISOString().split('T')[0],
            ...item
        };

        if (this.isSupabaseConfigured()) {
            try {
                const { data, error } = await this.supabase
                    .from('news')
                    .update(updatedItem)
                    .eq('id', id)
                    .select();
                if (error) throw error;
                return data[0];
            } catch (err) {
                console.error("Error editing news on Supabase:", err);
                return await this.editLocalNews(id, updatedItem);
            }
        } else {
            return await this.editLocalNews(id, updatedItem);
        }
    }

    async editLocalNews(id, item) {
        await this.dbPromise;
        const original = await this.getIDB('news', id);
        if (original) {
            const updated = {
                ...original,
                ...item,
                created_at: item.created_at || original.created_at
            };
            await this.putIDB('news', updated);
            return updated;
        }
        return null;
    }

    async deleteNews(id) {
        if (this.isSupabaseConfigured()) {
            try {
                const { error } = await this.supabase
                    .from('news')
                    .delete()
                    .eq('id', id);
                if (error) throw error;
                return true;
            } catch (err) {
                console.error("Error deleting news from Supabase:", err);
                return await this.deleteLocalNews(id);
            }
        } else {
            return await this.deleteLocalNews(id);
        }
    }

    async deleteLocalNews(id) {
        await this.dbPromise;
        await this.deleteIDB('news', id);
        return true;
    }

    // Category Colors Actions
    getCategoryColors() {
        const defaultColors = {
            musica: { bg: '#000000', text: '#ffffff' },
            cultura: { bg: '#27272a', text: '#ffffff' },
            menjars: { bg: '#71717a', text: '#ffffff' },
            populars: { bg: '#e4e4e7', text: '#18181b' }
        };
        const stored = localStorage.getItem('ares_category_colors');
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                console.error("Error parsing category colors:", e);
            }
        }
        return defaultColors;
    }

    saveCategoryColors(colors) {
        localStorage.setItem('ares_category_colors', JSON.stringify(colors));
        return true;
    }

    async addCategory(name) {
        const colors = this.getCategoryColors();
        const key = name.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
        if (!key) return null;
        if (colors[key]) return null;
        
        colors[key] = { bg: '#e4e4e7', text: '#18181b' };
        this.saveCategoryColors(colors);
        return key;
    }

    async deleteCategory(key) {
        const colors = this.getCategoryColors();
        if (colors[key]) {
            delete colors[key];
            this.saveCategoryColors(colors);
            return true;
        }
        return false;
    }

    // Events Actions
    async getEvents() {
        if (this.isSupabaseConfigured()) {
            try {
                const { data, error } = await this.supabase
                    .from('events')
                    .select('*')
                    .order('date', { ascending: true })
                    .order('time', { ascending: true });
                if (error) throw error;
                return data;
            } catch (err) {
                console.error("Error loading events from Supabase:", err);
                return await this.getLocalEvents();
            }
        } else {
            return await this.getLocalEvents();
        }
    }

    async getLocalEvents() {
        await this.dbPromise;
        const events = await this.getAllIDB('events');
        return events.sort((a, b) => {
            const dateDiff = new Date(a.date) - new Date(b.date);
            if (dateDiff !== 0) return dateDiff;
            return a.time.localeCompare(b.time);
        });
    }

    async addEvent(item) {
        const newItem = {
            id: 'event-' + Date.now(),
            ...item
        };

        if (this.isSupabaseConfigured()) {
            try {
                const { data, error } = await this.supabase
                    .from('events')
                    .insert([newItem])
                    .select();
                if (error) throw error;
                return data[0];
            } catch (err) {
                console.error("Error adding event to Supabase:", err);
                return await this.addLocalEvent(newItem);
            }
        } else {
            return await this.addLocalEvent(newItem);
        }
    }

    async addLocalEvent(item) {
        await this.dbPromise;
        await this.putIDB('events', item);
        return item;
    }

    async editEvent(id, item) {
        const updatedItem = {
            id: id,
            ...item
        };

        if (this.isSupabaseConfigured()) {
            try {
                const { data, error } = await this.supabase
                    .from('events')
                    .update(updatedItem)
                    .eq('id', id)
                    .select();
                if (error) throw error;
                return data[0];
            } catch (err) {
                console.error("Error editing event on Supabase:", err);
                return await this.editLocalEvent(id, updatedItem);
            }
        } else {
            return await this.editLocalEvent(id, updatedItem);
        }
    }

    async editLocalEvent(id, item) {
        await this.dbPromise;
        const original = await this.getIDB('events', id);
        if (original) {
            const updated = {
                ...original,
                ...item
            };
            await this.putIDB('events', updated);
            return updated;
        }
        return null;
    }

    async deleteEvent(id) {
        if (this.isSupabaseConfigured()) {
            try {
                const { error } = await this.supabase
                    .from('events')
                    .delete()
                    .eq('id', id);
                if (error) throw error;
                return true;
            } catch (err) {
                console.error("Error deleting event from Supabase:", err);
                return await this.deleteLocalEvent(id);
            }
        } else {
            return await this.deleteLocalEvent(id);
        }
    }

    async deleteLocalEvent(id) {
        await this.dbPromise;
        await this.deleteIDB('events', id);
        return true;
    }

    // Photos Actions
    async getPhotos() {
        if (this.isSupabaseConfigured()) {
            try {
                const { data, error } = await this.supabase
                    .from('photos')
                    .select('*')
                    .order('created_at', { ascending: false });
                if (error) throw error;
                return data;
            } catch (err) {
                console.error("Error loading photos from Supabase:", err);
                return await this.getLocalPhotos();
            }
        } else {
            return await this.getLocalPhotos();
        }
    }

    async getLocalPhotos() {
        await this.dbPromise;
        const photos = await this.getAllIDB('photos');
        return photos.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    }

    async addPhoto(item) {
        const newItem = {
            id: 'photo-' + Date.now(),
            created_at: new Date().toISOString().split('T')[0],
            ...item
        };

        if (this.isSupabaseConfigured()) {
            try {
                const { data, error } = await this.supabase
                    .from('photos')
                    .insert([newItem])
                    .select();
                if (error) throw error;
                return data[0];
            } catch (err) {
                console.error("Error adding photo to Supabase:", err);
                return await this.addLocalPhoto(newItem);
            }
        } else {
            return await this.addLocalPhoto(newItem);
        }
    }

    async addLocalPhoto(item) {
        await this.dbPromise;
        await this.putIDB('photos', item);
        return item;
    }

    async deletePhoto(id) {
        if (this.isSupabaseConfigured()) {
            try {
                const { error } = await this.supabase
                    .from('photos')
                    .delete()
                    .eq('id', id);
                if (error) throw error;
                return true;
            } catch (err) {
                console.error("Error deleting photo from Supabase:", err);
                return await this.deleteLocalPhoto(id);
            }
        } else {
            return await this.deleteLocalPhoto(id);
        }
    }

    async deleteLocalPhoto(id) {
        await this.dbPromise;
        await this.deleteIDB('photos', id);
        return true;
    }

    async login(email, password) {
        // Clear any previous mock session first
        localStorage.removeItem('ares_mock_session');

        // Allow entering Demo Mode using the mock password 'ares2026'
        if (password === 'ares2026') {
            const mockUser = { email: email || 'admin@ares.com', role: 'admin' };
            localStorage.setItem('ares_mock_session', JSON.stringify(mockUser));
            return { success: true, user: mockUser };
        }

        if (this.isSupabaseConfigured()) {
            try {
                const { data, error } = await this.supabase.auth.signInWithPassword({
                    email: email,
                    password: password
                });
                if (error) throw error;
                return { success: true, user: data.user };
            } catch (err) {
                console.error("Login failed on Supabase:", err);
                return { success: false, error: err.message };
            }
        } else {
            return { success: false, error: "Contrasenya incorrecta. Utilitza 'ares2026' en mode Demo." };
        }
    }

    async logout() {
        if (this.isSupabaseConfigured()) {
            await this.supabase.auth.signOut();
        }
        localStorage.removeItem('ares_mock_session');
        return true;
    }

    async getCurrentUser() {
        if (this.isSupabaseConfigured()) {
            try {
                const { data: { user } } = await this.supabase.auth.getUser();
                return user;
            } catch (e) {
                return null;
            }
        } else {
            const session = localStorage.getItem('ares_mock_session');
            return session ? JSON.parse(session) : null;
        }
    }

    async uploadImage(file) {
        // Compress image client-side first if it's an image file
        try {
            if (file.type && file.type.startsWith('image/')) {
                file = await this.compressImage(file);
            }
        } catch (e) {
            console.warn("Client-side image compression failed, using original file:", e);
        }

        if (this.isSupabaseConfigured()) {
            try {
                const fileExt = file.name.split('.').pop();
                const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
                
                const { data, error } = await this.supabase.storage
                    .from('photos')
                    .upload(fileName, file);
                
                if (error) throw error;
                
                const { data: { publicUrl } } = this.supabase.storage
                    .from('photos')
                    .getPublicUrl(fileName);
                
                return publicUrl;
            } catch (err) {
                console.error("Error uploading to Supabase Storage, falling back to Base64:", err);
                return this.readFileAsBase64(file);
            }
        } else {
            return this.readFileAsBase64(file);
        }
    }

    compressImage(file, maxWidth = 1000, maxHeight = 1000, quality = 0.7) {
        // Skip compression for GIFs, SVGs, WebPs, or files under 300KB
        if (
            file.type === 'image/gif' || 
            file.type === 'image/svg+xml' || 
            file.type === 'image/webp' || 
            file.size < 300 * 1024
        ) {
            console.log(`Skipping compression for ${file.name} (${file.type}, size: ${file.size} bytes)`);
            return Promise.resolve(file);
        }

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = event => {
                const img = new Image();
                img.src = event.target.result;
                img.onload = () => {
                    let width = img.width;
                    let height = img.height;
                    
                    if (width > height) {
                        if (width > maxWidth) {
                            height = Math.round((height * maxWidth) / width);
                            width = maxWidth;
                        }
                    } else {
                        if (height > maxHeight) {
                            width = Math.round((width * maxHeight) / height);
                            height = maxHeight;
                        }
                    }
                    
                    const canvas = document.createElement('canvas');
                    canvas.width = width;
                    canvas.height = height;
                    
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, width, height);
                    
                    const outputType = file.type === 'image/png' ? 'image/png' : 'image/jpeg';
                    
                    canvas.toBlob(
                        (blob) => {
                            if (blob) {
                                const compressedFile = new File([blob], file.name, {
                                    type: outputType,
                                    lastModified: Date.now()
                                });
                                resolve(compressedFile);
                            } else {
                                resolve(file);
                            }
                        },
                        outputType,
                        outputType === 'image/jpeg' ? quality : undefined
                    );
                };
                img.onerror = err => reject(err);
            };
            reader.onerror = err => reject(err);
        });
    }

    readFileAsBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = error => reject(error);
            reader.readAsDataURL(file);
        });
    }

    escapeHTML(str) {
        if (!str) return '';
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
    }

    sanitizeHTML(htmlString) {
        if (!htmlString) return '';
        
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlString, 'text/html');
        const body = doc.body;
        
        const allowedTags = ['b', 'strong', 'i', 'em', 'u', 'ul', 'ol', 'li', 'a', 'p', 'br', 'span', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'img'];
        const allowedAttributes = {
            'a': ['href', 'target', 'rel', 'title'],
            'img': ['src', 'alt', 'title', 'width', 'height']
        };

        const cleanNode = (node) => {
            if (node.nodeType === Node.TEXT_NODE) return;
            if (node.nodeType !== Node.ELEMENT_NODE) {
                node.parentNode.removeChild(node);
                return;
            }

            const tagName = node.tagName.toLowerCase();
            if (!allowedTags.includes(tagName)) {
                while (node.firstChild) {
                    node.parentNode.insertBefore(node.firstChild, node);
                }
                node.parentNode.removeChild(node);
                return;
            }

            const attrs = Array.from(node.attributes);
            for (const attr of attrs) {
                const name = attr.name.toLowerCase();
                const val = attr.value.trim().toLowerCase();

                if (name.startsWith('on')) {
                    node.removeAttribute(attr.name);
                    continue;
                }

                const allowedForTag = allowedAttributes[tagName] || [];
                if (!allowedForTag.includes(name)) {
                    node.removeAttribute(attr.name);
                    continue;
                }

                if ((name === 'href' || name === 'src') && (val.includes('javascript:') || val.includes('data:') || val.includes('vbscript:'))) {
                    node.removeAttribute(attr.name);
                }
            }

            const children = Array.from(node.childNodes);
            children.forEach(cleanNode);
        };

        const childNodes = Array.from(body.childNodes);
        childNodes.forEach(cleanNode);

        return body.innerHTML;
    }

    async exportLocalData() {
        await this.dbPromise;
        const news = await this.getAllIDB('news');
        const events = await this.getAllIDB('events');
        const photos = await this.getAllIDB('photos');
        const categoryColors = this.getCategoryColors();
        return { news, events, photos, categoryColors };
    }

    async importBackup(data) {
        if (!data) return { success: false, error: 'No s\'han proveït dades de còpia.' };
        
        // Import category colors if present
        if (data.categoryColors) {
            this.saveCategoryColors(data.categoryColors);
        }
        
        const errors = [];
        
        // Import news
        if (data.news && Array.isArray(data.news)) {
            for (const item of data.news) {
                if (this.isSupabaseConfigured()) {
                    try {
                        const { error } = await this.supabase
                            .from('news')
                            .upsert([item]);
                        if (error) throw error;
                    } catch (e) {
                        console.error("Error upserting news:", e);
                        errors.push(`Error notícies (${item.title}): ${e.message}`);
                    }
                }
                await this.putIDB('news', item);
            }
        }
        
        // Import events
        if (data.events && Array.isArray(data.events)) {
            for (const item of data.events) {
                if (this.isSupabaseConfigured()) {
                    try {
                        const { error } = await this.supabase
                            .from('events')
                            .upsert([item]);
                        if (error) throw error;
                    } catch (e) {
                        console.error("Error upserting event:", e);
                        errors.push(`Error actes (${item.title}): ${e.message}`);
                    }
                }
                await this.putIDB('events', item);
            }
        }
        
        // Import photos
        if (data.photos && Array.isArray(data.photos)) {
            for (const item of data.photos) {
                if (this.isSupabaseConfigured()) {
                    try {
                        const { error } = await this.supabase
                            .from('photos')
                            .upsert([item]);
                        if (error) throw error;
                    } catch (e) {
                        console.error("Error upserting photo:", e);
                        errors.push(`Error fotos (${item.title}): ${e.message}`);
                    }
                }
                await this.putIDB('photos', item);
            }
        }
        
        if (errors.length > 0) {
            return { success: false, errors };
        }
        return { success: true };
    }
}

// Instantiate globally
window.db = new AppDatabase();
