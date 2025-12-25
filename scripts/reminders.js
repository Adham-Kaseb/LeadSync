import { Storage, Utils } from './core.js';

export function checkReminders() {
    const reminders = Storage.getList('reminders_data');
    const now = new Date();
    let changed = false;

    reminders.forEach(r => {
        if (r.completed) return;

        const due = new Date(r.dateTime);
        if (now >= due) {
            playAlert();
            showVisualAlert(r);
            
            if (r.repeat === 'daily') {
                const next = new Date(due);
                next.setDate(next.getDate() + 1);
                r.dateTime = next.toISOString();
            } else if (r.repeat === 'weekly') {
                const next = new Date(due);
                next.setDate(next.getDate() + 7);
                r.dateTime = next.toISOString();
            } else {
                r.completed = true;
            }
            changed = true;
        }
    });

    if (changed) {
        Storage.saveList('reminders_data', reminders);
        window.dispatchEvent(new CustomEvent('reminders-updated'));
    }
}

function playAlert() {
    const audio = document.getElementById('alert-sound');
    const settings = Storage.get('app_settings') || { volume: 0.5 };
    
    if (!audio.src) {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(880, ctx.currentTime); 
        osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.5);
        
        gain.gain.setValueAtTime(settings.volume, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.5);
    } else {
        audio.volume = settings.volume;
        audio.play().catch(e => console.log('Audio autoplay blocked', e));
    }
}

function showVisualAlert(reminder) {
    const popup = document.createElement('div');
    popup.className = 'glass-card';
    popup.style.position = 'fixed';
    popup.style.top = '20px';
    popup.style.right = '20px';
    popup.style.zIndex = '9999';
    popup.style.borderLeft = '4px solid var(--metallic-gold)';
    popup.style.color = '#fff';
    popup.style.minWidth = '300px';
    popup.style.animation = 'slideIn 0.5s ease-out';
    popup.innerHTML = `
        <h3 style="margin-bottom:0.5rem;"><i class="fa-solid fa-bell"></i> تذكير</h3>
        <p style="font-size: 1.1rem; font-weight: bold;">${reminder.title}</p>
        <p style="opacity: 0.8;">${reminder.description || ''}</p>
        <button style="margin-top:1rem; background:transparent; border:1px solid #fff; color:#fff; padding:0.3rem 1rem; border-radius:4px; cursor:pointer;">تجاهل</button>
    `;

    document.body.appendChild(popup);
    
    const btn = popup.querySelector('button');
    btn.onclick = () => popup.remove();
    
    setTimeout(() => popup.remove(), 10000);
}

export function renderReminders() {
    const container = document.createElement('div');

    const header = document.createElement('div');
    header.className = 'section-header';
    header.innerHTML = `
        <h1 class="section-title">التذكيرات</h1>
        <button id="add-rem-btn" class="btn btn-primary"><i class="fa-solid fa-plus"></i> تذكير جديد</button>
    `;
    container.appendChild(header);

    const listContainer = document.createElement('div');
    listContainer.style.display = 'flex';
    listContainer.style.flexDirection = 'column';
    listContainer.style.gap = '1rem';

    function render() {
        listContainer.innerHTML = '';
        const reminders = Storage.getList('reminders_data');
        
        reminders.sort((a, b) => {
            if (a.completed && !b.completed) return 1;
            if (!a.completed && b.completed) return -1;
            return new Date(a.dateTime) - new Date(b.dateTime);
        });

        reminders.forEach(rem => {
            const item = document.createElement('div');
            item.className = 'glass-card';
            item.style.display = 'flex';
            item.style.justifyContent = 'space-between';
            item.style.alignItems = 'center';
            item.style.opacity = rem.completed ? '0.6' : '1';
            
            const isOverdue = !rem.completed && new Date(rem.dateTime) < new Date();
            
            item.innerHTML = `
                <div>
                    <h3 style="margin-bottom: 0.4rem; ${rem.completed ? 'text-decoration: line-through;' : ''}">${rem.title}</h3>
                    <div style="font-size: 0.9rem; color: var(--text-secondary);">
                        <i class="fa-regular fa-calendar"></i> ${new Date(rem.dateTime).toLocaleString('ar-EG')}
                        ${isOverdue ? '<span style="color: var(--danger); margin-left: 10px;">(فائت)</span>' : ''}
                        ${rem.repeat !== 'none' ? `<span style="color: var(--metallic-gold); margin-left: 10px;"><i class="fa-solid fa-arrows-rotate"></i> ${getRepeatLabel(rem.repeat)}</span>` : ''}
                    </div>
                </div>
                <div class="action-group">
                    <button class="action-btn delete delete-rem" data-id="${rem.id}">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            `;
            
            item.querySelector('.delete-rem').onclick = () => {
                if(confirm('هل أنت متأكد من حذف التذكير؟')) {
                    const newList = Storage.getList('reminders_data').filter(r => r.id !== rem.id);
                    Storage.saveList('reminders_data', newList);
                    render();
                }
            };

            listContainer.appendChild(item);
        });
    }

    function getRepeatLabel(val) {
        if(val === 'daily') return 'يومياً';
        if(val === 'weekly') return 'أسبوعياً';
        return val;
    }

    header.querySelector('#add-rem-btn').onclick = () => {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';
        
        overlay.innerHTML = `
            <div class="modal-container glass-panel" style="max-width:450px;">
                <div class="modal-header">
                    <h2 class="modal-title">
                        <i class="fa-solid fa-bell"></i>
                        <span>إضافة تذكير جديد</span>
                    </h2>
                </div>

                <form id="reminder-form" style="display:grid; gap:1.2rem;">
                    <div>
                        <input id="r-text" class="glass-input" style="width:100%;" placeholder="ماذا تريد أن نتذكر؟" required>
                    </div>
                    
                    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:1.2rem;">
                         <input id="r-time" type="datetime-local" class="glass-input" required>
                         <select id="r-repeat" class="glass-input">
                            <option value="none">بدون تكرار</option>
                            <option value="daily">يومياً</option>
                            <option value="weekly">أسبوعياً</option>
                         </select>
                    </div>

                    <div style="display:flex; justify-content:center; gap:1rem; margin-top:1.5rem;">
                        <button type="submit" class="btn btn-primary" style="width:140px; height:48px; font-size:1.1rem;">حفظ</button>
                        <button type="button" id="r-cancel" class="btn btn-secondary" style="width:140px; height:48px; background:rgba(255,255,255,0.05); color:#fff; border:1px solid rgba(255,255,255,0.1); font-size:1.1rem;">إلغاء</button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(overlay);

        Utils.initCustomSelect(overlay.querySelector('#r-repeat'));

        const cancel = overlay.querySelector('#r-cancel');
        cancel.onclick = () => overlay.remove();

        overlay.querySelector('#reminder-form').onsubmit = (e) => {
            e.preventDefault();
            const text = overlay.querySelector('#r-text').value;
            const time = overlay.querySelector('#r-time').value;
            const repeat = overlay.querySelector('#r-repeat').value;
            
            const list = Storage.getList('reminders_data');
            list.push({
                id: Utils.generateId(),
                title: text, 
                dateTime: time, 
                repeat,
                completed: false, 
                timestamp: new Date().toISOString()
            });
            Storage.saveList('reminders_data', list);
            overlay.remove();
            render();
        };
    };

    render();
    window.addEventListener('reminders-updated', render);
    container.appendChild(listContainer);
    return container;
}
