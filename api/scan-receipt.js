export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.VITE_GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Gemini API key is not configured on the server' });
  }

  try {
    const { base64Data, mimeType = 'image/jpeg' } = req.body || {};
    if (!base64Data) {
      return res.status(400).json({ error: 'Missing base64 image data' });
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

    // Prefer gemini-2.0-flash for sub-second low-latency extraction without thinking delay;
    // fallback to gemini-2.5-flash with thinking explicitly disabled (thinkingBudget: 0).
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

    let lastError = null;
    let json = null;

    for (const m of models) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${m.name}:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    inlineData: {
                      mimeType,
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
          lastError = await response.text();
        }
      } catch (err) {
        lastError = err.message;
      }
    }

    if (!json) {
      return res.status(500).json({ error: lastError || 'Gemini processing failed' });
    }

    const rawText = json?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      return res.status(500).json({ error: 'Empty response from Gemini' });
    }

    const parsed = JSON.parse(rawText);
    return res.status(200).json(parsed);
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}
