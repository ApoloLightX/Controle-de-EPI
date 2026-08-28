import type { Epi, PurchaseItem, SwapRequest } from '../models';

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
    if (item.quantity <= 0 || item.unitValue < 0) throw new Error('Item de compra inválido');
    return total + item.quantity * item.unitValue;
  }, 0);
}

export function nextSwapStatusForApproval(epi: Pick<Epi, 'stock'>, quantity = 1) {
  return epi.stock >= quantity ? 'Aprovada' as const : 'Aguardando estoque' as const;
}

export function canCompleteSwap(swap: Pick<SwapRequest, 'status'>, epi: Pick<Epi, 'stock'>) {
  return ['Aprovada', 'Aguardando estoque'].includes(swap.status) && epi.stock > 0;
}
