const SUPABASE_URL = 'https://jckwvrzcjuggnfcbogrr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impja3d2cnpjanVnZ25mY2JvZ3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA2OTIwMTYsImV4cCI6MjA1NjI2ODAxNn0.p2a0om1X40AJVhldUdtaU-at0SSPz6hLbrAg-ELHcnY';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Step 1: Ask for calculator title
let calculator = {
  title: '',
  fields: []
};
let step = 1;

function renderStep1() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="create-calc-bg">
      <div class="glass-card step animate-fadeIn">
        <div class="progress-indicator">Step 1 of 3</div>
        <h1 class="glass-title">Create Your Score Calculator</h1>
        <form id="titleForm" autocomplete="off">
          <label for="calcTitle" class="glass-label flex items-center gap-2">Calculator Title
            <span class="info-tooltip" tabindex="0" aria-label="What is this?">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#e0e7ff"/><text x="12" y="16" text-anchor="middle" font-size="14" fill="#6366f1" font-family="Arial" font-weight="bold">i</text></svg>
              <span class="tooltip-text">This is the name of your calculator. Example: 'Exam Grader', 'GPA Calculator', etc.</span>
            </span>
          </label>
          <input type="text" id="calcTitle" name="calcTitle" required placeholder="e.g. Exam Grader" maxlength="32" class="glass-input"/>
          <button type="submit" id="nextBtn" class="glass-btn next-btn" disabled>Next</button>
        </form>
      </div>
      <div class="bg-illustration">
        <svg class="svg-bg-1" viewBox="0 0 300 300"><ellipse cx="150" cy="150" rx="120" ry="60" fill="#e0e7ff" opacity="0.35"/></svg>
        <svg class="svg-bg-2" viewBox="0 0 200 200"><rect x="40" y="40" width="120" height="120" rx="40" fill="#6366f1" opacity="0.10"/></svg>
        <svg class="svg-bg-3" viewBox="0 0 100 100"><polygon points="50,10 90,90 10,90" fill="#a5b4fc" opacity="0.13"/></svg>
      </div>
    </div>
  `;
  const titleInput = document.getElementById('calcTitle');
  const nextBtn = document.getElementById('nextBtn');
  titleInput.addEventListener('input', () => {
    nextBtn.disabled = !titleInput.value.trim();
    if (!nextBtn.disabled) {
      nextBtn.classList.add('btn-animate');
    } else {
      nextBtn.classList.remove('btn-animate');
    }
  });
  document.getElementById('titleForm').onsubmit = (e) => {
    e.preventDefault();
    calculator.title = titleInput.value.trim();
    if (calculator.title) {
      step = 2;
      renderStep2();
    }
  };
}

function renderStep2() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="create-calc-bg">
      <div class="glass-card step animate-fadeIn">
        <div class="progress-indicator">Step 2 of 3</div>
        <h1 class="glass-title">${calculator.title}</h1>
        <form id="fieldsForm" autocomplete="off">
          <table class="fields-table glass-table">
            <thead>
              <tr>
                <th>Field Name</th>
                <th>Options</th>
                <th></th>
              </tr>
            </thead>
            <tbody id="fieldsTableBody">
              ${calculator.fields.map((f, i) => `
                <tr>
                  <td style="vertical-align:top;width:160px;max-width:180px;">
                    <input type="text" value="${f.name}" data-idx="${i}" class="field-name-input glass-input" maxlength="24" required />
                  </td>
                  <td style="vertical-align:top;min-width:220px;max-width:260px;">
                    <div class="options-list" data-idx="${i}">
                      ${(f.options||[]).map((opt, oi) => `
                        <div class="option-row">
                          <input type="text" value="${opt.label}" data-idx="${i}" data-oidx="${oi}" class="option-label-input glass-input" placeholder="Label" maxlength="18" />
                          <input type="number" value="${opt.value}" data-idx="${i}" data-oidx="${oi}" class="option-value-input glass-input" placeholder="Score" />
                          <button type="button" class="remove-option-btn glass-btn glass-btn-sm" data-idx="${i}" data-oidx="${oi}">✕</button>
                        </div>
                      `).join('')}
                      <div class="option-row">
                        <input type="text" id="newOptionLabel${i}" placeholder="Label" maxlength="18" class="glass-input" />
                        <input type="number" id="newOptionValue${i}" placeholder="Score" class="glass-input" />
                        <button type="button" class="add-option-btn glass-btn glass-btn-sm" data-idx="${i}">Add</button>
                      </div>
                    </div>
                  </td>
                  <td style="vertical-align:top;width:60px;">
                    <button type="button" class="remove-field-btn glass-btn glass-btn-sm" data-idx="${i}">Remove</button>
                  </td>
                </tr>
              `).join('')}
              <tr>
                <td><input type="text" id="newFieldName" placeholder="e.g. Homework" maxlength="24" class="glass-input" /></td>
                <td colspan="2">
                  <div id="newOptionsList" style="display:block;"></div>
                  <div id="newOptionInputs" class="flex gap-2 items-center mt-2">
                    <input type="text" id="newOptionLabel" placeholder="Label" maxlength="18" class="glass-input" />
                    <input type="number" id="newOptionValue" placeholder="Score" class="glass-input" />
                    <button type="button" id="addNewOptionBtn" class="glass-btn glass-btn-sm">Add</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
          <button type="button" id="addFieldBtn" class="glass-btn" style="margin-top:10px;">Add Field</button>
          <button type="submit" class="glass-btn next-btn" style="margin-top:18px;${calculator.fields.length ? '' : 'display:none;'}">Next: Fill Values</button>
        </form>
      </div>
      <div class="bg-illustration">
        <svg class="svg-bg-1" viewBox="0 0 300 300"><ellipse cx="150" cy="150" rx="120" ry="60" fill="#e0e7ff" opacity="0.35"/></svg>
        <svg class="svg-bg-2" viewBox="0 0 200 200"><rect x="40" y="40" width="120" height="120" rx="40" fill="#6366f1" opacity="0.10"/></svg>
        <svg class="svg-bg-3" viewBox="0 0 100 100"><polygon points="50,10 90,90 10,90" fill="#a5b4fc" opacity="0.13"/></svg>
      </div>
    </div>
  `;

  // New field options state
  let newOptions = [];
  function renderNewOptions() {
    const list = document.getElementById('newOptionsList');
    if (!list) return;
    list.innerHTML = newOptions.map((opt, oi) => `
      <div class="option-row">
        <input type="text" value="${opt.label}" data-oidx="${oi}" class="new-option-label-input" maxlength="18" placeholder="Label" />
        <input type="number" value="${opt.value}" data-oidx="${oi}" class="new-option-value-input" placeholder="Score" />
        <button type="button" class="remove-new-option-btn" data-oidx="${oi}">✕</button>
      </div>
    `).join('');
  }

  // Add new option for new field
  document.getElementById('addNewOptionBtn').onclick = () => {
    const label = document.getElementById('newOptionLabel').value.trim();
    const value = parseFloat(document.getElementById('newOptionValue').value);
    if (!label || isNaN(value)) {
      alert('Enter label and score for the option.');
      return;
    }
    newOptions.push({ label, value });
    document.getElementById('newOptionLabel').value = '';
    document.getElementById('newOptionValue').value = '';
    renderNewOptions();
  };
  // Remove new option
  document.getElementById('newOptionsList').onclick = (e) => {
    if (e.target.classList.contains('remove-new-option-btn')) {
      const oidx = e.target.getAttribute('data-oidx');
      newOptions.splice(oidx, 1);
      renderNewOptions();
    }
  };
  // Edit new option
  document.getElementById('newOptionsList').oninput = (e) => {
    if (e.target.classList.contains('new-option-label-input')) {
      const oidx = e.target.getAttribute('data-oidx');
      newOptions[oidx].label = e.target.value;
    } else if (e.target.classList.contains('new-option-value-input')) {
      const oidx = e.target.getAttribute('data-oidx');
      newOptions[oidx].value = parseFloat(e.target.value) || 0;
    }
  };

  // Add new field
  document.getElementById('addFieldBtn').onclick = () => {
    const name = document.getElementById('newFieldName').value.trim();
    let options = newOptions.filter(opt => opt.label && !isNaN(opt.value));
    if (!name) {
      alert('Please enter a field name.');
      return;
    }
    if (!options.length) {
      alert('Please add at least one option for the field.');
      return;
    }
    calculator.fields.push({ name, options });
    newOptions = [];
    renderStep2();
  };

  // Edit field name
  document.querySelectorAll('.field-name-input').forEach(inp => {
    inp.oninput = (e) => {
      const idx = e.target.getAttribute('data-idx');
      calculator.fields[idx].name = e.target.value;
    };
  });

  // Option editing for existing fields
  document.querySelectorAll('.option-label-input').forEach(inp => {
    inp.oninput = (e) => {
      const idx = e.target.getAttribute('data-idx');
      const oidx = e.target.getAttribute('data-oidx');
      calculator.fields[idx].options[oidx].label = e.target.value;
    };
  });
  document.querySelectorAll('.option-value-input').forEach(inp => {
    inp.oninput = (e) => {
      const idx = e.target.getAttribute('data-idx');
      const oidx = e.target.getAttribute('data-oidx');
      calculator.fields[idx].options[oidx].value = parseFloat(e.target.value) || 0;
    };
  });
  document.querySelectorAll('.add-option-btn').forEach(btn => {
    btn.onclick = (e) => {
      const idx = btn.getAttribute('data-idx');
      const label = document.getElementById(`newOptionLabel${idx}`).value.trim();
      const value = parseFloat(document.getElementById(`newOptionValue${idx}`).value);
      if (!label || isNaN(value)) {
        alert('Enter label and score for the option.');
        return;
      }
      calculator.fields[idx].options = calculator.fields[idx].options || [];
      calculator.fields[idx].options.push({ label, value });
      renderStep2();
    };
  });
  document.querySelectorAll('.remove-option-btn').forEach(btn => {
    btn.onclick = (e) => {
      const idx = btn.getAttribute('data-idx');
      const oidx = btn.getAttribute('data-oidx');
      calculator.fields[idx].options.splice(oidx, 1);
      renderStep2();
    };
  });

  // Remove field
  document.querySelectorAll('.remove-field-btn').forEach(btn => {
    btn.onclick = (e) => {
      const idx = btn.getAttribute('data-idx');
      calculator.fields.splice(idx, 1);
      renderStep2();
    };
  });

  // Submit all fields
  document.getElementById('fieldsForm').onsubmit = (e) => {
    e.preventDefault();
    // Validate all fields
    for (const f of calculator.fields) {
      if (!f.name || !f.options || !f.options.length) {
        alert('Please fill all fields and ensure each has options.');
        return;
      }
    }
    step = 3;
    renderStep3();
  };
}

function renderStep3() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="step">
      <h1>${calculator.title}</h1>
      <form id="valuesForm">
        ${calculator.fields.map((f, i) => `
          <label for="field_${i}">${f.name}</label>
          <select name="field_${i}" id="field_${i}" required>
            <option value="">Select...</option>
            ${f.options.map(opt => `<option value="${opt.value}">${opt.label} (+${opt.value})</option>`).join('')}
          </select>
        `).join('')}
        <button type="submit" style="margin-top:18px;">Calculate Total Score</button>
      </form>
      <div id="scoreResult"></div>
      <button id="saveCalculatorBtn" style="margin-top:18px;background:#10b981;color:#fff;">Save Calculator</button>
      <div id="saveStatus" style="margin-top:10px;"></div>
      <button id="restartBtn" style="margin-top:18px;background:#e0e7ff;color:#6366f1;">Start Over</button>
    </div>
  `;

  document.getElementById('restartBtn').onclick = () => {
    calculator = { title: '', fields: [] };
    step = 1;
    renderStep1();
  };

  document.getElementById('valuesForm').onsubmit = (e) => {
    e.preventDefault();
    let total = 0;
    calculator.fields.forEach((f, i) => {
      const fieldName = `field_${i}`;
      const val = parseFloat(e.target[fieldName].value);
      if (!isNaN(val)) total += val;
    });
    document.getElementById('scoreResult').innerHTML = `
      <div class="score-output" style="animation:pop 0.5s;">
        Total Score: <span>${total}</span>
      </div>
    `;
  };

  let calculatorSaved = false;
  document.getElementById('saveCalculatorBtn').onclick = async () => {
    if (calculatorSaved) return;
    const saveStatus = document.getElementById('saveStatus');
    saveStatus.textContent = 'Saving...';
    console.log('[Supabase] Saving calculator:', calculator);
    try {
      // 1. Insert calculator (title only)
      const { data: calcData, error: calcError } = await supabase
        .from('calculators')
        .insert([{ title: calculator.title }])
        .select('id');
      if (calcError) {
        console.error('[Supabase] Error saving calculator:', calcError);
        throw calcError;
      }
      const calculatorId = calcData && calcData[0] && calcData[0].id;
      console.log('[Supabase] Calculator inserted with id:', calculatorId);
      // 2. Insert fields
      let fieldIds = [];
      for (let i = 0; i < calculator.fields.length; i++) {
        const field = calculator.fields[i];
        const { data: fieldData, error: fieldError } = await supabase
          .from('calculator_fields')
          .insert([{ calculator_id: calculatorId, name: field.name, field_order: i }])
          .select('id');
        if (fieldError) {
          console.error('[Supabase] Error saving field:', fieldError);
          throw fieldError;
        }
        const fieldId = fieldData && fieldData[0] && fieldData[0].id;
        fieldIds.push(fieldId);
        console.log(`[Supabase] Field inserted with id: ${fieldId}`);
        // 3. Insert options for this field
        for (let j = 0; j < (field.options || []).length; j++) {
          const opt = field.options[j];
          const { error: optError } = await supabase
            .from('calculator_options')
            .insert([{ field_id: fieldId, label: opt.label, value: opt.value, option_order: j }]);
          if (optError) {
            console.error('[Supabase] Error saving option:', optError);
            throw optError;
          }
          console.log(`[Supabase] Option inserted for field ${fieldId}:`, opt);
        }
      }
      calculatorSaved = true;
      saveStatus.style.color = '#10b981';
      saveStatus.textContent = 'Calculator saved! You can access it from Browse Calculators.';
      console.log('[Supabase] Calculator, fields, and options saved successfully.');
    } catch (err) {
      saveStatus.style.color = '#f87171';
      saveStatus.textContent = 'Error saving calculator: ' + (err.message || err);
      console.error('[Supabase] Error:', err);
    }
  };
}

// SPA Navigation and Section Rendering
const appContainer = document.getElementById('app');

function renderHome() {
  appContainer.innerHTML = `
    <section style="text-align:center;padding:48px 0 32px 0;">
      <h1 style="font-size:2.6rem;font-weight:900;color:#6366f1;margin-bottom:0.3em;">Welcome to ScoreCalc</h1>
      <p style="font-size:1.3rem;color:#4b5563;max-width:600px;margin:0 auto 1.5em auto;">Create, save, and reuse custom score calculators for exams, assignments, or anything you want. Fast, beautiful, and always available in the cloud.</p>
      <a href="#create" class="sidebar-link active" style="display:inline-block;font-size:1.2rem;padding:16px 40px;margin-top:18px;background:#6366f1;color:#fff;border-radius:12px;box-shadow:0 2px 8px rgba(60,72,100,0.08);font-weight:700;transition:background 0.2s;">Get Started</a>
    </section>
    <section style="display:flex;flex-wrap:wrap;gap:32px;justify-content:center;margin-top:32px;">
      <div style="background:#fff;border-radius:18px;box-shadow:0 2px 12px rgba(60,72,100,0.06);padding:32px 24px;max-width:320px;flex:1 1 260px;">
        <h2 style="color:#6366f1;font-size:1.3rem;margin-bottom:0.5em;">🛠️ Build Custom Calculators</h2>
        <p style="color:#4b5563;">Add fields, options, and scoring logic to match your needs. Save and reuse anytime.</p>
      </div>
      <div style="background:#fff;border-radius:18px;box-shadow:0 2px 12px rgba(60,72,100,0.06);padding:32px 24px;max-width:320px;flex:1 1 260px;">
        <h2 style="color:#6366f1;font-size:1.3rem;margin-bottom:0.5em;">☁️ Cloud Storage</h2>
        <p style="color:#4b5563;">Your calculators are securely stored in the cloud. Access them from any device, anytime.</p>
      </div>
      <div style="background:#fff;border-radius:18px;box-shadow:0 2px 12px rgba(60,72,100,0.06);padding:32px 24px;max-width:320px;flex:1 1 260px;">
        <h2 style="color:#6366f1;font-size:1.3rem;margin-bottom:0.5em;">✨ Minimal & Modern</h2>
        <p style="color:#4b5563;">Enjoy a clean, distraction-free interface designed for speed and clarity.</p>
      </div>
    </section>
  `;
}

function renderAbout() {
  appContainer.innerHTML = `
    <section style="max-width:700px;margin:0 auto;padding:48px 0 32px 0;">
      <h1 style="font-size:2.2rem;font-weight:900;color:#6366f1;margin-bottom:0.3em;">About ScoreCalc</h1>
      <p style="font-size:1.15rem;color:#4b5563;">ScoreCalc is a modern web app for building, saving, and reusing custom score calculators. Built with Supabase, Vercel, and love. Perfect for teachers, students, and anyone who needs flexible scoring tools.</p>
      <ul style="color:#6366f1;font-size:1.1rem;margin-top:2em;line-height:2;">
        <li>🔒 100% privacy: your data is yours</li>
        <li>💡 Open source and free to use</li>
        <li>🌎 Access from any device</li>
      </ul>
      <p style="margin-top:2em;color:#4b5563;">Made by <a href="https://github.com/ahmedelgharibb" target="_blank" style="color:#6366f1;text-decoration:underline;">Ahmed El Gharib</a></p>
    </section>
  `;
}

function renderBrowse() {
  // Reuse the modal logic, but render inline in the main area
  appContainer.innerHTML = `
    <section style="max-width:700px;margin:0 auto;padding:48px 0 32px 0;">
      <h1 style="font-size:2.2rem;font-weight:900;color:#6366f1;margin-bottom:0.3em;">Browse Calculators</h1>
      <div id="calcList" class="calc-list"></div>
      <div id="calcDetail" style="display:none;"></div>
    </section>
  `;
  fetchCalculatorsInline();
}

async function fetchCalculatorsInline() {
  const calcList = document.getElementById('calcList');
  const calcDetail = document.getElementById('calcDetail');
  calcList.innerHTML = 'Loading...';
  calcDetail.style.display = 'none';
  try {
    const { data: calculators, error } = await supabase
      .from('calculators')
      .select('id, title, created_at, fields:calculator_fields(id, name, field_order, options:calculator_options(id, label, value, option_order))')
      .order('created_at', { ascending: false });
    if (error) throw error;
    if (!calculators.length) {
      calcList.innerHTML = '<div style="color:#a0aec0;">No calculators found. Create one to get started!</div>';
      return;
    }
    calcList.innerHTML = calculators.map(calc => `
      <div class="calc-item" data-id="${calc.id}" tabindex="0" role="button" aria-label="${calc.title}" style="background:#fff;border-radius:12px;padding:18px 24px;margin-bottom:18px;box-shadow:0 2px 8px rgba(60,72,100,0.06);cursor:pointer;transition:box-shadow 0.2s;">
        <div style="font-size:1.2rem;font-weight:700;color:#6366f1;">${calc.title}</div>
        <div style="font-size:0.98em;color:#7b7b9d;font-weight:400;margin-top:2px;">${new Date(calc.created_at).toLocaleString()}</div>
      </div>
    `).join('');
    document.querySelectorAll('.calc-item').forEach(item => {
      item.onclick = () => showCalculatorInline(item.getAttribute('data-id'));
      item.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') item.click(); };
    });
  } catch (err) {
    calcList.innerHTML = `<div style='color:#f87171;'>Error loading calculators.<br>${err.message}</div>`;
  }
}

async function showCalculatorInline(id) {
  const calcList = document.getElementById('calcList');
  const calcDetail = document.getElementById('calcDetail');
  calcList.style.display = 'none';
  calcDetail.style.display = 'block';
  calcDetail.innerHTML = 'Loading...';
  try {
    const { data: calculators, error } = await supabase
      .from('calculators')
      .select('id, title, created_at, fields:calculator_fields(id, name, field_order, options:calculator_options(id, label, value, option_order))')
      .eq('id', id)
      .limit(1);
    if (error) throw error;
    const calc = calculators && calculators[0];
    if (!calc) throw new Error('Calculator not found');
    calcDetail.innerHTML = `
      <h2 style="margin-bottom:0.5em;">${calc.title}</h2>
      <form id="valuesForm">
        <div class="fields-value-list">
          ${calc.fields.map((f, i) => `
            <div class="field-value-row">
              <label for="field_${i}">${f.name}</label>
              <select name="field_${i}" id="field_${i}" required>
                <option value="">Select...</option>
                ${f.options.map(opt => `<option value="${opt.value}">${opt.label} (+${opt.value})</option>`).join('')}
              </select>
            </div>
          `).join('')}
        </div>
        <button type="submit" style="margin-top:18px;">Calculate Total Score</button>
      </form>
      <div id="scoreResult"></div>
      <button class="back-btn" id="backBtn">Back to List</button>
    </form>
    <div id="scoreResult"></div>
    <button class="back-btn" id="backBtn">Back to List</button>
  `;
    document.getElementById('backBtn').onclick = () => {
      calcDetail.style.display = 'none';
      calcList.style.display = 'block';
      fetchCalculatorsInline();
    };
    document.getElementById('valuesForm').onsubmit = (e) => {
      e.preventDefault();
      let total = 0;
      calc.fields.forEach((f, i) => {
        const fieldName = `field_${i}`;
        const val = parseFloat(e.target[fieldName].value);
        if (!isNaN(val)) total += val;
      });
      document.getElementById('scoreResult').innerHTML = `
        <div class="score-output" style="animation:pop 0.5s;">
          Total Score: <span>${total}</span>
        </div>
      `;
    };
  } catch (err) {
    calcDetail.innerHTML = `<div style='color:#f87171;'>Error loading calculator.<br>${err.message}</div><button class='back-btn' onclick='fetchCalculatorsInline()'>Back to List</button>`;
  }
}

// Navigation logic
function setActiveNav(hash) {
  document.querySelectorAll('nav a, aside .sidebar-link').forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === hash) link.classList.add('active');
    if (hash === '#' && link.getAttribute('href') === '#') link.classList.add('active');
  });
}

function handleNavigation() {
  const hash = window.location.hash || '#';
  setActiveNav(hash);
  if (hash === '#' || hash === '#home') renderHome();
  else if (hash === '#create') renderStep1();
  else if (hash === '#browse') renderBrowse();
  else if (hash === '#about') renderAbout();
  else renderHome();
}

window.addEventListener('hashchange', handleNavigation);
document.addEventListener('DOMContentLoaded', handleNavigation); 