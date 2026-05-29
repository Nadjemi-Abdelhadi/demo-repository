// 1. استيراد دوال Firebase الأساسية (النسخة 10)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getFirestore, collection, getDocs } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// 2. إعدادات مشروعك zalo-smart (انسخها تماماً كما هي في صورتك الثالثة)
const firebaseConfig = {
  apiKey: "ضع_مفتاح_apiKey_الخاص_بك_هنا", // انسخه من حسابك
  authDomain: "zalo-smart.firebaseapp.com",
  projectId: "zalo-smart",
  storageBucket: "zalo-smart.firebasestorage.app",
  messagingSenderId: "430326151788",
  appId: "1:430326151788:web:e4f94437946221429f3649"
};

// 3. تهيئة Firebase وقاعدة البيانات
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 4. دالة لجلب المحلات من Firestore وعرضها
async function loadShops() {
    const shopsContainer = document.getElementById('shops-container');
    
    try {
        // الاتصال بجدول shops
        const querySnapshot = await getDocs(collection(db, "shops"));
        
        // تفريغ الحاوية من كلمة "جاري التحميل"
        shopsContainer.innerHTML = '';

        // المرور على كل محل في قاعدة البيانات
        querySnapshot.forEach((doc) => {
            const shopData = doc.data();
            
            // استخدام صورة افتراضية إذا كان حقل imgUrl فارغاً
            const imageUrl = shopData.imgUrl ? shopData.imgUrl : 'https://via.placeholder.com/150?text=بدون+شعار';

            // إنشاء بطاقة المحل
            const shopCard = `
                <div class="shop-card" onclick="window.location.href='shop_details.html?id=${doc.id}'">
                    <img src="${imageUrl}" alt="${shopData.name}">
                    <div class="shop-name">${shopData.name}</div>
                    <div class="shop-baladiya">${shopData.baladiya}</div>
                    <div class="shop-baladiya" style="font-size: 0.8em;">الولاية: ${shopData.wilaya}</div>
                </div>
            `;
            
            // إضافة البطاقة إلى الصفحة
            shopsContainer.innerHTML += shopCard;
        });

        if (querySnapshot.empty) {
            shopsContainer.innerHTML = '<p>لا توجد محلات مضافة حالياً.</p>';
        }

    } catch (error) {
        console.error("خطأ في جلب المحلات: ", error);
        shopsContainer.innerHTML = '<p>حدث خطأ أثناء تحميل المحلات. تأكد من اتصالك بالإنترنت.</p>';
    }
}

// تشغيل الدالة عند فتح الصفحة
loadShops();
              
