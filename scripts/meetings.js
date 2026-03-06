import { Notifications, Utils } from './core.js';

export async function renderMeetings() {
    const container = document.createElement('div');
    container.className = 'meetings-container';

    let meetings = JSON.parse(localStorage.getItem('ls_meetings') || '[]');

    const updateView = () => {
        container.innerHTML = `
            <div class="meetings-header">
                <div>
                    <h2 style="font-size: 1.8rem; display: flex; align-items: center; gap: 12px;">
                        <i class="fa-solid fa-handshake" style="color: var(--metallic-gold);"></i>
                        <span>مواعيد الاجتماعات</span>
                    </h2>
                    <p style="color: var(--text-secondary); margin-top: 4px;">إدارة وتنظيم اجتماعاتك القادمة</p>
                </div>
                <button class="btn btn-primary" id="add-meeting-btn">
                    <i class="fa-solid fa-plus"></i> إضافة اجتماع جديد
                </button>
            </div>
            <div class="meetings-grid" id="meetings-grid">
                ${renderMeetingsGrid(meetings)}
            </div>
        `;

        container.querySelector('#add-meeting-btn').onclick = () => showMeetingModal();
        attachMeetingListeners();
    };

    const renderMeetingsGrid = (items) => {
        if (items.length === 0) {
            return `
                <div class="empty-meetings-state">
                    <div style="font-size: 3rem; color: rgba(255,255,255,0.1); margin-bottom: 1rem;">
                        <i class="fa-solid fa-calendar-circle-exclamation"></i>
                    </div>
                    <h3 style="color: var(--text-secondary);">لا توجد اجتماعات مجدولة</h3>
                    <p style="color: rgba(255,255,255,0.3); font-size: 0.9rem;">اضغط على "إضافة اجتماع جديد" للبدء</p>
                </div>
            `;
        }

        return items.map(m => {
            if (m.recurrence && m.recurrence !== 'none') {
                m.nextDate = calculateNextOccurrence(m.days, m.time);
            } else if (m.selected_day) {
                m.nextDate = calculateNextOccurrence([m.selected_day], m.time);
            } else {
                m.nextDate = m.date;
            }
            return m;
        }).sort((a, b) => new Date(a.nextDate + ' ' + a.time) - new Date(b.nextDate + ' ' + b.time))
            .map(m => createMeetingCard(m)).join('');
    };

    const calculateNextOccurrence = (days, time) => {
        if (!days || days.length === 0) return null;
        const now = new Date();
        const [hours, minutes] = time.split(':').map(Number);
        const dayIndices = days.map(d => ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'].indexOf(d));
        
        let minDiff = Infinity;
        let nextDate = null;

        dayIndices.forEach(dayIndex => {
            let diff = (dayIndex - now.getDay() + 7) % 7;
            const targetDate = new Date(now);
            targetDate.setDate(now.getDate() + diff);
            targetDate.setHours(hours, minutes, 0, 0);

            if (targetDate <= now) {
                targetDate.setDate(targetDate.getDate() + 7);
            }

            if (targetDate < (nextDate || Infinity)) {
                nextDate = targetDate;
            }
        });

        return nextDate.toISOString().split('T')[0];
    };

    const createMeetingCard = (m) => {
        const platformIcons = {
            'zoom': 'fa-video',
            'google-meet': 'fa-video-camera',
            'teams': 'fa-users-rectangle',
            'phone': 'fa-phone',
            'in-person': 'fa-location-dot'
        };
        const icon = platformIcons[m.platform] || 'fa-handshake';
        const displayDate = m.nextDate || m.date;

        const recurrenceText = m.recurrence === 'weekly-1' ? 'أسبوعي' : 
                             m.recurrence === 'weekly-2' ? 'أسبوعي (يومين)' : '';
        const dayNamesAr = {
            'sat': 'السبت', 'sun': 'الأحد', 'mon': 'الاثنين', 'tue': 'الثلاثاء', 
            'wed': 'الأربعاء', 'thu': 'الخميس', 'fri': 'الجمعة'
        };
        const selectedDays = (m.days || []).map(d => dayNamesAr[d]).join(' و ');

        // Status calculation
        const now = new Date();
        now.setHours(0, 0, 0, 0);
        const meetingDate = new Date(displayDate);
        meetingDate.setHours(0, 0, 0, 0);
        
        const diffTime = meetingDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        let statusText = '';
        let badgeClass = '';
        
        if (diffDays === 0) {
            statusText = 'اليوم';
            badgeClass = 'today';
        } else if (diffDays === 1) {
            statusText = 'غداً';
        } else {
            statusText = `باقي ${diffDays} أيام`;
        }
        
        const statusBadge = `<span class="meeting-status-badge ${badgeClass}">${statusText}</span>`;

        return `
            <div class="meeting-card">
                <div class="meeting-card-header">
                    <div class="meeting-platform-icon"><i class="fa-solid ${icon}"></i></div>
                    ${statusBadge}
                </div>
                
                <div class="meeting-title">${m.title}</div>
                
                <div class="meeting-info-stack">
                    ${recurrenceText ? `
                        <div class="meeting-info-row" style="color: var(--metallic-gold); font-weight: 600;">
                            <i class="fa-solid fa-redo"></i>
                            <span>${recurrenceText}: ${selectedDays}</span>
                        </div>` : ''}
                    
                    <div class="meeting-info-row">
                        <i class="fa-solid fa-calendar-day"></i>
                        <span>${new Date(displayDate).toLocaleDateString('ar-EG', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                    </div>
                    <div class="meeting-info-row">
                        <i class="fa-solid fa-clock"></i>
                        <span>${m.time}</span>
                    </div>
                </div>
                
                <div class="meeting-actions">
                    <a href="${m.link}" target="_blank" class="btn btn-sm btn-meeting-link">
                        <i class="fa-solid fa-link"></i> دخول الاجتماع
                    </a>
                    <button class="action-btn edit-meeting" data-id="${m.id}" title="تعديل">
                        <i class="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button class="action-btn delete delete-meeting" data-id="${m.id}" title="حذف">
                        <i class="fa-solid fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    };

    const attachMeetingListeners = () => {
        container.querySelectorAll('.edit-meeting').forEach(btn => {
            btn.onclick = () => {
                const id = btn.dataset.id;
                const meeting = meetings.find(m => m.id === id);
                if (meeting) showMeetingModal(meeting);
            };
        });

        container.querySelectorAll('.delete-meeting').forEach(btn => {
            btn.onclick = async () => {
                if (confirm('هل أنت متأكد من حذف هذا الاجتماع؟')) {
                    const id = btn.dataset.id;
                    meetings = meetings.filter(m => m.id !== id);
                    saveMeetings();
                }
            };
        });
    };

    const showMeetingModal = (editData = null) => {
        const modal = document.createElement('div');
        modal.className = 'modal-overlay';
        modal.innerHTML = `
            <div class="modal-container" style="max-width: 550px">
                <div class="meeting-modal-header">
                    <h2 class="modal-title" style="justify-content: flex-start;">
                        <i class="fa-solid ${editData ? 'fa-pen-to-square' : 'fa-calendar-plus'}"></i>
                        ${editData ? 'تعديل بيانات الاجتماع' : 'إضافة اجتماع جديد لمواعيدك'}
                    </h2>
                </div>
                <form id="meeting-form">
                    <div class="meeting-form-group">
                        <label><i class="fa-solid fa-heading"></i> عنوان الاجتماع</label>
                        <input type="text" name="title" class="glass-input" value="${editData?.title || ''}" required placeholder="مثلاً: مراجعة المشروع البرمجي">
                    </div>
                    
                    <div class="meeting-form-row">
                        <div class="meeting-form-group" id="date-picker-group" style="display: ${editData?.recurrence && editData.recurrence !== 'none' ? 'none' : 'flex'}">
                            <label><i class="fa-solid fa-calendar"></i> اليوم</label>
                            <select name="selected_day" class="glass-input select-input">
                                <option value="sat" ${editData?.selected_day === 'sat' || (!editData && new Date().getDay() === 6) ? 'selected' : ''}>السبت</option>
                                <option value="sun" ${editData?.selected_day === 'sun' || (!editData && new Date().getDay() === 0) ? 'selected' : ''}>الأحد</option>
                                <option value="mon" ${editData?.selected_day === 'mon' || (!editData && new Date().getDay() === 1) ? 'selected' : ''}>الاثنين</option>
                                <option value="tue" ${editData?.selected_day === 'tue' || (!editData && new Date().getDay() === 2) ? 'selected' : ''}>الثلاثاء</option>
                                <option value="wed" ${editData?.selected_day === 'wed' || (!editData && new Date().getDay() === 3) ? 'selected' : ''}>الأربعاء</option>
                                <option value="thu" ${editData?.selected_day === 'thu' || (!editData && new Date().getDay() === 4) ? 'selected' : ''}>الخميس</option>
                                <option value="fri" ${editData?.selected_day === 'fri' || (!editData && new Date().getDay() === 5) ? 'selected' : ''}>الجمعة</option>
                            </select>
                        </div>
                        <div class="meeting-form-group">
                            <label><i class="fa-solid fa-clock"></i> الوقت</label>
                            <select name="time" class="glass-input select-input">
                                ${Array.from({ length: 48 }, (_, i) => {
                                    const hour = Math.floor(i / 2);
                                    const minute = i % 2 === 0 ? '00' : '30';
                                    const time24 = `${hour.toString().padStart(2, '0')}:${minute}`;
                                    const period = hour >= 12 ? 'م' : 'ص';
                                    const hour12 = hour % 12 || 12;
                                    const displayTime = `${hour12}:${minute} ${period}`;
                                    return `<option value="${time24}" ${editData?.time === time24 ? 'selected' : ''}>${displayTime}</option>`;
                                }).join('')}
                            </select>
                        </div>
                    </div>

                    <div class="meeting-form-group">
                        <label><i class="fa-solid fa-link"></i> رابط الاجتماع أو المكان</label>
                        <input type="text" name="link" class="glass-input" value="${editData?.link || ''}" placeholder="URL (Zoom, Meet...) أو موقع جغرافي">
                    </div>

                    <div class="meeting-form-row">
                        <div class="meeting-form-group">
                            <label><i class="fa-solid fa-layer-group"></i> المنصة</label>
                            <select name="platform" class="glass-input select-input">
                                <option value="zoom" ${editData?.platform === 'zoom' ? 'selected' : ''}>Zoom Video</option>
                                <option value="google-meet" ${editData?.platform === 'google-meet' ? 'selected' : ''}>Google Meet</option>
                                <option value="teams" ${editData?.platform === 'teams' ? 'selected' : ''}>Microsoft Teams</option>
                                <option value="phone" ${editData?.platform === 'phone' ? 'selected' : ''}>اتصال هاتفي</option>
                                <option value="in-person" ${editData?.platform === 'in-person' ? 'selected' : ''}>مقابلة شخصية</option>
                            </select>
                        </div>
                        <div class="meeting-form-group">
                            <label><i class="fa-solid fa-sync"></i> التكرار</label>
                            <select name="recurrence" id="recurrence-select" class="glass-input select-input">
                                <option value="none" ${editData?.recurrence === 'none' ? 'selected' : ''}>لا يتكرر</option>
                                <option value="weekly-1" ${editData?.recurrence === 'weekly-1' ? 'selected' : ''}>يوم واحد أسبوعياً</option>
                                <option value="weekly-2" ${editData?.recurrence === 'weekly-2' ? 'selected' : ''}>يومين أسبوعياً</option>
                            </select>
                        </div>
                    </div>

                    <div class="meeting-form-group" id="day-selector-container" style="display: ${editData?.recurrence && editData.recurrence !== 'none' ? 'flex' : 'none'}; margin-top: -0.5rem; margin-bottom: 1.2rem;">
                        <label><i class="fa-solid fa-calendar-week"></i> اختر الأيام</label>
                        <div class="day-selector">
                            ${['sat', 'sun', 'mon', 'tue', 'wed', 'thu', 'fri'].map(day => {
                                const names = {sat:'السبت', sun:'الأحد', mon:'الاثنين', tue:'الثلاثاء', wed:'الأربعاء', thu:'الخميس', fri:'الجمعة'};
                                const active = editData?.days?.includes(day) ? 'active' : '';
                                return `<button type="button" class="day-btn ${active}" data-day="${day}">${names[day]}</button>`;
                            }).join('')}
                        </div>
                    </div>

                    <div class="meeting-modal-footer">
                        <button type="submit" class="btn btn-primary">
                            <i class="fa-solid fa-check"></i> حفظ البيانات
                        </button>
                        <button type="button" class="btn btn-secondary" id="close-modal">
                            إلغاء
                        </button>
                    </div>
                </form>
            </div>
        `;
        document.body.appendChild(modal);

        const dayButtons = modal.querySelectorAll('.day-btn');
        const recurrenceSelect = modal.querySelector('#recurrence-select');
        const dayContainer = modal.querySelector('#day-selector-container');
        const datePickerGroup = modal.querySelector('#date-picker-group');

        recurrenceSelect.onchange = (e) => {
            const val = e.target.value;
            const isRecurring = val !== 'none';
            dayContainer.style.display = isRecurring ? 'flex' : 'none';
            datePickerGroup.style.display = isRecurring ? 'none' : 'flex';
            
            if (val === 'none') {
                dayButtons.forEach(b => b.classList.remove('active'));
            }
        };

        dayButtons.forEach(btn => {
            btn.onclick = () => {
                const limit = recurrenceSelect.value === 'weekly-1' ? 1 : 
                             recurrenceSelect.value === 'weekly-2' ? 2 : 0;
                
                if (btn.classList.contains('active')) {
                    btn.classList.remove('active');
                } else {
                    const activeCount = modal.querySelectorAll('.day-btn.active').length;
                    if (activeCount < limit) {
                        btn.classList.add('active');
                    } else if (limit === 1) {
                        dayButtons.forEach(b => b.classList.remove('active'));
                        btn.classList.add('active');
                    }
                }
            };
        });

        // Initialize custom selects for a premium look
        modal.querySelectorAll('select').forEach(sel => Utils.initCustomSelect(sel));

        modal.querySelector('#close-modal').onclick = () => modal.remove();
        modal.querySelector('#meeting-form').onsubmit = (e) => {
            e.preventDefault();
            const formData = new FormData(e.target);
            const data = Object.fromEntries(formData.entries());
            
            // Collect selected days
            data.days = Array.from(modal.querySelectorAll('.day-btn.active')).map(b => b.dataset.day);
            
            if (data.recurrence !== 'none' && data.days.length === 0) {
                return Notifications.warning('يرجى اختيار الأيام المطلوبة للتكرار');
            }

            if (editData) {
                meetings = meetings.map(m => m.id === editData.id ? { ...m, ...data } : m);
                Notifications.success('تم تحديث الاجتماع بنجاح');
            } else {
                meetings.push({ ...data, id: Date.now().toString() });
                Notifications.success('تم إضافة الاجتماع بنجاح');
            }
            
            saveMeetings();
            modal.remove();
        };
    };

    const saveMeetings = () => {
        localStorage.setItem('ls_meetings', JSON.stringify(meetings));
        updateView();
        if (window.syncManager) window.syncManager.push('meetings', meetings);
    };

    updateView();
    return container;
}
