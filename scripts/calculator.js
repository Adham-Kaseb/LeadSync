import { Storage, Utils } from './core.js';

export function renderCalculator() {
    const container = document.createElement('div');
    
    const layout = document.createElement('div');
    layout.style.display = 'grid';
    layout.style.gridTemplateColumns = '3fr 1fr';
    layout.style.gap = '2rem';
    layout.style.height = 'calc(100vh - 140px)';
    
    if (window.innerWidth < 800) {
        layout.style.gridTemplateColumns = '1fr';
        layout.style.height = 'auto'; 
    }

    const calcInterface = document.createElement('div');
    calcInterface.className = 'glass-panel';
    calcInterface.style.padding = '2rem';
    calcInterface.style.borderRadius = '20px';
    calcInterface.style.display = 'flex';
    calcInterface.style.flexDirection = 'column';

    const display = document.createElement('input');
    display.type = 'text';
    display.readOnly = true;
    display.style.width = '100%';
    display.style.marginBottom = '1.5rem';
    display.style.fontSize = '2rem';
    display.style.textAlign = 'right';
    display.style.background = 'rgba(0,0,0,0.5)';
    display.style.border = '1px solid var(--metallic-gold)';
    display.style.color = '#fff';
    display.style.height = '80px';
    display.style.fontFamily = "'Courier New', monospace";
    
    const keypad = document.createElement('div');
    keypad.style.display = 'grid';
    keypad.style.gridTemplateColumns = 'repeat(4, 1fr)';
    keypad.style.gap = '1rem';
    keypad.style.flexGrow = '1';

    const buttons = [
        { label: 'C', type: 'fn', action: 'clear' },
        { label: '←', type: 'fn', action: 'backspace' },
        { label: '%', type: 'op', val: '%' },
        { label: '/', type: 'op', val: '/' },
        { label: '7', type: 'num', val: '7' },
        { label: '8', type: 'num', val: '8' },
        { label: '9', type: 'num', val: '9' },
        { label: '*', type: 'op', val: '*' },
        { label: '4', type: 'num', val: '4' },
        { label: '5', type: 'num', val: '5' },
        { label: '6', type: 'num', val: '6' },
        { label: '-', type: 'op', val: '-' },
        { label: '1', type: 'num', val: '1' },
        { label: '2', type: 'num', val: '2' },
        { label: '3', type: 'num', val: '3' },
        { label: '+', type: 'op', val: '+' },
        { label: '0', type: 'num', val: '0', full: true },
        { label: '.', type: 'num', val: '.' },
        { label: '=', type: 'eq', action: 'calc' },
    ];
    
    const sciButtons = [
        { label: '√', action: 'sqrt' },
        { label: 'x²', action: 'sq' },
        { label: 'log', action: 'log' },
        { label: '(', val: '(' },
        { label: ')', val: ')' },
    ];

    const sciToggle = document.createElement('button');
    sciToggle.className = 'btn btn-glass';
    sciToggle.innerHTML = '<i class="fa-solid fa-flask"></i> الوضع العلمي';
    sciToggle.onclick = () => {
        const sciRow = calcInterface.querySelector('.sci-row');
        sciRow.style.display = sciRow.style.display === 'none' ? 'grid' : 'none';
        sciToggle.classList.toggle('active');
    };
    
    const discountBtn = document.createElement('button');
    discountBtn.className = 'btn btn-glass';
    discountBtn.innerHTML = '<i class="fa-solid fa-percent"></i> خصم';
    discountBtn.style.marginRight = '0.5rem';
    discountBtn.onclick = () => openDiscountModal();

    const toolsRow = document.createElement('div');
    toolsRow.style.display = 'flex';
    toolsRow.style.marginBottom = '1rem';
    toolsRow.appendChild(sciToggle);
    toolsRow.appendChild(discountBtn);

    calcInterface.appendChild(toolsRow);

    const sciRow = document.createElement('div');
    sciRow.className = 'sci-row';
    sciRow.style.display = 'none';
    sciRow.style.gridTemplateColumns = 'repeat(5, 1fr)';
    sciRow.style.gap = '0.5rem';
    sciRow.style.marginBottom = '1rem';

    sciButtons.forEach(btn => {
        const b = document.createElement('button');
        b.className = 'btn btn-glass';
        b.innerText = btn.label;
        b.onclick = () => handleInput(btn);
        sciRow.appendChild(b);
    });
    calcInterface.appendChild(sciRow);

    calcInterface.appendChild(display);
    
    buttons.forEach(btn => {
        const b = document.createElement('button');
        b.className = `btn ${btn.type === 'eq' ? 'btn-primary' : 'btn-glass'}`;
        b.innerText = btn.label;
        b.style.fontSize = '1.2rem';
        if (btn.full) b.style.gridColumn = 'span 2';
        
        b.onclick = () => handleInput(btn);
        keypad.appendChild(b);
    });
    calcInterface.appendChild(keypad);

    const historyPanel = document.createElement('div');
    historyPanel.className = 'glass-panel';
    historyPanel.style.padding = '1.5rem';
    historyPanel.style.borderRadius = '16px';
    historyPanel.style.display = 'flex';
    historyPanel.style.flexDirection = 'column';

    historyPanel.innerHTML = '<h3 style="margin-bottom: 1rem;">السجل</h3>';
    const historyList = document.createElement('div');
    historyList.style.flexGrow = '1';
    historyList.style.overflowY = 'auto';
    historyList.style.display = 'flex';
    historyList.style.flexDirection = 'column';
    historyList.style.gap = '1rem';
    historyPanel.appendChild(historyList);

    let expression = '';

    function renderHistory() {
        historyList.innerHTML = '';
        const hist = Storage.getList('calc_history');
        hist.slice(-10).reverse().forEach(h => {
             const item = document.createElement('div');
             item.style.fontSize = '0.9rem';
             item.style.paddingBottom = '0.5rem';
             item.style.borderBottom = '1px solid var(--glass-border)';
             item.innerHTML = `
                <div style="color: var(--text-secondary);">${h.expression}</div>
                <div style="color: var(--metallic-gold); font-weight: bold; font-size: 1.1rem;">= ${h.result}</div>
             `;
             historyList.appendChild(item);
        });
    }

    function handleInput(btn) {
        if (btn.action === 'clear') {
            expression = '';
        } else if (btn.action === 'backspace') {
            expression = expression.slice(0, -1);
        } else if (btn.action === 'calc') {
            try {
                const result = new Function('return ' + expression)();
                const hist = Storage.getList('calc_history');
                hist.push({
                    expression: expression,
                    result: result,
                    timestamp: new Date().toISOString()
                });
                Storage.saveList('calc_history', hist);
                renderHistory();
                expression = String(result);
            } catch (e) {
                expression = 'Error';
            }
        } else if (btn.action === 'sqrt') {
            expression += 'Math.sqrt(';
        } else if (btn.action === 'sq') {
            expression += '**2';
        } else if (btn.action === 'log') {
            expression += 'Math.log10(';
        } else {
             expression += btn.val !== undefined ? btn.val : '';
        }
        display.value = expression;
    }

    function handleKeyboard(e) {
        if (!document.body.contains(calcInterface)) return; 
        const key = e.key;
        if (/[0-9]/.test(key) && key.length === 1) {
            handleInput({ type: 'num', val: key });
        }
        else if (['+', '-', '*', '/'].includes(key)) {
             handleInput({ type: 'op', val: key });
        }
        else if (key === '%') handleInput({ type: 'op', val: '%' });
        else if (key === '.') handleInput({ type: 'num', val: '.' });
        else if (key === 'Enter' || key === '=') handleInput({ action: 'calc' });
        else if (key === 'Backspace') handleInput({ action: 'backspace' });
        else if (key === 'Escape' || key === 'Delete') handleInput({ action: 'clear' });
    }

    if (window._calcKeyListener) {
        window.removeEventListener('keydown', window._calcKeyListener);
    }
    window._calcKeyListener = handleKeyboard;
    window.addEventListener('keydown', handleKeyboard);

    renderHistory();
    
    layout.appendChild(calcInterface);
    layout.appendChild(historyPanel);
    container.appendChild(layout);

    function openDiscountModal() {
        const existing = document.querySelector('.modal-overlay');
        if(existing) existing.remove();

        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay glass-panel';
        overlay.style.position = 'fixed';
        overlay.style.inset = '0';
        overlay.style.background = 'rgba(0,0,0,0.85)';
        overlay.style.display = 'flex';
        overlay.style.justifyContent = 'center';
        overlay.style.alignItems = 'center';
        overlay.style.zIndex = '3000';
        overlay.style.backdropFilter = 'blur(5px)';

        overlay.innerHTML = `
            <div class="glass-panel" style="background:#151515; padding:2rem; border-radius:16px; width:90%; max-width:400px; display:flex; flex-direction:column; gap:1.2rem; box-shadow: 0 20px 50px rgba(0,0,0,0.5);">
                <div style="display:flex; justify-content:space-between; align-items:center;">
                    <h2 style="font-size: 1.4rem;"><i class="fa-solid fa-tag gold-text"></i> حساب الخصم</h2>
                    <button id="close-modal-icon" style="background:none; border:none; color:var(--text-secondary); font-size:1.2rem; cursor:pointer;"><i class="fa-solid fa-xmark"></i></button>
                </div>
                
                <div>
                    <label style="display:block; margin-bottom:0.5rem; color:var(--text-secondary); font-size:0.9rem;">السعر الأصلي</label>
                    <input type="number" id="price-input" placeholder="0.00" style="width:100%; padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: #fff; font-size: 1.1rem;">
                </div>
                
                <div>
                    <label style="display:block; margin-bottom:0.5rem; color:var(--text-secondary); font-size:0.9rem;">نسبة الخصم (%)</label>
                    <input type="number" id="discount-input" placeholder="0" style="width:100%; padding: 12px; background: rgba(255,255,255,0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 8px; color: #fff; font-size: 1.1rem;">
                </div>

                <div style="background: rgba(255,255,255,0.03); padding: 1rem; border-radius: 12px; text-align: center; margin-top: 0.5rem;">
                    <div style="font-size: 0.9rem; color: var(--text-secondary);">السعر النهائي</div>
                    <div id="final-price" style="font-size: 2rem; font-weight: bold; color: var(--metallic-gold); margin: 0.5rem 0;">0.00</div>
                    <div style="font-size: 0.9rem; color: #4dff4d;">وفرت: <span id="saved-amount">0.00</span></div>
                </div>
            </div>
        `;

        document.body.appendChild(overlay);

        const priceInput = overlay.querySelector('#price-input');
        const discountInput = overlay.querySelector('#discount-input');
        const finalPriceEl = overlay.querySelector('#final-price');
        const savedAmountEl = overlay.querySelector('#saved-amount');

        const calculate = () => {
            const price = parseFloat(priceInput.value) || 0;
            const discount = parseFloat(discountInput.value) || 0;
            const saved = price * (discount / 100);
            const final = price - saved;
            finalPriceEl.innerText = final.toFixed(2);
            savedAmountEl.innerText = saved.toFixed(2);
        };

        priceInput.addEventListener('input', calculate);
        discountInput.addEventListener('input', calculate);

        const close = () => overlay.remove();
        overlay.querySelector('#close-modal-icon').onclick = close;
        overlay.onclick = (e) => {
            if(e.target === overlay) close();
        };
    }

    return container;
}
