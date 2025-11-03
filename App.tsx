import React, { useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import html2canvas from 'html2canvas';
import { Order, InvoiceSettings, View, Product } from './types';
import useLocalStorage from './hooks/useLocalStorage';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { OrderList } from './components/OrderList';
import { OrderForm } from './components/OrderForm';
import { InvoiceView } from './components/InvoiceView';
import { InvoiceSettingsForm } from './components/InvoiceSettings';
import { ProductManagement } from './components/ProductManagement';
import { Dashboard } from './components/Dashboard';
import { Home } from './components/Home';
import { Breadcrumbs } from './components/Breadcrumbs';
import { PostCreationView } from './components/PostCreationView';
import { Modal } from './components/Modal';
import { TrashIcon } from './components/icons';
import { BatchOrderForm } from './components/BatchOrderForm';
import { InvoicePreview } from './components/InvoicePreview';

// Fix: Replaced dynamic UUIDs with static IDs for product consistency.
const initialProducts: Product[] = [
    { id: 'prod-logo', name: 'تصميم شعار', price: 1500 },
    { id: 'prod-website', name: 'تصميم موقع ويب', price: 5000 },
    { id: 'prod-hosting', name: 'استضافة موقع (سنة)', price: 1000 },
    { id: 'prod-seo', name: 'باقة تحسين محركات البحث', price: 750 },
    { id: 'prod-social', name: 'إدارة حسابات التواصل الاجتماعي (شهر)', price: 2000 },
    { id: 'prod-ads', name: 'حملة إعلانية ممولة', price: 3000 },
];

const sampleOrders: Order[] = [
    {
        id: 'd9a8f7c6b5e4d3c2b1a0',
        orderNumber: 'SRV-8431',
        customerName: 'أحمد عبدالله',
        customerPhone1: '01234567890',
        customerGovernorate: 'القاهرة',
        customerAddress: '15 شارع طلعت حرب، وسط البلد',
        orderDate: '2023-10-26T10:00:00.000Z',
        items: [
// Fix: Added missing 'productId' to satisfy OrderItem type.
            { id: 'item-1', productId: 'prod-website', name: 'تصميم موقع ويب', quantity: 1, price: 5000 },
// Fix: Added missing 'productId' to satisfy OrderItem type.
            { id: 'item-2', productId: 'prod-seo', name: 'باقة تحسين محركات البحث', quantity: 1, price: 750 },
        ],
        status: 'مكتمل',
        discount: 10,
    },
    {
        id: 'f8e7d6c5b4a3d2c1b0a9',
        orderNumber: 'SRV-8430',
        customerName: 'فاطمة محمد',
        customerPhone1: '01098765432',
        customerGovernorate: 'الأسكندرية',
        customerAddress: '22 طريق الكورنيش، سيدي جابر',
        orderDate: '2023-10-28T12:30:00.000Z',
        items: [
// Fix: Added missing 'productId' to satisfy OrderItem type.
            { id: 'item-3', productId: 'prod-logo', name: 'تصميم شعار', quantity: 1, price: 1500 },
// Fix: Added missing 'productId' to satisfy OrderItem type.
            { id: 'item-4', productId: 'prod-hosting', name: 'استضافة موقع (سنة)', quantity: 1, price: 1000, isGift: true },
        ],
        status: 'قيد التنفيذ',
    }
];

const initialSettings: InvoiceSettings = {
  companyName: 'شركة سيرفيك',
  companyAddress: '١٢٣ شارع التقنية\nوادي السيليكون، كاليفورنيا ٩٤٠٤٣',
  companyContact: 'support@serviq.com',
  showTax: true,
  showDiscount: true,
  theme: 'purple',
  fontFamily: 'sans',
  invoiceTitle: 'فاتورة',
  footerNotes: 'شروط الدفع: خلال 30 يومًا من تاريخ الفاتورة.',
  promotion: {
    enabled: false,
    triggerProductId: null,
    giftProductId: null,
  },
};


const App: React.FC = () => {
  const [viewHistory, setViewHistory] = useState<View[]>(['home']);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [orders, setOrders] = useLocalStorage<Order[]>('orders', []);
  const [products, setProducts] = useLocalStorage<Product[]>('products', initialProducts);
  const [invoiceSettings, setInvoiceSettings] = useLocalStorage<InvoiceSettings>('invoiceSettings', initialSettings);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [lastCreatedOrder, setLastCreatedOrder] = useState<Order | null>(null);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);

  const currentView = viewHistory[viewHistory.length - 1];

  useEffect(() => {
    const isFirstVisit = !localStorage.getItem('orders_initialized');
    if (isFirstVisit) {
      setOrders(sampleOrders);
      localStorage.setItem('orders_initialized', 'true');
    }
  }, []);

  const navigate = (view: View) => {
    setViewHistory(prev => [...prev, view]);
  };

  const goBack = () => {
    setViewHistory(prev => prev.length > 1 ? prev.slice(0, -1) : prev);
  };
  
  const goBackTo = (index: number) => {
    setViewHistory(prev => prev.slice(0, index + 1));
  }
  
  const resetTo = (view: View) => {
    setViewHistory([view]);
  }

  const handleAddOrder = (order: Order) => {
    setOrders(prevOrders => [order, ...prevOrders]);
    setEditingOrder(null);
    setLastCreatedOrder(order);
    navigate('post-creation');
  };

  const handleAddBatchOrders = async (batchOrders: Omit<Order, 'id' | 'orderNumber' | 'orderDate' | 'status'>[]) => {
      const newOrders = batchOrders.map((orderData, index) => ({
          ...orderData,
          id: crypto.randomUUID(),
          orderNumber: `SRV-${(Date.now() + index).toString().slice(-6)}`,
          orderDate: new Date().toISOString(),
          status: 'قيد التنفيذ' as const,
      }));
      setOrders(prevOrders => [...newOrders, ...prevOrders]);

      if (newOrders.length > 0) {
        const downloadContainer = document.createElement('div');
        downloadContainer.style.position = 'fixed';
        downloadContainer.style.left = '-9999px';
        downloadContainer.style.top = '-9999px';
        document.body.appendChild(downloadContainer);
        const root = createRoot(downloadContainer);

        const downloadInvoice = async (order: Order) => {
            return new Promise<void>((resolve) => {
                root.render(<InvoicePreview order={order} settings={invoiceSettings} />);

                setTimeout(async () => {
                    try {
                        const invoiceElement = downloadContainer.querySelector('.invoice-sheet') as HTMLElement;
                        if (!invoiceElement) throw new Error("Invoice element not found for capturing.");

                        const canvas = await html2canvas(invoiceElement, {
                            scale: 2,
                            useCORS: true,
                            backgroundColor: '#ffffff',
                        });
                        const link = document.createElement('a');
                        link.download = `فاتورة-${order.orderNumber}.png`;
                        link.href = canvas.toDataURL('image/png');
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                    } catch (downloadError) {
                        console.error(`Error during auto-download for order ${order.orderNumber}:`, downloadError);
                    } finally {
                        resolve();
                    }
                }, 500);
            });
        };

        for (const order of newOrders) {
            await downloadInvoice(order);
            await new Promise(resolve => setTimeout(resolve, 200)); 
        }

        root.unmount();
        document.body.removeChild(downloadContainer);
    }

      resetTo('list');
  };

  const handleUpdateOrder = (updatedOrder: Order) => {
    setOrders(prevOrders => prevOrders.map(o => o.id === updatedOrder.id ? updatedOrder : o));
    setEditingOrder(null);
    goBack();
  };

  const handleEditOrder = (order: Order) => {
    setEditingOrder(order);
    navigate('form');
  };

  const handleDeleteOrder = (orderId: string) => {
    setOrderToDelete(orderId);
  };
  
  const handleConfirmDelete = () => {
      if (orderToDelete) {
          setOrders(prevOrders => prevOrders.filter(o => o.id !== orderToDelete));
          setOrderToDelete(null);
          if (currentView === 'form') {
              resetTo('list');
          }
      }
  };

  const handleCancelOrder = (orderId: string) => {
    setOrders(prevOrders => prevOrders.map(o => o.id === orderId ? { ...o, status: 'ملغى' } : o));
  };
  
  const handleSetProducts = (newProducts: Product[]) => {
    setProducts(newProducts);
  };

  const handleViewInvoice = (order: Order) => {
    setSelectedOrder(order);
    navigate('invoice');
  };
  
  const handleSaveSettings = (settings: InvoiceSettings) => {
      setInvoiceSettings(settings);
      goBack();
  };

  const renderContent = () => {
    switch (currentView) {
      case 'home':
        return <Home onNavigate={navigate} />;
      case 'dashboard':
        return <Dashboard orders={orders} onViewInvoice={handleViewInvoice} />;
      case 'form':
        return <OrderForm 
                    onAddOrder={handleAddOrder} 
                    onUpdateOrder={handleUpdateOrder}
                    onDeleteOrder={handleDeleteOrder}
                    editingOrder={editingOrder}
                    onBack={() => { setEditingOrder(null); goBack(); }} 
                    settings={invoiceSettings} 
                    productList={products} 
                />;
      case 'batch-form':
        return <BatchOrderForm 
                    onAddBatchOrders={handleAddBatchOrders}
                    productList={products}
                    onBack={goBack}
                />;
      case 'invoice':
        return selectedOrder ? <InvoiceView order={selectedOrder} onBack={goBack} settings={invoiceSettings} /> : <OrderList orders={orders} onViewInvoice={handleViewInvoice} onCreateOrder={() => navigate('form')} onBatchCreate={() => navigate('batch-form')} onEditOrder={handleEditOrder} onDeleteOrder={handleDeleteOrder} onCancelOrder={handleCancelOrder} />;
      case 'settings':
        return <InvoiceSettingsForm initialSettings={invoiceSettings} onSave={handleSaveSettings} onCancel={goBack} products={products} />;
      case 'products':
        return <ProductManagement products={products} setProducts={handleSetProducts} />;
      case 'post-creation':
        return lastCreatedOrder ? <PostCreationView order={lastCreatedOrder} settings={invoiceSettings} onDone={() => resetTo('list')} /> : <OrderList orders={orders} onViewInvoice={handleViewInvoice} onCreateOrder={() => navigate('form')} onBatchCreate={() => navigate('batch-form')} onEditOrder={handleEditOrder} onDeleteOrder={handleDeleteOrder} onCancelOrder={handleCancelOrder} />;
      case 'list':
      default:
        return <OrderList orders={orders} onViewInvoice={handleViewInvoice} onCreateOrder={() => navigate('form')} onBatchCreate={() => navigate('batch-form')} onEditOrder={handleEditOrder} onDeleteOrder={handleDeleteOrder} onCancelOrder={handleCancelOrder} />;
    }
  };

  return (
    <div className="relative min-h-screen md:flex text-gray-200">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        currentView={currentView}
        onNavigate={(view) => {
          resetTo(view);
          setSidebarOpen(false);
        }}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <Header onMenuClick={() => setSidebarOpen(true)} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="mb-6">
             <Breadcrumbs history={viewHistory} onNavigate={goBackTo} />
          </div>
          {renderContent()}
        </main>
      </div>

      <Modal
        isOpen={!!orderToDelete}
        onClose={() => setOrderToDelete(null)}
        title="تأكيد الحذف"
      >
        <div className="p-6 text-center">
          <div className="w-16 h-16 mx-auto flex items-center justify-center rounded-full bg-red-500/10 border border-red-500/30">
            <TrashIcon className="h-8 w-8 text-red-400" />
          </div>
          <h3 className="mt-5 text-lg font-semibold text-white">هل أنت متأكد؟</h3>
          <p className="mt-2 text-sm text-gray-400">
            سيتم حذف هذا الطلب بشكل نهائي. لا يمكن التراجع عن هذا الإجراء.
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <button
              onClick={() => setOrderToDelete(null)}
              className="hologram-btn px-6 py-2.5 text-sm font-semibold rounded-lg !bg-gray-500/10 !border-gray-500/30 !text-gray-300 hover:!bg-gray-500/20"
            >
              إلغاء
            </button>
            <button
              onClick={handleConfirmDelete}
              className="hologram-btn px-6 py-2.5 text-sm font-semibold rounded-lg !bg-red-500/10 !border-red-500/40 !text-red-400 hover:!bg-red-500/20"
            >
              نعم، قم بالحذف
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default App;