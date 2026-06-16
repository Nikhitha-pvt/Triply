const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function createTripPlan(tripRequest: any): Promise<{ plan_id: string }> {
  const resp = await fetch(`${API_BASE_URL}/api/plan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tripRequest),
  });
  if (!resp.ok) {
    const err = await resp.json();
    throw new Error(err.detail || 'Failed to initialize trip planning');
  }
  return resp.json();
}

export async function getItinerary(planId: string): Promise<any> {
  const resp = await fetch(`${API_BASE_URL}/api/itinerary/${planId}`);
  if (!resp.ok) {
    throw new Error('Failed to retrieve itinerary details');
  }
  return resp.json();
}

export async function getTrips(): Promise<any[]> {
  const resp = await fetch(`${API_BASE_URL}/api/trips`);
  if (!resp.ok) {
    throw new Error('Failed to fetch past trips');
  }
  return resp.json();
}

export async function voiceExtract(transcript: string): Promise<any> {
  const resp = await fetch(`${API_BASE_URL}/api/voice-extract`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ transcript }),
  });
  if (!resp.ok) {
    throw new Error('Failed to extract details from voice input');
  }
  return resp.json();
}

export async function getHeatmap(city: string, start: string, end: string): Promise<any[]> {
  const resp = await fetch(`${API_BASE_URL}/api/heatmap/${city}?start=${start}&end=${end}`);
  if (!resp.ok) {
    throw new Error('Failed to fetch heatmap data');
  }
  return resp.json();
}

export async function createPriceAlert(alertData: {
  trip_id: string;
  segment_type: 'transport' | 'hotel';
  segment_data: any;
  target_price_inr: number;
}): Promise<any> {
  const resp = await fetch(`${API_BASE_URL}/api/alerts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(alertData),
  });
  if (!resp.ok) {
    throw new Error('Failed to create price alert');
  }
  return resp.json();
}

export async function getPriceAlerts(): Promise<any[]> {
  const resp = await fetch(`${API_BASE_URL}/api/alerts`);
  if (!resp.ok) {
    throw new Error('Failed to fetch price alerts');
  }
  return resp.json();
}

export async function deletePriceAlert(alertId: string): Promise<any> {
  const resp = await fetch(`${API_BASE_URL}/api/alerts/${alertId}`, {
    method: 'DELETE',
  });
  if (!resp.ok) {
    throw new Error('Failed to dismiss price alert');
  }
  return resp.json();
}

export async function replanSegment(planId: string, segmentType: 'transport' | 'hotel', excludeIds: string[]): Promise<any[]> {
  const resp = await fetch(`${API_BASE_URL}/api/replan`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan_id: planId, segment_type: segmentType, exclude_ids: excludeIds }),
  });
  if (!resp.ok) {
    throw new Error('Replanning failed');
  }
  return resp.json();
}

export function getPdfExportUrl(planId: string): string {
  return `${API_BASE_URL}/api/itinerary/${planId}/export-pdf`;
}

export async function updateItinerary(planId: string, payload: {
  itinerary_json: any;
  risk_score?: number;
  total_cost_inr?: number;
}): Promise<any> {
  const resp = await fetch(`${API_BASE_URL}/api/itinerary/${planId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!resp.ok) {
    throw new Error('Failed to update itinerary');
  }
  return resp.json();
}
