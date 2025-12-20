export type UserRole = 'admin' | 'kasir';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number; // Harga beli / cost price
  sellingPrice: number; // Harga jual
  stock: number;
  image?: string;
  sku?: string;
  description?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface Transaction {
  id: string;
  items: CartItem[];
  total: number;
  paymentMethod: 'cash' | 'card' | 'qris';
  cashierId: string;
  cashierName: string;
  createdAt: Date;
  customerPaid?: number;
  change?: number;
}

export interface DashboardStats {
  todaySales: number;
  totalTransactions: number;
  topProducts: { name: string; sold: number }[];
  recentTransactions: Transaction[];
}

// Supplier types
export interface Supplier {
  id: string;
  name: string;
  phone?: string;
  address?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Purchase types
export type PaymentStatus = 'pending' | 'partial' | 'paid';

export interface PurchaseItem {
  id: string;
  purchaseId: string;
  productId?: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export interface Purchase {
  id: string;
  purchaseId: string;
  supplierId?: string;
  supplier?: Supplier;
  total: number;
  paidAmount: number;
  paymentStatus: PaymentStatus;
  notes?: string;
  purchaseDate: Date;
  createdBy?: string;
  items: PurchaseItem[];
  payments: SupplierPayment[];
  createdAt: Date;
  updatedAt: Date;
}

// Supplier Payment types
export type PaymentMethod = 'cash' | 'transfer' | 'card';

export interface SupplierPayment {
  id: string;
  purchaseId: string;
  amount: number;
  paymentDate: Date;
  paymentMethod: PaymentMethod;
  notes?: string;
  createdBy?: string;
  createdAt: Date;
}

// Operational Expense types
export interface OperationalExpense {
  id: string;
  description: string;
  amount: number;
  expenseDate: Date;
  category: string;
  createdBy?: string;
  createdAt: Date;
  updatedAt: Date;
}
