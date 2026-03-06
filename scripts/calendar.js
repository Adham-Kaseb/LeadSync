import { Storage, Utils } from './core.js';

export function renderCalendar() {
    const container = document.createElement('div');
    
    const date = new Date();
    let currentMonth = date.getMonth();
    let currentYear = date.getFullYear();

    const header = document.createElement('div');
    header.className = 'section-header';
    header.innerHTML = `
        <h1 class="section-title">التقويم</h1>
        <div style="display: flex; gap: 0.5rem; align-items: center;">
            <button id="holidays-btn" class="btn" style="
                background: linear-gradient(135deg, var(--metallic-gold) 0%, #FFA500 100%);
                color: #000;
                font-weight: bold;
                border: none;
                border-radius: 8px;
                padding: 0.5rem 1.2rem;
                box-shadow: 0 4px 15px rgba(255, 215, 0, 0.3);
                transition: transform 0.2s, box-shadow 0.2s;
                font-family: 'Cairo', sans-serif;
                display: flex;
                align-items: center;
                gap: 8px;
            " onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 6px 20px rgba(255, 215, 0, 0.5)'" onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 4px 15px rgba(255, 215, 0, 0.3)'">
                <i class="fa-solid fa-gift" style="font-size: 1.1em;"></i> العطلات والمناسبات
            </button>
            <button id="prev-month" class="btn btn-glass"><i class="fa-solid fa-chevron-right"></i></button>
            <h2 id="month-label" style="min-width: 180px; text-align: center;"></h2>
            <button id="next-month" class="btn btn-glass"><i class="fa-solid fa-chevron-left"></i></button>
        </div>
    `;
    container.appendChild(header);

    const layout = document.createElement('div');
    layout.style.display = 'grid';
    layout.style.gridTemplateColumns = '3fr 1fr';
    layout.style.gap = '2rem';
    
    if (window.innerWidth < 900) layout.style.gridTemplateColumns = '1fr';

    const calWrapper = document.createElement('div');
    calWrapper.className = 'glass-panel';
    calWrapper.style.padding = '1.5rem';
    calWrapper.style.borderRadius = '20px';

    const dayHeaders = ['أحد', 'إثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];
    const headerRow = document.createElement('div');
    headerRow.style.display = 'grid';
    headerRow.style.gridTemplateColumns = 'repeat(7, 1fr)';
    headerRow.style.textAlign = 'center';
    headerRow.style.marginBottom = '1rem';
    headerRow.style.color = 'var(--text-secondary)';
    
    dayHeaders.forEach(d => {
        const span = document.createElement('span');
        span.innerText = d;
        headerRow.appendChild(span);
    });
    calWrapper.appendChild(headerRow);

    const grid = document.createElement('div');
    grid.style.display = 'grid';
    grid.style.gridTemplateColumns = 'repeat(7, 1fr)';
    grid.style.gap = '0.5rem';
    calWrapper.appendChild(grid);

    const getHijriDay = (date) => new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', { day: 'numeric' }).format(date);
    
    function getDaysUntilRamadan() {
        let d = new Date();
        let days = 0;
        while(days < 360) {
            const fmt = new Intl.DateTimeFormat('ar-SA-u-ca-islamic-umalqura', { month: 'long' }).format(d);
            if(fmt && fmt.includes('رمضان')) return days;
            d.setDate(d.getDate() + 1);
            days++;
        }
        return 0; 
    }

    const daysToRamadan = getDaysUntilRamadan();
    const ramadanText = daysToRamadan === 0 ? "نحن في شهر رمضان المبارك" : `متبقي على رمضان: ${daysToRamadan} يوم`;

    const eventSidebar = document.createElement('div');
    eventSidebar.className = 'glass-panel';
    eventSidebar.style.padding = '1.5rem';
    eventSidebar.style.borderRadius = '16px';
    eventSidebar.style.display = 'flex';
    eventSidebar.style.flexDirection = 'column';
    eventSidebar.innerHTML = `
        <div style="background: rgba(227, 185, 56, 0.15); border: 1px solid var(--metallic-gold); padding: 1rem; border-radius: 12px; margin-bottom: 1.5rem; text-align: center;">
            <i class="fa-solid fa-moon gold-text" style="font-size: 1.5rem; margin-bottom: 0.5rem;"></i>
            <div style="font-weight: bold; color: var(--metallic-gold);">${ramadanText}</div>
        </div>

        <h3 id="selected-date-label" style="border-bottom: 1px solid var(--glass-border); padding-bottom: 1rem; margin-bottom: 1rem;">${Utils.formatDate(new Date().toISOString()).split(',')[0]}</h3>
        <div id="events-list" style="flex-grow: 1; overflow-y: auto;"></div>
        <button id="add-event-btn" class="btn btn-primary" style="margin-top: 1rem; width: 100%;">إضافة حدث</button>
    `;

    function render(month, year) {
        const monthNames = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
        header.querySelector('#month-label').innerText = `${monthNames[month]} ${year}`;

        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();

        const events = Storage.getList('calendar_events');
        const reminders = Storage.getList('reminders_data');

        grid.innerHTML = '';

        for (let i = 0; i < firstDay; i++) {
            grid.appendChild(document.createElement('div'));
        }

        for (let i = 1; i <= daysInMonth; i++) {
            const dayEl = document.createElement('div');
            const currentDayDate = new Date(year, month, i);
            const hijriDay = getHijriDay(currentDayDate);
            const today = new Date();

            dayEl.innerHTML = `
                <div style="width:100%; display:flex; justify-content:space-between; align-items:flex-start;">
                    <span style="font-size: 1.1rem; font-weight:bold;">${i}</span>
                    <span style="font-size: 0.8rem; opacity: 0.6; font-family: 'Cairo', sans-serif;">${hijriDay}</span>
                </div>
            `;
            
            dayEl.style.height = '80px';
            dayEl.style.display = 'flex';
            dayEl.style.flexDirection = 'column';
            dayEl.style.alignItems = 'flex-start';
            dayEl.style.padding = '0.5rem';
            dayEl.style.borderRadius = '8px';
            dayEl.style.cursor = 'pointer';
            dayEl.style.position = 'relative';
            dayEl.style.background = 'rgba(255,255,255,0.02)';
            dayEl.style.border = '1px solid rgba(255,255,255,0.05)';
            dayEl.style.transition = 'all 0.2s';
            
            dayEl.onmouseenter = () => {
                dayEl.style.background = 'rgba(255,255,255,0.1)';
                dayEl.style.transform = 'scale(1.02)';
                dayEl.style.borderColor = 'var(--metallic-gold)';
            };
            dayEl.onmouseleave = () => {
                dayEl.style.background = (i === today.getDate() && month === today.getMonth() && year === today.getFullYear()) ? 'rgba(227, 185, 56, 0.2)' : 'rgba(255,255,255,0.02)';
                dayEl.style.transform = 'scale(1)';
                dayEl.style.borderColor = (i === today.getDate() && month === today.getMonth() && year === today.getFullYear()) ? 'var(--metallic-gold)' : 'rgba(255,255,255,0.05)';
            };

            if (i === today.getDate() && month === today.getMonth() && year === today.getFullYear()) {
                dayEl.style.background = 'rgba(227, 185, 56, 0.2)';
                dayEl.style.border = '1px solid var(--metallic-gold)';
            }

            const dateStr = `${year}-${String(month+1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            const dayEvents = events.filter(e => e.date === dateStr);
            const dayReminders = reminders.filter(r => r.dateTime.startsWith(dateStr));
            
            const totalItems = dayEvents.length + dayReminders.length;
            if (totalItems > 0) {
                const dots = document.createElement('div');
                dots.style.display = 'flex';
                dots.style.gap = '3px';
                dots.style.marginTop = 'auto'; 
                
                for(let k=0; k < Math.min(totalItems, 3); k++) {
                    const dot = document.createElement('div');
                    dot.style.width = '6px';
                    dot.style.height = '6px';
                    dot.style.borderRadius = '50%';
                    dot.style.background = k < dayEvents.length ? 'var(--text-primary)' : 'var(--metallic-gold)';
                    dots.appendChild(dot);
                }
                dayEl.appendChild(dots);
            }

            dayEl.onclick = () => selectDate(i, month, year);
            grid.appendChild(dayEl);
        }
    }

    let selectedFullDate = new Date();

    function selectDate(day, month, year) {
        selectedFullDate = new Date(year, month, day);
        const dateStr = `${year}-${String(month+1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        
        eventSidebar.querySelector('#selected-date-label').innerText = selectedFullDate.toLocaleDateString('ar-EG', { weekday: 'long', month: 'long', day: 'numeric' });
        
        const list = eventSidebar.querySelector('#events-list');
        list.innerHTML = '';

        const events = Storage.getList('calendar_events').filter(e => e.date === dateStr);
        const reminders = Storage.getList('reminders_data').filter(r => r.dateTime.startsWith(dateStr));

        if (events.length === 0 && reminders.length === 0) {
            list.innerHTML = '<p style="color: var(--text-secondary); text-align: center; margin-top: 2rem;">لا توجد أحداث لهذا اليوم.</p>';
        } else {
            reminders.forEach(r => {
                 const item = document.createElement('div');
                 item.style.padding = '0.8rem';
                 item.style.marginBottom = '0.5rem';
                 item.style.borderRadius = '8px';
                 item.style.background = 'rgba(227, 185, 56, 0.1)';
                 item.style.borderRight = '3px solid var(--metallic-gold)'; 
                 item.innerHTML = `
                    <div style="font-size: 0.9rem; font-weight: bold;">${r.title}</div>
                    <div style="font-size: 0.8rem; opacity: 0.7;">تذكير • ${new Date(r.dateTime).toLocaleTimeString('ar-EG', {hour:'2-digit', minute:'2-digit'})}</div>
                 `;
                 list.appendChild(item);
            });

            events.forEach(e => {
                const item = document.createElement('div');
                item.style.padding = '0.8rem';
                item.style.marginBottom = '0.5rem';
                item.style.borderRadius = '8px';
                item.style.background = 'rgba(255, 255, 255, 0.05)';
                item.style.borderRight = '3px solid #fff'; 
                item.style.display = 'flex'; 
                item.style.justifyContent = 'space-between';
                item.style.alignItems = 'center';
                
                const content = document.createElement('div');
                content.innerHTML = `
                    <div style="font-size: 0.9rem; font-weight: bold;">${e.title}</div>
                    <div style="font-size: 0.8rem; opacity: 0.7;">حدث</div>
                `;
                
                const actionGroup = document.createElement('div');
                actionGroup.className = 'action-group';

                const delBtn = document.createElement('button');
                delBtn.className = 'action-btn delete delete-event';
                delBtn.innerHTML = '<i class="fa-solid fa-trash"></i>';
                delBtn.onclick = () => {
                     if(confirm('حذف الحدث؟')) {
                          const allEvents = Storage.getList('calendar_events');
                          const newEvents = allEvents.filter(ev => ev.id !== e.id);
                          Storage.saveList('calendar_events', newEvents);
                          selectDate(day, month, year); 
                          render(month, year); 
                     }
                };

                actionGroup.appendChild(delBtn);
                item.appendChild(content);
                item.appendChild(actionGroup);

                list.appendChild(item);
            });
        }
    }

    const holidays = [
        { date: '7 يناير', name: 'عيد الميلاد المجيد', type: 'christian', desc: 'احتفال المسيحيين الأرثوذكس بمولد السيد المسيح.' },
        { date: '25 يناير', name: 'عيد الشرطة / ثورة 25 يناير', type: 'national', desc: 'ذكرى تضحيات رجال الشرطة وثورة 2011.' },
        { date: 'مارس / أبريل', name: 'عيد القيامة المجيد', type: 'christian', desc: 'ذكرى قيامة السيد المسيح (متغير التاريخ).' },
        { date: 'أبريل / مايو', name: 'شم النسيم', type: 'national', desc: 'عيد مصري قديم للاحتفال بالربيع (اليوم التالي لعيد القيامة).' },
        { date: '25 أبريل', name: 'عيد تحرير سيناء', type: 'national', desc: 'ذكرى استرداد أرض سيناء.' },
        { date: '1 مايو', name: 'عيد العمال', type: 'national', desc: 'تكريم لجميع العمال في الدولة.' },
        { date: '30 يونيو', name: 'ثورة 30 يونيو', type: 'national', desc: 'ذكرى ثورة 30 يونيو 2013.' },
        { date: '1 محرم', name: 'رأس السنة الهجرية', type: 'islamic', desc: 'بداية العام الهجري الجديد.' },
        { date: '23 يوليو', name: 'عيد الثورة', type: 'national', desc: 'ذكرى ثورة 23 يوليو 1952.' },
        { date: '12 ربيع الأول', name: 'المولد النبوي الشريف', type: 'islamic', desc: 'مولد النبي محمد صلى الله عليه وسلم.' },
        { date: '6 أكتوبر', name: 'عيد القوات المسلحة', type: 'national', desc: 'ذكرى انتصار حرب أكتوبر 1973.' },
        { date: '1-3 شوال', name: 'عيد الفطر المبارك', type: 'islamic', desc: 'الاحتفال بإتمام صيام شهر رمضان.' },
        { date: '10-13 ذو الحجة', name: 'عيد الأضحى المبارك', type: 'islamic', desc: 'الاحتفال بموسم الحج وذبح الأضاحي.' }
    ];

    function openHolidaysModal() {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay glass-panel';
        overlay.style.position = 'fixed';
        overlay.style.inset = '0';
        overlay.style.background = 'rgba(0,0,0,0.85)';
        overlay.style.display = 'flex';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.zIndex = '3000';
        overlay.style.backdropFilter = 'blur(10px)';

        overlay.innerHTML = `
            <div class="glass-panel" style="
                background: linear-gradient(135deg, rgba(20,20,20,0.95), rgba(10,10,10,0.98)); 
                padding: 2rem; 
                border-radius: 20px; 
                width: 90%; 
                max-width: 700px; 
                max-height: 90vh; 
                overflow-y: auto;
                border: 1px solid var(--metallic-gold);
                box-shadow: 0 0 40px rgba(227, 185, 56, 0.15);
                position: relative;
            ">
                <button id="close-holidays" style="position: absolute; top: 20px; left: 20px; background:none; border:none; color:var(--text-secondary); font-size:1.5rem; cursor:pointer;"><i class="fa-solid fa-xmark"></i></button>
                
                <h2 style="text-align: center; color: var(--metallic-gold); margin-bottom: 2rem; font-family: 'cairo', sans-serif;">الأعياد والمناسبات الرسمية</h2>

                <div style="display: flex; flex-direction: column; gap: 1rem;">
                    ${holidays.map(h => {
                        let icon = 'fa-flag';
                        let color = '#fff';
                        let bg = 'rgba(255,255,255,0.05)';
                        
                        if(h.type === 'islamic') { icon = 'fa-star-and-crescent'; color = '#4CAF50'; bg = 'rgba(76, 175, 80, 0.1)'; }
                        else if(h.type === 'christian') { icon = 'fa-cross'; color = '#2196F3'; bg = 'rgba(33, 150, 243, 0.1)'; }
                        else if(h.type === 'national') { icon = 'fa-eagle'; color = 'var(--metallic-gold)'; bg = 'rgba(255, 215, 0, 0.1)'; }

                        return `
                        <div style="display: flex; align-items: center; gap: 15px; background: ${bg}; padding: 15px; border-radius: 12px; border: 1px solid ${color}33;">
                            <div style="width: 50px; height: 50px; background: rgba(0,0,0,0.3); border-radius: 10px; display: flex; justify-content: center; align-items: center; font-size: 1.5rem; color: ${color};">
                                <i class="fa-solid ${icon}"></i>
                            </div>
                            <div>
                                <h3 style="margin: 0; font-size: 1.1rem; color: ${color === 'var(--metallic-gold)' ? '#FFD700' : color};">${h.name}</h3>
                                <div style="font-size: 0.9rem; font-weight: bold; margin: 4px 0;">${h.date}</div>
                                <p style="margin: 0; font-size: 0.85rem; color: var(--text-secondary);">${h.desc}</p>
                            </div>
                        </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
        
        document.body.appendChild(overlay);
        overlay.querySelector('#close-holidays').onclick = () => overlay.remove();
    }

    header.querySelector('#prev-month').onclick = () => {
        currentMonth--;
        if(currentMonth < 0) { currentMonth = 11; currentYear--; }
        render(currentMonth, currentYear);
    };
    header.querySelector('#next-month').onclick = () => {
        currentMonth++;
        if(currentMonth > 11) { currentMonth = 0; currentYear++; }
        render(currentMonth, currentYear);
    };
    
    header.querySelector('#holidays-btn').onclick = openHolidaysModal;

    eventSidebar.querySelector('#add-event-btn').onclick = () => {
        const title = prompt('أدخل عنوان الحدث:');
        if (!title) return;
        
        const y = selectedFullDate.getFullYear();
        const m = String(selectedFullDate.getMonth() + 1).padStart(2, '0');
        const d = String(selectedFullDate.getDate()).padStart(2, '0');
        const dateStr = `${y}-${m}-${d}`;

        const events = Storage.getList('calendar_events');
        events.push({
            id: Utils.generateId(),
            title,
            date: dateStr,
            timestamp: new Date().toISOString()
        });
        Storage.saveList('calendar_events', events);
        
        selectDate(selectedFullDate.getDate(), currentMonth, currentYear);
        render(currentMonth, currentYear);
    };

    layout.appendChild(calWrapper);
    layout.appendChild(eventSidebar);
    container.appendChild(layout);

    render(currentMonth, currentYear);
    const today = new Date();
    if(today.getMonth() === currentMonth) {
        selectDate(today.getDate(), currentMonth, currentYear);
    } else {
        selectDate(1, currentMonth, currentYear);
    }

    return container;
}
