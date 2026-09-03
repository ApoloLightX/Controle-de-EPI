export type UserRole = 'admin' | 'employee';
export type EmployeeStatus = 'Ativo' | 'Inativo' | 'Afastado';
export type StockStatus = 'Normal' | 'Estoque baixo' | 'Sem estoque';
export type SwapStatus = 'Pendente' | 'Em análise' | 'Aprovada' | 'Reprovada' | 'Aguardando estoque' | 'Concluída';
export type MovementType = 'Entrada' | 'Saída';
export type CaAlertLevel = 'Ok' | 'Atenção' | 'Crítico' | 'Vencido';

export interface Session {
  role: UserRole;
  employeeId?: string;
  displayName: string;
}

export interface Employee {
  id: string;
  name: string;
  registration: string;
  sector: string;
  jobTitle: string;
  status: EmployeeStatus;
  avatarInitials: string;
  email?: string;
  phone?: string;
  admissionDate: string;
  pin: string;
}

export interface Epi {
  id: string;
  name: string;
  category: string;
  brand: string;
  model: string;
  size: string;
  ca: string;
  caValidity: string;
  stock: number;
  minStock: number;
  unitValue: number;
  supplier: string;
  lastPurchase: string;
}

export interface Delivery {
  id: string;
  employeeId: string;
  epiId: string;
  quantity: number;
  reason: string;
  deliveredAt: string;
}

export interface SwapRequest {
  id: string;
  employeeId: string;
  epiId: string;
  quantity?: number;
  reason: string;
  description: string;
  photoUri?: string;
  status: SwapStatus;
  adminNote?: string;
  rejectionReason?: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
}

export interface PurchaseItem {
  epiId: string;
  quantity: number;
  unitValue: number;
}

export interface Purchase {
  id: string;
  supplier: string;
  cnpj: string;
  invoice: string;
  items: PurchaseItem[];
  total: number;
  documentUri?: string;
  purchasedAt: string;
}

export interface StockMovement {
  id: string;
  epiId: string;
  type: MovementType;
  quantity: number;
  referenceType: 'Entrega' | 'Compra' | 'Troca' | 'Ajuste';
  referenceId: string;
  createdAt: string;
}

export interface AppData {
  employees: Employee[];
  epis: Epi[];
  deliveries: Delivery[];
  swaps: SwapRequest[];
  purchases: Purchase[];
  movements: StockMovement[];
  demoData: boolean;
}
