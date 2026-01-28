/**
 * تنظیمات پیکربندی سیستم Medic
 */

const MedicConfig = {
    // تنظیمات عمومی
    version: '2.2.0',
    environment: 'production', // development, staging, production
    debug: false,
    
    // تنظیمات API
    api: {
        baseURL: 'https://api.medic-system.com',
        timeout: 30000,
        retryAttempts: 3
    },
    
    // تنظیمات ذخیره‌سازی
    storage: {
        prefix: 'medic_',
        defaultTTL: 24 * 60 * 60 * 1000, // 24 ساعت
        maxItems: {
            applications: 1000,
            uploads: 500,
            logs: 10000
        }
    },
    
    // تنظیمات امنیتی
    security: {
        passwordMinLength: 8,
        passwordRequirements: {
            uppercase: true,
            lowercase: true,
            numbers: true,
            specialChars: true
        },
        maxLoginAttempts: 5,
        lockTime: 15 * 60 * 1000, // 15 دقیقه
        sessionTimeout: 30 * 60 * 1000 // 30 دقیقه
    },
    
    // تنظیمات پنل مدیریت
    admin: {
        defaultPassword: 'medic2024', // پس از اولین ورود تغییر کند
        autoLogout: true,
        backupInterval: 24 * 60 * 60 * 1000 // 24 ساعت
    },
    
    // تنظیمات فرم‌ها
    forms: {
        validation: {
            gameUsername: {
                required: true,
                minLength: 3,
                maxLength: 20,
                pattern: /^[a-zA-Z0-9_]+$/
            },
            discordId: {
                required: false,
                pattern: /^.{3,32}#[0-9]{4}$/
            }
        }
    },
    
    // تنظیمات نوتیفیکیشن
    notifications: {
        position: 'top-right',
        duration: 5000,
        maxVisible: 5
    },
    
    // تنظیمات تم
    themes: {
        dark: {
            name: 'تاریک',
            colors: {
                primary: '#0a1929',
                secondary: '#132f4c',
                accent: '#ff4757'
            }
        },
        light: {
            name: 'روشن',
            colors: {
                primary: '#f8f9fa',
                secondary: '#e9ecef',
                accent: '#dc3545'
            }
        }
    },
    
    // تنظیمات زبان
    language: {
        default: 'fa',
        supported: ['fa', 'en'],
        rtl: true
    },
    
    // تنظیمات ویژگی‌ها
    features: {
        ratingSystem: true,
        ticketSystem: true,
        analytics: true,
        backupRestore: true,
        dragDrop: true,
        keyboardShortcuts: true
    },
    
    /**
     * دریافت تنظیمات
     */
    get(key) {
        const keys = key.split('.');
        let value = this;
        
        for (const k of keys) {
            if (value && typeof value === 'object' && k in value) {
                value = value[k];
            } else {
                return null;
            }
        }
        
        return value;
    },
    
    /**
     * تنظیم مقدار
     */
    set(key, value) {
        const keys = key.split('.');
        let obj = this;
        
        for (let i = 0; i < keys.length - 1; i++) {
            if (!obj[keys[i]] || typeof obj[keys[i]] !== 'object') {
                obj[keys[i]] = {};
            }
            obj = obj[keys[i]];
        }
        
        obj[keys[keys.length - 1]] = value;
        return true;
    },
    
    /**
     * بررسی محیط
     */
    isDevelopment() {
        return this.environment === 'development';
    },
    
    /**
     * فعال کردن حالت دیباگ
     */
    enableDebug() {
        this.debug = true;
        console.log('🔧 حالت دیباگ فعال شد');
    },
    
    /**
     * غیرفعال کردن حالت دیباگ
     */
    disableDebug() {
        this.debug = false;
        console.log('🔧 حالت دیباگ غیرفعال شد');
    },
    
    /**
     * دریافت همه تنظیمات
     */
    getAll() {
        return { ...this };
    },
    
    /**
     * ذخیره تنظیمات در localStorage
     */
    saveToStorage() {
        try {
            const configCopy = { ...this };
            // حذف توابع قبل از ذخیره
            delete configCopy.get;
            delete configCopy.set;
            delete configCopy.saveToStorage;
            delete configCopy.loadFromStorage;
            
            localStorage.setItem('medic_config', JSON.stringify(configCopy));
            return true;
        } catch (error) {
            console.error('خطا در ذخیره تنظیمات:', error);
            return false;
        }
    },
    
    /**
     * بارگذاری تنظیمات از localStorage
     */
    loadFromStorage() {
        try {
            const saved = localStorage.getItem('medic_config');
            if (saved) {
                const parsed = JSON.parse(saved);
                Object.assign(this, parsed);
                return true;
            }
        } catch (error) {
            console.error('خطا در بارگذاری تنظیمات:', error);
        }
        return false;
    }
};

// بارگذاری تنظیمات ذخیره شده
MedicConfig.loadFromStorage();

// اتصال به window
window.MedicConfig = MedicConfig;

// صادر کردن برای ماژول‌ها
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MedicConfig;
}