import { Utils, Notifications, Storage, EventBus } from './core.js';
import { syncRelay } from './sync-relay.js';

const SALES_REPORT_URL = 'https://almdrasa.com/wp-admin/admin.php?page=almdrasa-sales-reports';

export async function renderSales() {
    const container = document.createElement('div');
    container.className = 'sales-container';

    // Header
    const header = document.createElement('div');
    header.className = 'sales-header';
    header.innerHTML = `
        <h1 class="section-title">تقرير المبيعات</h1>
        <div style="display: flex; gap: 1rem; align-items: center;">
            <span id="last-updated" style="font-size: 0.8rem; color: rgba(255,255,255,0.4);"></span>
            <button id="reset-sales-btn" class="refresh-btn" style="background:rgba(239, 68, 68, 0.05); border-color:rgba(239, 68, 68, 0.2); color:#f87171;">
                <i class="fa-solid fa-trash-can"></i> إدخال جديد
            </button>
            <button id="refresh-sales-btn" class="refresh-btn">
                <i class="fa-solid fa-rotate"></i> تحديث تلقائي
            </button>
        </div>
    `;
    container.appendChild(header);

    const contentArea = document.createElement('div');
    contentArea.id = 'sales-content-grid';
    container.appendChild(contentArea);

    // Initial Load
    async function loadData(force = false) {
        if (!contentArea) return;
        
        // Show loading only if no cache or forced
        if (force || !localStorage.getItem('last_sales_data')) {
            contentArea.innerHTML = `
                <div class="sales-loading">
                    <div class="spinner spinner-lg"></div>
                    <p>جاري تحديث بيانات المبيعات في الوقت الفعلي...</p>
                </div>
            `;
        }

        try {
            const data = await fetchSalesData(force);
            renderDashboard(data);
            updateTimestamp();
        } catch (error) {
            console.error('Sales Load Error:', error);
            const cached = Storage.get('last_sales_data');
            if (cached) {
                renderDashboard(cached);
                updateTimestamp(true, error.message.includes('CORS') ? 'CORS' : 'خطأ'); 
                Notifications.warning(`تعذر التحديث: ${error.message.includes('CORS') ? 'مشكلة في الاتصال' : error.message}`);
                
                // Show Relay Setup if CORS fails
                if (error.message.includes('CORS')) {
                    syncRelay.renderSetupUI('relay-setup-container');
                }
            } else {
                renderError(error.message, error.stack || error.toString());
            }
        }
    }

    // Real-time interval (Refresh every 5 minutes)
    const refreshInterval = setInterval(() => {
        if (document.contains(container)) {
            loadData(true);
        } else {
            clearInterval(refreshInterval);
        }
    }, 5 * 60 * 1000);

    function renderDashboard(data) {
        contentArea.innerHTML = '';
        
        // 1. Sales Cards Grid
        const grid = document.createElement('div');
        grid.className = 'sales-grid';

        const periodIcons = {
            today: 'fa-calendar-day',
            yesterday: 'fa-calendar-check',
            currentWeek: 'fa-calendar-week',
            currentMonth: 'fa-calendar-days',
            lastMonth: 'fa-clock-rotate-left',
            currentYear: 'fa-earth-americas',
            lastYear: 'fa-hourglass-end',
            totalSales: 'fa-chart-pie',
            outsideCurrent: 'fa-truck-fast',
            outsideLast: 'fa-truck-ramp-box'
        };

        const periodLabels = {
            today: 'مبيعات اليوم',
            yesterday: 'مبيعات الأمس',
            currentWeek: 'مبيعات الأسبوع',
            currentMonth: 'مبيعات الشهر الحالي (ديسمبر)',
            lastMonth: 'مبيعات الشهر السابق (نوفمبر)',
            currentYear: 'مبيعات العام الحالي',
            lastYear: 'مبيعات العام السابق',
            totalSales: 'إجمالي المبيعات الكامل',
            outsideCurrent: 'الطلبات الخارجية (ديسمبر)',
            outsideLast: 'الطلبات الخارجية (نوفمبر)'
        };

        const trendContexts = {
            today: 'منذ الأمس',
            yesterday: 'منذ أول أمس',
            currentWeek: 'منذ الأسبوع الماضي',
            currentMonth: 'منذ الشهر الماضي',
            lastMonth: 'منذ الشهر الأسبق',
            currentYear: 'منذ العام الماضي',
            outsideCurrent: 'منذ الشهر الماضي',
            outsideLast: 'منذ الشهر الأسبق'
        };

        Object.entries(data).forEach(([key, val]) => {
            const card = document.createElement('div');
            card.className = `sales-card ${key}`; // Restored period-specific classes
            
            const isUp = val.trend && val.trend.startsWith('+');
            const trendIcon = isUp ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down';
            const trendClass = isUp ? 'trend-up' : 'trend-down';

            card.innerHTML = `
                <div class="sales-card-header">
                    <div class="sales-card-label">${periodLabels[key] || key}</div>
                    <div class="sales-card-icon">
                        <i class="fa-solid ${periodIcons[key] || 'fa-chart-simple'}"></i>
                    </div>
                </div>
                
                <div class="sales-card-main">
                    <div class="sales-card-total">${val.totalEgp || '---'}</div>
                    <div class="sales-card-currency">إجمالي الرصيد بالجنيه</div>
                </div>

                <div class="metric-bar">
                    <div class="metric-item">
                        <span class="metric-label">الدولار (USD)</span>
                        <span class="metric-value">${val.usdAmount || '---'}</span>
                    </div>
                    <div class="metric-item">
                        <span class="metric-label">الجنيه (EGP)</span>
                        <span class="metric-value">${val.egpAmount || '---'}</span>
                    </div>
                    <div class="metric-item full-width">
                        <span class="metric-label">إجمالي الطلبات</span>
                        <span class="orders-badge">${val.orders || '---'}</span>
                    </div>
                </div>

                ${val.trend ? `
                    <div class="sales-card-footer">
                        <div class="sales-card-trend ${trendClass}">
                            <i class="fa-solid ${trendIcon}"></i>
                            ${val.trend} ${trendContexts[key] || 'منذ الفترة السابقة'}
                        </div>
                    </div>
                ` : '<div></div>'}
            `;
            grid.appendChild(card);
        });

        contentArea.appendChild(grid);
    }


    function renderError(msg, technical) {
        contentArea.innerHTML = `
            <div class="sales-error">
                <i class="fa-solid fa-triangle-exclamation" style="font-size: 4rem; color: #ef4444; margin-bottom: 1.5rem;"></i>
                <h2 style="color: #fff; margin-bottom: 1rem;">عذراً، فشل الاتصال التلقائي</h2>
                <p style="color: rgba(255,255,255,0.8); font-size: 1.1rem; margin-bottom: 2rem;">${msg}</p>
                
                <div class="manual-input-container" style="background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 2rem; margin-top: 1rem;">
                    <div style="text-align: right; margin-bottom: 1.5rem;">
                        <h3 style="color: var(--metallic-gold); margin-bottom: 0.5rem; display: flex; align-items: center; gap: 10px;">
                            <i class="fa-solid fa-file-import"></i> تحديث البيانات يدوياً
                        </h3>
                        <p style="color: rgba(255,255,255,0.6); font-size: 0.9rem;">
                            قم بنسخ محتوى صفحة تقارير المبيعات بالكامل (Ctrl+A ثم Ctrl+C) والصقه في المربع أدناه لتحديث لوحة التحكم.
                        </p>
                    </div>

                    <textarea id="manual-paste-area" 
                        placeholder="قم بلصق محتوى الصفحة هنا..." 
                        style="width: 100%; height: 200px; background: rgba(0,0,0,0.4); border: 1px solid rgba(255,215,0,0.1); border-radius: 12px; color: #fff; padding: 20px; font-family: 'Cairo', sans-serif; font-size: 14px; line-height: 1.6; resize: none; margin-bottom: 1.5rem; outline: none; transition: all 0.3s ease;"
                        onfocus="this.style.borderColor='rgba(255,215,0,0.4)'; this.style.boxShadow='0 0 15px rgba(255,215,0,0.1)';"
                        onblur="this.style.borderColor='rgba(255,215,0,0.1)'; this.style.boxShadow='none';"></textarea>

                    <button id="parse-manual-btn" class="btn btn-primary" style="padding: 15px 40px; font-weight: 700; width: 100%; font-size: 1.1rem; display: flex; align-items: center; justify-content: center; gap: 10px; background: linear-gradient(135deg, #FFD700 0%, #B8860B 100%); border: none; color: #000; box-shadow: 0 4px 15px rgba(212, 175, 55, 0.3);">
                        <i class="fa-solid fa-wand-magic-sparkles"></i> تحليل البيانات وتحديث التقرير
                    </button>
                    
                    <div style="margin-top: 1.5rem; text-align: center;">
                        <button id="retry-sales-btn" style="background: none; border: none; color: rgba(255,255,255,0.4); cursor: pointer; text-decoration: underline; font-size: 0.85rem;">
                            أو حاول الاتصال التلقائي مرة أخرى
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        const retryBtn = contentArea.querySelector('#retry-sales-btn');
        if (retryBtn) retryBtn.onclick = () => loadData(true);
        
        const parseBtn = contentArea.querySelector('#parse-manual-btn');
        if (parseBtn) {
            parseBtn.onclick = () => {
                const raw = contentArea.querySelector('#manual-paste-area').value;
                if (!raw) return Notifications.warning('يرجى لصق محتوى الصفحة أولاً');
                
                parseBtn.disabled = true;
                parseBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> جاري التحليل...';
                
                setTimeout(() => {
                    try {
                        const data = parseSalesData(raw);
                        localStorage.setItem('last_sales_data', JSON.stringify(data));
                        localStorage.setItem('last_sales_update', Date.now());
                        renderDashboard(data);
                        updateTimestamp(true);
                        Notifications.success('تم تحديث بيانات المبيعات بنجاح');
                    } catch (e) {
                        console.error('Manual Parse Error:', e);
                        Notifications.error(e.message || 'لم يتم العثور على بيانات مبيعات صحيحة في النص الملصق');
                        parseBtn.disabled = false;
                        parseBtn.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> تحليل البيانات وتحديث التقرير';
                    }
                }, 800);
            };
        }
    }

    const DEMO_DATA = {
        today: { usdAmount: "$515", egpAmount: "39,825 EGP", totalEgp: "64,322 EGP", orders: "413", trend: "-17%" },
        yesterday: { usdAmount: "$360", egpAmount: "59,956 EGP", totalEgp: "77,080 EGP", orders: "632", trend: "-48%" },
        currentWeek: { usdAmount: "$1,275", egpAmount: "145,598 EGP", totalEgp: "206,246 EGP", orders: "1,097", trend: "+52%" },
        currentMonth: { usdAmount: "$5,065", egpAmount: "364,444 EGP", totalEgp: "605,373 EGP", orders: "1,368", trend: "-38%" },
        lastMonth: { usdAmount: "$9,635", egpAmount: "475,940 EGP", totalEgp: "934,267 EGP", orders: "693", trend: "-51%" },
        currentYear: { usdAmount: "$95,331", egpAmount: "6,934,926 EGP", totalEgp: "11,598,514 EGP", orders: "11,829", trend: null },
        lastYear: { usdAmount: "$56,596", egpAmount: "3,391,053 EGP", totalEgp: "6,125,059 EGP", orders: "6,634", trend: null },
        totalSales: { usdAmount: "$173,843", egpAmount: "11,261,140 EGP", totalEgp: "19,530,440 EGP", orders: "24,589", trend: null },
        outsideCurrent: { usdAmount: "$1,789", egpAmount: "120,978 EGP", totalEgp: "206,076 EGP", orders: "275", trend: "-1%" },
        outsideLast: { usdAmount: "$2,200", egpAmount: "204,199 EGP", totalEgp: "204,199 EGP", orders: "247", trend: "-45%" }
    };

    function init() {
        const cachedContent = localStorage.getItem('last_sales_data');
        if (cachedContent) {
            renderDashboard(JSON.parse(cachedContent));
            updateTimestamp(localStorage.getItem('last_sales_update'));
        } else {
            // Force the exact provided data if no cache exists
            localStorage.setItem('last_sales_data', JSON.stringify(DEMO_DATA));
            localStorage.setItem('last_sales_update', Date.now());
            renderDashboard(DEMO_DATA);
            updateTimestamp(Date.now());
        }
    }

    function updateTimestamp(isCached = false, errorMsg = null, source = null) {
        const span = header.querySelector('#last-updated');
        if (span) {
            const now = new Date();
            const time = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            
            if (isCached) {
                const reason = errorMsg ? ` (${errorMsg})` : '';
                span.innerHTML = `<i class="fa-solid fa-cloud-slash" style="color:#ef4444"></i> <span style="color:rgba(255,255,255,0.4)">مخزنة: ${time}${reason}</span>`;
            } else if (source === 'LeadSync Streaming Relay') {
                span.innerHTML = `<span class="streaming-pulse"></span> <span style="color:#ffcc00; font-weight:700;">بث مباشر (Relay): ${time}</span>`;
            } else {
                span.innerHTML = `<span class="live-blink"></span> <span style="color:#4ade80">مباشر: ${time}</span>`;
            }
        }
    }

    header.querySelector('#refresh-sales-btn').onclick = (e) => {
        const icon = e.currentTarget.querySelector('i');
        icon.classList.add('spinning');
        loadData(true).finally(() => icon.classList.remove('spinning'));
    };

    header.querySelector('#reset-sales-btn').onclick = () => {
        if (confirm('هل أنت متأكد من مسح البيانات الحالية والبدء من جديد؟')) {
            Storage.set('last_sales_data', null);
            localStorage.removeItem('last_sales_update');
            loadData(true);
            Notifications.info('تم مسح البيانات. يمكنك الآن استخدام Relay أو اللصق اليدوي.');
        }
    };

    // Event Listeners for Live Updates
    EventBus.on('sales:updated', (payload) => {
        if (container.isConnected) {
            const data = payload.data || payload;
            const source = payload.source || null;
            renderDashboard(data);
            updateTimestamp(false, null, source);
        }
    });

    // Initial load
    loadData();
    return container;
}

export async function fetchSalesData(force = false) {
    if (!force) {
        const cached = Storage.get('last_sales_data');
        const timestamp = localStorage.getItem('last_sales_update');
        if (cached && timestamp && (Date.now() - timestamp < 15 * 60 * 1000)) {
            return cached;
        }
    }

    // Strategies:
    // 1. Direct fetch (best if extension works)
    // 2. XMLHttpRequest (some extensions patch this differently)
    // 3. Proxy fallback (corsproxy.io)

    const fetchDirect = async () => {
        const response = await fetch(SALES_REPORT_URL, {
            credentials: 'include',
            // No custom headers to avoid preflight
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return await response.text();
    };

    const fetchProxy = async () => {
        // This proxy attempts to pass cookies if they exist in the browser
        const proxyUrl = `https://corsproxy.io/?${encodeURIComponent(SALES_REPORT_URL)}`;
        const response = await fetch(proxyUrl, {
            credentials: 'include'
        });
        if (!response.ok) throw new Error(`Proxy Error ${response.status}`);
        return await response.text();
    };

    try {
        let html;
        try {
            console.log('Attempting Direct Fetch...');
            html = await fetchDirect();
        } catch (e) {
            console.warn('Direct Fetch failed, trying Proxy...', e);
            html = await fetchProxy();
        }
        
        if (html.includes('id="login"') || html.includes('wp-login.php')) {
             throw new Error('AUTH_EXPIRED');
        }

        const data = parseSalesData(html);
        
        Storage.set('last_sales_data', data);
        localStorage.setItem('last_sales_update', Date.now());
        
        return data;
    } catch (err) {
        console.error('Unified Fetch Error:', err);
        if (err.message === 'AUTH_EXPIRED') {
            throw new Error('انتهت جلسة تسجيل الدخول. يرجى تسجيل الدخول إلى Almdrasa مرة أخرى.');
        }
        throw new Error('فشل جلب البيانات برمجياً بسبب قيود الأمان (CORS). يرجى مراجعة إعدادات الإضافة أو استخدام الإدخال اليدوي.');
    }
}

export function parseSalesData(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const results = {};
    
    // Normalize text: remove non-breaking spaces and trim lines
    let fullText = (doc.body ? doc.body.innerText : html) || "";
    fullText = fullText.replace(/\u00A0/g, ' ').replace(/\r/g, '\n');

    // Multilingual Key Mapping
    const keyMap = [
        { key: "today", patterns: ["Today's Sales", "مبيعات اليوم"] },
        { key: "yesterday", patterns: ["Yesterday's Sales", "مبيعات الأمس"] },
        { key: "currentWeek", patterns: ["Current Week", "الأسبوع الحالي"] },
        { key: "currentMonth", patterns: ["Current month Sales", "مبيعات الشهر الحالي"], mustHaveBoth: true, notHave: ["Out-side"] },
        { key: "lastMonth", patterns: ["Last month Sales", "مبيعات الشهر السابق", "مبيعات الشهر الماضي"], mustHaveBoth: true, notHave: ["Out-side"] },
        { key: "currentYear", patterns: ["Current Year", "السنة الحالية", "العام الحالي"] },
        { key: "lastYear", patterns: ["Last Year", "السنة الماضية", "العام السابق"] },
        { key: "totalSales", patterns: ["Total Sales"] },
        { key: "outsideCurrent", patterns: ["Current month", "Out-side Sales"], mustHaveBoth: true },
        { key: "outsideLast", patterns: ["Last month", "Out-side Sales"], mustHaveBoth: true }
    ];

    const lines = fullText.split('\n').map(l => l.trim()).filter(l => l);
    let currentKey = null;

    lines.forEach(line => {
        let matchedKey = null;
        for (const mapping of keyMap) {
            // Check if any pattern matches (or all if mustHaveBoth)
            const matchesAll = mapping.patterns.every(p => line.toLowerCase().includes(p.toLowerCase()));
            const matchesAny = mapping.patterns.some(p => line.toLowerCase().includes(p.toLowerCase()));
            
            const isMatch = mapping.mustHaveBoth ? matchesAll : matchesAny;
            const hasNoBadPatterns = !mapping.notHave || mapping.notHave.every(p => !line.toLowerCase().includes(p.toLowerCase()));
            
            if (isMatch && hasNoBadPatterns) {
                matchedKey = mapping.key;
                break;
            }
        }

        if (matchedKey) {
            currentKey = matchedKey;
            results[currentKey] = { rawText: line };
        } else if (currentKey) {
            // Only append if it's not a generic repeating line or another header-like line
            if (line.length < 300) { 
                results[currentKey].rawText += " | " + line;
            }
        }
    });

    Object.keys(results).forEach(key => {
        const content = results[key].rawText;
        
        // Flexible Regex: handles ($100), (100 $), (100 EGP), (Total: 100), (100.00)
        // More specific check for USD vs EGP
        const usdMatch = content.match(/(\$\s?[\d,.]+)|([\d,.]+\s?\$)|(\$[\d,.]+)/i);
        const egpMatch = content.match(/([\d,.]+\s?EGP)|(EGP\s?[\d,.]+)/i);
        const ordersMatch = content.match(/(Orders|الطلبات|طلب|Orders Count):?\s?([\d,]+)/i);
        const trendMatch = content.match(/([+-]\s?\d+%)(\s*since)?/i);

        // Fallback for unlabeled amounts near the start
        const fallbackAmountMatch = content.match(/([\d,.]+)/);

        const clean = (m, group = 0) => {
            if (!m) return null;
            let val = (group === 0 ? m[0] : m[group]).replace(/[^\d.,]/g, '').trim();
            // Remove trailing dot if exists
            if (val.endsWith('.')) val = val.slice(0, -1);
            return val;
        };

        const usdVal = clean(usdMatch);
        const egpVal = clean(egpMatch);
        const ordersVal = clean(ordersMatch, 2);
        
        // Logic for total: if it explicitly says Total, or if it's the dominant number
        const totalMatch = content.match(/(Total|الإجمالي|إجمالي|Grand Total):?\s?([\d,.]+)/i);
        const totalVal = clean(totalMatch, 2) || (egpVal && egpVal.length > 3 ? egpVal : null) || clean(fallbackAmountMatch);

        results[key] = {
            usdAmount: usdVal ? `$${usdVal}` : '---',
            egpAmount: egpVal ? `${egpVal} EGP` : '---',
            totalEgp: totalVal ? `${totalVal} EGP` : '---',
            orders: ordersVal || (content.match(/Orders\s*(\d+)/i) ? content.match(/Orders\s*(\d+)/i)[1] : '---'),
            trend: trendMatch ? trendMatch[1].replace(/\s/g, '') : '',
            debug: content.substring(0, 150)
        };
    });

    // Final Validation: Ensure we have at least most of the keys
    const requiredKeys = ['today', 'yesterday', 'currentWeek', 'currentMonth', 'totalSales'];
    const foundKeys = Object.keys(results);
    const missingKeys = requiredKeys.filter(k => !foundKeys.includes(k));

    if (foundKeys.length < 3) {
        throw new Error('لم يتم العثور على بيانات مبيعات كافية. يرجى التأكد من نسخ الصفحة بصيغة صحيحة.');
    }

    return results;
}
