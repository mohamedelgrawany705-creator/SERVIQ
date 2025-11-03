import React, { useState, useRef, useEffect } from 'react';
import { Order } from '../types';
import { DocumentTextIcon, PlusIcon, EllipsisVerticalIcon, PencilIcon, TrashIcon, XCircleIcon, QueueListIcon } from './icons';

interface OrderListProps {
  orders: Order[];
  onViewInvoice: (order: Order) => void;
  onCreateOrder: () => void;
  onBatchCreate: () => void;
  onEditOrder: (order: Order) => void;
  onDeleteOrder: (orderId: string) => void;
  onCancelOrder: (orderId: string) => void;
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case 'مكتمل':
      return 'text-green-400 border border-green-500/30 bg-green-900/20 shadow-[0_0_8px_rgba(34,197,94,0.3)]';
    case 'قيد التنفيذ':
      return 'text-yellow-400 border border-yellow-500/30 bg-yellow-900/20 shadow-[0_0_8px_rgba(234,179,8,0.3)]';
    case 'ملغى':
      return 'text-red-400 border border-red-500/30 bg-red-900/20 shadow-[0_0_8px_rgba(248,113,113,0.3)]';
    default:
      return 'text-gray-400 border border-gray-500/30 bg-gray-900/20 shadow-[0_0_8px_rgba(156,163,175,0.3)]';
  }
};

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(amount);
};

const ActionButton: React.FC<{onClick: () => void, children: React.ReactNode, secondary?: boolean}> = ({ onClick, children, secondary = false }) => (
    <button
        onClick={onClick}
        className={`hologram-btn inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg icon-glow ${secondary ? '!bg-cyan-500/10 !border-cyan-500/30 !text-cyan-300 hover:!bg-cyan-500/20' : ''}`}
    >
        {children}
    </button>
);

const ActionsMenu: React.FC<{ order: Order; onView: () => void; onEdit: () => void; onCancel: () => void; onDelete: () => void; }> = ({ order, onView, onEdit, onCancel, onDelete }) => {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const canCancel = order.status === 'قيد التنفيذ';

    return (
        <div className="relative" ref={menuRef}>
            <button onClick={() => setIsOpen(!isOpen)} className="p-2 rounded-full text-gray-400 hover:bg-cyan-500/10 hover:text-white icon-glow">
                <EllipsisVerticalIcon className="h-5 w-5" />
            </button>
            {isOpen && (
                <div className="absolute left-0 mt-2 w-48 hologram-panel rounded-lg shadow-lg z-10 p-2">
                    <button onClick={() => { onView(); setIsOpen(false); }} className="w-full text-right flex items-center gap-3 px-3 py-2 text-sm text-gray-200 hover:bg-cyan-500/10 rounded-md">
                        <DocumentTextIcon /> عرض
                    </button>
                    <button onClick={() => { onEdit(); setIsOpen(false); }} className="w-full text-right flex items-center gap-3 px-3 py-2 text-sm text-gray-200 hover:bg-cyan-500/10 rounded-md">
                        <PencilIcon /> تعديل
                    </button>
                    <button onClick={() => { onCancel(); setIsOpen(false); }} disabled={!canCancel} className="w-full text-right flex items-center gap-3 px-3 py-2 text-sm text-gray-200 hover:bg-cyan-500/10 rounded-md disabled:opacity-50 disabled:cursor-not-allowed">
                        <XCircleIcon /> إلغاء
                    </button>
                    <div className="my-1 h-px bg-cyan-500/10"></div>
                    <button onClick={() => { onDelete(); setIsOpen(false); }} className="w-full text-right flex items-center gap-3 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10 rounded-md">
                        <TrashIcon /> حذف
                    </button>
                </div>
            )}
        </div>
    );
};


export const OrderList: React.FC<OrderListProps> = ({ orders, onViewInvoice, onCreateOrder, onBatchCreate, onEditOrder, onDeleteOrder, onCancelOrder }) => {
    const calculateTotal = (order: Order) => order.items
      .filter(item => !item.isGift)
      .reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (orders.length === 0) {
    return (
      <div className="text-center py-16 hologram-panel rounded-xl p-8">
        <h3 className="text-2xl font-bold text-white text-3d">لم يتم العثور على طلبات</h3>
        <p className="mt-2 text-gray-400">ابدأ بإنشاء طلب جديد لإدارة أعمالك.</p>
        <div className="mt-8">
            <ActionButton onClick={onCreateOrder}>
                <PlusIcon className="h-5 w-5" />
                إنشاء طلب جديد
            </ActionButton>
        </div>
      </div>
    );
  }

  return (
    <div>
        <div className="flex justify-start gap-4 mb-6">
            <ActionButton onClick={onCreateOrder}>
                <PlusIcon className="h-5 w-5" />
                إنشاء طلب جديد
            </ActionButton>
             <ActionButton onClick={onBatchCreate} secondary>
                <QueueListIcon className="h-5 w-5" />
                إنشاء دفعة
            </ActionButton>
        </div>
      <div className="hologram-panel rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-cyan-500/10 hidden md:table">
                <thead className="bg-black/20">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-cyan-400 uppercase tracking-wider text-3d">رقم الطلب</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-cyan-400 uppercase tracking-wider text-3d">العميل</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-cyan-400 uppercase tracking-wider text-3d">التاريخ</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-cyan-400 uppercase tracking-wider text-3d">الإجمالي</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-cyan-400 uppercase tracking-wider text-3d">الحالة</th>
                    <th scope="col" className="relative px-6 py-3"><span className="sr-only">إجراءات</span></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyan-500/10">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-purple-900/20 transition-all duration-200">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-purple-400">{order.orderNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200">{order.customerName}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{new Date(order.orderDate).toLocaleDateString('ar-EG')}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-200 font-semibold">{formatCurrency(calculateTotal(order))}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(order.status)}`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-left text-sm font-medium">
                         <ActionsMenu 
                            order={order}
                            onView={() => onViewInvoice(order)} 
                            onEdit={() => onEditOrder(order)}
                            onCancel={() => onCancelOrder(order.id)}
                            onDelete={() => onDeleteOrder(order.id)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 md:hidden">
            {orders.map(order => (
                <div key={order.id} className="hologram-panel hologram-panel-interactive rounded-xl p-4 flex flex-col justify-between transform transition-transform duration-300 hover:-translate-y-1">
                    <div>
                        <div className="flex justify-between items-start">
                            <p className="text-sm font-mono text-purple-400">{order.orderNumber}</p>
                             <span className={`px-2 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(order.status)}`}>
                                {order.status}
                            </span>
                        </div>
                        <p className="font-semibold text-lg text-white mt-2 text-3d">{order.customerName}</p>
                        <p className="text-sm text-gray-400">{order.customerPhone1}</p>
                        <p className="text-sm text-gray-400">{new Date(order.orderDate).toLocaleDateString('ar-EG')}</p>
                        <p className="text-lg font-bold text-white mt-2">{formatCurrency(calculateTotal(order))}</p>
                    </div>
                    <div className="mt-4 w-full">
                        <ActionsMenu 
                            order={order}
                            onView={() => onViewInvoice(order)} 
                            onEdit={() => onEditOrder(order)}
                            onCancel={() => onCancelOrder(order.id)}
                            onDelete={() => onDeleteOrder(order.id)}
                        />
                    </div>
                </div>
            ))}
          </div>
      </div>
    </div>
  );
};