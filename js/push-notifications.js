/* ==========================================================================
   Comissió de Festes d'Ares del Maestrat - Push Notifications Manager
   ========================================================================== */

(function () {
    // VAPID Public Key per a la subscripció Push
    const VAPID_PUBLIC_KEY = 'BB2zPqciG55GvUr54fwH4UORMp0b8nvBiRgxmxgft-gBE0CYHDXZDz-z46CEpR1pMQSeXDotdaAZi7wbU7vS6Ec';

    let swRegistration = null;
    let isSubscribed = false;

    // Converteix la clau VAPID Base64URL a Uint8Array
    function urlBase64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - base64String.length % 4) % 4);
        const base64 = (base64String + padding)
            .replace(/\-/g, '+')
            .replace(/_/g, '/');

        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);

        for (let i = 0; i < rawData.length; ++i) {
            outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
    }

    // Inicialitza el Service Worker i comprova l'estat de subscripció
    async function initPushManager() {
        if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
            console.warn('Notificacions Push no suportades en aquest navegador.');
            return;
        }

        try {
            swRegistration = await navigator.serviceWorker.register('/sw.js');
            
            // Esperar que el SW estiga actiu
            await navigator.serviceWorker.ready;

            // Verificar si ja està subscrit
            const subscription = await swRegistration.pushManager.getSubscription();
            isSubscribed = !(subscription === null);

            renderPushBellUI();
        } catch (error) {
            console.error('Error inicialitzant Service Worker per a Push:', error);
        }
    }

    // Subscriure l'usuari a les notificaions
    async function subscribeUser() {
        if (!swRegistration) return;

        try {
            const permission = await Notification.requestPermission();
            if (permission !== 'granted') {
                const isEs = window.location.pathname.includes('/es/');
                alert(isEs 
                    ? 'Has denegado el permiso para recibir notificaciones. Puedes activarlo desde la configuración de tu navegador.' 
                    : 'Has denegat el permís per a rebre notificacions. Pots activar-ho des de la configuració del teu navegador.');
                return;
            }

            const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY);
            const subscription = await swRegistration.pushManager.subscribe({
                userVisibleOnly: true,
                applicationServerKey: applicationServerKey
            });

            // Desar la subscripció a Supabase
            if (window.db && window.db.savePushSubscription) {
                await window.db.savePushSubscription(subscription);
            }

            isSubscribed = true;
            updatePushBellUI();

            const isEs = window.location.pathname.includes('/es/');
            alert(isEs 
                ? '¡Notificaciones activadas! Te avisaremos cuando se publique una nueva noticia.' 
                : '¡Notificacions activades! Et notificarem quan es publique una nova notícia.');

        } catch (error) {
            console.error('Error en subscriure a Notificacions Push:', error);
            const isEs = window.location.pathname.includes('/es/');
            alert(isEs ? 'Error activando las notificaciones.' : 'Error activant les notificacions.');
        }
    }

    // Desubscriure l'usuari
    async function unsubscribeUser() {
        if (!swRegistration) return;

        try {
            const subscription = await swRegistration.pushManager.getSubscription();
            if (subscription) {
                if (window.db && window.db.deletePushSubscription) {
                    await window.db.deletePushSubscription(subscription.endpoint);
                }
                await subscription.unsubscribe();
            }

            isSubscribed = false;
            updatePushBellUI();

            const isEs = window.location.pathname.includes('/es/');
            alert(isEs 
                ? 'Notificaciones desactivadas.' 
                : 'Notificacions desactivades.');

        } catch (error) {
            console.error('Error desubscrivint de Push:', error);
        }
    }

    // Renderitzar el botó de la campana de notificacions a la UI
    function renderPushBellUI() {
        if (document.getElementById('push-notification-bell')) return;

        const isEs = window.location.pathname.includes('/es/');

        const bellContainer = document.createElement('div');
        bellContainer.id = 'push-notification-bell';
        bellContainer.className = 'push-bell-container';
        bellContainer.innerHTML = `
            <button id="push-bell-btn" class="push-bell-btn ${isSubscribed ? 'active' : ''}" title="${isSubscribed ? (isEs ? 'Notificaciones activadas' : 'Notificacions activades') : (isEs ? 'Activar notificaciones de noticias' : 'Activar notificacions de notícies')}">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="bell-icon">
                    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
                    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
                </svg>
                <span class="push-bell-dot"></span>
            </button>
        `;

        document.body.appendChild(bellContainer);

        const btn = document.getElementById('push-bell-btn');
        btn.addEventListener('click', () => {
            if (isSubscribed) {
                if (confirm(isEs ? '¿Quieres desactivar las notificaciones de noticias?' : 'Vols desactivar les notificacions de notícies?')) {
                    unsubscribeUser();
                }
            } else {
                subscribeUser();
            }
        });
    }

    function updatePushBellUI() {
        const btn = document.getElementById('push-bell-btn');
        if (!btn) return;
        const isEs = window.location.pathname.includes('/es/');
        
        if (isSubscribed) {
            btn.classList.add('active');
            btn.title = isEs ? 'Notificaciones activadas' : 'Notificacions activades';
        } else {
            btn.classList.remove('active');
            btn.title = isEs ? 'Activar notificaciones de noticias' : 'Activar notificacions de notícies';
        }
    }

    // Inicialitzar en carregar la pàgina
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPushManager);
    } else {
        initPushManager();
    }

    // Exportar API global per si es requereix des de menú
    window.pushNotifications = {
        subscribe: subscribeUser,
        unsubscribe: unsubscribeUser,
        isSubscribed: () => isSubscribed
    };

})();
