// Step 1: Ask for calculator title
let calculator = {
  title: '',
  fields: []
};
let step = 1;

function renderStep1() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="step">
      <h1>Create Your Score Calculator</h1>
      <form id="titleForm">
        <label for="calcTitle">Calculator Title</label>
        <input type="text" id="calcTitle" name="calcTitle" required placeholder="e.g. Exam Grader" maxlength="32"/>
        <button type="submit">Next</button>
      </form>
    </div>
  `;
  document.getElementById('titleForm').onsubmit = (e) => {
    e.preventDefault();
    calculator.title = document.getElementById('calcTitle').value.trim();
    if (calculator.title) {
      step = 2;
      renderStep2();
    }
  };
}

function renderStep2() {
  const app = document.getElementById('app');
  app.innerHTML = `
    <div class="step">
      <h1>${calculator.title}</h1>
      <form id="fieldsForm">
        <table class="fields-table">
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
                  <input type="text" value="${f.name}" data-idx="${i}" class="field-name-input" maxlength="24" style="width:100%;box-sizing:border-box;" required />
                </td>
                <td style="vertical-align:top;min-width:220px;max-width:260px;">
                  <div class="options-list" data-idx="${i}">
                    ${(f.options||[]).map((opt, oi) => `
                      <div class="option-row">
                        <input type="text" value="${opt.label}" data-idx="${i}" data-oidx="${oi}" class="option-label-input" placeholder="Label" maxlength="18" />
                        <input type="number" value="${opt.value}" data-idx="${i}" data-oidx="${oi}" class="option-value-input" placeholder="Score" />
                        <button type="button" class="remove-option-btn" data-idx="${i}" data-oidx="${oi}">✕</button>
                      </div>
                    `).join('')}
                    <div class="option-row">
                      <input type="text" id="newOptionLabel${i}" placeholder="Label" maxlength="18" />
                      <input type="number" id="newOptionValue${i}" placeholder="Score" />
                      <button type="button" class="add-option-btn" data-idx="${i}">Add</button>
                    </div>
                  </div>
                </td>
                <td style="vertical-align:top;width:60px;">
                  <button type="button" class="remove-field-btn" data-idx="${i}">Remove</button>
                </td>
              </tr>
            `).join('')}
            <tr>
              <td><input type="text" id="newFieldName" placeholder="e.g. Homework" maxlength="24" style="width:100%;box-sizing:border-box;" /></td>
              <td colspan="2">
                <div id="newOptionsList" style="display:block;"></div>
                <div id="newOptionInputs" style="display:flex;gap:4px;align-items:center;">
                  <input type="text" id="newOptionLabel" placeholder="Label" maxlength="18" />
                  <input type="number" id="newOptionValue" placeholder="Score" />
                  <button type="button" id="addNewOptionBtn">Add</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
        <button type="button" id="addFieldBtn" style="margin-top:10px;">Add Field</button>
        <button type="submit" style="margin-top:18px;${calculator.fields.length ? '' : 'display:none;'}">Next: Fill Values</button>
      </form>
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
}

document.addEventListener('DOMContentLoaded', () => {
  renderStep1();
}); 