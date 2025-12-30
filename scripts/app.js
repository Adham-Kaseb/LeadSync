import { openAboutModal } from './about.js';
import { ShortcutsManager } from './shortcuts.js';
import { initHealthTimer } from './health.js';
import { syncManager } from './sync.js';
import { SmoothScroller } from './scroller.js';

let contentArea, navLinks;
let currentRouteId = 0;

window.sessionStartTime = Date.now(); 

const routes = {
    dashboard: async () => (await import('./dashboard.js')).renderDashboard(),
    leads: async () => (await import('./leads.js')).renderLeads(),
    almdrasa: async () => (await import('./almdrasa.js')).renderAlmdrasa(),
    messages: async () => (await import('./messages.js')).renderMessages(),
    notes: async () => (await import('./notes.js')).renderNotes(),
    links: async () => (await import('./links.js')).renderLinks(),
    calculator: async () => (await import('./calculator.js')).renderCalculator(),
    reminders: async () => (await import('./reminders.js')).renderReminders(),
    calendar: async () => (await import('./calendar.js')).renderCalendar(),
    articles: async () => (await import('./articles.js')).renderArticles(),
    tvmode: async () => (await import('./tv-mode.js')).renderTVMode(),
    whatsapp: async () => (await import('./whatsapp-hub.js')).renderWhatsAppHub(),
    settings: async () => (await import('./settings.js')).renderSettings(),
    passwords: async () => (await import('./passwords.js')).renderPasswords(),
    sales: async () => (await import('./sales-report.js')).renderSales(),
    meetings: async () => (await import('./meetings.js')).renderMeetings()
};

async function handleRoute() {
    if(!contentArea) contentArea = document.getElementById('app-content');
    if(!navLinks) navLinks = document.querySelectorAll('.nav-item');

    const routeId = ++currentRouteId; 
    const hash = window.location.hash.slice(1) || 'dashboard';
    
    navLinks.forEach(link => {
        if (link.getAttribute('data-target') === hash) {
            link.classList.add('active');
            // Auto-expand parent dropdown if exists
            const dropdown = link.closest('.nav-dropdown-container');
            if (dropdown) dropdown.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });

    const oldContent = contentArea.firstElementChild;
    if (oldContent) {
        oldContent.classList.add('page-exit');
        await new Promise(r => setTimeout(r, 150)); 
    }

    if (routeId !== currentRouteId) return;

    contentArea.innerHTML = `
        <div style="display:flex; flex-direction:column; align-items:center; justify-content:center; height:60vh; animation: fadeIn 0.3s ease;">
            <div class="spinner spinner-lg"></div>
            <p style="margin-top:1rem; color:var(--text-secondary); font-size:0.9rem;">جاري التحميل...</p>
        </div>
    `;
    
    if (window.scroller) {
        window.scroller.destroy();
        window.scroller = null;
    }

    if (routes[hash]) {
        try {
            const content = await routes[hash]();
            
            if (routeId !== currentRouteId) return;

            contentArea.innerHTML = ''; 
            
            if (content instanceof Node) {
                content.classList.add('page-enter');
                contentArea.appendChild(content);
            } else {
                throw new Error('Module did not return a valid DOM Node.');
            }

        } catch (error) {
            if (routeId !== currentRouteId) return;
            
            console.error('Error loading route:', error);
            import('./core.js').then(m => m.Notifications.error('فشل تحميل القسم المطلوب'));
            
            contentArea.innerHTML = `
                <div class="error-state page-enter" style="text-align: center; padding: 4rem 2rem;">
                    <div style="font-size: 4rem; color: var(--danger); margin-bottom: 1rem;"><i class="fa-solid fa-triangle-exclamation"></i></div>
                    <h2 style="margin-bottom: 0.5rem; color: var(--metallic-gold);">خطأ في التحميل</h2>
                    <p style="color: var(--text-secondary); margin-bottom: 2rem;">لم نتمكن من عرض هذا القسم.</p>
                    <button onclick="window.location.reload()" class="btn btn-primary"><i class="fa-solid fa-rotate-right"></i> إعادة التحميل</button>
                    <div style="margin-top: 2rem; opacity: 0.7; font-size:0.8rem; direction: ltr;">${error.message}</div>
                </div>
            `;
        }
    } else {
        if (routeId !== currentRouteId) return;
        contentArea.innerHTML = '<h2 class="page-enter" style="text-align:center; padding-top:4rem;">404 - Page Not Found</h2>';
    }

    // Always scroll to top on route change
    if (window.scroller) window.scroller.scrollTo(0);
}

function initCursor(style) {
    console.log('Cursor style set to:', style);
    if (style === 'default') {
        document.body.style.cursor = 'default';
        const cursorEl = document.getElementById('custom-cursor');
        if (cursorEl) cursorEl.style.display = 'none';
    } else {
        document.body.style.cursor = 'auto';
    }
}

function initApp() {
    contentArea = document.getElementById('app-content');
    navLinks = document.querySelectorAll('.nav-item');

    const appInfoTrigger = document.getElementById('app-info-trigger');
    if (appInfoTrigger) {
        appInfoTrigger.addEventListener('click', () => openAboutModal());
    }

    // Dropdown Toggle Logic
    const dropdownTrigger = document.getElementById('settings-dropdown-trigger');
    const dropdownContainer = document.querySelector('.nav-dropdown-container');
    if (dropdownTrigger && dropdownContainer) {
        dropdownTrigger.addEventListener('click', (e) => {
            e.stopPropagation();
            dropdownContainer.classList.toggle('active');
        });
    }

    const defaults = { 
        cursor: false, cursorStyle: 'default', lightning: false, trail: false, ripple: false, 
        magnetic: false, glow: false, fontSize: 100, parallax: false, clickEffect: 'none', 
        themeColor: '#FFD700', glassBlur: 20, borderRadius: 16, animationSpeed: 'normal'
    };
    const loaded = JSON.parse(localStorage.getItem('app_settings')) || {};
    const settings = { ...defaults, ...loaded };
    
    if (settings.cursor) initCursor(settings.cursorStyle || 'gold-ring'); else initCursor('default');
    window.clickEffectType = settings.clickEffect || 'none';
    
    if (settings.fontSize) document.documentElement.style.fontSize = (16 * (settings.fontSize / 100)) + 'px';

    if (settings.themeColor) {
        document.documentElement.style.setProperty('--metallic-gold', settings.themeColor);
        const r = parseInt(settings.themeColor.slice(1,3), 16), g = parseInt(settings.themeColor.slice(3,5), 16), b = parseInt(settings.themeColor.slice(5,7), 16);
        document.documentElement.style.setProperty('--gold-rgb', `${r}, ${g}, ${b}`);
    }

    if (settings.glassBlur) {
        document.documentElement.style.setProperty('--glass-blur', settings.glassBlur + 'px');
        document.querySelectorAll('.glass-panel').forEach(el => el.style.backdropFilter = `blur(${settings.glassBlur}px)`);
    }
    
    if (settings.borderRadius) {
        document.documentElement.style.setProperty('--panel-radius', settings.borderRadius + 'px');
         const s = document.createElement('style');
         s.innerHTML = `.glass-panel, .btn, .card, .nav-item { border-radius: ${settings.borderRadius}px !important; }`;
         document.head.appendChild(s);
    }

    if (settings.animationSpeed) {
        let duration = '0.3s';
        if(settings.animationSpeed === 'slow') duration = '0.6s';
        if(settings.animationSpeed === 'fast') duration = '0.15s';
        document.documentElement.style.setProperty('--transition-speed', duration);
    }

    // Initialize Smoooooooth Global Scroller
    window.scroller = new SmoothScroller({ speed: 0.08, strength: 1.0 });

    const modules = ['leads', 'almdrasa', 'sales', 'messages', 'notes', 'links', 'calculator', 'reminders', 'calendar', 'tvmode', 'whatsapp', 'articles', 'meetings'];
    modules.forEach(mod => {
        const target = mod; 
        const navLink = document.querySelector(`a[data-target="${target}"]`);
        
        let shouldShow = settings[mod] !== false; 
        
        if (navLink && navLink.parentNode) {
            navLink.parentNode.style.display = shouldShow ? 'block' : 'none';
        }
        
        if (!shouldShow && window.location.hash === `#${target}`) {
            window.location.hash = '#dashboard';
        }
    });

    handleRoute();
}

window.updateCursorStyle = (style) => initCursor(style);
window.updateClickEffect = (style) => window.clickEffectType = style;

function initMobileUI() {
    const menuToggle = document.getElementById('mobile-menu-toggle');
    const launcherBtn = document.getElementById('mobile-launcher-btn');
    const sidebar = document.querySelector('.sidebar');
    const sectionTitle = document.getElementById('mobile-section-title');
    const headerClock = document.getElementById('header-clock');

    const toggleMenu = () => sidebar.classList.toggle('active');

    if (menuToggle) menuToggle.addEventListener('click', toggleMenu);
    if (launcherBtn) launcherBtn.addEventListener('click', toggleMenu);

    sidebar.addEventListener('click', (e) => {
        if (e.target.closest('.nav-item')) {
            sidebar.classList.remove('active');
        }
    });

    const updateClock = () => {
        const now = new Date();
        const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
        if (headerClock) headerClock.textContent = timeStr;
    };
    setInterval(updateClock, 1000);
    updateClock();

    window.addEventListener('hashchange', () => {
        const hash = window.location.hash.slice(1) || 'dashboard';
        const activeNav = document.querySelector(`.nav-item[data-target="${hash}"]`);
        
        if (sectionTitle) {
            if (hash === 'dashboard') {
                sectionTitle.textContent = sessionStorage.getItem('currentUser') || 'الـ HQ';
            } else if (activeNav) {
                sectionTitle.textContent = activeNav.textContent.trim();
            }
        }

        document.querySelectorAll('.dock-item').forEach(item => {
            if (item.getAttribute('data-target') === hash) {
                item.classList.add('active');
            } else {
                item.classList.remove('active');
            }
        });
    });
}

window.addEventListener('hashchange', handleRoute);
window.addEventListener('DOMContentLoaded', async () => {
    initApp(); 
    initMobileUI();
    ShortcutsManager.init();
    createLockScreen(); 
    
    try {
        const { checkReminders } = await import('./reminders.js');
        setInterval(checkReminders, 60000); 
        checkReminders(); 
        
        initHealthTimer();
        
        const { initHoverCounter } = await import('./hover-counter.js');
        initHoverCounter();

        // Initialize Cloud Sync
        syncManager.initialize();

    } catch (e) {
        console.error('Failed to start background services:', e);
    }
});

window.onerror = function(msg, url, lineNo, columnNo, error) {
    console.error('Global Error:', msg, 'at', lineNo);
    return false; 
};


function createLockScreen() {
    if (sessionStorage.getItem('auth') === 'true') return;

    const lockScreen = document.createElement('div');
    lockScreen.id = 'lock-screen';

    const overlay = document.createElement('div');
    overlay.className = 'lock-bg-overlay';
    lockScreen.appendChild(overlay);

    const container = document.createElement('div');
    container.className = 'lock-container';

    const settings = JSON.parse(localStorage.getItem('app_settings')) || {};
    const bgType = settings.lockScreenBg || 'image';

    if (bgType === 'video') {
        const video = document.createElement('video');
        video.src = 'images/Background_Image_Animation_Complete.mp4';
        video.autoplay = true;
        video.loop = true;
        video.muted = true;
        video.playsInline = true;
        video.style.position = 'absolute';
        video.style.top = '0';
        video.style.left = '0';
        video.style.width = '100%';
        video.style.height = '100%';
        video.style.objectFit = 'cover';
        video.style.zIndex = '-1';
        video.style.opacity = '0.8';
        lockScreen.appendChild(video);
    } else {
        const bgImage = document.createElement('img');
        bgImage.src = 'images/pass-wall.jpg';
        bgImage.style.position = 'absolute';
        bgImage.style.top = '0';
        bgImage.style.left = '0';
        bgImage.style.width = '100%';
        bgImage.style.height = '100%';
        bgImage.style.objectFit = 'cover';
        bgImage.style.zIndex = '-1';
        bgImage.style.opacity = '0.7';
        lockScreen.appendChild(bgImage);
    }

    container.innerHTML = `
        <div class="lock-title">
            <i class="fa-solid fa-shield-halved shield-icon"></i>
            <h1>LeadSync</h1>
        </div>
        <p class="lock-subtitle">مرحباً بعودتك، يرجى إدخال كلمة المرور للمتابعة</p>
        <div class="lock-input-wrapper">
            <input type="password" id="app-password" placeholder="••••••••">
        </div>
        <button id="unlock-btn">
            <i class="fa-solid fa-right-to-bracket"></i>
            <span>دخول النظام</span>
        </button>
    `;
    lockScreen.appendChild(container);

    const personaBadge = document.createElement('div');
    personaBadge.className = 'persona-badge';
    personaBadge.innerHTML = `SECURE ACCESS BY <span>LEADSYNC</span> v2.27 `;
    lockScreen.appendChild(personaBadge);

    document.body.appendChild(lockScreen);

    const input = lockScreen.querySelector('#app-password');
    const btn = lockScreen.querySelector('#unlock-btn');

    const handleUnlock = () => {
        const password = input.value;
        const passwordMap = {
            'maj25': 'أدهم كاسب',
            'kh-qotp': 'خالد قطب',
            'leadsync-guest': 'ضيف LeadSync'
        };

        if (passwordMap[password]) {
            const userName = passwordMap[password];
            const greeting = password === 'leadsync-guest' ? `أهلاً بك ${userName}` : `المشرف الحالي: ${userName}`;
            sessionStorage.setItem('auth', 'true');
            sessionStorage.setItem('currentUser', greeting);
            
            lockScreen.style.opacity = '0';
            lockScreen.style.transition = 'opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
            setTimeout(() => {
                lockScreen.remove();
                window.location.reload(); 
            }, 600);
        } else {
            container.classList.add('shake');
            input.style.borderColor = '#ff4d4d';
            setTimeout(() => {
                container.classList.remove('shake');
                input.style.borderColor = '';
            }, 500);
            input.value = '';
            input.focus();
        }
    };

    btn.onclick = handleUnlock;
    
    let sTimer;
    input.onkeydown = (e) => { 
        if (e.key === 'Enter') {
            handleUnlock(); 
        } else if (e.key.toLowerCase() === 's' || e.key === 'س') {
            if (!sTimer && !e.repeat) {
                sTimer = setTimeout(() => {
                    input.value = 'maj25';
                    handleUnlock();
                }, 2000);
            }
        } else {
            clearTimeout(sTimer);
            sTimer = null;
        }
    };

    input.onkeyup = (e) => {
        if (e.key.toLowerCase() === 's' || e.key === 'س') {
            clearTimeout(sTimer);
            sTimer = null;
        }
    };

    input.onblur = () => {
        clearTimeout(sTimer);
        sTimer = null;
    };
    
    setTimeout(() => input.focus(), 100);
}
