import { Storage, Utils } from './core.js';

export function renderNotes() {
    const container = document.createElement('div');

    let mediaRecorder = null;
    let audioChunks = [];

    const header = document.createElement('div');
    header.className = 'section-header';

    header.innerHTML = `
        <h1 class="section-title">ملاحظاتي</h1>
        <div style="display:flex; gap:10px;">
            <button id="add-voice-btn" class="btn btn-secondary" style="border: 1px solid var(--metallic-gold); color: var(--metallic-gold); background: rgba(255,215,0,0.1);"><i class="fa-solid fa-microphone"></i> تسجيل صوتي</button>
            <button id="add-note-btn" class="btn btn-primary"><i class="fa-solid fa-plus"></i> ملاحظة جديدة</button>
        </div>
    `;
    container.appendChild(header);

    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    overlay.style.display = 'none';
    overlay.innerHTML = `
        <div class="modal-container glass-panel" style="max-width:400px; text-align:center;">
            <div class="recording-pulse" style="width:80px; height:80px; margin:0 auto 20px; background:rgba(255, 77, 77, 0.2); border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid #ff4d4d; animation: pulse 1.5s infinite;">
                <i class="fa-solid fa-microphone" style="font-size:2rem; color:#ff4d4d;"></i>
            </div>
            <h2 style="color:#fff; margin-bottom:10px;">جار التسجيل...</h2>
            <p style="color:var(--text-secondary); margin-bottom:20px;">يتم الآن التقاط ملاحظتك الصوتية</p>
            <button id="stop-record-btn" class="btn btn-primary" style="background:#ff4d4d; border:none; box-shadow: 0 4px 15px rgba(255, 77, 77, 0.3); width:100%;">
                <i class="fa-solid fa-stop"></i> إيقاف التسجيل
            </button>
        </div>
    `;
    document.body.appendChild(overlay); 

    const grid = document.createElement('div');
    grid.className = 'notes-grid'; 

    function render() {
        grid.innerHTML = '';
        const notes = Storage.getList('notes_data');
        
        notes.sort((a, b) => {
            if (a.pinned && !b.pinned) return -1;
            if (!a.pinned && b.pinned) return 1;
            return new Date(b.timestamp) - new Date(a.timestamp);
        });

        notes.forEach(note => {
            const card = document.createElement('div');
            card.className = 'glass-card';
            card.style.position = 'relative';
            card.style.minHeight = '250px'; 
            card.style.display = 'flex';
            card.style.flexDirection = 'column';
            
            if (note.pinned) {
                 card.style.border = '1px solid var(--metallic-gold)';
                 card.style.boxShadow = '0 0 15px rgba(227, 185, 56, 0.1)';
                 card.style.background = 'rgba(227, 185, 56, 0.05)';
            }

            let contentHTML = '';
            if (note.audio) {
                contentHTML = `
                    <div class="audio-player" data-id="${note.id}" style="margin-bottom: 1rem; padding: 10px; background: rgba(255, 255, 255, 0.05); border-radius: 8px; border: 1px solid var(--glass-border); display: flex; align-items: center; gap: 10px;">
                        <button class="play-btn" style="background: var(--metallic-gold); border: none; width: 36px; height: 36px; border-radius: 50%; color: #000; cursor: pointer; display: flex; align-items: center; justify-content: center;">
                            <i class="fa-solid fa-play"></i>
                        </button>
                        <div class="progress-container" style="flex-grow: 1; height: 6px; background: rgba(255,255,255,0.1); border-radius: 3px; position: relative; cursor: pointer;">
                            <div class="progress-bar" style="width: 0%; height: 100%; background: var(--metallic-gold); border-radius: 3px; position: relative;">
                                <div style="position: absolute; right: -4px; top: -3px; width: 12px; height: 12px; background: #fff; border-radius: 50%; box-shadow: 0 0 5px rgba(0,0,0,0.5);"></div>
                            </div>
                        </div>
                        <span class="duration" style="font-size: 0.8rem; color: var(--text-secondary); width: 40px; text-align: center;">0:00</span>
                        <audio src="${note.audio}" class="audio-el" style="display:none;"></audio>
                    </div>
                `;
            }

            card.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; border-bottom: 1px solid rgba(255,255,255,0.05); padding-bottom: 0.5rem;">
                    <div style="color: var(--metallic-gold); font-size: 0.85rem; font-weight: bold; letter-spacing: 0.5px;">
                         ${new Date(note.timestamp).toLocaleDateString('ar-EG', {weekday:'long', year:'numeric', month:'long', day:'numeric'})}
                         <div style="font-size: 0.75rem; color: var(--text-secondary); margin-top: 2px;">
                            ${new Date(note.timestamp).toLocaleTimeString('ar-EG', {hour:'2-digit', minute:'2-digit'})}
                         </div>
                    </div>
                    <div class="action-group" style="display:flex; gap:5px;">
                        <button class="action-btn copy copy-note" data-id="${note.id}" title="نسخ" style="width:28px; height:28px; display:flex; align-items:center; justify-content:center; border-radius:6px; border:1px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.05); color:var(--text-secondary); cursor:pointer; transition:all 0.2s;">
                            <i class="fa-solid fa-copy"></i>
                        </button>
                        <button class="action-btn pin pin-note ${note.pinned ? 'active' : ''}" data-id="${note.id}" title="تثبيت" style="width:28px; height:28px; display:flex; align-items:center; justify-content:center; border-radius:6px; border:1px solid rgba(255,255,255,0.1); background:rgba(255,255,255,0.05); color:var(--text-secondary); cursor:pointer; transition:all 0.2s; ${note.pinned ? 'color:var(--metallic-gold); border-color:rgba(227, 185, 56, 0.5); background:rgba(227, 185, 56, 0.15);' : ''}">
                            <i class="fa-solid fa-thumbtack"></i>
                        </button>
                        <button class="action-btn delete delete-note" data-id="${note.id}" title="حذف" style="width:28px; height:28px; display:flex; align-items:center; justify-content:center; border-radius:6px; border:1px solid rgba(255,77,77,0.3); background:rgba(255,77,77,0.05); color:#ff4d4d; cursor:pointer; transition:all 0.2s;">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </div>
                ${contentHTML}
                <textarea class="note-content" data-id="${note.id}" placeholder="اكتب ملاحظتك هنا..." style="
                    flex-grow: 1; 
                    background: transparent; 
                    border: none; 
                    outline: none; 
                    color: var(--text-primary); 
                    resize: none; 
                    font-family: inherit; 
                    direction: rtl; 
                    font-size: 1.1rem; 
                    line-height: 1.8;
                ">${note.content}</textarea>
            `;
            grid.appendChild(card);
            
            if(note.audio) {
                const player = card.querySelector('.audio-player');
                const btn = player.querySelector('.play-btn');
                const audio = player.querySelector('.audio-el');
                const progress = player.querySelector('.progress-bar');
                const durationSpan = player.querySelector('.duration');
                const progressContainer = player.querySelector('.progress-container');

                audio.onloadedmetadata = () => {
                    const m = Math.floor(audio.duration / 60);
                    const s = Math.floor(audio.duration % 60);
                    durationSpan.textContent = `${m}:${s.toString().padStart(2, '0')}`;
                };

                btn.onclick = () => {
                    if (audio.paused) {
                        document.querySelectorAll('audio').forEach(a => {
                            if(a !== audio) {
                                a.pause();
                                a.currentTime = 0;
                                const pBtn = a.parentElement.querySelector('.play-btn i');
                                if(pBtn) { pBtn.className = 'fa-solid fa-play'; }
                            }
                        });
                        audio.play();
                        btn.innerHTML = '<i class="fa-solid fa-pause"></i>';
                    } else {
                        audio.pause();
                        btn.innerHTML = '<i class="fa-solid fa-play"></i>';
                    }
                };

                audio.ontimeupdate = () => {
                    const pct = (audio.currentTime / audio.duration) * 100;
                    progress.style.width = pct + '%';
                };

                audio.onended = () => {
                   btn.innerHTML = '<i class="fa-solid fa-play"></i>';
                   progress.style.width = '0%';
                };

                progressContainer.onclick = (e) => {
                    const rect = progressContainer.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const pct = x / rect.width;
                    audio.currentTime = pct * audio.duration;
                };
            }
        });
    }

    let timeout = null;
    grid.addEventListener('input', (e) => {
        if (e.target.classList.contains('note-content')) {
            clearTimeout(timeout);
            timeout = setTimeout(() => {
                const id = e.target.dataset.id;
                const content = e.target.value;
                const notes = Storage.getList('notes_data');
                const index = notes.findIndex(n => n.id === id);
                if (index > -1) {
                    notes[index].content = content;
                    notes[index].timestamp = new Date().toISOString(); 
                    Storage.saveList('notes_data', notes);
                }
            }, 500); 
        }
    });

    grid.addEventListener('click', (e) => {
        const btn = e.target.closest('button');
        if (!btn) return;
        const id = btn.dataset.id;
        const notes = Storage.getList('notes_data');
        
        if (btn.classList.contains('delete-note')) {
            if (confirm('هل أنت متأكد من حذف الملاحظة؟')) {
                const newNotes = notes.filter(n => n.id !== id);
                Storage.saveList('notes_data', newNotes);
                render();
            }
        } else if (btn.classList.contains('copy-note')) {
            const note = notes.find(n => n.id === id);
            if (note) {
                navigator.clipboard.writeText(note.content).then(() => {
                    alert('تم نسخ الملاحظة');
                });
            }
        } else if (btn.classList.contains('pin-note')) {
            const index = notes.findIndex(n => n.id === id);
            if (index > -1) {
                notes[index].pinned = !notes[index].pinned;
                Storage.saveList('notes_data', notes);
                render();
            }
        }
    });

    header.querySelector('#add-note-btn').onclick = () => {
        const notes = Storage.getList('notes_data');
        notes.unshift({
            id: Utils.generateId(),
            content: '',
            pinned: false,
            timestamp: new Date().toISOString()
        });
        Storage.saveList('notes_data', notes);
        render();
    };

    header.querySelector('#add-voice-btn').onclick = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            mediaRecorder = new MediaRecorder(stream);
            audioChunks = [];

            mediaRecorder.ondataavailable = (event) => {
                audioChunks.push(event.data);
            };

            mediaRecorder.onstop = () => {
                const audioBlob = new Blob(audioChunks, { type: 'audio/mp3' }); 
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = () => {
                    const base64data = reader.result;
                    
                    const notes = Storage.getList('notes_data');
                    notes.unshift({
                        id: Utils.generateId(),
                        content: '', 
                        audio: base64data,
                        pinned: false,
                        timestamp: new Date().toISOString()
                    });
                    Storage.saveList('notes_data', notes);
                    render();
                };
                
                stream.getTracks().forEach(track => track.stop());
                overlay.style.display = 'none';
            };

            mediaRecorder.start();
            overlay.style.display = 'flex'; 

        } catch (err) {
            console.error('Error recording:', err);
            alert('Could not access microphone. Please allow permission.');
        }
    };

    overlay.querySelector('#stop-record-btn').onclick = () => {
         if(mediaRecorder && mediaRecorder.state !== 'inactive') {
             mediaRecorder.stop();
         }
    };

    render();
    container.appendChild(grid);
    return container;
}
