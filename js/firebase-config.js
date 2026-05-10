// ═══════════════════════════════════════════
// 🔥 ZaLo Smart - إعدادات Firebase المشتركة
// ═══════════════════════════════════════════
// هذا الملف يُستخدم في كل صفحات المشروع
// لا تعدّل هذا الملف إلا إذا تغيّر مشروع Firebase
// ═══════════════════════════════════════════

const FIREBASE_CONFIG = {
    apiKey: "AIzaSyBJ3T-jWd_nj3FYCtzewRl-d1yimGtsryc",
    authDomain: "zalo-smart.firebaseapp.com",
    projectId: "zalo-smart",
    storageBucket: "zalo-smart.firebasestorage.app",
    messagingSenderId: "430326151788",
    appId: "1:430326151788:web:e4f94437946221429f3649"
};

// إعدادات التطبيق العامة
const APP_CONFIG = {
    CITY: 'المنيعة',
    CURRENCY: 'دج',
    COUNTRY_CODE: '213',
    APP_NAME: 'ZaLo Smart',
    VERSION: '2.0'
};

// أسماء الأقسام
const CATEGORIES = {
    electronics: {
        label: 'هواتف وإلكترونيات',
        icon: 'fa-mobile-screen-button',
        color: 'blue'
    },
    restaurants: {
        label: 'مطاعم ومقاهي',
        icon: 'fa-utensils',
        color: 'orange'
    },
    fashion: {
        label: 'ملابس وموضة',
        icon: 'fa-shirt',
        color: 'pink'
    },
    cars: {
        label: 'قطع غيار سيارات',
        icon: 'fa-car',
        color: 'emerald'
    },
    services: {
        label: 'خدمات وصيانة',
        icon: 'fa-screwdriver-wrench',
        color: 'violet'
    },
    building: {
        label: 'مواد البناء',
        icon: 'fa-hammer',
        color: 'slate'
    }
};

// دالة مساعدة لاسم القسم
function getCategoryLabel(key) {
    return CATEGORIES[key]?.label || 'قسم آخر';
}

// دالة مساعدة لأيقونة القسم
function getCategoryIcon(key) {
    return CATEGORIES[key]?.icon || 'fa-layer-group';
}

// دالة تنسيق السعر
function formatPrice(price) {
    const p = String(price || '').trim();
    if (!p) return 'السعر عند الطلب';
    if (p.includes('دج') || p.includes('DA')) return p;
    return p + ' ' + APP_CONFIG.CURRENCY;
}

// دالة تنسيق رقم الهاتف
function formatPhone(phone) {
    let p = String(phone || '').replace(/[^\d+]/g, '');
    if (!p) return '';
    if (p.startsWith('0')) return '+' + APP_CONFIG.COUNTRY_CODE + p.slice(1);
    return p;
}

console.log('✅ Firebase Config loaded - ZaLo Smart v' + APP_CONFIG.VERSION);
