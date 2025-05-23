const SUPABASE_URL = 'https://jckwvrzcjuggnfcbogrr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impja3d2cnpjanVnZ25mY2JvZ3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA2OTIwMTYsImV4cCI6MjA1NjI2ODAxNn0.p2a0om1X40AJVhldUdtaU-at0SSPz6hLbrAg-ELHcnY';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Step 1: Ask for calculator title
let calculator = {
  title: '',
  purpose: '',
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
          <label for="calcPurpose" class="glass-label flex items-center gap-2 mt-4">Purpose
            <span class="info-tooltip" tabindex="0" aria-label="What is this?">
              <svg width="18" height="18" fill="none" viewBox="0 0 24 24"><circle cx="12" cy="12" r="12" fill="#e0e7ff"/><text x="12" y="16" text-anchor="middle" font-size="14" fill="#6366f1" font-family="Arial" font-weight="bold">i</text></svg>
              <span class="tooltip-text">Describe what this calculator is for. Example: 'Calculate final exam grades for Math 101.'</span>
            </span>
          </label>
          <input type="text" id="calcPurpose" name="calcPurpose" required placeholder="e.g. Calculate final exam grades for Math 101" maxlength="80" class="glass-input"/>
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
  const purposeInput = document.getElementById('calcPurpose');
  const nextBtn = document.getElementById('nextBtn');
  function validate() {
    nextBtn.disabled = !(titleInput.value.trim() && purposeInput.value.trim());
    if (!nextBtn.disabled) {
      nextBtn.classList.add('btn-animate');
    } else {
      nextBtn.classList.remove('btn-animate');
    }
  }
  titleInput.addEventListener('input', validate);
  purposeInput.addEventListener('input', validate);
  document.getElementById('titleForm').onsubmit = (e) => {
    e.preventDefault();
    calculator.title = titleInput.value.trim();
    calculator.purpose = purposeInput.value.trim();
    if (calculator.title && calculator.purpose) {
      step = 2;
      renderStep2();
    }
  };
}

function renderStep2() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="flex justify-center items-center min-h-[80vh] w-full">
      <form id="fieldsForm" autocomplete="off" class="bg-white rounded-2xl shadow-xl p-8 w-full max-w-xl border border-gray-100">
        <h2 class="text-3xl font-extrabold text-center mb-8 text-gray-800">Create Your Calculator</h2>
        <div class="mb-6">
          <label for="calcTitle" class="block text-lg font-bold text-gray-700 mb-2">Calculator Title</label>
          <input type="text" id="calcTitle" name="calcTitle" required placeholder="Enter calculator name" maxlength="32" class="w-full border border-gray-200 rounded-lg px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-indigo-400 mb-0 bg-gray-50" value="${calculator.title || ''}" />
        </div>
        <div id="fieldsList">
          ${calculator.fields.map((f, i) => `
            <div class="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-200 relative">
              <div class="flex items-center gap-2 mb-3">
                <input type="text" value="${f.name}" data-idx="${i}" class="field-name-input font-semibold text-base border border-gray-200 rounded-lg px-3 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-indigo-400" maxlength="24" required placeholder="Field label (e.g. Homework, Quiz)" aria-label="Field label (e.g. Homework, Quiz)" />
                <button type="button" class="remove-field-btn text-red-500 text-sm font-semibold ml-2 transition-colors duration-150 hover:text-red-700" data-idx="${i}">Remove Field</button>
              </div>
              <div class="flex gap-2 mb-2">
                <input type="text" id="optionLabelInput${i}" class="border border-gray-200 rounded-lg px-3 py-2 flex-[2_2_0%] min-w-[120px] max-w-[300px] focus:outline-none focus:ring-2 focus:ring-indigo-400" placeholder="Option label (A, A+, B, etc.)" maxlength="18" aria-label="Option label (A, A+, B, etc.)" />
                <input type="number" id="optionValueInput${i}" class="border border-gray-200 rounded-lg px-3 py-2 flex-[1_1_0%] min-w-[60px] max-w-[120px] focus:outline-none focus:ring-2 focus:ring-indigo-400" placeholder="Value" aria-label="Value" />
              </div>
              <button type="button" class="add-option-btn w-full max-w-full bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl py-4 text-lg transition mb-2" data-idx="${i}">+ Add Option</button>
              <div id="optionsList${i}" class="mt-2">
                ${(f.options||[]).map((opt, oi) => `
                  <div class="flex gap-2 items-center mb-2">
                    <div class="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800">${opt.label}</div>
                    <div class="w-32 px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-800 text-center">${opt.value}</div>
                    <button type="button" class="remove-option-btn text-red-500 text-lg font-bold ml-2 transition-colors duration-150 hover:text-red-700" data-idx="${i}" data-oidx="${oi}" aria-label="Remove option">&times;</button>
                  </div>
                `).join('')}
              </div>
            </div>
          `).join('')}
        </div>
        <button type="button" id="addFieldBtn" class="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl py-3 text-base transition mb-6">+ Add Field</button>
        <button type="submit" class="w-full bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl py-4 text-lg transition">Save Calculator</button>
      </form>
    </div>
  `;

  // --- Modernized create calculator form logic ---
  // Sync calculator title
  const calcTitleInput = document.getElementById('calcTitle');
  calcTitleInput.oninput = (e) => {
    calculator.title = e.target.value;
    calcTitleInput.classList.remove('border-red-400');
  };

  // Add field logic
  document.getElementById('addFieldBtn').onclick = () => {
    calculator.fields.push({ name: '', options: [] });
    renderStep2();
    // Focus new field
    setTimeout(() => {
      const lastField = document.querySelectorAll('.field-name-input');
      if (lastField.length) lastField[lastField.length - 1].focus();
    }, 50);
  };

  // Remove field logic
  document.querySelectorAll('.remove-field-btn').forEach(btn => {
    btn.onclick = (e) => {
      const idx = btn.getAttribute('data-idx');
      calculator.fields.splice(idx, 1);
      renderStep2();
    };
  });

  // Edit field name with validation
  document.querySelectorAll('.field-name-input').forEach(inp => {
    inp.oninput = (e) => {
      const idx = e.target.getAttribute('data-idx');
      calculator.fields[idx].name = e.target.value;
      // Inline validation: no empty or duplicate names
      inp.classList.remove('border-red-400');
      const names = calculator.fields.map(f => f.name.trim());
      if (!e.target.value.trim() || names.filter(n => n === e.target.value.trim()).length > 1) {
        inp.classList.add('border-red-400');
      }
    };
  });

  // Add option logic with validation
  document.querySelectorAll('.add-option-btn').forEach(btn => {
    btn.onclick = (e) => {
      const idx = btn.getAttribute('data-idx');
      const labelInput = document.getElementById(`optionLabelInput${idx}`);
      const valueInput = document.getElementById(`optionValueInput${idx}`);
      const label = labelInput.value.trim();
      const value = valueInput.value.trim();
      labelInput.classList.remove('border-red-400');
      valueInput.classList.remove('border-red-400');
      // Inline validation: no empty or duplicate labels, value must be a number
      const labels = (calculator.fields[idx].options || []).map(opt => opt.label.trim());
      let hasError = false;
      if (!label) { labelInput.classList.add('border-red-400'); hasError = true; }
      if (!value || isNaN(value)) { valueInput.classList.add('border-red-400'); hasError = true; }
      if (labels.includes(label)) { labelInput.classList.add('border-red-400'); hasError = true; }
      if (hasError) return;
      calculator.fields[idx].options = calculator.fields[idx].options || [];
      calculator.fields[idx].options.push({ label, value });
      labelInput.value = '';
      valueInput.value = '';
      // Focus label input for quick entry
      setTimeout(() => labelInput.focus(), 50);
      renderStep2();
    };
  });

  // Remove option logic
  document.querySelectorAll('.remove-option-btn').forEach(btn => {
    btn.onclick = (e) => {
      const idx = btn.getAttribute('data-idx');
      const oidx = btn.getAttribute('data-oidx');
      calculator.fields[idx].options.splice(oidx, 1);
      renderStep2();
    };
  });

  // Save Calculator
  document.getElementById('fieldsForm').onsubmit = async (e) => {
    e.preventDefault();
    // Validate title
    if (!calculator.title.trim()) {
      calcTitleInput.classList.add('border-red-400');
      calcTitleInput.focus();
      return;
    }
    // Validate fields and options
    let hasError = false;
    calculator.fields.forEach((f, i) => {
      const fieldInput = document.querySelector(`.field-name-input[data-idx='${i}']`);
      if (!f.name.trim() || calculator.fields.filter(ff => ff.name.trim() === f.name.trim()).length > 1) {
        fieldInput.classList.add('border-red-400');
        hasError = true;
      }
      if (!f.options.length) {
        fieldInput.classList.add('border-red-400');
        hasError = true;
      }
      (f.options || []).forEach((opt, oi) => {
        if (!opt.label.trim() || isNaN(opt.value)) {
          hasError = true;
        }
      });
    });
    if (!calculator.fields.length || hasError) {
      alert('Please fill in all fields, avoid duplicates, and add at least one valid option for each field.');
      return;
    }
    // Show saving status
    const saveBtn = document.querySelector('#fieldsForm button[type="submit"]');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving...';
    try {
      // 1. Insert calculator (title only)
      const { data: calcData, error: calcError } = await supabase
        .from('calculators')
        .insert([{ title: calculator.title }])
        .select('id');
      if (calcError) throw calcError;
      const calculatorId = calcData && calcData[0] && calcData[0].id;
      // 2. Insert fields
      for (let i = 0; i < calculator.fields.length; i++) {
        const field = calculator.fields[i];
        const { data: fieldData, error: fieldError } = await supabase
          .from('calculator_fields')
          .insert([{ calculator_id: calculatorId, name: field.name, field_order: i }])
          .select('id');
        if (fieldError) throw fieldError;
        const fieldId = fieldData && fieldData[0] && fieldData[0].id;
        // 3. Insert options for this field
        for (let j = 0; j < (field.options || []).length; j++) {
          const opt = field.options[j];
          const { error: optError } = await supabase
            .from('calculator_options')
            .insert([{ field_id: fieldId, label: opt.label, value: opt.value, option_order: j }]);
          if (optError) throw optError;
        }
      }
      // Success
      app.innerHTML = `<div class="main-glass" style="padding:3rem 2rem;text-align:center;max-width:480px;margin:60px auto 0 auto;background:#23263a;color:#fff;box-shadow:0 8px 40px rgba(24,24,36,0.13);">
        <h2 style="font-size:2rem;font-weight:900;color:#fff;margin-bottom:1.5rem;">Calculator Saved!</h2>
        <p style="font-size:1.15rem;color:#fff;margin-bottom:2.5rem;">Your calculator has been saved. You can access it from <b style='color:#fff;'>Browse Calculators</b>.</p>
        <button class="glass-btn" style="background:#181824;color:#fff;font-weight:700;font-size:1.2rem;padding:1.1em 2.2em;border-radius:1.2em;box-shadow:0 4px 24px #18182433;transition:background 0.18s;" onclick="window.location.hash='#browse'">Go to Browse Calculators</button>
      </div>`;
      calculator = { title: '', fields: [] };
      step = 1;
    } catch (err) {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Save Calculator';
      alert('Error saving calculator: ' + (err.message || err));
    }
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
    <div class="main-glass">
      <h1>Welcome to ScoreCalc</h1>
      <p>Create, save, and reuse custom score calculators for exams, assignments, or anything you want. Fast, beautiful, and always available in the cloud.</p>
      <button class="cta-btn" onclick="window.location.hash='#create'">Get Started</button>
      <div class="features">
        <div class="feature-card">
          <h2>🛠️ Build Custom Calculators</h2>
          <p>Add fields, options, and scoring logic to match your needs. Save and reuse anytime.</p>
        </div>
        <div class="feature-card">
          <h2>☁️ Cloud Storage</h2>
          <p>Your calculators are securely stored in the cloud. Access them from any device, anytime.</p>
        </div>
        <div class="feature-card">
          <h2>✨ Minimal & Modern</h2>
          <p>Enjoy a clean, distraction-free interface designed for speed and clarity.</p>
        </div>
      </div>
    </div>
  `;
}

function renderAbout() {
  appContainer.innerHTML = `
    <section style="max-width:700px;margin:0 auto;padding:48px 0 32px 0;">
      <h1 style="font-size:2.2rem;font-weight:900;color:#181824;margin-bottom:0.3em;">About ScoreCalc</h1>
      <p style="font-size:1.15rem;color:#181824;">ScoreCalc is a modern web app for building, saving, and reusing custom score calculators. Built with Supabase, Vercel, and love. Perfect for teachers, students, and anyone who needs flexible scoring tools.</p>
      <ul style="color:#181824;font-size:1.1rem;margin-top:2em;line-height:2;">
        <li>🔒 100% privacy: your data is yours</li>
        <li>💡 Open source and free to use</li>
        <li>🌎 Access from any device</li>
      </ul>
    </section>
  `;
}

function renderBrowse() {
  // Reuse the modal logic, but render inline in the main area
  appContainer.innerHTML = `
    <section style="max-width:700px;margin:0 auto;padding:48px 0 32px 0;">
      <h1 style="font-size:2.6rem;font-weight:900;color:#181824;margin-bottom:2.2em;text-align:center;letter-spacing:-0.02em;">Browse Calculators</h1>
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
      .select('id, title, purpose, created_at, fields:calculator_fields(id, name, field_order, options:calculator_options(id, label, value, option_order))')
      .order('created_at', { ascending: false });
    if (error) throw error;
    if (!calculators.length) {
      calcList.innerHTML = '<div style="color:#a0aec0;text-align:center;">No calculators found. Create one to get started!</div>';
      return;
    }
    calcList.innerHTML = calculators.map(calc => {
      // Add 3 hours to created_at for Egypt time
      const createdAt = new Date(calc.created_at);
      createdAt.setHours(createdAt.getHours() + 3);
      // Format as '9:14 pm' (12-hour, lowercase)
      const hour = createdAt.getHours();
      const hour12 = hour % 12 === 0 ? 12 : hour % 12;
      const minutes = createdAt.getMinutes().toString().padStart(2, '0');
      const ampm = hour < 12 ? 'am' : 'pm';
      const formattedTime = `${hour12}:${minutes} ${ampm}`;
      return `
        <div class="calc-item" data-id="${calc.id}" tabindex="0" role="button" aria-label="${calc.title}" style="background:#fff;border-radius:18px;padding:22px 32px;margin-bottom:26px;box-shadow:0 2px 8px rgba(60,72,100,0.06);cursor:pointer;transition:box-shadow 0.2s;">
          <div style="font-size:1.35rem;font-weight:800;color:#181824;letter-spacing:-0.01em;">${calc.title}</div>
          <div style="font-size:1.02rem;color:#6b7280;font-weight:500;margin-top:2px;margin-bottom:2px;">${calc.purpose ? calc.purpose : ''}</div>
          <div style="font-size:1.05em;color:#6b7280;font-weight:500;margin-top:6px;">${formattedTime}</div>
        </div>
      `;
    }).join('');
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

    // --- Fetch previous attempts ---
    const { data: attempts, error: attemptsError } = await supabase
      .from('quiz_attempts')
      .select('id, user_name, score, created_at')
      .eq('calculator_id', id)
      .order('created_at', { ascending: false });
    if (attemptsError) throw attemptsError;

    // --- Render previous attempts and New Quiz button ---
    function renderAttemptsList() {
      calcDetail.innerHTML = `
        <div class="quiz-card" style="max-width:480px;margin:40px auto 0 auto;padding:2.5rem 2rem 2rem 2rem;background:#fff;border-radius:20px;box-shadow:0 4px 32px rgba(60,72,100,0.10);border:2px solid #e5e7eb;position:relative;">
          <button id="backBtn" aria-label="Back to List" style="position:absolute;top:18px;left:18px;background:none;border:none;cursor:pointer;padding:0;margin:0;display:flex;align-items:center;z-index:2;">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          </button>
          <h2 style="font-size:1.5rem;font-weight:800;color:#181824;margin-bottom:1.5rem;margin-top:0.2rem;text-align:center;">Previous Attempts</h2>
          <div style="margin-bottom:2rem;">
            ${attempts.length === 0 ? '<div style="color:#a0aec0;text-align:center;">No attempts yet.</div>' :
              `<table style='width:100%;font-size:1.08rem;'><thead><tr><th style='text-align:left;padding-bottom:6px;'>Name</th><th style='text-align:right;padding-bottom:6px;'>Score</th></tr></thead><tbody>` +
              attempts.map(a => `<tr><td style='padding:4px 0;'>${a.user_name}</td><td style='text-align:right;padding:4px 0;'>${a.score}</td></tr>`).join('') +
              '</tbody></table>'}
          </div>
          <div style="display:flex;justify-content:center;align-items:center;margin-top:1.5rem;">
            <button class="glass-btn" id="startQuizBtn" style="margin-bottom:0;margin-right:1.2rem;background:#181824;color:#fff;font-weight:700;font-size:1.15rem;">New Quiz</button>
          </div>
        </div>
      `;
      document.getElementById('startQuizBtn').onclick = () => renderNamePrompt();
      document.getElementById('backBtn').onclick = () => {
        calcDetail.style.display = 'none';
        calcList.style.display = 'block';
        fetchCalculatorsInline();
      };
    }

    // --- Prompt for user name before quiz ---
    function renderNamePrompt() {
      calcDetail.innerHTML = `
        <div class="quiz-card" style="max-width:480px;margin:40px auto 0 auto;padding:2.5rem 2rem 2rem 2rem;background:#fff;border-radius:20px;box-shadow:0 4px 32px rgba(60,72,100,0.10);border:2px solid #e5e7eb;position:relative;">
          <h2 style="font-size:1.5rem;font-weight:800;color:#181824;margin-bottom:1.5rem;">Enter Quiz Name</h2>
          <form id="nameForm">
            <input type="text" id="quizUserName" class="glass-input" placeholder="Quiz name" maxlength="64" required style="margin-bottom:1.5rem;" />
            <button type="submit" class="glass-btn" style="background:#181824;color:#fff;font-weight:700;font-size:1.15rem;">Start Quiz</button>
            <button type="button" class="back-btn" id="cancelNameBtn" style="margin-left:1.2rem;background:none;color:#6b7280;font-size:1.1rem;font-weight:600;">Cancel</button>
          </form>
        </div>
      `;
      document.getElementById('cancelNameBtn').onclick = renderAttemptsList;
      document.getElementById('nameForm').onsubmit = (e) => {
        e.preventDefault();
        const userName = document.getElementById('quizUserName').value.trim();
        if (!userName) {
          document.getElementById('quizUserName').classList.add('border-red-400');
          return;
        }
        renderQuizStep(userName);
      };
    }

    // --- Quiz state ---
    function renderQuizStep(userName) {
      let currentStep = 0;
      const answers = Array(calc.fields.length).fill(null);
      function showStep() {
        const field = calc.fields[currentStep];
        const totalSteps = calc.fields.length;
        calcDetail.innerHTML = `
          <div class="quiz-card" style="max-width:480px;margin:40px auto 0 auto;padding:2.5rem 2rem 2rem 2rem;background:#fff;border-radius:20px;box-shadow:0 4px 32px rgba(60,72,100,0.10);border:2px solid #e5e7eb;position:relative;">
            <div style="height:10px;background:#f3f4f6;border-radius:8px;overflow:hidden;margin-bottom:1.5rem;">
              <div style="height:100%;width:${((currentStep+1)/totalSteps)*100}%;background:#181824;transition:width 0.3s;"></div>
            </div>
            <div style="text-align:center;margin-bottom:0.7rem;font-size:1.1rem;font-weight:600;color:#6b7280;">Question ${currentStep+1} of ${totalSteps}</div>
            <div style="text-align:center;font-size:2rem;font-weight:800;color:#181824;margin-bottom:2rem;">${field.name}</div>
            <form id="quizForm">
              <div style="display:flex;flex-direction:column;gap:1.1rem;">
                ${field.options.map((opt, i) => `
                  <label style="display:flex;align-items:center;gap:1rem;padding:1.1rem 1.2rem;border-radius:1rem;border:1.5px solid #e5e7eb;background:${answers[currentStep]==i?'#f3f4f6':'#fff'};cursor:pointer;transition:background 0.18s;">
                    <input type="radio" name="option" value="${i}" ${answers[currentStep]==i?'checked':''} style="accent-color:#181824;width:1.2em;height:1.2em;"/>
                    <span style="font-size:1.15rem;font-weight:500;color:#181824;">${opt.label}</span>
                  </label>
                `).join('')}
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center;margin-top:2.5rem;">
                <button type="button" id="prevBtn" class="glass-btn" style="background:#f3f4f6;color:#9ca3af;font-weight:700;box-shadow:none;${currentStep===0?'opacity:0.5;pointer-events:none;':''}">Previous</button>
                <button type="submit" id="nextBtn" class="glass-btn" style="background:#6b7280;color:#fff;font-weight:700;min-width:90px;">${currentStep===totalSteps-1?'Finish':'Next'}</button>
              </div>
            </form>
            <button class="back-btn" id="backBtn" style="position:absolute;top:18px;right:18px;background:none;color:#6b7280;font-size:1.1rem;font-weight:600;">Cancel</button>
          </div>
        `;
        document.getElementById('backBtn').onclick = renderAttemptsList;
        document.getElementById('prevBtn').onclick = () => {
          if (currentStep > 0) {
            currentStep--;
            showStep();
          }
        };
        document.getElementById('quizForm').onsubmit = (e) => {
          e.preventDefault();
          const selected = document.querySelector('input[name="option"]:checked');
          if (!selected) return;
          answers[currentStep] = parseInt(selected.value);
          if (currentStep < totalSteps - 1) {
            currentStep++;
            showStep();
          } else {
            renderQuizResult(userName, answers);
          }
        };
        document.querySelectorAll('input[name="option"]').forEach((input, i) => {
          input.onchange = () => {
            answers[currentStep] = parseInt(input.value);
            showStep();
          };
        });
      }
      showStep();
    }

    // --- Quiz result and save ---
    async function renderQuizResult(userName, answers) {
      let total = 0;
      calc.fields.forEach((f, i) => {
        const answerIdx = answers[i];
        if (answerIdx != null && f.options[answerIdx]) {
          const val = parseFloat(f.options[answerIdx].value);
          if (!isNaN(val)) total += val;
        }
      });
      // Save attempt to DB
      const { error: saveError } = await supabase
        .from('quiz_attempts')
        .insert([{ calculator_id: id, user_name: userName, answers: JSON.stringify(answers), score: total }]);
      // Refetch attempts and show list
      const { data: newAttempts } = await supabase
        .from('quiz_attempts')
        .select('id, user_name, score, created_at')
        .eq('calculator_id', id)
        .order('created_at', { ascending: false });
      attempts.length = 0;
      attempts.push(...(newAttempts || []));
      renderAttemptsList();
    }

    // Initial render
    renderAttemptsList();
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
  else if (hash === '#create') renderStep2();
  else if (hash === '#browse') renderBrowse();
  else if (hash === '#about') renderAbout();
  else renderHome();
}

window.addEventListener('hashchange', handleNavigation);
document.addEventListener('DOMContentLoaded', handleNavigation);

// --- Modern calculator creation UI logic ---
document.addEventListener('DOMContentLoaded', () => {
  const calcForm = document.getElementById('calcForm');
  if (!calcForm) return;
  const calcTitleInput = document.getElementById('calcTitle');
  const fieldNameInput = document.getElementById('fieldName');
  const addOptionBtn = document.querySelector('.add-option-btn');
  const addFieldBtn = document.querySelector('.add-field-btn');
  const saveBtn = document.querySelector('.save-btn');
  const optionsSection = document.querySelector('.options-section');
  const optionRow = optionsSection.querySelector('.option-row');
  const calcTitleError = document.getElementById('calcTitleError');
  const fieldNameError = document.getElementById('fieldNameError');

  let options = [];
  let fields = [];

  function renderOptions() {
    // Remove all but the first option row
    optionsSection.querySelectorAll('.option-row').forEach((row, idx) => { if (idx > 0) row.remove(); });
    options.forEach((opt, i) => {
      const row = document.createElement('div');
      row.className = 'option-row';
      row.innerHTML = `
        <input type="text" placeholder="e.g., A+" value="${opt.label}" required>
        <input type="number" placeholder="e.g., 100" value="${opt.points}" required>
        <button type="button" class="remove-option-btn" aria-label="Remove option" style="color:#ef4444;background:none;border:none;font-size:1.1em;">✕</button>
      `;
      row.querySelector('.remove-option-btn').onclick = () => {
        options.splice(i, 1);
        renderOptions();
      };
      // Update option values on input
      row.querySelectorAll('input').forEach((input, idx) => {
        input.oninput = (e) => {
          if (idx === 0) options[i].label = e.target.value;
          else options[i].points = e.target.value;
        };
      });
      optionsSection.insertBefore(row, addOptionBtn);
    });
  }

  addOptionBtn.onclick = () => {
    const label = optionRow.querySelector('input[type="text"]').value.trim();
    const points = optionRow.querySelector('input[type="number"]').value.trim();
    if (!label || !points) {
      optionRow.querySelectorAll('input').forEach(inp => inp.classList.add('error'));
      return;
    }
    options.push({ label, points });
    optionRow.querySelectorAll('input').forEach(inp => { inp.value = ''; inp.classList.remove('error'); });
    renderOptions();
  };

  addFieldBtn.onclick = () => {
    const fieldName = fieldNameInput.value.trim();
    if (!fieldName) {
      fieldNameInput.classList.add('error');
      fieldNameError.textContent = 'Field name is required.';
      return;
    }
    if (!options.length) {
      fieldNameError.textContent = 'Add at least one option.';
      return;
    }
    fields.push({ name: fieldName, options: [...options] });
    fieldNameInput.value = '';
    options = [];
    renderOptions();
    fieldNameError.textContent = '';
  };

  calcForm.onsubmit = (e) => {
    e.preventDefault();
    let valid = true;
    if (!calcTitleInput.value.trim()) {
      calcTitleInput.classList.add('error');
      calcTitleError.textContent = 'Calculator title is required.';
      valid = false;
    } else {
      calcTitleInput.classList.remove('error');
      calcTitleError.textContent = '';
    }
    if (!fields.length) {
      fieldNameError.textContent = 'Add at least one field.';
      valid = false;
    } else {
      fieldNameError.textContent = '';
    }
    if (!valid) return;
    // Save logic here (e.g., send to backend)
    alert('Calculator saved!');
    // Reset form
    calcTitleInput.value = '';
    fieldNameInput.value = '';
    options = [];
    fields = [];
    renderOptions();
  };
}); 