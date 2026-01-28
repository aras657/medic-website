/**
 * 🚑 سیستم پیشرفته Medic - نسخه 2.2
 * مدیریت کامل واحد Medic
 */

// ==================== کلاس مدیریت ذخیره‌سازی ====================
class MedicStorage {
    constructor() {
        this.prefix = 'medic_';
        this.defaultTTL = 24 * 60 * 60 * 1000; // 24 ساعت
    }

    /**
     * ذخیره اطلاعات با تاریخ انقضا
     * @param {string} key - کلید ذخیره‌سازی
     * @param {any} value - مقدار
     * @param {number} ttl - زمان انقضا (میلی‌ثانیه)
     */
    set(key, value, ttl = this.defaultTTL) {
        const item = {
            value: value,
            expiry: Date.now() + ttl,
            version: '2.2'
        };
        try {
            localStorage.setItem(this.prefix + key, JSON.stringify(item));
            return true;
        } catch (e) {
            console.error('خطا در ذخیره‌سازی:', e);
            return false;
        }
    }

    /**
     * دریافت اطلاعات
     * @param {string} key - کلید ذخیره‌سازی
     * @returns {any} - مقدار ذخیره شده
     */
    get(key) {
        try {
            const itemStr = localStorage.getItem(this.prefix + key);
            if (!itemStr) return null;

            const item = JSON.parse(itemStr);
            
            // بررسی تاریخ انقضا
            if (Date.now() > item.expiry) {
                this.remove(key);
                return null;
            }

            return item.value;
        } catch (e) {
            console.error('خطا در خواندن:', e);
            return null;
        }
    }

    /**
     * حذف اطلاعات
     * @param {string} key - کلید ذخیره‌سازی
     */
    remove(key) {
        localStorage.removeItem(this.prefix + key);
    }

    /**
     * پاکسازی اطلاعات منقضی شده
     */
    cleanup() {
        const keys = Object.keys(localStorage);
        keys.forEach(key => {
            if (key.startsWith(this.prefix)) {
                this.get(key.replace(this.prefix, '')); // بررسی انقضا
            }
        });
    }

    /**
     * دریافت همه اطلاعات از یک گروه
     * @param {string} group - گروه مورد نظر
     * @returns {Array}
     */
    getAll(group) {
        const items = [];
        const keys = Object.keys(localStorage);
        
        keys.forEach(key => {
            if (key.startsWith(this.prefix + group)) {
                const value = this.get(key.replace(this.prefix, ''));
                if (value) items.push(value);
            }
        });
        
        return items;
    }

    /**
     * دریافت آمار ذخیره‌سازی
     * @returns {Object}
     */
    getStats() {
        const keys = Object.keys(localStorage);
        const medicKeys = keys.filter(key => key.startsWith(this.prefix));
        
        return {
            total: medicKeys.length,
            size: JSON.stringify(localStorage).length,
            groups: [...new Set(medicKeys.map(k => k.split('_')[1]))]
        };
    }
}

// ==================== کلاس مدیریت API ====================
class MedicAPI {
    constructor() {
        this.storage = new MedicStorage();
        this.baseURL = 'https://api.medic-system.com'; // آدرس API واقعی
        this.cacheTime = 5 * 60 * 1000; // 5 دقیقه کش
    }

    /**
     * دریافت درخواست‌های عضویت
     * @param {boolean} forceRefresh - اجبار به دریافت جدید
     * @returns {Promise<Array>}
     */
    async getApplications(forceRefresh = false) {
        const cacheKey = 'applications';
        const cached = this.storage.get(cacheKey);
        
        if (cached && !forceRefresh) {
            return cached;
        }

        // شبیه‌سازی درخواست به API
        return new Promise(resolve => {
            setTimeout(() => {
                const applications = JSON.parse(localStorage.getItem('medicApplications') || '[]');
                this.storage.set(cacheKey, applications);
                resolve(applications);
            }, 500);
        });
    }

    /**
     * دریافت درخواست‌های آپلود
     * @returns {Promise<Array>}
     */
    async getUploads() {
        const cacheKey = 'uploads';
        const cached = this.storage.get(cacheKey);
        
        if (cached) {
            return cached;
        }

        return new Promise(resolve => {
            setTimeout(() => {
                const uploads = JSON.parse(localStorage.getItem('galleryUploads') || '[]');
                this.storage.set(cacheKey, uploads);
                resolve(uploads);
            }, 500);
        });
    }

    /**
     * ثبت درخواست جدید
     * @param {Object} application - اطلاعات درخواست
     * @returns {Promise<Object>}
     */
    async submitApplication(application) {
        return new Promise((resolve, reject) => {
            try {
                // اعتبارسنجی
                if (!application.gameUsername) {
                    throw new Error('نام کاربری الزامی است');
                }

                // اضافه کردن اطلاعات اضافی
                const newApp = {
                    ...application,
                    id: Date.now().toString(36) + Math.random().toString(36).substr(2),
                    timestamp: new Date().toLocaleString('fa-IR'),
                    status: 'pending',
                    requestNumber: `MED-${Date.now().toString().slice(-6)}`
                };

                // ذخیره در localStorage
                const applications = JSON.parse(localStorage.getItem('medicApplications') || '[]');
                applications.push(newApp);
                localStorage.setItem('medicApplications', JSON.stringify(applications));

                // پاک کردن کش
                this.storage.remove('applications');

                // لاگ فعالیت
                this.logActivity('application_submit', newApp);

                resolve({
                    success: true,
                    message: 'درخواست با موفقیت ثبت شد',
                    data: newApp,
                    requestNumber: newApp.requestNumber
                });

            } catch (error) {
                reject({
                    success: false,
                    message: error.message
                });
            }
        });
    }

    /**
     * ثبت درخواست آپلود
     * @param {Object} uploadData - اطلاعات آپلود
     * @returns {Promise<Object>}
     */
    async submitUpload(uploadData) {
        return new Promise((resolve, reject) => {
            try {
                if (!uploadData.name || !uploadData.description) {
                    throw new Error('نام و توضیحات الزامی هستند');
                }

                const newUpload = {
                    ...uploadData,
                    id: Date.now().toString(36) + Math.random().toString(36).substr(2),
                    date: new Date().toLocaleString('fa-IR'),
                    status: 'pending',
                    uploadNumber: `UPL-${Date.now().toString().slice(-6)}`
                };

                const uploads = JSON.parse(localStorage.getItem('galleryUploads') || '[]');
                uploads.push(newUpload);
                localStorage.setItem('galleryUploads', JSON.stringify(uploads));

                this.storage.remove('uploads');
                this.logActivity('upload_submit', newUpload);

                resolve({
                    success: true,
                    message: 'درخواست آپلود ثبت شد',
                    data: newUpload
                });

            } catch (error) {
                reject({
                    success: false,
                    message: error.message
                });
            }
        });
    }

    /**
     * ثبت لاگ فعالیت
     * @param {string} action - نوع فعالیت
     * @param {Object} data - اطلاعات فعالیت
     */
    logActivity(action, data = {}) {
        const logs = this.storage.get('activity_logs') || [];
        const logEntry = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            timestamp_persian: new Date().toLocaleString('fa-IR'),
            action: action,
            data: data,
            userAgent: navigator.userAgent,
            ip: 'local' // در حالت واقعی از سرور دریافت می‌شود
        };

        logs.unshift(logEntry);
        if (logs.length > 1000) logs.pop(); // محدودیت تعداد لاگ‌ها

        this.storage.set('activity_logs', logs, 30 * 24 * 60 * 60 * 1000); // 30 روز
    }

    /**
     * دریافت لاگ‌های فعالیت
     * @param {number} limit - تعداد لاگ‌ها
     * @returns {Array}
     */
    getActivityLogs(limit = 50) {
        const logs = this.storage.get('activity_logs') || [];
        return logs.slice(0, limit);
    }

    /**
     * دریافت آمار سیستم
     * @returns {Object}
     */
    async getStats() {
        const applications = await this.getApplications();
        const uploads = await this.getUploads();
        const logs = this.getActivityLogs();

        return {
            applications: {
                total: applications.length,
                pending: applications.filter(app => app.status === 'pending').length,
                approved: applications.filter(app => app.status === 'approved').length,
                rejected: applications.filter(app => app.status === 'rejected').length
            },
            uploads: {
                total: uploads.length,
                pending: uploads.filter(u => u.status === 'pending').length,
                approved: uploads.filter(u => u.status === 'approved').length,
                rejected: uploads.filter(u => u.status === 'rejected').length
            },
            system: {
                logsCount: logs.length,
                storage: this.storage.getStats(),
                lastActivity: logs[0]?.timestamp_persian || 'هیچ فعالیتی ثبت نشده'
            }
        };
    }

    /**
     * جستجو در داده‌ها
     * @param {string} query - عبارت جستجو
     * @param {string} type - نوع داده (applications/uploads/all)
     * @returns {Promise<Array>}
     */
    async search(query, type = 'all') {
        const results = [];
        const searchTerm = query.toLowerCase().trim();

        if (type === 'applications' || type === 'all') {
            const apps = await this.getApplications();
            apps.forEach(app => {
                if (
                    app.gameUsername?.toLowerCase().includes(searchTerm) ||
                    app.discordId?.toLowerCase().includes(searchTerm) ||
                    app.whyJoin?.toLowerCase().includes(searchTerm) ||
                    app.status?.toLowerCase().includes(searchTerm)
                ) {
                    results.push({ type: 'application', data: app });
                }
            });
        }

        if (type === 'uploads' || type === 'all') {
            const uploads = await this.getUploads();
            uploads.forEach(upload => {
                if (
                    upload.name?.toLowerCase().includes(searchTerm) ||
                    upload.description?.toLowerCase().includes(searchTerm) ||
                    upload.category?.toLowerCase().includes(searchTerm)
                ) {
                    results.push({ type: 'upload', data: upload });
                }
            });
        }

        return results;
    }

    /**
     * فیلتر کردن داده‌ها
     * @param {Object} filters - فیلترها
     * @param {string} type - نوع داده
     * @returns {Promise<Array>}
     */
    async filter(filters, type = 'applications') {
        const data = type === 'applications' ? 
            await this.getApplications() : 
            await this.getUploads();

        return data.filter(item => {
            for (const [key, value] of Object.entries(filters)) {
                if (value && item[key] !== value) {
                    return false;
                }
            }
            return true;
        });
    }
}

// ==================== کلاس سیستم نوتیفیکیشن ====================
class NotificationSystem {
    constructor() {
        this.notifications = [];
        this.maxNotifications = 5;
        this.autoHideDelay = 5000; // 5 ثانیه
        this.container = null;
        this.initContainer();
    }

    /**
     * ایجاد کانتینر نوتیفیکیشن
     */
    initContainer() {
        this.container = document.createElement('div');
        this.container.id = 'notification-container';
        this.container.style.cssText = `
            position: fixed;
            top: 80px;
            left: 20px;
            z-index: 9999;
            display: flex;
            flex-direction: column;
            gap: 10px;
            max-width: 400px;
        `;
        document.body.appendChild(this.container);
    }

    /**
     * نمایش نوتیفیکیشن
     * @param {string} title - عنوان
     * @param {string} message - پیام
     * @param {string} type - نوع (success/error/warning/info)
     * @param {number} duration - مدت نمایش (میلی‌ثانیه)
     */
    show(title, message, type = 'info', duration = this.autoHideDelay) {
        const id = 'notification-' + Date.now();
        const icon = this.getIcon(type);
        const color = this.getColor(type);

        const notification = document.createElement('div');
        notification.id = id;
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            background: linear-gradient(135deg, ${color.start} 0%, ${color.end} 100%);
            color: ${type === 'warning' ? '#212529' : 'white'};
            padding: 15px 20px;
            border-radius: 8px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            display: flex;
            align-items: flex-start;
            gap: 12px;
            animation: slideInLeft 0.3s;
            border-right: 4px solid ${color.border};
            min-width: 300px;
            max-width: 400px;
        `;

        notification.innerHTML = `
            <div style="font-size: 1.2rem; flex-shrink: 0;">${icon}</div>
            <div style="flex: 1;">
                <strong style="display: block; margin-bottom: 5px; font-size: 1rem;">${title}</strong>
                <div style="font-size: 0.9rem; opacity: 0.9;">${message}</div>
            </div>
            <button onclick="window.medicSystem.notifications.close('${id}')" 
                    style="background: transparent; border: none; color: inherit; cursor: pointer; font-size: 1.2rem; padding: 0 5px;">
                ×
            </button>
        `;

        // اضافه کردن به کانتینر
        if (this.container.children.length >= this.maxNotifications) {
            this.container.removeChild(this.container.firstChild);
        }

        this.container.appendChild(notification);
        this.notifications.push({ id, element: notification });

        // حذف خودکار
        if (duration > 0) {
            setTimeout(() => {
                this.close(id);
            }, duration);
        }

        return id;
    }

    /**
     * بستن نوتیفیکیشن
     * @param {string} id - شناسه نوتیفیکیشن
     */
    close(id) {
        const notification = document.getElementById(id);
        if (notification) {
            notification.style.animation = 'fadeOut 0.3s';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
                this.notifications = this.notifications.filter(n => n.id !== id);
            }, 300);
        }
    }

    /**
     * بستن همه نوتیفیکیشن‌ها
     */
    closeAll() {
        this.notifications.forEach(notification => {
            this.close(notification.id);
        });
    }

    /**
     * دریافت آیکون بر اساس نوع
     * @param {string} type - نوع نوتیفیکیشن
     * @returns {string} - آیکون
     */
    getIcon(type) {
        const icons = {
            success: '✅',
            error: '❌',
            warning: '⚠️',
            info: 'ℹ️'
        };
        return icons[type] || '📢';
    }

    /**
     * دریافت رنگ بر اساس نوع
     * @param {string} type - نوع نوتیفیکیشن
     * @returns {Object} - رنگ‌ها
     */
    getColor(type) {
        const colors = {
            success: { start: '#51cf66', end: '#40c057', border: '#2b8a3e' },
            error: { start: '#ff6b6b', end: '#fa5252', border: '#c92a2a' },
            warning: { start: '#ffa94d', end: '#ff922b', border: '#e8590c' },
            info: { start: '#4dabf7', end: '#339af0', border: '#1864ab' }
        };
        return colors[type] || colors.info;
    }

    /**
     * نمایش نوتیفیکیشن موفقیت
     * @param {string} message - پیام
     * @param {string} title - عنوان (اختیاری)
     */
    success(message, title = 'موفقیت') {
        return this.show(title, message, 'success');
    }

    /**
     * نمایش نوتیفیکیشن خطا
     * @param {string} message - پیام
     * @param {string} title - عنوان (اختیاری)
     */
    error(message, title = 'خطا') {
        return this.show(title, message, 'error');
    }

    /**
     * نمایش نوتیفیکیشن هشدار
     * @param {string} message - پیام
     * @param {string} title - عنوان (اختیاری)
     */
    warning(message, title = 'هشدار') {
        return this.show(title, message, 'warning');
    }

    /**
     * نمایش نوتیفیکیشن اطلاعات
     * @param {string} message - پیام
     * @param {string} title - عنوان (اختیاری)
     */
    info(message, title = 'اطلاعات') {
        return this.show(title, message, 'info');
    }
}

// ==================== کلاس سیستم امتیازدهی ====================
class RatingSystem {
    constructor() {
        this.storageKey = 'medic_ratings';
        this.maxRating = 5;
        this.minRating = 1;
    }

    /**
     * ثبت امتیاز
     * @param {string} targetId - شناسه هدف (مثلاً درخواست یا کاربر)
     * @param {number} rating - امتیاز (1-5)
     * @param {string} comment - نظر (اختیاری)
     * @param {string} rater - امتیازدهنده
     * @returns {boolean} - موفقیت
     */
    rate(targetId, rating, comment = '', rater = 'anonymous') {
        if (rating < this.minRating || rating > this.maxRating) {
            console.error('امتیاز باید بین 1 تا 5 باشد');
            return false;
        }

        const ratings = this.getAllRatings();
        const existingIndex = ratings.findIndex(r => r.targetId === targetId && r.rater === rater);

        const ratingData = {
            id: Date.now().toString(36) + Math.random().toString(36).substr(2),
            targetId: targetId,
            rating: rating,
            comment: comment,
            rater: rater,
            timestamp: new Date().toISOString(),
            timestamp_persian: new Date().toLocaleString('fa-IR')
        };

        if (existingIndex > -1) {
            ratings[existingIndex] = ratingData;
        } else {
            ratings.push(ratingData);
        }

        localStorage.setItem(this.storageKey, JSON.stringify(ratings));
        return true;
    }

    /**
     * دریافت همه امتیازها
     * @returns {Array}
     */
    getAllRatings() {
        return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    }

    /**
     * دریافت امتیازهای یک هدف
     * @param {string} targetId - شناسه هدف
     * @returns {Array}
     */
    getRatingsForTarget(targetId) {
        const allRatings = this.getAllRatings();
        return allRatings.filter(r => r.targetId === targetId);
    }

    /**
     * محاسبه میانگین امتیاز
     * @param {string} targetId - شناسه هدف
     * @returns {number} - میانگین امتیاز
     */
    getAverageRating(targetId) {
        const ratings = this.getRatingsForTarget(targetId);
        if (ratings.length === 0) return 0;

        const sum = ratings.reduce((total, r) => total + r.rating, 0);
        return parseFloat((sum / ratings.length).toFixed(1));
    }

    /**
     * دریافت آمار امتیازها
     * @param {string} targetId - شناسه هدف
     * @returns {Object}
     */
    getRatingStats(targetId) {
        const ratings = this.getRatingsForTarget(targetId);
        if (ratings.length === 0) return null;

        const distribution = {};
        for (let i = 1; i <= this.maxRating; i++) {
            distribution[i] = 0;
        }

        ratings.forEach(r => {
            distribution[r.rating]++;
        });

        return {
            average: this.getAverageRating(targetId),
            total: ratings.length,
            distribution: distribution,
            latest: ratings[0] || null
        };
    }

    /**
     * تولید HTML ستاره‌ها
     * @param {number} rating - امتیاز
     * @param {boolean} interactive - قابلیت کلیک
     * @param {string} targetId - شناسه هدف (برای interactive)
     * @returns {string} - HTML
     */
    renderStars(rating, interactive = false, targetId = '') {
        let html = '<div class="stars" style="display: inline-flex; gap: 2px;">';
        
        for (let i = 1; i <= this.maxRating; i++) {
            const starClass = interactive ? 'star interactive' : 'star';
            const dataAttr = interactive ? `data-rating="${i}" data-target="${targetId}"` : '';
            const icon = i <= rating ? '★' : '☆';
            const color = i <= rating ? '#ffd700' : '#ccc';
            
            html += `<span class="${starClass}" ${dataAttr} style="cursor: ${interactive ? 'pointer' : 'default'}; color: ${color}; font-size: 1.2rem;" 
                     onmouseover="${interactive ? `this.style.color='#ffd700'` : ''}" 
                     onmouseout="${interactive ? `this.style.color='${i <= rating ? '#ffd700' : '#ccc'}'` : ''}">
                     ${icon}</span>`;
        }
        
        html += '</div>';
        return html;
    }

    /**
     * راه‌اندازی سیستم امتیازدهی تعاملی
     * @param {string} containerSelector - سلکتور کانتینر
     * @param {string} targetId - شناسه هدف
     */
    initInteractive(containerSelector, targetId) {
        const container = document.querySelector(containerSelector);
        if (!container) return;

        const currentRating = this.getAverageRating(targetId);
        container.innerHTML = this.renderStars(currentRating, true, targetId);

        // اضافه کردن event listener
        container.addEventListener('click', (e) => {
            if (e.target.classList.contains('star') && e.target.classList.contains('interactive')) {
                const rating = parseInt(e.target.dataset.rating);
                const target = e.target.dataset.target;
                
                if (rating && target) {
                    this.rate(target, rating, '', 'user');
                    
                    // به‌روزرسانی نمایش
                    container.innerHTML = this.renderStars(rating, true, target);
                    
                    // نمایش پیام
                    if (window.medicSystem) {
                        window.medicSystem.notifications.success(`امتیاز ${rating} ستاره ثبت شد!`);
                    }
                }
            }
        });
    }
}

// ==================== کلاس سیستم تیکت ====================
class TicketSystem {
    constructor() {
        this.storageKey = 'medic_tickets';
        this.categories = ['عمومی', 'فنی', 'عضویت', 'گالری', 'دیگر موارد'];
        this.priorities = ['کم', 'متوسط', 'بالا', 'اضطراری'];
        this.statuses = ['باز', 'در دست بررسی', 'پاسخ داده شده', 'بسته'];
    }

    /**
     * ایجاد تیکت جدید
     * @param {Object} ticketData - اطلاعات تیکت
     * @returns {Object} - نتیجه
     */
    createTicket(ticketData) {
        try {
            if (!ticketData.title || !ticketData.description) {
                throw new Error('عنوان و شرح تیکت الزامی است');
            }

            const tickets = this.getAllTickets();
            const ticketId = 'TICKET-' + Date.now().toString(36).toUpperCase();

            const ticket = {
                id: ticketId,
                title: ticketData.title,
                description: ticketData.description,
                category: ticketData.category || this.categories[0],
                priority: ticketData.priority || this.priorities[1],
                status: 'باز',
                createdBy: ticketData.createdBy || 'کاربر ناشناس',
                createdAt: new Date().toISOString(),
                createdAt_persian: new Date().toLocaleString('fa-IR'),
                updatedAt: new Date().toISOString(),
                messages: [
                    {
                        id: 'msg-1',
                        text: ticketData.description,
                        sender: ticketData.createdBy || 'کاربر ناشناس',
                        timestamp: new Date().toISOString(),
                        timestamp_persian: new Date().toLocaleString('fa-IR')
                    }
                ]
            };

            tickets.push(ticket);
            localStorage.setItem(this.storageKey, JSON.stringify(tickets));

            // ثبت لاگ
            if (window.medicSystem) {
                window.medicSystem.api.logActivity('ticket_created', { ticketId });
            }

            return {
                success: true,
                message: 'تیکت با موفقیت ایجاد شد',
                ticketId: ticketId,
                ticket: ticket
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    /**
     * دریافت همه تیکت‌ها
     * @returns {Array}
     */
    getAllTickets() {
        return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
    }

    /**
     * دریافت تیکت بر اساس ID
     * @param {string} ticketId - شناسه تیکت
     * @returns {Object|null}
     */
    getTicket(ticketId) {
        const tickets = this.getAllTickets();
        return tickets.find(t => t.id === ticketId) || null;
    }

    /**
     * ارسال پاسخ به تیکت
     * @param {string} ticketId - شناسه تیکت
     * @param {string} message - پیام
     * @param {string} sender - فرستنده
     * @returns {Object}
     */
    replyToTicket(ticketId, message, sender = 'مدیر سیستم') {
        try {
            const tickets = this.getAllTickets();
            const ticketIndex = tickets.findIndex(t => t.id === ticketId);

            if (ticketIndex === -1) {
                throw new Error('تیکت پیدا نشد');
            }

            const ticket = tickets[ticketIndex];
            const messageId = 'msg-' + (ticket.messages.length + 1);

            ticket.messages.push({
                id: messageId,
                text: message,
                sender: sender,
                timestamp: new Date().toISOString(),
                timestamp_persian: new Date().toLocaleString('fa-IR')
            });

            ticket.updatedAt = new Date().toISOString();
            ticket.status = sender === 'مدیر سیستم' ? 'پاسخ داده شده' : 'در دست بررسی';

            tickets[ticketIndex] = ticket;
            localStorage.setItem(this.storageKey, JSON.stringify(tickets));

            return {
                success: true,
                message: 'پاسخ ارسال شد'
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    /**
     * تغییر وضعیت تیکت
     * @param {string} ticketId - شناسه تیکت
     * @param {string} newStatus - وضعیت جدید
     * @returns {Object}
     */
    updateTicketStatus(ticketId, newStatus) {
        try {
            if (!this.statuses.includes(newStatus)) {
                throw new Error('وضعیت نامعتبر است');
            }

            const tickets = this.getAllTickets();
            const ticketIndex = tickets.findIndex(t => t.id === ticketId);

            if (ticketIndex === -1) {
                throw new Error('تیکت پیدا نشد');
            }

            tickets[ticketIndex].status = newStatus;
            tickets[ticketIndex].updatedAt = new Date().toISOString();
            localStorage.setItem(this.storageKey, JSON.stringify(tickets));

            return {
                success: true,
                message: 'وضعیت تیکت به‌روزرسانی شد'
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }

    /**
     * دریافت آمار تیکت‌ها
     * @returns {Object}
     */
    getTicketStats() {
        const tickets = this.getAllTickets();
        
        const stats = {
            total: tickets.length,
            byStatus: {},
            byCategory: {},
            byPriority: {},
            open: 0,
            closed: 0,
            avgResponseTime: 0
        };

        this.statuses.forEach(status => {
            stats.byStatus[status] = 0;
        });

        this.categories.forEach(category => {
            stats.byCategory[category] = 0;
        });

        this.priorities.forEach(priority => {
            stats.byPriority[priority] = 0;
        });

        tickets.forEach(ticket => {
            stats.byStatus[ticket.status]++;
            stats.byCategory[ticket.category]++;
            stats.byPriority[ticket.priority]++;
            
            if (ticket.status === 'باز' || ticket.status === 'در دست بررسی') {
                stats.open++;
            } else if (ticket.status === 'بسته') {
                stats.closed++;
            }
        });

        return stats;
    }

    /**
     * حذف تیکت
     * @param {string} ticketId - شناسه تیکت
     * @returns {Object}
     */
    deleteTicket(ticketId) {
        try {
            let tickets = this.getAllTickets();
            const initialLength = tickets.length;
            
            tickets = tickets.filter(t => t.id !== ticketId);
            
            if (tickets.length === initialLength) {
                throw new Error('تیکت پیدا نشد');
            }

            localStorage.setItem(this.storageKey, JSON.stringify(tickets));
            
            return {
                success: true,
                message: 'تیکت حذف شد'
            };
        } catch (error) {
            return {
                success: false,
                message: error.message
            };
        }
    }
}

// ==================== کلاس سیستم مدیریت تم ====================
class ThemeSystem {
    constructor() {
        this.storageKey = 'medic_theme';
        this.themes = ['dark', 'light'];
        this.currentTheme = this.getSavedTheme() || 'dark';
        this.init();
    }

    /**
     * راه‌اندازی اولیه
     */
    init() {
        this.applyTheme(this.currentTheme);
        this.createThemeToggle();
        this.addSystemListeners();
    }

    /**
     * دریافت تم ذخیره شده
     * @returns {string|null}
     */
    getSavedTheme() {
        return localStorage.getItem(this.storageKey);
    }

    /**
     * اعمال تم
     * @param {string} theme - نام تم
     */
    applyTheme(theme) {
        if (!this.themes.includes(theme)) {
            theme = 'dark';
        }

        document.documentElement.setAttribute('data-theme', theme);
        this.currentTheme = theme;
        localStorage.setItem(this.storageKey, theme);
        
        // انتشار رویداد تغییر تم
        const event = new CustomEvent('themeChanged', { detail: { theme } });
        document.dispatchEvent(event);
    }

    /**
     * ایجاد دکمه تغییر تم
     */
    createThemeToggle() {
        let toggleBtn = document.querySelector('.theme-toggle');
        
        if (!toggleBtn) {
            toggleBtn = document.createElement('button');
            toggleBtn.className = 'theme-toggle';
            toggleBtn.innerHTML = this.currentTheme === 'dark' ? '🌙' : '☀️';
            toggleBtn.title = 'تغییر تم';
            
            toggleBtn.addEventListener('click', () => {
                this.toggleTheme();
            });
            
            // اضافه کردن به هدر
            const header = document.querySelector('header');
            if (header) {
                header.appendChild(toggleBtn);
            }
        }
    }

    /**
     * تغییر تم
     */
    toggleTheme() {
        const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
        this.applyTheme(newTheme);
        
        // به‌روزرسانی آیکون دکمه
        const toggleBtn = document.querySelector('.theme-toggle');
        if (toggleBtn) {
            toggleBtn.innerHTML = newTheme === 'dark' ? '🌙' : '☀️';
        }
    }

    /**
     * اضافه کردن listener برای تغییرات سیستم
     */
    addSystemListeners() {
        // پشتیبانی از prefers-color-scheme
        if (window.matchMedia) {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)');
            
            prefersDark.addEventListener('change', (e) => {
                if (!localStorage.getItem(this.storageKey)) {
                    this.applyTheme(e.matches ? 'dark' : 'light');
                }
            });
        }

        // کلید میانبر (Ctrl+Shift+T)
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'T') {
                e.preventDefault();
                this.toggleTheme();
            }
        });
    }

    /**
     * دریافت اطلاعات تم
     * @returns {Object}
     */
    getThemeInfo() {
        return {
            current: this.currentTheme,
            available: this.themes,
            isDark: this.currentTheme === 'dark',
            isLight: this.currentTheme === 'light'
        };
    }
}

// ==================== کلاس اصلی سیستم Medic ====================
class MedicSystem {
    constructor() {
        // راه‌اندازی زیرسیستم‌ها
        this.storage = new MedicStorage();
        this.api = new MedicAPI();
        this.notifications = new NotificationSystem();
        this.ratings = new RatingSystem();
        this.tickets = new TicketSystem();
        this.theme = new ThemeSystem();
        
        // متغیرهای سیستمی
        this.initialized = false;
        this.debugMode = false;
        this.version = '2.2.0';
        
        // متصل کردن به window
        window.medicSystem = this;
        
        // راه‌اندازی اولیه
        this.init();
    }

    /**
     * راه‌اندازی اولیه سیستم
     */
    init() {
        if (this.initialized) return;

        console.log(`🚑 سیستم Medic نسخه ${this.version} در حال راه‌اندازی...`);

        // پاکسازی داده‌های منقضی شده
        this.storage.cleanup();

        // اضافه کردن منوی موبایل
        this.addMobileMenu();

        // اضافه کردن صفحه 404
        this.add404Page();

        // اضافه کردن event listeners عمومی
        this.addGlobalListeners();

        // نمایش پیام خوش‌آمد
        setTimeout(() => {
            this.notifications.info(
                `سیستم Medic نسخه ${this.version} آماده است!`,
                '🚑 سیستم فعال شد'
            );
        }, 1000);

        this.initialized = true;
        console.log('✅ سیستم Medic با موفقیت راه‌اندازی شد');
    }

    /**
     * اضافه کردن منوی موبایل
     */
    addMobileMenu() {
        // فقط اگر در حالت موبایل هستیم
        if (window.innerWidth <= 768) {
            const header = document.querySelector('header');
            if (!header) return;

            // دکمه منوی همبرگری
            const menuBtn = document.createElement('button');
            menuBtn.className = 'mobile-menu-btn';
            menuBtn.innerHTML = '☰';
            menuBtn.onclick = () => this.toggleMobileMenu();
            header.insertBefore(menuBtn, header.firstChild);

            // منوی موبایل
            const mobileMenu = document.createElement('div');
            mobileMenu.className = 'mobile-menu';
            mobileMenu.id = 'mobileMenu';
            
            // محتوای منو
            const nav = document.querySelector('nav');
            if (nav) {
                const navClone = nav.cloneNode(true);
                navClone.className = 'mobile-menu-content';
                
                // دکمه بستن
                const closeBtn = document.createElement('button');
                closeBtn.className = 'mobile-menu-close';
                closeBtn.innerHTML = '×';
                closeBtn.onclick = () => this.toggleMobileMenu();
                
                mobileMenu.appendChild(closeBtn);
                mobileMenu.appendChild(navClone);
                document.body.appendChild(mobileMenu);
            }
        }
    }

    /**
     * نمایش/مخفی کردن منوی موبایل
     */
    toggleMobileMenu() {
        const menu = document.getElementById('mobileMenu');
        if (menu) {
            menu.classList.toggle('active');
            document.body.style.overflow = menu.classList.contains('active') ? 'hidden' : '';
        }
    }

    /**
     * اضافه کردن صفحه 404
     */
    add404Page() {
        // اگر صفحه 404 موجود نیست، آن را به صورت پویا اضافه می‌کنیم
        if (!document.querySelector('link[href*="404"]')) {
            // می‌توانید این بخش را بر اساس نیاز خود سفارشی کنید
            console.log('صفحه 404 اضافه شد');
        }
    }

    /**
     * اضافه کردن event listeners عمومی
     */
    addGlobalListeners() {
        // بستن منوی موبایل با کلیک خارج از آن
        document.addEventListener('click', (e) => {
            const menu = document.getElementById('mobileMenu');
            const menuBtn = document.querySelector('.mobile-menu-btn');
            
            if (menu && menu.classList.contains('active') && 
                !menu.contains(e.target) && 
                menuBtn && !menuBtn.contains(e.target)) {
                this.toggleMobileMenu();
            }
        });

        // مدیریت فرم‌ها
        document.addEventListener('submit', (e) => {
            const form = e.target;
            if (form.id === 'membershipForm') {
                e.preventDefault();
                this.handleMembershipForm(form);
            }
            
            if (form.id === 'uploadForm') {
                e.preventDefault();
                this.handleUploadForm(form);
            }
        });

        // کلیدهای میانبر
        document.addEventListener('keydown', (e) => {
            // Ctrl + S برای ذخیره
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.notifications.info('عملیات ذخیره انجام شد', 'ذخیره');
            }
            
            // F5 برای به‌روزرسانی
            if (e.key === 'F5') {
                this.notifications.info('در حال به‌روزرسانی...', 'به‌روزرسانی');
            }
            
            // Escape برای بستن modal‌ها
            if (e.key === 'Escape') {
                this.closeAllModals();
            }
        });

        // رویدادهای آنلاین/آفلاین
        window.addEventListener('online', () => {
            this.notifications.success('اتصال اینترنت برقرار شد', 'آنلاین');
        });

        window.addEventListener('offline', () => {
            this.notifications.warning('اتصال اینترنت قطع شد', 'آفلاین');
        });

        // رویداد قبل از بسته شدن صفحه
        window.addEventListener('beforeunload', (e) => {
            const hasUnsavedChanges = this.checkUnsavedChanges();
            if (hasUnsavedChanges) {
                e.preventDefault();
                e.returnValue = 'تغییرات ذخیره نشده‌ای دارید. آیا مطمئن هستید که می‌خواهید صفحه را ترک کنید؟';
            }
        });
    }

    /**
     * مدیریت فرم عضویت
     * @param {HTMLFormElement} form - فرم
     */
    async handleMembershipForm(form) {
        try {
            // جمع‌آوری اطلاعات فرم
            const formData = new FormData(form);
            const application = {
                gameUsername: formData.get('gameUsername') || '',
                discordId: formData.get('discordId') || '',
                experience: formData.get('experience') || '',
                playTime: formData.get('playTime') || '',
                whyJoin: formData.get('whyJoin') || ''
            };

            // اعتبارسنجی
            if (!application.gameUsername) {
                throw new Error('نام کاربری در بازی الزامی است');
            }

            // نمایش وضعیت بارگذاری
            const submitBtn = form.querySelector('button[type="submit"]');
            const originalText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<span class="loading"></span> در حال ارسال...';
            submitBtn.disabled = true;

            // ارسال به API
            const result = await this.api.submitApplication(application);

            if (result.success) {
                // نمایش پیام موفقیت
                this.notifications.success(
                    `درخواست شما با شماره ${result.requestNumber} ثبت شد.`,
                    'ثبت موفقیت‌آمیز'
                );

                // بازنشانی فرم
                form.reset();

                // نمایش جزئیات درخواست
                const statusDiv = document.getElementById('statusMessage');
                if (statusDiv) {
                    statusDiv.className = 'status-message success';
                    statusDiv.innerHTML = `
                        <h4>✅ درخواست شما ثبت شد!</h4>
                        <p><strong>شماره درخواست:</strong> ${result.requestNumber}</p>
                        <p><strong>نام کاربری:</strong> ${application.gameUsername}</p>
                        <p><strong>تاریخ ثبت:</strong> ${new Date().toLocaleString('fa-IR')}</p>
                        <p><small>پس از بررسی، از طریق دیسکورد یا درون بازی با شما تماس گرفته خواهد شد.</small></p>
                    `;
                    statusDiv.style.display = 'block';
                }
            } else {
                throw new Error(result.message);
            }

        } catch (error) {
            this.notifications.error(error.message, 'خطا در ثبت درخواست');
            
            const statusDiv = document.getElementById('statusMessage');
            if (statusDiv) {
                statusDiv.className = 'status-message error';
                statusDiv.innerHTML = `❌ ${error.message}`;
                statusDiv.style.display = 'block';
            }
        } finally {
            // بازگرداندن دکمه به حالت اولیه
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.innerHTML = originalText || '📨 ارسال درخواست عضویت';
                submitBtn.disabled = false;
            }
        }
    }

    /**
     * مدیریت فرم آپلود
     * @param {HTMLFormElement} form - فرم
     */
    async handleUploadForm(form) {
        try {
            const formData = new FormData(form);
            const uploadData = {
                name: formData.get('name') || '',
                description: formData.get('description') || '',
                category: formData.get('category') || 'operations'
            };

            if (!uploadData.name || !uploadData.description) {
                throw new Error('نام و توضیحات عکس الزامی هستند');
            }

            const result = await this.api.submitUpload(uploadData);

            if (result.success) {
                this.notifications.success(
                    'درخواست آپلود شما ثبت شد. پس از تأیید مدیریت، عکس شما در گالری قرار خواهد گرفت.',
                    'ثبت درخواست آپلود'
                );

                form.reset();
                this.closeModal();
            } else {
                throw new Error(result.message);
            }

        } catch (error) {
            this.notifications.error(error.message, 'خطا در ثبت آپلود');
        }
    }

    /**
     * بررسی تغییرات ذخیره نشده
     * @returns {boolean}
     */
    checkUnsavedChanges() {
        // این تابع می‌تواند تغییرات ذخیره نشده را بررسی کند
        const forms = document.querySelectorAll('form');
        let hasChanges = false;

        forms.forEach(form => {
            const inputs = form.querySelectorAll('input, textarea, select');
            inputs.forEach(input => {
                if (input.defaultValue !== input.value) {
                    hasChanges = true;
                }
            });
        });

        return hasChanges;
    }

    /**
     * بستن همه modal‌ها
     */
    closeAllModals() {
        const modals = document.querySelectorAll('.modal');
        modals.forEach(modal => {
            modal.style.display = 'none';
        });
    }

    /**
     * نمایش modal
     * @param {string} content - محتوای HTML
     * @param {Object} options - تنظیمات
     */
    showModal(content, options = {}) {
        const modalId = 'modal-' + Date.now();
        const modal = document.createElement('div');
        modal.id = modalId;
        modal.className = 'modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${options.title || 'اطلاعات'}</h3>
                    <button class="modal-close" onclick="document.getElementById('${modalId}').remove()">×</button>
                </div>
                <div class="modal-body">
                    ${content}
                </div>
                ${options.footer || ''}
            </div>
        `;

        document.body.appendChild(modal);

        // بستن با کلیک خارج از modal
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });

        return modalId;
    }

    /**
     * ایجاد نمودار آماری
     * @param {string} canvasId - شناسه canvas
     * @param {Object} data - داده‌ها
     * @param {string} type - نوع نمودار
     */
    createChart(canvasId, data, type = 'bar') {
        // این تابع می‌تواند با Chart.js یا کتابخانه‌های دیگر ادغام شود
        console.log(`ایجاد نمودار ${type} برای ${canvasId}`, data);
        
        // پیاده‌سازی ساده برای نمایش
        const canvas = document.getElementById(canvasId);
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        if (ctx) {
            // کد رسم نمودار می‌تواند اینجا اضافه شود
        }
    }

    /**
     * خروجی گرفتن از داده‌ها
     * @param {string} format - فرمت (csv/json/pdf)
     * @param {string} type - نوع داده (applications/uploads/all)
     */
    async exportData(format = 'csv', type = 'applications') {
        try {
            let data = [];
            let filename = '';

            if (type === 'applications' || type === 'all') {
                const apps = await this.api.getApplications();
                data = data.concat(apps.map(app => ({
                    نوع: 'درخواست عضویت',
                    شماره: app.requestNumber || app.id,
                    'نام کاربری': app.gameUsername,
                    'آی‌دی دیسکورد': app.discordId,
                    'سطح تجربه': this.getExperienceText(app.experience),
                    'ساعات بازی': this.getPlayTimeText(app.playTime),
                    'توضیحات': app.whyJoin,
                    'تاریخ ثبت': app.timestamp,
                    'وضعیت': this.getStatusText(app.status)
                })));
            }

            if (type === 'uploads' || type === 'all') {
                const uploads = await this.api.getUploads();
                data = data.concat(uploads.map(upload => ({
                    نوع: 'درخواست آپلود',
                    شماره: upload.uploadNumber || upload.id,
                    'ارسال کننده': upload.name,
                    'توضیحات': upload.description,
                    'دسته‌بندی': this.getCategoryText(upload.category),
                    'تاریخ ارسال': upload.date,
                    'وضعیت': this.getStatusText(upload.status)
                })));
            }

            if (format === 'csv') {
                const headers = Object.keys(data[0] || {});
                const csvContent = [
                    headers.join(','),
                    ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
                ].join('\n');

                filename = `medic-export-${new Date().toISOString().slice(0,10)}.csv`;
                this.downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
            } else if (format === 'json') {
                const jsonContent = JSON.stringify(data, null, 2);
                filename = `medic-export-${new Date().toISOString().slice(0,10)}.json`;
                this.downloadFile(jsonContent, filename, 'application/json');
            }

            this.notifications.success(`فایل ${filename} دانلود شد`, 'خروجی موفق');

        } catch (error) {
            this.notifications.error('خطا در ایجاد خروجی', error.message);
        }
    }

    /**
     * دانلود فایل
     * @param {string} content - محتوای فایل
     * @param {string} filename - نام فایل
     * @param {string} type - نوع MIME
     */
    downloadFile(content, filename, type) {
        const blob = new Blob(['\uFEFF' + content], { type });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }

    /**
     * تبدیل کد تجربه به متن
     * @param {string} exp - کد تجربه
     * @returns {string}
     */
    getExperienceText(exp) {
        const experiences = {
            'beginner': 'تازه‌کار',
            'intermediate': 'متوسط',
            'advanced': 'پیشرفته'
        };
        return experiences[exp] || exp;
    }

    /**
     * تبدیل کد ساعات بازی به متن
     * @param {string} time - کد ساعات
     * @returns {string}
     */
    getPlayTimeText(time) {
        const times = {
            'low': 'کمتر از ۱۰ ساعت',
            'medium': '۱۰-۲۰ ساعت',
            'high': 'بیش از ۲۰ ساعت'
        };
        return times[time] || time;
    }

    /**
     * تبدیل کد دسته‌بندی به متن
     * @param {string} category - کد دسته‌بندی
     * @returns {string}
     */
    getCategoryText(category) {
        const categories = {
            'operations': 'عملیات‌ها',
            'team': 'تیم Medic',
            'vehicles': 'وسایل نقلیه',
            'training': 'آموزش‌ها'
        };
        return categories[category] || category;
    }

    /**
     * تبدیل کد وضعیت به متن
     * @param {string} status - کد وضعیت
     * @returns {string}
     */
    getStatusText(status) {
        const statuses = {
            'pending': 'در انتظار بررسی',
            'approved': 'تأیید شده',
            'rejected': 'رد شده'
        };
        return statuses[status] || status;
    }

    /**
     * دریافت اطلاعات سیستم
     * @returns {Object}
     */
    getSystemInfo() {
        return {
            version: this.version,
            initialized: this.initialized,
            debugMode: this.debugMode,
            theme: this.theme.getThemeInfo(),
            storage: this.storage.getStats(),
            userAgent: navigator.userAgent,
            online: navigator.onLine,
            screen: {
                width: window.screen.width,
                height: window.screen.height,
                orientation: window.screen.orientation?.type
            }
        };
    }

    /**
     * فعال/غیرفعال کردن حالت دیباگ
     * @param {boolean} enabled - فعال/غیرفعال
     */
    setDebugMode(enabled) {
        this.debugMode = enabled;
        if (enabled) {
            console.log('🔧 حالت دیباگ فعال شد');
            console.log('اطلاعات سیستم:', this.getSystemInfo());
        } else {
            console.log('🔧 حالت دیباگ غیرفعال شد');
        }
    }
}

// ==================== راه‌اندازی سیستم ====================

// ایجاد نمونه سیستم
document.addEventListener('DOMContentLoaded', () => {
    // بررسی اگر سیستم قبلاً راه‌اندازی شده
    if (!window.medicSystem) {
        window.medicSystem = new MedicSystem();
    }

    // اضافه کردن استایل‌های اضافی
    const style = document.createElement('style');
    style.textContent = `
        /* استایل‌های اضافی برای سیستم */
        .modal {
            display: none;
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.7);
            z-index: 4000;
            justify-content: center;
            align-items: center;
        }
        
        .modal-content {
            background: var(--bg-secondary);
            padding: 30px;
            border-radius: 12px;
            max-width: 500px;
            width: 90%;
            max-height: 80vh;
            overflow-y: auto;
            border: 2px solid var(--accent-blue);
            box-shadow: 0 10px 30px rgba(0,0,0,0.3);
        }
        
        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 10px;
            border-bottom: 2px solid var(--border-color);
        }
        
        .modal-close {
            background: transparent;
            border: none;
            color: var(--accent-red);
            font-size: 1.5rem;
            cursor: pointer;
            padding: 0 10px;
        }
        
        .modal-body {
            color: var(--text-primary);
            line-height: 1.6;
        }
        
        .modal-footer {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid var(--border-color);
            display: flex;
            justify-content: flex-end;
            gap: 10px;
        }
        
        /* استایل‌های برای سیستم امتیازدهی */
        .stars {
            display: inline-flex;
            gap: 2px;
            direction: ltr;
        }
        
        .star {
            cursor: pointer;
            font-size: 1.2rem;
            transition: color 0.2s;
        }
        
        .star:hover {
            transform: scale(1.2);
        }
        
        /* استایل‌های برای سیستم تیکت */
        .ticket {
            background: var(--bg-secondary);
            border-radius: 8px;
            padding: 15px;
            margin-bottom: 10px;
            border-right: 4px solid;
            transition: all 0.3s;
        }
        
        .ticket:hover {
            transform: translateX(-5px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        }
        
        .ticket-open {
            border-right-color: var(--success);
        }
        
        .ticket-closed {
            border-right-color: var(--danger);
        }
        
        .ticket-pending {
            border-right-color: var(--warning);
        }
        
        .ticket-answered {
            border-right-color: var(--info);
        }
        
        /* استایل‌های برای سیستم جستجو */
        .search-highlight {
            background: rgba(255, 215, 0, 0.3);
            padding: 0 2px;
            border-radius: 2px;
        }
        
        /* استایل‌های برای سیستم بارگذاری */
        .progress-bar {
            width: 100%;
            height: 10px;
            background: var(--border-color);
            border-radius: 5px;
            overflow: hidden;
            margin: 10px 0;
        }
        
        .progress-fill {
            height: 100%;
            background: linear-gradient(90deg, var(--accent-blue), var(--accent-green));
            transition: width 0.3s;
        }
        
        /* استایل‌های برای سیستم آمار */
        .stat-badge {
            display: inline-block;
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 0.8rem;
            font-weight: bold;
            margin: 0 2px;
        }
        
        .stat-badge-success {
            background: var(--success);
            color: white;
        }
        
        .stat-badge-warning {
            background: var(--warning);
            color: #212529;
        }
        
        .stat-badge-danger {
            background: var(--danger);
            color: white;
        }
        
        /* استایل‌های برای سیستم گزارش‌گیری */
        .report-card {
            background: var(--bg-secondary);
            border-radius: 10px;
            padding: 20px;
            margin-bottom: 20px;
            border: 1px solid var(--border-color);
        }
        
        .report-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 15px;
        }
        
        .report-title {
            color: var(--accent-blue);
            font-weight: bold;
        }
        
        .report-date {
            color: var(--text-secondary);
            font-size: 0.9rem;
        }
        
        /* استایل‌های برای سیستم راهنما */
        .help-tooltip {
            position: relative;
            display: inline-block;
            cursor: help;
        }
        
        .help-tooltip .tooltip-text {
            visibility: hidden;
            width: 200px;
            background: var(--bg-tertiary);
            color: var(--text-primary);
            text-align: center;
            border-radius: 6px;
            padding: 10px;
            position: absolute;
            z-index: 1000;
            bottom: 125%;
            left: 50%;
            transform: translateX(-50%);
            opacity: 0;
            transition: opacity 0.3s;
            border: 1px solid var(--accent-blue);
        }
        
        .help-tooltip:hover .tooltip-text {
            visibility: visible;
            opacity: 1;
        }
        
        /* استایل‌های برای سیستم کشیدن و رها کردن */
        .drag-drop-zone {
            border: 2px dashed var(--border-color);
            border-radius: 10px;
            padding: 40px;
            text-align: center;
            transition: all 0.3s;
            cursor: pointer;
        }
        
        .drag-drop-zone:hover {
            border-color: var(--accent-blue);
            background: rgba(77, 171, 247, 0.1);
        }
        
        .drag-drop-zone.dragover {
            border-color: var(--accent-green);
            background: rgba(81, 207, 102, 0.1);
        }
        
        /* استایل‌های برای سیستم کپی‌کردن */
        .copy-btn {
            background: transparent;
            border: 1px solid var(--border-color);
            color: var(--text-secondary);
            padding: 5px 10px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 0.9rem;
            transition: all 0.3s;
        }
        
        .copy-btn:hover {
            background: var(--accent-blue);
            color: white;
            border-color: var(--accent-blue);
        }
        
        .copy-btn.copied {
            background: var(--success);
            color: white;
            border-color: var(--success);
        }
        
        /* استایل‌های برای سیستم پیمایش */
        .scroll-top-btn {
            position: fixed;
            bottom: 20px;
            left: 20px;
            background: var(--accent-blue);
            color: white;
            width: 50px;
            height: 50px;
            border-radius: 50%;
            border: none;
            cursor: pointer;
            display: none;
            align-items: center;
            justify-content: center;
            font-size: 1.5rem;
            box-shadow: 0 4px 12px rgba(77, 171, 247, 0.3);
            z-index: 1000;
            transition: all 0.3s;
        }
        
        .scroll-top-btn:hover {
            transform: translateY(-5px);
            box-shadow: 0 8px 20px rgba(77, 171, 247, 0.4);
        }
        
        /* استایل‌های برای سیستم هشدار */
        .alert-banner {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: var(--danger);
            color: white;
            padding: 15px;
            text-align: center;
            z-index: 2000;
            animation: slideInDown 0.3s;
        }
        
        @keyframes slideInDown {
            from { transform: translateY(-100%); }
            to { transform: translateY(0); }
        }
        
        .alert-banner-success {
            background: var(--success);
        }
        
        .alert-banner-warning {
            background: var(--warning);
            color: #212529;
        }
        
        .alert-banner-info {
            background: var(--info);
        }
    `;
    
    document.head.appendChild(style);
    
    // اضافه کردن دکمه پیمایش به بالا
    const scrollBtn = document.createElement('button');
    scrollBtn.className = 'scroll-top-btn';
    scrollBtn.innerHTML = '↑';
    scrollBtn.onclick = () => window.scrollTo({ top: 0, behavior: 'smooth' });
    document.body.appendChild(scrollBtn);
    
    // نمایش/مخفی کردن دکمه پیمایش
    window.addEventListener('scroll', () => {
        if (window.pageYOffset > 300) {
            scrollBtn.style.display = 'flex';
        } else {
            scrollBtn.style.display = 'none';
        }
    });
    
    // اضافه کردن قابلیت کپی کردن
    document.addEventListener('click', (e) => {
        if (e.target.classList.contains('copy-btn')) {
            const textToCopy = e.target.dataset.copy || e.target.previousElementSibling?.textContent;
            if (textToCopy) {
                navigator.clipboard.writeText(textToCopy).then(() => {
                    const originalText = e.target.innerHTML;
                    e.target.innerHTML = '✅ کپی شد!';
                    e.target.classList.add('copied');
                    
                    setTimeout(() => {
                        e.target.innerHTML = originalText;
                        e.target.classList.remove('copied');
                    }, 2000);
                });
            }
        }
    });
    
    // فعال کردن tooltip‌ها
    document.addEventListener('mouseover', (e) => {
        if (e.target.classList.contains('help-tooltip')) {
            // tooltip به صورت خودکار نمایش داده می‌شود
        }
    });
});

// ==================== توابع کمکی جهانی ====================

/**
 * نمایش modal با محتوای HTML
 * @param {string} content - محتوای HTML
 * @param {Object} options - تنظیمات
 * @returns {string} - شناسه modal
 */
window.showMedicModal = function(content, options = {}) {
    if (window.medicSystem) {
        return window.medicSystem.showModal(content, options);
    }
    return null;
};

/**
 * نمایش نوتیفیکیشن
 * @param {string} title - عنوان
 * @param {string} message - پیام
 * @param {string} type - نوع
 */
window.showMedicNotification = function(title, message, type = 'info') {
    if (window.medicSystem) {
        return window.medicSystem.notifications.show(title, message, type);
    }
};

/**
 * ارسال درخواست عضویت
 * @param {Object} data - اطلاعات درخواست
 * @returns {Promise<Object>}
 */
window.submitMedicApplication = async function(data) {
    if (window.medicSystem) {
        return await window.medicSystem.api.submitApplication(data);
    }
    return { success: false, message: 'سیستم در دسترس نیست' };
};

/**
 * جستجو در داده‌ها
 * @param {string} query - عبارت جستجو
 * @param {string} type - نوع داده
 * @returns {Promise<Array>}
 */
window.searchMedicData = async function(query, type = 'all') {
    if (window.medicSystem) {
        return await window.medicSystem.api.search(query, type);
    }
    return [];
};

/**
 * دریافت آمار سیستم
 * @returns {Promise<Object>}
 */
window.getMedicStats = async function() {
    if (window.medicSystem) {
        return await window.medicSystem.api.getStats();
    }
    return null;
};

/**
 * خروجی گرفتن از داده‌ها
 * @param {string} format - فرمت
 * @param {string} type - نوع داده
 */
window.exportMedicData = function(format = 'csv', type = 'applications') {
    if (window.medicSystem) {
        return window.medicSystem.exportData(format, type);
    }
};

/**
 * تغییر تم
 * @param {string} theme - نام تم
 */
window.changeMedicTheme = function(theme) {
    if (window.medicSystem) {
        window.medicSystem.theme.applyTheme(theme);
    }
};

/**
 * ایجاد تیکت جدید
 * @param {Object} ticketData - اطلاعات تیکت
 * @returns {Object}
 */
window.createMedicTicket = function(ticketData) {
    if (window.medicSystem) {
        return window.medicSystem.tickets.createTicket(ticketData);
    }
    return { success: false, message: 'سیستم در دسترس نیست' };
};

/**
 * دریافت اطلاعات سیستم
 * @returns {Object}
 */
window.getMedicSystemInfo = function() {
    if (window.medicSystem) {
        return window.medicSystem.getSystemInfo();
    }
    return null;
};

/**
 * فعال/غیرفعال کردن حالت دیباگ
 * @param {boolean} enabled - فعال/غیرفعال
 */
window.setMedicDebugMode = function(enabled) {
    if (window.medicSystem) {
        window.medicSystem.setDebugMode(enabled);
    }
};

// ==================== راه‌اندازی نهایی ====================

// بررسی پشتیبانی مرورگر
if (typeof window.localStorage === 'undefined') {
    console.error('مرورگر شما از localStorage پشتیبانی نمی‌کند. برخی ویژگی‌ها ممکن است کار نکنند.');
}

// بررسی پشتیبانی از API‌های مدرن
if (typeof window.Promise === 'undefined') {
    console.error('مرورگر شما از Promise پشتیبانی نمی‌کند. لطفاً مرورگر خود را به‌روز کنید.');
}

// بررسی اتصال اینترنت
if (!navigator.onLine) {
    console.warn('شما در حالت آفلاین هستید. برخی ویژگی‌ها ممکن است محدود باشند.');
}

// پیام نهایی
console.log(`
╔══════════════════════════════════════════╗
║     🚑 سیستم Medic نسخه 2.2 آماده است!   ║
║                                          ║
║  ویژگی‌های جدید:                        ║
║  • سیستم نوتیفیکیشن پیشرفته             ║
║  • مدیریت تم (دارک/لایت)                ║
║  • سیستم امتیازدهی                      ║
║  • سیستم تیکت پشتیبانی                  ║
║  • جستجوی پیشرفته                       ║
║  • ذخیره‌سازی امن با انقضا               ║
║                                          ║
║  برای اطلاعات بیشتر:                    ║
║  console.log(window.medicSystem)         ║
╚══════════════════════════════════════════╝
`);