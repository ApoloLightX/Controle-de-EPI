import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { demoData } from '../data/demo';
import { applyStockExit, calculatePurchaseTotal, canCompleteSwap, canDeliver, nextSwapStatusForApproval } from '../domain/rules';
import { AppData, Delivery, Epi, Employee, Purchase, Session, SwapRequest } from '../models';
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
  deleteEpi: (epiId: string) => Promise<void>;
  registerDelivery: (employeeId: string, epiId: string, quantity: number, reason: string) => Promise<boolean>;
  createSwap: (input: Omit<SwapRequest, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => Promise<void>;
  setSwapStatus: (swapId: string, status: 'approve' | 'reject' | 'analysis' | 'complete') => Promise<boolean>;
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
    const initials = input.name.split(' ').slice(0,2).map(n=>n[0]?.toUpperCase()).join('') || 'EP';
    await commit({ ...data, employees: [...data.employees, { ...input, id: id('emp'), avatarInitials: initials }] });
  };

  const updateEmployee = async (employee: Employee) => {
    await commit({ ...data, employees: data.employees.map(e => e.id === employee.id ? employee : e) });
  };

  const deleteEmployee = async (employeeId: string) => {
    await commit({ ...data, employees: data.employees.filter(e => e.id !== employeeId) });
  };

  const addEpi = async (input: EpiInput) => {
    await commit({ ...data, epis: [...data.epis, { ...input, id: id('epi'), lastPurchase: nowDate() }] });
  };

  const updateEpi = async (epi: Epi) => {
    await commit({ ...data, epis: data.epis.map(e => e.id === epi.id ? epi : e) });
  };

  const deleteEpi = async (epiId: string) => {
    await commit({ ...data, epis: data.epis.filter(e => e.id !== epiId) });
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
    const swap: SwapRequest = { ...input, id: id('swap'), status: 'Pendente', createdAt, updatedAt: createdAt };
    await commit({ ...data, swaps: [swap, ...data.swaps] });
  };

  const setSwapStatus = async (swapId: string, action: 'approve' | 'reject' | 'analysis' | 'complete') => {
    const swap = data.swaps.find(s => s.id === swapId);
    if (!swap) return false;
    const epi = data.epis.find(e => e.id === swap.epiId);
    if (!epi) return false;

    if (action === 'complete') {
      if (!canCompleteSwap(swap, epi)) return false;
      const deliveryId = id('del');
      const nextStock = applyStockExit(epi.stock, 1);
      await commit({
        ...data,
        epis: data.epis.map(e => e.id === epi.id ? { ...e, stock: nextStock } : e),
        swaps: data.swaps.map(s => s.id === swapId ? { ...s, status: 'Concluída', updatedAt: nowDate() } : s),
        deliveries: [{ id: deliveryId, employeeId: swap.employeeId, epiId: swap.epiId, quantity: 1, reason: `Troca: ${swap.reason}`, deliveredAt: nowDate() }, ...data.deliveries],
        movements: [{ id: id('mov'), epiId: epi.id, type: 'Saída', quantity: 1, referenceType: 'Troca', referenceId: swap.id, createdAt: nowDate() }, ...data.movements]
      });
      return true;
    }

    const status = action === 'approve' ? nextSwapStatusForApproval(epi) : action === 'reject' ? 'Reprovada' : 'Em análise';
    await commit({ ...data, swaps: data.swaps.map(s => s.id === swapId ? { ...s, status, updatedAt: nowDate() } : s) });
    return true;
  };

  const registerPurchase = async (input: PurchaseInput) => {
    const total = calculatePurchaseTotal(input.items);
    const purchaseId = id('pur');
    const purchase: Purchase = { ...input, id: purchaseId, total, purchasedAt: nowDate() };
    const stockAdds = new Map(input.items.map(item => [item.epiId, item]));
    const epis = data.epis.map(epi => {
      const item = stockAdds.get(epi.id);
      return item ? { ...epi, stock: epi.stock + item.quantity, unitValue: item.unitValue, supplier: input.supplier, lastPurchase: nowDate() } : epi;
    });
    const movements = input.items.map(item => ({ id: id('mov'), epiId: item.epiId, type: 'Entrada' as const, quantity: item.quantity, referenceType: 'Compra' as const, referenceId: purchaseId, createdAt: nowDate() }));
    await commit({ ...data, epis, purchases: [purchase, ...data.purchases], movements: [...movements, ...data.movements] });
  };

  const value: AppContextValue = { ready, data, session, loginAdmin, loginEmployee, logout, resetDemo, addEmployee, updateEmployee, deleteEmployee, addEpi, updateEpi, deleteEpi, registerDelivery, createSwap, setSwapStatus, registerPurchase };
  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp deve ser usado dentro de AppProvider');
  return ctx;
}
