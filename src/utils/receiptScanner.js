/**
 * Retrieves the Gemini API key from environment variables,
 * user database configuration, or localStorage.
 */
export function getGeminiApiKey(customKey = '') {
  if (customKey && customKey.trim()) return customKey.trim();
  if (typeof window !== 'undefined') {
    const local = localStorage.getItem('mylife_gemini_key');
    if (local && local.trim()) return local.trim();
  }
  return import.meta.env.VITE_GEMINI_API_KEY || '';
}

/**
 * Compresses an image File or Blob via Canvas to a maximum dimension (default 800px)
 * and JPEG quality (0.65) for ultra-fast OCR scanning and lightweight storage.
 */
export function compressReceiptImage(file, maxDim = 800, quality = 0.65) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = reject;
    reader.onload = (e) => {
      const img = new Image();
      img.onerror = reject;
      img.onload = () => {
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve(dataUrl);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * Sends the receipt image to Google Gemini Vision API
 * to extract amount, merchant, category, date, and note.
 * Uses low-latency gemini-2.0-flash (and 2.5-flash with thinkingBudget: 0)
 * to return results in ~1 second.
 */
export async function scanReceiptWithGemini(file, apiKey = '') {
  // 1. Fast lightweight compression (800px max, 0.65 quality)
  const dataUrl = await compressReceiptImage(file, 800, 0.65);
  const base64Data = dataUrl.split(',')[1];

  // 2. Try fast serverless endpoint first (with 8s timeout)
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const apiRes = await fetch('/api/scan-receipt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ base64Data, mimeType: 'image/jpeg' }),
      signal: controller.signal
    });
    clearTimeout(timer);

    if (apiRes.ok) {
      const parsed = await apiRes.json();
      return {
        amount: typeof parsed.amount === 'number' ? parsed.amount : parseFloat(parsed.amount) || 0,
        merchant: parsed.merchant || '',
        category: parsed.category || 'Other',
        date: parsed.date || null,
        note: parsed.note || parsed.merchant || '',
        imageDataUrl: dataUrl
      };
    }
  } catch (err) {
    // Continue to direct client-side call
  }

  // 3. Direct client-side call using configured key
  const keyToUse = getGeminiApiKey(apiKey);
  if (!keyToUse) {
    throw new Error('Gemini API key is not configured.');
  }

  const prompt = `You are an expert receipt and bill scanner. Analyze this bill/receipt/invoice image.
Extract the grand total amount, merchant/vendor name, suggested expense category, date, and a short note summary.
Return ONLY valid JSON matching this exact structure:
{
  "amount": number (the final grand total paid or due as a float, e.g. 450.00. 0 if unreadable),
  "merchant": string (the name of the store, restaurant, vendor, or service provider, e.g. "Starbucks", "D-Mart", "Uber"),
  "category": string (MUST be one of: "Food", "Travel", "Study", "Bills", "Fun", "Other"),
  "date": string (ISO format "YYYY-MM-DD" if printed on receipt, otherwise null),
  "note": string (short 3-6 word summary of store name or main items, e.g. "Starbucks coffee", "Grocery shopping", "Metro ticket")
}`;

  // Use low-latency models: 2.0-flash has no thinking delay; 2.5-flash with thinkingBudget: 0
  const models = [
    {
      name: 'gemini-2.0-flash',
      config: {
        responseMimeType: 'application/json',
        temperature: 0.1
      }
    },
    {
      name: 'gemini-2.5-flash',
      config: {
        responseMimeType: 'application/json',
        temperature: 0.1,
        thinkingConfig: { thinkingBudget: 0 }
      }
    }
  ];

  let json = null;
  let lastErr = null;

  for (const m of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${m.name}:generateContent?key=${keyToUse}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inlineData: {
                    mimeType: 'image/jpeg',
                    data: base64Data
                  }
                },
                { text: prompt }
              ]
            }
          ],
          generationConfig: m.config
        })
      });

      if (response.ok) {
        json = await response.json();
        break;
      } else {
        lastErr = await response.text();
      }
    } catch (e) {
      lastErr = e.message;
    }
  }

  if (!json) {
    throw new Error(`Scanner error: ${lastErr || 'Could not parse bill'}`);
  }

  const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!rawText) throw new Error('No receipt data returned');

  const parsed = JSON.parse(rawText);
  return {
    amount: typeof parsed.amount === 'number' ? parsed.amount : parseFloat(parsed.amount) || 0,
    merchant: parsed.merchant || '',
    category: parsed.category || 'Other',
    date: parsed.date || null,
    note: parsed.note || parsed.merchant || '',
    imageDataUrl: dataUrl
  };
}
