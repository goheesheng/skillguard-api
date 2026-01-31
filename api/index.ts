import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';

const app = express();

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok', version: '0.1.0' });
});

app.get('/pricing', (req, res) => {
  res.json({
    tiers: [
      { name: 'quick', price: '$0.05' },
      { name: 'standard', price: '$0.15' },
      { name: 'deep', price: '$0.50' },
    ],
    payment: 'x402 on Base Sepolia'
  });
});

app.get('/', (req, res) => {
  res.json({ 
    name: 'SkillGuard API',
    version: '0.1.0',
    endpoints: ['/health', '/pricing', '/audit']
  });
});

export default app;
