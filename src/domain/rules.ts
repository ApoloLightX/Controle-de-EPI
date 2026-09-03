import type { CaAlertLevel, Epi, PurchaseItem, SwapRequest } from '../models';

export function getStockStatus(epi: Pick<Epi, 'stock' | 'minStock'>) {
  if (epi.stock <= 0) return 'Sem estoque' as const;
  if (epi.stock <= epi.minStock) return 'Estoque baixo' as const;
  return 'Normal' as const;
}

export function canDeliver(epi: Pick<Epi, 'stock'>, quantity: number) {
  return Number.isInteger(quantity) && quantity > 0 && epi.stock >= quantity;
}

export function applyStockExit(stock: number, quantity: number) {
  if (!Number.isInteger(quantity) || quantity <= 0) throw new Error('Quantidade inválida');
  if (stock < quantity) throw new Error('Estoque insuficiente');
  return stock - quantity;
}

export function calculatePurchaseTotal(items: PurchaseItem[]) {
  return items.reduce((total, item) => {
    if (!Number.isInteger(item.quantity) || item.quantity <= 0 || !Number.isFinite(item.unitValue) || item.unitValue < 0) {
      throw new Error('Item de compra inválido');
    }
    return total + item.quantity * item.unitValue;
  }, 0);
}

export function daysUntil(date: string, now = new Date()) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) return Number.NaN;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const target = new Date(year, month - 1, day);
  if (target.getFullYear() !== year || target.getMonth() !== month - 1 || target.getDate() !== day) return Number.NaN;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

export function getCaAlertLevel(caValidity: string, now = new Date()): CaAlertLevel {
  const days = daysUntil(caValidity, now);
  if (!Number.isFinite(days)) return 'Crítico';
  if (days < 0) return 'Vencido';
  if (days <= 30) return 'Crítico';
  if (days <= 90) return 'Atenção';
  return 'Ok';
}

export function nextSwapStatusForApproval(epi: Pick<Epi, 'stock'>, quantity = 1) {
  return epi.stock >= quantity ? 'Aprovada' as const : 'Aguardando estoque' as const;
}

export function canCompleteSwap(swap: Pick<SwapRequest, 'status' | 'quantity'>, epi: Pick<Epi, 'stock'>) {
  const quantity = swap.quantity ?? 1;
  return ['Aprovada', 'Aguardando estoque'].includes(swap.status) && Number.isInteger(quantity) && quantity > 0 && epi.stock >= quantity;
}
