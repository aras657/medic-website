// ============================================
// 📱 کدهای اصلی سایت Medic
// ============================================

console.log("🚑 سایت واحد Medic بارگذاری شد!");

// وقتی صفحه کاملاً لود شد
document.addEventListener('DOMContentLoaded', function() {
    console.log("✅ DOM آماده است");
    
    // شمارنده آنلاین (تصادفی)
    updateOnlineCount();
    
    // تنظیم دکمه ورود
    setupLoginButton();
    
    // تنظیم کلیک روی دکمه‌ها
    setupButtons();
    
    // نمایش پیام خوش‌آمدگویی
    setTimeout(showWelcomeMessage, 1000);
});

// ================= توابع اصلی =================

// نمایش پیام خوش‌آمد
function showWelcomeMessage() {
    console.log("👋 خوش آمدید به واحد Medic!");
    // می‌تونی این خط رو فعال کنی اگر می‌خواهی آلرت نشان بده
    // alert("به سایت واحد Medic خوش آمدید!\n\nنسخه آزمایشی ۱.۰");
}

// آپدیت شمارنده آنلاین
function updateOnlineCount() {
    const onlineElement = document.getElementById('online-count');
    if (onlineElement) {
        // عدد تصادفی بین ۳ تا ۱۲
        const onlineCount = Math.floor(Math.random() * 10) + 3;
        onlineElement.textContent = `${onlineCount} نفر آنلاین`;
        
        // هر ۱۰ ثانیه آپدیت کن (برای نمایش پویا)
        setInterval(() => {
            const change = Math.random() > 0.5 ? 1 : -1;
            const newCount = Math.max(3, onlineCount + change);
            onlineElement.textContent = `${newCount} نفر آنلاین`;
        }, 10000);
    }
}

// تنظیم دکمه ورود
function setupLoginButton() {
    const authBtn = document.getElementById('authBtn');
    if (authBtn) {
        authBtn.addEventListener('click', function() {
            console.log("دکمه ورود کلیک شد");
            window.location.href = 'auth.html';
        });
    }
}

// تنظیم کلیه دکمه‌ها
function setupButtons() {
    // دکمه‌های CTA
    const ctaButtons = document.querySelectorAll('.cta-btn');
    ctaButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            console.log(`دکمه ${this.textContent} کلیک شد`);
        });
    });
    
    // دکمه‌های کوچک
    const smallButtons = document.querySelectorAll('.small-btn');
    smallButtons.forEach(btn => {
        btn.addEventListener('click', function(e) {
            console.log(`دکمه کوچک ${this.textContent} کلیک شد`);
        });
    });
}

// ================= توابع کاربردی =================

// تست سایت
function testSite() {
    const tests = [
        "✅ سایت بارگذاری شد",
        "✅ استایل‌ها اعمال شد",
        "✅ جاوااسکریپت فعال است",
        "✅ لینک‌ها کار می‌کنند",
        "✅ واحد Medic آماده خدمات‌رسانی!"
    ];
    
    const message = tests.join('\n');
    alert("🧪 گزارش تست سایت:\n\n" + message);
    
    // تغییر رنگ هدر برای نمایش فعالیت
    const header = document.querySelector('header');
    header.style.borderBottom = '4px solid #2ecc71';
    setTimeout(() => {
        header.style.borderBottom = '4px solid #ff4757';
    }, 2000);
    
    return true;
}

// نمایش پیام "در حال توسعه"
function showComingSoon() {
    const messages = [
        "این بخش به زودی فعال می‌شود!",
        "در حال توسعه... لطفاً صبر کنید",
        "به زودی با امکانات کامل",
        "آماده‌سازی بخش مورد نظر"
    ];
    
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    alert(`🚧 ${randomMessage}\n\nنسخه بعدی: به‌زودی`);
    return false;
}

// شبیه‌سازی تماس اضطراری
function simulateEmergency() {
    const locations = [
        "می‌دان وینسنت",
        "فرودگاه بین‌المللی لوس سانتوس",
        "بندرگاه",
        "محله راکفورد هیلز",
        "مرکز شهر"
    ];
    
    const injuries = [
        "تصادف خودرو",
        "سقوط از ارتفاع",
        "زخم گلوله",
        "حمله قلبی",
        "مسمومیت"
    ];
    
    const randomLocation = locations[Math.floor(Math.random() * locations.length)];
    const randomInjury = injuries[Math.floor(Math.random() * injuries.length)];
    
    const emergencyMessage = `
🚨 **تماس اضطراری شبیه‌سازی شده**
    
📍 مکان: ${randomLocation}
🤕 نوع حادثه: ${randomInjury}
👥 تعداد مصدوم: ${Math.floor(Math.random() * 3) + 1}
⏱️ زمان تخمینی رسیدن: ${Math.floor(Math.random() * 5) + 2} دقیقه
    
✅ واحد Medic در راه است!
`;
    
    alert(emergencyMessage);
    
    // پخش صدای اضطراری (اگر مرورگر اجازه بده)
    try {
        const audio = new Audio('https://assets.mixkit.co/sfx/preview/mixkit-city-alert-siren-1007.mp3');
        audio.volume = 0.3;
        audio.play().catch(e => console.log("صدا پخش نشد:", e));
    } catch (e) {
        console.log("خطا در پخش صدا:", e);
    }
}

// تغییر وضعیت آنلاین (برای نمایش)
function toggleOnlineStatus() {
    const onlineElement = document.getElementById('online-count');
    if (onlineElement) {
        const currentText = onlineElement.textContent;
        if (currentText.includes("آنلاین")) {
            onlineElement.textContent = "آفلاین - در حال استراحت";
            onlineElement.style.color = "#ff6b6b";
        } else {
            const onlineCount = Math.floor(Math.random() * 10) + 3;
            onlineElement.textContent = `${onlineCount} نفر آنلاین`;
            onlineElement.style.color = "#51cf66";
        }
    }
}

// نمایش تاریخ و زمان سرور
function showServerTime() {
    const now = new Date();
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    };
    
    const persianDate = now.toLocaleDateString('fa-IR', options);
    alert(`🕐 زمان سرور:\n${persianDate}\n\n⏰ ساعت بازی: ${Math.floor(Math.random() * 24)}:${Math.floor(Math.random() * 60).toString().padStart(2, '0')}`);
}

// ================= رویدادهای صفحه =================

// وقتی کاربر می‌خواهد صفحه رو ترک کند
window.addEventListener('beforeunload', function(e) {
    console.log("👋 کاربر در حال ترک سایت است");
    // اینجا می‌تونی پیام ذخیره نشده‌ها رو چک کنی
});

// وقتی اندازه پنجره تغییر می‌کند
window.addEventListener('resize', function() {
    console.log(`📱 اندازه پنجره: ${window.innerWidth}x${window.innerHeight}`);
});

// ================= راهنمای توسعه =================
/*
برای توسعه بیشتر:

۱. اضافه کردن Firebase:
   - خطوط Firebase SDK را به index.html اضافه کنید
   - کانفیگ پروژه خود را در app.js قرار دهید
   - توابع احراز هویت را پیاده‌سازی کنید

۲. اضافه کردن صفحات بیشتر:
   - dashboard.html برای پنل کاربری
   - profile.html برای پروفایل کاربران
   - admin.html برای مدیریت

۳. ارتباط با سرور بازی:
   - WebSocket برای وضعیت زنده
   - API برای دریافت اطلاعات پرسنل
*/

console.log("🚀 آماده برای توسعه بیشتر...");