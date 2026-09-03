import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { demoData } from '../data/demo';
import { applyStockExit, calculatePurchaseTotal, canCompleteSwap, canDeliver, nextSwapStatusForApproval } from '../domain/rules';
import type { AppData, Delivery, Epi, Employee, Purchase, Session, SwapRequest } from '../models';
import { id, nowDate } from '../utils/format';

const DATA_KEY = '@atc-controle-epi:data:v1';
const SESSION_KEY = '@atc-controle-epi:session:v1';

type PurchaseInput = Omit<Purchase, 'id' | 'total' | 'purchasedAt'>;
type EmployeeInput = Omit<Employee, 'id' | 'avatarInitials'>;
type EpiInput = Omit<Epi, 'id' | 'lastPurchase'>;

type AppContextValue = {
  ready: boolean;
  data: AppData;
  session: Session | null;
  loginAdmin: (username: string, pin: string) => Promise<boolean>;
  loginEmployee: (registration: string, pin: string) => Promise<boolean>;
  logout: () => Promise<void>;
  resetDemo: () => Promise<void>;
  addEmployee: (input: EmployeeInput) => Promise<void>;
  updateEmployee: (employee: Employee) => Promise<void>;
  deleteEmployee: (employeeId: string) => Promise<void>;
  addEpi: (input: EpiInput) => Promise<void>;
  updateEpi: (epi: Epi) => Promise<void>;
  deleteEpi: (epiId: string) => Promise<boolean>;
  registerDelivery: (employeeId: string, epiId: string, quantity: number, reason: string) => Promise<boolean>;
  createSwap: (input: Omit<SwapRequest, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  setSwapStatus: (swapId: string, status: 'approve' | 'reject' | 'analysis' | 'complete', note?: string) => Promise<boolean>;
  registerPurchase: (input: PurchaseInput) => Promise<void>;
};

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [data, setData] = useState<AppData>(demoData);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [storedData, storedSession] = await Promise.all([
          AsyncStorage.getItem(DATA_KEY),
          AsyncStorage.getItem(SESSION_KEY),
        ]);
        if (storedData) setData(JSON.parse(storedData) as AppData);
        if (storedSession) setSession(JSON.parse(storedSession) as Session);
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const commit = async (next: AppData) => {
    setData(next);
    await AsyncStorage.setItem(DATA_KEY, JSON.stringify(next));
  };

  const loginAdmin = async (username: string, pin: string) => {
    const ok = username.trim().toLowerCase() === 'admin' && pin === '0000';
    if (!ok) return false;
    const next = { role: 'admin' as const, displayName: 'Administrador' };
    setSession(next);
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(next));
    return true;
  };

  const loginEmployee = async (registration: string, pin: string) => {
    const employee = data.employees.find(e => e.registration === registration.trim() && e.pin === pin && e.status === 'Ativo');
    if (!employee) return false;
    const next = { role: 'employee' as const, employeeId: employee.id, displayName: employee.name };
    setSession(next);
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(next));
    return true;
  };

  const logout = async () => {
    setSession(null);
    await AsyncStorage.removeItem(SESSION_KEY);
  };

  const resetDemo = async () => {
    await commit(demoData);
  };

  const addEmployee = async (input: EmployeeInput) => {
    const initials = input.name.split(' ').slice(0, 2).map(n => n[0]?.toUpperCase()).join('') || 'EP';
    await commit({ ...data, employees: [...data.employees, { ...input, id: id('emp'), avatarInitials: initials }] });
  };

  const updateEmployee = async (employee: Employee) => {
    await commit({ ...data, employees: data.employees.map(e => e.id === employee.id ? employee : e) });
  };

  const deleteEmployee = async (employeeId: string) => {
    await commit({ ...data, employees: data.employees.filter(e => e.id !== employeeId) });
  };

  const addEpi = async (input: EpiInput) => {
    const epiId = id('epi');
    const createdAt = nowDate();
    const epi: Epi = { ...input, id: epiId, lastPurchase: createdAt };
    const initialMovement = input.stock > 0 ? [{ id: id('mov'), epiId, type: 'Entrada' as const, quantity: input.stock, referenceType: 'Ajuste' as const, referenceId: epiId, createdAt }] : [];
    await commit({ ...data, epis: [...data.epis, epi], movements: [...initialMovement, ...data.movements] });
  };

  const updateEpi = async (epi: Epi) => {
    await commit({ ...data, epis: data.epis.map(e => e.id === epi.id ? epi : e) });
  };

  const deleteEpi = async (epiId: string) => {
    const referenced = data.deliveries.some(d => d.epiId === epiId)
      || data.swaps.some(s => s.epiId === epiId)
      || data.purchases.some(p => p.items.some(item => item.epiId === epiId))
      || data.movements.some(m => m.epiId === epiId);
    if (referenced) return false;
    await commit({ ...data, epis: data.epis.filter(e => e.id !== epiId) });
    return true;
  };

  const registerDelivery = async (employeeId: string, epiId: string, quantity: number, reason: string) => {
    const epi = data.epis.find(e => e.id === epiId);
    const employee = data.employees.find(e => e.id === employeeId);
    if (!epi || !employee || !canDeliver(epi, quantity)) return false;
    const deliveryId = id('del');
    const delivery: Delivery = { id: deliveryId, employeeId, epiId, quantity, reason, deliveredAt: nowDate() };
    const nextStock = applyStockExit(epi.stock, quantity);
    await commit({
      ...data,
      epis: data.epis.map(e => e.id === epiId ? { ...e, stock: nextStock } : e),
      deliveries: [delivery, ...data.deliveries],
      movements: [{ id: id('mov'), epiId, type: 'Saída', quantity, referenceType: 'Entrega', referenceId: deliveryId, createdAt: nowDate() }, ...data.movements],
    });
    return true;
  };

  const createSwap = async (input: Omit<SwapRequest, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => {
    const createdAt = nowDate();
    const swap: SwapRequest = {
      ...input,
      quantity: input.quantity ?? 1,
      id: id('swap'),
      status: 'Pendente',
      createdAt,
      updatedAt: createdAt,
    };
    await commit({ ...data, swaps: [swap, ...data.swaps] });
  };

  const setSwapStatus = async (swapId: string, action: 'approve' | 'reject' | 'analysis' | 'complete', note?: string) => {
    const swap = data.swaps.find(s => s.id === swapId);
    if (!swap) return false;
    const epi = data.epis.find(e => e.id === swap.epiId);
    if (!epi) return false;
    const quantity = swap.quantity ?? 1;
    const cleanNote = note?.trim();

    if (action === 'complete') {
      if (!canCompleteSwap(swap, epi)) return false;
      const deliveryId = id('del');
      const completedAt = nowDate();
      const nextStock = applyStockExit(epi.stock, quantity);
      await commit({
        ...data,
        epis: data.epis.map(e => e.id === epi.id ? { ...e, stock: nextStock } : e),
        swaps: data.swaps.map(s => s.id === swapId ? {
          ...s,
          status: 'Concluída',
          adminNote: cleanNote || s.adminNote,
          updatedAt: completedAt,
          resolvedAt: completedAt,
        } : s),
        deliveries: [{ id: deliveryId, employeeId: swap.employeeId, epiId: swap.epiId, quantity, reason: `Troca: ${swap.reason}`, deliveredAt: completedAt }, ...data.deliveries],
        movements: [{ id: id('mov'), epiId: epi.id, type: 'Saída', quantity, referenceType: 'Troca', referenceId: swap.id, createdAt: completedAt }, ...data.movements],
      });
      return true;
    }

    const updatedAt = nowDate();
    const status = action === 'approve'
      ? nextSwapStatusForApproval(epi, quantity)
      : action === 'reject'
        ? 'Reprovada'
        : 'Em análise';

    await commit({
      ...data,
      swaps: data.swaps.map(s => s.id === swapId ? {
        ...s,
        status,
        adminNote: action !== 'reject' && cleanNote ? cleanNote : s.adminNote,
        rejectionReason: action === 'reject' ? cleanNote || 'Solicitação reprovada pelo administrador.' : s.rejectionReason,
        updatedAt,
        resolvedAt: action === 'reject' ? updatedAt : s.resolvedAt,
      } : s),
    });
    return true;
  };

  const registerPurchase = async (input: PurchaseInput) => {
    const total = calculatePurchaseTotal(input.items);
    const purchaseId = id('pur');
    const purchasedAt = nowDate();
    const purchase: Purchase = { ...input, id: purchaseId, total, purchasedAt };

    const aggregated = input.items.reduce<Map<string, { quantity: number; unitValue: number }>>((map, item) => {
      const current = map.get(item.epiId);
      if (current) {
        map.set(item.epiId, { quantity: current.quantity + item.quantity, unitValue: item.unitValue });
      } else {
        map.set(item.epiId, { quantity: item.quantity, unitValue: item.unitValue });
      }
      return map;
    }, new Map());

    const epis = data.epis.map(epi => {
      const item = aggregated.get(epi.id);
      return item ? {
        ...epi,
        stock: epi.stock + item.quantity,
        unitValue: item.unitValue,
        supplier: input.supplier,
        lastPurchase: purchasedAt,
      } : epi;
    });

    const stockByEpi = new Map(epis.map(epi => [epi.id, epi.stock]));
    const swaps = data.swaps.map(swap => {
      if (swap.status !== 'Aguardando estoque') return swap;
      const quantity = swap.quantity ?? 1;
      const stock = stockByEpi.get(swap.epiId) ?? 0;
      return stock >= quantity ? {
        ...swap,
        status: 'Aprovada' as const,
        adminNote: swap.adminNote || 'Estoque reposto. Solicitação liberada automaticamente.',
        updatedAt: purchasedAt,
      } : swap;
    });

    const movements = input.items.map(item => ({
      id: id('mov'),
      epiId: item.epiId,
      type: 'Entrada' as const,
      quantity: item.quantity,
      referenceType: 'Compra' as const,
      referenceId: purchaseId,
      createdAt: purchasedAt,
    }));

    await commit({
      ...data,
      epis,
      swaps,
      purchases: [purchase, ...data.purchases],
      movements: [...movements, ...data.movements],
    });
  };

  const value: AppContextValue = {
    ready,
    data,
    session,
    loginAdmin,
    loginEmployee,
    logout,
    resetDemo,
    addEmployee,
    updateEmployee,
    deleteEmployee,
    addEpi,
    updateEpi,
    deleteEpi,
    registerDelivery,
    createSwap,
    setSwapStatus,
    registerPurchase,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp deve ser usado dentro de AppProvider');
  return ctx;
}
