import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import type { AppData } from '../models';
import { getCaAlertLevel, getStockStatus } from '../domain/rules';
import { money, shortDate } from './format';

function html(value: unknown) {
  return String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

function bars(items: { label: string; value: number }[], color: string, formatter: (value: number) => string = value => String(value)) {
  if (!items.length) return '<div class="empty">Sem dados suficientes.</div>';
  const max = Math.max(1, ...items.map(i => i.value));
  return items.map(i => `<div class="bar-row"><span>${html(i.label)}</span><div class="bar"><i style="width:${Math.round((i.value / max) * 100)}%;background:${color}"></i></div><strong>${html(formatter(i.value))}</strong></div>`).join('');
}

export async function exportConsolidatedPdf(data: AppData) {
  const active = data.employees.filter(e => e.status === 'Ativo').length;
  const balance = data.epis.reduce((sum, e) => sum + e.stock, 0);
  const attention = data.epis.filter(e => getStockStatus(e) !== 'Normal').length;
  const spend = data.purchases.reduce((sum, p) => sum + p.total, 0);
  const inventoryValue = data.epis.reduce((sum, e) => sum + e.stock * e.unitValue, 0);
  const openSwaps = data.swaps.filter(s => !['Concluída', 'Reprovada'].includes(s.status)).length;
  const caRisk = data.epis.filter(e => getCaAlertLevel(e.caValidity) !== 'Ok').length;

  const spendByMonth = Object.entries(data.purchases.reduce<Record<string, number>>((acc, purchase) => {
    const month = purchase.purchasedAt.slice(0, 7);
    acc[month] = (acc[month] ?? 0) + purchase.total;
    return acc;
  }, {})).sort(([a], [b]) => a.localeCompare(b)).map(([label, value]) => ({ label, value }));

  const used = data.epis.map(epi => ({
    label: epi.name,
    value: data.deliveries.filter(d => d.epiId === epi.id).reduce((sum, delivery) => sum + delivery.quantity, 0),
  })).filter(item => item.value > 0).sort((a, b) => b.value - a.value).slice(0, 6);

  const swapsByEmployee = data.employees.map(employee => ({
    label: employee.name.split(' ')[0] ?? employee.name,
    value: data.swaps.filter(s => s.employeeId === employee.id).length,
  })).filter(item => item.value > 0).sort((a, b) => b.value - a.value).slice(0, 8);

  const deliveriesByMonth = Object.entries(data.deliveries.reduce<Record<string, number>>((acc, delivery) => {
    const month = delivery.deliveredAt.slice(0, 7);
    acc[month] = (acc[month] ?? 0) + delivery.quantity;
    return acc;
  }, {})).sort(([a], [b]) => a.localeCompare(b)).map(([label, value]) => ({ label, value }));

  const employeeCosts = data.employees.map(employee => ({
    label: employee.name.split(' ')[0] ?? employee.name,
    value: data.deliveries.filter(delivery => delivery.employeeId === employee.id).reduce((sum, delivery) => {
      const epi = data.epis.find(item => item.id === delivery.epiId);
      return sum + delivery.quantity * (epi?.unitValue ?? 0);
    }, 0),
  })).filter(item => item.value > 0).sort((a, b) => b.value - a.value).slice(0, 8);

  const stockRows = data.epis.map(epi => `<tr><td>${html(epi.name)}</td><td>${html(epi.category)}</td><td>${html(epi.brand)}</td><td>${html(epi.model)}</td><td>${html(epi.size)}</td><td>${html(epi.ca)}</td><td>${html(shortDate(epi.caValidity))}</td><td>${epi.stock}</td><td>${epi.minStock}</td><td>${html(getStockStatus(epi))}</td><td>${html(getCaAlertLevel(epi.caValidity))}</td><td>${html(money(epi.unitValue))}</td><td>${html(epi.supplier)}</td></tr>`).join('');

  const riskRows = data.epis.filter(epi => getStockStatus(epi) !== 'Normal' || getCaAlertLevel(epi.caValidity) !== 'Ok').map(epi => `<tr><td>${html(epi.name)}</td><td>${epi.stock}/${epi.minStock}</td><td>${html(getStockStatus(epi))}</td><td>${html(epi.ca)}</td><td>${html(shortDate(epi.caValidity))}</td><td>${html(getCaAlertLevel(epi.caValidity))}</td></tr>`).join('');

  const swapRows = data.swaps.filter(s => !['Concluída', 'Reprovada'].includes(s.status)).map(swap => {
    const employee = data.employees.find(e => e.id === swap.employeeId);
    const epi = data.epis.find(e => e.id === swap.epiId);
    return `<tr><td>${html(employee?.name ?? 'Colaborador')}</td><td>${html(epi?.name ?? 'EPI')}</td><td>${swap.quantity ?? 1}</td><td>${html(swap.reason)}</td><td>${html(swap.status)}</td><td>${html(shortDate(swap.createdAt))}</td></tr>`;
  }).join('');

  const purchaseRows = data.purchases.slice(0, 10).map(purchase => `<tr><td>${html(shortDate(purchase.purchasedAt))}</td><td>${html(purchase.supplier)}</td><td>${html(purchase.invoice)}</td><td>${purchase.items.length}</td><td>${purchase.items.reduce((sum, item) => sum + item.quantity, 0)}</td><td>${html(money(purchase.total))}</td></tr>`).join('');

  const htmlContent = `<!doctype html><html><head><meta charset="utf-8"><style>
  @page{size:A4 landscape;margin:13mm}body{font-family:Arial,sans-serif;color:#17212B;font-size:9px}h1{color:#1463FF;margin:0;font-size:24px}h2{margin:16px 0 7px;font-size:14px}.head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #1463FF;padding-bottom:9px}.demo{background:#FFF4DE;color:#9A6700;padding:6px 9px;border-radius:7px}.cards{display:grid;grid-template-columns:repeat(7,1fr);gap:6px;margin:12px 0}.card{border:1px solid #E5E7EB;border-radius:8px;padding:8px}.card b{font-size:14px;display:block;margin-top:3px}.charts{display:grid;grid-template-columns:1fr 1fr;gap:10px}.chart{border:1px solid #E5E7EB;border-radius:9px;padding:9px;break-inside:avoid}.bar-row{display:grid;grid-template-columns:105px 1fr 62px;gap:6px;align-items:center;margin:6px 0}.bar{height:8px;background:#EEF2F6;border-radius:99px;overflow:hidden}.bar i{display:block;height:100%;border-radius:99px}.empty{color:#667085;padding:8px 0}table{width:100%;border-collapse:collapse;font-size:7.5px;break-inside:auto}thead{display:table-header-group}th{background:#17212B;color:#fff;text-align:left;padding:5px}td{border-bottom:1px solid #E5E7EB;padding:4px;vertical-align:top}.section{break-inside:avoid}.pagebreak{page-break-before:always}.foot{margin-top:10px;color:#667085;font-size:7px}.risk{background:#FFF9EE;border:1px solid #F3C279;border-radius:8px;padding:8px;margin-top:10px}
  </style></head><body>
  <div class="head"><div><h1>ATC Controle EPI</h1><div>Relatório consolidado operacional</div></div>${data.demoData ? '<div class="demo">Dados demonstrativos e editáveis</div>' : ''}</div>
  <div class="cards"><div class="card">Colaboradores ativos<b>${active}</b></div><div class="card">EPIs cadastrados<b>${data.epis.length}</b></div><div class="card">Saldo em estoque<b>${balance}</b></div><div class="card">Itens em atenção<b>${attention}</b></div><div class="card">CA em risco<b>${caRisk}</b></div><div class="card">Trocas abertas<b>${openSwaps}</b></div><div class="card">Valor do estoque<b>${html(money(inventoryValue))}</b></div></div>
  <div class="risk"><strong>Compras registradas:</strong> ${html(money(spend))} em ${data.purchases.length} compra(s). <strong>Entregas:</strong> ${data.deliveries.reduce((sum, d) => sum + d.quantity, 0)} unidade(s). <strong>Trocas concluídas:</strong> ${data.swaps.filter(s => s.status === 'Concluída').length}.</div>
  <div class="charts"><div class="chart"><h2>Gastos por mês</h2>${bars(spendByMonth, '#1463FF', money)}</div><div class="chart"><h2>EPIs mais utilizados</h2>${bars(used, '#16845B')}</div><div class="chart"><h2>Custo estimado por colaborador</h2>${bars(employeeCosts, '#7C3AED', money)}</div><div class="chart"><h2>Trocas por colaborador</h2>${bars(swapsByEmployee, '#F59E0B')}</div><div class="chart"><h2>Entregas por mês</h2>${bars(deliveriesByMonth, '#1463FF')}</div></div>
  <h2>Riscos operacionais</h2>${riskRows ? `<table><thead><tr><th>EPI</th><th>Est./mín.</th><th>Estoque</th><th>CA</th><th>Validade</th><th>Risco CA</th></tr></thead><tbody>${riskRows}</tbody></table>` : '<div class="empty">Nenhum risco de estoque ou CA identificado.</div>'}
  <h2>Trocas em andamento</h2>${swapRows ? `<table><thead><tr><th>Colaborador</th><th>EPI</th><th>Qtd.</th><th>Motivo</th><th>Status</th><th>Abertura</th></tr></thead><tbody>${swapRows}</tbody></table>` : '<div class="empty">Nenhuma troca em andamento.</div>'}
  <div class="pagebreak"></div><h2>Estoque detalhado</h2><table><thead><tr><th>EPI</th><th>Categoria</th><th>Marca</th><th>Modelo</th><th>Tam.</th><th>CA</th><th>Val. CA</th><th>Atual</th><th>Mín.</th><th>Status</th><th>CA risco</th><th>Valor</th><th>Fornecedor</th></tr></thead><tbody>${stockRows}</tbody></table>
  <h2>Últimas compras</h2>${purchaseRows ? `<table><thead><tr><th>Data</th><th>Fornecedor</th><th>NF</th><th>Linhas</th><th>Unidades</th><th>Total</th></tr></thead><tbody>${purchaseRows}</tbody></table>` : '<div class="empty">Nenhuma compra registrada.</div>'}
  <div class="foot">ATC Controle EPI • relatório gerado localmente no dispositivo. Custos por colaborador são estimados com o valor unitário atual do cadastro de cada EPI.</div>
  </body></html>`;

  const file = await Print.printToFileAsync({ html: htmlContent, width: 842, height: 595 });
  await shareAsync(file.uri, { UTI: '.pdf', mimeType: 'application/pdf', dialogTitle: 'Compartilhar relatório ATC Controle EPI' });
}
