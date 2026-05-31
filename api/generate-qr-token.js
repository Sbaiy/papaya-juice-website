/**
 * Vercel Serverless Function — /api/generate-qr-token
 * 
 * Generates a signed QR table token server-side.
 * qr-tables.html calls this instead of computing tokens in the browser.
 *
 * Requires QR_SECRET env var set in Vercel.
 *
 * POST /api/generate-qr-token
 * Body: { "table": "3" }
 * Returns: { "token": "<base64>" }
 */
export default function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { table } = req.body || {};
  if (!table) {
    return res.status(400).json({ error: 'Table number manquant' });
  }

  const secret = process.env.QR_SECRET;
  if (!secret) {
    return res.status(500).json({ error: 'Config serveur manquante' });
  }

  const tableNum = String(table);
  const raw = tableNum + ':' + secret;
  let sum = 0;
  for (const c of raw) sum = (sum * 31 + c.charCodeAt(0)) % 99991;
  const token = btoa(tableNum + ':' + sum);

  return res.status(200).json({ token });
}
