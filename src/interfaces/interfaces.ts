import { Timestamp } from "firebase/firestore";

export interface User {
  categories: string[];
  sources: string[];
}

export interface Item {
  id: number;
  date: Timestamp;
  sales?: Array<{
    id: number;
    saleDate: Timestamp;
    refounded?: boolean;
  }>;
  invoiceId: number;
  state: string;
  cost: number | string;
  description: string;
  expired?: Timestamp;
}

export interface Invoice {
  id: number;
  type: InvoiceType;
  date: Timestamp;
  items: number;
  form: string;
  source: string;
  total: number;
  image: string;
  imageRef: string;
}

export interface InvoiceExpenses {
  id: number;
  type: InvoiceType;
  date: Timestamp;
  category: string;
  items: number[];
  total: number;
  image: string;
  imageRef: string;
}

export enum InvoiceType {
  Purchase,
  Expenses,
}

export interface Expense {
  id: number;
  date: Timestamp;
  price: number | string;
  category: string;
  description: string;
  invoiceId: number;
  productId: number;
}

export interface Sale {
  id: number;
  date: Timestamp;
  cost: number;
  price: number | string;
  productId: number;
  refounded?: Refounded;
  invoiceId: number;
  shipment: Shipment;
}

export interface Refounded {
  date: string;
  amount: number;
}

export interface Expired {
  date: Timestamp;
  itemId: string;
  expenseId: string;
}

export interface Shipment {
  value: boolean;
  amount: number | string;
}

/* REPORTS */
export interface YearReport {
  year: string;
  month: MonthReport[];
}

export interface MonthReport {
  month: string;
  expenses: ReportItem[];
  sales: ReportItem[];
  totalExpenses: number;
  totalSales: number;
}

export interface ReportItem {
  id: number;
  type: string;
  amount: number;
}

export interface YearTaxesData {
  year: number;
  month: MonthTaxesData[];
}

export interface MonthTaxesData {
  month: {
    number: number;
    name: string;
  };
  sales: {
    total: number;
    sales: number;
    shipment: number;
  };
  expenses: {
    total: number;
    COGS: number;
    shipLabel: number;
    ebayFees: number;
    adsFee: number;
    otherExpense: number;
    otherCategories: OtherCategories[];
  };
}

export interface ExportYearTaxesData {
  salesTotal: number;
  expensesTotal: number;
  profitTotal: number;
  months: ExportMonthTaxes[];
}

export interface ExportMonthTaxes {
  month: string;
  salesTotal: number;
  sales: number;
  shipment: number;
  expensesTotal: number;
  COGS: number;
  shipLabel: number;
  ebayFees: number;
  adsFee: number;
  otherExpense: number;
  otherCategories: OtherCategories[];
}

export interface ExportSales {
  invoiceId: number;
  itemId: number;
  date: string;
  unitCost: number;
  price: number;
  shipmentIncome: number;
  description: string;
}

export interface ExportExpired {
  id: number;
  invoiceId: number;
  date: string;
  unitCost: number;
  description: string;
}

export interface OtherCategories {
  category: string;
  total: number;
}

export interface RootState {
  user: User;
  items: {
    data: Item[];
    details: {
      invoice: Invoice;
      items: Item[];
    };
  };
  invoices: {
    data: Array<Invoice | InvoiceExpenses>;
    details: Array<Item> | Array<Expense>;
  };
  sales: {
    items: Item[];
    sales: Sale[];
    expenses: Expense[];
  };
  expired: Item[];
  reports: YearReport[];
  loading: boolean;
}

export const initSale: Sale = {
  id: 0,
  date: Timestamp.fromDate(new Date()),
  cost: 0,
  price: 0,
  productId: 0,
  invoiceId: 0,
  shipment: {
    value: false,
    amount: "",
  },
};