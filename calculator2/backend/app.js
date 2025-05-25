// To use with Supabase, set your .env as follows:
// DATABASE_URL=postgresql://postgres:<YOUR_DB_PASSWORD>@db.jckwvrzcjuggnfcbogrr.supabase.co:5432/postgres
// PGSSLMODE=require
//
// If you need to use the anon key for Supabase JS client, use it in the frontend, not in pg connection.
// Provided anon key: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impja3d2cnpjanVnZ25mY2JvZ3JyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDA2OTIwMTYsImV4cCI6MjA1NjI2ODAxNn0.p2a0om1X40AJVhldUdtaU-at0SSPz6hLbrAg-ELHcnY

const express = require('express');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
app.use(bodyParser.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Helper: get calculator with fields and options
async function getCalculator(id) {
  const calcRes = await pool.query('SELECT * FROM calculators WHERE id = $1', [id]);
  if (!calcRes.rows.length) return null;
  const calculator = calcRes.rows[0];
  const fieldsRes = await pool.query('SELECT * FROM calculator_fields WHERE calculator_id = $1 ORDER BY field_order', [id]);
  const fields = await Promise.all(fieldsRes.rows.map(async (field) => {
    const optionsRes = await pool.query('SELECT * FROM calculator_options WHERE field_id = $1 ORDER BY option_order', [field.id]);
    return {
      id: field.id,
      name: field.name,
      order: field.field_order,
      options: optionsRes.rows.map(opt => ({
        id: opt.id,
        label: opt.label,
        value: opt.value,
        order: opt.option_order
      }))
    };
  }));
  return {
    id: calculator.id,
    title: calculator.title,
    purpose: calculator.purpose,
    created_at: calculator.created_at,
    fields
  };
}

// POST /calculators: Save a new calculator
app.post('/calculators', async (req, res) => {
  const { title, purpose, fields } = req.body;
  if (!title || !purpose || !fields || !Array.isArray(fields) || !fields.length) {
    return res.status(400).json({ error: 'Invalid calculator data' });
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const calcRes = await client.query(
      'INSERT INTO calculators (title, purpose) VALUES ($1, $2) RETURNING id, created_at',
      [title, purpose]
    );
    const calculatorId = calcRes.rows[0].id;
    for (let i = 0; i < fields.length; i++) {
      const field = fields[i];
      const fieldRes = await client.query(
        'INSERT INTO calculator_fields (calculator_id, name, field_order) VALUES ($1, $2, $3) RETURNING id',
        [calculatorId, field.name, i]
      );
      const fieldId = fieldRes.rows[0].id;
      for (let j = 0; j < (field.options || []).length; j++) {
        const opt = field.options[j];
        await client.query(
          'INSERT INTO calculator_options (field_id, label, value, option_order) VALUES ($1, $2, $3, $4)',
          [fieldId, opt.label, opt.value, j]
        );
      }
    }
    await client.query('COMMIT');
    res.status(201).json({ id: calculatorId });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: 'Failed to save calculator', details: err.message });
  } finally {
    client.release();
  }
});

// GET /calculators: List all calculators (with fields and options)
app.get('/calculators', async (req, res) => {
  try {
    const calcsRes = await pool.query('SELECT id FROM calculators ORDER BY created_at DESC');
    const calculators = await Promise.all(calcsRes.rows.map(row => getCalculator(row.id)));
    res.json(calculators);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch calculators', details: err.message });
  }
});

// GET /calculators/:id: Get a single calculator
app.get('/calculators/:id', async (req, res) => {
  try {
    const calculator = await getCalculator(req.params.id);
    if (!calculator) return res.status(404).json({ error: 'Calculator not found' });
    res.json(calculator);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch calculator', details: err.message });
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`Backend running on port ${PORT}`);
}); 