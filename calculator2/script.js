const SUPABASE_URL = 'https://jckwvrzcjuggnfcbogrr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impja3d2cnpjanVnZ25mY2JvZ3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA2OTIwMTYsImV4cCI6MjA1NjI2ODAxNn0.p2a0om1X40AJVhldUdtaU-at0SSPz6hLbrAg-ELHcnY';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- 3-step calculator creation flow ---
let calculator = {
  title: '',
  purpose: '',
  numFields: 1,
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
        <form id="setupForm" autocomplete="off">
          <label class="glass-label">Calculator Title</label>
          <input type="text" id="calcTitle" required maxlength="32" class="glass-input" placeholder="e.g. Exam Grader" value="${calculator.title}" />
          <label class="glass-label mt-4">Purpose</label>
          <input type="text" id="calcPurpose" required maxlength="80" class="glass-input" placeholder="e.g. Calculate final exam grades for Math 101" value="${calculator.purpose}" />
          <label class="glass-label mt-4">Number of Fields</label>
          <input type="number" id="numFields" required min="1" max="20" class="glass-input" value="${calculator.numFields}" />
          <button type="submit" id="nextBtn1" class="glass-btn next-btn mt-6" disabled>Next</button>
        </form>
      </div>
    </div>
  `;
  const titleInput = document.getElementById('calcTitle');
  const purposeInput = document.getElementById('calcPurpose');
  const numFieldsInput = document.getElementById('numFields');
  const nextBtn = document.getElementById('nextBtn1');
  function validate() {
    nextBtn.disabled = !(titleInput.value.trim() && purposeInput.value.trim() && parseInt(numFieldsInput.value) > 0);
  }
  titleInput.addEventListener('input', validate);
  purposeInput.addEventListener('input', validate);
  numFieldsInput.addEventListener('input', validate);
  document.getElementById('setupForm').onsubmit = (e) => {
    e.preventDefault();
    calculator.title = titleInput.value.trim();
    calculator.purpose = purposeInput.value.trim();
    calculator.numFields = Math.max(1, parseInt(numFieldsInput.value));
    calculator.fields = Array.from({ length: calculator.numFields }, (_, i) => ({ name: '', weight: '', options: [] }));
    step = 2;
    renderStep2();
  };
}

function renderStep2() {
  const app = document.getElementById('app');
  let weightError = '';
  const totalWeight = calculator.fields.reduce((sum, f) => sum + (parseFloat(f.weight) || 0), 0);
  if (calculator.fields.length && totalWeight !== 100) {
    weightError = 'All weights must add up to 100%.';
  }
  app.innerHTML = `
    <div class="flex justify-center items-center min-h-[80vh] w-full">
      <form id="fieldsForm" autocomplete="off" class="bg-white rounded-2xl shadow-xl p-8 w-full max-w-xl border border-gray-100">
        <div class="progress-indicator mb-4">Step 2 of 3</div>
        <h2 class="text-3xl font-extrabold text-center mb-8 text-gray-800">Configure Fields</h2>
        <div id="fieldsList">
          ${calculator.fields.map((f, i) => `
            <div class="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-200 relative">
              <div class="flex items-center gap-2 mb-3">
                <input type="text" value="${f.name}" data-idx="${i}" class="field-name-input font-semibold text-base border border-gray-200 rounded-lg px-3 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-indigo-400" maxlength="24" required placeholder="Field label (e.g. Homework, Quiz)" aria-label="Field label (e.g. Homework, Quiz)" />
                <input type="number" value="${f.weight || ''}" data-idx="${i}" class="field-weight-input w-24 border border-gray-200 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-indigo-400 ml-2" min="0" max="100" step="1" required placeholder="Weight %" aria-label="Weight (%)" />
                <span class="text-gray-500 text-sm ml-1">%</span>
              </div>
            </div>
          `).join('')}
        </div>
        <div class="flex items-center justify-between mt-2 mb-4">
          <div class="text-gray-700 font-semibold">Total Weight: <span id="totalWeight" class="${weightError ? 'text-red-500' : 'text-green-600'}">${totalWeight}%</span></div>
          <span class="text-red-500 text-sm" id="weightError">${weightError}</span>
        </div>
        <div class="flex gap-4 mt-6">
          <button type="button" id="backBtn2" class="glass-btn">Back</button>
          <button type="submit" class="glass-btn next-btn" ${weightError ? 'disabled' : ''}>Next</button>
        </div>
      </form>
    </div>
  `;
  document.querySelectorAll('.field-name-input').forEach(inp => {
    inp.oninput = (e) => {
      const idx = e.target.getAttribute('data-idx');
      calculator.fields[idx].name = e.target.value;
      inp.classList.remove('border-red-400');
      const names = calculator.fields.map(f => f.name.trim());
      if (!e.target.value.trim() || names.filter(n => n === e.target.value.trim()).length > 1) {
        inp.classList.add('border-red-400');
      }
    };
  });
  document.querySelectorAll('.field-weight-input').forEach(inp => {
    inp.oninput = (e) => {
      const idx = e.target.getAttribute('data-idx');
      let val = e.target.value;
      if (val === '') val = '';
      else val = Math.max(0, Math.min(100, parseInt(val)));
      calculator.fields[idx].weight = val;
      renderStep2();
    };
  });
  document.getElementById('backBtn2').onclick = () => {
    step = 1;
    renderStep1();
  };
  document.getElementById('fieldsForm').onsubmit = (e) => {
    e.preventDefault();
    let hasError = false;
    calculator.fields.forEach((f, i) => {
      const fieldInput = document.querySelector(`.field-name-input[data-idx='${i}']`);
      const weightInput = document.querySelector(`.field-weight-input[data-idx='${i}']`);
      if (!f.name.trim() || calculator.fields.filter(ff => ff.name.trim() === f.name.trim()).length > 1) {
        fieldInput.classList.add('border-red-400');
        hasError = true;
      }
      if (f.weight === '' || isNaN(f.weight) || f.weight < 0 || f.weight > 100) {
        weightInput.classList.add('border-red-400');
        hasError = true;
      }
    });
    if (!calculator.fields.length || hasError || totalWeight !== 100) {
      alert('Please fill in all fields, avoid duplicates, and ensure total weight is 100%.');
      return;
    }
    step = 3;
    renderStep3();
  };
}

function renderStep3() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="flex justify-center items-center min-h-[80vh] w-full">
      <form id="optionsForm" autocomplete="off" class="bg-white rounded-2xl shadow-xl p-8 w-full max-w-xl border border-gray-100">
        <div class="progress-indicator mb-4">Step 3 of 3</div>
        <h2 class="text-3xl font-extrabold text-center mb-8 text-gray-800">Add Options for Each Field</h2>
        <div id="fieldsOptionsList">
          ${calculator.fields.map((f, i) => `
            <div class="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-200 relative">
              <div class="font-semibold text-base mb-2">${f.name} <span class="text-gray-500">(${f.weight}%)</span></div>
              <div id="optionsList${i}">
                ${(f.options||[]).map((opt, oi) => `
                  <div class="flex gap-2 items-center mb-2">
                    <input type="text" value="${opt.label}" data-idx="${i}" data-oidx="${oi}" class="option-label-input border border-gray-200 rounded-lg px-3 py-2 flex-1" maxlength="18" required placeholder="Option label (A, A+, B, etc.)" />
                    <input type="number" value="${opt.value}" data-idx="${i}" data-oidx="${oi}" class="option-value-input border border-gray-200 rounded-lg px-3 py-2 w-24" required placeholder="Value" />
                    <button type="button" class="remove-option-btn text-red-500 text-lg font-bold ml-2" data-idx="${i}" data-oidx="${oi}" aria-label="Remove option">&times;</button>
                  </div>
                `).join('')}
              </div>
              <div class="flex gap-2 mt-2">
                <input type="text" id="optionLabelInput${i}" class="border border-gray-200 rounded-lg px-3 py-2 flex-1" placeholder="Option label (A, A+, B, etc.)" maxlength="18" />
                <input type="number" id="optionValueInput${i}" class="border border-gray-200 rounded-lg px-3 py-2 w-24" placeholder="Value" />
                <button type="button" class="add-option-btn bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl px-4 py-2" data-idx="${i}">+ Add Option</button>
              </div>
            </div>
          `).join('')}
        </div>
        <div class="flex gap-4 mt-6">
          <button type="button" id="backBtn3" class="glass-btn">Back</button>
          <button type="submit" class="glass-btn next-btn">Save Calculator</button>
        </div>
      </form>
    </div>
  `;
  document.querySelectorAll('.add-option-btn').forEach(btn => {
    btn.onclick = (e) => {
      const idx = btn.getAttribute('data-idx');
      const labelInput = document.getElementById(`optionLabelInput${idx}`);
      const valueInput = document.getElementById(`optionValueInput${idx}`);
      const label = labelInput.value.trim();
      const value = valueInput.value.trim();
      labelInput.classList.remove('border-red-400');
      valueInput.classList.remove('border-red-400');
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
      renderStep3();
    };
  });
  document.querySelectorAll('.remove-option-btn').forEach(btn => {
    btn.onclick = (e) => {
      const idx = btn.getAttribute('data-idx');
      const oidx = btn.getAttribute('data-oidx');
      calculator.fields[idx].options.splice(oidx, 1);
      renderStep3();
    };
  });
  document.querySelectorAll('.option-label-input').forEach(inp => {
    inp.oninput = (e) => {
      const idx = inp.getAttribute('data-idx');
      const oidx = inp.getAttribute('data-oidx');
      calculator.fields[idx].options[oidx].label = inp.value;
    };
  });
  document.querySelectorAll('.option-value-input').forEach(inp => {
    inp.oninput = (e) => {
      const idx = inp.getAttribute('data-idx');
      const oidx = inp.getAttribute('data-oidx');
      calculator.fields[idx].options[oidx].value = inp.value;
    };
  });
  document.getElementById('backBtn3').onclick = () => {
    step = 2;
    renderStep2();
  };
  document.getElementById('optionsForm').onsubmit = async (e) => {
    e.preventDefault();
    let hasError = false;
    calculator.fields.forEach((f, i) => {
      if (!f.options.length) hasError = true;
      (f.options || []).forEach((opt, oi) => {
        if (!opt.label.trim() || isNaN(opt.value)) {
          hasError = true;
        }
      });
    });
    if (!calculator.fields.length || hasError) {
      alert('Please add at least one valid option for each field.');
      return;
    }
    // Save logic (same as before)
    const app = document.getElementById('app');
    app.innerHTML = `<div class="main-glass" style="padding:3rem 2rem;text-align:center;max-width:480px;margin:60px auto 0 auto;background:#23263a;color:#fff;box-shadow:0 8px 40px rgba(24,24,36,0.13);">
      <h2 style="font-size:2rem;font-weight:900;color:#fff;margin-bottom:1.5rem;">Calculator Saved!</h2>
      <p style="font-size:1.15rem;color:#fff;margin-bottom:2.5rem;">Your calculator has been saved. You can access it from <b style='color:#fff;'>Browse Calculators</b>.</p>
      <button class="glass-btn" style="background:#181824;color:#fff;font-weight:700;font-size:1.2rem;padding:1.1em 2.2em;border-radius:1.2em;box-shadow:0 4px 24px #18182433;transition:background 0.18s;" onclick="window.location.hash='#browse'">Go to Browse Calculators</button>
    </div>`;
    // Save to Supabase or backend as before
    // ...
    calculator = { title: '', purpose: '', numFields: 1, fields: [] };
    step = 1;
  };
}

// Initial render
function renderCreateFlow() {
  if (step === 1) renderStep1();
  else if (step === 2) renderStep2();
  else if (step === 3) renderStep3();
}

// Navigation logic
function handleNavigation() {
  const hash = window.location.hash || '#';
  setActiveNav(hash);
  if (hash === '#' || hash === '#home') renderHome();
  else if (hash === '#create') renderCreateFlow();
  else if (hash === '#browse') renderBrowse();
  else if (hash === '#about') renderAbout();
  else renderHome();
}
window.addEventListener('hashchange', handleNavigation);
document.addEventListener('DOMContentLoaded', handleNavigation);

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
  appContainer.innerHTML = `
    <section style="max-width:700px;margin:0 auto;padding:48px 0 32px 0;">
      <h1 style="font-size:2.6rem;font-weight:900;color:#181824;margin-bottom:1.2em;text-align:center;letter-spacing:-0.02em;">Browse Calculators</h1>
      <div id="searchBarContainer" style="display:flex;justify-content:center;margin-bottom:2.2em;">
        <input id="calcSearch" type="text" placeholder="Search calculators..." aria-label="Search calculators" style="width:100%;max-width:420px;padding:0.85em 1.2em;font-size:1.1rem;border-radius:1.1em;border:1.5px solid #e5e7eb;background:#f8fafc;color:#232946;box-shadow:0 2px 8px rgba(60,72,100,0.04);outline:none;transition:border 0.18s;" />
      </div>
      <div id="calcList" class="calc-list"></div>
      <div id="calcDetail" style="display:none;"></div>
    </section>
  `;
  fetchCalculatorsInline();
  setTimeout(() => {
    const searchInput = document.getElementById('calcSearch');
    if (!searchInput) return;
    searchInput.addEventListener('input', function() {
      const query = this.value.trim().toLowerCase();
      window._calcSearchQuery = query;
      fetchCalculatorsInline();
    });
  }, 0);
}

async function fetchCalculatorsInline() {
  const calcList = document.getElementById('calcList');
  const calcDetail = document.getElementById('calcDetail');
  calcList.innerHTML = `<div class="loader-container"><div class="loader"></div></div>`;
  calcDetail.style.display = 'none';
  try {
    const { data: calculators, error } = await supabase
      .from('calculators')
      .select('id, title, purpose, created_at, fields:calculator_fields(id, name, field_order, options:calculator_options(id, label, value, option_order))')
      .order('created_at', { ascending: false });
    if (error) throw error;
    // Filter by search query if present
    let filtered = calculators;
    if (window._calcSearchQuery && window._calcSearchQuery.length > 0) {
      const q = window._calcSearchQuery;
      filtered = calculators.filter(calc =>
        (calc.title && calc.title.toLowerCase().includes(q)) ||
        (calc.purpose && calc.purpose.toLowerCase().includes(q))
      );
    }
    if (!filtered.length) {
      calcList.innerHTML = '<div style="color:#a0aec0;text-align:center;">No calculators found. Create one to get started!</div>';
      return;
    }
    calcList.innerHTML = filtered.map(calc => {
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
        <div class="calc-item" data-id="${calc.id}" tabindex="0" role="button" aria-label="${calc.title}" style="background:#fff;border-radius:22px;padding:38px 32px 32px 32px;margin-bottom:36px;box-shadow:0 2px 12px rgba(60,72,100,0.09);cursor:pointer;transition:box-shadow 0.2s;display:flex;flex-direction:column;align-items:center;min-height:180px;max-width:420px;width:100%;margin-left:auto;margin-right:auto;position:relative;">
          <button class="delete-calc-btn" title="Delete calculator" aria-label="Delete calculator" style="position:absolute;top:18px;right:18px;background:none;border:none;color:#e11d48;font-size:1.3rem;cursor:pointer;z-index:2;transition:color 0.18s;"><span aria-hidden="true">&times;</span></button>
          <div style="font-size:1.55rem;font-weight:900;color:#181824;letter-spacing:-0.01em;text-align:center;width:100%;">${calc.title}</div>
          <div style="font-size:1.08rem;color:#8b95a1;font-weight:500;margin-top:10px;margin-bottom:10px;min-height:1.2em;text-align:center;width:100%;">
            ${calc.purpose && calc.purpose.trim() ? calc.purpose : '<span style=\'color:#cbd5e1;font-style:italic;\'>No purpose provided</span>'}
          </div>
          <div style="font-size:1.05em;color:#6b7280;font-weight:500;margin-top:auto;text-align:center;width:100%;">${formattedTime}</div>
        </div>
      `;
    }).join('');
    // Add delete logic
    document.querySelectorAll('.delete-calc-btn').forEach((btn, idx) => {
      btn.onclick = async (e) => {
        e.stopPropagation();
        const calcId = btn.closest('.calc-item').getAttribute('data-id');
        if (!calcId) return;
        showDeleteModal(async () => {
          btn.disabled = true;
          btn.innerHTML = '<span style="font-size:1.1em;">...</span>';
          await supabase.from('calculators').delete().eq('id', calcId);
          fetchCalculatorsInline();
        });
      };
    });
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
  // Hide search bar when showing details/quiz
  const searchBar = document.getElementById('searchBarContainer');
  if (searchBar) searchBar.style.display = 'none';
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
            <button class="glass-btn" id="startQuizBtn" style="margin-bottom:0;margin-right:1.2rem;background:#232946;color:#fff;font-weight:700;font-size:1.15rem;box-shadow:0 4px 24px rgba(35,41,70,0.10);">New Quiz</button>
          </div>
        </div>
      `;
      document.getElementById('startQuizBtn').onclick = () => renderNamePrompt();
      document.getElementById('backBtn').onclick = () => {
        calcDetail.style.display = 'none';
        calcList.style.display = 'block';
        // Show search bar again
        const searchBar = document.getElementById('searchBarContainer');
        if (searchBar) searchBar.style.display = 'flex';
        fetchCalculatorsInline();
      };
    }

    // --- Prompt for user name before quiz ---
    function renderNamePrompt() {
      calcDetail.innerHTML = `
        <div class="quiz-card" style="max-width:480px;margin:40px auto 0 auto;padding:2.5rem 2rem 2rem 2rem;background:#fff;border-radius:20px;box-shadow:0 4px 32px rgba(60,72,100,0.10);border:2px solid #e5e7eb;position:relative;">
          <h2 style="font-size:1.5rem;font-weight:800;color:#181824;margin-bottom:1.5rem;">Enter Quiz Name</h2>
          <form id="nameForm">
            <input type="text" id="quizUserName" class="glass-input quiz-dark-input" placeholder="Quiz name" maxlength="64" required style="margin-bottom:1.5rem;" />
            <button type="submit" class="glass-btn" style="background:#232946;color:#fff;font-weight:700;font-size:1.15rem;box-shadow:0 4px 24px rgba(35,41,70,0.10);">Start Quiz</button>
            <button type="button" class="back-btn" id="cancelNameBtn" style="margin-left:1.2rem;background:none;color:#6b7280;font-size:1.1rem;font-weight:600;">Cancel</button>
          </form>
        </div>
      `;
      // Add dark accent border/focus for quiz name input
      setTimeout(() => {
        const quizInput = document.getElementById('quizUserName');
        if (quizInput) {
          quizInput.style.border = '2.5px solid #232946';
          quizInput.style.boxShadow = '0 0 0 0.5px #23294633';
          quizInput.onfocus = function() {
            this.style.border = '2.5px solid #232946';
            this.style.boxShadow = '0 0 0 2px #23294633';
          };
          quizInput.onblur = function() {
            this.style.border = '2.5px solid #232946';
            this.style.boxShadow = '0 0 0 0.5px #23294633';
          };
          quizInput.classList.remove('border-red-400');
        }
      }, 0);
      document.getElementById('cancelNameBtn').onclick = renderAttemptsList;
      document.getElementById('nameForm').onsubmit = (e) => {
        e.preventDefault();
        const userName = document.getElementById('quizUserName').value.trim();
        if (!userName) {
          const quizInput = document.getElementById('quizUserName');
          quizInput.style.border = '2.5px solid #e11d48';
          quizInput.style.boxShadow = '0 0 0 2px #e11d4833';
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
                <button type="button" id="prevBtn" class="glass-btn" style="background:#f3f4f6;color:#9ca3af;font-weight:700;box-shadow:none;opacity:${currentStep===0?'0.55':'1'};pointer-events:${currentStep===0?'none':'auto'};">Previous</button>
                <button type="submit" id="nextBtn" class="glass-btn" style="background:#232946;color:#fff;font-weight:700;min-width:140px;opacity:0.92;transition:background 0.18s;">${currentStep===totalSteps-1?'Finish':'Next'}</button>
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
        // Add dark hover for Finish/Next button
        setTimeout(() => {
          const nextBtn = document.getElementById('nextBtn');
          if (nextBtn) {
            nextBtn.onmouseover = function() {
              this.style.background = '#181824';
              this.style.opacity = '1';
              this.style.boxShadow = '0 8px 32px #23294633';
            };
            nextBtn.onmouseout = function() {
              this.style.background = '#232946';
              this.style.opacity = '0.92';
              this.style.boxShadow = '0 4px 24px #23294633';
            };
            nextBtn.onfocus = function() {
              this.style.background = '#181824';
              this.style.opacity = '1';
              this.style.boxShadow = '0 8px 32px #23294633';
            };
            nextBtn.onblur = function() {
              this.style.background = '#232946';
              this.style.opacity = '0.92';
              this.style.boxShadow = '0 4px 24px #23294633';
            };
          }
        }, 0);
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

// Add modal logic at the end of the file
function showDeleteModal(onConfirm) {
  // Remove any existing modal
  const old = document.getElementById('modalOverlay');
  if (old) old.remove();
  const overlay = document.createElement('div');
  overlay.id = 'modalOverlay';
  overlay.style.position = 'fixed';
  overlay.style.top = 0;
  overlay.style.left = 0;
  overlay.style.width = '100vw';
  overlay.style.height = '100vh';
  overlay.style.background = 'rgba(24,24,36,0.72)';
  overlay.style.zIndex = 9999;
  overlay.style.display = 'flex';
  overlay.style.justifyContent = 'center';
  overlay.style.alignItems = 'center';
  overlay.innerHTML = `
    <div style="background:#fff;padding:2.2em 2em 1.5em 2em;border-radius:1.3em;box-shadow:0 8px 40px rgba(24,24,36,0.18);max-width:95vw;width:360px;text-align:center;">
      <div style="font-size:1.18rem;font-weight:700;color:#181824;margin-bottom:1.2em;">Delete Calculator</div>
      <div style="font-size:1.05rem;color:#232946;margin-bottom:2.1em;">Are you sure you want to delete this calculator? This cannot be undone.</div>
      <div style="display:flex;gap:1.2em;justify-content:center;">
        <button id="modalCancelBtn" style="background:#f3f4f6;color:#232946;font-weight:700;padding:0.7em 2.1em;border-radius:0.9em;font-size:1.08rem;border:none;cursor:pointer;">Cancel</button>
        <button id="modalOkBtn" style="background:#e11d48;color:#fff;font-weight:700;padding:0.7em 2.1em;border-radius:0.9em;font-size:1.08rem;border:none;cursor:pointer;">Delete</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  document.getElementById('modalCancelBtn').onclick = () => overlay.remove();
  document.getElementById('modalOkBtn').onclick = () => {
    overlay.remove();
    onConfirm();
  };
  overlay.onclick = (e) => { if (e.target === overlay) overlay.remove(); };
  setTimeout(() => { document.getElementById('modalCancelBtn').focus(); }, 50);
} 