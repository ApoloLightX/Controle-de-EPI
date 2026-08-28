import test from 'node:test';
import assert from 'node:assert/strict';
import { applyStockExit, calculatePurchaseTotal, canCompleteSwap, canDeliver, getStockStatus, nextSwapStatusForApproval } from '../src/domain/rules.ts';

test('regras de estoque', () => {
  assert.equal(getStockStatus({ stock: 11, minStock: 10 }), 'Normal');
  assert.equal(getStockStatus({ stock: 10, minStock: 10 }), 'Estoque baixo');
  assert.equal(getStockStatus({ stock: 0, minStock: 10 }), 'Sem estoque');
  assert.equal(canDeliver({ stock: 2 }, 3), false);
  assert.throws(() => applyStockExit(2, 3), /Estoque insuficiente/);
  assert.equal(applyStockExit(3, 2), 1);
});

test('cálculo de compras', () => {
  assert.equal(calculatePurchaseTotal([
    { epiId: 'a', quantity: 2, unitValue: 10 },
    { epiId: 'b', quantity: 3, unitValue: 5.5 }
  ]), 36.5);
});

test('aprovação e conclusão de trocas', () => {
  assert.equal(nextSwapStatusForApproval({ stock: 1 }), 'Aprovada');
  assert.equal(nextSwapStatusForApproval({ stock: 0 }), 'Aguardando estoque');
  assert.equal(canCompleteSwap({ status: 'Aprovada' }, { stock: 1 }), true);
  assert.equal(canCompleteSwap({ status: 'Aguardando estoque' }, { stock: 0 }), false);
  assert.equal(canCompleteSwap({ status: 'Reprovada' }, { stock: 2 }), false);
});
