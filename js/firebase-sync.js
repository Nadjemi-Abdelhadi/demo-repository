// ═══════════════════════════════════════════
// 🔗 ZaLo Smart - ربط التطبيق بـ Firebase
// ═══════════════════════════════════════════

async function initFirebaseSync() {
    try {
        // تحميل Firebase
        const { initializeApp } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js");
        const { getFirestore, collection, getDocs, query, where } = await import("https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js");

        // تهيئة Firebase
        const app = initializeApp(FIREBASE_CONFIG);
        const db = getFirestore(app);

        // تحديث الحالة
        const statusEl = document.getElementById('dataStatus');
        if (statusEl) {
            statusEl.innerHTML = '<span class="w-2 h-2 rounded-full bg-yellow-500 animate-pulse"></span><span>جاري تحميل البيانات...</span>';
        }

        // 1. جلب المتاجر
        const shopsSnap = await getDocs(query(collection(db, 'shops')));
        const shops = [];
        shopsSnap.forEach(doc => shops.push({ id: doc.id, ...doc.data() }));

        // 2. جلب المنتجات
        const productsSnap = await getDocs(query(collection(db, 'products')));
        const products = [];
        productsSnap.forEach(doc => products.push({ id: doc.id, ...doc.data() }));

        console.log('✅ Firebase: ' + shops.length + ' متجر، ' + products.length + ' منتج');

        // 3. تحويل البيانات لصيغة التطبيق
        const firebaseData = [];

        products.forEach(product => {
            const shop = shops.find(s => s.id === product.shopId);
            firebaseData.push({
                id: product.id,
                shop: shop ? shop.name : 'متجر',
                item: product.name || '',
                price: product.price || '',
                category: shop ? shop.category : 'other',
                imgUrl: product.imgUrl || '',
                phone: shop ? shop.phone : '',
                address: shop ? shop.address : '',
                shopId: product.shopId || ''
            });
        });

        // إضافة متاجر بدون منتجات
        shops.forEach(shop => {
            const hasProducts = products.some(p => p.shopId === shop.id);
            if (!hasProducts) {
                firebaseData.push({
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

        // 4. استبدال البيانات التجريبية
        if (firebaseData.length > 0) {
            window.allData = firebaseData;

            // تحديث الإحصائيات
            const statsBox = document.getElementById('statsBox');
            if (statsBox) {
                const cats = new Set(firebaseData.map(i => i.category));
                statsBox.innerHTML = `
                    <div class="bg-white/15 rounded-3xl p-3 text-center">
                        <div class="text-xl font-black">${shops.length}</div>
                        <div class="text-[10px] text-blue-100">متجر</div>
                    </div>
                    <div class="bg-white/15 rounded-3xl p-3 text-center">
                        <div class="text-xl font-black">${firebaseData.length}</div>
                        <div class="text-[10px] text-blue-100">منتج</div>
                    </div>
                    <div class="bg-white/15 rounded-3xl p-3 text-center">
                        <div class="text-xl font-black">${cats.size}</div>
                        <div class="text-[10px] text-blue-100">قسم</div>
                    </div>
                `;
            }

            // إعادة رسم الواجهة
            if (typeof renderAll === 'function') renderAll();

            if (statusEl) {
                statusEl.innerHTML = '<span class="w-2 h-2 rounded-full bg-emerald-500"></span><span>✅ تم تحميل ' + firebaseData.length + ' عنصر من ' + shops.length + ' متجر</span>';
            }
        } else {
            if (statusEl) {
                statusEl.innerHTML = '<span class="w-2 h-2 rounded-full bg-orange-500"></span><span>لا توجد بيانات - أضف متاجر من لوحة التحكم</span>';
            }
        }

        console.log('🎉 Firebase Sync Complete!');
        return firebaseData;

    } catch (error) {
        console.error('❌ Firebase Sync Error:', error);
        const statusEl = document.getElementById('dataStatus');
        if (statusEl) {
            statusEl.innerHTML = '<span class="w-2 h-2 rounded-full bg-red-500"></span><span>خطأ في الاتصال - يتم عرض نسخة محفوظة</span>';
        }
        return [];
    }
}

window.initFirebaseSync = initFirebaseSync;
console.log('✅ Firebase Sync module loaded');
