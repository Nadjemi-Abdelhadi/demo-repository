/* =====================================================
   ZaLo Smart Commerce Layer
   واجهة منتجات + طلب واتساب + قائمة فئات + قائمة جانبية
   ===================================================== */

(function () {
    const ZALO_STORE_URL = "https://zalo2.youcan.store/";

    const CATS = [
        { id: "all", label: "جميع المنتجات", icon: "fa-boxes-stacked" },
        { id: "electronics", label: "هواتف وإلكترونيات", icon: "fa-mobile-screen-button" },
        { id: "restaurants", label: "مطاعم ومقاهي", icon: "fa-utensils" },
        { id: "cars", label: "قطع غيار سيارات", icon: "fa-car" },
        { id: "food", label: "مواد غذائية", icon: "fa-basket-shopping" },
        { id: "pro", label: "حرفيين ومهن", icon: "fa-screwdriver-wrench" },
        { id: "services", label: "خدمات وصيانة", icon: "fa-tools" },
        { id: "building", label: "مواد البناء", icon: "fa-hammer" },
        { id: "fashion", label: "ملابس وموضة", icon: "fa-shirt" },
        { id: "delivery", label: "خدمات التوصيل", icon: "fa-motorcycle" },
        { id: "sweets", label: "حلويات ومملحات", icon: "fa-cookie-bite" }
    ];

    let currentOrderItem = null;
    let orderQty = 1;

    function getGlobalData() {
        try {
            if (typeof allData !== "undefined" && Array.isArray(allData)) return allData;
        } catch (e) {}
        return window.allData || [];
    }

    function getGlobalShops() {
        try {
            if (typeof allShops !== "undefined" && Array.isArray(allShops)) return allShops;
        } catch (e) {}
        return window.allShops || [];
    }

    function safeVal(v) {
        return String(v || "").trim();
    }

    function normalizePhone(phone) {
        let p = String(phone || "").replace(/[^\d+]/g, "");
        if (!p) return "";
        if (p.startsWith("+")) return p.replace("+", "");
        if (p.startsWith("00")) return p.slice(2);
        if (p.startsWith("0")) return "213" + p.slice(1);
        if (p.startsWith("213")) return p;
        return p;
    }

    function imgBox(url, icon = "fa-box") {
        if (url) {
            return `
                <img src="${url}" 
                     class="w-full h-full object-cover rounded-2xl"
                     onerror="this.outerHTML='<div class=&quot;w-full h-full bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 text-3xl&quot;><i class=&quot;fa-solid ${icon}&quot;></i></div>'">
            `;
        }

        return `
            <div class="w-full h-full bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 text-3xl">
                <i class="fa-solid ${icon}"></i>
            </div>
        `;
    }

    function ensureStyles() {
        if (document.getElementById("zalo-commerce-style")) return;

        const style = document.createElement("style");
        style.id = "zalo-commerce-style";
        style.innerHTML = `
            .zalo-card-active:active { transform: scale(.97); }
            .zalo-drawer-backdrop {
                position: fixed;
                inset: 0;
                background: rgba(15, 23, 42, .55);
                z-index: 90;
                display: none;
            }
            .zalo-drawer {
                position: fixed;
                top: 0;
                bottom: 0;
                right: 0;
                width: 82%;
                max-width: 360px;
                background: #fff;
                z-index: 100;
                transform: translateX(110%);
                transition: .25s ease;
                border-radius: 0 0 0 36px;
                overflow: auto;
            }
            .zalo-drawer.open {
                transform: translateX(0);
            }
            .zalo-drawer-backdrop.open {
                display: block;
            }
            .zalo-modal-backdrop {
                position: fixed;
                inset: 0;
                background: rgba(15, 23, 42, .6);
                z-index: 110;
                display: none;
                align-items: end;
                justify-content: center;
                padding: 16px;
            }
            .zalo-modal-backdrop.open {
                display: flex;
            }
            .zalo-order-modal {
                width: 100%;
                max-width: 430px;
                background: white;
                border-radius: 34px;
                padding: 22px;
                animation: zaloUp .25s ease both;
            }
            @keyframes zaloUp {
                from { transform: translateY(25px); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }

    function ensureTopBar() {
        if (document.getElementById("zaloQuickBar")) return;

        const header = document.querySelector("header");
        if (!header) return;

        const bar = document.createElement("div");
        bar.id = "zaloQuickBar";
        bar.className = "max-w-md mx-auto px-5 pt-3";
        bar.innerHTML = `
            <div class="bg-white border border-slate-100 rounded-3xl p-3 shadow-sm flex items-center justify-between gap-2">
                
                <button onclick="openZaloCategories()" class="flex flex-col items-center gap-1 text-emerald-700 font-black text-[10px]">
                    <i class="fa-solid fa-grip text-xl"></i>
                    <span>الفئات</span>
                </button>

                <button onclick="focusZaloSearch()" class="flex flex-col items-center gap-1 text-slate-500 font-black text-[10px]">
                    <i class="fa-solid fa-search text-xl"></i>
                    <span>بحث</span>
                </button>

                <button onclick="openZaloStore()" class="flex flex-col items-center gap-1 text-slate-500 font-black text-[10px]">
                    <i class="fa-solid fa-bag-shopping text-xl"></i>
                    <span>متجر ZaLo</span>
                </button>

                <button onclick="openZaloDrawer()" class="flex flex-col items-center gap-1 text-slate-500 font-black text-[10px]">
                    <i class="fa-solid fa-bars text-xl"></i>
                    <span>القائمة</span>
                </button>
            </div>
        `;

        header.insertAdjacentElement("afterend", bar);
    }

    function ensureDrawer() {
        if (document.getElementById("zaloDrawer")) return;

        document.body.insertAdjacentHTML("beforeend", `
            <div id="zaloDrawerBackdrop" class="zalo-drawer-backdrop" onclick="closeZaloDrawer()"></div>

            <aside id="zaloDrawer" class="zalo-drawer">
                <div class="p-6">
                    <div class="flex items-center justify-between mb-8">
                        <div>
                            <p class="text-[10px] text-emerald-600 font-black tracking-widest">ZALO SMART 🇩🇿</p>
                            <h2 class="text-2xl font-black text-slate-900 mt-1">القائمة</h2>
                        </div>
                        <button onclick="closeZaloDrawer()" class="w-10 h-10 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>

                    <div class="space-y-3">
                        <button onclick="openZaloCategories(); closeZaloDrawer();" class="w-full bg-slate-50 p-4 rounded-2xl flex items-center justify-between">
                            <span class="font-black text-sm">كل الفئات</span>
                            <i class="fa-solid fa-grip text-emerald-600"></i>
                        </button>

                        <button onclick="openZaloStore()" class="w-full bg-slate-50 p-4 rounded-2xl flex items-center justify-between">
                            <span class="font-black text-sm">زيارة متجر ZaLo</span>
                            <i class="fa-solid fa-bag-shopping text-emerald-600"></i>
                        </button>

                        <a href="./owner.html" class="w-full bg-slate-50 p-4 rounded-2xl flex items-center justify-between">
                            <span class="font-black text-sm">دخول التاجر</span>
                            <i class="fa-solid fa-store text-emerald-600"></i>
                        </a>

                        <button onclick="alert('خدمة التوصيل ستُفعل قريباً إن شاء الله')" class="w-full bg-slate-50 p-4 rounded-2xl flex items-center justify-between">
                            <span class="font-black text-sm">التوصيل</span>
                            <i class="fa-solid fa-motorcycle text-emerald-600"></i>
                        </button>

                        <button onclick="alert('ZaLo Smart - دليل رقمي للمتاجر والخدمات')" class="w-full bg-slate-50 p-4 rounded-2xl flex items-center justify-between">
                            <span class="font-black text-sm">من نحن</span>
                            <i class="fa-solid fa-circle-info text-emerald-600"></i>
                        </button>
                    </div>

                    <div class="mt-8 grid grid-cols-4 gap-3 text-center">
                        <a href="tel:0550000000" class="bg-blue-50 text-blue-600 rounded-2xl py-3"><i class="fa-solid fa-phone"></i></a>
                        <a href="https://wa.me/213550000000" target="_blank" class="bg-emerald-50 text-emerald-600 rounded-2xl py-3"><i class="fa-brands fa-whatsapp"></i></a>
                        <a href="#" class="bg-blue-50 text-blue-600 rounded-2xl py-3"><i class="fa-brands fa-facebook-f"></i></a>
                        <a href="#" class="bg-sky-50 text-sky-600 rounded-2xl py-3"><i class="fa-brands fa-facebook-messenger"></i></a>
                    </div>
                </div>
            </aside>
        `);
    }

    function ensureCategoriesModal() {
        if (document.getElementById("zaloCategoriesModal")) return;

        document.body.insertAdjacentHTML("beforeend", `
            <div id="zaloCategoriesModal" class="zalo-modal-backdrop">
                <div class="zalo-order-modal max-h-[85vh] overflow-auto">
                    <div class="flex items-center justify-between mb-5">
                        <h3 class="text-xl font-black text-slate-900">جميع الفئات</h3>
                        <button onclick="closeZaloCategories()" class="w-10 h-10 rounded-2xl bg-slate-100 text-slate-500">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>

                    <div class="space-y-2">
                        ${CATS.map(c => `
                            <button onclick="selectZaloCategory('${c.id}')" class="w-full bg-slate-50 hover:bg-emerald-50 p-4 rounded-2xl flex items-center justify-between">
                                <div class="flex items-center gap-3">
                                    <div class="w-11 h-11 rounded-2xl bg-white text-emerald-600 flex items-center justify-center shadow-sm">
                                        <i class="fa-solid ${c.icon}"></i>
                                    </div>
                                    <span class="font-black text-sm text-slate-800">${c.label}</span>
                                </div>
                                <i class="fa-solid fa-chevron-left text-slate-300"></i>
                            </button>
                        `).join("")}
                    </div>
                </div>
            </div>
        `);
    }

    function ensureOrderModal() {
        if (document.getElementById("zaloOrderModal")) return;

        document.body.insertAdjacentHTML("beforeend", `
            <div id="zaloOrderModal" class="zalo-modal-backdrop">
                <div class="zalo-order-modal">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-xl font-black text-slate-900">طلب المنتج</h3>
                        <button onclick="closeZaloOrder()" class="w-10 h-10 rounded-2xl bg-slate-100 text-slate-500">
                            <i class="fa-solid fa-xmark"></i>
                        </button>
                    </div>

                    <div id="zaloOrderContent"></div>
                </div>
            </div>
        `);
    }

    function productCard(item, index) {
        const image = safeVal(item.img || item.imgUrl);
        const name = safeVal(item.item || item.name);
        const shop = safeVal(item.shopName || item.shop);
        const price = safeVal(item.price) || "السعر عند الطلب";

        return `
            <div class="bg-white border border-slate-100 rounded-3xl p-3 shadow-sm zalo-card-active transition">
                <div class="relative">
                    <div class="aspect-square rounded-2xl overflow-hidden bg-slate-50 mb-3">
                        ${imgBox(image)}
                    </div>

                    <button class="absolute top-2 left-2 w-10 h-10 bg-white/90 rounded-2xl shadow text-emerald-600 flex items-center justify-center">
                        <i class="fa-regular fa-heart"></i>
                    </button>
                </div>

                <h4 class="font-black text-[12px] text-slate-900 leading-relaxed line-clamp-2 min-h-[34px]">${name}</h4>
                <p class="text-[10px] text-slate-400 font-bold mt-1 truncate">${shop}</p>

                <div class="flex items-center justify-between mt-3">
                    <span class="text-emerald-600 font-black text-xs">متوفر</span>
                    <span class="text-orange-600 font-black text-sm">${price}</span>
                </div>

                <button onclick="openZaloOrder(${index})" class="w-full mt-3 bg-emerald-600 text-white py-2.5 rounded-2xl text-xs font-black shadow-lg shadow-emerald-100">
                    <i class="fa-solid fa-cart-shopping ml-1"></i>
                    اطلب الآن
                </button>
            </div>
        `;
    }

    function renderCommerceProducts(data, targetId) {
        const target = document.getElementById(targetId);
        if (!target) return;

        if (!Array.isArray(data) || !data.length) {
            target.innerHTML = `
                <div class="bg-white border border-dashed border-slate-200 rounded-3xl p-8 text-center text-slate-400 font-bold text-sm">
                    لا توجد منتجات حالياً في هذا القسم
                </div>
            `;
            return;
        }

        window.__zaloCurrentProducts = data;

        target.innerHTML = `
            <div class="grid grid-cols-2 gap-3">
                ${data.map((item, i) => productCard(item, i)).join("")}
            </div>
        `;
    }

    function patchRenderHome() {
        if (window.__zaloRenderPatched) return;
        window.__zaloRenderPatched = true;

        const oldRenderHome = window.renderHome;

        window.renderHome = function () {
            const data = getGlobalData();

            if (!data.length && typeof oldRenderHome === "function") {
                return oldRenderHome();
            }

            renderCommerceProducts(data.slice(0, 12), "featuredBox");
        };
    }

    function patchOpenCategory() {
        const oldOpenCategory = window.openCategory;

        window.openCategory = function (cat) {
            const data = getGlobalData();

            const viewHome = document.getElementById("view-home");
            const viewList = document.getElementById("view-list");
            const viewShop = document.getElementById("view-shop-profile");
            const backBtn = document.getElementById("backBtn");

            if (viewHome) viewHome.classList.add("hidden");
            if (viewShop) viewShop.classList.add("hidden");
            if (viewList) viewList.classList.remove("hidden");
            if (backBtn) backBtn.classList.remove("hidden");

            const title = document.getElementById("listTitle");
            const catObj = CATS.find(c => c.id === cat);
            if (title) title.textContent = catObj ? catObj.label : "المنتجات";

            const filtered = cat === "all" ? data : data.filter(i => i.category === cat);

            renderCommerceProducts(filtered, "listBox");
        };
    }

    function patchOpenShop() {
        const oldOpenShop = window.openShop;

        window.openShop = function (id) {
            const shops = getGlobalShops();
            const data = getGlobalData();

            if (!shops.length || !data.length) {
                if (typeof oldOpenShop === "function") return oldOpenShop(id);
                return;
            }

            let shop = null;

            try {
                shop = shops.find(s => s.name && s.name.endsWith("/" + id));
            } catch (e) {}

            if (!shop) {
                if (typeof oldOpenShop === "function") return oldOpenShop(id);
                return;
            }

            const sf = shop.fields || {};
            const get = (field) => {
                if (typeof getVal === "function") return getVal(field);
                return field ? (field.stringValue || "") : "";
            };

            const shopName = get(sf.name);
            const phone = get(sf.phone);
            const address = get(sf.address);
            const website = get(sf.websiteUrl) || ZALO_STORE_URL;

            const prods = data.filter(p => p.shopId === id);

            const viewHome = document.getElementById("view-home");
            const viewList = document.getElementById("view-list");
            const viewShop = document.getElementById("view-shop-profile");
            const backBtn = document.getElementById("backBtn");

            if (viewHome) viewHome.classList.add("hidden");
            if (viewList) viewList.classList.add("hidden");
            if (viewShop) viewShop.classList.remove("hidden");
            if (backBtn) backBtn.classList.remove("hidden");

            const header = document.getElementById("shopProfileHeader");
            if (header) {
                header.innerHTML = `
                    <div class="bg-gradient-to-br from-emerald-700 to-emerald-500 p-7 rounded-[36px] text-white shadow-xl shadow-emerald-100">
                        <h2 class="text-3xl font-black mb-2">${shopName}</h2>
                        <p class="text-sm text-emerald-50 font-bold mb-5">
                            <i class="fa-solid fa-location-dot ml-1"></i>
                            ${address || "الجزائر"}
                        </p>

                        <div class="grid grid-cols-3 gap-2">
                            ${phone ? `
                                <a href="tel:${phone}" class="bg-white text-emerald-700 py-3 rounded-2xl text-center font-black text-xs">
                                    <i class="fa-solid fa-phone ml-1"></i> اتصال
                                </a>
                                <a href="https://wa.me/${normalizePhone(phone)}" target="_blank" class="bg-emerald-400 text-white py-3 rounded-2xl text-center font-black text-xs">
                                    <i class="fa-brands fa-whatsapp ml-1"></i> واتساب
                                </a>
                            ` : `
                                <span class="bg-white/20 py-3 rounded-2xl text-center font-black text-xs col-span-2">لا يوجد رقم</span>
                            `}
                            <a href="${website}" target="_blank" class="bg-slate-900 text-white py-3 rounded-2xl text-center font-black text-xs">
                                <i class="fa-solid fa-globe ml-1"></i> الموقع
                            </a>
                        </div>
                    </div>
                `;
            }

            const count = document.getElementById("shopProdCount");
            if (count) count.textContent = prods.length + " منتج";

            renderCommerceProducts(prods, "shopProductsGrid");

            window.scrollTo({ top: 0, behavior: "smooth" });
        };
    }

    func
