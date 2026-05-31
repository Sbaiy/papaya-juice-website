/**
 * Vercel Serverless Function — /api/verify-qr
 * 
 * Validates a QR table token server-side so _QR_SECRET
 * is never exposed in the frontend source code.
 *
 * Setup: add QR_SECRET=PapayaJuice2025! in Vercel Environment Variables,
 * then remove the hardcoded _QR_SECRET from menu.html and qr-tables.html.
 *
 * POST /api/verify-qr
 * Body: { "token": "<base64 token from URL ?t=...>" }
 * Returns: { "valid": true, "table": "3" } or { "valid": false }
 */
export default function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { token } = req.body || {};
  if (!token || typeof token !== 'string') {
    return res.status(400).json({ valid: false, error: 'Token manquant' });
  }

  const secret = process.env.QR_SECRET;
  if (!secret) {
    console.error('QR_SECRET env var not set');
    return res.status(500).json({ valid: false, error: 'Config serveur manquante' });
  }

  try {
    const decoded  = atob(token);
    const colonIdx = decoded.lastIndexOf(':');
    if (colonIdx < 1) return res.status(200).json({ valid: false });

    const tableNum = decoded.substring(0, colonIdx);
    const checksum = parseInt(decoded.substring(colonIdx + 1), 10);

    const raw = tableNum + ':' + secret;
    let sum = 0;
    for (const c of raw) sum = (sum * 31 + c.charCodeAt(0)) % 99991;

    if (sum === checksum) {
      return res.status(200).json({ valid: true, table: tableNum });
    }
  } catch (e) {
    // ignore
  }

  return res.status(200).json({ valid: false });
}
