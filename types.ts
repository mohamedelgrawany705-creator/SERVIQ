export interface OrderItem {
  id: string;
  productId: string; // Link to the Product ID
  name: string;
  quantity: number;
  price: number;
  isGift?: boolean;
}

export type OrderStatus = 'قيد التنفيذ' | 'مكتمل' | 'ملغى';

export interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone1: string;
  customerPhone2?: string;
  customerGovernorate: string;
  customerAddress: string;
  orderDate: string; // Should be ISO string format
  items: OrderItem[];
  status: OrderStatus;
  discount?: number; // in percentage
}

export type ThemeColor = 'purple' | 'blue' | 'green' | 'classic';
export type InvoiceFontFamily = 'sans' | 'serif' | 'mono';

export interface PromotionSetting {
  enabled: boolean;
  triggerProductId: string | null;
  giftProductId: string | null;
}

export interface InvoiceSettings {
  logo?: string; // Base64 encoded image
  companyName?: string;
  companyAddress?: string;
  companyContact?: string;
  showTax: boolean;
  showDiscount: boolean;
  theme: ThemeColor;
  fontFamily: InvoiceFontFamily;
  invoiceTitle: string;
  footerNotes: string;
  promotion: PromotionSetting;
}

export interface Product {
    id: string;
    name: string;
    price: number;
}


export type View = 'home' | 'dashboard' | 'list' | 'form' | 'invoice' | 'settings' | 'products' | 'post-creation' | 'batch-form';