import test from 'node:test';
import assert from 'node:assert/strict';
import { applyStockExit, calculatePurchaseTotal, canCompleteSwap, canDeliver, daysUntil, getCaAlertLevel, getStockStatus, nextSwapStatusForApproval } from '../src/domain/rules.ts';

test('regras de estoque', () => {
  assert.equal(getStockStatus({ stock: 11, minStock: 10 }), 'Normal');
  assert.equal(getStockStatus({ stock: 10, minStock: 10 }), 'Estoque baixo');
  assert.equal(getStockStatus({ stock: 0, minStock: 10 }), 'Sem estoque');
  assert.equal(canDeliver({ stock: 2 }, 3), false);
  assert.throws(() => applyStockExit(2, 3), /Estoque insuficiente/);
  assert.equal(applyStockExit(3, 2), 1);
});

test('cálculo de compras com múltiplos itens', () => {
  assert.equal(calculatePurchaseTotal([
    { epiId: 'a', quantity: 2, unitValue: 10 },
    { epiId: 'b', quantity: 3, unitValue: 5.5 },
  ]), 36.5);
  assert.throws(() => calculatePurchaseTotal([{ epiId: 'a', quantity: 1.5, unitValue: 10 }]), /Item de compra inválido/);
  assert.throws(() => calculatePurchaseTotal([{ epiId: 'a', quantity: 1, unitValue: -1 }]), /Item de compra inválido/);
});

test('aprovação e conclusão de trocas considera quantidade', () => {
  assert.equal(nextSwapStatusForApproval({ stock: 2 }, 2), 'Aprovada');
  assert.equal(nextSwapStatusForApproval({ stock: 1 }, 2), 'Aguardando estoque');
  assert.equal(canCompleteSwap({ status: 'Aprovada', quantity: 2 }, { stock: 2 }), true);
  assert.equal(canCompleteSwap({ status: 'Aprovada', quantity: 2 }, { stock: 1 }), false);
  assert.equal(canCompleteSwap({ status: 'Aguardando estoque', quantity: 1 }, { stock: 1 }), true);
  assert.equal(canCompleteSwap({ status: 'Reprovada', quantity: 1 }, { stock: 2 }), false);
});

test('alertas de validade do CA', () => {
  const now = new Date(2026, 8, 3);
  assert.equal(daysUntil('2026-09-03', now), 1);
  assert.equal(getCaAlertLevel('2026-09-02', now), 'Vencido');
  assert.equal(getCaAlertLevel('2026-09-20', now), 'Crítico');
  assert.equal(getCaAlertLevel('2026-11-15', now), 'Atenção');
  assert.equal(getCaAlertLevel('2027-01-01', now), 'Ok');
});
