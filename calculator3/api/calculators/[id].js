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
    created_at: calculator.created_at,
    fields
  };
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const { id } = req.query;
    try {
      const calculator = await getCalculator(id);
      if (!calculator) return res.status(404).json({ error: 'Calculator not found' });
      res.status(200).json(calculator);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch calculator', details: err.message });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
}; 