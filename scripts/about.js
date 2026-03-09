export function openAboutModal() {
  const existing = document.querySelector(".modal-overlay");
  if (existing) existing.remove();

  const styleId = "about-modal-styles";
  if (!document.getElementById(styleId)) {
    const style = document.createElement("style");
    style.id = styleId;
    style.innerHTML = `
            .about-modal-overlay {
                position: fixed; inset: 0; background: rgba(0,0,0,0.6);
                display: flex; justify-content: center; align-items: center; z-index: 3000;
                backdrop-filter: blur(25px) saturate(150%); -webkit-backdrop-filter: blur(25px) saturate(150%);
                animation: fadeInModal 0.4s cubic-bezier(0.16, 1, 0.3, 1);
            }
            .about-content {
                background: linear-gradient(145deg, rgba(20,20,20,0.85), rgba(5,5,5,0.95)); 
                padding: 3.5rem 3rem; 
                border-radius: 32px;
                width: 92%; max-width: 1000px; max-height: 85vh;
                display: flex; flex-direction: column; gap: 1.5rem;
                border: 1px solid rgba(255, 255, 255, 0.08);
                box-shadow: 0 30px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1);
                position: relative; overflow-y: auto; overflow-x: hidden;
                box-sizing: border-box;
            }
            
            .about-content::-webkit-scrollbar { width: 6px; }
            .about-content::-webkit-scrollbar-track { background: transparent; margin: 20px; border-radius: 10px; }
            .about-content::-webkit-scrollbar-thumb { background: rgba(227, 185, 56, 0.2); border-radius: 10px; transition: background 0.3s; }
            .about-content::-webkit-scrollbar-thumb:hover { background: rgba(227, 185, 56, 0.5); }

            .about-close-btn {
                position: absolute; top: 25px; right: 25px; width: 44px; height: 44px;
                background: rgba(255, 255, 255, 0.03); border: 1px solid rgba(255, 255, 255, 0.08);
                border-radius: 50%; color: var(--text-secondary); font-size: 1.1rem;
                cursor: pointer; z-index: 20; display: flex; align-items: center; justify-content: center;
                transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
                backdrop-filter: blur(10px);
            }
            .about-close-btn:hover {
                background: rgba(255, 255, 255, 0.1); color: #fff; transform: rotate(90deg) scale(1.1);
                border-color: rgba(255, 255, 255, 0.2);
            }

            .logo-container {
                width: 180px; height: 180px; margin: 0 auto; position: relative;
                perspective: 1000px;
                display: flex; align-items: center; justify-content: center;
            }
            .logo-glow-bg {
                position: absolute; width: 150%; height: 150%;
                background: radial-gradient(circle, rgba(255,215,0,0.12) 0%, transparent 60%);
                filter: blur(25px); animation: breathingGlow 8s ease-in-out infinite;
                z-index: 0;
            }
            .logo-img {
                width: 100%; height: 100%; object-fit: contain;
                filter: drop-shadow(0 15px 35px rgba(0,0,0,0.8));
                animation: smoothFloat 8s ease-in-out infinite;
                transition: transform 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275), filter 0.5s ease;
                cursor: pointer; z-index: 2;
                transform-origin: center;
            }
            .logo-container:hover .logo-img {
                transform: scale(1.08) translateY(-5px);
                filter: drop-shadow(0 25px 45px rgba(255,215,0,0.15));
            }
            .logo-shine {
                position: absolute; top: 0; left: 0; width: 100%; height: 100%;
                background: linear-gradient(135deg, transparent 40%, rgba(255,255,255,0.6) 50%, transparent 60%);
                filter: blur(3px); opacity: 0;
                animation: premiumShine 6s ease-in-out infinite; pointer-events: none;
                mix-blend-mode: overlay; z-index: 3;
                -webkit-mask-image: url('images/lead-sync-logo.png');
                -webkit-mask-size: contain; -webkit-mask-repeat: no-repeat; -webkit-mask-position: center;
            }

            @keyframes smoothFloat {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-15px); }
            }
            @keyframes breathingGlow {
                0%, 100% { opacity: 0.4; transform: scale(0.95); }
                50% { opacity: 0.8; transform: scale(1.05); }
            }
            @keyframes premiumShine {
                0%, 10% { background-position: -200% -200%; opacity: 0; }
                20% { opacity: 1; }
                40%, 100% { background-position: 200% 200%; opacity: 0; }
            }
            @keyframes fadeInModal { 
                0% { opacity: 0; transform: scale(0.95) translateY(10px); } 
                100% { opacity: 1; transform: scale(1) translateY(0); } 
            }

            .about-grid { 
                display: grid; 
                grid-template-columns: repeat(auto-fill, minmax(140px, 1fr)); 
                gap: 1.2rem; 
                margin-top: 1.5rem; 
            }
            
            .about-card {
                background: linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%); 
                padding: 1.5rem;
                border-radius: 20px; 
                border: 1px solid rgba(255,255,255,0.06);
                text-align: center; cursor: pointer; position: relative; overflow: hidden;
                transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
                backdrop-filter: blur(10px);
                display: flex; flex-direction: column; align-items: center; justify-content: center;
                min-height: 130px;
                box-shadow: inset 0 1px 0 rgba(255,255,255,0.02);
            }
            .about-card::before {
                content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px;
                background: linear-gradient(90deg, transparent, rgba(255,215,0,0.1), transparent);
                opacity: 0; transition: opacity 0.4s;
            }
            .about-card:hover {
                background: linear-gradient(180deg, rgba(255,215,0,0.05) 0%, rgba(255,255,255,0.02) 100%);
                border-color: rgba(227, 185, 56, 0.3); 
                transform: translateY(-6px) scale(1.02);
                box-shadow: 0 15px 35px rgba(0,0,0,0.4), 0 5px 15px rgba(255,215,0,0.05);
            }
            .about-card:hover::before { opacity: 1; }
            .about-card i { 
                font-size: 2rem; color: var(--metallic-gold); margin-bottom: 1rem; 
                transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1); 
                opacity: 0.9;
            }
            .about-card:hover i { transform: scale(1.15) translateY(-2px); filter: drop-shadow(0 0 12px rgba(227, 185, 56, 0.5)); opacity: 1; }
            .about-card h4 { color: #fff; font-size: 1rem; margin-bottom: 0.5rem; font-weight: 700; letter-spacing: 0.5px; }
            .about-card p { color: rgba(255,255,255,0.5); font-size: 0.8rem; line-height: 1.5; font-weight: 400; }
            
            .tech-stack { 
                display: flex; justify-content: center; gap: 2.5rem; padding: 2.5rem 0 1rem; 
                border-top: 1px solid rgba(255,255,255,0.05); margin-top: 2rem; 
            }
            .tech-item { 
                display: flex; flex-direction: column; align-items: center; gap: 0.8rem; 
                color: rgba(255,255,255,0.4); font-size: 0.85rem; letter-spacing: 0.5px; 
            }
            .tech-item i { font-size: 1.4rem; color: rgba(255,255,255,0.3); transition: color 0.3s; }
            .tech-item:hover i, .tech-item:hover { color: var(--metallic-gold); }

            .elite-badge {
                background: linear-gradient(135deg, #ffd700 0%, #d4af37 100%);
                color: #000; padding: 4px 14px; border-radius: 50px;
                font-size: 0.75rem; font-weight: 800; text-transform: uppercase;
                letter-spacing: 1.5px; box-shadow: 0 4px 15px rgba(255,215,0,0.25);
                border: 1px solid rgba(255,255,255,0.2);
            }
            
            .version-tag {
                background: rgba(255,255,255,0.05); 
                color: rgba(255,255,255,0.7); 
                padding: 4px 10px; 
                border-radius: 6px; 
                font-size: 0.75rem; 
                border: 1px solid rgba(255,255,255,0.1); 
                font-family: 'Orbitron', monospace;
                letter-spacing: 1px;
            }
        `;
    document.head.appendChild(style);
  }

  const overlay = document.createElement("div");
  overlay.className = "about-modal-overlay";

  const features = [
    { icon: "fa-house", title: "الـ HQ", desc: "نظرة عامة على نشاطك ورسائلك." },
    {
      icon: "fa-users",
      title: "العملاء",
      desc: "إدارة شاملة لبيانات العملاء.",
    },
    {
      icon: "fa-school",
      title: "المدرسة",
      desc: "روابط ودورات تعليمية منظمة.",
    },
    {
      icon: "fa-comment-dots",
      title: "الرسائل",
      desc: "قوالب رسائل جاهزة للرد السريع.",
    },
    {
      icon: "fa-note-sticky",
      title: "الملاحظات",
      desc: "تدوين ملاحظات نصية وصوتية.",
    },
    {
      icon: "fa-radio",
      title: "إذاعة القرآن",
      desc: "بث مباشر مع أجهزة قياس احترافية.",
    },
    {
      icon: "fa-link",
      title: "الروابط",
      desc: "الوصول السريع للمواقع المفضة.",
    },
    { icon: "fa-calculator", title: "الخصومات", desc: "حسابات سريعة ومعقدة." },
    { icon: "fa-bell", title: "التذكيرات", desc: "تنبيهات للمواعيد المهمة." },
    { icon: "fa-calendar-days", title: "التقويم", desc: "تنظيم جدولك الزمني." },
    {
      icon: "fa-handshake",
      title: "الاجتماعات",
      desc: "إدارة وتنظيم اجتماعاتك القادمة.",
    },
    {
      icon: "fa-chart-pie",
      title: "المبيعات",
      desc: "تقارير وتحليلات المبيعات اليومية.",
    },
    {
      icon: "fa-newspaper",
      title: "المقالات",
      desc: "محرر نصوص متطور ومؤثرات.",
    },
    { icon: "fa-gear", title: "الإعدادات", desc: "تخصيص التطبيق وقفل الشاشة." },
  ];

  overlay.innerHTML = `
        <div class="about-content">
            <button class="about-close-btn" id="close-about" title="إغلاق"><i class="fa-solid fa-xmark"></i></button>

            <div style="text-align: center; padding: 1rem 0 2rem;">
                <div class="logo-container">
                    <div class="logo-glow-bg"></div>
                    <img src="images/lead-sync-logo.png" alt="LeadSync" class="logo-img">
                    <div class="logo-shine"></div>
                </div>

                <h1 style="font-size: 3.5rem; margin: 1rem 0 0.8rem; background: linear-gradient(to right, #ffffff, #ffd700, #ffffff); background-size: 200%; -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-weight: 800; animation: premiumShine 8s linear infinite; letter-spacing: -2px;">LeadSync</h1>
                <div style="display:flex; justify-content:center; align-items:center; gap:16px; margin-top: 0.5rem;">
                    <span class="version-tag">v1.27.0</span>
                    <span class="elite-badge">Elite Edition</span>
                </div>
            </div>

            <div class="about-grid">
                ${features
                  .map(
                    (f) => `
                    <div class="about-card">
                        <i class="fa-solid ${f.icon}"></i>
                        <h4>${f.title}</h4>
                        <p>${f.desc}</p>
                    </div>
                `,
                  )
                  .join("")}
            </div>

            <div class="tech-stack">
                <div class="tech-item"><i class="fa-solid fa-code"></i><span>Adham Kaseb</span></div>
            </div>

        </div>
    `;

  document.body.appendChild(overlay);

  const close = () => {
    const content = overlay.querySelector(".about-content");
    content.style.transform = "scale(0.95) translateY(20px)";
    content.style.opacity = "0";
    content.style.transition = "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)";

    overlay.style.backgroundColor = "transparent";
    overlay.style.backdropFilter = "blur(0px)";
    overlay.style.transition = "all 0.3s ease";

    setTimeout(() => overlay.remove(), 300);
  };

  overlay.querySelector("#close-about").onclick = close;
  overlay.onclick = (e) => {
    if (e.target === overlay) close();
  };
}

