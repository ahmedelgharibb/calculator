// To use with SQLite locally, no .env is needed. The database will be stored as 'localdb.sqlite' in the backend folder.
//
// If you need to use the anon key for Supabase JS client, use it in the frontend, not in pg connection.
// Provided anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impja3d2cnpjanVnZ25mY2JvZ3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA2OTIwMTYsImV4cCI6MjA1NjI2ODAxNn0.p2a0om1X40AJVhldUdtaU-at0SSPz6hLbrAg-ELHcnY

const express = require('express');
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const app = express();
app.use(bodyParser.json());

const dbPath = path.join(__dirname, 'localdb.sqlite');
const db = new sqlite3.Database(dbPath);

// Ensure tables exist
const initSql = `
CREATE TABLE IF NOT EXISTS calculators (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  purpose TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE IF NOT EXISTS calculator_fields (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  calculator_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  weight INTEGER,
  field_order INTEGER,
  FOREIGN KEY(calculator_id) REFERENCES calculators(id)
);
CREATE TABLE IF NOT EXISTS calculator_options (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  field_id INTEGER NOT NULL,
  label TEXT NOT NULL,
  value TEXT,
  option_order INTEGER,
  FOREIGN KEY(field_id) REFERENCES calculator_fields(id)
);
`;
db.exec(initSql);

// Helper: get calculator with fields and options
function getCalculator(id) {
  return new Promise((resolve, reject) => {
    db.get('SELECT * FROM calculators WHERE id = ?', [id], (err, calculator) => {
      if (err || !calculator) return resolve(null);
      db.all('SELECT * FROM calculator_fields WHERE calculator_id = ? ORDER BY field_order', [id], (err, fields) => {
        if (err) return reject(err);
        Promise.all(fields.map(field => {
          return new Promise((res, rej) => {
            db.all('SELECT * FROM calculator_options WHERE field_id = ? ORDER BY option_order', [field.id], (err, options) => {
              if (err) return rej(err);
              res({
                id: field.id,
                name: field.name,
                order: field.field_order,
                options: options.map(opt => ({
                  id: opt.id,
                  label: opt.label,
                  value: opt.value,
                  order: opt.option_order
                }))
              });
            });
          });
        })).then(fieldsWithOptions => {
          resolve({
            id: calculator.id,
            title: calculator.title,
            purpose: calculator.purpose,
            created_at: calculator.created_at,
            fields: fieldsWithOptions
          });
        }).catch(reject);
      });
    });
  });
}

// POST /calculators: Save a new calculator
app.post('/calculators', (req, res) => {
  const { title, purpose, fields } = req.body;
  if (!title || !purpose || !fields || !Array.isArray(fields) || !fields.length) {
    return res.status(400).json({ error: 'Invalid calculator data' });
  }
  db.serialize(() => {
    db.run('BEGIN TRANSACTION');
    db.run(
      'INSERT INTO calculators (title, purpose) VALUES (?, ?)',
      [title, purpose],
      function(err) {
        if (err) {
          db.run('ROLLBACK');
          return res.status(500).json({ error: 'Failed to save calculator', details: err.message });
        }
        const calculatorId = this.lastID;
        let fieldInsertions = fields.map((field, i) => {
          return new Promise((resolveField, rejectField) => {
            db.run(
              'INSERT INTO calculator_fields (calculator_id, name, weight, field_order) VALUES (?, ?, ?, ?)',
              [calculatorId, field.name, field.weight, i],
              function(err) {
                if (err) return rejectField(err);
                const fieldId = this.lastID;
                let optionInsertions = (field.options || []).map((opt, j) => {
                  return new Promise((resolveOpt, rejectOpt) => {
                    db.run(
                      'INSERT INTO calculator_options (field_id, label, value, option_order) VALUES (?, ?, ?, ?)',
                      [fieldId, opt.label, opt.value, j],
                      function(err) {
                        if (err) return rejectOpt(err);
                        resolveOpt();
                      }
                    );
                  });
                });
                Promise.all(optionInsertions).then(resolveField).catch(rejectField);
              }
            );
          });
        });
        Promise.all(fieldInsertions)
          .then(() => {
            db.run('COMMIT');
            res.status(201).json({ id: calculatorId });
          })
          .catch(err => {
            db.run('ROLLBACK');
            res.status(500).json({ error: 'Failed to save calculator', details: err.message });
          });
      }
    );
  });
});

// GET /calculators: List all calculators (with fields and options)
app.get('/calculators', (req, res) => {
  db.all('SELECT id FROM calculators ORDER BY created_at DESC', [], (err, rows) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch calculators', details: err.message });
    Promise.all(rows.map(row => getCalculator(row.id)))
      .then(calculators => res.json(calculators))
      .catch(err => res.status(500).json({ error: 'Failed to fetch calculators', details: err.message }));
  });
});

// GET /calculators/:id: Get a single calculator
app.get('/calculators/:id', (req, res) => {
  getCalculator(req.params.id)
    .then(calculator => {
      if (!calculator) return res.status(404).json({ error: 'Calculator not found' });
      res.json(calculator);
    })
    .catch(err => res.status(500).json({ error: 'Failed to fetch calculator', details: err.message }));
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
}); 