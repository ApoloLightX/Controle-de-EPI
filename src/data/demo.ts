import { AppData } from '../models';

export const demoData: AppData = {
  demoData: true,
  employees: [
    { id: 'emp-1', name: 'João da Silva', registration: '000123', sector: 'Manutenção', jobTitle: 'Técnico de Manutenção', status: 'Ativo', avatarInitials: 'JS', email: 'joao@empresa.demo', phone: '(11) 99999-1001', admissionDate: '2024-03-15', pin: '1234' },
    { id: 'emp-2', name: 'Mariana Costa', registration: '000124', sector: 'Operações', jobTitle: 'Operadora', status: 'Ativo', avatarInitials: 'MC', email: 'mariana@empresa.demo', phone: '(11) 99999-1002', admissionDate: '2023-11-06', pin: '2468' },
    { id: 'emp-3', name: 'Carlos Nunes', registration: '000125', sector: 'Almoxarifado', jobTitle: 'Almoxarife', status: 'Ativo', avatarInitials: 'CN', email: 'carlos@empresa.demo', phone: '(11) 99999-1003', admissionDate: '2025-01-20', pin: '1357' },
    { id: 'emp-4', name: 'Aline Rocha', registration: '000126', sector: 'Segurança do Trabalho', jobTitle: 'Técnica de Segurança', status: 'Ativo', avatarInitials: 'AR', email: 'aline@empresa.demo', phone: '(11) 99999-1004', admissionDate: '2022-08-01', pin: '4321' }
  ],
  epis: [
    { id: 'epi-1', name: 'Capacete de Segurança', category: 'Cabeça', brand: 'MSA', model: 'V-Gard', size: 'Único', ca: '12345', caValidity: '2027-12-20', stock: 25, minStock: 10, unitValue: 45.9, supplier: 'Protege Brasil', lastPurchase: '2026-08-10' },
    { id: 'epi-2', name: 'Óculos de Segurança', category: 'Olhos', brand: '3M', model: 'Virtua', size: 'Único', ca: '54321', caValidity: '2027-08-15', stock: 5, minStock: 10, unitValue: 18.5, supplier: 'SegMax Suprimentos', lastPurchase: '2026-08-02' },
    { id: 'epi-3', name: 'Luva de Vaqueta', category: 'Mãos', brand: 'Kalipso', model: 'Vaqueta Pro', size: 'G', ca: '67890', caValidity: '2027-03-01', stock: 0, minStock: 15, unitValue: 23, supplier: 'Protege Brasil', lastPurchase: '2026-07-12' },
    { id: 'epi-4', name: 'Protetor Auricular', category: 'Audição', brand: '3M', model: 'Peltor', size: 'Único', ca: '11223', caValidity: '2027-11-10', stock: 30, minStock: 10, unitValue: 37.9, supplier: 'SegMax Suprimentos', lastPurchase: '2026-08-18' },
    { id: 'epi-5', name: 'Botina de Segurança', category: 'Pés', brand: 'Marluvas', model: 'Premier', size: '42', ca: '44556', caValidity: '2028-01-05', stock: 8, minStock: 8, unitValue: 119.9, supplier: 'Calçados Industriais SP', lastPurchase: '2026-08-04' }
  ],
  deliveries: [
    { id: 'del-1', employeeId: 'emp-1', epiId: 'epi-1', quantity: 1, reason: 'Entrega inicial', deliveredAt: '2026-05-10' },
    { id: 'del-2', employeeId: 'emp-1', epiId: 'epi-2', quantity: 1, reason: 'Troca por dano', deliveredAt: '2026-07-02' },
    { id: 'del-3', employeeId: 'emp-2', epiId: 'epi-4', quantity: 1, reason: 'Entrega inicial', deliveredAt: '2026-08-03' },
    { id: 'del-4', employeeId: 'emp-3', epiId: 'epi-5', quantity: 1, reason: 'Entrega inicial', deliveredAt: '2026-08-18' }
  ],
  swaps: [
    { id: 'swap-1', employeeId: 'emp-1', epiId: 'epi-2', reason: 'Dano', description: 'Lente riscada após atividade de manutenção.', status: 'Pendente', createdAt: '2026-08-26', updatedAt: '2026-08-26' },
    { id: 'swap-2', employeeId: 'emp-2', epiId: 'epi-3', reason: 'Desgaste', description: 'Luva com desgaste excessivo.', status: 'Aguardando estoque', createdAt: '2026-08-25', updatedAt: '2026-08-26' },
    { id: 'swap-3', employeeId: 'emp-3', epiId: 'epi-5', reason: 'Tamanho inadequado', description: 'Necessita numeração 43.', status: 'Em análise', createdAt: '2026-08-24', updatedAt: '2026-08-24' }
  ],
  purchases: [
    { id: 'pur-1', supplier: 'Protege Brasil', cnpj: '12.345.678/0001-90', invoice: 'NF-20260810', items: [{ epiId: 'epi-1', quantity: 20, unitValue: 45.9 }], total: 918, purchasedAt: '2026-08-10' },
    { id: 'pur-2', supplier: 'SegMax Suprimentos', cnpj: '98.765.432/0001-10', invoice: 'NF-20260818', items: [{ epiId: 'epi-4', quantity: 30, unitValue: 37.9 }], total: 1137, purchasedAt: '2026-08-18' }
  ],
  movements: []
};
