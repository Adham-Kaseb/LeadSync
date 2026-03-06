/* sync-relay.js - LeadSync Smart Relay System */
import { Storage, Notifications, EventBus } from './core.js';
import { parseSalesData } from './sales-report.js';

class SyncRelay {
    constructor() {
        this.channel = new BroadcastChannel('leadsync_relay');
        this.setupListener();
    }

    setupListener() {
        this.channel.onmessage = (event) => {
            const { type, data, source } = event.data;
            
            if (type === 'SALES_DATA_PUSH') {
                console.log('SyncRelay: Received data push from', source);
                this.handleDataPush(data);
            }
        };
    }

    handleDataPush(html) {
        try {
            const parsedData = parseSalesData(html);
            Storage.set('last_sales_data', parsedData);
            localStorage.setItem('last_sales_update', Date.now());
            
            Notifications.success('تم استلام مبيعات Almdrasa عبر Relay!');
            EventBus.emit('sales:updated', parsedData);
        } catch (e) {
            console.error('SyncRelay Error:', e);
            Notifications.error('فشل معالجة البيانات المستلمة عبر Relay');
        }
    }

    getBookmarkletCode() {
        const script = `
            (function() {
                if (window._leadsync_relay_active) {
                    alert('📡 LeadSync Streaming Relay نشط بالفعل في هذا التبويب.');
                    return;
                }
                const bc = new BroadcastChannel('leadsync_relay');
                let lastHash = "";
                
                const push = () => {
                    const html = document.body.innerHTML;
                    // Simple hash to avoid spamming identical data
                    const currentHash = html.length + html.substring(0, 100); 
                    if (currentHash === lastHash) return;
                    lastHash = currentHash;

                    bc.postMessage({ 
                        type: 'SALES_DATA_PUSH', 
                        data: html, 
                        source: 'LeadSync Streaming Relay' 
                    });
                    console.log('LeadSync: Data Streamed 🚀');
                };

                // 1. Instant Push on Init
                push();

                // 2. High Frequency Heartbeat Polling (30s)
                setInterval(push, 30000);

                // 3. MutationObserver for Real-Time UI changes (Instant)
                const observer = new MutationObserver(Utils.debounce(push, 2000));
                observer.observe(document.body, { childList: true, subtree: true, characterData: true });
                
                window._leadsync_relay_active = true;
                
                const ui = document.createElement('div');
                ui.style = 'position:fixed; bottom:20px; right:20px; background:rgba(0,0,0,0.85); color:#ffcc00; padding:12px 24px; border-radius:50px; z-index:999999; font-weight:900; box-shadow:0 8px 32px rgba(0,0,0,0.5); font-family:Cairo, sans-serif; display:flex; align-items:center; gap:12px; border:1px solid rgba(255,204,0,0.3); backdrop-filter:blur(10px); pointer-events:none; transition: all 0.5s ease;';
                ui.innerHTML = '<span style="width:12px; height:12px; background:#ffcc00; border-radius:50%; box-shadow:0 0 15px #ffcc00; animation: leadsync-pulse 1.5s infinite;"></span> LeadSync Streaming ON';
                
                const style = document.createElement('style');
                style.innerText = '@keyframes leadsync-pulse { 0% { transform: scale(1); opacity:1; } 50% { transform: scale(1.4); opacity:0.4; } 100% { transform: scale(1); opacity:1; } }';
                document.head.appendChild(style);
                document.body.appendChild(ui);
                
                setTimeout(() => ui.style.opacity = '0.4', 5000);
            })();
        `.replace(/\n/g, '').replace(/\s\s+/g, ' ');
        
        return `javascript:${encodeURIComponent(script)}`;
    }

    renderSetupUI(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const code = this.getBookmarkletCode();
        
        container.innerHTML = `
            <div class="relay-setup-box glass-card" style="margin-top: 2rem; padding: 2rem; border: 1px dashed rgba(255,215,0,0.3);">
                <div style="display:flex; align-items:center; gap:15px; margin-bottom:1.5rem;">
                    <div class="sales-card-icon" style="--accent-rgb: 255,215,0">
                        <i class="fa-solid fa-satellite-dish"></i>
                    </div>
                    <div>
                        <h3 style="margin:0; color:var(--metallic-gold);">LeadSync Smart Relay</h3>
                        <p style="margin:5px 0 0; font-size:0.85rem; color:rgba(255,255,255,0.5);">أفضل بديل لـ CORS: اسحب الزر إلى شريط العلامات (Bookmarks)</p>
                    </div>
                </div>

                <div style="display:flex; flex-direction:column; gap:1rem; align-items:center;">
                    <a href="${code}" class="btn btn-gold" style="padding:15px 30px; font-weight:800; text-decoration:none; display:inline-flex; align-items:center; gap:10px;" onclick="return false;">
                        <i class="fa-solid fa-link"></i> LeadSync Relay 🚀
                    </a>
                    
                    <div style="font-size:0.8rem; color:rgba(255,255,255,0.4); text-align:center; max-width:400px; line-height:1.6;">
                        <i class="fa-solid fa-info-circle"></i> 
                        طريقة الاستخدام: افتح صفحة المبيعات في Almdrasa، ثم اضغط على العلامة البرمجية "LeadSync Relay" في شريط المتصفح. سيتم تحديث LeadSync تلقائياً!
                    </div>
                </div>
            </div>
        `;
    }
}

export const syncRelay = new SyncRelay();
