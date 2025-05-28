// --- Local Storage Utilities ---
function getLocal(key, fallback) {
  try {
    const val = localStorage.getItem(key);
    return val ? JSON.parse(val) : fallback;
  } catch {
    return fallback;
  }
}
function setLocal(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// --- Data Model ---
// calculators: [{id, title, purpose, created_at, fields: [{id, name, weight, options: [{id, label, value}]}]}]
// quiz_attempts: [{id, calculator_id, user_name, answers, score, created_at}]
function generateId() { return '_' + Math.random().toString(36).slice(2, 10) + Date.now(); }

// --- Supabase Hybrid Storage Setup ---
const SUPABASE_URL = 'https://jckwvrzcjuggnfcbogrr.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impja3d2cnpjanVnZ25mY2JvZ3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA2OTIwMTYsImV4cCI6MjA1NjI2ODAxNn0.p2a0om1X40AJVhldUdtaU-at0SSPz6hLbrAg-ELHcnY';
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// --- Hybrid Storage Utilities ---
let isOnline = true;
let syncQueue = [];

function showSyncStatus(status) {
  let el = document.getElementById('syncStatus');
  if (!el) {
    el = document.createElement('div');
    el.id = 'syncStatus';
    el.style.position = 'fixed';
    el.style.bottom = '18px';
    el.style.right = '18px';
    el.style.zIndex = 9999;
    el.style.padding = '0.7em 1.5em';
    el.style.borderRadius = '1.1em';
    el.style.fontWeight = '700';
    el.style.fontSize = '1.08rem';
    el.style.boxShadow = '0 2px 12px #23294622';
    document.body.appendChild(el);
  }
  if (status === 'offline') {
    el.textContent = 'Offline: changes will sync when online';
    el.style.background = '#fef08a';
    el.style.color = '#b45309';
    el.style.display = 'block';
  } else if (status === 'syncing') {
    el.textContent = 'Syncing changes...';
    el.style.background = '#6366f1';
    el.style.color = '#fff';
    el.style.display = 'block';
  } else {
    el.style.display = 'none';
  }
}

window.addEventListener('online', () => { isOnline = true; showSyncStatus('syncing'); processSyncQueue(); });
window.addEventListener('offline', () => { isOnline = false; showSyncStatus('offline'); });
if (!navigator.onLine) { isOnline = false; showSyncStatus('offline'); }

async function processSyncQueue() {
  if (!isOnline || !syncQueue.length) { showSyncStatus('offline'); return; }
  showSyncStatus('syncing');
  while (syncQueue.length) {
    const { type, data } = syncQueue.shift();
    try {
      if (type === 'saveCalculators') await supabase.from('calculators').upsert(data);
      if (type === 'saveQuizAttempts') await supabase.from('quiz_attempts').upsert(data);
    } catch (e) { syncQueue.unshift({ type, data }); break; }
  }
  showSyncStatus('');
}

// --- Hybrid CRUD for Calculators ---
async function getCalculators() {
  try {
    const { data, error } = await supabase.from('calculators').select('*');
    if (error) {
      console.error('Supabase getCalculators error:', error);
      throw error;
    }
    console.log('Supabase getCalculators success:', data);
    setLocal('calculators', data || []);
    return data || [];
  } catch (err) {
    console.error('getCalculators fallback to localStorage:', err);
    return getLocal('calculators', []);
  }
}
async function saveCalculators(calcs) {
  setLocal('calculators', calcs);
  if (isOnline) {
    try {
      await supabase.from('calculators').upsert(calcs);
      console.log('Supabase saveCalculators success:', calcs);
    } catch (err) {
      console.error('Supabase saveCalculators error:', err);
      syncQueue.push({ type: 'saveCalculators', data: calcs });
      showSyncStatus('offline');
    }
  } else {
    syncQueue.push({ type: 'saveCalculators', data: calcs });
    showSyncStatus('offline');
  }
}
async function getQuizAttempts() {
  try {
    const { data, error } = await supabase.from('quiz_attempts').select('*');
    if (error) {
      console.error('Supabase getQuizAttempts error:', error);
      throw error;
    }
    console.log('Supabase getQuizAttempts success:', data);
    setLocal('quiz_attempts', data || []);
    return data || [];
  } catch (err) {
    console.error('getQuizAttempts fallback to localStorage:', err);
    return getLocal('quiz_attempts', []);
  }
}
async function saveQuizAttempts(attempts) {
  setLocal('quiz_attempts', attempts);
  if (isOnline) {
    try {
      await supabase.from('quiz_attempts').upsert(attempts);
      console.log('Supabase saveQuizAttempts success:', attempts);
    } catch (err) {
      console.error('Supabase saveQuizAttempts error:', err);
      syncQueue.push({ type: 'saveQuizAttempts', data: attempts });
      showSyncStatus('offline');
    }
  } else {
    syncQueue.push({ type: 'saveQuizAttempts', data: attempts });
    showSyncStatus('offline');
  }
}

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
        <div class="step-progress-container">
          <div class="step-progress-bar"><div class="step-progress-bar-inner" style="width:33.3%"></div></div>
          <div class="progress-indicator step-label">Step 1 of 3</div>
        </div>
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
        <div class="step-progress-container mb-4">
          <div class="step-progress-bar"><div class="step-progress-bar-inner" style="width:66.6%"></div></div>
          <div class="progress-indicator step-label">Step 2 of 3</div>
        </div>
        <h2 class="text-3xl font-extrabold text-center mb-8 text-gray-800">Configure Fields</h2>
        <div id="fieldsList">
          ${calculator.fields.map((f, i) => `
            <div class="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-200 relative">
              <div class="flex items-center gap-2 mb-3">
                <input type="text" value="${f.name}" data-idx="${i}" class="field-name-input font-semibold text-base border border-gray-200 rounded-lg px-3 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-indigo-400" maxlength="24" required placeholder="Field label (e.g. Homework, Quiz)" aria-label="Field label (e.g. Homework, Quiz)" />
                <input type="number" value="${f.weight === 0 ? 0 : (f.weight || '')}" data-idx="${i}" class="field-weight-input w-24 border border-gray-200 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-indigo-400 ml-2" min="0" max="100" step="1" required placeholder="Weight %" aria-label="Weight (%)" />
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
      const names = calculator.fields.map(f => f.name.trim().toLowerCase());
      if (!e.target.value.trim() || names.filter(n => n === e.target.value.trim().toLowerCase()).length > 1) {
        inp.classList.add('border-red-400');
      }
    };
  });
  document.querySelectorAll('.field-weight-input').forEach(inp => {
    inp.addEventListener('blur', (e) => {
      const idx = e.target.getAttribute('data-idx');
      let val = e.target.value;
      if (val === '') val = '';
      else val = Math.max(0, Math.min(100, parseInt(val)));
      calculator.fields[idx].weight = (val === 0) ? '0' : val;
      renderStep2();
    });
    inp.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        inp.blur();
      }
    });
  });
  document.getElementById('backBtn2').onclick = () => {
    step = 1;
    renderStep1();
  };
  document.getElementById('fieldsForm').onsubmit = (e) => {
    e.preventDefault();
    let hasError = false;
    const names = calculator.fields.map(f => f.name.trim().toLowerCase());
    calculator.fields.forEach((f, i) => {
      const fieldInput = document.querySelector(`.field-name-input[data-idx='${i}']`);
      const weightInput = document.querySelector(`.field-weight-input[data-idx='${i}']`);
      if (!f.name.trim() || names.filter(n => n === f.name.trim().toLowerCase()).length > 1) {
        fieldInput.classList.add('border-red-400');
        hasError = true;
      }
      if (f.weight === '' || isNaN(f.weight) || f.weight < 0 || f.weight > 100) {
        weightInput.classList.add('border-red-400');
        hasError = true;
      }
    });
    if (!calculator.fields.length || hasError || totalWeight !== 100) {
      showCustomModal('Please fill in all fields, avoid duplicates, and ensure total weight is 100%.');
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
        <div class="step-progress-container mb-4">
          <div class="step-progress-bar"><div class="step-progress-bar-inner" style="width:100%"></div></div>
          <div class="progress-indicator step-label">Step 3 of 3</div>
        </div>
        <h2 class="text-3xl font-extrabold text-center mb-8 text-gray-800">Add Options for Each Field</h2>
        <div id="fieldsOptionsList">
          ${calculator.fields.map((f, i) => `
            <div class="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-200 relative">
              <div class="font-semibold text-base mb-2">${f.name} <span class="text-gray-500">(${f.weight}%)</span></div>
              <div id="optionsList${i}">
                ${(f.options||[]).map((opt, oi) => {
                  const percent = f.weight > 0 && !isNaN(opt.value) ? ((parseFloat(opt.value)/f.weight)*100).toFixed(0) : '';
                  return `
                    <div class="flex gap-2 items-center mb-2">
                      <input type="text" value="${opt.label}" data-idx="${i}" data-oidx="${oi}" class="option-label-input border border-gray-200 rounded-lg px-3 py-2 flex-1" maxlength="18" required placeholder="Option label (A, A+, B, etc.)" />
                      <input type="number" value="${f.weight == 0 ? 0 : percent}" data-idx="${i}" data-oidx="${oi}" class="option-percent-input border border-gray-200 rounded-lg px-3 py-2 w-24" placeholder="%" min="0" max="100" ${f.weight == 0 ? 'disabled' : ''} />
                      <span class="text-indigo-600 font-semibold" style="min-width:70px;display:inline-block;">${opt.value}/${f.weight}</span>
                      <button type="button" class="remove-option-btn text-red-500 text-lg font-bold ml-2" data-idx="${i}" data-oidx="${oi}" aria-label="Remove option">&times;</button>
                    </div>
                  `;
                }).join('')}
              </div>
              <div class="flex flex-row gap-2 items-center" style="margin-top:0;flex-wrap:wrap;">
                <input type="text" id="optionLabelInput${i}" class="border border-gray-200 rounded-lg px-3 py-2 flex-1" placeholder="Option label (A, A+, B, etc.)" maxlength="18" />
                <input type="number" id="optionPercentInput${i}" class="border border-gray-200 rounded-lg px-3 py-2 w-24" placeholder="%" min="0" max="100" ${f.weight == 0 ? 'disabled value=\"0\"' : ''} />
                <span id="optionPointsPreview${i}" class="text-indigo-600 font-semibold" style="min-width:70px;display:inline-block;"></span>
                <button type="button" class="add-option-btn bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl px-4 py-2" data-idx="${i}" style="height:44px;margin-left:8px;flex:0 0 auto;display:flex;align-items:center;justify-content:center;font-size:1.08rem;">+ Add Option</button>
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
  // Live update points preview for add-option row
  calculator.fields.forEach((f, i) => {
    const percentInput = document.getElementById(`optionPercentInput${i}`);
    const pointsPreview = document.getElementById(`optionPointsPreview${i}`);
    if (percentInput && pointsPreview) {
      percentInput.addEventListener('input', () => {
        let percent = parseFloat(percentInput.value);
        if (isNaN(percent) || percent < 0) percent = 0;
        if (percent > 100) percent = 100;
        const points = Math.round((percent / 100) * f.weight * 100) / 100;
        pointsPreview.textContent = `${points}/${f.weight}`;
      });
    }
  });
  // Add option logic: store points, not percent
  document.querySelectorAll('.add-option-btn').forEach(btn => {
    btn.onclick = (e) => {
      // Before adding, update fields from current DOM inputs
      document.querySelectorAll('.field-name-input').forEach(inp => {
        const idx = inp.getAttribute('data-idx');
        calculator.fields[idx].name = inp.value;
      });
      document.querySelectorAll('.field-weight-input').forEach(inp => {
        const idx = inp.getAttribute('data-idx');
        calculator.fields[idx].weight = parseFloat(inp.value);
      });
      // Also update all option label and percent values from DOM
      document.querySelectorAll('.option-label-input').forEach(inp => {
        const idx = inp.getAttribute('data-idx');
        const oidx = inp.getAttribute('data-oidx');
        if (calculator.fields[idx] && calculator.fields[idx].options && calculator.fields[idx].options[oidx]) {
          calculator.fields[idx].options[oidx].label = inp.value;
        }
      });
      document.querySelectorAll('.option-percent-input').forEach(inp => {
        const idx = inp.getAttribute('data-idx');
        const oidx = inp.getAttribute('data-oidx');
        if (calculator.fields[idx] && calculator.fields[idx].options && calculator.fields[idx].options[oidx]) {
          calculator.fields[idx].options[oidx].value = parseFloat(inp.value) * calculator.fields[idx].weight / 100;
        }
      });
      // Now add the option as before
      const idx = btn.getAttribute('data-idx');
      const labelInput = document.getElementById(`optionLabelInput${idx}`);
      const percentInput = document.getElementById(`optionPercentInput${idx}`);
      const label = labelInput.value.trim();
      let percent = percentInput.value.trim();
      labelInput.classList.remove('border-red-400');
      percentInput.classList.remove('border-red-400');
      const labels = (calculator.fields[idx].options || []).map(opt => opt.label.trim());
      let hasError = false;
      if (!label) { labelInput.classList.add('border-red-400'); hasError = true; }
      if (percent === '' || isNaN(percent)) { percentInput.classList.add('border-red-400'); hasError = true; }
      if (labels.includes(label)) { labelInput.classList.add('border-red-400'); hasError = true; }
      percent = Math.max(0, Math.min(100, parseFloat(percent)));
      const weight = calculator.fields[idx].weight;
      const points = Math.round((percent / 100) * weight * 100) / 100;
      if (hasError) return;
      calculator.fields[idx].options = calculator.fields[idx].options || [];
      calculator.fields[idx].options.push({ label, value: points });
      labelInput.value = '';
      percentInput.value = '';
      document.getElementById(`optionPointsPreview${idx}`).textContent = '';
      setTimeout(() => labelInput.focus(), 10);
      renderStep3();
    };
  });
  // Prevent Enter from submitting form on option label/percent inputs
  calculator.fields.forEach((f, i) => {
    document.querySelectorAll(`#optionsList${i} .option-label-input, #optionsList${i} .option-percent-input`).forEach(inp => {
      inp.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') e.preventDefault();
      });
    });
    // Label editing
    document.querySelectorAll(`#optionsList${i} .option-label-input`).forEach((inp, oi) => {
      inp.addEventListener('input', (e) => {
        calculator.fields[i].options[oi].label = inp.value;
      });
    });
    // Percent editing
    document.querySelectorAll(`#optionsList${i} .option-percent-input`).forEach((inp, oi) => {
      inp.addEventListener('input', (e) => {
        let percent = parseFloat(inp.value);
        if (isNaN(percent) || percent < 0) percent = 0;
        if (percent > 100) percent = 100;
        const points = Math.round((percent / 100) * f.weight * 100) / 100;
        calculator.fields[i].options[oi].value = points;
        // Update the points display
        const pointsSpan = inp.parentElement.querySelector('.text-indigo-600');
        if (pointsSpan) pointsSpan.textContent = `${points}/${f.weight}`;
      });
    });
  });
  // Attach remove-option-btn handlers after rendering
  calculator.fields.forEach((f, i) => {
    document.querySelectorAll(`#optionsList${i} .remove-option-btn`).forEach((btn, oi) => {
      btn.onclick = (e) => {
        calculator.fields[i].options.splice(oi, 1);
        renderStep3();
      };
    });
  });
  // Ensure cancel button always works
  const backBtn3 = document.getElementById('backBtn3');
  if (backBtn3) backBtn3.onclick = () => { step = 2; renderStep2(); };
  document.getElementById('optionsForm').onsubmit = async (e) => {
    e.preventDefault();
    // Remove the requirement for at least one valid option per field
    let hasError = false;
    calculator.fields.forEach((f, i) => {
      (f.options || []).forEach((opt, oi) => {
        if (!opt.label.trim() || isNaN(opt.value)) {
          hasError = true;
        }
      });
    });
    if (!calculator.fields.length || hasError) {
      alert('Please fix all option errors.');
      return;
    }
    // Save locally
    const calculators = await getCalculators();
    const newCalc = {
      id: generateId(),
      title: calculator.title,
      purpose: calculator.purpose,
      created_at: new Date().toISOString(),
      fields: calculator.fields.map((f, i) => ({
        id: generateId(),
        name: f.name,
        weight: parseInt(f.weight, 10),
        options: (f.options || []).map(opt => ({ id: generateId(), label: opt.label, value: parseFloat(opt.value) }))
      }))
    };
    calculators.unshift(newCalc);
    saveCalculators(calculators);
    const app = document.getElementById('app');
    app.innerHTML = `<div class="main-glass" style="padding:3rem 2rem;text-align:center;max-width:480px;margin:60px auto 0 auto;background:#23263a;color:#fff;box-shadow:0 8px 40px rgba(24,24,36,0.13);">
      <h2 style="font-size:2rem;font-weight:900;color:#fff;margin-bottom:1.5rem;">Calculator Saved!</h2>
      <p style="font-size:1.15rem;color:#fff;margin-bottom:2.5rem;">Your calculator has been saved. You can access it from <b style='color:#fff;'>Browse Calculators</b>.</p>
      <button class="glass-btn" style="background:#181824;color:#fff;font-weight:700;font-size:1.2rem;padding:1.1em 2.2em;border-radius:1.2em;box-shadow:0 4px 24px #18182433;transition:background 0.18s;" onclick="window.location.hash='#browse'">Go to Browse Calculators</button>
    </div>`;
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
  let calculators = await getCalculators();
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
    const createdAt = new Date(calc.created_at);
    createdAt.setHours(createdAt.getHours() + 3);
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
      const calcItem = btn.closest('.calc-item');
      const calcId = calcItem.getAttribute('data-id');
      if (!calcId) return;
      showDeleteModal(async () => {
        // Remove from DOM instantly
        if (calcItem) calcItem.remove();
        // Remove from localStorage
        let calculators = getCalculators();
        calculators = calculators.filter(c => c.id !== calcId);
        saveCalculators(calculators);
        // Remove related quiz attempts
        let attempts = getQuizAttempts();
        attempts = attempts.filter(a => a.calculator_id !== calcId);
        saveQuizAttempts(attempts);
        // If in detail view, return to list
        const calcDetail = document.getElementById('calcDetail');
        if (calcDetail && calcDetail.style.display === 'block') {
          calcDetail.style.display = 'none';
          const calcList = document.getElementById('calcList');
          if (calcList) calcList.style.display = 'block';
        }
        await fetchCalculatorsInline();
      });
    };
  });
  document.querySelectorAll('.calc-item').forEach(item => {
    item.onclick = () => showCalculatorInline(item.getAttribute('data-id'));
    item.onkeydown = (e) => { if (e.key === 'Enter' || e.key === ' ') item.click(); };
  });
}

// --- Replace showCalculatorInline and all quiz/attempt logic to use localStorage ---
async function showCalculatorInline(id) {
  const calcList = document.getElementById('calcList');
  const calcDetail = document.getElementById('calcDetail');
  // Hide search bar when showing details/quiz
  const searchBar = document.getElementById('searchBarContainer');
  if (searchBar) searchBar.style.display = 'none';
  calcList.style.display = 'none';
  calcDetail.style.display = 'block';
  calcDetail.innerHTML = 'Loading...';
  // Fetch calculator and attempts from localStorage
  const calculators = await getCalculators();
  const calc = calculators.find(c => c.id === id);
  if (!calc) {
    calcDetail.innerHTML = `<div style='color:#f87171;'>Calculator not found.</div><button class='back-btn' onclick='fetchCalculatorsInline()'>Back to List</button>`;
    return;
  }
  const attempts = (await getQuizAttempts()).filter(a => a.calculator_id === id);

  // --- Render previous attempts and New Quiz button ---
  async function renderAttemptsList() {
    // Always fetch latest attempts from localStorage
    let allAttempts = await getQuizAttempts();
    let attempts = allAttempts.filter(a => a.calculator_id === id);
    // Sorting state
    let sortBy = window._quizSortBy || 'date';
    let sortDir = window._quizSortDir || 'desc';
    // Sorting controls UI
    calcDetail.innerHTML = `
      <div class="quiz-card" style="max-width:480px;margin:40px auto 0 auto;padding:2.5rem 2rem 2rem 2rem;background:#fff;border-radius:20px;box-shadow:0 4px 32px rgba(60,72,100,0.10);border:2px solid #e5e7eb;position:relative;">
        <button id="backBtn" aria-label="Back to List" style="position:absolute;top:18px;left:18px;background:none;border:none;cursor:pointer;padding:0;margin:0;display:flex;align-items:center;z-index:2;">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        </button>
        <div style="position:absolute;top:18px;right:18px;z-index:2;" class="action-btn-group">
          <button class="options-menu-btn" id="calcOptionsBtn" aria-label="Calculator Options" aria-haspopup="true" aria-expanded="false">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#232946" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>
          </button>
          <div class="options-menu" id="calcOptionsMenu" role="menu" aria-label="Calculator options">
            <button class="options-menu-item" data-action="rename" role="menuitem" tabindex="-1">Rename</button>
            <button class="options-menu-item" data-action="edit" role="menuitem" tabindex="-1">Edit</button>
          </div>
        </div>
        <h2 style="font-size:1.5rem;font-weight:800;color:#181824;margin-bottom:1.5rem;margin-top:0.2rem;text-align:center;">Previous Attempts</h2>
        <div style="display:flex;gap:1.2em;align-items:center;justify-content:flex-end;margin-bottom:1.2em;">
          <label for="sortBySelect" style="font-size:1.02em;color:#6366f1;font-weight:600;">Sort by:</label>
          <select id="sortBySelect" style="font-size:1.02em;padding:0.3em 1em;border-radius:0.7em;border:1.5px solid #e5e7eb;background:#f9fafb;color:#232946;font-weight:600;">
            <option value="date">Date</option>
            <option value="score">Score</option>
          </select>
          <button id="sortDirBtn" style="background:none;border:none;color:#6366f1;font-size:1.2em;cursor:pointer;display:flex;align-items:center;" aria-label="Toggle sort direction">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 15 12 9 18 15"/></svg>
          </button>
        </div>
        <div style="margin-bottom:2rem;">
          ${(() => {
            let sorted = [...attempts];
            if (sortBy === 'score') sorted.sort((a, b) => sortDir === 'asc' ? a.score - b.score : b.score - a.score);
            else sorted.sort((a, b) => sortDir === 'asc' ? new Date(a.created_at) - new Date(b.created_at) : new Date(b.created_at) - new Date(a.created_at));
            return sorted.map((a, idx) => `
              <div class="quiz-attempt-row" data-id="${a.id}">
                <div style="display:flex;align-items:center;gap:1.1em;">
                  <span class="serial-num" style="font-size:1.1em;font-weight:700;color:#6366f1;min-width:2.2em;display:inline-block;text-align:right;">${idx+1}</span>
                  <div class="quiz-attempt-info">
                    <span class="quiz-attempt-name">${a.user_name}</span>
                    <span class="quiz-attempt-score">Score: ${a.score}</span>
                  </div>
                </div>
                <div class="quiz-attempt-options">
                  <button class="options-menu-btn" aria-label="Options" aria-haspopup="true" aria-expanded="false" data-id="${a.id}">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#232946" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="5" cy="12" r="1.5"/><circle cx="12" cy="12" r="1.5"/><circle cx="19" cy="12" r="1.5"/></svg>
                  </button>
                  <div class="options-menu" id="optionsMenu${a.id}" role="menu" aria-label="Quiz options">
                    <button class="options-menu-item" data-action="rename" data-id="${a.id}" role="menuitem" tabindex="-1">Rename</button>
                    <button class="options-menu-item" data-action="edit" data-id="${a.id}" role="menuitem" tabindex="-1">Edit</button>
                    <button class="options-menu-item" data-action="duplicate" data-id="${a.id}" role="menuitem" tabindex="-1">Duplicate</button>
                    <button class="options-menu-item danger" data-action="delete" data-id="${a.id}" role="menuitem" tabindex="-1">Delete</button>
                  </div>
                </div>
              </div>
            `).join('');
          })()}
        </div>
        <div style="display:flex;justify-content:center;align-items:center;margin-top:1.5rem;">
          <button class="glass-btn new-quiz-btn" id="startQuizBtn">New Quiz</button>
        </div>
      </div>
    `;
    // Sorting controls logic
    document.getElementById('sortBySelect').value = sortBy;
    document.getElementById('sortDirBtn').innerHTML = sortDir === 'asc'
      ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 15 12 9 18 15"/></svg>`
      : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6366f1" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>`;
    document.getElementById('sortBySelect').onchange = (e) => {
      window._quizSortBy = e.target.value;
      renderAttemptsList();
    };
    document.getElementById('sortDirBtn').onclick = () => {
      window._quizSortDir = (window._quizSortDir === 'asc' ? 'desc' : 'asc');
      renderAttemptsList();
    };
    document.getElementById('startQuizBtn').onclick = () => renderNamePrompt();
    document.getElementById('backBtn').onclick = async () => {
      calcDetail.style.display = 'none';
      calcList.style.display = 'block';
      // Show search bar again
      const searchBar = document.getElementById('searchBarContainer');
      if (searchBar) searchBar.style.display = 'flex';
      await fetchCalculatorsInline();
    };
    // Calculator options menu logic
    const calcOptionsBtn = document.getElementById('calcOptionsBtn');
    const calcOptionsMenu = document.getElementById('calcOptionsMenu');
    if (calcOptionsBtn && calcOptionsMenu) {
      calcOptionsBtn.onclick = (e) => {
        e.stopPropagation();
        const expanded = calcOptionsBtn.getAttribute('aria-expanded') === 'true';
        document.querySelectorAll('.options-menu').forEach(m => { if (m !== calcOptionsMenu) m.classList.remove('open'); });
        document.querySelectorAll('.options-menu-btn').forEach(b => b.setAttribute('aria-expanded', 'false'));
        if (!expanded) {
          calcOptionsMenu.classList.add('open');
          calcOptionsBtn.setAttribute('aria-expanded', 'true');
          setTimeout(() => { const first = calcOptionsMenu.querySelector('.options-menu-item'); if (first) first.focus(); }, 10);
        } else {
          calcOptionsMenu.classList.remove('open');
          calcOptionsBtn.setAttribute('aria-expanded', 'false');
        }
      };
      // Menu actions
      calcOptionsMenu.querySelectorAll('.options-menu-item').forEach(item => {
        item.onclick = async (e) => {
          const action = item.getAttribute('data-action');
          if (action === 'rename') {
            showRenameModal({
              title: 'Rename Calculator',
              label: 'Enter new calculator name:',
              initial: calc.title,
              onSave: (newName) => {
                const calculators = getCalculators();
                const idx = calculators.findIndex(c => c.id === calc.id);
                if (idx !== -1) {
                  calculators[idx].title = newName;
                  saveCalculators(calculators);
                  showCustomModal('Calculator renamed!');
                  setTimeout(() => showCalculatorInline(calc.id), 500);
                }
              }
            });
          } else if (action === 'edit') {
            renderEditCalculator(calc);
          }
          calcOptionsMenu.classList.remove('open');
          calcOptionsBtn.setAttribute('aria-expanded', 'false');
        };
      });
    }
    // Quiz row options menu logic
    document.querySelectorAll('.quiz-attempt-options .options-menu-btn').forEach(btn => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const id = btn.getAttribute('data-id');
        const menu = document.getElementById(`optionsMenu${id}`);
        document.querySelectorAll('.quiz-attempt-options .options-menu').forEach(m => { if (m !== menu) m.classList.remove('open'); });
        document.querySelectorAll('.quiz-attempt-options .options-menu-btn').forEach(b => b.setAttribute('aria-expanded', 'false'));
        const expanded = btn.getAttribute('aria-expanded') === 'true';
        if (!expanded) {
          menu.classList.add('open');
          btn.setAttribute('aria-expanded', 'true');
          setTimeout(() => { const first = menu.querySelector('.options-menu-item'); if (first) first.focus(); }, 10);
        } else {
          menu.classList.remove('open');
          btn.setAttribute('aria-expanded', 'false');
        }
      };
    });
    document.addEventListener('click', function closeQuizMenus(e) {
      if (!e.target.closest('.quiz-attempt-options')) {
        document.querySelectorAll('.quiz-attempt-options .options-menu').forEach(m => m.classList.remove('open'));
        document.querySelectorAll('.quiz-attempt-options .options-menu-btn').forEach(b => b.setAttribute('aria-expanded', 'false'));
      }
    });
    document.querySelectorAll('.quiz-attempt-options .options-menu').forEach(menu => {
      menu.querySelectorAll('.options-menu-item').forEach(item => {
        item.onclick = async (e) => {
          const action = item.getAttribute('data-action');
          const attemptId = item.getAttribute('data-id');
          if (action === 'rename') {
            const quizNameCell = item.closest('.quiz-attempt-row').querySelector('.quiz-attempt-name');
            const oldName = quizNameCell ? quizNameCell.textContent : '';
            showRenameModal({
              title: 'Rename Quiz',
              label: 'Enter new quiz name:',
              initial: oldName,
              onSave: async (newName) => {
                let attempts = await getQuizAttempts();
                const idx = attempts.findIndex(a => a.id === attemptId);
                if (idx !== -1) {
                  attempts[idx].user_name = newName;
                  saveQuizAttempts(attempts);
                  if (quizNameCell) quizNameCell.textContent = newName;
                  showCustomModal('Quiz renamed!');
                }
              }
            });
          } else if (action === 'edit') {
            const attempts = await getQuizAttempts();
            const attempt = attempts.find(a => a.id === attemptId);
            if (!attempt) return;
            const prevAnswers = attempt.answers;
            renderQuizStep(attempt.user_name, prevAnswers, attemptId);
          } else if (action === 'delete') {
            showDeleteModal(async () => {
              let attempts = await getQuizAttempts();
              attempts = attempts.filter(a => a.id !== attemptId);
              saveQuizAttempts(attempts);
              // Remove row instantly
              const row = item.closest('.quiz-attempt-row');
              if (row) row.remove();
            });
          } else if (action === 'duplicate') {
            let attempts = await getQuizAttempts();
            const attempt = attempts.find(a => a.id === attemptId);
            if (!attempt) return;
            // Generate unique name
            let baseName = attempt.user_name.replace(/\(\d+\)$/, '').trim();
            let name = baseName;
            let counter = 1;
            const names = attempts.map(a => a.user_name);
            while (names.includes(name)) {
              name = `${baseName}(${counter})`;
              counter++;
            }
            const newAttempt = {
              ...attempt,
              id: generateId(),
              user_name: name,
              created_at: new Date().toISOString()
            };
            let newAttempts = [newAttempt, ...attempts];
            saveQuizAttempts(newAttempts);
            renderAttemptsList();
            setTimeout(() => {
              const rows = document.querySelectorAll('.quiz-attempt-row');
              if (rows && rows[0]) {
                rows[0].style.transition = 'background 0.7s, box-shadow 0.7s';
                rows[0].style.background = '#fef08a';
                rows[0].style.boxShadow = '0 0 0 4px #fde68a';
                setTimeout(() => {
                  rows[0].style.background = '';
                  rows[0].style.boxShadow = '';
                }, 700);
              }
            }, 100);
            return;
          }
          menu.classList.remove('open');
          const btn = menu.parentElement.querySelector('.options-menu-btn');
          if (btn) btn.setAttribute('aria-expanded', 'false');
        };
      });
    });
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
  function renderQuizStep(userName, prevAnswers = [], editAttemptId = null) {
    // Only include fields with options
    const quizFields = calc.fields.filter(f => (f.options && f.options.length > 0));
    // If editing, show all questions at once
    if (editAttemptId) {
      // Render all questions and options in a single form
      calcDetail.innerHTML = `
        <div class="quiz-card" style="max-width:520px;margin:40px auto 0 auto;padding:2.5rem 2rem 2rem 2rem;background:#fff;border-radius:20px;box-shadow:0 4px 32px rgba(60,72,100,0.10);border:2px solid #e5e7eb;position:relative;">
          <h2 style="font-size:1.5rem;font-weight:800;color:#181824;margin-bottom:1.5rem;text-align:center;">Edit Quiz Answers</h2>
          <form id="editQuizForm">
            <div style="display:flex;flex-direction:column;gap:2.2rem;">
              ${quizFields.map((field, qIdx) => `
                <div style="background:#f9fafb;border-radius:1.1em;padding:1.2em 1em 1.2em 1em;border:1.5px solid #e5e7eb;">
                  <div style="font-size:1.18rem;font-weight:700;color:#232946;margin-bottom:1.1em;">${field.name}</div>
                  <div style="display:flex;flex-direction:column;gap:0.7em;">
                    ${field.options.map((opt, oIdx) => `
                      <label style="display:flex;align-items:center;gap:1rem;padding:0.9rem 1.1rem;border-radius:0.9rem;border:1.5px solid #e5e7eb;background:${prevAnswers[qIdx]==oIdx?'#f3f4f6':'#fff'};cursor:pointer;transition:background 0.18s;">
                        <input type="radio" name="q${qIdx}" value="${oIdx}" ${prevAnswers[qIdx]==oIdx?'checked':''} style="accent-color:#181824;width:1.2em;height:1.2em;"/>
                        <span style="font-size:1.08rem;font-weight:500;color:#181824;">${opt.label}</span>
                      </label>
                    `).join('')}
                  </div>
                </div>
              `).join('')}
            </div>
            <div style="display:flex;justify-content:center;align-items:center;margin-top:2.5rem;">
              <button type="submit" class="glass-btn next-btn" style="min-width:160px;font-size:1.13rem;">Save</button>
              <button type="button" class="glass-btn" id="cancelEditQuizBtn" style="margin-left:1.2rem;background:#f3f4f6;color:#232946;">Cancel</button>
            </div>
          </form>
        </div>
      `;
      document.getElementById('cancelEditQuizBtn').onclick = renderAttemptsList;
      document.getElementById('editQuizForm').onsubmit = (e) => {
        e.preventDefault();
        // Gather answers from all questions
        const newAnswers = quizFields.map((field, qIdx) => {
          const selected = document.querySelector(`input[name='q${qIdx}']:checked`);
          return selected ? parseInt(selected.value) : null;
        });
        renderQuizResult(userName, newAnswers, editAttemptId);
      };
      return;
    }
    let currentStep = 0;
    const answers = prevAnswers.length ? [...prevAnswers] : Array(quizFields.length).fill(null);
    const totalSteps = quizFields.length;
    function showStep() {
      calcDetail.innerHTML = `
        <div class="quiz-card" style="max-width:480px;margin:40px auto 0 auto;padding:2.5rem 2rem 2rem 2rem;background:#fff;border-radius:20px;box-shadow:0 4px 32px rgba(60,72,100,0.10);border:2px solid #e5e7eb;position:relative;">
          <div style="height:10px;background:#f3f4f6;border-radius:8px;overflow:hidden;margin-bottom:1.5rem;">
            <div style="height:100%;width:${((currentStep+1)/totalSteps)*100}%;background:#181824;transition:width 0.3s;"></div>
          </div>
          <div style="text-align:center;margin-bottom:0.7rem;font-size:1.1rem;font-weight:600;color:#6b7280;">Question ${currentStep+1} of ${totalSteps}</div>
          <div style="text-align:center;font-size:2rem;font-weight:800;color:#181824;margin-bottom:2rem;">${quizFields[currentStep].name}</div>
          <form id="quizForm">
            <div style="display:flex;flex-direction:column;gap:1.1rem;">
              ${quizFields[currentStep].options.map((opt, i) => `
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
      document.getElementById('quizForm').onsubmit = async (e) => {
        e.preventDefault();
        const selected = document.querySelector('input[name="option"]:checked');
        if (!selected) return;
        answers[currentStep] = parseInt(selected.value);
        if (currentStep < totalSteps - 1) {
          currentStep++;
          showStep();
        } else {
          await renderQuizResult(userName, answers, editAttemptId);
        }
      };
      document.querySelectorAll('input[name="option"]').forEach((input, i) => {
        input.onchange = () => {
          answers[currentStep] = parseInt(input.value);
          showStep();
        };
      });
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
  async function renderQuizResult(userName, answers, editAttemptId = null) {
    let total = 0;
    // Only consider fields with options, and map answers accordingly
    const quizFields = calc.fields.filter(f => (f.options && f.options.length > 0));
    quizFields.forEach((f, i) => {
      const answerIdx = answers[i];
      if (answerIdx != null && f.options[answerIdx]) {
        const val = parseFloat(f.options[answerIdx].value);
        if (!isNaN(val)) total += val;
      }
    });
    // Ensure unique quiz name
    if (!editAttemptId) {
      let baseName = userName;
      let name = baseName;
      let counter = 1;
      const existingNames = attempts.map(a => a.user_name);
      while (existingNames.includes(name)) {
        name = `${baseName}(${counter})`;
        counter++;
      }
      userName = name;
    }
    let quizAttempts = await getQuizAttempts();
    if (editAttemptId) {
      // Update existing attempt
      const idx = quizAttempts.findIndex(a => a.id === editAttemptId);
      if (idx !== -1) {
        quizAttempts[idx].user_name = userName;
        quizAttempts[idx].answers = answers;
        quizAttempts[idx].score = total;
        saveQuizAttempts(quizAttempts);
      }
    } else {
      // Insert new attempt
      quizAttempts.unshift({
        id: generateId(),
        calculator_id: id,
        user_name: userName,
        answers,
        score: total,
        created_at: new Date().toISOString()
      });
      saveQuizAttempts(quizAttempts);
    }
    // Refetch attempts and show list
    attempts.length = 0;
    attempts.push(...((await getQuizAttempts()).filter(a => a.calculator_id === id)));
    renderAttemptsList();
  }

  // Initial render
  renderAttemptsList();
}

// Navigation logic
function setActiveNav(hash) {
  document.querySelectorAll('nav a, aside .sidebar-link').forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === hash) link.classList.add('active');
    if (hash === '#' && link.getAttribute('href') === '#') link.classList.add('active');
  });
}

// Add scale-in animation to modal content for all modals
if (!document.getElementById('modalAnimStyle')) {
  const style = document.createElement('style');
  style.id = 'modalAnimStyle';
  style.innerHTML = `
    .modern-modal-content, .delete-modal-content {
      animation: modalPopIn 0.18s cubic-bezier(.4,1.4,.6,1) both;
    }
    @keyframes modalPopIn {
      0% { opacity: 0; transform: translate(-50%,-50%) scale(0.95); }
      100% { opacity: 1; transform: translate(-50%,-50%) scale(1); }
    }
  `;
  document.head.appendChild(style);
}

// Add a function to update all attempts' scores when calculator is edited (local version)
function updateAllAttemptScoresLocal(calc) {
  let attempts = getQuizAttempts();
  let changedIds = [];
  // Only consider fields with options for score calculation
  const quizFields = (calc.fields || []).filter(f => (f.options && f.options.length > 0));
  for (let i = 0; i < attempts.length; i++) {
    const a = attempts[i];
    if (a.calculator_id !== calc.id) continue;
    let total = 0;
    quizFields.forEach((f, idx) => {
      const answerIdx = a.answers[idx];
      if (answerIdx != null && f.options[answerIdx]) {
        const val = parseFloat(f.options[answerIdx].value);
        if (!isNaN(val)) total += val;
      }
    });
    if (a.score !== total) {
      attempts[i].score = total;
      changedIds.push(a.id);
    }
  }
  saveQuizAttempts(attempts);
  // Animate score changes in UI
  setTimeout(() => {
    document.querySelectorAll('.quiz-attempt-score').forEach(cell => {
      cell.style.transition = 'background 0.7s, color 0.7s';
      cell.style.background = '#fef08a';
      cell.style.color = '#b45309';
      setTimeout(() => {
        cell.style.background = '';
        cell.style.color = '';
      }, 700);
    });
  }, 200);
}

// --- Refactor renderEditCalculator to use percent input and live points preview ---
function renderEditCalculator(calc) {
  const calcDetail = document.getElementById('calcDetail');
  let fields = JSON.parse(JSON.stringify(calc.fields));
  let title = calc.title;
  calcDetail.innerHTML = `
    <div class="quiz-card" style="max-width:520px;margin:40px auto 0 auto;padding:2.5rem 2rem 2rem 2rem;background:#fff;border-radius:20px;box-shadow:0 4px 32px rgba(60,72,100,0.10);border:2px solid #e5e7eb;position:relative;">
      <h2 style="font-size:1.5rem;font-weight:800;color:#181824;margin-bottom:1.5rem;text-align:center;">Edit Calculator</h2>
      <form id="editCalcForm">
        <label class="glass-label">Title</label>
        <input type="text" id="editCalcTitle" class="glass-input" maxlength="32" value="${title}" required style="margin-bottom:1.2rem;" />
        <label class="glass-label">Purpose</label>
        <input type="text" id="editCalcPurpose" class="glass-input" maxlength="80" value="${calc.purpose || ''}" required style="margin-bottom:1.2rem;" />
        <div id="editFieldsList">
          ${fields.map((f, i) => `
            <div class="bg-gray-50 rounded-xl p-4 mb-4 border border-gray-200 relative">
              <div class="flex items-center gap-2 mb-3">
                <input type="text" value="${f.name}" data-idx="${i}" class="field-name-input font-semibold text-base border border-gray-200 rounded-lg px-3 py-2 flex-1 focus:outline-none focus:ring-2 focus:ring-indigo-400" maxlength="24" required placeholder="Field label (e.g. Homework, Quiz)" aria-label="Field label (e.g. Homework, Quiz)" />
                <input type="number" value="${f.weight === 0 ? 0 : (f.weight || '')}" data-idx="${i}" class="field-weight-input w-24 border border-gray-200 rounded-lg px-3 py-2 text-base focus:outline-none focus:ring-2 focus:ring-indigo-400 ml-2" min="0" max="100" step="1" required placeholder="Weight %" aria-label="Weight (%)" />
                <span class="text-gray-500 text-sm ml-1">%</span>
              </div>
              <div id="editOptionsList${i}">
                ${(f.options||[]).map((opt, oi) => {
                  const percent = f.weight > 0 && !isNaN(opt.value) ? ((parseFloat(opt.value)/f.weight)*100).toFixed(0) : '';
                  return `
                    <div class="flex gap-2 items-center mb-2">
                      <input type="text" value="${opt.label}" data-idx="${i}" data-oidx="${oi}" class="option-label-input border border-gray-200 rounded-lg px-3 py-2 flex-1" maxlength="18" required placeholder="Option label (A, A+, B, etc.)" />
                      <input type="number" value="${f.weight == 0 ? 0 : percent}" data-idx="${i}" data-oidx="${oi}" class="option-percent-input border border-gray-200 rounded-lg px-3 py-2 w-24" placeholder="%" min="0" max="100" ${f.weight == 0 ? 'disabled' : ''} />
                      <span class="text-indigo-600 font-semibold" style="min-width:70px;display:inline-block;">${opt.value}/${f.weight}</span>
                    </div>
                  `;
                }).join('')}
              </div>
              <div class="flex flex-row gap-2 items-center" style="margin-top:0;flex-wrap:wrap;">
                <input type="text" id="optionLabelInput${i}" class="border border-gray-200 rounded-lg px-3 py-2 flex-1" placeholder="Option label (A, A+, B, etc.)" maxlength="18" />
                <input type="number" id="optionPercentInput${i}" class="border border-gray-200 rounded-lg px-3 py-2 w-24" placeholder="%" min="0" max="100" ${f.weight == 0 ? 'disabled value=\"0\"' : ''} />
                <span id="optionPointsPreview${i}" class="text-indigo-600 font-semibold" style="min-width:70px;display:inline-block;"></span>
                <button type="button" class="add-option-btn bg-gray-900 hover:bg-gray-800 text-white font-bold rounded-xl px-4 py-2" data-idx="${i}" style="height:44px;margin-left:8px;flex:0 0 auto;display:flex;align-items:center;justify-content:center;font-size:1.08rem;">+ Add Option</button>
              </div>
            </div>
          `).join('')}
        </div>
        <div class="flex gap-4 mt-6">
          <button type="button" id="cancelEditBtn" class="glass-btn">Cancel</button>
          <button type="submit" class="glass-btn next-btn">Save Changes</button>
        </div>
      </form>
    </div>
  `;
  // Live update points preview for add-option row
  fields.forEach((f, i) => {
    const percentInput = document.getElementById(`optionPercentInput${i}`);
    const pointsPreview = document.getElementById(`optionPointsPreview${i}`);
    if (percentInput && pointsPreview) {
      percentInput.addEventListener('input', () => {
        let percent = parseFloat(percentInput.value);
        if (isNaN(percent) || percent < 0) percent = 0;
        if (percent > 100) percent = 100;
        const points = Math.round((percent / 100) * f.weight * 100) / 100;
        pointsPreview.textContent = `${points}/${f.weight}`;
      });
    }
  });
  // Add option logic: store points, not percent
  document.querySelectorAll('.add-option-btn').forEach(btn => {
    btn.onclick = (e) => {
      // Before adding, update fields from current DOM inputs
      document.querySelectorAll('.field-name-input').forEach(inp => {
        const idx = inp.getAttribute('data-idx');
        fields[idx].name = inp.value;
      });
      document.querySelectorAll('.field-weight-input').forEach(inp => {
        const idx = inp.getAttribute('data-idx');
        fields[idx].weight = parseFloat(inp.value);
      });
      // Also update all option label and percent values from DOM
      document.querySelectorAll('.option-label-input').forEach(inp => {
        const idx = inp.getAttribute('data-idx');
        const oidx = inp.getAttribute('data-oidx');
        if (fields[idx] && fields[idx].options && fields[idx].options[oidx]) {
          fields[idx].options[oidx].label = inp.value;
        }
      });
      document.querySelectorAll('.option-percent-input').forEach(inp => {
        const idx = inp.getAttribute('data-idx');
        const oidx = inp.getAttribute('data-oidx');
        if (fields[idx] && fields[idx].options && fields[idx].options[oidx]) {
          fields[idx].options[oidx].value = parseFloat(inp.value) * fields[idx].weight / 100;
        }
      });
      // Now add the option as before
      const idx = btn.getAttribute('data-idx');
      const labelInput = document.getElementById(`optionLabelInput${idx}`);
      const percentInput = document.getElementById(`optionPercentInput${idx}`);
      const label = labelInput.value.trim();
      let percent = percentInput.value.trim();
      labelInput.classList.remove('border-red-400');
      percentInput.classList.remove('border-red-400');
      const labels = (fields[idx].options || []).map(opt => opt.label.trim());
      let hasError = false;
      if (!label) { labelInput.classList.add('border-red-400'); hasError = true; }
      if (percent === '' || isNaN(percent)) { percentInput.classList.add('border-red-400'); hasError = true; }
      if (labels.includes(label)) { labelInput.classList.add('border-red-400'); hasError = true; }
      percent = Math.max(0, Math.min(100, parseFloat(percent)));
      const weight = fields[idx].weight;
      const points = Math.round((percent / 100) * weight * 100) / 100;
      if (hasError) return;
      fields[idx].options = fields[idx].options || [];
      fields[idx].options.push({ label, value: points });
      labelInput.value = '';
      percentInput.value = '';
      document.getElementById(`optionPointsPreview${idx}`).textContent = '';
      setTimeout(() => labelInput.focus(), 10);
      // Deep clone fields to avoid reference issues
      const newFields = JSON.parse(JSON.stringify(fields));
      renderEditCalculator({ ...calc, fields: newFields });
    };
  });
  document.getElementById('cancelEditBtn').onclick = () => showCalculatorInline(calc.id);
  document.getElementById('editCalcForm').onsubmit = (e) => {
    e.preventDefault();
    // Before validation, update fields/options from DOM inputs
    document.querySelectorAll('.field-name-input').forEach(inp => {
      const idx = inp.getAttribute('data-idx');
      fields[idx].name = inp.value;
    });
    document.querySelectorAll('.field-weight-input').forEach(inp => {
      const idx = inp.getAttribute('data-idx');
      fields[idx].weight = parseFloat(inp.value);
    });
    document.querySelectorAll('.option-label-input').forEach(inp => {
      const idx = inp.getAttribute('data-idx');
      const oidx = inp.getAttribute('data-oidx');
      if (fields[idx] && fields[idx].options && fields[idx].options[oidx]) {
        fields[idx].options[oidx].label = inp.value;
      }
    });
    document.querySelectorAll('.option-percent-input').forEach(inp => {
      const idx = inp.getAttribute('data-idx');
      const oidx = inp.getAttribute('data-oidx');
      if (fields[idx] && fields[idx].options && fields[idx].options[oidx]) {
        fields[idx].options[oidx].value = parseFloat(inp.value) * fields[idx].weight / 100;
      }
    });
    // Validate
    let hasError = false;
    const names = fields.map(f => f.name.trim().toLowerCase());
    fields.forEach((f, i) => {
      if (!f.name.trim() || names.filter(n => n === f.name.trim().toLowerCase()).length > 1) {
        hasError = true;
        const fieldInput = document.querySelector(`.field-name-input[data-idx='${i}']`);
        if (fieldInput) fieldInput.classList.add('border-red-400');
      }
      if (f.weight !== '' && (f.weight < 0 || f.weight > 100)) hasError = true;
      (f.options || []).forEach((opt, oi) => {
        if (!opt.label.trim() || isNaN(opt.value)) hasError = true;
      });
    });
    const totalWeight = fields.reduce((sum, f) => sum + (parseFloat(f.weight) || 0), 0);
    if (!fields.length || hasError || totalWeight !== 100) {
      showCustomModal('Please fill in all fields, avoid duplicates, and ensure total weight is 100%.');
      return;
    }
    // Save to localStorage
    const calculators = getCalculators();
    const idx = calculators.findIndex(c => c.id === calc.id);
    if (idx !== -1) {
      calculators[idx].title = document.getElementById('editCalcTitle').value.trim();
      calculators[idx].purpose = document.getElementById('editCalcPurpose').value.trim();
      calculators[idx].fields = fields.map(f => ({
        ...f,
        weight: parseInt(f.weight, 10),
        options: (f.options || []).map(opt => ({ ...opt, value: parseFloat(opt.value) }))
      }));
      saveCalculators(calculators);
      updateAllAttemptScoresLocal(calculators[idx]);
      showCustomModal('Calculator updated!');
      setTimeout(() => showCalculatorInline(calc.id), 500);
    }
  };
}

// Add a modern rename modal utility at the end of the file
if (typeof showRenameModal !== 'function') {
  function showRenameModal({title, label, initial, onSave}) {
    if (document.getElementById('renameModal')) return;
    const modal = document.createElement('div');
    modal.id = 'renameModal';
    modal.innerHTML = `
      <div class="modern-modal-overlay"></div>
      <div class="modern-modal-content" role="dialog" aria-modal="true" tabindex="-1" style="position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);margin:0;z-index:10001;min-width:340px;max-width:95vw;">
        <h2 class="modern-modal-title">${title || 'Rename'}</h2>
        <label for="renameInput" class="modern-modal-message" style="margin-bottom:0.7em;display:block;text-align:left;">${label || 'Enter new name:'}</label>
        <input id="renameInput" class="glass-input" type="text" value="${initial||''}" style="margin-bottom:1.5em;width:100%;font-size:1.1em;" maxlength="64" autocomplete="off" />
        <div style="display:flex;gap:1.2em;justify-content:center;">
          <button id="renameCancelBtn" class="modern-modal-btn" style="background:#f3f4f6;color:#232946;">Cancel</button>
          <button id="renameOkBtn" class="modern-modal-btn" style="background:#6366f1;color:#fff;">Save</button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);
    setTimeout(() => {
      document.getElementById('renameInput').focus();
    }, 10);
    document.getElementById('renameCancelBtn').onclick = () => modal.remove();
    document.getElementById('renameOkBtn').onclick = () => {
      const val = document.getElementById('renameInput').value.trim();
      if (val) { onSave(val); modal.remove(); }
      else document.getElementById('renameInput').focus();
    };
    document.getElementById('renameInput').onkeydown = (e) => {
      if (e.key === 'Enter') document.getElementById('renameOkBtn').click();
      if (e.key === 'Escape') modal.remove();
    };
    modal.querySelector('.modern-modal-overlay').onclick = () => modal.remove();
    document.addEventListener('keydown', function escListener(e) {
      if (e.key === 'Escape') {
        modal.remove();
        document.removeEventListener('keydown', escListener);
      }
    });
  }
}

// Add a modern delete modal utility at the end of the file
if (typeof showDeleteModal !== 'function') {
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
      <div class="delete-modal-content" style="background:#fff;padding:2.2em 2em 1.5em 2em;border-radius:1.3em;box-shadow:0 8px 40px rgba(24,24,36,0.18);max-width:95vw;width:360px;text-align:center;position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);margin:0;z-index:10001;">
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
}

// Add a modern custom modal utility at the end of the file if not defined
if (typeof showCustomModal !== 'function') {
  function showCustomModal(message) {
    if (document.getElementById('customModal')) return;
    const modal = document.createElement('div');
    modal.id = 'customModal';
    modal.innerHTML = `
      <div class="modern-modal-overlay"></div>
      <div class="modern-modal-content" role="dialog" aria-modal="true" tabindex="-1">
        <h2 class="modern-modal-title">Notice</h2>
        <p class="modern-modal-message">${message}</p>
        <button class="modern-modal-btn" id="closeModalBtn">OK</button>
      </div>
    `;
    document.body.appendChild(modal);
    setTimeout(() => {
      document.querySelector('.modern-modal-content').focus();
    }, 10);
    document.getElementById('closeModalBtn').onclick = () => {
      modal.remove();
    };
    modal.querySelector('.modern-modal-overlay').onclick = () => {
      modal.remove();
    };
    document.addEventListener('keydown', function escListener(e) {
      if (e.key === 'Escape') {
        modal.remove();
        document.removeEventListener('keydown', escListener);
      }
    });
  }
} 