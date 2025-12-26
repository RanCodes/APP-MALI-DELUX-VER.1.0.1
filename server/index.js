import http from 'http';
import { getWeights, replaceWeights, deleteWeight, getRates, replaceRates } from './db.js';

const port = process.env.PORT || 4000;

const defaultHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json'
};

async function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (chunk) => (data += chunk));
    req.on('end', () => {
      if (!data) return resolve({});
      try {
        resolve(JSON.parse(data));
      } catch (error) {
        reject(error);
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const { method, url } = req;
  res.setHeader('Access-Control-Allow-Origin', defaultHeaders['Access-Control-Allow-Origin']);
  res.setHeader('Access-Control-Allow-Methods', defaultHeaders['Access-Control-Allow-Methods']);
  res.setHeader('Access-Control-Allow-Headers', defaultHeaders['Access-Control-Allow-Headers']);

  if (method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  try {
    if (url === '/api/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok' }));
      return;
    }

    if (url === '/api/weights' && method === 'GET') {
      const weights = await getWeights();
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(weights));
      return;
    }

    if (url === '/api/weights/bulk' && method === 'POST') {
      const body = await readBody(req);
      if (!Array.isArray(body.weights)) {
        res.writeHead(400, defaultHeaders);
        res.end(JSON.stringify({ error: 'El payload debe incluir un array "weights"' }));
        return;
      }

      const sanitized = body.weights
        .filter((w) => w.sku && typeof w.weight === 'number')
        .map((w) => ({
          sku: String(w.sku),
          product: w.product || '',
          weight: Number(w.weight),
          updatedAt: w.updatedAt || new Date().toISOString()
        }));

      await replaceWeights(sanitized);
      res.writeHead(200, defaultHeaders);
      res.end(JSON.stringify({ saved: sanitized.length }));
      return;
    }

    if (url && url.startsWith('/api/weights/') && method === 'DELETE') {
      const sku = decodeURIComponent(url.split('/').pop());
      await deleteWeight(sku);
      res.writeHead(200, defaultHeaders);
      res.end(JSON.stringify({ deleted: sku }));
      return;
    }

    if (url === '/api/rates' && method === 'GET') {
      const rates = await getRates();
      res.writeHead(200, defaultHeaders);
      res.end(JSON.stringify(rates));
      return;
    }

    if (url === '/api/rates' && method === 'PUT') {
      const body = await readBody(req);
      if (!Array.isArray(body.rates)) {
        res.writeHead(400, defaultHeaders);
        res.end(JSON.stringify({ error: 'El payload debe incluir un array "rates"' }));
        return;
      }

      const sanitized = body.rates
        .filter((r) => typeof r.maxWeight === 'number' && typeof r.cost === 'number')
        .map((r) => ({
          maxWeight: Number(r.maxWeight),
          cost: Number(r.cost)
        }))
        .sort((a, b) => a.maxWeight - b.maxWeight);

      await replaceRates(sanitized);
      res.writeHead(200, defaultHeaders);
      res.end(JSON.stringify({ saved: sanitized.length }));
      return;
    }

    res.writeHead(404, defaultHeaders);
    res.end(JSON.stringify({ error: 'Ruta no encontrada' }));
  } catch (error) {
    res.writeHead(500, defaultHeaders);
    res.end(JSON.stringify({ error: 'Error interno del servidor', details: error.message }));
  }
});

server.listen(port, () => {
  console.log(`API de logística escuchando en puerto ${port}`);
});
