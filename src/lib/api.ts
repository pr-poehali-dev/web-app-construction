const API_URL = 'https://functions.poehali.dev/07e23be0-934d-4821-ae28-c7383cf189b6';

export async function api<T = unknown>(action: string, body?: Record<string, unknown>): Promise<T> {
  const isGet = !body;
  const url = isGet ? `${API_URL}?action=${action}` : API_URL;
  const res = await fetch(url, {
    method: isGet ? 'GET' : 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: isGet ? undefined : JSON.stringify({ action, ...body }),
  });
  if (!res.ok) throw new Error('Ошибка запроса');
  return res.json();
}

export interface BuildObject {
  id: number;
  customer_last_name: string;
  customer_first_name?: string;
  customer_middle_name?: string;
  customer_phone?: string;
  project?: string;
  area_dsp?: number;
  address?: string;
  contract_number?: string;
  contract_sign_date?: string;
  contract_end_date?: string;
  cost?: number;
  self_cost?: number;
  mortgage_cost?: number;
  bank?: string;
  note?: string;
}

export interface Inspection {
  id: number;
  object_name?: string;
  stage?: string;
  stage_passed?: string;
  delivery_date?: string;
  supply?: string;
  next_start_date?: string;
  next_end_date?: string;
  note?: string;
  house_done?: string;
  owner_meeting_date?: string;
  act_date?: string;
  created_at?: string;
}

export interface Purchase {
  id: number;
  object_name?: string;
  supply?: string;
  delivery_date?: string;
  status?: string;
  payment_date?: string;
}