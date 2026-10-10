import { toCalcInput } from './toCalcInput.js';
import { calculateTax } from '../calc/calculateTax.js';
import { renderResult } from '../results/render.js';

export const INITIAL_FORM_STATE = {
  taxYear: 2569,
  maritalStatus: 'single',
  spouseHasNoIncome: false,
  childrenTotal: 0,
  childrenBorn2018OrLater: 0,
  parentsSupported: 0,
  disabledDependents: 0,

  salaryMode: 'yearly',
  salaryYearly: 0,
  salaryMonthly: Array(12).fill(0),
  bonus: 0,
  otherSalaryIncome: 0,
  exemptIncome: 0,

  socialSecurity: 0,
  providentFund: 0,
  otherFunds: 0,

  deductions: {
    lifeInsurance: 0,
    healthInsurance: 0,
    parentHealthInsurance: 0,
    rmf: 0,
    donationEducation: 0,
    donationGeneral: 0,
    homeLoanInterest: 0,
    customDeductions: [],
  },

  withheldRows: [{ id: '1', source: 'นายจ้างหลัก', amount: 0 }],
};

export const STEP_NAMES = [
  'ข้อมูลทั่วไป',
  'เงินเดือนและโบนัส',
  'เงินสมทบและกองทุน',
  'ค่าลดหย่อน',
  'ภาษีที่หักไว้แล้ว',
  'สรุปก่อนคำนวณ',
];

export class TaxWizard {
  constructor(container, initialState = null) {
    this.container = typeof container === 'string' ? document.querySelector(container) : container;
    this.state = initialState ? JSON.parse(JSON.stringify(initialState)) : JSON.parse(JSON.stringify(INITIAL_FORM_STATE));
    this.currentStep = 1;
    this.totalSteps = 6;
    this.calculationResult = null;
    this.isShowingResults = false;
    this.validationErrors = [];
    this.warnings = [];
    this.inputWarnings = [];
    this.init();
  }

  init() {
    if (!this.container) return;
    this.render();
  }

  setState(newState) {
    this.state = { ...this.state, ...newState };
    this.render();
  }

  saveToLocalStorage() {
    try {
      localStorage.setItem('pnd91_form_state', JSON.stringify(this.state));
      alert('บันทึกข้อมูลไว้ในเครื่องเรียบร้อยแล้ว');
    } catch (e) {
      alert('ไม่สามารถบันทึกข้อมูลได้: ' + e.message);
    }
  }

  loadFromLocalStorage() {
    try {
      const saved = localStorage.getItem('pnd91_form_state');
      if (saved) {
        this.state = JSON.parse(saved);
        this.isShowingResults = false;
        this.render();
        alert('โหลดข้อมูลที่บันทึกไว้สำเร็จ');
      } else {
        alert('ไม่พบข้อมูลที่บันทึกไว้ก่อนหน้า');
      }
    } catch (e) {
      alert('เกิดข้อผิดพลาดในการโหลดข้อมูล: ' + e.message);
    }
  }

  goToStep(step) {
    if (step >= 1 && step <= this.totalSteps) {
      this.currentStep = step;
      this.isShowingResults = false;
      this.render();
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }

  nextStep() {
    if (this.currentStep < this.totalSteps) {
      this.currentStep++;
      this.render();
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }

  prevStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.render();
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    }
  }

  showForm() {
    this.isShowingResults = false;
    this.render();
    if (typeof window !== 'undefined') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  calculate() {
    // 1. เรียก toCalcInput(formState)
    const { input, invalidFields, warnings } = toCalcInput(this.state);

    // 2. ถ้า invalidFields ไม่ว่าง ไม่เรียก calculateTax และแสดงรายการช่องที่ต้องแก้ไข
    if (invalidFields && invalidFields.length > 0) {
      this.validationErrors = invalidFields.map((f) => `กรุณาตรวจสอบและแก้ไขช่อง: ${f}`);
      this.warnings = warnings;
      this.inputWarnings = warnings;
      this.calculationResult = null;
      this.isShowingResults = false;
      this.render();
      return;
    }

    // 3. ถ้าผ่าน เรียก calculateTax(input) และส่งผลลัพธ์ไปยัง renderResult
    try {
      this.validationErrors = [];
      this.warnings = warnings;
      this.inputWarnings = warnings;

      // เรียกตัวคำนวณ
      const result = calculateTax(input);
      this.calculationResult = result;
      this.isShowingResults = true;

      this.render();
      if (typeof window !== 'undefined') {
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    } catch (err) {
      this.validationErrors = [err.message || 'เกิดข้อผิดพลาดในการคำนวณภาษี'];
      this.calculationResult = null;
      this.isShowingResults = false;
      this.render();
    }
  }

  render() {
    if (!this.container) return;

    // หากอยู่ระหว่างแสดงผลลัพธ์การคำนวณ ให้เรียก renderResult
    if (this.isShowingResults && this.calculationResult) {
      this.container.innerHTML = '';
      renderResult(this.calculationResult, {
        advice4: null,
        advice5: null,
        onEdit: () => this.showForm(),
        onRecalculate: () => this.calculate(),
        container: this.container,
        inputWarnings: this.inputWarnings,
      });
      return;
    }

    this.container.innerHTML = `
      <div class="wizard-wrapper">
        <!-- Header & Progress -->
        <div class="wizard-header">
          <div class="header-title-row">
            <h2 class="wizard-title">แบบคำนวณภาษีเงินได้บุคคลธรรมดา (ภ.ง.ด.91)</h2>
            <div class="storage-buttons">
              <button type="button" class="btn-subtle btn-save">💾 บันทึกไว้ในเครื่อง</button>
              <button type="button" class="btn-subtle btn-load">📂 โหลดข้อมูล</button>
            </div>
          </div>

          <div class="progress-bar-container">
            <div class="progress-info">
              <span>ขั้นที่ ${this.currentStep} จาก ${this.totalSteps}: <strong>${STEP_NAMES[this.currentStep - 1]}</strong></span>
              <span>${Math.round((this.currentStep / this.totalSteps) * 100)}%</span>
            </div>
            <div class="progress-track">
              <div class="progress-fill" style="width: ${(this.currentStep / this.totalSteps) * 100}%"></div>
            </div>
          </div>
        </div>

        <!-- Step Body -->
        <div class="wizard-body">
          ${this.renderStepContent()}
        </div>

        <!-- Validation & Warning Messages -->
        ${
          this.validationErrors.length > 0
            ? `<div class="alert alert-error">
                <strong>ข้อผิดพลาด:</strong>
                <ul>${this.validationErrors.map((e) => `<li>${e}</li>`).join('')}</ul>
              </div>`
            : ''
        }
        ${
          this.warnings.length > 0
            ? `<div class="alert alert-warning">
                <strong>คำแนะนำ / แจ้งเตือน:</strong>
                <ul>${this.warnings.map((w) => `<li>${w}</li>`).join('')}</ul>
              </div>`
            : ''
        }

        <!-- Wizard Navigation -->
        <div class="wizard-footer">
          ${
            this.currentStep > 1
              ? `<button type="button" class="btn btn-secondary btn-prev">← ย้อนกลับ</button>`
              : `<div></div>`
          }
          ${
            this.currentStep < this.totalSteps
              ? `<button type="button" class="btn btn-primary btn-next">ถัดไป →</button>`
              : `<button type="button" class="btn btn-primary btn-calc">คำนวณภาษี</button>`
          }
        </div>

        <div class="wizard-disclaimer">
          ผลลัพธ์เป็นการประมาณการ ไม่ใช่การยื่นภาษีอย่างเป็นทางการ
        </div>
      </div>
    `;

    this.bindEvents();
  }

  renderStepContent() {
    switch (this.currentStep) {
      case 1:
        return this.renderStep1();
      case 2:
        return this.renderStep2();
      case 3:
        return this.renderStep3();
      case 4:
        return this.renderStep4();
      case 5:
        return this.renderStep5();
      case 6:
        return this.renderStep6();
      default:
        return '';
    }
  }

  renderStep1() {
    return `
      <div class="step-content">
        <h3 class="step-heading">1. ข้อมูลทั่วไป</h3>
        <p class="step-desc">มาเริ่มกันเลย กรุณาระบุข้อมูลสถานะพื้นฐานของท่านประจำปีภาษี</p>

        <div class="form-group">
          <label>ปีภาษี (พ.ศ.)</label>
          <input type="number" id="inp-taxYear" value="${this.state.taxYear}" class="form-control" />
        </div>

        <div class="form-group">
          <label>สถานะการสมรส</label>
          <select id="inp-maritalStatus" class="form-control">
            <option value="single" ${this.state.maritalStatus === 'single' ? 'selected' : ''}>โสด / หย่า / โสดตามกฎหมาย</option>
            <option value="married" ${this.state.maritalStatus === 'married' ? 'selected' : ''}>สมรส</option>
          </select>
        </div>

        ${
          this.state.maritalStatus === 'married'
            ? `<div class="form-group checkbox-group">
                <label>
                  <input type="checkbox" id="inp-spouseHasNoIncome" ${this.state.spouseHasNoIncome ? 'checked' : ''} />
                  คู่สมรสไม่มีรายได้ (ใช้สิทธิหักลดหย่อนคู่สมรส 60,000 บาท)
                </label>
              </div>`
            : ''
        }

        <div class="form-row">
          <div class="form-group col">
            <label>จำนวนบุตรทั้งหมด (คน)</label>
            <input type="number" min="0" id="inp-childrenTotal" value="${this.state.childrenTotal}" class="form-control" />
          </div>
          <div class="form-group col">
            <label>ในจำนวนนี้ เกิดปี 2561 ขึ้นไป (คน)</label>
            <input type="number" min="0" id="inp-childrenBorn2018OrLater" value="${this.state.childrenBorn2018OrLater}" class="form-control" />
          </div>
        </div>

        <div class="form-row">
          <div class="form-group col">
            <label>อุปการะบิดามารดา (ท่าน)</label>
            <input type="number" min="0" max="4" id="inp-parentsSupported" value="${this.state.parentsSupported}" class="form-control" />
            <small class="help-text">หักลดหย่อนท่านละ 30,000 บาท (สูงสุด 4 ท่าน)</small>
          </div>
          <div class="form-group col">
            <label>อุปการะผู้พิการ / ทุพพลภาพ (คน)</label>
            <input type="number" min="0" id="inp-disabledDependents" value="${this.state.disabledDependents}" class="form-control" />
            <small class="help-text">หักลดหย่อนคนละ 60,000 บาท</small>
          </div>
        </div>
      </div>
    `;
  }

  renderStep2() {
    const isMonthly = this.state.salaryMode === 'monthly';
    return `
      <div class="step-content">
        <h3 class="step-heading">2. เงินเดือนและโบนัส</h3>
        <p class="step-desc">ระบุเงินได้ประเภท 40(1) เช่น เงินเดือน ค่าจ้าง โบนัส และเงินได้ยกเว้น</p>

        <div class="form-group">
          <label>รูปแบบการกรอกเงินเดือน</label>
          <div class="radio-toggle">
            <label class="radio-label">
              <input type="radio" name="salaryMode" value="yearly" ${!isMonthly ? 'checked' : ''} /> ยอดรวมทั้งปี
            </label>
            <label class="radio-label">
              <input type="radio" name="salaryMode" value="monthly" ${isMonthly ? 'checked' : ''} /> กรอกรายเดือน 12 ช่อง
            </label>
          </div>
        </div>

        ${
          !isMonthly
            ? `<div class="form-group">
                <label>เงินเดือนรวมทั้งปี (บาท)</label>
                <input type="text" id="inp-salaryYearly" value="${this.formatNum(this.state.salaryYearly)}" class="form-control num-input" />
              </div>`
            : `<div class="monthly-grid">
                ${this.state.salaryMonthly
                  .map(
                    (val, idx) => `
                  <div class="monthly-item">
                    <label>เดือน ${idx + 1}</label>
                    <input type="text" data-month-idx="${idx}" value="${this.formatNum(val)}" class="form-control num-input inp-monthly" />
                  </div>
                `
                  )
                  .join('')}
              </div>
              <div class="monthly-sum">
                เงินเดือนรวม 12 เดือน: <strong>${this.formatNum(this.state.salaryMonthly.reduce((a, b) => Number(a) + Number(b), 0))} บาท</strong>
              </div>`
        }

        <div class="form-row">
          <div class="form-group col">
            <label>โบนัส / เงินพิเศษ (บาท)</label>
            <input type="text" id="inp-bonus" value="${this.formatNum(this.state.bonus)}" class="form-control num-input" />
          </div>
          <div class="form-group col">
            <label>เงินได้อื่นที่เป็นเงินเดือน (บาท)</label>
            <input type="text" id="inp-otherSalaryIncome" value="${this.formatNum(this.state.otherSalaryIncome)}" class="form-control num-input" />
          </div>
        </div>

        <div class="form-group">
          <label>เงินได้ที่ได้รับยกเว้นภาษี (บาท)</label>
          <input type="text" id="inp-exemptIncome" value="${this.formatNum(this.state.exemptIncome)}" class="form-control num-input" />
          <small class="help-text">เงินได้ที่ไม่ต้องนำมาคำนวณภาษีตามกฎหมาย</small>
        </div>
      </div>
    `;
  }

  renderStep3() {
    return `
      <div class="step-content">
        <h3 class="step-heading">3. เงินสมทบและกองทุน</h3>
        <p class="step-desc">ระบุเงินสะสมและเงินสมทบที่หักจากเงินเดือนของท่าน</p>

        <div class="form-group">
          <label>เงินสมทบประกันสังคมทั้งปี (บาท)</label>
          <div class="input-with-cap">
            <input type="text" id="inp-socialSecurity" value="${this.formatNum(this.state.socialSecurity)}" class="form-control num-input" />
            <span class="cap-badge">เพดาน 9,000 บาท/ปี (750 บ./เดือน)</span>
          </div>
        </div>

        <div class="form-group">
          <label>เงินสะสมกองทุนสำรองเลี้ยงชีพ PVD (บาท)</label>
          <div class="input-with-cap">
            <input type="text" id="inp-providentFund" value="${this.formatNum(this.state.providentFund)}" class="form-control num-input" />
            <span class="cap-badge">ไม่เกิน 15% ของเงินได้ (และสูงสุด 500,000 บาท)</span>
          </div>
        </div>

        <div class="form-group">
          <label>กองทุน กบข. / กองทุนอื่นที่หักจากเงินเดือน (บาท)</label>
          <div class="input-with-cap">
            <input type="text" id="inp-otherFunds" value="${this.formatNum(this.state.otherFunds)}" class="form-control num-input" />
            <span class="cap-badge">รวมกลุ่มเกษียณไม่เกิน 500,000 บาท</span>
          </div>
        </div>
      </div>
    `;
  }

  renderStep4() {
    const d = this.state.deductions;
    return `
      <div class="step-content">
        <h3 class="step-heading">4. ค่าลดหย่อน</h3>
        <p class="step-desc">เลือกกรอกค่าลดหย่อนประเภทต่างๆ หรือกดเลือกปุ่มจำนวนที่พบบ่อย</p>

        <div class="deduction-card">
          <label class="deduction-title">เบี้ยประกันชีวิต (บาท)</label>
          <div class="input-with-cap">
            <input type="text" id="inp-lifeInsurance" value="${this.formatNum(d.lifeInsurance)}" class="form-control num-input" />
            <span class="cap-badge">เพดานรวมประกันชีวิต+สุขภาพ 100,000 บาท</span>
          </div>
          <div class="preset-buttons" data-target="lifeInsurance">
            <button type="button" class="btn-preset" data-val="10000">10,000</button>
            <button type="button" class="btn-preset" data-val="30000">30,000</button>
            <button type="button" class="btn-preset" data-val="50000">50,000</button>
            <button type="button" class="btn-preset" data-val="100000">100,000 (เต็ม)</button>
          </div>
        </div>

        <div class="deduction-card">
          <label class="deduction-title">เบี้ยประกันสุขภาพตนเอง (บาท)</label>
          <div class="input-with-cap">
            <input type="text" id="inp-healthInsurance" value="${this.formatNum(d.healthInsurance)}" class="form-control num-input" />
            <span class="cap-badge">เพดาน 25,000 บาท</span>
          </div>
          <div class="preset-buttons" data-target="healthInsurance">
            <button type="button" class="btn-preset" data-val="10000">10,000</button>
            <button type="button" class="btn-preset" data-val="15000">15,000</button>
            <button type="button" class="btn-preset" data-val="25000">25,000 (เต็ม)</button>
          </div>
        </div>

        <div class="deduction-card">
          <label class="deduction-title">เบี้ยประกันสุขภาพบิดามารดา (บาท)</label>
          <div class="input-with-cap">
            <input type="text" id="inp-parentHealthInsurance" value="${this.formatNum(d.parentHealthInsurance)}" class="form-control num-input" />
            <span class="cap-badge">เพดาน 15,000 บาท</span>
          </div>
        </div>

        <div class="deduction-card">
          <label class="deduction-title">ซื้อกองทุน RMF (บาท)</label>
          <div class="input-with-cap">
            <input type="text" id="inp-rmf" value="${this.formatNum(d.rmf)}" class="form-control num-input" />
            <span class="cap-badge">ไม่เกิน 30% ของเงินได้ (สูงสุด 500,000 บาท)</span>
          </div>
        </div>

        <div class="deduction-card">
          <label class="deduction-title">ดอกเบี้ยเงินกู้ยืมเพื่อซื้อบ้าน (บาท)</label>
          <div class="input-with-cap">
            <input type="text" id="inp-homeLoanInterest" value="${this.formatNum(d.homeLoanInterest)}" class="form-control num-input" />
            <span class="cap-badge">เพดาน 100,000 บาท</span>
          </div>
        </div>

        <div class="deduction-card">
          <label class="deduction-title">เงินบริจาคการศึกษา / กีฬา (บาท)</label>
          <div class="input-with-cap">
            <input type="text" id="inp-donationEducation" value="${this.formatNum(d.donationEducation)}" class="form-control num-input" />
            <span class="cap-badge">ได้สิทธิลดหย่อน 2 เท่า (ไม่เกิน 10% เงินได้สุทธิ)</span>
          </div>
        </div>

        <div class="deduction-card">
          <label class="deduction-title">เงินบริจาคทั่วไป (บาท)</label>
          <div class="input-with-cap">
            <input type="text" id="inp-donationGeneral" value="${this.formatNum(d.donationGeneral)}" class="form-control num-input" />
            <span class="cap-badge">ไม่เกิน 10% ของเงินได้สุทธิ</span>
          </div>
        </div>

        <!-- Custom Deductions -->
        <div class="deduction-card">
          <label class="deduction-title">รายการลดหย่อนกำหนดเอง (Custom Deductions)</label>
          <div class="custom-list">
            ${d.customDeductions
              .map(
                (item, idx) => `
              <div class="custom-row" data-custom-idx="${idx}">
                <input type="text" placeholder="ชื่อรายการลดหย่อน" value="${item.name || ''}" class="form-control inp-custom-name" />
                <input type="text" placeholder="จำนวนเงิน (บาท)" value="${this.formatNum(item.amount)}" class="form-control num-input inp-custom-amount" />
                <button type="button" class="btn-icon btn-remove-custom" data-idx="${idx}">✕</button>
              </div>
            `
              )
              .join('')}
          </div>
          <button type="button" class="btn btn-secondary btn-add-custom">+ เพิ่มรายการลดหย่อน</button>
        </div>
      </div>
    `;
  }

  renderStep5() {
    return `
      <div class="step-content">
        <h3 class="step-heading">5. ภาษีที่หักไว้แล้ว</h3>
        <p class="step-desc">ระบุภาษีเงินได้ที่บริษัท/นายจ้างหัก ณ ที่จ่ายไว้แล้วตลอดปี</p>

        <div class="withheld-list">
          ${this.state.withheldRows
            .map(
              (row, idx) => `
            <div class="withheld-row" data-withheld-idx="${idx}">
              <div class="form-group col-name">
                <label>ชื่อผู้จ่ายเงิน / นายจ้าง #${idx + 1}</label>
                <input type="text" value="${row.source || ''}" placeholder="เช่น บริษัท เออบาน่า จำกัด" class="form-control inp-withheld-source" />
              </div>
              <div class="form-group col-amount">
                <label>จำนวนภาษีที่หักไว้ (บาท)</label>
                <input type="text" value="${this.formatNum(row.amount)}" class="form-control num-input inp-withheld-amount" />
              </div>
              ${
                this.state.withheldRows.length > 1
                  ? `<button type="button" class="btn-icon btn-remove-withheld" data-idx="${idx}">✕</button>`
                  : ''
              }
            </div>
          `
            )
            .join('')}
        </div>

        <button type="button" class="btn btn-secondary btn-add-withheld">+ เพิ่มรายการหัก ณ ที่จ่าย</button>

        <div class="withheld-total">
          รวมภาษีที่หักไว้แล้วทั้งปี: <strong>${this.formatNum(this.state.withheldRows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0))} บาท</strong>
        </div>
      </div>
    `;
  }

  renderStep6() {
    const s = this.state;
    const { input } = toCalcInput(s);

    return `
      <div class="step-content">
        <h3 class="step-heading">6. สรุปก่อนคำนวณ</h3>
        <p class="step-desc">ตรวจสอบข้อมูลทั้งหมดก่อนทำการคำนวณภาษี</p>

        <div class="summary-section">
          <div class="summary-group">
            <div class="summary-group-title">
              <span>1. ข้อมูลทั่วไป</span>
              <button type="button" class="btn-edit-step" data-target-step="1">แก้ไข</button>
            </div>
            <div class="summary-item"><span>ปีภาษี:</span> <strong>พ.ศ. ${input.taxYear}</strong></div>
            <div class="summary-item"><span>สถานะการสมรส:</span> <strong>${input.maritalStatus === 'married' ? 'สมรส' : 'โสด'}</strong></div>
            ${input.maritalStatus === 'married' ? `<div class="summary-item"><span>คู่สมรสไม่มีรายได้:</span> <strong>${input.spouseHasNoIncome ? 'ใช่' : 'ไม่ใช่'}</strong></div>` : ''}
            <div class="summary-item"><span>บุตรทั้งหมด:</span> <strong>${input.children.total} คน (เกิด 2561+ : ${input.children.born2018OrLater} คน)</strong></div>
            <div class="summary-item"><span>อุปการะบิดามารดา:</span> <strong>${input.parentsSupported} ท่าน</strong></div>
            <div class="summary-item"><span>อุปการะผู้พิการ:</span> <strong>${input.disabledDependents} คน</strong></div>
          </div>

          <div class="summary-group">
            <div class="summary-group-title">
              <span>2. เงินเดือนและรายได้</span>
              <button type="button" class="btn-edit-step" data-target-step="2">แก้ไข</button>
            </div>
            <div class="summary-item"><span>เงินเดือนรวมทั้งปี:</span> <strong>${this.formatNum(input.salary)} บาท</strong></div>
            <div class="summary-item"><span>โบนัส:</span> <strong>${this.formatNum(input.bonus)} บาท</strong></div>
            <div class="summary-item"><span>เงินได้อื่น:</span> <strong>${this.formatNum(input.otherSalaryIncome)} บาท</strong></div>
            <div class="summary-item"><span>เงินได้ยกเว้น:</span> <strong>${this.formatNum(input.exemptIncome)} บาท</strong></div>
          </div>

          <div class="summary-group">
            <div class="summary-group-title">
              <span>3. เงินสมทบและกองทุน</span>
              <button type="button" class="btn-edit-step" data-target-step="3">แก้ไข</button>
            </div>
            <div class="summary-item"><span>ประกันสังคม:</span> <strong>${this.formatNum(input.socialSecurity)} บาท</strong></div>
            <div class="summary-item"><span>กองทุน PVD:</span> <strong>${this.formatNum(input.providentFund)} บาท</strong></div>
            <div class="summary-item"><span>กองทุน กบข. / อื่นๆ:</span> <strong>${this.formatNum(input.otherFunds)} บาท</strong></div>
          </div>

          <div class="summary-group">
            <div class="summary-group-title">
              <span>4. ค่าลดหย่อน</span>
              <button type="button" class="btn-edit-step" data-target-step="4">แก้ไข</button>
            </div>
            <div class="summary-item"><span>ประกันชีวิต:</span> <strong>${this.formatNum(input.deductions.lifeInsurance)} บาท</strong></div>
            <div class="summary-item"><span>ประกันสุขภาพตนเอง:</span> <strong>${this.formatNum(input.deductions.healthInsurance)} บาท</strong></div>
            <div class="summary-item"><span>ประกันสุขภาพบิดามารดา:</span> <strong>${this.formatNum(input.deductions.parentHealthInsurance)} บาท</strong></div>
            <div class="summary-item"><span>กองทุน RMF:</span> <strong>${this.formatNum(input.deductions.rmf)} บาท</strong></div>
            <div class="summary-item"><span>ดอกเบี้ยกู้บ้าน:</span> <strong>${this.formatNum(input.deductions.homeLoanInterest)} บาท</strong></div>
            <div class="summary-item"><span>บริจาคการศึกษา:</span> <strong>${this.formatNum(input.deductions.donationEducation)} บาท</strong></div>
            <div class="summary-item"><span>บริจาคทั่วไป:</span> <strong>${this.formatNum(input.deductions.donationGeneral)} บาท</strong></div>
          </div>

          <div class="summary-group">
            <div class="summary-group-title">
              <span>5. ภาษีที่หักไว้แล้ว</span>
              <button type="button" class="btn-edit-step" data-target-step="5">แก้ไข</button>
            </div>
            <div class="summary-item"><span>รวมภาษีหัก ณ ที่จ่าย:</span> <strong>${this.formatNum(input.taxWithheld)} บาท</strong></div>
          </div>
        </div>
      </div>
    `;
  }

  bindEvents() {
    if (!this.container) return;

    // Local Storage buttons
    const btnSave = this.container.querySelector('.btn-save');
    if (btnSave) btnSave.onclick = () => this.saveToLocalStorage();

    const btnLoad = this.container.querySelector('.btn-load');
    if (btnLoad) btnLoad.onclick = () => this.loadFromLocalStorage();

    // Footer buttons
    const btnPrev = this.container.querySelector('.btn-prev');
    if (btnPrev) btnPrev.onclick = () => this.prevStep();

    const btnNext = this.container.querySelector('.btn-next');
    if (btnNext) btnNext.onclick = () => this.nextStep();

    const btnCalc = this.container.querySelector('.btn-calc');
    if (btnCalc) btnCalc.onclick = () => this.calculate();

    // Edit step buttons
    this.container.querySelectorAll('.btn-edit-step').forEach((btn) => {
      btn.onclick = () => {
        const targetStep = parseInt(btn.getAttribute('data-target-step'), 10);
        this.goToStep(targetStep);
      };
    });

    // Step 1 inputs
    const inpTaxYear = this.container.querySelector('#inp-taxYear');
    if (inpTaxYear) inpTaxYear.onchange = (e) => (this.state.taxYear = parseInt(e.target.value, 10) || 2569);

    const inpMarital = this.container.querySelector('#inp-maritalStatus');
    if (inpMarital)
      inpMarital.onchange = (e) => {
        this.state.maritalStatus = e.target.value;
        if (e.target.value === 'single') this.state.spouseHasNoIncome = false;
        this.render();
      };

    const inpSpouse = this.container.querySelector('#inp-spouseHasNoIncome');
    if (inpSpouse) inpSpouse.onchange = (e) => (this.state.spouseHasNoIncome = e.target.checked);

    const inpChildTotal = this.container.querySelector('#inp-childrenTotal');
    if (inpChildTotal) inpChildTotal.onchange = (e) => (this.state.childrenTotal = parseInt(e.target.value, 10) || 0);

    const inpChild2018 = this.container.querySelector('#inp-childrenBorn2018OrLater');
    if (inpChild2018)
      inpChild2018.onchange = (e) => (this.state.childrenBorn2018OrLater = parseInt(e.target.value, 10) || 0);

    const inpParents = this.container.querySelector('#inp-parentsSupported');
    if (inpParents) inpParents.onchange = (e) => (this.state.parentsSupported = parseInt(e.target.value, 10) || 0);

    const inpDisabled = this.container.querySelector('#inp-disabledDependents');
    if (inpDisabled) inpDisabled.onchange = (e) => (this.state.disabledDependents = parseInt(e.target.value, 10) || 0);

    // Step 2 inputs
    this.container.querySelectorAll('input[name="salaryMode"]').forEach((radio) => {
      radio.onchange = (e) => {
        this.state.salaryMode = e.target.value;
        this.render();
      };
    });

    const inpSalaryYearly = this.container.querySelector('#inp-salaryYearly');
    if (inpSalaryYearly) inpSalaryYearly.onchange = (e) => (this.state.salaryYearly = this.parseRawNum(e.target.value));

    this.container.querySelectorAll('.inp-monthly').forEach((inp) => {
      inp.onchange = (e) => {
        const idx = parseInt(inp.getAttribute('data-month-idx'), 10);
        this.state.salaryMonthly[idx] = this.parseRawNum(e.target.value);
        this.render();
      };
    });

    const inpBonus = this.container.querySelector('#inp-bonus');
    if (inpBonus) inpBonus.onchange = (e) => (this.state.bonus = this.parseRawNum(e.target.value));

    const inpOtherSal = this.container.querySelector('#inp-otherSalaryIncome');
    if (inpOtherSal) inpOtherSal.onchange = (e) => (this.state.otherSalaryIncome = this.parseRawNum(e.target.value));

    const inpExempt = this.container.querySelector('#inp-exemptIncome');
    if (inpExempt) inpExempt.onchange = (e) => (this.state.exemptIncome = this.parseRawNum(e.target.value));

    // Step 3 inputs
    const inpSS = this.container.querySelector('#inp-socialSecurity');
    if (inpSS) inpSS.onchange = (e) => (this.state.socialSecurity = this.parseRawNum(e.target.value));

    const inpPVD = this.container.querySelector('#inp-providentFund');
    if (inpPVD) inpPVD.onchange = (e) => (this.state.providentFund = this.parseRawNum(e.target.value));

    const inpOtherFunds = this.container.querySelector('#inp-otherFunds');
    if (inpOtherFunds) inpOtherFunds.onchange = (e) => (this.state.otherFunds = this.parseRawNum(e.target.value));

    // Step 4 inputs
    const dFields = [
      'lifeInsurance',
      'healthInsurance',
      'parentHealthInsurance',
      'rmf',
      'homeLoanInterest',
      'donationEducation',
      'donationGeneral',
    ];
    dFields.forEach((field) => {
      const inp = this.container.querySelector(`#inp-${field}`);
      if (inp) inp.onchange = (e) => (this.state.deductions[field] = this.parseRawNum(e.target.value));
    });

    // Deduction Presets
    this.container.querySelectorAll('.btn-preset').forEach((btn) => {
      btn.onclick = () => {
        const target = btn.parentElement.getAttribute('data-target');
        const val = parseInt(btn.getAttribute('data-val'), 10);
        this.state.deductions[target] = val;
        this.render();
      };
    });

    // Custom deductions add/remove
    const btnAddCustom = this.container.querySelector('.btn-add-custom');
    if (btnAddCustom)
      btnAddCustom.onclick = () => {
        this.state.deductions.customDeductions.push({ name: '', amount: 0 });
        this.render();
      };

    this.container.querySelectorAll('.btn-remove-custom').forEach((btn) => {
      btn.onclick = () => {
        const idx = parseInt(btn.getAttribute('data-idx'), 10);
        this.state.deductions.customDeductions.splice(idx, 1);
        this.render();
      };
    });

    this.container.querySelectorAll('.inp-custom-name').forEach((inp) => {
      inp.onchange = (e) => {
        const idx = parseInt(inp.closest('.custom-row').getAttribute('data-custom-idx'), 10);
        this.state.deductions.customDeductions[idx].name = e.target.value;
      };
    });

    this.container.querySelectorAll('.inp-custom-amount').forEach((inp) => {
      inp.onchange = (e) => {
        const idx = parseInt(inp.closest('.custom-row').getAttribute('data-custom-idx'), 10);
        this.state.deductions.customDeductions[idx].amount = this.parseRawNum(e.target.value);
      };
    });

    // Step 5 inputs
    const btnAddWithheld = this.container.querySelector('.btn-add-withheld');
    if (btnAddWithheld)
      btnAddWithheld.onclick = () => {
        this.state.withheldRows.push({
          id: String(Date.now()),
          source: '',
          amount: 0,
        });
        this.render();
      };

    this.container.querySelectorAll('.btn-remove-withheld').forEach((btn) => {
      btn.onclick = () => {
        const idx = parseInt(btn.getAttribute('data-idx'), 10);
        this.state.withheldRows.splice(idx, 1);
        this.render();
      };
    });

    this.container.querySelectorAll('.inp-withheld-source').forEach((inp) => {
      inp.onchange = (e) => {
        const idx = parseInt(inp.closest('.withheld-row').getAttribute('data-withheld-idx'), 10);
        this.state.withheldRows[idx].source = e.target.value;
      };
    });

    this.container.querySelectorAll('.inp-withheld-amount').forEach((inp) => {
      inp.onchange = (e) => {
        const idx = parseInt(inp.closest('.withheld-row').getAttribute('data-withheld-idx'), 10);
        this.state.withheldRows[idx].amount = this.parseRawNum(e.target.value);
        this.render();
      };
    });
  }

  formatNum(val) {
    if (val === undefined || val === null || isNaN(val)) return '0';
    return Number(val).toLocaleString('th-TH');
  }

  parseRawNum(val) {
    if (typeof val === 'number') return val;
    if (typeof val !== 'string') return 0;
    const cleaned = val.replace(/,/g, '').trim();
    const num = Number(cleaned);
    return isNaN(num) ? 0 : num;
  }
}
