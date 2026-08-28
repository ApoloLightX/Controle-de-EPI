import * as Print from 'expo-print';
import { shareAsync } from 'expo-sharing';
import { AppData } from '../models';
import { getStockStatus } from '../domain/rules';
import { money, shortDate } from './format';

function bars(items: Array<{ label: string; value: number }>, color: string) {
  const max = Math.max(1, ...items.map(i => i.value));
  return items.map(i => `<div class="bar-row"><span>${i.label}</span><div class="bar"><i style="width:${Math.round((i.value/max)*100)}%;background:${color}"></i></div><strong>${i.value}</strong></div>`).join('');
}

export async function exportConsolidatedPdf(data: AppData) {
  const active = data.employees.filter(e => e.status === 'Ativo').length;
  const balance = data.epis.reduce((s, e) => s + e.stock, 0);
  const attention = data.epis.filter(e => getStockStatus(e) !== 'Normal').length;
  const spend = data.purchases.reduce((s, p) => s + p.total, 0);

  const spendByMonth = Object.entries(data.purchases.reduce<Record<string, number>>((acc, p) => {
    const month = p.purchasedAt.slice(0, 7);
    acc[month] = (acc[month] ?? 0) + p.total;
    return acc;
  }, {})).map(([label, value]) => ({ label, value: Math.round(value) }));

  const used = data.epis.map(epi => ({ label: epi.name, value: data.deliveries.filter(d => d.epiId === epi.id).reduce((s,d)=>s+d.quantity,0) })).sort((a,b)=>b.value-a.value).slice(0,5);
  const swapsByEmployee = data.employees.map(emp => ({ label: emp.name.split(' ')[0] ?? emp.name, value: data.swaps.filter(s => s.employeeId === emp.id).length })).filter(x=>x.value>0);
  const deliveriesByMonth = Object.entries(data.deliveries.reduce<Record<string, number>>((acc,d)=>{ const m=d.deliveredAt.slice(0,7); acc[m]=(acc[m]??0)+d.quantity; return acc;},{})).map(([label,value])=>({label,value}));

  const rows = data.epis.map(epi => `<tr><td>${epi.name}</td><td>${epi.category}</td><td>${epi.brand}</td><td>${epi.model}</td><td>${epi.size}</td><td>${epi.ca}</td><td>${shortDate(epi.caValidity)}</td><td>${epi.stock}</td><td>${epi.minStock}</td><td>${getStockStatus(epi)}</td><td>${money(epi.unitValue)}</td><td>${epi.supplier}</td></tr>`).join('');

  const html = `<!doctype html><html><head><meta charset="utf-8"><style>
  @page{size:A4 landscape;margin:16mm}body{font-family:Arial,sans-serif;color:#17212B;font-size:10px}h1{color:#1463FF;margin:0}h2{margin:18px 0 8px}.head{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:3px solid #1463FF;padding-bottom:10px}.demo{background:#FFF4DE;color:#9A6700;padding:7px 10px;border-radius:7px}.cards{display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin:14px 0}.card{border:1px solid #E5E7EB;border-radius:9px;padding:10px}.card b{font-size:17px;display:block;margin-top:4px}.charts{display:grid;grid-template-columns:1fr 1fr;gap:14px}.chart{border:1px solid #E5E7EB;border-radius:10px;padding:10px;break-inside:avoid}.bar-row{display:grid;grid-template-columns:120px 1fr 48px;gap:7px;align-items:center;margin:7px 0}.bar{height:10px;background:#EEF2F6;border-radius:99px;overflow:hidden}.bar i{display:block;height:100%;border-radius:99px}table{width:100%;border-collapse:collapse;font-size:8px}th{background:#17212B;color:#fff;text-align:left;padding:6px}td{border-bottom:1px solid #E5E7EB;padding:5px}.foot{margin-top:10px;color:#667085;font-size:8px}
  </style></head><body>
  <div class="head"><div><h1>Controle EPI</h1><div>Relatório consolidado operacional</div></div><div class="demo">Dados demonstrativos e editáveis</div></div>
  <div class="cards"><div class="card">Colaboradores ativos<b>${active}</b></div><div class="card">EPIs cadastrados<b>${data.epis.length}</b></div><div class="card">Saldo em estoque<b>${balance}</b></div><div class="card">Estoque em atenção<b>${attention}</b></div><div class="card">Gastos disponíveis<b>${money(spend)}</b></div></div>
  <div class="charts"><div class="chart"><h2>Gastos por mês</h2>${bars(spendByMonth,'#1463FF')}</div><div class="chart"><h2>EPIs mais utilizados</h2>${bars(used,'#16845B')}</div><div class="chart"><h2>Trocas por colaborador</h2>${bars(swapsByEmployee,'#F59E0B')}</div><div class="chart"><h2>Entregas por mês</h2>${bars(deliveriesByMonth,'#1463FF')}</div></div>
  <h2>Estoque detalhado</h2><table><thead><tr><th>EPI</th><th>Categoria</th><th>Marca</th><th>Modelo</th><th>Tam.</th><th>CA</th><th>Val. CA</th><th>Atual</th><th>Mín.</th><th>Status</th><th>Valor</th><th>Fornecedor</th></tr></thead><tbody>${rows}</tbody></table>
  <div class="foot">ATC Controle EPI • relatório gerado localmente no dispositivo • informações demonstrativas neste MVP.</div>
  </body></html>`;
  const file = await Print.printToFileAsync({ html, width: 842, height: 595 });
  await shareAsync(file.uri, { UTI: '.pdf', mimeType: 'application/pdf', dialogTitle: 'Compartilhar relatório Controle EPI' });
}
