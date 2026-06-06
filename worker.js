/**
 * SynPrysm Contact Form Worker
 * Receives POST from contact form → sends email via Resend API → returns JSON
 *
 * Required Worker Secret (set via Cloudflare dashboard or wrangler):
 *   RESEND_API_KEY  — your Resend API key (re_xxxxxxxxxxxx)
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const SERVICE_LABELS = {
  'ai-security':     'AI Security',
  'ai-integration':  'AI Integration',
  'ai-cold-callers': 'AI Cold Callers',
  'ai-note-takers':  'AI Note Takers',
  'ai-crm':          'AI CRM',
  'ai-tools':        'AI Tools',
  'ai-assistants':   'AI Professional Assistants',
  'custom':          'Custom / Bespoke Solution',
  'not-sure':        'Not Sure Yet — Let\'s Talk',
};

function buildEmailHTML(d) {
  const service = SERVICE_LABELS[d.service] || d.service || 'Not specified';
  const now = new Date().toLocaleString('en-US', { timeZone: 'America/Chicago', dateStyle: 'full', timeStyle: 'short' });
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"/></head>
<body style="margin:0;padding:0;background:#f4f4f8;font-family:Inter,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f8;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#080b18;border-radius:16px;overflow:hidden;max-width:600px;">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#0d1128,#111830);padding:32px 40px;border-bottom:1px solid rgba(0,212,255,0.2);">
            <p style="margin:0;font-size:24px;font-weight:800;color:#ffffff;letter-spacing:-0.02em;">
              SynPrysm<span style="color:#7b2fff;">.io</span>
            </p>
            <p style="margin:6px 0 0;font-size:13px;color:#8892b0;letter-spacing:0.1em;text-transform:uppercase;">New Contact Form Submission</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px;">

            <p style="margin:0 0 24px;font-size:16px;color:#e8eaf6;line-height:1.6;">
              You have a new inquiry from <strong style="color:#00d4ff;">${d.firstName} ${d.lastName}</strong>.
            </p>

            <!-- Fields -->
            ${row('Name',    `${d.firstName} ${d.lastName}`)}
            ${row('Email',   `<a href="mailto:${d.email}" style="color:#00d4ff;">${d.email}</a>`)}
            ${row('Company', d.company || '<em style="color:#4a5568;">Not provided</em>')}
            ${row('Service', `<span style="color:#7b2fff;font-weight:700;">${service}</span>`)}

            <!-- Message -->
            <div style="margin-top:24px;">
              <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#4a5568;">Message</p>
              <div style="background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);border-radius:10px;padding:20px;">
                <p style="margin:0;font-size:15px;color:#e8eaf6;line-height:1.7;white-space:pre-wrap;">${escHtml(d.message)}</p>
              </div>
            </div>

            <!-- CTA -->
            <div style="margin-top:32px;text-align:center;">
              <a href="mailto:${d.email}?subject=Re: Your SynPrysm Inquiry"
                 style="display:inline-block;background:linear-gradient(135deg,#00d4ff,#7b2fff);color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:14px 32px;border-radius:8px;">
                Reply to ${d.firstName} →
              </a>
            </div>

          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="padding:20px 40px 28px;border-top:1px solid rgba(255,255,255,0.06);">
            <p style="margin:0;font-size:12px;color:#4a5568;text-align:center;">
              Received ${now} CT · SynPrysm.io Contact Form
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function row(label, value) {
  return `
  <div style="display:flex;justify-content:space-between;padding:12px 16px;background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:8px;margin-bottom:10px;">
    <span style="font-size:12px;font-weight:700;letter-spacing:0.08em;text-transform:uppercase;color:#4a5568;">${label}</span>
    <span style="font-size:14px;color:#e8eaf6;text-align:right;">${value}</span>
  </div>`;
}

function escHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export default {
  async fetch(request, env) {

    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS_HEADERS });
    }

    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405, headers: CORS_HEADERS });
    }

    try {
      // Parse form data (supports both FormData and JSON)
      let data = {};
      const ct = request.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        data = await request.json();
      } else {
        const fd = await request.formData();
        fd.forEach((v, k) => { data[k] = v; });
      }

      // Validate required fields
      const required = ['firstName', 'lastName', 'email', 'message'];
      for (const field of required) {
        if (!data[field] || !String(data[field]).trim()) {
          return json({ error: `Missing required field: ${field}` }, 400);
        }
      }

      // Basic email validation
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        return json({ error: 'Invalid email address' }, 400);
      }

      // Send via Resend
      const resendRes = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'SynPrysm Website <noreply@synprism.io>',
          to:   ['info@synprism.io'],
          reply_to: data.email,
          subject: `✨ New Inquiry: ${data.firstName} ${data.lastName} — ${SERVICE_LABELS[data.service] || 'General'}`,
          html: buildEmailHTML(data),
        }),
      });

      if (!resendRes.ok) {
        const err = await resendRes.text();
        console.error('Resend error:', err);
        return json({ error: 'Email delivery failed. Please try again.' }, 502);
      }

      return json({ success: true, message: 'Message sent!' });

    } catch (err) {
      console.error('Worker error:', err);
      return json({ error: 'Internal error. Please try again.' }, 500);
    }
  }
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
  });
}
