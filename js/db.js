// js/db.js

// CONFIGURACIÓ DE SUPABASE
// Les credencials NO s'han d'escriure aquí directament.
// L'administrador les configura una vegada des del panell d'administració
// (apartat "Configuració") i es guarden de forma segura en localStorage.
// Per a l'entorn de CI/CD (GitHub Actions), es gestionen via GitHub Secrets.

// Mock Data representing real events/news of Comissió de Festes d'Ares
const MOCK_NEWS = [
    {
        id: "news-1781014774735",
        title: "Torna la Mostra de Productes de la Terra d'Ares del Maestrat: una cita amb l'artesania i els sabors del Maestrat",
        title_es: "Vuelve la Muestra de Productos de la Tierra de Ares del Maestrat: una cita con la artesanía y los sabores del Maestrat",
        subtitle: "Després d'anys d'absència, la Comissió de Festes ha anunciat oficialment la tornada d'un dels esdeveniments més estimats i arrelats del municipi: la VII Mostra de Productes de la Terra d'Ares del Maestrat.",
        subtitle_es: "Tras años de ausencia, la Comisión de Fiestas ha anunciado oficialmente el regreso de uno de los eventos más queridos y arraigados en el municipio: la VII Muestra de Productos de la Tierra de Ares del Maestrat.",
        content: "Després d'anys d'absència, la Comissió de Festes ha anunciat oficialment la tornada d'un dels esdeveniments més estimats i arrelats del municipi: la VII Mostra de Productes de la Terra d'Ares del Maestrat. La mostra comptarà amb parades de formatges, mel, carns i embotits, a mmés d'artesania tradicional i tallers en directe per a tota la família.",
        content_es: "Tras años de ausencia, la Comisión de Fiestas ha anunciado oficialmente el regreso de uno de los eventos más queridos y arraigados en el municipio: la VII Muestra de Productos de la Tierra de Ares del Maestrat. La muestra contará con puestos de quesos, miel, carnes y embutidos, además de artesanía tradicional y talleres en directo para toda la familia.",
        image_url: "https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=800",
        created_at: "2026-06-09",
        author: "Comissió de Festes",
        slug: "mostra-productes-de-la-terra-ares-del-maestrat",
        slug_es: "mostra-productes-de-la-terra-ares",
        additional_images: []
    },
    {
        id: "news-1780944142960",
        title: "On vore l'eclipsi solar 2026 a Castelló? Programació a Ares del Maestrat",
        title_es: "¿Dónde ver el eclipse solar de 2026 en Castellón? Programación en Ares del Maestrat",
        subtitle: "El pròxim 12 d'agost de 2026, el nostre poble serà un dels punts privilegiats del món per a observar l'eclipsi solar total. L'Ajuntament d'Ares i la Comissió de Festes hem unit esforços per a dissenyar una programació especial que permeta a veïns i visitants gaudir d'aquest fenomen d'una manera segura i inoblidable.",
        subtitle_es: "El 12 de agosto de 2026, nuestro pueblo será uno de los lugares privilegiados del mundo para observar el eclipse solar total. El Ayuntamiento de Ares y el Comité de Fiestas han unido fuerzas para diseñar un programa especial que permita a vecinos y visitantes disfrutar de este fenómeno de una manera segura e inolvidable.",
        content: "El pròxim 12 d'agost de 2026, el nostre poble serà un dels punts privilegiats del món per a observar l'eclipsi solar total. L'Ajuntament d'Ares i la Comissió de Festes hem unit esforços per a dissenyar una programació especial que permeta a veïns i visitants gaudir d'aquest fenomen d'una manera segura i inoblidable. Hi haurà xarrades d'astrònoms, punts d'observació amb telescopis homologats i ulleres de protecció gratuïtes per a tots els assistents.",
        content_es: "El 12 de agosto de 2026, nuestro pueblo será uno de los lugares privilegiados del mundo para observar el eclipse solar total. El Ayuntamiento de Ares y el Comité de Fiestas han unido fuerzas para diseñar un programa especial que permita a vecinos y visitantes disfrutar de este fenómeno de una manera segura e inolvidable. Habrá charlas de astrónomos, puntos de observación con telescopios homologados y gafas de protección gratuitas para todos los asistentes.",
        image_url: "https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&q=80&w=800",
        created_at: "2026-06-08",
        author: "Comissió de Festes",
        slug: "eclipsi-solar-2026-castello-ares-del-maestrat",
        slug_es: "donde-ver-eclipse-solar-castellon",
        additional_images: []
    },
    {
        id: "news-1780998724193",
        title: "Ares del Maestrat convoca el II Concurs de Relat Breu «Terme d’Ares» per a dinamitzar la cultura local",
        title_es: "Ares del Maestrat convoca el II Concurso de Cuentos \"Terme d 'Ares\" para dinamizar la cultura local",
        subtitle: "La Comissió de Festes llança la segona edició d'aquest certamen literari en valencià, on les històries participants hauran d'estar ambientades al municipi.",
        subtitle_es: "La Comisión de Fiestas pone en marcha la segunda edición de este certamen literario en valenciano, donde los cuentos participantes deben ambientarse en el municipio.",
        content: "La Comissió de Festes llança la segona edició d'aquest certamen literari en valencià, on les històries participants hauran d'estar ambientades al municipi. Les bases del concurs inclouen un primer premi en metàl·lic i la publicació de les obres seleccionades. Consulta tota la informació en el web de l'Ajuntament.",
        content_es: "La Comisión de Fiestas pone en marcha la segunda edición de este certamen literario en valenciano, donde los cuentos participantes deben ambientarse en el municipio. Las bases del concurso incluyen un primer premio en metálico y la publicación de las obras seleccionadas. Consulta toda la información en la web del Ayuntamiento.",
        image_url: "https://wqelwzlnxhbhiedmxona.supabase.co/functions/v1/share?image-for-slug=concurs-relat-breu-terme-dares",
        created_at: "2026-06-02",
        author: "Comissió de Festes",
        slug: "concurs-relat-breu-terme-dares",
        slug_es: "concurso-relatos-breves-terme-dares",
        additional_images: []
    },
    {
        id: "news-1780997853233",
        title: "Ares del Maestrat busca el millor disseny per a les seues Festes de 2026 amb l’eclipsi com a protagonista",
        title_es: "Ares del Maestrat busca el mejor diseño para sus Fiestas de 2026 con el eclipse como protagonista",
        subtitle: "La Comissió de Festes convoca la 4a edició d’aquest concurs obert a professionals i aficionats.",
        subtitle_es: "La Comisión de Fiestas convoca la 4ª edición de este certamen abierto a profesionales y aficionados.",
        content: "La Comissió de Festes convoca la 4a edició d’aquest concurs obert a professionals i aficionats. Els participants podran enviar els seus dissenys inspirats en el proper eclipsi solar i en la riquesa cultural d'Ares del Maestrat. El cartell guanyador serà la imatge oficial de la programació d'actes.",
        content_es: "La Comisión de Fiestas convoca la 4ª edición de este certamen abierto a profesionales y aficionados. Los participantes podrán enviar sus diseños inspirados en el próximo eclipse solar y en la riqueza cultural de Ares del Maestrat. El cartel ganador será la imagen oficial de la programación de actos.",
        image_url: "https://images.unsplash.com/photo-1475721027785-f74eccf877e2?auto=format&fit=crop&q=80&w=800",
        created_at: "2026-06-01",
        author: "Comissió de Festes",
        slug: "concurs-disseny-festes-ares-2026",
        slug_es: "concurso-diseno-fiestas-ares-2026",
        additional_images: []
    },
    {
        id: "news-1781010770325",
        title: "Què vore a Ares del Maestrat: un viatge al cor de l'Alt Maestrat",
        title_es: "Qué ver en Ares del Maestrat: un viaje al corazón del Alt Maestrat",
        subtitle: "Si estàs buscant una escapada que combine història, paisatges impressionants i un patrimoni cultural únic, Ares del Maestrat és la teua destinació ideal. Situat a la província de Castelló, este poble s'alça majestuós sobre un turó de roca a més de 1.100 metres d'altitud, oferint una de les estampes meés boniques de l'interior del País Valencià..",
        subtitle_es: "Si buscas una escapada que combine historia, paisajes impresionantes y un patrimonio cultural único, Ares del Maestrat es tu destino ideal. Situado en la provincia de Castellón, este pueblo se alza majestuoso sobre una colina rocosa a más de 1.100 metros sobre el nivel del mar, ofreciendo una de las vistas más bellas del interior del País Valenciano.",
        content: "Passejar pel centre històric d'Ares del Maestrat és com fer un viatge en el temps. Els seus carrers empedrats i escarpats conserven l'essència de l'època medieval i et conviden a descobrir racons amb encant.",
        content_es: "Pasear por el centro histórico de Ares del Maestrat es como hacer un viaje en el tiempo. Sus calles empedradas y escarpadas conservan la esencia de la época medieval y te invitan a descubrir rincones con encanto.",
        image_url: "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&q=80&w=800",
        created_at: "2026-05-22",
        author: "Comissió de Festes",
        slug: "que-vore-a-ares-del-maestrat",
        slug_es: "que-ver-en-ares-del-maestrat",
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
        const migratedKey = 'ares_indexeddb_migrated_v3';
        if (localStorage.getItem(migratedKey)) return;

        console.log("Migrating database storage from localStorage to IndexedDB...");
        try {
            // Read from local storage and filter out old mock data
            const localNews = (JSON.parse(localStorage.getItem('ares_news') || '[]'))
                .filter(item => item && item.id !== 'news-1' && item.id !== 'news-2' && item.id !== 'news-3');
            const newsToMigrate = localNews.length > 0 ? localNews : MOCK_NEWS;

            const localEvents = (JSON.parse(localStorage.getItem('ares_events') || '[]'))
                .filter(item => item && !['event-1', 'event-2', 'event-3', 'event-4', 'event-5', 'event-6'].includes(item.id));
            const eventsToMigrate = localEvents.length > 0 ? localEvents : MOCK_EVENTS;

            const localPhotos = (JSON.parse(localStorage.getItem('ares_photos') || '[]'))
                .filter(item => item && !['photo-1', 'photo-2', 'photo-3', 'photo-4', 'photo-5'].includes(item.id));
            const photosToMigrate = localPhotos.length > 0 ? localPhotos : MOCK_PHOTOS;

            // Clear IndexedDB stores to prevent old mock data duplicates
            await new Promise((resolve) => {
                const tx = this.idb.transaction(['news', 'events', 'photos'], 'readwrite');
                tx.objectStore('news').clear();
                tx.objectStore('events').clear();
                tx.objectStore('photos').clear();
                tx.oncomplete = () => resolve();
            });

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
        let storedConfig = localStorage.getItem('supabase_config');
        if (storedConfig) {
            try {
                this.config = JSON.parse(storedConfig);
                if (this.config.url && this.config.key) {
                    let url = this.config.url.trim();
                    const dashboardRegex = /supabase\.com\/dashboard\/project\/([a-z0-9]+)/i;
                    const match = url.match(dashboardRegex);
                    if (match && match[1]) {
                        url = `https://${match[1]}.supabase.co`;
                    } else if (/^[a-z0-9]{20}$/i.test(url)) {
                        url = `https://${url}.supabase.co`;
                    } else if (!/^https?:\/\//i.test(url)) {
                        url = `https://${url}`;
                    }
                    const newUrl = url.replace(/\/+$/, "");
                    if (newUrl !== this.config.url) {
                        this.config.url = newUrl;
                        localStorage.setItem('supabase_config', JSON.stringify(this.config));
                    }

                    if (window.supabase) {
                        this.supabase = window.supabase.createClient(newUrl, this.config.key);
                        console.log("Supabase client initialized successfully from localStorage (normalized).");
                        return;
                    }
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
            let normalizedUrl = url.trim();
            const dashboardRegex = /supabase\.com\/dashboard\/project\/([a-z0-9]+)/i;
            const match = normalizedUrl.match(dashboardRegex);
            if (match && match[1]) {
                normalizedUrl = `https://${match[1]}.supabase.co`;
            } else if (/^[a-z0-9]{20}$/i.test(normalizedUrl)) {
                normalizedUrl = `https://${normalizedUrl}.supabase.co`;
            } else if (!/^https?:\/\//i.test(normalizedUrl)) {
                normalizedUrl = `https://${normalizedUrl}`;
            }
            normalizedUrl = normalizedUrl.replace(/\/+$/, "");

            const config = { url: normalizedUrl, key: key.trim() };
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
        const isAdmin = window.location.pathname.includes('/admin/');
        if (this.isSupabaseConfigured() && isAdmin) {
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
            // Public or Local Mode - fetch static JSON file first
            try {
                const cacheBuster = Math.floor(Date.now() / 300000); // 5 min cache
                const dataUrl = `/data/news.json?v=${cacheBuster}`;
                const res = await fetch(dataUrl);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                return data;
            } catch (err) {
                console.warn("Error loading static news, falling back:", err);
                if (this.isSupabaseConfigured()) {
                    try {
                        const { data, error } = await this.supabase
                            .from('news')
                            .select('*')
                            .order('created_at', { ascending: false });
                        if (error) throw error;
                        return data;
                    } catch (e) {
                        return await this.getLocalNews();
                    }
                } else {
                    return await this.getLocalNews();
                }
            }
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

    async saveCategoryColors(colors) {
        localStorage.setItem('ares_category_colors', JSON.stringify(colors));
        
        const configItem = {
            id: 'event-config-category-colors',
            title: 'Category Colors Config',
            title_es: 'Category Colors Config',
            description: 'System Configuration - Do not delete',
            description_es: 'Configuración del Sistema - No borrar',
            long_description: JSON.stringify(colors),
            long_description_es: JSON.stringify(colors),
            date: '2099-12-31',
            time: '00:00',
            location: 'System Config',
            location_es: 'System Config',
            category: 'populars',
            image_url: ''
        };

        if (this.isSupabaseConfigured()) {
            try {
                const { error } = await this.supabase
                    .from('events')
                    .upsert([configItem]);
                if (error) throw error;
            } catch (err) {
                console.error("Error saving category colors to Supabase:", err);
                await this.putIDB('events', configItem);
                throw err;
            }
        } else {
            await this.putIDB('events', configItem);
        }
        return true;
    }

    async addCategory(name) {
        const colors = this.getCategoryColors();
        const key = name.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
        if (!key) return null;
        if (colors[key]) return null;
        
        colors[key] = { bg: '#e4e4e7', text: '#18181b' };
        await this.saveCategoryColors(colors);
        return key;
    }

    async deleteCategory(key) {
        const colors = this.getCategoryColors();
        if (colors[key]) {
            delete colors[key];
            await this.saveCategoryColors(colors);
            return true;
        }
        return false;
    }

    // FAQs Management Actions
    async getFAQs() {
        const defaultFAQs = [
            {
                id: "faq-1",
                question: "Quan se celebren les Festes d'Ares del Maestrat 2026?",
                question_es: "¿Cuándo se celebran las Fiestas de Ares del Maestrat 2026?",
                answer: "Les Festes Patronals d'Ares del Maestrat en honor a Sant Bartomeu i Santa Elena són les festes més importants del municipi. Se celebren tots els anys a l'agost i culminen el dia 25 amb el tradicional Ball Pla d'Ares. Enguany 2026, les Festes Patronals tindran lloc del 16 al 25 d'agost, oferint activitats per a tots els públics al Maestrat.",
                answer_es: "Las Fiestas Patronales de Ares del Maestrat en honor a San Bartolomé y Santa Elena son las celebraciones más importantes del municipio. Se celebran todos los años en agosto y culminan el día 25 con el tradicional Ball Pla de Ares. Este año 2026, las Fiestas Patronales tendrán lugar del 16 al 25 de agosto, ofreciendo actividades para todos los públicos en el Maestrat."
            },
            {
                id: "faq-2",
                question: "Qui organitza les festes patronals d'Ares del Maestrat?",
                question_es: "¿Quién organiza las fiestas patronales de Ares del Maestrat?",
                answer: "La Comissió de Festes d'Ares, en coordinació amb l'Ajuntament d'Ares del Maestrat, s'encarrega d'organitzar la majoria d'activitats del programa de festes d'agost. Així mateix, altres entitats locals com la Penya Taurina, els Quintos i Quintes, i l'associació de les Dones d'Ares col·laboren activament en la dinamització i organització dels actes.",
                answer_es: "La Comisión de Fiestas de Ares, en coordinación con el Ayuntamiento de Ares del Maestrat, se encarga de organizar la mayoría de actividades del programa de fiestas de agosto. Asimismo, otras entidades locales como la Peña Taurina, los Quintos y Quintas, y la asociación de las Mujeres de Ares colaboran activamente en la dinamización y organización de los actos."
            },
            {
                id: "faq-3",
                question: "Com arribar a Ares del Maestrat?",
                question_es: "¿Cómo llegar a Ares del Maestrat?",
                answer: "Ares del Maestrat es troba a uns 70 km de Castelló de la Plana, a la comarca de l'Alt Maestrat (Castelló). La ruta més habitual i recomanada per arribar-hi és conduir per la carretera CV-15 fins a coronar el Coll d'Ares, i des d'allí agafar la CV-116 que condueix directament al poble.",
                answer_es: "Ares del Maestrat se encuentra a unos 70 km de Castellón de la Plana, en la comarca del Alt Maestrat (Castellón). La ruta más habitual y recomendada para llegar es conducir por la carretera CV-15 hasta coronar el Coll d'Ares, y desde allí tomar la CV-116 que conduce directamente al pueblo."
            },
            {
                id: "faq-4",
                question: "Els actes de les Festes d'Ares del Maestrat són gratuïts?",
                question_es: "¿Los actos de las Fiestas de Ares del Maestrat son gratuitos?",
                answer: "Sí, la gran majoria d'actes culturals, musicals i taurins inclosos en el programa oficial de les festes d'Ares són d'accés lliure i completament gratuït per a veïns i visitants.",
                answer_es: "Sí, la mayoría de actos culturales, musicales y taurinos incluidos en el programa oficial de las fiestas de Ares son de acceso libre y completamente gratuito para vecinos y visitantes."
            }
        ];

        // 1. Try to read from local cache first
        const stored = localStorage.getItem('ares_faqs');
        if (stored) {
            try {
                return JSON.parse(stored);
            } catch (e) {
                console.error("Error parsing FAQs cache:", e);
            }
        }

        // 2. Fetch from static data or DB
        const isAdmin = window.location.pathname.includes('/admin/');
        if (this.isSupabaseConfigured() && isAdmin) {
            try {
                const { data, error } = await this.supabase
                    .from('events')
                    .select('*')
                    .eq('id', 'event-config-faqs')
                    .single();
                if (data && data.long_description) {
                    const faqs = JSON.parse(data.long_description);
                    localStorage.setItem('ares_faqs', JSON.stringify(faqs));
                    return faqs;
                }
            } catch (err) {
                console.warn("Could not load FAQs from Supabase, using local state/cache:", err);
            }
        } else {
            // Try fetching static events.json
            try {
                const cacheBuster = Math.floor(Date.now() / 300000); // 5 min cache
                const dataUrl = `/data/events.json?v=${cacheBuster}`;
                const res = await fetch(dataUrl);
                if (res.ok) {
                    const events = await res.json();
                    const faqConfigEvent = events.find(e => e.id === 'event-config-faqs');
                    if (faqConfigEvent && faqConfigEvent.long_description) {
                        const faqs = JSON.parse(faqConfigEvent.long_description);
                        localStorage.setItem('ares_faqs', JSON.stringify(faqs));
                        return faqs;
                    }
                }
            } catch (err) {
                console.warn("Could not load FAQs from static config:", err);
            }
        }

        // Local mode fallback / IndexedDB
        try {
            const configRow = await this.getIDB('events', 'event-config-faqs');
            if (configRow && configRow.long_description) {
                const faqs = JSON.parse(configRow.long_description);
                localStorage.setItem('ares_faqs', JSON.stringify(faqs));
                return faqs;
            }
        } catch (err) {
            console.warn("Could not load FAQs from IDB:", err);
        }

        return defaultFAQs;
    }

    async saveFAQs(faqs) {
        localStorage.setItem('ares_faqs', JSON.stringify(faqs));

        const configItem = {
            id: 'event-config-faqs',
            title: 'FAQs Configuration',
            title_es: 'FAQs Configuration',
            description: 'System Configuration - Do not delete',
            description_es: 'Configuración del Sistema - No borrar',
            long_description: JSON.stringify(faqs),
            long_description_es: JSON.stringify(faqs),
            date: '2099-12-31',
            time: '00:00',
            location: 'System Config',
            location_es: 'System Config',
            category: 'populars',
            image_url: ''
        };

        if (this.isSupabaseConfigured()) {
            try {
                const { error } = await this.supabase
                    .from('events')
                    .upsert([configItem]);
                if (error) throw error;
            } catch (err) {
                console.error("Error saving FAQs to Supabase:", err);
                await this.putIDB('events', configItem);
                throw err;
            }
        } else {
            await this.putIDB('events', configItem);
        }
        return true;
    }

    // Events Actions
    async getEvents() {
        let events = [];
        const isAdmin = window.location.pathname.includes('/admin/');
        if (this.isSupabaseConfigured() && isAdmin) {
            try {
                const { data, error } = await this.supabase
                    .from('events')
                    .select('*')
                    .order('date', { ascending: true })
                    .order('time', { ascending: true });
                if (error) throw error;
                events = data;
            } catch (err) {
                console.error("Error loading events from Supabase:", err);
                events = await this.getLocalEvents();
            }
        } else {
            // Public or Local Mode - fetch static JSON file first
            try {
                const cacheBuster = Math.floor(Date.now() / 300000); // 5 min cache
                const dataUrl = `/data/events.json?v=${cacheBuster}`;
                const res = await fetch(dataUrl);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                events = await res.json();
            } catch (err) {
                console.warn("Error loading static events, falling back:", err);
                if (this.isSupabaseConfigured()) {
                    try {
                        const { data, error } = await this.supabase
                            .from('events')
                            .select('*')
                            .order('date', { ascending: true })
                            .order('time', { ascending: true });
                        if (error) throw error;
                        events = data;
                    } catch (e) {
                        events = await this.getLocalEvents();
                    }
                } else {
                    events = await this.getLocalEvents();
                }
            }
        }

        // Process config record if present
        const configEvent = events.find(e => e.id === 'event-config-category-colors');
        if (configEvent) {
            try {
                const colors = JSON.parse(configEvent.long_description);
                localStorage.setItem('ares_category_colors', JSON.stringify(colors));
            } catch (e) {
                console.error("Error parsing category colors from Supabase config event:", e);
            }
        }

        // Process FAQ config record if present
        const faqConfigEvent = events.find(e => e.id === 'event-config-faqs');
        if (faqConfigEvent) {
            try {
                const faqs = JSON.parse(faqConfigEvent.long_description);
                localStorage.setItem('ares_faqs', JSON.stringify(faqs));
            } catch (e) {
                console.error("Error parsing FAQs from Supabase config event:", e);
            }
        }

        // Filter out config records from returned list
        return events.filter(e => e.id !== 'event-config-category-colors' && e.id !== 'event-config-faqs');
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
        const isAdmin = window.location.pathname.includes('/admin/');
        if (this.isSupabaseConfigured() && isAdmin) {
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
            // Public or Local Mode - fetch static JSON file first
            try {
                const cacheBuster = Math.floor(Date.now() / 300000); // 5 min cache
                const dataUrl = `/data/photos.json?v=${cacheBuster}`;
                const res = await fetch(dataUrl);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                return data;
            } catch (err) {
                console.warn("Error loading static photos, falling back:", err);
                if (this.isSupabaseConfigured()) {
                    try {
                        const { data, error } = await this.supabase
                            .from('photos')
                            .select('*')
                            .order('created_at', { ascending: false });
                        if (error) throw error;
                        return data;
                    } catch (e) {
                        return await this.getLocalPhotos();
                    }
                } else {
                    return await this.getLocalPhotos();
                }
            }
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
        // Netejar qualsevol sessió anterior
        localStorage.removeItem('ares_mock_session');

        // L'única autenticació vàlida és Supabase Auth.
        // No hi ha contrasenyes hardcodeades ni mode demo.
        if (!this.isSupabaseConfigured()) {
            return {
                success: false,
                error: "El panell d'administració requereix connexió a Supabase. Configura les credencials primer."
            };
        }

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
        }
        // Sense Supabase configurat, no hi ha sessió vàlida possible.
        return null;
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
                    .upload(fileName, file, {
                        cacheControl: '31536000',
                        upsert: false
                    });
                
                if (error) throw error;
                
                const { data: { publicUrl } } = this.supabase.storage
                    .from('photos')
                    .getPublicUrl(fileName);
                
                return publicUrl;
            } catch (err) {
                console.error("Error uploading to Supabase Storage:", err);
                throw new Error(err.message || (err.error && err.error.message) || JSON.stringify(err));
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

                // F8: No permetre 'style' ni 'class' per prevenir CSS Injection
                if (name === 'style' || name === 'class') {
                    node.removeAttribute(attr.name);
                    continue;
                }

                const allowedForTag = allowedAttributes[tagName] || [];
                if (!allowedForTag.includes(name)) {
                    node.removeAttribute(attr.name);
                    continue;
                }

                if ((name === 'href' || name === 'src') && (val.includes('javascript:') || (val.includes('data:') && !val.startsWith('data:image/')) || val.includes('vbscript:'))) {
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
            await this.saveCategoryColors(data.categoryColors);
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

// Category translator for events and gallery
window.getCategoryName = function(category) {
    if (!category) return '';
    const isEs = window.location.pathname.includes('/es/');
    const catLower = category.toLowerCase().trim();
    
    const translations = {
        ca: {
            'musica': 'Música',
            'cultura': 'Cultura',
            'menjars': 'Menjars',
            'populars': 'Populars',
            'ball pla': 'Ball pla'
        },
        es: {
            'musica': 'Música',
            'cultura': 'Cultura',
            'menjars': 'Comidas',
            'populars': 'Populares',
            'ball pla': 'Ball pla'
        }
    };
    
    const lang = isEs ? 'es' : 'ca';
    if (translations[lang] && translations[lang][catLower]) {
        return translations[lang][catLower];
    }
    
    // Capitalize first letter as fallback
    return category.charAt(0).toUpperCase() + category.slice(1);
};

// Render category badges supporting comma-separated list of tags
window.renderCategoryBadges = function(categoryString, extraStyles = '') {
    if (!categoryString) return '';
    const colors = window.db.getCategoryColors();
    const categories = categoryString.split(',').map(c => c.trim()).filter(c => c.length > 0);
    return categories.map(cat => {
        const catColors = colors[cat] || { bg: '#e4e4e7', text: '#18181b' };
        const displayName = window.getCategoryName(cat);
        const escCat = window.db.escapeHTML(displayName);
        return `<span class="event-tag" style="background-color: ${catColors.bg}; color: ${catColors.text}; flex-shrink: 0; margin-right: 0.25rem; ${extraStyles}">${escCat}</span>`;
    }).join('');
};
