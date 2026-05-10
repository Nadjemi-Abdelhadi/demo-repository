// ═══════════════════════════════════════════
// 🔗 ZaLo Smart - ربط التطبيق بـ Firebase
// ═══════════════════════════════════════════
// هذا الملف يقرأ المتاجر والمنتجات من Firebase
// ويعرضها في التطبيق الرئيسي (index.html)
// ═══════════════════════════════════════════

// Firebase SDK imports
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import { getFirestore, collection, getDocs, query, orderBy, where } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// تهيئة Firebase
const app = initializeApp(FIREBASE_CONFIG);
const db = getFirestore(app);

// ═══════════════════════════════════════════
// 1. جلب جميع المتاجر من Firebase
// ═══════════════════════════════════════════
async function fetchShopsFromFirebase() {
    try {
        const q = query(collection(db, 'shops'));
        const snapshot = await getDocs(q);
        
        const shops = [];
        snapshot.forEach(doc => {
            shops.push({ id: doc.id, ...doc.data() });
        });

        console.log('✅ تم جلب ' + shops.length + ' متجر من Firebase');
        return shops;
    } catch (error) {
        console.error('❌ خطأ في جلب المتاجر:', error);
        return [];
    }
}

// ═══════════════════════════════════════════
// 2. جلب منتجات متجر معين
// ═══════════════════════════════════════════
async function fetchProductsByShop(shopId) {
    try {
        const q = query(
            collection(db, 'products'),
            where('shopId', '==', shopId)
        );
        const snapshot = await getDocs(q);
        
        const products = [];
        snapshot.forEach(doc => {
            products.push({ id: doc.id, ...doc.data() });
        });

        return products;
    } catch (error) {
        console.error('❌ خطأ في جلب المنتجات:', error);
        return [];
    }
}

// ═══════════════════════════════════════════
// 3. جلب جميع المنتجات
// ═══════════════════════════════════════════
async function fetchAllProducts() {
    try {
        const q = query(collection(db, 'products'));
        const snapshot = await getDocs(q);
        
        const products = [];
        snapshot.forEach(doc => {
            products.push({ id: doc.id, ...doc.data() });
        });

        console.log('✅ تم جلب ' + products.length + ' منتج من Firebase');
        return products;
    } catch (error) {
        console.error('❌ خطأ في جلب المنتجات:', error);
        return [];
    }
}

// ═══════════════════════════════════════════
// 4. تحويل بيانات Firebase لصيغة التطبيق
// ═══════════════════════════════════════════
async function loadFirebaseData() {
    const shops = await fetchShopsFromFirebase();
    const products = await fetchAllProducts();

    // تحويل البيانات لصيغة allData التي يفهمها التطبيق
    const allData = products.map(product => {
        const shop = shops.find(s => s.id === product.shopId);
        
        return {
            id: product.id,
            shop: shop?.name || 'متجر غير معروف',
            item: product.name || '',
            price: product.price || '',
            category: shop?.category || 'other',
            imgUrl: product.imgUrl || '',
            phone: shop?.phone || '',
            address: shop?.address || '',
            shopId: product.shopId || ''
        };
    });

    // إضافة المتاجر التي ليس لها منتجات
    shops.forEach(shop => {
        const hasProducts = products.some(p => p.shopId === shop.id);
        if (!hasProducts) {
            allData.push({
                id: 'shop-' + shop.id,
                shop: shop.name,
                item: shop.name,
                price: '',
                category: shop.category || 'other',
                imgUrl: '',
                phone: shop.phone || '',
                address: shop.address || '',
                shopId: shop.id
            });
        }
    });

    console.log('✅ Firebase Sync: ' + allData.length + ' عنصر جاهز');
    return { shops, products, allData };
}

// ═══════════════════════════════════════════
// 5. تهيئة التطبيق الرئيسي مع Firebase
// ═══════════════════════════════════════════
async function initFirebaseSync() {
    try {
        const statusEl = document.getElementById('dataStatus');
        if (statusEl) {
            statusEl.innerHTML = `
                <span class="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span>
                <span>جاري تحميل البيانات من السيرفر...</span>
            `;
        }

        const { shops, products, allData: firebaseData } = await loadFirebaseData();

        if (firebaseData.length > 0) {
            // استبدال البيانات التجريبية بالبيانات الحقيقية
            if (typeof window.allData !== 'undefined') {
                window.allData = firebaseData;
            }

            // تحديث الإحصائيات
            updateStats(shops.length, firebaseData.length);

            // إعادة رسم الواجهة
            if (typeof renderAll === 'function') renderAll();
            if (typeof renderCategories === 'function') renderCategories();
            if (typeof renderFeatured === 'function') renderFeatured();

            if (statusEl) {
                statusEl.innerHTML = `
                    <span class="w-2 h-2 rounded-full bg-emerald-500"></span>
                    <span>تم تحميل ${firebaseData.length} عنصر من ${shops.length} متجر</span>
                `;
            }

            console.log('🎉 Firebase Sync Complete!');
        } else {
            if (statusEl) {
                statusEl.innerHTML = `
                    <span class="w-2 h-2 rounded-full bg-orange-500"></span>
                    <span>لا توجد بيانات - أضف متاجر من لوحة التحكم</span>
                `;
            }
        }

        return firebaseData;

    } catch (error) {
        console.error('❌ Firebase Sync Error:', error);
        
        const statusEl = document.getElementById('dataStatus');
        if (statusEl) {
            statusEl.innerHTML = `
                <span class="w-2 h-2 rounded-full bg-red-500"></span>
                <span>خطأ في الاتصال - يتم عرض نسخة محفوظة</span>
            `;
        }

        return [];
    }
}

// ═══════════════════════════════════════════
// 6. تحديث الإحصائيات في الواجهة
// ═══════════════════════════════════════════
function updateStats(shopsCount, productsCount) {
    const statsBox = document.getElementById('statsBox');
    if (!statsBox) return;

    const cats = new Set();
    if (window.allData) {
        window.allData.forEach(item => {
            if (item.category) cats.add(item.category);
        });
    }

    statsBox.innerHTML = `
        <div class="bg-white/15 rounded-3xl p-3 text-center">
            <div class="text-xl font-black">${shopsCount}</div>
            <div class="text-[10px] text-blue-100">متجر</div>
        </div>
        <div class="bg-white/15 rounded-3xl p-3 text-center">
            <div class="text-xl font-black">${productsCount}</div>
            <div class="text-[10px] text-blue-100">منتج</div>
        </div>
        <div class="bg-white/15 rounded-3xl p-3 text-center">
            <div class="text-xl font-black">${cats.size || Object.keys(CATEGORIES).length}</div>
            <div class="text-[10px] text-blue-100">قسم</div>
        </div>
    `;
}

// ═══════════════════════════════════════════
// جعل الدوال متاحة عالمياً
// ═══════════════════════════════════════════
window.fetchShopsFromFirebase = fetchShopsFromFirebase;
window.fetchProductsByShop = fetchProductsByShop;
window.fetchAllProducts = fetchAllProducts;
window.loadFirebaseData = loadFirebaseData;
window.initFirebaseSync = initFirebaseSync;

console.log('✅ Firebase Sync module loaded');
