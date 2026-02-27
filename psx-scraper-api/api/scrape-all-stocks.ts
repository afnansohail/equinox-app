import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { symbols } = req.body as { symbols?: string[] };

  if (!Array.isArray(symbols) || symbols.length === 0) {
    return res.status(400).json({ error: 'Symbols array required' });
  }

  try {
    const baseUrl =
      (req.headers['x-forwarded-proto'] && req.headers['x-forwarded-host'])
        ? `${req.headers['x-forwarded-proto']}://${req.headers['x-forwarded-host']}`
        : `https://${req.headers.host}`;

    const promises = symbols.map(async (raw, index) => {
      const symbol = raw.toUpperCase();

      await new Promise((resolve) => setTimeout(resolve, index * 100));

      try {
        const response = await axios.get(`${baseUrl}/api/scrape-stock`, {
          params: { symbol },
          timeout: 15000,
        });
        return response.data;
      } catch (error) {
        console.error(`Failed to scrape ${symbol}`, error);
        return null;
      }
    });

    const results = await Promise.all(promises);
    const data = results.filter((r) => r !== null);

    return res.status(200).json({
      success: true,
      count: data.length,
      total: symbols.length,
      data,
    });
  } catch (error) {
    console.error('Error in scrape-all-stocks', error);
    return res.status(500).json({ error: 'Failed to scrape stocks' });
  }
}

