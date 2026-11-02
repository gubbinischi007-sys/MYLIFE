import { getFullDb, saveFullDb, isDbEmpty } from './db.js';

/**
 * Helper to parse JSON body from incoming Node.js http request
 */
export function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', (chunk) => {
      body += chunk;
      // 20MB limit to allow scanned receipt images
      if (body.length > 20 * 1024 * 1024) {
        req.destroy();
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

/**
 * Unified API Request Handler
 */
export async function handleApiRequest(req, res, next) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = url.pathname;

  // Add CORS headers for mobile and external clients
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  // 1. GET /api/db - Get full SQLite database
  if (pathname === '/api/db' && req.method === 'GET') {
    try {
      const data = getFullDb();
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 200;
      res.end(JSON.stringify(data));
    } catch (err) {
      console.error('API Error [GET /api/db]:', err);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // 2. POST /api/db - Persist full database to SQLite atomically
  if (pathname === '/api/db' && req.method === 'POST') {
    try {
      const body = await parseBody(req);
      saveFullDb(body);
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 200;
      res.end(JSON.stringify({ success: true, message: 'Saved to SQLite database' }));
    } catch (err) {
      console.error('API Error [POST /api/db]:', err);
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // 3. GET /api/status - Health check & DB statistics
  if (pathname === '/api/status' && req.method === 'GET') {
    try {
      const empty = isDbEmpty();
      res.setHeader('Content-Type', 'application/json');
      res.statusCode = 200;
      res.end(
        JSON.stringify({
          status: 'online',
          engine: 'SQLite (node:sqlite)',
          databaseFile: 'data/mylife.db',
          isEmpty: empty
        })
      );
    } catch (err) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // 4. POST /api/scan-receipt - Local fallback for receipt scanner
  if (pathname === '/api/scan-receipt' && req.method === 'POST') {
    try {
      const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Gemini API key not configured in environment' }));
        return;
      }

      const body = await parseBody(req);
      const { base64Data, mimeType = 'image/jpeg' } = body || {};
      if (!base64Data) {
        res.statusCode = 400;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'Missing base64 image data' }));
        return;
      }

      const prompt = `You are an expert receipt and bill scanner. Analyze this bill/receipt/invoice image.
Extract the grand total amount, merchant/vendor name, suggested expense category, date, individual items purchased, and note.
Return ONLY valid JSON matching this exact structure:
{
  "amount": number (the final grand total paid or due as a float, e.g. 450.00. 0 if unreadable),
  "merchant": string (the name of the store, restaurant, vendor, or service provider, e.g. "Starbucks", "D-Mart", "Uber"),
  "category": string (MUST be one of: "Food", "Travel", "Study", "Bills", "Fun", "Other"),
  "date": string (ISO format "YYYY-MM-DD" if printed on receipt, otherwise null),
  "items": array of strings (the specific items, dishes, or products listed on the bill, e.g. ["Milk", "Bread", "Eggs"] or ["Burger", "Fries", "Coke"]),
  "note": string (a comma-separated list of items found on the bill, e.g. "Burger, Fries, Coke". If store is known, format like "Starbucks: Cappuccino, Croissant". If individual items are unreadable, summarize the purchase)
}`;

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { inlineData: { mimeType, data: base64Data } },
                { text: prompt }
              ]
            }
          ],
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1
          }
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        res.statusCode = 500;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: errText }));
        return;
      }

      const geminiJson = await response.json();
      const rawText = geminiJson?.candidates?.[0]?.content?.parts?.[0]?.text;
      const parsed = JSON.parse(rawText);
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(parsed));
    } catch (err) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: err.message }));
    }
    return;
  }

  // If next is available (Vite connect middleware), pass to next
  if (typeof next === 'function') {
    next();
  } else {
    res.statusCode = 404;
    res.end('Not found');
  }
}

