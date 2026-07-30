import pg from 'pg';
const { Pool } = pg;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    if (req.method === 'GET') {
      const { datum } = req.query;
      if (datum) {
        const result = await pool.query('SELECT * FROM pacing_entries WHERE datum = $1', [datum]);
        return res.status(200).json(result.rows[0] || null);
      }
      const all = await pool.query('SELECT * FROM pacing_entries ORDER BY datum DESC');
      return res.status(200).json(all.rows);
    }

    if (req.method === 'POST') {
      const { datum, puls, hrv, energieLevel, notizen } = req.body;
      
      const query = `
        INSERT INTO pacing_entries (datum, puls, hrv, energie, notizen, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW())
        ON CONFLICT (datum) 
        DO UPDATE SET 
          puls = EXCLUDED.puls,
          hrv = EXCLUDED.hrv,
          energie = EXCLUDED.energie,
          notizen = EXCLUDED.notizen,
          updated_at = NOW();
      `;
      
      await pool.query(query, [
        datum,
        puls ? parseInt(puls) : null,
        hrv ? parseInt(hrv) : null,
        energieLevel ? parseInt(energieLevel) : null,
        notizen || ''
      ]);

      return res.status(200).json({ success: true, message: 'In Neon gespeichert!' });
    }
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: error.message });
  }
}
