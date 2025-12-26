import { ShippingRate, WeightEntry } from '../types';

const API_BASE = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '');

const jsonHeaders = {
  'Content-Type': 'application/json'
};

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Error inesperado en el servidor');
  }
  return response.json();
}

export async function fetchLogisticsData(): Promise<{ weights: WeightEntry[]; rates: ShippingRate[] }> {
  const [weights, rates] = await Promise.all([
    fetch(`${API_BASE}/weights`).then(res => handleResponse<WeightEntry[]>(res)),
    fetch(`${API_BASE}/rates`).then(res => handleResponse<ShippingRate[]>(res))
  ]);

  return { weights, rates };
}

export async function persistWeights(weights: WeightEntry[]): Promise<void> {
  await fetch(`${API_BASE}/weights/bulk`, {
    method: 'POST',
    headers: jsonHeaders,
    body: JSON.stringify({ weights })
  }).then(res => handleResponse(res));
}

export async function persistRates(rates: ShippingRate[]): Promise<void> {
  await fetch(`${API_BASE}/rates`, {
    method: 'PUT',
    headers: jsonHeaders,
    body: JSON.stringify({ rates })
  }).then(res => handleResponse(res));
}
