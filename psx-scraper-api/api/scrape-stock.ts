import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';
import * as cheerio from 'cheerio';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const symbol = typeof req.query.symbol === 'string' ? req.query.symbol.toUpperCase() : '';

  if (!symbol) {
    return res.status(400).json({ error: 'Symbol parameter required' });
  }

  try {
    const sarmaayaUrl = `https://sarmaaya.pk/stocks/${symbol}`;
    const { data: html } = await axios.get(sarmaayaUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
      },
      timeout: 10000,
    });

    const $ = cheerio.load(html);

    const stockData = {
      symbol,
      name: $('h1.stock-name').text().trim() || symbol,
      currentPrice: parseFloat($('.current-price').text().replace(/,/g, '')) || 0,
      previousClose: parseFloat($('.previous-close').text().replace(/,/g, '')) || 0,
      changePercent: parseFloat($('.change-percent').text().replace('%', '')) || 0,
      volume: parseInt($('.volume').text().replace(/,/g, ''), 10) || 0,
      high52Week: parseFloat($('.high-52w').text().replace(/,/g, '')) || 0,
      low52Week: parseFloat($('.low-52w').text().replace(/,/g, '')) || 0,
      lastUpdated: new Date().toISOString(),
    };

    return res.status(200).json(stockData);
  } catch (error) {
    console.error(`Error scraping Sarmaaya for ${symbol}`, error);

    try {
      const dspUrl = `https://dps.psx.com.pk/company/${symbol}`;
      const { data: html } = await axios.get(dspUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko)',
        },
        timeout: 10000,
      });

      const $ = cheerio.load(html);

      const stockData = {
        symbol,
        name: $('.company-name').text().trim() || symbol,
        currentPrice: parseFloat($('.ldcp').text().replace(/,/g, '')) || 0,
        previousClose: parseFloat($('.previous-close').text().replace(/,/g, '')) || 0,
        changePercent: parseFloat($('.change').text().replace('%', '')) || 0,
        volume: parseInt($('.volume').text().replace(/,/g, ''), 10) || 0,
        lastUpdated: new Date().toISOString(),
      };

      return res.status(200).json(stockData);
    } catch (fallbackError) {
      console.error(`Error scraping DSP for ${symbol}`, fallbackError);
      return res.status(500).json({
        error: 'Failed to scrape stock data',
        symbol,
      });
    }
  }
}

