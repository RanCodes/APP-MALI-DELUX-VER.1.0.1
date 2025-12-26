import fs from 'fs';
import path from 'path';

const dbPath = process.env.DB_PATH || './data/logistics.json';
const directory = path.dirname(dbPath);

if (!fs.existsSync(directory)) {
  fs.mkdirSync(directory, { recursive: true });
}

const defaultData = {
  weights: [],
  rates: [
    { maxWeight: 0.5, cost: 5500 },
    { maxWeight: 1.0, cost: 6800 },
    { maxWeight: 2.0, cost: 8200 }
  ]
};

function readData() {
  if (!fs.existsSync(dbPath)) {
    fs.writeFileSync(dbPath, JSON.stringify(defaultData, null, 2));
    return { ...defaultData };
  }

  try {
    const content = fs.readFileSync(dbPath, 'utf-8');
    const parsed = JSON.parse(content || '{}');
    return {
      weights: Array.isArray(parsed.weights) ? parsed.weights : [],
      rates: Array.isArray(parsed.rates) && parsed.rates.length > 0 ? parsed.rates : defaultData.rates
    };
  } catch (error) {
    return { ...defaultData };
  }
}

function writeData(data) {
  fs.writeFileSync(dbPath, JSON.stringify(data, null, 2));
}

export async function getWeights() {
  const data = readData();
  return data.weights.map((w) => ({ ...w, weight: Number(w.weight) }));
}

export async function replaceWeights(weights) {
  const data = readData();
  data.weights = weights;
  writeData(data);
}

export async function deleteWeight(sku) {
  const data = readData();
  data.weights = data.weights.filter((w) => w.sku !== sku);
  writeData(data);
}

export async function getRates() {
  const data = readData();
  return data.rates.map((r) => ({ maxWeight: Number(r.maxWeight), cost: Number(r.cost) }));
}

export async function replaceRates(rates) {
  const data = readData();
  data.rates = rates;
  writeData(data);
}
