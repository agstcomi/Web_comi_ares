// js/cart.js - Shopping Cart Manager for Comissió de Festes d'Ares
(function () {
    class CartManager {
        constructor() {
            this.storageKey = 'ares_cart';
            this.initUI();
            // Listen to cart updates across tabs/pages
            window.addEventListener('storage', (e) => {
                if (e.key === this.storageKey) {
                    this.notifyChange();
                }
            });
            window.addEventListener('cart:updated', () => {
                this.updateBadges();
                this.renderDrawerContent();
            });
        }

        getCart() {
            try {
                const stored = localStorage.getItem(this.storageKey);
                return stored ? JSON.parse(stored) : [];
            } catch (e) {
                console.error("Error reading cart:", e);
                return [];
            }
        }

        saveCart(cart) {
            try {
                localStorage.setItem(this.storageKey, JSON.stringify(cart));
                this.notifyChange();
            } catch (e) {
                console.error("Error saving cart:", e);
            }
        }

        addToCart(item) {
            if (!item || !item.id) return;
            const cart = this.getCart();
            const size = item.size || 'Talla Única';
            const qty = Math.max(1, parseInt(item.quantity || 1, 10));

            const existingIndex = cart.findIndex(i => String(i.id) === String(item.id) && String(i.size || 'Talla Única') === String(size));
            if (existingIndex >= 0) {
                cart[existingIndex].quantity = (parseInt(cart[existingIndex].quantity || 1, 10)) + qty;
            } else {
                cart.push({
                    id: item.id,
                    name: item.name || 'Producte',
                    name_es: item.name_es || item.name || 'Producto',
                    slug: item.slug || 'producte',
                    price: parseFloat(item.price || 0),
                    size: size,
                    quantity: qty,
                    image_url: item.image_url || '/img/camiseta-1.webp'
                });
            }

            this.saveCart(cart);
            this.openCart();
            this.showToast(isCastellano() ? '¡Producto añadido al carrito!' : 'Producte afegit al carret!');
        }

        updateQuantity(index, delta) {
            const cart = this.getCart();
            if (index < 0 || index >= cart.length) return;
            const newQty = parseInt(cart[index].quantity || 1, 10) + delta;
            if (newQty <= 0) {
                this.removeFromCart(index);
                return;
            }
            cart[index].quantity = newQty;
            this.saveCart(cart);
        }

        removeFromCart(index) {
            const cart = this.getCart();
            if (index < 0 || index >= cart.length) return;
            cart.splice(index, 1);
            this.saveCart(cart);
        }

        clearCart() {
            this.saveCart([]);
        }

        getCartCount() {
            const cart = this.getCart();
            return cart.reduce((acc, item) => acc + parseInt(item.quantity || 1, 10), 0);
        }

        getCartTotal() {
            const cart = this.getCart();
            return cart.reduce((acc, item) => acc + (parseFloat(item.price || 0) * parseInt(item.quantity || 1, 10)), 0);
        }

        notifyChange() {
            window.dispatchEvent(new CustomEvent('cart:updated'));
        }

        showToast(msg) {
            if (typeof window.showAdminToast === 'function') {
                window.showAdminToast(msg, 'success', 3000);
            } else {
                const toast = document.createElement('div');
                toast.className = 'cart-toast-msg';
                toast.innerText = msg;
                document.body.appendChild(toast);
                setTimeout(() => toast.classList.add('show'), 10);
                setTimeout(() => {
                    toast.classList.remove('show');
                    setTimeout(() => toast.remove(), 300);
                }, 3000);
            }
        }

        initUI() {
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.buildDrawerDOM());
            } else {
                this.buildDrawerDOM();
            }
        }

        buildDrawerDOM() {
            if (document.getElementById('cart-drawer-backdrop')) return;

            const backdrop = document.createElement('div');
            backdrop.id = 'cart-drawer-backdrop';
            backdrop.className = 'cart-drawer-backdrop';
            backdrop.addEventListener('click', (e) => {
                if (e.target === backdrop) this.closeCart();
            });

            const isEs = isCastellano();

            backdrop.innerHTML = `
                <div class="cart-drawer-panel" id="cart-drawer-panel">
                    <div class="cart-drawer-header">
                        <div class="cart-drawer-title">
                            <i data-lucide="shopping-bag" style="width: 20px; height: 20px;"></i>
                            <span>${isEs ? 'Tu Carrito' : 'El teu Carret'}</span>
                            <span class="cart-count-badge" id="cart-drawer-count">0</span>
                        </div>
                        <button class="cart-drawer-close" id="cart-drawer-close-btn" aria-label="Tancar carret">
                            <i data-lucide="x" style="width: 20px; height: 20px;"></i>
                        </button>
                    </div>
                    <div class="cart-drawer-body" id="cart-drawer-body">
                        <!-- Dynamic items -->
                    </div>
                    <div class="cart-drawer-footer" id="cart-drawer-footer">
                        <div class="cart-summary-row">
                            <span>Total:</span>
                            <strong id="cart-drawer-total" class="cart-total-price">0.00 €</strong>
                        </div>
                        <div class="cart-drawer-actions">
                            <button class="btn btn-outline btn-sm btn-clear-cart" id="btn-clear-cart-action">
                                ${isEs ? 'Vaciar carrito' : 'Buidar carret'}
                            </button>
                            <button class="btn btn-primary btn-checkout-cart" id="btn-checkout-cart-action">
                                ${isEs ? 'Procesar Reserva →' : 'Processar Reserva →'}
                            </button>
                        </div>
                    </div>
                </div>
            `;

            document.body.appendChild(backdrop);

            // Floating cart button
            const floatingBtn = document.createElement('button');
            floatingBtn.id = 'floating-cart-btn';
            floatingBtn.className = 'floating-cart-btn';
            floatingBtn.setAttribute('aria-label', isEs ? 'Ver carrito' : 'Veure carret');
            floatingBtn.innerHTML = `
                <i data-lucide="shopping-cart" style="width: 20px; height: 20px;"></i>
                <span class="floating-cart-badge" id="floating-cart-badge">0</span>
            `;
            floatingBtn.addEventListener('click', () => this.toggleCart());
            document.body.appendChild(floatingBtn);

            // Event Listeners inside Drawer
            document.getElementById('cart-drawer-close-btn').addEventListener('click', () => this.closeCart());
            document.getElementById('btn-clear-cart-action').addEventListener('click', () => {
                if (confirm(isEs ? '¿Seguro que quieres vaciar el carrito?' : 'Segur que vols buidar el carret?')) {
                    this.clearCart();
                }
            });
            document.getElementById('btn-checkout-cart-action').addEventListener('click', () => {
                this.closeCart();
                this.triggerCheckout();
            });

            this.updateBadges();
            this.renderDrawerContent();

            if (window.lucide && typeof window.lucide.createIcons === 'function') {
                window.lucide.createIcons();
            }
        }

        openCart() {
            const backdrop = document.getElementById('cart-drawer-backdrop');
            if (backdrop) {
                this.renderDrawerContent();
                backdrop.classList.add('active');
                document.body.style.overflow = 'hidden';
            }
        }

        closeCart() {
            const backdrop = document.getElementById('cart-drawer-backdrop');
            if (backdrop) {
                backdrop.classList.remove('active');
                document.body.style.overflow = '';
            }
        }

        toggleCart() {
            const backdrop = document.getElementById('cart-drawer-backdrop');
            if (backdrop && backdrop.classList.contains('active')) {
                this.closeCart();
            } else {
                this.openCart();
            }
        }

        updateBadges() {
            const count = this.getCartCount();
            const drawerBadge = document.getElementById('cart-drawer-count');
            const floatingBadge = document.getElementById('floating-cart-badge');
            const floatingBtn = document.getElementById('floating-cart-btn');

            if (drawerBadge) drawerBadge.textContent = count;
            if (floatingBadge) floatingBadge.textContent = count;

            if (floatingBtn) {
                if (count > 0) {
                    floatingBtn.classList.add('has-items');
                } else {
                    floatingBtn.classList.remove('has-items');
                }
            }

            // Also sync any header cart badges if present in DOM
            document.querySelectorAll('.nav-cart-badge').forEach(badge => {
                badge.textContent = count;
                if (count > 0) badge.style.display = 'inline-flex';
                else badge.style.display = 'none';
            });
        }

        renderDrawerContent() {
            const body = document.getElementById('cart-drawer-body');
            const footer = document.getElementById('cart-drawer-footer');
            const totalEl = document.getElementById('cart-drawer-total');
            if (!body) return;

            const cart = this.getCart();
            const isEs = isCastellano();

            if (cart.length === 0) {
                body.innerHTML = `
                    <div class="cart-empty-state">
                        <i data-lucide="shopping-bag" style="width: 48px; height: 48px; opacity: 0.3; margin-bottom: 1rem;"></i>
                        <p>${isEs ? 'El carrito está vacío' : 'El carret està buit'}</p>
                        <a href="${isEs ? '/es/tenda' : '/tenda'}" class="btn btn-sm btn-outline" style="margin-top: 1rem;" onclick="window.cart.closeCart();">
                            ${isEs ? 'Explorar la tienda' : 'Explorar la tenda'}
                        </a>
                    </div>
                `;
                if (footer) footer.style.display = 'none';
            } else {
                if (footer) footer.style.display = 'block';
                if (totalEl) totalEl.textContent = this.getCartTotal().toFixed(2).replace('.', ',') + ' €';

                body.innerHTML = cart.map((item, idx) => `
                    <div class="cart-item-row" data-index="${idx}">
                        <img src="${item.image_url}" alt="${escHTML(isEs ? item.name_es : item.name)}" class="cart-item-img" />
                        <div class="cart-item-info">
                            <div class="cart-item-title">${escHTML(isEs ? item.name_es : item.name)}</div>
                            <div class="cart-item-meta">
                                <span class="cart-item-size">${escHTML(item.size)}</span>
                                <span class="cart-item-price">${parseFloat(item.price).toFixed(2).replace('.', ',')} €</span>
                            </div>
                            <div class="cart-item-controls">
                                <div class="qty-control-group">
                                    <button class="qty-btn btn-qty-minus" data-index="${idx}" aria-label="Disminuir quantitat">-</button>
                                    <span class="qty-val">${item.quantity}</span>
                                    <button class="qty-btn btn-qty-plus" data-index="${idx}" aria-label="Augmentar quantitat">+</button>
                                </div>
                                <span class="cart-item-subtotal">${(parseFloat(item.price) * parseInt(item.quantity)).toFixed(2).replace('.', ',')} €</span>
                            </div>
                        </div>
                        <button class="cart-item-remove" data-index="${idx}" title="${isEs ? 'Eliminar del carrito' : 'Eliminar del carret'}">
                            <i data-lucide="trash-2" style="width: 16px; height: 16px;"></i>
                        </button>
                    </div>
                `).join('');

                // Attach event listeners
                body.querySelectorAll('.btn-qty-minus').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const idx = parseInt(btn.getAttribute('data-index'), 10);
                        this.updateQuantity(idx, -1);
                    });
                });
                body.querySelectorAll('.btn-qty-plus').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const idx = parseInt(btn.getAttribute('data-index'), 10);
                        this.updateQuantity(idx, 1);
                    });
                });
                body.querySelectorAll('.cart-item-remove').forEach(btn => {
                    btn.addEventListener('click', () => {
                        const idx = parseInt(btn.getAttribute('data-index'), 10);
                        this.removeFromCart(idx);
                    });
                });
            }

            if (window.lucide && typeof window.lucide.createIcons === 'function') {
                window.lucide.createIcons();
            }
        }

        triggerCheckout() {
            const cart = this.getCart();
            if (cart.length === 0) return;

            const modal = document.getElementById('modal-reservation') || document.getElementById('reservation-modal');

            if (modal) {
                this.populateCheckoutForm();
                modal.classList.add('open');
                modal.classList.add('active');
                document.body.style.overflow = 'hidden';
            } else {
                const isEs = isCastellano();
                window.location.href = (isEs ? '/es/camisetes.html' : '/camisetes.html') + '?checkout=cart';
            }
        }

        populateCheckoutForm() {
            const cart = this.getCart();
            if (cart.length === 0) return;
            const isEs = isCastellano();

            const conceptStr = cart.map(i => `${i.quantity}x ${isEs ? i.name_es : i.name} (${i.size})`).join(', ');
            const totalSum = this.getCartTotal();

            // Fill modal fields if present
            const modalQty = document.getElementById('modal-qty');
            const modalTotal = document.getElementById('modal-total');
            const modalSize = document.getElementById('modal-size');
            const summaryBox = document.getElementById('cart-items-summary-box');
            const modalSummary = document.getElementById('modal-summary');

            if (modalQty) modalQty.textContent = this.getCartCount();
            if (modalTotal) modalTotal.textContent = totalSum.toFixed(2).replace('.', ',') + ' €';
            if (modalSize) modalSize.textContent = cart.length === 1 ? cart[0].size : 'Vàries talles';

            if (modalSummary) {
                modalSummary.style.display = 'none';
            }

            const btnConfirmLabel = document.getElementById('btn-confirm-label');
            if (btnConfirmLabel) {
                btnConfirmLabel.textContent = isEs 
                    ? `Confirmar Reserva (${totalSum.toFixed(2).replace('.', ',')} €)`
                    : `Confirmar Reserva (${totalSum.toFixed(2).replace('.', ',')} €)`;
            }

            if (summaryBox) {
                summaryBox.style.display = 'block';
                summaryBox.innerHTML = `
                    <div style="background: rgba(0,0,0,0.03); border-radius: 12px; padding: 0.75rem 1rem; margin-bottom: 1rem; border: 1px solid rgba(0,0,0,0.06);">
                        <strong style="display: block; font-size: 0.85rem; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 0.5rem; color: var(--text-secondary);">
                            ${isEs ? 'Resumen del pedido:' : 'Resum de la comanda:'}
                        </strong>
                        <ul style="list-style: none; margin: 0; padding: 0; font-size: 0.9rem;">
                            ${cart.map(i => `
                                <li style="display: flex; justify-content: space-between; padding: 0.25rem 0; border-bottom: 1px dashed rgba(0,0,0,0.08);">
                                    <span><strong>${i.quantity}x</strong> ${escHTML(isEs ? i.name_es : i.name)} <small style="opacity: 0.7;">(${escHTML(i.size)})</small></span>
                                    <span>${(parseFloat(i.price) * parseInt(i.quantity)).toFixed(2).replace('.', ',')} €</span>
                                </li>
                            `).join('')}
                        </ul>
                        <div style="display: flex; justify-content: space-between; font-weight: 700; font-size: 1rem; margin-top: 0.5rem; padding-top: 0.5rem;">
                            <span>Total:</span>
                            <span>${totalSum.toFixed(2).replace('.', ',')} €</span>
                        </div>
                    </div>
                `;
            }
        }
    }

    function isCastellano() {
        return window.location.pathname.startsWith('/es/') || window.location.pathname.includes('/es');
    }

    function escHTML(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // Export globally
    window.cart = new CartManager();

    // Auto trigger checkout modal if URL has ?checkout=cart
    if (window.location.search.includes('checkout=cart')) {
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                if (window.cart) window.cart.triggerCheckout();
            }, 300);
        });
    }
})();
