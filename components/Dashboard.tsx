import React, { useMemo } from 'react';
import { Order } from '../types';
import { CurrencyDollarIcon, ShoppingCartIcon, UserGroupIcon, DocumentTextIcon } from './icons';

interface DashboardProps {
  orders: Order[];
  onViewInvoice: (order: Order) => void;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(amount);
};

const StatCard: React.FC<{ icon: React.ReactNode; title: string; value: string; description: string }> = ({ icon, title, value, description }) => (
    <div className="hologram-panel hologram-panel-interactive rounded-2xl p-6 flex items-start transform transition-transform duration-300 hover:-translate-y-1">
        <div className="bg-purple-600/10 text-purple-400 p-3.5 rounded-full mr-4 border border-purple-500/20 icon-glow">
            {icon}
        </div>
        <div>
            <p className="text-sm text-gray-400">{title}</p>
            <p className="text-3xl font-bold text-white mt-1 text-3d">{value}</p>
            <p className="text-xs text-gray-500 mt-1">{description}</p>
        </div>
    </div>
);


export const Dashboard: React.FC<DashboardProps> = ({ orders, onViewInvoice }) => {

    const dashboardData = useMemo(() => {
        const completedOrders = orders.filter(o => o.status === 'مكتمل');
        
        const calculateTotal = (order: Order) => order.items
            .filter(item => !item.isGift)
            .reduce((sum, item) => sum + item.price * item.quantity, 0);

        const totalRevenue = completedOrders.reduce((sum, order) => {
            const subtotal = calculateTotal(order);
            const discountAmount = order.discount ? subtotal * (order.discount / 100) : 0;
            return sum + (subtotal - discountAmount);
        }, 0);

        const totalOrders = orders.length;
        const averageOrderValue = completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0;
        
        const statusCounts = orders.reduce((acc, order) => {
            acc[order.status] = (acc[order.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const revenueByMonth = completedOrders.reduce((acc, order) => {
            try {
                const date = new Date(order.orderDate);
                const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
                const subtotal = calculateTotal(order);
                const discountAmount = order.discount ? subtotal * (order.discount / 100) : 0;
                const finalTotal = subtotal - discountAmount;
                acc[monthKey] = (acc[monthKey] || 0) + finalTotal;
            } catch(e) {
                // Ignore orders with invalid date format
            }
            return acc;
        }, {} as Record<string, number>);
        
        const sortedMonths = Object.keys(revenueByMonth).sort();
        const last6Months = sortedMonths.slice(-6);
        const revenueChartData = last6Months.map(monthKey => ({
            name: new Date(monthKey + '-01').toLocaleDateString('ar-EG', { month: 'short', year: 'numeric' }),
            value: revenueByMonth[monthKey]
        }));


        return {
            totalRevenue,
            totalOrders,
            averageOrderValue,
            statusCounts,
            revenueChartData,
        };
    }, [orders]);

    const statusColors = { 'مكتمل': '#10B981', 'قيد التنفيذ': '#F59E0B', 'ملغى': '#EF4444' };
    const statusPieData = Object.entries(dashboardData.statusCounts);
    let cumulativePercent = 0;
    const gradientStops = statusPieData.map(([status, count]) => {
        const percent = dashboardData.totalOrders > 0 ? (Number(count) / dashboardData.totalOrders) * 100 : 0;
        const stop = `${statusColors[status as keyof typeof statusColors]} ${cumulativePercent}% ${cumulativePercent + percent}%`;
        cumulativePercent += percent;
        return stop;
    }).join(', ');

    const maxRevenue = Math.max(...dashboardData.revenueChartData.map(d => d.value), 0);
    
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
    
    const formatDate = (dateString: string) => {
      try {
        return new Date(dateString).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
      } catch (e) {
        return dateString;
      }
    };


    return (
        <div className="space-y-8">
            <h1 className="text-3xl font-bold text-white text-3d hologram-title">احصائيات المبيعات</h1>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard icon={<CurrencyDollarIcon />} title="إجمالي الإيرادات" value={formatCurrency(dashboardData.totalRevenue)} description="من الطلبات المكتملة" />
                <StatCard icon={<ShoppingCartIcon />} title="إجمالي الطلبات" value={String(dashboardData.totalOrders)} description="كل الطلبات المسجلة" />
                <StatCard icon={<UserGroupIcon />} title="متوسط قيمة الطلب" value={formatCurrency(dashboardData.averageOrderValue)} description="للطلبات المكتملة فقط" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                <div className="lg:col-span-3 hologram-panel rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4 text-3d">الإيرادات الشهرية</h3>
                    <div className="h-64 flex items-end justify-around gap-2 pt-4 border-t border-cyan-500/10">
                      {dashboardData.revenueChartData.length > 0 ? dashboardData.revenueChartData.map(data => (
                          <div key={data.name} className="flex-1 flex flex-col items-center text-center group">
                              <div 
                                className="w-full bg-gradient-to-t from-purple-700 to-transparent rounded-t-md transition-all duration-300 group-hover:from-purple-600 group-hover:shadow-[0_0_15px_rgba(168,85,247,0.5)]"
                                style={{ height: `${maxRevenue > 0 ? (data.value / maxRevenue) * 100 : 0}%` }}
                              ></div>
                              <p className="text-xs text-gray-400 mt-2">{data.name}</p>
                          </div>
                      )) : <p className="text-gray-500 self-center w-full text-center">لا توجد بيانات كافية لعرض الرسم البياني.</p>}
                    </div>
                </div>
                <div className="lg:col-span-2 hologram-panel rounded-2xl p-6">
                    <h3 className="text-lg font-bold text-white mb-4 text-3d">حالات الطلبات</h3>
                     <div className="flex items-center justify-center gap-6 pt-4 border-t border-cyan-500/10">
                        <div className="relative w-32 h-32">
                          <div className="absolute inset-0 rounded-full" style={{ background: `conic-gradient(${gradientStops})`, filter: 'drop-shadow(0 0 10px rgba(139, 92, 246, 0.3))' }}></div>
                          <div className="absolute inset-2 bg-slate-900 rounded-full"></div>
                        </div>
                        <div className="space-y-2">
                           {statusPieData.map(([status, count]) => (
                               <div key={status} className="flex items-center">
                                   <span className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: statusColors[status as keyof typeof statusColors], boxShadow: `0 0 8px ${statusColors[status as keyof typeof statusColors]}` }}></span>
                                   <span className="text-sm text-gray-300">{status}: {count}</span>
                               </div>
                           ))}
                        </div>
                    </div>
                </div>
            </div>
            
            <div className="hologram-panel rounded-xl">
                 <h3 className="text-lg font-bold text-white p-4 border-b border-cyan-500/10 text-3d">أحدث الطلبات</h3>
                 <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <tbody className="divide-y divide-cyan-500/10">
                           {orders.slice(0, 5).map(order => (
                               <tr key={order.id} className="hover:bg-purple-900/20 transition-colors">
                                   <td className="p-4 whitespace-nowrap text-sm font-mono text-purple-400">{order.orderNumber}</td>
                                   <td className="p-4 whitespace-nowrap text-sm text-gray-200">{order.customerName}</td>
                                   <td className="p-4 whitespace-nowrap text-sm text-gray-400">{formatDate(order.orderDate)}</td>
                                   <td className="p-4 whitespace-nowrap text-sm">
                                      <span className={`px-2.5 py-0.5 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusBadge(order.status)}`}>
                                        {order.status}
                                      </span>
                                   </td>
                                   <td className="p-4 whitespace-nowrap text-left text-sm">
                                     <button onClick={() => onViewInvoice(order)} className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold icon-glow">
                                         <DocumentTextIcon className="w-4 h-4" /> عرض
                                     </button>
                                   </td>
                               </tr>
                           ))}
                        </tbody>
                    </table>
                 </div>
            </div>
        </div>
    );
};