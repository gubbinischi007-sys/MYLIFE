export default function handler(req, res) {
  return res.status(200).json({
    status: 'online',
    platform: 'Vercel Serverless',
    note: 'Vercel deployment is active.'
  });
}
