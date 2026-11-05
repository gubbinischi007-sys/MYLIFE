export default function handler(req, res) {
  // On Vercel Serverless, inform the client to preserve and use local client storage
  if (req.method === 'GET') {
    return res.status(200).json({
      isVercelServerless: true,
      tasks: [],
      tx: [],
      events: [],
      assign: [],
      bdays: [],
      notes: [],
      passwords: [],
      deleted: []
    });
  }

  return res.status(200).json({
    success: true,
    platform: 'Vercel Serverless'
  });
}

