import test from 'node:test';
import assert from 'node:assert/strict';
import {
  applyStockExit,
  calculatePurchaseTotal,
  canApplySwapAction,
  canCompleteSwap,
  canDeliver,
  daysUntil,
  getCaAlertLevel,
  getStockStatus,
  isValidIsoDate,
  isValidPin,
  isWithinPastDays,
  nextSwapStatusForApproval,
} from '../src/domain/rules.ts';
import { nowDate } from '../src/utils/format.ts';

test('regras de estoque', () => {
  assert.equal(getStockStatus({ stock: 11, minStock: 10 }), 'Normal');
  assert.equal(getStockStatus({ stock: 10, minStock: 10 }), 'Estoque baixo');
  assert.equal(getStockStatus({ stock: 0, minStock: 10 }), 'Sem estoque');
  assert.equal(canDeliver({ stock: 2 }, 3), false);
  assert.equal(canDeliver({ stock: 2 }, 2), true);
  assert.equal(canDeliver({ stock: 2 }, 1.5), false);
  assert.throws(() => applyStockExit(2, 3), /Estoque insuficiente/);
  assert.throws(() => applyStockExit(2, 0), /Quantidade inválida/);
  assert.equal(applyStockExit(3, 2), 1);
});

test('cálculo de compras com múltiplos itens e precisão de centavos', () => {
  assert.equal(calculatePurchaseTotal([
    { epiId: 'a', quantity: 2, unitValue: 10 },
    { epiId: 'b', quantity: 3, unitValue: 5.5 },
  ]), 36.5);
  assert.equal(calculatePurchaseTotal([{ epiId: 'a', quantity: 3, unitValue: 0.1 }]), 0.3);
  assert.throws(() => calculatePurchaseTotal([{ epiId: 'a', quantity: 1.5, unitValue: 10 }]), /Item de compra inválido/);
  assert.throws(() => calculatePurchaseTotal([{ epiId: 'a', quantity: 1, unitValue: -1 }]), /Item de compra inválido/);
  assert.throws(() => calculatePurchaseTotal([{ epiId: 'a', quantity: 0, unitValue: 10 }]), /Item de compra inválido/);
});

test('aprovação e conclusão de trocas considera quantidade', () => {
  assert.equal(nextSwapStatusForApproval({ stock: 2 }, 2), 'Aprovada');
  assert.equal(nextSwapStatusForApproval({ stock: 1 }, 2), 'Aguardando estoque');
  assert.equal(canCompleteSwap({ status: 'Aprovada', quantity: 2 }, { stock: 2 }), true);
  assert.equal(canCompleteSwap({ status: 'Aprovada', quantity: 2 }, { stock: 1 }), false);
  assert.equal(canCompleteSwap({ status: 'Aguardando estoque', quantity: 1 }, { stock: 1 }), true);
  assert.equal(canCompleteSwap({ status: 'Reprovada', quantity: 1 }, { stock: 2 }), false);
});

test('transições de troca bloqueiam saltos e reprocessamento', () => {
  assert.equal(canApplySwapAction({ status: 'Pendente' }, 'analysis'), true);
  assert.equal(canApplySwapAction({ status: 'Pendente' }, 'approve'), true);
  assert.equal(canApplySwapAction({ status: 'Pendente' }, 'complete'), false);
  assert.equal(canApplySwapAction({ status: 'Em análise' }, 'approve'), true);
  assert.equal(canApplySwapAction({ status: 'Aprovada' }, 'complete'), true);
  assert.equal(canApplySwapAction({ status: 'Aguardando estoque' }, 'complete'), true);
  assert.equal(canApplySwapAction({ status: 'Concluída' }, 'reject'), false);
  assert.equal(canApplySwapAction({ status: 'Reprovada' }, 'approve'), false);
});

test('alertas de validade do CA', () => {
  const now = new Date(2026, 8, 3);
  assert.equal(daysUntil('2026-09-03', now), 0);
  assert.equal(getCaAlertLevel('2026-09-02', now), 'Vencido');
  assert.equal(getCaAlertLevel('2026-09-20', now), 'Crítico');
  assert.equal(getCaAlertLevel('2026-11-15', now), 'Atenção');
  assert.equal(getCaAlertLevel('2027-01-01', now), 'Ok');
  assert.equal(Number.isNaN(daysUntil('2026-02-31', now)), true);
  assert.equal(isValidIsoDate('2026-02-28'), true);
  assert.equal(isValidIsoDate('2026-02-31'), false);
  assert.equal(isValidIsoDate('28/02/2026'), false);
});

test('PIN local exige de quatro a oito dígitos', () => {
  assert.equal(isValidPin('1234'), true);
  assert.equal(isValidPin('12345678'), true);
  assert.equal(isValidPin('123'), false);
  assert.equal(isValidPin('123456789'), false);
  assert.equal(isValidPin('12a4'), false);
});

test('janela móvel considera somente datas passadas recentes', () => {
  const now = new Date(2026, 8, 14, 12, 0, 0);
  assert.equal(isWithinPastDays('2026-09-14', 30, now), true);
  assert.equal(isWithinPastDays('2026-08-15', 30, now), true);
  assert.equal(isWithinPastDays('2026-08-14', 30, now), false);
  assert.equal(isWithinPastDays('2026-09-15', 30, now), false);
});

test('nowDate usa a data civil de São Paulo em vez da data UTC', () => {
  const previousTimezone = process.env.TZ;
  process.env.TZ = 'America/Sao_Paulo';
  try {
    const lateNightInSaoPaulo = new Date('2026-09-15T02:30:00Z');
    assert.equal(nowDate(lateNightInSaoPaulo), '2026-09-14');
  } finally {
    if (previousTimezone === undefined) delete process.env.TZ;
    else process.env.TZ = previousTimezone;
  }
});
