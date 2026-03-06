import { Storage } from './core.js';

const DEFAULT_HEALTH_CONTENT = {
    title: "استراحة المحارب",
    cheeryWord: "مجهود رائع! أنت تقوم بعمل مذهل، ولكن صحتك هي رأس مالك الحقيقي.",
    exercises: [
        "تمرين الرقبة: حرك رأسك ببطء لليمين واليسار (5 مرات).",
        "تمرين الكتف: حرك كتفيك في حركة دائرية للخلف (10 مرات).",
        "تمديد الظهر: اجلس باستقامة وارفع ذراعيك لأقصى ارتفاع.",
        "دوران الجذع: التفت بجذعك لليمين ثم لليسار وأنت جالس.",
        "تحريك الكاحلين: حرك كاحليك في دوائر لتنشيط الدورة الدموية.",
        "تركيز العين: انظر لشيء بعيد لمدة 20 ثانية لإراحة عينيك.",
        "الوقوف والمشي: قم وتمشى في الغرفة لمدة دقيقة واحدة.",
        "التنفس العميق: خذ نفساً عميقاً واحبسه لـ 5 ثوان ثم ازفره ببطء."
    ],
    advice: "نصيحة لتخفيف الآلام:\nلتجنب آلام الرقبة والظهر، تأكد من أن شاشتك في مستوى النظر، وأن ظهرك مسنود جيداً، وقدميك تلامسان الأرض. اشرب كوباً من الماء الآن!"
};

const STORAGE_KEY = 'health_config';

export function getHealthContent() {
    const saved = Storage.get(STORAGE_KEY);
    return saved ? { ...DEFAULT_HEALTH_CONTENT, ...saved } : DEFAULT_HEALTH_CONTENT;
}

export function saveHealthContent(data) {
    Storage.set(STORAGE_KEY, data);
}

export function showHealthPopup() {
    const existing = document.querySelector('.health-modal-overlay');
    if (existing) existing.remove();

    const content = getHealthContent();

    const overlay = document.createElement('div');
    overlay.className = 'health-modal-overlay glass-panel';
    overlay.style.position = 'fixed';
    overlay.style.inset = '0';
    overlay.style.zIndex = '9999'; 
    overlay.style.background = 'rgba(0,0,0,0.9)';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.backdropFilter = 'blur(15px)';
    overlay.style.animation = 'fadeIn 0.5s ease';

    const exercisesHtml = content.exercises.map(ex => `
        <li style="margin-bottom: 8px; display: flex; align-items: flex-start; gap: 10px;">
            <i class="fa-solid fa-person-running" style="color: var(--metallic-gold); margin-top: 5px;"></i>
            <span style="color: rgba(255,255,255,0.9); font-size: 0.95rem;">${ex}</span>
        </li>
    `).join('');

    overlay.innerHTML = `
        <div class="glass-panel" style="
            width: 90%; 
            max-width: 700px; 
            background: linear-gradient(145deg, rgba(20,20,20,0.95), rgba(10,10,10,0.98)); 
            border: 2px solid var(--metallic-gold);
            border-radius: 20px; 
            padding: 2.5rem;
            position: relative;
            box-shadow: 0 0 60px rgba(227, 185, 56, 0.2);
            max-height: 90vh;
            overflow-y: auto;
        ">
            <div style="text-align: center; margin-bottom: 2rem;">
                <div style="
                    width: 70px; height: 70px; 
                    background: rgba(227, 185, 56, 0.1); 
                    border-radius: 50%; 
                    display: flex; justify-content: center; align-items: center; 
                    margin: 0 auto 1rem auto;
                    color: var(--metallic-gold);
                    font-size: 2rem;
                    border: 1px solid var(--metallic-gold);
                    box-shadow: 0 0 20px rgba(227, 185, 56, 0.2);
                ">
                    <i class="fa-solid fa-heart-pulse"></i>
                </div>
                <h2 style="font-size: 2rem; color: var(--metallic-gold); margin-bottom: 0.5rem;">${content.title}</h2>
                <div style="font-size: 1.1rem; color: #fff; font-weight: bold;">
                    ⏳ مرّت 60 دقيقة من العمل المتواصل
                </div>
            </div>

            <div style="
                background: linear-gradient(90deg, rgba(227, 185, 56, 0.1), transparent);
                border-right: 4px solid var(--metallic-gold);
                padding: 1.2rem;
                margin-bottom: 2rem;
                border-radius: 4px;
                font-style: italic;
                color: rgba(255,255,255,0.9);
                font-size: 1.05rem;
                line-height: 1.6;
            ">
                "${content.cheeryWord}"
            </div>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2rem;">
                <div>
                    <h3 style="color: var(--metallic-gold); margin-bottom: 1rem; display:flex; align-items:center; gap:10px;">
                        <i class="fa-solid fa-dumbbell"></i> 8 تمارين لاسترخاء الجلوس
                    </h3>
                    <ul style="list-style: none; padding: 0;">
                        ${exercisesHtml}
                    </ul>
                </div>

                <div>
                    <h3 style="color: var(--metallic-gold); margin-bottom: 1rem; display:flex; align-items:center; gap:10px;">
                        <i class="fa-solid fa-user-doctor"></i> نصائح لتخفيف الآلام
                    </h3>
                    <div style="
                        background: rgba(255,255,255,0.03); 
                        padding: 1.2rem; 
                        border-radius: 12px; 
                        line-height: 1.7; 
                        color: rgba(255,255,255,0.8);
                        border: 1px solid rgba(255,255,255,0.05);
                        white-space: pre-wrap;
                    ">
                        ${content.advice}
                    </div>
                </div>
            </div>

            <div style="text-align: center;">
                <button id="close-health-popup" class="btn btn-primary" style="
                    padding: 0.8rem 3rem; 
                    font-size: 1.1rem; 
                    box-shadow: 0 5px 20px rgba(227, 185, 56, 0.3);
                ">
                    <i class="fa-solid fa-check"></i> فهمت، سأخذ استراحة
                </button>
            </div>
        </div>
    `;

    document.body.appendChild(overlay);

    overlay.querySelector('#close-health-popup').onclick = () => {
        overlay.style.opacity = '0';
        setTimeout(() => overlay.remove(), 500);
        window.sessionStartTime = Date.now(); 
    };
}

let checkInterval = null;

export function initHealthTimer() {
    if (window.sessionStartTime === undefined) {
        window.sessionStartTime = Date.now();
    }
    if (checkInterval) clearInterval(checkInterval);
    checkInterval = setInterval(() => {
        const now = Date.now();
        const diff = now - window.sessionStartTime;
        const ONE_HOUR = 60 * 60 * 1000; 
        if (diff >= ONE_HOUR) {
             if (!document.querySelector('.health-modal-overlay')) {
                 showHealthPopup();
             }
        }
    }, 60000); 
}
