export function openAboutModal() {
    const existing = document.querySelector('.modal-overlay');
    if(existing) existing.remove();

    const styleId = 'about-modal-styles';
    if (!document.getElementById(styleId)) {
        const style = document.createElement('style');
        style.id = styleId;
        style.innerHTML = `
            .about-modal-overlay {
                position: fixed; inset: 0; background: rgba(0,0,0,0.85);
                display: flex; justify-content: center; align-items: center; z-index: 3000;
                backdrop-filter: blur(10px); animation: fadeIn 0.3s ease;
            }
            .about-content {
                background: linear-gradient(135deg, rgba(20,20,20,0.95), rgba(10,10,10,0.98)); 
                padding: 3.5rem 3rem; border-radius: 40px 10px 40px 10px;
                width: 95%; max-width: 950px; max-height: 90vh;
                display: flex; flex-direction: column; gap: 1.5rem;
                border: 1px solid rgba(255, 215, 0, 0.15);
                box-shadow: 0 0 80px rgba(255, 215, 0, 0.05), inset 0 0 30px rgba(0,0,0,0.5);
                position: relative; overflow-y: auto; overflow-x: hidden;
            }
            
            .about-content::-webkit-scrollbar { width: 6px; }
            .about-content::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); margin: 20px; border-radius: 10px; }
            .about-content::-webkit-scrollbar-thumb { background: rgba(227, 185, 56, 0.2); border-radius: 10px; transition: background 0.2s; }
            .about-content::-webkit-scrollbar-thumb:hover { background: rgba(227, 185, 56, 0.5); }

            .about-close-btn {
                position: absolute; top: 25px; right: 25px; width: 40px; height: 40px;
                background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 50%; color: var(--text-secondary); font-size: 1.1rem;
                cursor: pointer; z-index: 20; display: flex; align-items: center; justify-content: center;
                transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            }
            .about-close-btn:hover {
                background: rgba(231, 76, 60, 0.2); color: #fff; border-color: rgba(231, 76, 60, 0.5); transform: rotate(90deg);
            }

            .logo-container {
                width: 160px; height: 160px; margin: 0 auto; position: relative;
                perspective: 1000px;
                display: flex; align-items: center; justify-content: center;
            }
            .logo-glow-bg {
                position: absolute; width: 120%; height: 120%;
                background: radial-gradient(circle, rgba(255,215,0,0.15) 0%, transparent 70%);
                filter: blur(20px); animation: logoPulse 4s ease-in-out infinite;
            }
            .logo-img {
                width: 100%; height: 100%; object-fit: contain;
                filter: drop-shadow(0 15px 30px rgba(0,0,0,0.7));
                animation: floatLogo 6s ease-in-out infinite;
                transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
                cursor: pointer; z-index: 2;
            }
            .logo-container:hover .logo-img {
                transform: scale(1.1) rotateY(10deg);
                filter: drop-shadow(0 20px 40px rgba(255,215,0,0.2));
            }
            .logo-shine {
                position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                background: linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.4) 50%, transparent 60%);
                filter: blur(5px); opacity: 0;
                animation: shineLogo 5s ease-in-out infinite; pointer-events: none;
                mix-blend-mode: overlay; z-index: 3;
                -webkit-mask-image: url('images/lead-sync-logo.png');
                -webkit-mask-size: contain; -webkit-mask-repeat: no-repeat; -webkit-mask-position: center;
            }

            @keyframes floatLogo {
                0%, 100% { transform: translateY(0) rotateZ(0); }
                50% { transform: translateY(-20px) rotateZ(2deg); }
            }
            @keyframes logoPulse {
                0%, 100% { opacity: 0.5; transform: scale(1); }
                50% { opacity: 1; transform: scale(1.15); }
            }
            @keyframes shineLogo {
                0% { background-position: -200% -200%; opacity: 0; }
                40% { background-position: 200% 200%; opacity: 0.8; }
                100% { background-position: 200% 200%; opacity: 0; }
            }
            @keyframes fadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }

            .about-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(130px, 1fr)); gap: 1.2rem; margin-top: 1rem; }
            
            .about-card {
                background: rgba(255,255,255,0.02); padding: 1.2rem;
                border-radius: 20px; border: 1px solid rgba(255,255,255,0.05);
                text-align: center; cursor: pointer; position: relative; overflow: hidden;
                transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
            }
            .about-card:hover {
                background: linear-gradient(145deg, rgba(255,215,0,0.07), transparent);
                border-color: rgba(227, 185, 56, 0.3); transform: translateY(-5px);
                box-shadow: 0 10px 30px rgba(0,0,0,0.3);
            }
            .about-card i { font-size: 1.8rem; color: var(--metallic-gold); margin-bottom: 0.8rem; transition: transform 0.3s; }
            .about-card:hover i { transform: scale(1.1); filter: drop-shadow(0 0 10px rgba(227, 185, 56, 0.4)); }
            .about-card h4 { color: #fff; font-size: 0.95rem; margin-bottom: 0.4rem; font-weight: 600; }
            .about-card p { color: rgba(255,255,255,0.5); font-size: 0.75rem; line-height: 1.4; }
            
            .tech-stack { display: flex; justify-content: center; gap: 2rem; padding: 2rem 0; border-top: 1px solid rgba(255,255,255,0.05); margin-top: 2rem; }
            .tech-item { display: flex; flex-direction: column; align-items: center; gap: 0.5rem; color: rgba(255,255,255,0.4); font-size: 0.8rem; }
            .tech-item i { font-size: 1.2rem; color: var(--text-secondary); transition: color 0.3s; }
            .tech-item:hover i, .tech-item:hover { color: var(--metallic-gold); }

            .elite-badge {
                background: linear-gradient(135deg, #ffd700 0%, #b8860b 100%);
                color: #000; padding: 2px 12px; border-radius: 50px;
                font-size: 0.75rem; font-weight: 700; text-transform: uppercase;
                letter-spacing: 1px; box-shadow: 0 4px 15px rgba(255,215,0,0.3);
                border: 1px solid rgba(255,255,255,0.4);
            }
        `;
        document.head.appendChild(style);
    }

    const overlay = document.createElement('div');
    overlay.className = 'about-modal-overlay';

    const features = [
        { icon: 'fa-house', title: 'الـ HQ', desc: 'نظرة عامة على نشاطك ورسائلك.' },
        { icon: 'fa-users', title: 'العملاء', desc: 'إدارة شاملة لبيانات العملاء.' },
        { icon: 'fa-school', title: 'المدرسة', desc: 'روابط ودورات تعليمية منظمة.' },
        { icon: 'fa-comment-dots', title: 'الرسائل', desc: 'قوالب رسائل جاهزة للرد السريع.' },
        { icon: 'fa-note-sticky', title: 'الملاحظات', desc: 'تدوين ملاحظات نصية وصوتية.' },
        { icon: 'fa-radio', title: 'إذاعة القرآن', desc: 'بث مباشر مع أجهزة قياس احترافية.' },
        { icon: 'fa-link', title: 'الروابط', desc: 'الوصول السريع للمواقع المفضة.' },
        { icon: 'fa-calculator', title: 'الخصومات', desc: 'حسابات سريعة ومعقدة.' },
        { icon: 'fa-bell', title: 'التذكيرات', desc: 'تنبيهات للمواعيد المهمة.' },
        { icon: 'fa-calendar-days', title: 'التقويم', desc: 'تنظيم جدولك الزمني.' },
        { icon: 'fa-newspaper', title: 'المقالات', desc: 'محرر نصوص متطور ومؤثرات.' },
        { icon: 'fa-gear', title: 'الإعدادات', desc: 'تخصيص التطبيق وقفل الشاشة.' }
    ];

    overlay.innerHTML = `
        <div class="about-content">
            <button class="about-close-btn" id="close-about"><i class="fa-solid fa-xmark"></i></button>

            <div style="text-align: center; padding: 2rem 0;">
                <div class="logo-container">
                    <div class="logo-glow-bg"></div>
                    <img src="images/lead-sync-logo.png" alt="LeadSync" class="logo-img">
                    <div class="logo-shine"></div>
                </div>

                <h1 style="font-size: 3rem; margin: 1.5rem 0 0.5rem; background: linear-gradient(to right, #fff, var(--metallic-gold), #fff); background-size: 200%; -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 800; animation: shineLogo 8s linear infinite; letter-spacing: -1px;">LeadSync</h1>
                <div style="display:flex; justify-content:center; align-items:center; gap:12px; margin-top: 0.5rem;">
                    <span class="elite-badge">Elite Edition</span>
                    <span style="background:rgba(255,215,0,0.1); color:var(--metallic-gold); padding:2px 8px; border-radius:4px; font-size:0.75rem; border:1px solid rgba(255,215,0,0.2); font-family: monospace;">v1.27.0</span>
                </div>
            </div>

            <div class="about-grid">
                ${features.map(f => `
                    <div class="about-card">
                        <i class="fa-solid ${f.icon}"></i>
                        <h4>${f.title}</h4>
                        <p>${f.desc}</p>
                    </div>
                `).join('')}
            </div>

            <div class="tech-stack">
                <div class="tech-item"><i class="fa-solid fa-code"></i><span>Adham Kaseb</span></div>
            </div>

        </div>
    `;

    document.body.appendChild(overlay);

    const close = () => {
        overlay.style.opacity = '0';
        setTimeout(() => overlay.remove(), 300);
    };

    overlay.querySelector('#close-about').onclick = close;
    overlay.onclick = (e) => { if(e.target === overlay) close(); };
}
