import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { Order, InvoiceSettings, ThemeColor, InvoiceFontFamily } from '../types';
import { ArrowLeftIcon, PrintIcon, ArrowDownTrayIcon, SpinnerIcon } from './icons';

interface InvoiceViewProps {
  order: Order;
  onBack: () => void;
  settings: InvoiceSettings;
}

const getThemeStyles = (theme: ThemeColor) => {
    switch (theme) {
        case 'blue':
            return {
                primaryBg: 'bg-blue-600',
                primaryText: 'text-blue-600',
                lightBg: 'bg-blue-50',
                tableHeaderBg: 'bg-blue-500',
                borderColor: 'border-blue-500',
            };
        case 'green':
            return {
                primaryBg: 'bg-green-600',
                primaryText: 'text-green-600',
                lightBg: 'bg-green-50',
                tableHeaderBg: 'bg-green-500',
                 borderColor: 'border-green-500',
            };
        case 'classic':
             return {
                primaryBg: 'bg-gray-800',
                primaryText: 'text-gray-800',
                lightBg: 'bg-gray-100',
                tableHeaderBg: 'bg-gray-700',
                 borderColor: 'border-gray-700',
            };
        case 'purple':
        default:
            return {
                primaryBg: 'bg-purple-600',
                primaryText: 'text-purple-600',
                lightBg: 'bg-purple-50',
                tableHeaderBg: 'bg-purple-500',
                borderColor: 'border-purple-500',
            };
    }
}

const getFontClass = (font: InvoiceFontFamily) => {
    switch (font) {
        case 'serif': return 'font-serif';
        case 'mono': return 'font-mono';
        case 'sans':
        default: return 'font-sans';
    }
}

const formatDate = (dateString: string) => {
    try {
        return new Date(dateString).toLocaleDateString('ar-EG', { year: 'numeric', month: 'long', day: 'numeric' });
    } catch (e) {
        return dateString; // fallback to original string if parsing fails
    }
};

export const InvoiceView: React.FC<InvoiceViewProps> = ({ order, onBack, settings }) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const invoiceRef = useRef<HTMLDivElement>(null);

  const subtotal = order.items
    .filter(item => !item.isGift)
    .reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discountAmount = (order.discount && settings.showDiscount) ? subtotal * (order.discount / 100) : 0;
  const subtotalAfterDiscount = subtotal - discountAmount;
  const taxRate = 0.10; // 10% tax
  const tax = settings.showTax ? subtotalAfterDiscount * taxRate : 0;
  const total = subtotalAfterDiscount + tax;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(amount);
  };
  
  const themeStyles = getThemeStyles(settings.theme);

  // QR Code for customer phone
  const encodedPhoneQrData = encodeURIComponent(order.customerPhone1);
  const phoneQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodedPhoneQrData}&qzone=1`;
  
  // QR Code for full invoice data
  const fullInvoiceData = {
    invoiceNumber: order.orderNumber,
    customer: order.customerName,
    date: order.orderDate,
    totalAmount: total,
    items: order.items.map(({ name, quantity, price, isGift }) => ({ name, quantity, price: isGift ? 0 : price })),
  };
  const encodedFullData = encodeURIComponent(JSON.stringify(fullInvoiceData));
  const fullDataQrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodedFullData}&qzone=1`;

  const handleDownload = async () => {
    if (!invoiceRef.current) return;
    setIsDownloading(true);
    try {
      const canvas = await html2canvas(invoiceRef.current, {
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
    } catch (error) {
      console.error('Failed to download invoice as PNG', error);
      alert('حدث خطأ أثناء محاولة تنزيل الفاتورة.');
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="no-print flex justify-between items-center mb-6">
        <button
          onClick={onBack}
          className="hologram-btn inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg !bg-gray-500/10 !border-gray-500/30 !text-gray-300 hover:!bg-gray-500/20"
        >
          <ArrowLeftIcon className="h-5 w-5" />
          رجوع
        </button>
        <div className="flex items-center gap-4">
             <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="hologram-btn inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg !bg-cyan-500/10 !border-cyan-500/30 !text-cyan-300 hover:!bg-cyan-500/20 disabled:opacity-50 disabled:cursor-wait"
            >
              {isDownloading ? <SpinnerIcon className="h-5 w-5"/> : <ArrowDownTrayIcon className="h-5 w-5" />}
              {isDownloading ? 'جاري التحميل...' : 'تنزيل PNG'}
            </button>
            <button
              onClick={() => window.print()}
              className="hologram-btn inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg"
            >
              <PrintIcon className="h-5 w-5" />
              طباعة الفاتورة
            </button>
        </div>
      </div>
      
      <div className="hologram-panel rounded-2xl p-2 sm:p-4 print-area">
        <div ref={invoiceRef} className="invoice-sheet w-full max-w-[21cm] mx-auto my-8 shadow-2xl bg-white text-gray-900">
            <div className={`flex flex-col ${getFontClass(settings.fontFamily)}`}>
                {/* Decorative Header */}
                <div className={`h-2.5 ${themeStyles.primaryBg} flex-shrink-0`}></div>

                {/* Main Content */}
                <main className="flex-grow p-8 sm:p-12">
                    {/* Header: Company Info and Invoice Details */}
                    <header className="flex justify-between items-start mb-12">
                        <div className="text-right">
                             {settings.logo ? (
                                <img src={settings.logo} alt="شعار الشركة" className="h-16 max-w-[150px] object-contain mb-2"/>
                            ) : (
                                <h1 className={`text-2xl font-bold mb-1 ${themeStyles.primaryText}`}>
                                    {settings.companyName || 'serviq'}
                                </h1>
                            )}
                            <p className="text-gray-500 text-sm whitespace-pre-line">{settings.companyAddress}</p>
                            <p className="text-gray-500 text-sm">{settings.companyContact}</p>
                        </div>

                        <div className="text-left">
                            <h2 className="text-3xl font-bold uppercase text-gray-800">{settings.invoiceTitle || 'فاتورة'}</h2>
                            <p className="text-gray-500 mt-2">رقم: {order.orderNumber}</p>
                            <p className="text-gray-500">التاريخ: {formatDate(order.orderDate)}</p>
                        </div>
                    </header>
                    
                    {/* Customer Info & QR Codes */}
                    <section className={`flex justify-between items-start mb-12 border-t-2 pt-6 ${themeStyles.borderColor}`}>
                        <div>
                             <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">الفاتورة إلى</h3>
                             <p className="font-bold text-lg text-gray-800 mt-1">{order.customerName}</p>
                             <p className="text-gray-600 text-sm">{order.customerAddress}, {order.customerGovernorate}</p>
                             <p className="text-gray-600 text-sm">{order.customerPhone1}</p>
                        </div>
                         <div className="flex items-start justify-end gap-2 text-center">
                            <div>
                                <img src={fullDataQrCodeUrl} alt="باركود تفاصيل الفاتورة" className="w-20 h-20" />
                                <p className="text-[9px] text-gray-400 mt-1">امسح للتفاصيل</p>
                            </div>
                            <div>
                                <img src={phoneQrCodeUrl} alt="باركود رقم العميل" className="w-20 h-20" />
                                <p className="text-[9px] text-gray-400 mt-1">امسح لرقم العميل</p>
                            </div>
                        </div>
                    </section>

                    {/* Items Table */}
                    <section>
                        <table className="min-w-full">
                            <thead className="border-b-2 border-gray-300">
                                <tr>
                                    <th className="py-3 pr-4 text-right text-sm font-semibold uppercase text-gray-500">العنصر</th>
                                    <th className="py-3 px-2 text-center text-sm font-semibold uppercase text-gray-500">السعر</th>
                                    <th className="py-3 px-2 text-center text-sm font-semibold uppercase text-gray-500">الكمية</th>
                                    <th className="py-3 pl-4 text-left text-sm font-semibold uppercase text-gray-500">الإجمالي</th>
                                </tr>
                            </thead>
                            <tbody>
                                {order.items.map((item) => (
                                    <tr key={item.id} className="border-b border-gray-200">
                                        <td className="py-4 pr-4 text-right font-medium text-gray-800">
                                            {item.name}
                                            {item.isGift && <span className="text-xs font-bold text-green-600 bg-green-100 py-0.5 px-2 rounded-full mr-2">هدية</span>}
                                        </td>
                                        <td className="py-4 px-2 text-center text-gray-600">{item.isGift ? 'مجاني' : formatCurrency(item.price)}</td>
                                        <td className="py-4 px-2 text-center text-gray-600">{item.quantity}</td>
                                        <td className="py-4 pl-4 text-left font-medium text-gray-800">{item.isGift ? 'مجاني' : formatCurrency(item.price * item.quantity)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </section>

                    {/* Totals & Notes */}
                    <section className="mt-12 flex justify-between">
                        <div>
                             <h4 className="font-semibold text-gray-500 uppercase">ملاحظات</h4>
                             <p className="text-gray-600 text-sm mt-2 whitespace-pre-line max-w-xs">{settings.footerNotes}</p>
                        </div>
                        <div className="w-full max-w-xs space-y-2 text-left">
                            <div className="flex justify-between text-gray-600">
                                <span>المجموع الفرعي:</span>
                                <span>{formatCurrency(subtotal)}</span>
                            </div>
                            {settings.showDiscount && order.discount && order.discount > 0 && (
                                 <div className="flex justify-between text-gray-600">
                                    <span>الخصم ({order.discount}%):</span>
                                    <span className="text-red-500">-{formatCurrency(discountAmount)}</span>
                                </div>
                            )}
                            {settings.showTax && (
                                 <div className="flex justify-between text-gray-600">
                                    <span>الضريبة ({(taxRate * 100).toFixed(0)}%):</span>
                                    <span>{formatCurrency(tax)}</span>
                                </div>
                            )}
                            <div className={`flex justify-between text-xl font-bold text-white p-3 rounded-md ${themeStyles.primaryBg} mt-2`}>
                                <span>الإجمالي المستحق:</span>
                                <span>{formatCurrency(total)}</span>
                            </div>
                        </div>
                    </section>
                </main>
                
                {/* Footer */}
                <footer className="p-6 border-t border-gray-200 text-center text-gray-500 text-sm flex-shrink-0">
                    <p>شكراً لتعاملكم معنا!</p>
                </footer>
            </div>
        </div>
      </div>
    </div>
  );
};