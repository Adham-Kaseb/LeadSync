import { Utils, Notifications } from './core.js';

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
            <button id="refresh-sales-btn" class="refresh-btn">
                <i class="fa-solid fa-rotate"></i> تحديث البيانات
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
            // If we have cached data, show it but with a warning
            const cached = localStorage.getItem('last_sales_data');
            if (cached) {
                renderDashboard(JSON.parse(cached));
                updateTimestamp(true); // Indicate it's offline/cached
                Notifications.warning('تعذر التحديث: نعرض بيانات مخزنة');
            } else {
                renderError(error.message);
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
        const grid = document.createElement('div');
        grid.className = 'sales-grid';

        const metrics = [
            { label: "Today's Sales", key: 'today' },
            { label: "Yesterday's Sales", key: 'yesterday' },
            { label: "Current Week's Sales", key: 'currentWeek' },
            { label: "Current month (December) Sales", key: 'currentMonth' },
            { label: "Last month (November) Sales", key: 'lastMonth' },
            { label: "Current Year Sales", key: 'currentYear' },
            { label: "Last Year's Sales", key: 'lastYear' },
            { label: "Total Sales", key: 'totalSales' },
            { label: "Current month (December) Out-side Sales", key: 'outsideCurrent' },
            { label: "Last month (November) Out-side Sales", key: 'outsideLast' }
        ];

        metrics.forEach(metric => {
            const val = data[metric.key];
            if (!val) return;

            const card = document.createElement('div');
            card.className = 'sales-card';
            card.innerHTML = `
                <div class="sales-card-info">
                    <div class="sales-card-label">${metric.label}</div>
                    <div class="sales-card-value">${val.mainValue}</div>
                    <div class="sales-card-trend ${val.trend.startsWith('+') ? 'trend-up' : 'trend-down'}">${val.trend}</div>
                </div>
                <div class="sales-card-icon">
                    <i class="fa-solid fa-bag-shopping"></i>
                </div>
            `;
            grid.appendChild(card);
        });

        contentArea.appendChild(grid);
    }

    function renderError(msg) {
        contentArea.innerHTML = `
            <div class="sales-error">
                <i class="fa-solid fa-triangle-exclamation" style="font-size: 4rem; color: #ef4444; margin-bottom: 1.5rem;"></i>
                <h2 style="color: #fff; margin-bottom: 1rem;">فشل جلب البيانات</h2>
                <p style="color: rgba(255,255,255,0.8); font-size: 1.1rem;">${msg}</p>
                
                <div class="trouble-box" style="direction: rtl; text-align: right;">
                    <h4 style="margin-bottom: 0.8rem; color: var(--metallic-gold);"><i class="fa-solid fa-lightbulb"></i> متطلبات التشغيل:</h4>
                    <ul style="padding-right: 20px;">
                        <li style="margin-bottom: 0.5rem;">تأكد من تسجيل دخولك في <a href="https://almdrasa.com/wp-admin/" target="_blank" style="color: var(--metallic-gold);">لوحة تحكم المدرسة</a>.</li>
                        <li style="margin-bottom: 0.5rem;">يجب تفعيل إضافة (Allow CORS) للسماح بجلب البيانات.</li>
                        <li style="margin-bottom: 0.5rem;">تأكد من اختيار متصفح يدعم الكوكيز (مثل Chrome).</li>
                    </ul>
                </div>
                
                <button id="retry-sales-btn" class="btn btn-primary" style="padding: 12px 40px; font-weight: 700;">
                    إعادة المحاولة
                </button>
            </div>
        `;
        contentArea.querySelector('#retry-sales-btn').onclick = () => loadData(true);
    }

    function updateTimestamp(isCached = false) {
        const span = header.querySelector('#last-updated');
        if (span) {
            const time = new Date().toLocaleTimeString('ar-EG');
            span.innerHTML = isCached 
                ? `<i class="fa-solid fa-clock-rotate-left"></i> بيانات مخزنة: ${time}`
                : `<i class="fa-solid fa-circle" style="color:#4ade80; font-size:0.5rem;"></i> مباشر: ${time}`;
        }
    }

    header.querySelector('#refresh-sales-btn').onclick = (e) => {
        const icon = e.currentTarget.querySelector('i');
        icon.classList.add('spinning');
        loadData(true).finally(() => icon.classList.remove('spinning'));
    };

    loadData();
    return container;
}

async function fetchSalesData(force = false) {
    if (!force) {
        const cached = localStorage.getItem('last_sales_data');
        const timestamp = localStorage.getItem('last_sales_update');
        if (cached && timestamp && (Date.now() - timestamp < 15 * 60 * 1000)) {
            return JSON.parse(cached);
        }
    }

    try {
        const response = await fetch(SALES_REPORT_URL, {
            credentials: 'include', // Crucial for passing WP login cookies
            headers: {
                'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8'
            }
        });

        if (!response.ok) {
            if (response.status === 403 || response.status === 401) {
                throw new Error('غير مصرح. يرجى تسجيل الدخول إلى لوحة تحكم المدرسة في هذه المتصفح.');
            }
            throw new Error(`خطأ في الخادم (Status: ${response.status})`);
        }
        
        const html = await response.text();
        const data = parseSalesData(html);
        
        if (html.includes('id="login"') || html.includes('wp-login.php')) {
             throw new Error('يبدو أن الجلسة منتهية. يرجى فتح لوحة التحكم وتسجيل الدخول مرة أخرى.');
        }

        localStorage.setItem('last_sales_data', JSON.stringify(data));
        localStorage.setItem('last_sales_update', Date.now());
        
        return data;
    } catch (err) {
        console.error('Fetch Error Detail:', err);
        if (err.name === 'TypeError' && err.message.includes('fetch')) {
            throw new Error('فشل الاتصال (CORS): يرجى تفعيل إضافة CORS وتأكد من تسجيل الدخول إلى Almdrasa في هذا المتصفح.');
        }
        throw err;
    }
}

function parseSalesData(html) {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // The provided image shows cards. In WP Admin, these are likely divs with specific classes.
    // However, the user wants a "robust" way. We'll search for the text labels.
    
    const results = {};
    const textToKey = {
        "Today's Sales": "today",
        "Yesterday's Sales": "yesterday",
        "Current Week's Sales": "currentWeek",
        "Current month (December) Sales": "currentMonth",
        "Last month (November) Sales": "lastMonth",
        "Current Year Sales": "currentYear",
        "Last Year's Sales": "lastYear",
        "Total Sales": "totalSales",
        "Current month (December) Out-side Sales": "outsideCurrent",
        "Last month (November) Out-side Sales": "outsideLast"
    };

    // Helper to extract values from a card-like element or its container
    // Based on the image, the structure seems to be:
    // Label (Small)
    // Main Value (Large Bold)
    // Percentage/Trend (Small)
    
    // We'll iterate through all elements and find the labels
    const allElements = Array.from(doc.querySelectorAll('*'));
    
    Object.entries(textToKey).forEach(([labelText, key]) => {
        const labelEl = allElements.find(el => el.textContent.trim().includes(labelText) && el.children.length === 0);
        
        if (labelEl) {
            // Usually the parent or next sibling contains the value
            const container = labelEl.parentElement;
            const textContent = container.innerText;
            
            // Regex to find things like "$354 | 38,832 EGP | Total: 55,670 EGP | Orders: 405"
            // and "-28%"
            
            // Let's try to extract the main line (first line after label might be value)
            // Or just parse the whole container text
            const lines = textContent.split('\n').map(l => l.trim()).filter(l => l && l !== labelText);
            
            if (lines.length >= 1) {
                results[key] = {
                    mainValue: lines[0],
                    trend: lines[1] || ''
                };
            }
        }
    });

    // Validating results count
    if (Object.keys(results).length === 0) {
        throw new Error('لم يتم العثور على بيانات المبيعات في الصفحة. هل أنت في الصفحة الصحيحة؟');
    }

    return results;
}
