/**
 * จัดรูปแบบตัวเลขเป็นรูปแบบเงินบาทพร้อมทศนิยม 2 ตำแหน่ง
 * @param {number} val
 * @returns {string}
 */
export function formatBaht(val) {
  if (val === undefined || val === null || isNaN(val)) return '0.00';
  return Number(val).toLocaleString('th-TH', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * เรนเดอร์หน้าแสดงผลลัพธ์การคำนวณภาษีเงินได้บุคคลธรรมดา (ภ.ง.ด.91)
 * @param {object} result - ผลลัพธ์จาก calculateTax(input)
 * @param {object} options - ตัวเลือกการแสดงผล { advice4, advice5, onEdit, onRecalculate, container, inputWarnings }
 * @returns {HTMLElement} Element Container ของหน้าผลลัพธ์
 */
export function renderResult(result, options = {}) {
  const {
    advice4 = null,
    onEdit = null,
    onRecalculate = null,
    container = null,
  } = options;

  const res = result || {};
  const amountDue = res.amountDue || 0;

  // กำหนดข้อความและป้ายสำหรับ Hero Card
  let heroLabel = 'ไม่มียอดต้องชำระ';
  let heroAmountStr = '0.00';

  if (amountDue > 0) {
    heroLabel = 'ต้องชำระเพิ่ม';
    heroAmountStr = formatBaht(amountDue);
  } else if (amountDue < 0) {
    heroLabel = 'ได้รับคืน';
    heroAmountStr = formatBaht(Math.abs(amountDue));
  }

  const wrapper = document.createElement('div');
  wrapper.className = 'result-container';

  // 1. การ์ดสรุปหลัก Hero
  const heroCard = document.createElement('div');
  heroCard.className = 'hero-card';
  heroCard.innerHTML = `
    <div class="hero-badge">${heroLabel}</div>
    <div class="hero-amount">${heroAmountStr} <span class="hero-unit">บาท</span></div>
  `;
  wrapper.appendChild(heroCard);

  // 2. สรุปตัวเลขเงินได้และภาษี
  const metricsCard = document.createElement('div');
  metricsCard.className = 'metrics-card';
  metricsCard.innerHTML = `
    <h3 class="section-title" style="margin-bottom: 8px; border-bottom: 1px solid var(--color-border); padding-bottom: 6px;">สรุปตัวเลขเงินได้และภาษี</h3>
    <div class="metric-row"><span>เงินได้รวม</span><span class="metric-val">${formatBaht(res.grossIncome)} บาท</span></div>
    <div class="metric-row"><span>หักค่าใช้จ่ายเหมา (50%)</span><span class="metric-val">-${formatBaht(res.expenseDeduction)} บาท</span></div>
    <div class="metric-row"><span>ค่าลดหย่อนรวม</span><span class="metric-val">-${formatBaht(res.totalAllowances)} บาท</span></div>
    <div class="metric-row font-bold" style="background: var(--color-subtle-bg); padding: 4px 8px; border-radius: 4px;"><span>เงินได้สุทธิ</span><span class="metric-val">${formatBaht(res.netIncome)} บาท</span></div>
    <div class="metric-row"><span>ภาษีที่คำนวณได้</span><span class="metric-val">${formatBaht(res.taxCalculated)} บาท</span></div>
    <div class="metric-row"><span>ภาษีที่หักไว้แล้ว</span><span class="metric-val">-${formatBaht(res.taxWithheld)} บาท</span></div>
  `;
  wrapper.appendChild(metricsCard);



  // 4. หัวข้อใหม่ 2: คำแนะนำในการลดหย่อนภาษี (Tax Deduction Advice & Savings)
  const adviceSection = document.createElement('div');
  adviceSection.className = 'advice-card deduction-advice-section';
  adviceSection.style.cssText = 'margin-top: 16px; border: 1px solid var(--color-border); padding: 16px; border-radius: 8px; background: var(--color-bg);';

  let adviceContentHTML = `
    <h3 class="section-title" style="margin-bottom: 8px; border-bottom: 1px solid var(--color-border); padding-bottom: 6px;">2. คำแนะนำในการลดหย่อนภาษี</h3>
  `;

  if (advice4 && advice4.adviceList && advice4.adviceList.length > 0) {
    adviceContentHTML += `<p style="margin-bottom: 12px; font-size: 0.9em;">${advice4.message || 'สิทธิลดหย่อนคงเหลือที่แนะนำเพิ่มเติม:'}</p>`;
    adviceContentHTML += `<div class="advice-list" style="display: flex; flex-direction: column; gap: 12px;">`;
    
    advice4.adviceList.forEach(item => {
      const scenarioText = item.scenarios && item.scenarios.length > 0 
        ? item.scenarios.map(s => `+${formatBaht(s.amount)} บาท → ประหยัดภาษีได้ ${formatBaht(s.taxSaved)} บาท`).join(' | ')
        : '';
      
      adviceContentHTML += `
        <div class="advice-item" style="border: 1px solid var(--color-border); padding: 10px; border-radius: 6px; background: var(--color-subtle-bg);">
          <div style="font-weight: bold; margin-bottom: 4px;">${item.label}</div>
          <div style="font-size: 0.85em; color: var(--color-text-muted); margin-bottom: 4px;">เพดานคงเหลือที่ใช้ได้: ${formatBaht(item.remainingCap)} บาท</div>
          ${scenarioText ? `<div style="font-size: 0.85em; font-weight: 500;">${scenarioText}</div>` : ''}
          ${item.conditionNote ? `<div style="font-size: 0.8em; font-style: italic; margin-top: 4px; color: var(--color-text-muted);">${item.conditionNote}</div>` : ''}
        </div>
      `;
    });
    
    adviceContentHTML += `</div>`;
  } else {
    adviceContentHTML += `
      <p style="font-size: 0.9em; color: var(--color-text-muted);">
        ${advice4 && advice4.message ? advice4.message : 'คุณใช้สิทธิลดหย่อนภาษีคุ้มค่าและครบถ้วนแล้ว หรือไม่มีภาระภาษีต้องจ่ายเพิ่มเติม'}
      </p>
    `;
  }

  adviceSection.innerHTML = adviceContentHTML;
  wrapper.appendChild(adviceSection);

  // ข้อความท้ายหน้า
  const footerNotice = document.createElement('div');
  footerNotice.className = 'result-disclaimer';
  footerNotice.style.cssText = 'margin-top: 16px; font-size: 0.85em; text-align: center; color: var(--color-text-muted);';
  footerNotice.textContent =
    'ผลลัพธ์นี้เป็นการประมาณการ ไม่ใช่การยื่นภาษีอย่างเป็นทางการ และไม่ใช่คำแนะนำทางกฎหมายหรือการเงิน';
  wrapper.appendChild(footerNotice);

  // ปุ่มด้านล่าง
  const actionsRow = document.createElement('div');
  actionsRow.className = 'result-actions';
  actionsRow.style.cssText = 'margin-top: 20px; display: flex; gap: 12px; justify-content: center;';

  const btnEdit = document.createElement('button');
  btnEdit.type = 'button';
  btnEdit.className = 'btn-action btn-action-secondary';
  btnEdit.textContent = 'แก้ไขข้อมูล';
  if (onEdit) {
    btnEdit.onclick = onEdit;
  }

  const btnRecalc = document.createElement('button');
  btnRecalc.type = 'button';
  btnRecalc.className = 'btn-action btn-action-primary';
  btnRecalc.textContent = 'คำนวณใหม่';
  if (onRecalculate) {
    btnRecalc.onclick = onRecalculate;
  }

  actionsRow.appendChild(btnEdit);
  actionsRow.appendChild(btnRecalc);
  wrapper.appendChild(actionsRow);

  // ถ้ามี container ระบุ ให้ใส่ใน container
  if (container) {
    const targetEl = typeof container === 'string' ? document.querySelector(container) : container;
    if (targetEl) {
      targetEl.innerHTML = '';
      targetEl.appendChild(wrapper);
    }
  }

  return wrapper;
}
