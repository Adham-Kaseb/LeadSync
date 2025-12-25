import { Storage } from './core.js';

export function initHoverCounter() {
    const navItems = document.querySelectorAll('.nav-item');
    const hoverTimes = new Map();
    const intervals = new Map();

    navItems.forEach(item => {
        const target = item.getAttribute('data-target');
        if (!target) return;

        item.addEventListener('mouseenter', () => {
            const intervalId = setInterval(() => {
                let current = hoverTimes.get(target) || 0;
                current += 100;
                hoverTimes.set(target, current);

                if (current >= 4000) { 
                    showCountTooltip(item, target);
                    clearInterval(intervalId);
                    hoverTimes.set(target, 0); 
                }
            }, 100);
            intervals.set(target, intervalId);
        });

        item.addEventListener('mouseleave', () => {
            if (intervals.has(target)) {
                clearInterval(intervals.get(target));
                intervals.delete(target);
            }
        });
    });
}

function showCountTooltip(element, target) {
    const count = getModuleCount(target);
    if (count === null) return; 

    let existing = element.querySelector('.hover-count-badge');
    if (existing) existing.remove();

    const labels = {
        'leads': 'عميل',
        'messages': 'رسالة',
        'notes': 'ملاحظة',
        'links': 'رابط',
        'reminders': 'تذكير',
        'articles': 'مقال',
        'calculator': 'عملية',
        'calendar': 'حدث'
    };

    const label = labels[target] || 'عنصر';

    const badge = document.createElement('div');
    badge.className = 'hover-count-badge';
    badge.innerHTML = `
        <span style="font-weight:700; font-size:1.1rem; color:var(--metallic-gold);">${count}</span>
        <span style="font-size:0.8rem; opacity:0.8; margin-right:4px;">${label}</span>
    `;
    
    badge.style.position = 'absolute';
    badge.style.left = '60px'; 
    badge.style.background = 'rgba(0, 0, 0, 0.9)';
    badge.style.border = '1px solid var(--metallic-gold)';
    badge.style.color = '#fff';
    badge.style.padding = '6px 12px';
    badge.style.borderRadius = '8px';
    badge.style.boxShadow = '0 4px 15px rgba(0,0,0,0.5)';
    badge.style.opacity = '0';
    badge.style.transform = 'translateY(10px)'; 
    badge.style.transition = 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
    badge.style.zIndex = '1000';
    badge.style.display = 'flex';
    badge.style.alignItems = 'center';
    badge.style.pointerEvents = 'none';
    badge.style.whiteSpace = 'nowrap';

    const arrow = document.createElement('div');
    arrow.style.position = 'absolute';
    arrow.style.right = '-6px';
    arrow.style.top = '50%';
    arrow.style.transform = 'translateY(-50%)';
    arrow.style.borderTop = '6px solid transparent';
    arrow.style.borderBottom = '6px solid transparent';
    arrow.style.borderLeft = '6px solid var(--metallic-gold)';
    badge.appendChild(arrow);

    element.appendChild(badge);

    requestAnimationFrame(() => {
        badge.style.opacity = '1';
        badge.style.transform = 'translateY(0)';
    });

    setTimeout(() => {
        badge.style.opacity = '0';
        badge.style.transform = 'translateY(-5px)';
        setTimeout(() => badge.remove(), 400);
    }, 4000);
}

function getModuleCount(target) {
    switch (target) {
        case 'leads':
            return (Storage.get('leads_data') || []).length;
        case 'messages':
            return (Storage.get('messages_data') || []).length;
        case 'notes':
            return (Storage.get('notes_data') || []).length;
        case 'links':
            return (Storage.get('links_data') || []).length;
        case 'reminders':
            return (Storage.get('reminders_data') || []).length;
        case 'articles':
            return (Storage.get('articles_data') || []).length;
        case 'calculator':
            return (Storage.get('calc_history') || []).length;
        case 'calendar':
             return (Storage.get('calendar_events') || []).length;
        default:
            return null; 
    }
}
