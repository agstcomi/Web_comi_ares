// js/galeria.js

document.addEventListener('DOMContentLoaded', () => {
    let allPhotos = [];
    let filteredPhotos = [];
    let currentPhotoIndex = 0;
    let currentCategory = 'all';

    // Lightbox Elements
    const lightbox = document.getElementById('lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxCaption = document.getElementById('lightbox-caption');
    const lightboxClose = document.getElementById('lightbox-close');
    const lightboxPrev = document.getElementById('lightbox-prev');
    const lightboxNext = document.getElementById('lightbox-next');

    // Wait for DB initialization
    setTimeout(async () => {
        await initGaleria();
    }, 100);

    async function initGaleria() {
        try {
            allPhotos = await window.db.getPhotos();
            filteredPhotos = [...allPhotos];
            
            renderCategories();
            renderPhotos();
            initLightboxEvents();
        } catch (error) {
            console.error("Error loading gallery:", error);
            const isEs = window.location.pathname.includes('/es/');
            const errorMsg = isEs 
                ? 'Error al cargar la galería. Reinténtalo más tarde.'
                : 'Error al carregar la galeria. Reintenta-ho més tard.';
            document.getElementById('gallery-grid').innerHTML = 
                `<div style="text-align: center; color: red; padding: 2rem;">${errorMsg}</div>`;
        }
    }

    function renderCategories() {
        const categoriesContainer = document.getElementById('gallery-categories');
        if (!categoriesContainer) return;

        const isEs = window.location.pathname.includes('/es/');

        // Extract unique categories based on language
        const categories = new Set();
        allPhotos.forEach(photo => {
            const catVal = isEs && photo.category_es ? photo.category_es.trim() : (photo.category ? photo.category.trim() : '');
            if (catVal) categories.add(catVal);
        });

        let categoriesHTML = `<button class="filter-btn active" data-category="all">${isEs ? 'Todas' : 'Totes'}</button>`;
        categories.forEach(cat => {
            const safeCat = window.db.escapeHTML(cat);
            categoriesHTML += `<button class="filter-btn" data-category="${safeCat}">${safeCat}</button>`;
        });

        categoriesContainer.innerHTML = categoriesHTML;

        // Set up event listeners for filters
        const filterButtons = categoriesContainer.querySelectorAll('.filter-btn');
        filterButtons.forEach(btn => {
            btn.addEventListener('click', () => {
                filterButtons.forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentCategory = btn.getAttribute('data-category');
                
                filterPhotos();
            });
        });
    }

    function filterPhotos() {
        const isEs = window.location.pathname.includes('/es/');
        if (currentCategory === 'all') {
            filteredPhotos = [...allPhotos];
        } else {
            filteredPhotos = allPhotos.filter(p => {
                const catVal = isEs && p.category_es ? p.category_es.trim() : (p.category ? p.category.trim() : '');
                return catVal === currentCategory;
            });
        }
        renderPhotos();
    }

    function renderPhotos() {
        const grid = document.getElementById('gallery-grid');
        if (!grid) return;

        const isEs = window.location.pathname.includes('/es/');

        if (filteredPhotos.length === 0) {
            const emptyMsg = isEs
                ? 'No se ha encontrado ninguna fotografía para esta categoría.'
                : "No s'ha trobat cap fotografia per a aquesta categoria.";
            grid.innerHTML = `
                <div style="grid-column: 1/-1; text-align: center; padding: 4rem; color: var(--text-muted);">
                    ${emptyMsg}
                </div>
            `;
            return;
        }

        // Render pictures with visual interest (alternating sizes for pseudo-masonry)
        grid.innerHTML = filteredPhotos.map((photo, index) => {
            let sizeClass = '';
            if (index % 5 === 0) sizeClass = 'wide';
            else if (index % 5 === 3) sizeClass = 'tall';

            const title = isEs && photo.title_es ? photo.title_es : photo.title;
            const cat = isEs && photo.category_es ? photo.category_es : (photo.category || (isEs ? 'Fiestas' : 'Festes'));

            const escUrl = window.db.escapeHTML(window.getAssetPath(photo.image_url));
            const escTitle = window.db.escapeHTML(title);
            const escCat = window.db.escapeHTML(cat);
            return `
                <div class="gallery-item ${sizeClass}" data-index="${index}">
                    <img src="${escUrl}" alt="${escTitle}" loading="lazy">
                    <div class="gallery-item-overlay">
                        <h4>${escTitle}</h4>
                        <span>${escCat}</span>
                    </div>
                </div>
            `;
        }).join('');

        // Add click events to grid items
        const items = grid.querySelectorAll('.gallery-item');
        items.forEach(item => {
            item.addEventListener('click', () => {
                const index = parseInt(item.getAttribute('data-index'));
                openLightbox(index);
            });
        });
    }

    // Lightbox Controls
    function openLightbox(index) {
        currentPhotoIndex = index;
        const photo = filteredPhotos[currentPhotoIndex];
        
        if (!photo) return;

        const isEs = window.location.pathname.includes('/es/');
        const title = isEs && photo.title_es ? photo.title_es : photo.title;
        const cat = isEs && photo.category_es ? photo.category_es : (photo.category || '');

        lightboxImg.src = window.getAssetPath(photo.image_url);
        lightboxCaption.textContent = `${title} — ${cat}`;
        
        lightbox.style.display = 'flex';
        setTimeout(() => {
            lightbox.classList.add('active');
        }, 10);
        document.body.style.overflow = 'hidden'; // Disable scroll background
    }

    function closeLightbox() {
        lightbox.classList.remove('active');
        setTimeout(() => {
            lightbox.style.display = 'none';
        }, 300);
        document.body.style.overflow = 'auto'; // Re-enable scroll
    }

    function nextPhoto() {
        if (filteredPhotos.length <= 1) return;
        currentPhotoIndex = (currentPhotoIndex + 1) % filteredPhotos.length;
        updateLightboxContent();
    }

    function prevPhoto() {
        if (filteredPhotos.length <= 1) return;
        currentPhotoIndex = (currentPhotoIndex - 1 + filteredPhotos.length) % filteredPhotos.length;
        updateLightboxContent();
    }

    function updateLightboxContent() {
        const photo = filteredPhotos[currentPhotoIndex];
        if (!photo) return;

        const isEs = window.location.pathname.includes('/es/');
        const title = isEs && photo.title_es ? photo.title_es : photo.title;
        const cat = isEs && photo.category_es ? photo.category_es : (photo.category || '');

        // Add a soft fade transition out/in for smooth visuals
        lightboxImg.style.opacity = 0;
        setTimeout(() => {
            lightboxImg.src = window.getAssetPath(photo.image_url);
            lightboxCaption.textContent = `${title} — ${cat}`;
            lightboxImg.style.opacity = 1;
        }, 150);
    }

    function initLightboxEvents() {
        if (!lightbox) return;

        lightboxClose.addEventListener('click', closeLightbox);
        lightboxNext.addEventListener('click', nextPhoto);
        lightboxPrev.addEventListener('click', prevPhoto);

        // Click outside image to close
        lightbox.addEventListener('click', (e) => {
            if (e.target === lightbox || e.target.classList.contains('lightbox-content')) {
                closeLightbox();
            }
        });

        // Keyboard Controls
        document.addEventListener('keydown', (e) => {
            if (!lightbox.classList.contains('active')) return;

            if (e.key === 'Escape') closeLightbox();
            if (e.key === 'ArrowRight') nextPhoto();
            if (e.key === 'ArrowLeft') prevPhoto();
        });
    }
});
