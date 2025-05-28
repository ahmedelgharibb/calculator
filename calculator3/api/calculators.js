const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

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
      weight: field.weight,
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

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    try {
      const calcsRes = await pool.query('SELECT id FROM calculators ORDER BY created_at DESC');
      const calculators = await Promise.all(calcsRes.rows.map(row => getCalculator(row.id)));
      res.status(200).json(calculators);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch calculators', details: err.message });
    }
  } else if (req.method === 'POST') {
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
          'INSERT INTO calculator_fields (calculator_id, name, weight, field_order) VALUES ($1, $2, $3, $4) RETURNING id',
          [calculatorId, field.name, field.weight, i]
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
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}; 