import { Utils, Notifications, Storage, EventBus } from './core.js';
import { syncRelay } from './sync-relay.js';

const SALES_REPORT_URL = 'https://almdrasa.com/wp-admin/admin.php?page=almdrasa-sales-reports';

const CURRENCY_API_URL = 'https://api.coinbase.com/v2/exchange-rates?currency=USD';
const FALLBACK_API_URL = 'https://v6.exchangerate-api.com/v6/e52e027097da13b48f56bf22/latest/USD';

async function getLiveExchangeRate() {
    // 1. Check for manual override (Ultimate accuracy)
    const manualRate = localStorage.getItem('manual_usd_egp_rate');
    if (manualRate) return parseFloat(manualRate);

    // 2. Aggressive cache (15 mins for market accuracy)
    const cached = localStorage.getItem('usd_egp_rate');
    const cacheTime = localStorage.getItem('usd_egp_rate_time');
    if (cached && cacheTime && (Date.now() - cacheTime < 900000)) return parseFloat(cached);

    // 3. Try primary high-accuracy community source
    try {
        const res = await fetch(CURRENCY_API_URL);
        if (res.ok) {
            const data = await res.json();
            const rate = data.data && data.data.rates ? parseFloat(data.data.rates.EGP) : null;
            if (rate && rate > 40) {
                localStorage.setItem('usd_egp_rate', rate);
                localStorage.setItem('usd_egp_rate_time', Date.now());
                return rate;
            }
        }
    } catch (e) { console.error('Primary Rate API Error:', e); }

    // 4. Fallback to authenticated source provided by user
    try {
        const res = await fetch(FALLBACK_API_URL);
        if (res.ok) {
            const data = await res.json();
            const rate = data.conversion_rates ? data.conversion_rates.EGP : null;
            if (rate && rate > 40) {
                localStorage.setItem('usd_egp_rate', rate);
                localStorage.setItem('usd_egp_rate_time', Date.now());
                return rate;
            }
        }
    } catch (e) { console.error('Fallback Rate API Error:', e); }
    
    return parseFloat(localStorage.getItem('usd_egp_rate')) || 48.5; // Updated default to current market approx
}

const getDateContext = () => {
    const now = new Date();
    const day = now.getDate();
    const month = now.getMonth();
    const year = now.getFullYear();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const remainingDays = Math.max(1, daysInMonth - day + 1); 

    // Calculate Week Range (Saturday to Friday)
    const currentDay = now.getDay(); // 0: Sun, 1: Mon, ..., 6: Sat
    const diffToSat = (currentDay + 1) % 7; 
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - diffToSat);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    const dateOptions = { month: 'short', day: 'numeric' };
    const weekRange = `${weekStart.toLocaleDateString('ar-EG', dateOptions)} - ${weekEnd.toLocaleDateString('ar-EG', dateOptions)}`;

    return { day, daysInMonth, remainingDays, monthName: now.toLocaleDateString('ar-EG', { month: 'long' }), weekRange };
};

export async function renderSales() {
    const container = document.createElement('div');
    container.className = 'sales-container';

    // Header
    const header = document.createElement('div');
    header.className = 'sales-header';
    header.innerHTML = `
        <h1 class="section-title">تقرير المبيعات</h1>
        <div style="display: flex; gap: 0.8rem; align-items: center; flex-wrap: wrap;">
            <span id="last-updated" style="font-size: 0.8rem; color: rgba(255,255,255,0.4);"></span>
            <button id="elite-insights-btn" class="refresh-btn" style="background:linear-gradient(135deg, rgba(255,215,0,0.1) 0%, rgba(255,165,0,0.1) 100%); border-color:rgba(255,215,0,0.3); color:var(--metallic-gold); font-weight:800; box-shadow: 0 0 15px rgba(255,215,0,0.1);">
                <i class="fa-solid fa-wand-magic-sparkles"></i> تحليلات جاهزة
            </button>
            <button id="reset-sales-btn" class="refresh-btn" style="background:rgba(239, 68, 68, 0.05); border-color:rgba(239, 68, 68, 0.2); color:#f87171;">
                <i class="fa-solid fa-trash-can"></i> إدخال جديد
            </button>
            <button id="open-almdrasa-btn" class="refresh-btn" style="background:rgba(255, 215, 0, 0.05); border-color:rgba(255, 215, 0, 0.2); color:var(--metallic-gold);">
                <i class="fa-solid fa-external-link"></i> Almdrasa SL
            </button>
        </div>
    `;
    
    // Elite Insights Logic
    header.querySelector('#elite-insights-btn').onclick = () => {
        const data = Storage.get('last_sales_data');
        if (!data) return Notifications.warning('يرجى تحديث بيانات المبيعات أولاً');
        showEliteAnalyticsHub(data);
    };
    
    const openAlmdrasaBtn = header.querySelector('#open-almdrasa-btn');
    if (openAlmdrasaBtn) {
        openAlmdrasaBtn.onclick = () => window.open(SALES_REPORT_URL, '_blank');
    }
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
            const rate = await getLiveExchangeRate();
            renderDashboard(data, rate);
            updateTimestamp();
        } catch (error) {
            console.error('Sales Load Error:', error);
            const cached = Storage.get('last_sales_data');
            const rate = await getLiveExchangeRate();
            if (cached) {
                renderDashboard(cached, rate);
                updateTimestamp(true); 
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



    function renderDashboard(data, rate = 50.0) {
        contentArea.innerHTML = '';
        const { day, daysInMonth, remainingDays, monthName, weekRange } = getDateContext();

        // Target Logic
        let targetAmount = parseFloat(localStorage.getItem('sales_monthly_target')) || 10000;
        const currentUsdStr = data.currentMonth ? data.currentMonth.usdAmount : "$0";
        const currentUsdVal = parseFloat(currentUsdStr.replace(/[$,]/g, '')) || 0;
        
        // Calculations
        const remainingVal = Math.max(0, targetAmount - currentUsdVal);
        const percentAchieved = Math.min(100, (currentUsdVal / targetAmount) * 100);
        
        const requiredDaily = remainingVal / remainingDays;
        
        // EGP Conversion
        const currentEgpVal = (currentUsdVal * rate).toLocaleString(undefined, { maximumFractionDigits: 0 });
        const remainingEgpVal = (remainingVal * rate).toLocaleString(undefined, { maximumFractionDigits: 0 });
        const targetEgpVal = (targetAmount * rate).toLocaleString(undefined, { maximumFractionDigits: 0 });

        const targetCard = document.createElement('div');
        targetCard.className = 'glass-card target-progress-card';
        targetCard.style.marginBottom = '2rem';
        targetCard.style.padding = '2rem';
        targetCard.style.background = 'linear-gradient(135deg, rgba(255, 215, 0, 0.05) 0%, rgba(0, 0, 0, 0.2) 100%)';
        targetCard.style.border = '1px solid rgba(255, 215, 0, 0.2)';
        
        targetCard.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 2rem; position: relative; z-index: 1;">
                <div>
                    <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 10px;">
                        <h3 style="margin: 0; color: var(--metallic-gold); font-size: 1.7rem; font-family:'Cairo'; font-weight: 800; text-shadow: 0 0 20px rgba(255,215,0,0.2);">
                            <i class="fa-solid fa-bullseye"></i> هدف مبيعات الشهر (${monthName})
                        </h3>
                        <button id="edit-target-btn" class="radio-mini-btn" title="تعديل الهدف" style="width:32px; height:32px; background:rgba(255,215,0,0.1); border: 1px solid rgba(255,215,0,0.3); border-radius: 10px; cursor: pointer;">
                            <i class="fa-solid fa-pen" style="font-size:0.75rem; color:var(--metallic-gold);"></i>
                        </button>
                    </div>
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <p style="margin: 0; color: rgba(255,255,255,0.9); font-size: 1.1rem; font-family:'Cairo'; font-weight: 700;">
                            $${targetAmount.toLocaleString()} <span style="font-size: 0.85rem; color: rgba(255,255,255,0.4); font-weight: 500;">(≈ ${targetEgpVal} EGP)</span>
                        </p>
                        <div id="rate-badge" title="سعر الصرف المباشر - انقر للتعديل" style="background: rgba(74, 222, 128, 0.1); color: #4ade80; font-size: 0.8rem; padding: 6px 14px; border-radius: 100px; border: 1px solid rgba(74, 222, 128, 0.2); font-family:'Inter'; cursor: pointer; display: flex; align-items: center; gap: 8px; backdrop-filter: blur(10px);">
                            <span class="live-pulse" style="width: 8px; height: 8px; background: #4ade80; border-radius: 50%; box-shadow: 0 0 10px #4ade80;"></span>
                            <span style="font-weight: 700;">$1 = ${rate} EGP</span>
                        </div>
                    </div>
                </div>
                <div class="target-achievement-container">
                    <div class="target-percent">${percentAchieved.toFixed(1)}%</div>
                    <div class="target-date-info">اليوم ${day} من ${daysInMonth}</div>
                </div>
            </div>
            
            <div style="background: rgba(0,0,0,0.4); height: 14px; border-radius: 100px; overflow: hidden; margin-bottom: 2rem; border: 1px solid rgba(255,255,255,0.05); padding: 3px; position: relative; z-index: 1;">
                <div class="progress-bar-glow" style="width: ${percentAchieved}%; height: 100%; border-radius: 100px; background: linear-gradient(90deg, #FBBF24, #F59E0B); transition: width 1.5s cubic-bezier(0.34, 1.56, 0.64, 1);"></div>
            </div>

            <p style="font-size: 1rem; color: rgba(255,255,255,0.8); margin-bottom: 2rem; display: flex; align-items: center; gap: 12px; font-family:'Cairo'; font-weight: 600; background: rgba(251, 191, 36, 0.05); padding: 12px 20px; border-radius: 16px; border: 1px solid rgba(251, 191, 36, 0.1); width: fit-content; position: relative; z-index: 1;">
                <i class="fa-solid fa-person-running" style="color: #FBBF24; font-size: 1.2rem;"></i>
                تحتاج إلى <span style="color: #FBBF24; font-weight: 800;">$${requiredDaily.toLocaleString(undefined, {maximumFractionDigits:0})}</span> يومياً <span style="font-size:0.85rem; opacity:0.6;">(≈ ${(requiredDaily * rate).toLocaleString(undefined, {maximumFractionDigits:0})} EGP)</span> للوصول للتارجت إن شاء الله.
            </p>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 1.5rem; position: relative; z-index: 1;">
                <div class="target-stat-box" style="padding: 1.5rem; border-radius: 24px; text-align: center;">
                    <div style="font-size: 0.9rem; color: rgba(255,255,255,0.4); margin-bottom: 10px; font-family:'Cairo'; font-weight: 600;">تم تحقيقه بفضل الله</div>
                    <div style="font-size: 1.8rem; font-weight: 900; color: #4ade80; font-family:'Inter'; letter-spacing: -1px;">$${currentUsdVal.toLocaleString()}</div>
                    <div style="font-size: 0.95rem; color: rgba(74, 222, 128, 0.6); font-family:'Inter'; font-weight: 600; margin-top: 4px;">≈ ${currentEgpVal} EGP</div>
                </div>
                <div class="target-stat-box" style="padding: 1.5rem; border-radius: 24px; text-align: center;">
                    <div style="font-size: 0.9rem; color: rgba(255,255,255,0.4); margin-bottom: 10px; font-family:'Cairo'; font-weight: 600;">متبقي للهدف إن شاء الله</div>
                    <div style="font-size: 1.8rem; font-weight: 900; color: #f87171; font-family:'Inter'; letter-spacing: -1px;">$${remainingVal.toLocaleString()}</div>
                    <div style="font-size: 0.95rem; color: rgba(248, 113, 113, 0.6); font-family:'Inter'; font-weight: 600; margin-top: 4px;">≈ ${remainingEgpVal} EGP</div>
                </div>
            </div>
        `;

        targetCard.querySelector('#edit-target-btn').onclick = () => {
            const newTarget = prompt('أدخل هدف المبيعات الجديد ($):', targetAmount);
            if (newTarget && !isNaN(newTarget)) {
                localStorage.setItem('sales_monthly_target', newTarget);
                loadData(true);
                Notifications.success(`تم تحديث الهدف إلى $${parseFloat(newTarget).toLocaleString()}`);
            }
        };

        targetCard.querySelector('#rate-badge').onclick = () => {
            const current = localStorage.getItem('manual_usd_egp_rate') || rate;
            const newRate = prompt('أدخل سعر صرف الدولار مقابل الجنيه (EGP) كما هو في جوجل:', current);
            if (newRate === '') {
                localStorage.removeItem('manual_usd_egp_rate');
                loadData(true);
                Notifications.success('تمت العودة لسعر الصرف التلقائي');
            } else if (newRate && !isNaN(newRate)) {
                localStorage.setItem('manual_usd_egp_rate', newRate);
                loadData(true);
                Notifications.success(`تم تحديث سعر الصرف يدوياً إلى ${newRate} EGP`);
            }
        };

        contentArea.appendChild(targetCard);

        // Create Grid Container for Timeline
        const gridContainer = document.createElement('div');
        gridContainer.style.marginTop = '1.5rem';
        gridContainer.className = 'sales-grid-container';

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
                    <div>
                        <div class="sales-card-label">${periodLabels[key] || key}</div>
                        ${key === 'currentWeek' ? `<div class="sales-card-meta">${weekRange}</div>` : ''}
                        ${key === 'today' ? `<div class="sales-card-meta">${new Date().toLocaleDateString('ar-EG', { month: 'short', day: 'numeric' })}</div>` : ''}
                    </div>
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

        // Inject Timeline Bar
        const timelineBar = document.createElement('div');
        timelineBar.className = 'timeline-v-bar';
        timelineBar.innerHTML = `<div class="timeline-progress" id="scrolling-progress"></div>`;
        gridContainer.appendChild(timelineBar);

        // Milestone mappings for Data labels
        const milestones = {
            today: 'اليوم',
            yesterday: 'الأمس',
            currentWeek: 'الأسبوع',
            currentMonth: 'الشهري',
            lastMonth: 'السابق',
            currentYear: 'السنوي',
            totalSales: 'الإجمالي'
        };

        const dataEntries = Object.entries(data);
        const rowCount = Math.ceil(dataEntries.length / 2);

        for (let i = 0; i < rowCount; i++) {
            const [key, val] = dataEntries[i * 2];
            const isTrendUp = val.trend && val.trend.startsWith('+');

            const node = document.createElement('div');
            node.className = `timeline-node ${isTrendUp ? 'positive' : 'negative'}`;
            node.id = `node-${i}`;

            const leftArm = document.createElement('div');
            leftArm.className = 'timeline-arm left';
            leftArm.id = `arm-l-${i}`;

            const rightArm = document.createElement('div');
            rightArm.className = 'timeline-arm right';
            rightArm.id = `arm-r-${i}`;

            gridContainer.appendChild(node);
            gridContainer.appendChild(leftArm);
            gridContainer.appendChild(rightArm);
        }

        gridContainer.appendChild(grid);
        contentArea.appendChild(gridContainer);

        // Timeline Awareness Logic
        const updateTimeline = () => {
            const containerRect = gridContainer.getBoundingClientRect();
            const viewHeight = window.innerHeight;
            
            // Progress Calculation
            const scrollY = window.scrollY;
            const docHeight = document.documentElement.scrollHeight;
            const isAtBottom = (window.innerHeight + scrollY) >= (docHeight - 20);
            
            let progress = 0;
            const containerTop = gridContainer.offsetTop;
            const containerHeight = gridContainer.offsetHeight;
            const scrollRelative = (scrollY + viewHeight / 2) - containerTop;
            
            progress = (scrollRelative / containerHeight) * 100;

            if (isAtBottom) progress = 100;
            if (scrollY < containerTop - 200) progress = 0;
            
            const progressEl = gridContainer.querySelector('#scrolling-progress');
            if (progressEl) progressEl.style.height = `${Math.max(0, Math.min(100, progress))}%`;

            // Node Activation
            const nodes = gridContainer.querySelectorAll('.timeline-node');
            const cards = grid.querySelectorAll('.sales-card');
            
            nodes.forEach((node, idx) => {
                const rowStartCard = cards[idx * 2];
                if (rowStartCard) {
                    const cardRect = rowStartCard.getBoundingClientRect();
                    const nodeTop = (idx * (cardRect.height + 64)) + (cardRect.height / 2); 
                    
                    node.style.top = `${nodeTop}px`;
                    
                    const lArm = gridContainer.querySelector(`#arm-l-${idx}`);
                    const rArm = gridContainer.querySelector(`#arm-r-${idx}`);
                    if (lArm) lArm.style.top = `${nodeTop}px`;
                    if (rArm) rArm.style.top = `${nodeTop}px`;

                    const isLastNode = idx === nodes.length - 1;

                    if (cardRect.top < viewHeight / 2 + 100 || (isAtBottom && isLastNode)) {
                        node.classList.add('active');
                        if (lArm) lArm.style.width = '30px', lArm.style.opacity = '1';
                        if (rArm) rArm.style.width = '30px', rArm.style.opacity = '1';
                        
                        rowStartCard.classList.add('timeline-active');
                        const secondCard = cards[idx * 2 + 1];
                        if (secondCard) secondCard.classList.add('timeline-active');
                    } else {
                        node.classList.remove('active');
                        if (lArm) lArm.style.width = '0', lArm.style.opacity = '0';
                        if (rArm) rArm.style.width = '0', rArm.style.opacity = '0';
                        
                        rowStartCard.classList.remove('timeline-active');
                        const secondCard = cards[idx * 2 + 1];
                        if (secondCard) secondCard.classList.remove('timeline-active');
                    }
                }
            });
        };

        window.addEventListener('scroll', updateTimeline);
        setTimeout(updateTimeline, 100); // Initial sync

        // Real-time Auto-refresh (Every 5 minutes)
        const refreshInterval = setInterval(async () => {
            if (!container.isConnected) return clearInterval(refreshInterval);
            if (localStorage.getItem('manual_usd_egp_rate')) return;
            
            const newRate = await getLiveExchangeRate();
            const badge = container.querySelector('#rate-badge span:nth-child(2)');
            if (badge) {
                badge.innerText = `$1 = ${newRate} EGP`;
            }
        }, 300000); // 5 minutes
    }


    function renderError(msg, technical) {
        contentArea.innerHTML = `
            <div class="sales-error" style="max-width: 600px; margin: 4rem auto; text-align: center;">
                <div style="background: rgba(255, 215, 0, 0.05); width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 2rem; border: 1px solid rgba(255, 215, 0, 0.2);">
                    <i class="fa-solid fa-sync-alt fa-spin-hover" style="font-size: 2.5rem; color: var(--metallic-gold);"></i>
                </div>
                
                <h2 style="color: #fff; margin-bottom: 1rem; font-weight: 800; font-size: 1.8rem;">نظام المزامنة </h2>
                <p style="color: rgba(255,255,255,0.7); font-size: 1.1rem; margin-bottom: 2.5rem; line-height: 1.6;">
                    يرجى تزويد النظام ببيانات المبيعات المحدثة من منصة المدرسة.
                </p>
                
                <div class="manual-input-container" style="background: rgba(255, 255, 255, 0.02); border: 1px solid rgba(255, 255, 255, 0.05); border-radius: 24px; padding: 2.5rem; backdrop-filter: blur(10px);">
                    <div style="text-align: right; margin-bottom: 1.5rem;">
                        <h3 style="color: var(--metallic-gold); margin-bottom: 0.5rem; display: flex; align-items: center; gap: 12px; font-size: 1.2rem;">
                            <i class="fa-solid fa-paste"></i> مزامنة البيانات الفورية
                        </h3>
                  
                    </div>
 
                    <textarea id="manual-paste-area" 
                        placeholder="الصق تقارير المبيعات هنا..." 
                        style="width: 100%; height: 180px; background: rgba(0,0,0,0.3); border: 1px solid rgba(255,215,0,0.1); border-radius: 16px; color: #fff; padding: 20px; font-family: 'Cairo', sans-serif; font-size: 14px; line-height: 1.6; resize: none; margin-bottom: 1.5rem; outline: none; transition: all 0.3s ease; text-align: right;"></textarea>
 
                    <button id="parse-manual-btn" class="btn btn-primary" style="padding: 18px 40px; font-weight: 800; width: 100%; font-size: 1.1rem; display: flex; align-items: center; justify-content: center; gap: 12px; background: linear-gradient(135deg, #FFD700 0%, #B8860B 100%); border: none; color: #000; box-shadow: 0 10px 25px rgba(212, 175, 55, 0.2); border-radius: 14px; cursor: pointer;">
                        <i class="fa-solid fa-wand-magic-sparkles"></i> بدء المعالجة وتحليل المبيعات
                    </button>
                </div>
            </div>
        `;
        
        
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
                        localStorage.setItem('sales_dashboard_initialized', 'true');
                        renderDashboard(data);
                        updateTimestamp(true);
                        Notifications.success('تم تحديث بيانات المبيعات بنجاح');
                        
                        // Auto-refresh after 1 second as requested
                        setTimeout(() => {
                            location.reload();
                        }, 1000);
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
        today: { usdAmount: "$0", egpAmount: "1,590 EGP", totalEgp: "1,590 EGP", orders: "11", trend: "-98%" },
        yesterday: { usdAmount: "$641", egpAmount: "48,067 EGP", totalEgp: "78,570 EGP", orders: "470", trend: "-50%" },
        currentWeek: { usdAmount: "$641", egpAmount: "49,657 EGP", totalEgp: "80,160 EGP", orders: "481", trend: "-47%" },
        currentMonth: { usdAmount: "$5,191", egpAmount: "374,276 EGP", totalEgp: "621,301 EGP", orders: "1,436", trend: "-36%" },
        lastMonth: { usdAmount: "$9,635", egpAmount: "475,940 EGP", totalEgp: "934,457 EGP", orders: "693", trend: "-51%" },
        currentYear: { usdAmount: "$95,457", egpAmount: "6,944,758 EGP", totalEgp: "11,615,169 EGP", orders: "11,886", trend: null },
        lastYear: { usdAmount: "$56,596", egpAmount: "3,391,053 EGP", totalEgp: "6,125,173 EGP", orders: "6,634", trend: null },
        totalSales: { usdAmount: "$173,969", egpAmount: "11,270,972 EGP", totalEgp: "19,549,705 EGP", orders: "24,657", trend: null },
        outsideCurrent: { usdAmount: "$1,789", egpAmount: "123,955 EGP", totalEgp: "209,089 EGP", orders: "286", trend: "+0%" },
        outsideLast: { usdAmount: "$2,200", egpAmount: "204,199 EGP", totalEgp: "204,199 EGP", orders: "247", trend: "-45%" }
    };

    function init() {
        // Only seed demo data if the user has NEVER used the sales report before
        // This prevents old demo data from coming back after a user clears it or enters their own.
        const currentData = Storage.get('last_sales_data');
        const hasBeenWarnedOrUsed = localStorage.getItem('sales_dashboard_initialized');
        
        if (!currentData && !hasBeenWarnedOrUsed) {
            localStorage.setItem('last_sales_data', JSON.stringify(DEMO_DATA));
            localStorage.setItem('last_sales_update', Date.now());
            localStorage.setItem('sales_dashboard_initialized', 'true');
        }
    }

    function updateTimestamp() {
        const span = header.querySelector('#last-updated');
        if (span) {
            const now = new Date();
            const time = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            span.innerHTML = `<span style="color:rgba(255,255,255,0.6); font-family:'Cairo'; font-size:0.85rem; font-weight:700;">${time}</span>`;
        }
    }


    header.querySelector('#reset-sales-btn').onclick = () => {
        if (confirm('هل أنت متأكد من مسح البيانات الحالية والبدء من جديد؟')) {
            Storage.set('last_sales_data', null);
            localStorage.removeItem('last_sales_update');
            localStorage.setItem('sales_dashboard_initialized', 'true');
            loadData(true);
            Notifications.info('تم مسح البيانات. يمكنك الآن استخدام Relay أو اللصق اليدوي.');
        }
    };

    // Event Listeners for Live Updates
    EventBus.on('sales:updated', (payload) => {
        if (container.isConnected) {
            loadData(); // Re-fetch rate and render
        }
    });

    // Initial load
    init();
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
        throw new Error('يتطلب الوصول إلى البيانات مزامنة يدوية بسيطة لضمان أعلى مستويات الأمان والدقة.');
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
        { key: "currentMonth", patterns: ["Current month", "Sales"], mustHaveBoth: true, notHave: ["Out-side"] },
        { key: "lastMonth", patterns: ["Last month", "Sales"], mustHaveBoth: true, notHave: ["Out-side"] },
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
            if (line.length < 300) { 
                results[currentKey].rawText += " | " + line;
            }
        }
    });

    Object.keys(results).forEach(key => {
        const content = results[key].rawText;
        const usdMatch = content.match(/(\$\s?[\d,.]+)|([\d,.]+\s?\$)|(\$[\d,.]+)/i);
        const egpMatch = content.match(/([\d,.]+\s?EGP)|(EGP\s?[\d,.]+)/i);
        const ordersMatch = content.match(/(Orders|الطلبات|طلب|Orders Count):?\s?([\d,]+)/i);
        const trendMatch = content.match(/([+-]\s?\d+%)(\s*since)?/i);
        const fallbackAmountMatch = content.match(/([\d,.]+)/);

        const clean = (m, group = 0) => {
            if (!m) return null;
            let val = (group === 0 ? m[0] : m[group]).replace(/[^\d.,]/g, '').trim();
            if (val.endsWith('.')) val = val.slice(0, -1);
            return val;
        };

        const usdVal = clean(usdMatch);
        const egpVal = clean(egpMatch);
        const ordersVal = clean(ordersMatch, 2);
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

    return results;
}

function showEliteAnalyticsHub(data) {
    if (!data || typeof data !== 'object' || Object.keys(data).length < 2) {
        return Notifications.warning('يرجى تحديث بيانات المبيعات أولاً للحصول على تحليلات دقيقة.');
    }

    const modal = document.createElement('div');
    modal.style.cssText = `
        position: fixed; top: 0; left: 0; width: 100%; height: 100%;
        background: rgba(0,0,0,0.92); backdrop-filter: blur(25px);
        z-index: 10000; display: flex; align-items: center; justify-content: center;
        padding: 1rem; direction: rtl;
    `;

    const parseVal = (str) => {
        if (!str || str === '---') return 0;
        const cleaned = str.toString().replace(/[$,\sEGP]/g, '').replace(/,/g, '');
        return parseFloat(cleaned) || 0;
    };

    const ctx = getDateContext();
    const day = ctx.day;
    const daysInMonth = ctx.daysInMonth;
    
    // Core Values Parsing
    const todayEgp = parseVal(data.today?.totalEgp);
    const yestEgp = parseVal(data.yesterday?.totalEgp);
    const monthUsd = parseVal(data.currentMonth?.usdAmount);
    const lastMonthUsd = parseVal(data.lastMonth?.usdAmount);
    const yearUsd = parseVal(data.currentYear?.usdAmount);
    const lastYearUsd = parseVal(data.lastYear?.usdAmount);
    const totalOrderMonth = parseVal(data.currentMonth?.orders);
    const outsideUsd = parseVal(data.outsideCurrent?.usdAmount);
    const targetAmount = parseFloat(localStorage.getItem('sales_monthly_target')) || 10000;

    const metrics = [
        { title: "متوسط الطلبية اليوم", icon: "fa-calculator", calc: () => (todayEgp / (parseVal(data.today?.orders) || 1)).toLocaleString(undefined, {maximumFractionDigits:0}) + " EGP", desc: "القيمة المتوسطة لكل طلب تم اليوم" },
        { title: "نمو المبيعات (أمس/اليوم)", icon: "fa-chart-line", calc: () => yestEgp === 0 ? "جديد" : (((todayEgp - yestEgp) / yestEgp) * 100).toFixed(1) + "%", desc: "نسبة التغير في المبيعات بين اليوم وأمس" },
        { title: "الزخم الشهري الحالي", icon: "fa-bolt", calc: () => (monthUsd / (targetAmount || 1) * 100).toFixed(1) + "%", desc: "مدى التقدم المحقق من الهدف الشهري الكلي" },
        { title: "توقع إغلاق الشهر", icon: "fa-wand-magic-sparkles", calc: () => "$" + (monthUsd / Math.max(1, day) * daysInMonth).toLocaleString(undefined, {maximumFractionDigits:0}), desc: "المبلغ المتوقع الوصول إليه بنهاية الشهر" },
        { title: "نسبة المبيعات الخارجية", icon: "fa-globe", calc: () => ((outsideUsd / (monthUsd || 1)) * 100).toFixed(1) + "%", desc: "نسبة المبيعات من خارج التصنيف الأساسي" },
        { title: "مؤشر كفاءة التحويل", icon: "fa-bullseye", calc: () => (totalOrderMonth / (Math.max(1, monthUsd)/1000)).toFixed(1), desc: "عدد الطلبات لكل 1000 دولار محقق" },
        { title: "قوة النمو السنوي", icon: "fa-arrow-up-right-dots", calc: () => lastYearUsd === 0 ? "جديد" : (((yearUsd - lastYearUsd) / lastYearUsd) * 100).toFixed(1) + "%", desc: "نسبة نمو السنة الحالية مقارنة بالماضية" },
        { title: "الاستدامة الائتمانية", icon: "fa-shield-halved", calc: () => (monthUsd > (lastMonthUsd * 0.8) ? "مستقرة" : "تحدي"), desc: "مدى حفاظ المبيعات على مستوياتها التاريخية" },
        { title: "المعدل اليومي المطلوب", icon: "fa-person-running", calc: () => "$" + (Math.max(0, targetAmount - monthUsd) / Math.max(1, daysInMonth - day)).toLocaleString(undefined, {maximumFractionDigits:0}), desc: "المعدل اليومي المطلوب للوصول للهدف" },
        { title: "كثافة السوق الأسبوعية", icon: "fa-calendar-week", calc: () => (parseVal(data.currentWeek?.orders) / 7).toFixed(1) + " طلب", desc: "متوسط الطلبات اليومي المحقق هذا الأسبوع" },
        { title: "سرعة التدفق المالي", icon: "fa-gauge-high", calc: () => (todayEgp / 24).toLocaleString(undefined, {maximumFractionDigits:0}) + " EGP/س", desc: "متوسط الإيراد المحقق في كل ساعة عمل اليوم" },
        { title: "الوزن النسبي للشهر", icon: "fa-ranking-star", calc: () => ((monthUsd / (yearUsd || 1)) * 100).toFixed(1) + "%", desc: "مساهمة الشهر الحالي من إجمالي السنة" }
    ];

    modal.innerHTML = `
        <div style="background: #0a0a0a; border: 2px solid #FFD700; width: 100%; max-width: 1100px; max-height: 90vh; border-radius: 40px; overflow: hidden; display: flex; flex-direction: column; box-shadow: 0 0 100px rgba(0,0,0,0.9); position: relative;">
            
            <div style="padding: 2rem; background: linear-gradient(180deg, rgba(255,215,0,0.15), transparent); border-bottom: 1px solid rgba(255,255,255,0.1); display:flex; justify-content: space-between; align-items: center;">
                <div style="text-align: right;">
                    <h2 style="margin:0; color:#FFD700; font-size:2rem; font-family:'Cairo'; font-weight: 800; text-shadow: 0 0 15px rgba(255,215,0,0.4);">بعض التحليلات المبنية على تقرير المبيعات</h2>
                </div>
                <button id="close-analytics-btn" style="background:rgba(255,255,255,0.1); border:1px solid #FFD700; color:#FFD700; width:45px; height:45px; border-radius:50%; cursor:pointer; font-size: 1.2rem; display: flex; align-items: center; justify-content: center; transition: all 0.3s;">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
            
            <div style="flex:1; overflow-y: auto; padding: 2rem; display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 1.2rem; background: #0f0f0f;">
                ${metrics.map((m, i) => `
                    <div class="analytics-item" style="background: #1a1a1a; border: 1px solid rgba(255,255,255,0.1); padding: 1.5rem; border-radius: 24px; display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; height: 180px; transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); cursor: default; animation: card-fade-in 0.5s ease forwards; animation-delay: ${i * 0.03}s; opacity: 0; transform: translateY(10px);">
                        <div style="background: rgba(255,215,0,0.15); width: 50px; height: 50px; border-radius: 15px; display: flex; align-items: center; justify-content: center; margin-bottom: 0.8rem; border: 1px solid rgba(255,215,0,0.3);">
                            <i class="fa-solid ${m.icon}" style="color: #FFD700; font-size: 1.4rem;"></i>
                        </div>
                        <div style="font-size: 0.85rem; color: #FFD700; font-weight: 700; font-family:'Cairo', sans-serif !important; margin-bottom: 5px; text-transform: uppercase; letter-spacing: 0.5px;">${m.title}</div>
                        <div style="font-size: 1.7rem; font-weight: 900; color: #FFFFFF !important; font-family:'Cairo', sans-serif !important; margin-bottom: 8px; line-height: 1.2;">${m.calc()}</div>
                        <div style="font-size: 0.7rem; color: rgba(255,255,255,0.4); font-family:'Cairo', sans-serif !important; line-height: 1.2; padding: 0 10px;">${m.desc}</div>
                    </div>
                `).join('')}
            </div>
            
            <div style="padding: 1rem; background: #050505; text-align: center; border-top: 1px solid rgba(255,255,255,0.1);">
                <span style="color: #FFD700; font-size: 0.85rem; font-family: 'Cairo'; opacity: 0.7;">
                    <i class="fa-solid fa-shield-halved"></i> تم توليد هذه التحليلات فورياً من البيانات المحفوظة للجهاز | LeadSync Elite Engine v1.0
                </span>
            </div>
        </div>
        
        <style>
            .analytics-item:hover {
                transform: translateY(-5px) !important;
                background: #222 !important;
                border-color: #FFD700 !important;
                box-shadow: 0 15px 30px rgba(0,0,0,0.5), 0 0 15px rgba(255,215,0,0.1);
            }
            #close-analytics-btn:hover {
                background: #ef4444 !important;
                border-color: #ef4444 !important;
                color: #fff !important;
            }
            @keyframes card-fade-in {
                to { opacity: 1; transform: translateY(0); }
            }
        </style>
    `;

    document.body.appendChild(modal);
    modal.querySelector('#close-analytics-btn').onclick = () => modal.remove();
    modal.onclick = (e) => { if (e.target === modal) modal.remove(); };
}
