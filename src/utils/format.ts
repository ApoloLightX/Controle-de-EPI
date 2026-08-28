export const money = (value: number) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
export const shortDate = (value: string) => new Date(`${value}T12:00:00`).toLocaleDateString('pt-BR');
export const nowDate = () => new Date().toISOString().slice(0, 10);
export const id = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
