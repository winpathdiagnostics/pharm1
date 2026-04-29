import { DRUGS } from './data.js';
import { generateWhatsAppLink } from './whatsapp.js';

let currentView = 'home';
let cart = [];
let searchQuery = '';
let gpsData = { lat: null, lng: null };
let prescriptionFile = null;
let requiresRx = false;

window.navigate = function(view) {
    currentView = view;
    document.getElementById('view-home').classList.toggle('hidden', view !== 'home');
    document.getElementById('view-cart').classList.toggle('hidden', view !== 'cart');
    document.getElementById('view-checkout').classList.toggle('hidden', view !== 'checkout');
    
    const backBtn = document.getElementById('header-back-btn');
    const cartBtn = document.getElementById('header-cart-btn');
    const title = document.getElementById('header-title');
    const searchContainer = document.getElementById('header-search-container');

    if (view === 'home') {
        backBtn.classList.add('hidden');
        cartBtn.classList.remove('hidden');
        title.classList.add('hidden');
        searchContainer.classList.remove('hidden');
    } else {
        backBtn.classList.remove('hidden');
        cartBtn.classList.add('hidden');
        title.classList.remove('hidden');
        title.innerText = view === 'cart' ? 'Your Cart' : 'Checkout';
        searchContainer.classList.add('hidden');
    }

    if (view === 'cart') renderCartView();
    if (view === 'checkout') renderCheckoutView();

    updateCartUI();
    lucide.createIcons();
    window.scrollTo(0, 0);
};

window.handleBack = function() {
    if (currentView === 'checkout') navigate('cart');
    else if (currentView === 'cart') navigate('home');
};

window.handleSearch = function(query) {
    searchQuery = query.toLowerCase();
    renderProducts();
};

window.addToCart = function(id) {
    const drug = DRUGS.find(d => d.id === id);
    cart.push({ ...drug, qty: 1 });
    showToast("Added to cart");
    renderProducts();
    updateCartUI();
};

window.updateQty = function(id, delta) {
    const item = cart.find(i => i.id === id);
    if (item) {
        item.qty += delta;
        if (item.qty <= 0) cart = cart.filter(i => i.id !== id);
    }
    renderProducts();
    if (currentView === 'cart') renderCartView();
    updateCartUI();
};

window.removeFromCart = function(id) {
    cart = cart.filter(i => i.id !== id);
    renderCartView();
    updateCartUI();
    if(cart.length === 0) navigate('home');
};

window.handleFileSelect = function(event) {
    prescriptionFile = event.target.files[0];
    if (prescriptionFile) {
        document.getElementById('file-name-label').innerText = 'File Selected';
        document.getElementById('rx-success-text').innerText = prescriptionFile.name;
        document.getElementById('rx-success-box').classList.remove('hidden');
        document.getElementById('rx-success-box').classList.add('flex');
    }
};

window.handleGPS = function() {
    if (navigator.geolocation) {
        showToast("Fetching location...");
        navigator.geolocation.getCurrentPosition(
            (position) => {
                gpsData.lat = position.coords.latitude;
                gpsData.lng = position.coords.longitude;
                document.getElementById('gpsBtn').className = "w-full py-2.5 px-4 rounded-xl border flex items-center justify-center space-x-2 font-bold text-sm transition-all bg-emerald-50 border-emerald-200 text-emerald-700";
                document.getElementById('gps-icon').classList.replace('text-gray-400', 'text-emerald-500');
                document.getElementById('gps-text').innerText = "Location Captured ✓";
                showToast("GPS Location attached!");
            },
            (error) => {
                if (error.code === error.PERMISSION_DENIED) {
                    showToast("Location denied. Please tap the lock icon (🔒) in your address bar to allow GPS.", 5000);
                } else if (error.code === error.TIMEOUT) {
                    showToast("Location request timed out. Please try again.");
                } else {
                    showToast("Failed to get location. Ensure your device GPS is turned on.");
                }
            },
            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
        );
    } else {
        showToast("Geolocation is not supported by your browser");
    }
};

window.handleWhatsAppCheckout = function(e) {
    e.preventDefault();
    const formData = {
        name: document.getElementById('cust-name').value,
        age: document.getElementById('cust-age').value,
        mobile: document.getElementById('cust-mobile').value,
        address: document.getElementById('cust-address').value,
        lat: gpsData.lat,
        lng: gpsData.lng
    };

    if (!formData.name || !formData.mobile || !formData.address || !formData.age) {
        return showToast("Please fill all mandatory fields.");
    }
    if (requiresRx && !prescriptionFile) {
        return showToast("Prescription is mandatory.");
    }

    const link = generateWhatsAppLink(cart, formData, requiresRx);
    window.open(link, '_blank');
};

function renderProducts() {
    const grid = document.getElementById('products-grid');
    const empty = document.getElementById('empty-search');
    
    // Filters by name, generic, or type
    const filtered = DRUGS.filter(d => 
        d.name.toLowerCase().includes(searchQuery) || 
        d.generic.toLowerCase().includes(searchQuery) ||
        d.type.toLowerCase().includes(searchQuery)
    );
    
    document.getElementById('search-count').innerText = `${filtered.length} items found`;

    if (filtered.length === 0) {
        grid.classList.add('hidden');
        empty.classList.remove('hidden');
        return;
    }
    grid.classList.remove('hidden');
    empty.classList.add('hidden');

    grid.innerHTML = filtered.map(drug => {
        const cartItem = cart.find(item => item.id === drug.id);
        
        let actionHtml = cartItem 
            ? `<div class="flex items-center justify-between bg-emerald-50 rounded-xl p-1 shadow-inner">
                <button onclick="updateQty(${drug.id}, -1)" class="p-1.5 bg-white rounded-lg shadow-sm text-emerald-700 active:scale-95"><i data-lucide="minus" class="w-3.5 h-3.5"></i></button>
                <span class="text-sm font-bold text-emerald-800 w-6 text-center">${cartItem.qty}</span>
                <button onclick="updateQty(${drug.id}, 1)" class="p-1.5 bg-emerald-600 rounded-lg shadow-sm text-white active:scale-95"><i data-lucide="plus" class="w-3.5 h-3.5"></i></button>
               </div>` 
            : `<button onclick="addToCart(${drug.id})" class="w-full bg-white border border-gray-200 text-emerald-600 font-bold text-xs py-2 rounded-xl hover:bg-emerald-50 active:scale-95">ADD TO CART</button>`;

        let rxBadge = drug.rx ? `<div class="absolute top-2 left-2 bg-red-50 text-red-600 text-[10px] font-extrabold px-1.5 py-0.5 rounded flex items-center border border-red-100 z-10"><i data-lucide="alert-circle" class="w-2.5 h-2.5 mr-0.5"></i><span>Rx</span></div>` : '';

        // Fallback image logic is built directly into the HTML <img> tag via onerror
        return `
            <div class="flex flex-col bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm relative">
                ${rxBadge}
                <div class="h-32 bg-white flex items-center justify-center p-2">
                    <img src="${drug.imageUrl}" alt="${drug.name}" class="w-full h-full object-contain mix-blend-multiply" onerror="this.onerror=null;this.src='https://placehold.co/300x300/f8fafc/94a3b8?text=Medicine';" />
                </div>
                <div class="p-3 flex flex-col flex-grow border-t border-gray-50 bg-gray-50/30">
                    <h3 class="font-bold text-gray-800 text-sm leading-tight line-clamp-1">${drug.name}</h3>
                    <p class="text-[10px] text-gray-500 mt-0.5 leading-tight line-clamp-1" title="${drug.generic}">${drug.generic}</p>
                    <div class="text-[9px] font-bold bg-white border border-gray-200 text-gray-500 px-1.5 py-0.5 rounded w-max mt-1.5">${drug.packSize}</div>
                    
                    <div class="mt-auto pt-3">
                        <div class="flex items-end space-x-1.5 mb-2">
                            <span class="text-base font-extrabold text-gray-900">₹${drug.price.toFixed(2)}</span>
                            <span class="text-xs text-gray-400 line-through">₹${drug.mrp.toFixed(2)}</span>
                            <span class="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-1 py-0.5 rounded ml-auto">${drug.disc}% OFF</span>
                        </div>
                        ${actionHtml}
                    </div>
                </div>
            </div>`;
    }).join('');
    lucide.createIcons();
}

function updateCartUI() {
    requiresRx = cart.some(item => item.rx);

    const badge = document.getElementById('header-cart-badge');
    if (cart.length > 0) {
        badge.innerText = cart.length;
        badge.classList.remove('hidden');
    } else {
        badge.classList.add('hidden');
    }

    const floating = document.getElementById('floating-cart');
    if (cart.length > 0 && currentView === 'home') {
        const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
        document.getElementById('floating-cart-items').innerText = `${cart.length} Pack${cart.length > 1 ? 's' : ''} in cart`;
        document.getElementById('floating-cart-total').innerText = `₹${total.toFixed(2)}`;
        floating.classList.remove('hidden');
    } else {
        floating.classList.add('hidden');
    }
}

function renderCartView() {
    const container = document.getElementById('cart-content');
    
    if (cart.length === 0) {
        container.innerHTML = `
            <div class="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
                <i data-lucide="shopping-cart" class="w-12 h-12 mx-auto text-gray-300 mb-4"></i>
                <p class="font-bold text-gray-800 text-lg mb-1">Your cart is empty</p>
                <p class="text-sm text-gray-500 mb-6">Looks like you haven't added any medicines yet.</p>
                <button onclick="navigate('home')" class="bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-emerald-700 transition-colors">Browse Medicines</button>
            </div>
        `;
        lucide.createIcons();
        return;
    }

    let cartHtml = `<div class="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden divide-y divide-gray-50">`;
    
    cart.forEach(item => {
        cartHtml += `
            <div class="p-4 flex items-center relative">
                ${item.rx ? `<i data-lucide="alert-circle" class="w-3.5 h-3.5 text-red-500 absolute top-4 left-4"></i>` : ''}
                
                <div class="w-12 h-12 bg-gray-50 rounded-lg p-1 mr-3 flex-shrink-0">
                    <img src="${item.imageUrl}" alt="${item.name}" class="w-full h-full object-contain mix-blend-multiply" onerror="this.onerror=null;this.src='https://placehold.co/150x150/f8fafc/94a3b8?text=Med';" />
                </div>

                <div class="flex-1">
                    <h3 class="font-bold text-gray-800 text-sm leading-tight">${item.name}</h3>
                    <div class="text-gray-500 text-[10px] mt-0.5">${item.packSize}</div>
                    <div class="mt-1.5 flex items-center space-x-2">
                        <span class="font-extrabold text-emerald-700">₹${item.price.toFixed(2)}</span>
                        <span class="text-xs text-gray-400 line-through">₹${item.mrp.toFixed(2)}</span>
                    </div>
                </div>
                <div class="flex flex-col items-end justify-between ml-2 space-y-3">
                    <button onclick="removeFromCart(${item.id})" class="text-gray-400 hover:text-red-500 transition-colors bg-gray-50 p-1.5 rounded-lg"><i data-lucide="trash-2" class="w-4 h-4"></i></button>
                    <div class="flex items-center space-x-2 bg-gray-50 border border-gray-100 rounded-lg p-1">
                        <button onclick="updateQty(${item.id}, -1)" class="p-1 bg-white rounded shadow-sm text-gray-700 active:scale-95"><i data-lucide="minus" class="w-3.5 h-3.5"></i></button>
                        <span class="font-bold text-sm w-5 text-center text-gray-800">${item.qty}</span>
                        <button onclick="updateQty(${item.id}, 1)" class="p-1 bg-white rounded shadow-sm text-gray-700 active:scale-95"><i data-lucide="plus" class="w-3.5 h-3.5"></i></button>
                    </div>
                </div>
            </div>
        `;
    });
    cartHtml += `</div>`;

    const total = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const savings = cart.reduce((sum, item) => sum + ((item.mrp - item.price) * item.qty), 0);

    cartHtml += `
        <div class="bg-white p-5 rounded-2xl shadow-sm border border-emerald-100 relative overflow-hidden mt-4">
            <div class="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-bl-full -z-10"></div>
            <h3 class="font-bold text-gray-800 mb-3 text-sm">Bill Summary</h3>
            <div class="space-y-2 text-sm text-gray-600 mb-3 pb-3 border-b border-dashed border-gray-200">
                <div class="flex justify-between"><span>Item Total (MRP)</span><span>₹${(total + savings).toFixed(2)}</span></div>
                <div class="flex justify-between text-emerald-600 font-medium"><span>Total Discount</span><span>- ₹${savings.toFixed(2)}</span></div>
                <div class="flex justify-between"><span>Delivery Fee</span><span class="text-emerald-600 font-medium">FREE</span></div>
            </div>
            <div class="flex justify-between font-extrabold text-lg text-gray-900">
                <span>To Pay</span>
                <span>₹${total.toFixed(2)}</span>
            </div>
            <div class="mt-2 text-xs font-semibold text-emerald-700 bg-emerald-50 inline-block px-2 py-1 rounded">
                Total Savings: ₹${savings.toFixed(2)}
            </div>
        </div>
        
        <button onclick="navigate('checkout')" class="w-full mt-4 bg-emerald-600 text-white p-4 rounded-xl font-bold text-lg flex justify-between items-center shadow-lg shadow-emerald-200 active:scale-[0.98] transition-all">
            <span>Proceed to Details</span>
            <i data-lucide="arrow-right" class="w-5 h-5"></i>
        </button>
    `;

    container.innerHTML = cartHtml;
    lucide.createIcons();
}

function renderCheckoutView() {
    const rxBox = document.getElementById('rx-warning-box');
    const rxUploadBorder = document.getElementById('rx-upload-container');
    const rxAsterisk = document.getElementById('rx-asterisk');
    const rxNote = document.getElementById('rx-whatsapp-note');

    if (requiresRx) {
        rxBox.classList.remove('hidden');
        rxBox.classList.add('flex');
        rxUploadBorder.classList.add('border-emerald-300');
        rxUploadBorder.classList.remove('border-gray-100');
        rxAsterisk.classList.remove('hidden');
        rxNote.classList.remove('hidden');
    } else {
        rxBox.classList.add('hidden');
        rxBox.classList.remove('flex');
        rxUploadBorder.classList.remove('border-emerald-300');
        rxUploadBorder.classList.add('border-gray-100');
        rxAsterisk.classList.add('hidden');
        rxNote.classList.add('hidden');
    }
}

function showToast(message, duration = 3000) {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = "bg-gray-800 text-white px-4 py-2 rounded-lg shadow-xl text-sm font-medium animate-fade-in-down flex items-center space-x-2";
    toast.innerHTML = `<i data-lucide="check-circle-2" class="text-emerald-400 w-4 h-4"></i><span>${message}</span>`;
    container.appendChild(toast);
    lucide.createIcons();
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 0.3s ease-out';
        setTimeout(() => toast.remove(), 300);
    }, duration);
}

// Initialize
window.onload = () => {
    renderProducts();
    updateCartUI();
    lucide.createIcons();
};
