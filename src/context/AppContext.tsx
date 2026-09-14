import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { demoData } from '../data/demo';
import {
  applyStockExit,
  calculatePurchaseTotal,
  canApplySwapAction,
  canCompleteSwap,
  canDeliver,
  isValidIsoDate,
  isValidPin,
  nextSwapStatusForApproval,
} from '../domain/rules';
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
  addEmployee: (input: EmployeeInput) => Promise<boolean>;
  updateEmployee: (employee: Employee) => Promise<boolean>;
  deleteEmployee: (employeeId: string) => Promise<boolean>;
  addEpi: (input: EpiInput) => Promise<void>;
  updateEpi: (epi: Epi) => Promise<void>;
  deleteEpi: (epiId: string) => Promise<boolean>;
  registerDelivery: (employeeId: string, epiId: string, quantity: number, reason: string) => Promise<boolean>;
  createSwap: (input: Omit<SwapRequest, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => Promise<boolean>;
  setSwapStatus: (swapId: string, status: 'approve' | 'reject' | 'analysis' | 'complete', note?: string) => Promise<boolean>;
  registerPurchase: (input: PurchaseInput) => Promise<boolean>;
};

const AppContext = createContext<AppContextValue | null>(null);

function normalizeStoredData(value: unknown): AppData | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Partial<AppData>;
  if (!Array.isArray(raw.employees)
    || !Array.isArray(raw.epis)
    || !Array.isArray(raw.deliveries)
    || !Array.isArray(raw.swaps)
    || !Array.isArray(raw.purchases)) return null;

  return {
    employees: raw.employees,
    epis: raw.epis,
    deliveries: raw.deliveries,
    swaps: raw.swaps,
    purchases: raw.purchases,
    movements: Array.isArray(raw.movements) ? raw.movements : [],
    demoData: raw.demoData === true,
  };
}

function normalizeStoredSession(value: unknown): Session | null {
  if (!value || typeof value !== 'object') return null;
  const raw = value as Partial<Session>;
  if (raw.role === 'admin' && typeof raw.displayName === 'string') {
    return { role: 'admin', displayName: raw.displayName };
  }
  if (raw.role === 'employee' && typeof raw.employeeId === 'string' && typeof raw.displayName === 'string') {
    return { role: 'employee', employeeId: raw.employeeId, displayName: raw.displayName };
  }
  return null;
}

function sessionIsValid(session: Session, data: AppData) {
  if (session.role === 'admin') return true;
  return data.employees.some(employee => employee.id === session.employeeId && employee.status === 'Ativo');
}

function initialsFor(name: string) {
  return name.split(' ').filter(Boolean).slice(0, 2).map(part => part[0]?.toUpperCase()).join('') || 'EP';
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [data, setData] = useState<AppData>(demoData);
  const [session, setSession] = useState<Session | null>(null);
  const dataRef = useRef<AppData>(demoData);
  const sessionRef = useRef<Session | null>(null);
  const writeQueue = useRef<Promise<void>>(Promise.resolve());

  useEffect(() => {
    (async () => {
      try {
        const [storedData, storedSession] = await Promise.all([
          AsyncStorage.getItem(DATA_KEY),
          AsyncStorage.getItem(SESSION_KEY),
        ]);

        let loadedData = demoData;
        if (storedData) {
          try {
            loadedData = normalizeStoredData(JSON.parse(storedData)) ?? demoData;
          } catch {
            loadedData = demoData;
          }
        }

        dataRef.current = loadedData;
        setData(loadedData);

        let loadedSession: Session | null = null;
        if (storedSession) {
          try {
            loadedSession = normalizeStoredSession(JSON.parse(storedSession));
          } catch {
            loadedSession = null;
          }
        }

        if (loadedSession && sessionIsValid(loadedSession, loadedData)) {
          sessionRef.current = loadedSession;
          setSession(loadedSession);
        } else if (storedSession) {
          await AsyncStorage.removeItem(SESSION_KEY);
        }
      } finally {
        setReady(true);
      }
    })();
  }, []);

  const commit = async (next: AppData) => {
    dataRef.current = next;
    setData(next);
    const persist = () => AsyncStorage.setItem(DATA_KEY, JSON.stringify(next));
    writeQueue.current = writeQueue.current.then(persist, persist);
    await writeQueue.current;
  };

  const loginAdmin = async (username: string, pin: string) => {
    const ok = username.trim().toLowerCase() === 'admin' && pin === '0000';
    if (!ok) return false;
    const next = { role: 'admin' as const, displayName: 'Administrador' };
    sessionRef.current = next;
    setSession(next);
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(next));
    return true;
  };

  const loginEmployee = async (registration: string, pin: string) => {
    const current = dataRef.current;
    const employee = current.employees.find(e => e.registration === registration.trim() && e.pin === pin && e.status === 'Ativo');
    if (!employee) return false;
    const next = { role: 'employee' as const, employeeId: employee.id, displayName: employee.name };
    sessionRef.current = next;
    setSession(next);
    await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(next));
    return true;
  };

  const logout = async () => {
    sessionRef.current = null;
    setSession(null);
    await AsyncStorage.removeItem(SESSION_KEY);
  };

  const resetDemo = async () => {
    await commit(demoData);
  };

  const addEmployee = async (input: EmployeeInput) => {
    if (sessionRef.current?.role !== 'admin') return false;
    const current = dataRef.current;
    const normalized: EmployeeInput = {
      ...input,
      name: input.name.trim(),
      registration: input.registration.trim(),
      sector: input.sector.trim(),
      jobTitle: input.jobTitle.trim(),
      email: input.email?.trim(),
      phone: input.phone?.trim(),
      admissionDate: input.admissionDate.trim(),
      pin: input.pin.trim(),
    };
    if (!normalized.name || !normalized.registration || !normalized.sector || !normalized.jobTitle
      || !isValidIsoDate(normalized.admissionDate) || !isValidPin(normalized.pin)
      || current.employees.some(employee => employee.registration === normalized.registration)) return false;

    const employee: Employee = { ...normalized, id: id('emp'), avatarInitials: initialsFor(normalized.name) };
    await commit({ ...current, employees: [...current.employees, employee] });
    return true;
  };

  const updateEmployee = async (employee: Employee) => {
    if (sessionRef.current?.role !== 'admin') return false;
    const current = dataRef.current;
    const existing = current.employees.find(item => item.id === employee.id);
    if (!existing) return false;

    const normalized: Employee = {
      ...employee,
      id: existing.id,
      name: employee.name.trim(),
      registration: employee.registration.trim(),
      sector: employee.sector.trim(),
      jobTitle: employee.jobTitle.trim(),
      email: employee.email?.trim(),
      phone: employee.phone?.trim(),
      admissionDate: employee.admissionDate.trim(),
      pin: employee.pin.trim(),
      avatarInitials: initialsFor(employee.name.trim()),
    };
    if (!normalized.name || !normalized.registration || !normalized.sector || !normalized.jobTitle
      || !isValidIsoDate(normalized.admissionDate) || !isValidPin(normalized.pin)
      || current.employees.some(item => item.id !== normalized.id && item.registration === normalized.registration)) return false;

    await commit({ ...current, employees: current.employees.map(item => item.id === normalized.id ? normalized : item) });
    return true;
  };

  const deleteEmployee = async (employeeId: string) => {
    if (sessionRef.current?.role !== 'admin') return false;
    const current = dataRef.current;
    const referenced = current.deliveries.some(delivery => delivery.employeeId === employeeId)
      || current.swaps.some(swap => swap.employeeId === employeeId);
    if (referenced) return false;
    await commit({ ...current, employees: current.employees.filter(employee => employee.id !== employeeId) });
    return true;
  };

  const addEpi = async (input: EpiInput) => {
    if (sessionRef.current?.role !== 'admin') return;
    const current = dataRef.current;
    const epiId = id('epi');
    const createdAt = nowDate();
    const epi: Epi = { ...input, id: epiId, lastPurchase: createdAt };
    const initialMovement = input.stock > 0 ? [{ id: id('mov'), epiId, type: 'Entrada' as const, quantity: input.stock, referenceType: 'Ajuste' as const, referenceId: epiId, createdAt }] : [];
    await commit({ ...current, epis: [...current.epis, epi], movements: [...initialMovement, ...current.movements] });
  };

  const updateEpi = async (epi: Epi) => {
    if (sessionRef.current?.role !== 'admin') return;
    const current = dataRef.current;
    const existing = current.epis.find(item => item.id === epi.id);
    if (!existing) return;
    const safeEpi: Epi = { ...epi, id: existing.id, stock: existing.stock, lastPurchase: existing.lastPurchase };
    await commit({ ...current, epis: current.epis.map(item => item.id === safeEpi.id ? safeEpi : item) });
  };

  const deleteEpi = async (epiId: string) => {
    if (sessionRef.current?.role !== 'admin') return false;
    const current = dataRef.current;
    const referenced = current.deliveries.some(d => d.epiId === epiId)
      || current.swaps.some(s => s.epiId === epiId)
      || current.purchases.some(p => p.items.some(item => item.epiId === epiId))
      || current.movements.some(m => m.epiId === epiId);
    if (referenced) return false;
    await commit({ ...current, epis: current.epis.filter(e => e.id !== epiId) });
    return true;
  };

  const registerDelivery = async (employeeId: string, epiId: string, quantity: number, reason: string) => {
    if (sessionRef.current?.role !== 'admin') return false;
    const current = dataRef.current;
    const epi = current.epis.find(e => e.id === epiId);
    const employee = current.employees.find(e => e.id === employeeId);
    const cleanReason = reason.trim();
    if (!epi || !employee || employee.status !== 'Ativo' || !cleanReason || !canDeliver(epi, quantity)) return false;
    const deliveryId = id('del');
    const createdAt = nowDate();
    const delivery: Delivery = { id: deliveryId, employeeId, epiId, quantity, reason: cleanReason, deliveredAt: createdAt };
    const nextStock = applyStockExit(epi.stock, quantity);
    await commit({
      ...current,
      epis: current.epis.map(e => e.id === epiId ? { ...e, stock: nextStock } : e),
      deliveries: [delivery, ...current.deliveries],
      movements: [{ id: id('mov'), epiId, type: 'Saída', quantity, referenceType: 'Entrega', referenceId: deliveryId, createdAt }, ...current.movements],
    });
    return true;
  };

  const createSwap = async (input: Omit<SwapRequest, 'id' | 'status' | 'createdAt' | 'updatedAt'>) => {
    const currentSession = sessionRef.current;
    if (!currentSession) return false;
    if (currentSession.role === 'employee' && currentSession.employeeId !== input.employeeId) return false;

    const current = dataRef.current;
    const employee = current.employees.find(item => item.id === input.employeeId);
    const epi = current.epis.find(item => item.id === input.epiId);
    const quantity = input.quantity ?? 1;
    const deliveredBefore = current.deliveries.some(delivery => delivery.employeeId === input.employeeId && delivery.epiId === input.epiId);
    if (!employee || employee.status !== 'Ativo' || !epi || !deliveredBefore
      || !Number.isInteger(quantity) || quantity <= 0 || !input.reason.trim() || !input.description.trim()) return false;

    const createdAt = nowDate();
    const swap: SwapRequest = {
      ...input,
      reason: input.reason.trim(),
      description: input.description.trim(),
      quantity,
      id: id('swap'),
      status: 'Pendente',
      createdAt,
      updatedAt: createdAt,
    };
    await commit({ ...current, swaps: [swap, ...current.swaps] });
    return true;
  };

  const setSwapStatus = async (swapId: string, action: 'approve' | 'reject' | 'analysis' | 'complete', note?: string) => {
    if (sessionRef.current?.role !== 'admin') return false;
    const current = dataRef.current;
    const swap = current.swaps.find(s => s.id === swapId);
    if (!swap || !canApplySwapAction(swap, action)) return false;
    const epi = current.epis.find(e => e.id === swap.epiId);
    if (!epi) return false;
    const quantity = swap.quantity ?? 1;
    const cleanNote = note?.trim();

    if (action === 'complete') {
      if (!canCompleteSwap(swap, epi)) return false;
      const deliveryId = id('del');
      const completedAt = nowDate();
      const nextStock = applyStockExit(epi.stock, quantity);
      await commit({
        ...current,
        epis: current.epis.map(e => e.id === epi.id ? { ...e, stock: nextStock } : e),
        swaps: current.swaps.map(s => s.id === swapId ? {
          ...s,
          status: 'Concluída',
          adminNote: cleanNote || s.adminNote,
          updatedAt: completedAt,
          resolvedAt: completedAt,
        } : s),
        deliveries: [{ id: deliveryId, employeeId: swap.employeeId, epiId: swap.epiId, quantity, reason: `Troca: ${swap.reason}`, deliveredAt: completedAt }, ...current.deliveries],
        movements: [{ id: id('mov'), epiId: epi.id, type: 'Saída', quantity, referenceType: 'Troca', referenceId: swap.id, createdAt: completedAt }, ...current.movements],
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
      ...current,
      swaps: current.swaps.map(s => s.id === swapId ? {
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
    if (sessionRef.current?.role !== 'admin') return false;
    const current = dataRef.current;
    if (!input.supplier.trim() || !input.cnpj.trim() || !input.invoice.trim() || input.items.length === 0) return false;
    const epiIds = new Set(current.epis.map(epi => epi.id));
    if (input.items.some(item => !epiIds.has(item.epiId))) return false;

    let total: number;
    try {
      total = calculatePurchaseTotal(input.items);
    } catch {
      return false;
    }

    const purchaseId = id('pur');
    const purchasedAt = nowDate();
    const purchase: Purchase = {
      ...input,
      supplier: input.supplier.trim(),
      cnpj: input.cnpj.trim(),
      invoice: input.invoice.trim(),
      id: purchaseId,
      total,
      purchasedAt,
    };

    const aggregated = input.items.reduce<Map<string, { quantity: number; unitValue: number }>>((map, item) => {
      const existing = map.get(item.epiId);
      if (existing) {
        map.set(item.epiId, { quantity: existing.quantity + item.quantity, unitValue: item.unitValue });
      } else {
        map.set(item.epiId, { quantity: item.quantity, unitValue: item.unitValue });
      }
      return map;
    }, new Map());

    const epis = current.epis.map(epi => {
      const item = aggregated.get(epi.id);
      return item ? {
        ...epi,
        stock: epi.stock + item.quantity,
        unitValue: item.unitValue,
        supplier: purchase.supplier,
        lastPurchase: purchasedAt,
      } : epi;
    });

    const stockByEpi = new Map(epis.map(epi => [epi.id, epi.stock]));
    const swaps = current.swaps.map(swap => {
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
      ...current,
      epis,
      swaps,
      purchases: [purchase, ...current.purchases],
      movements: [...movements, ...current.movements],
    });
    return true;
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
