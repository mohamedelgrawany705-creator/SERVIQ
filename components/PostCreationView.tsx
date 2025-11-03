import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { Order, InvoiceSettings } from '../types';
import { InvoicePreview } from './InvoicePreview';
import { ArrowDownTrayIcon, ShareIcon, SpinnerIcon, WhatsAppIcon, FacebookIcon } from './icons';

interface PostCreationViewProps {
  order: Order;
  settings: InvoiceSettings;
  onDone: () => void;
}

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(amount);
};

export const PostCreationView: React.FC<PostCreationViewProps> = ({ order, settings, onDone }) => {
    const [isDownloading, setIsDownloading] = useState(false);
    const [isSharing, setIsSharing] = useState(false);
    const invoiceRef = useRef<HTMLDivElement>(null);

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
    
    const createShareMessage = () => {
        const total = order.items
            .filter(item => !item.isGift)
            .reduce((sum, item) => sum + item.price * item.quantity, 0);
        
        const discountAmount = (order.discount && settings.showDiscount) ? total * (order.discount / 100) : 0;
        const finalTotal = total - discountAmount;
        
        const message = `
ملخص الفاتورة:
رقم الفاتورة: ${order.orderNumber}
العميل: ${order.customerName}
الإجمالي: ${formatCurrency(finalTotal)}
شكراً لتعاملكم معنا!
        `;
        return encodeURIComponent(message.trim());
    };
    
    const handleShare = (platform: 'whatsapp' | 'facebook') => {
        const message = createShareMessage();
        let url = '';
        if (platform === 'whatsapp') {
            url = `https://wa.me/?text=${message}`;
        } else {
            const appUrl = "https://serviq.app"; // Placeholder URL
            url = `https://www.facebook.com/sharer/sharer.php?u=${appUrl}&quote=${message}`;
        }
        window.open(url, '_blank', 'noopener,noreferrer');
        setIsSharing(false);
    };

    return (
        <div className="max-w-4xl mx-auto flex flex-col items-center">
            <div className="hologram-panel rounded-2xl p-6 sm:p-8 text-center w-full">
                <h1 className="text-3xl font-bold text-white mb-2 text-3d hologram-title">تم إنشاء الفاتورة بنجاح!</h1>
                <p className="text-gray-400 mb-6">يمكنك الآن تنزيل الفاتورة أو مشاركتها مع العميل.</p>
                
                <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mb-8">
                    <button
                        onClick={handleDownload}
                        disabled={isDownloading}
                        className="hologram-btn inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg !bg-cyan-500/10 !border-cyan-500/30 !text-cyan-300 hover:!bg-cyan-500/20 disabled:opacity-50 disabled:cursor-wait w-full sm:w-auto"
                    >
                        {isDownloading ? <SpinnerIcon className="h-5 w-5"/> : <ArrowDownTrayIcon className="h-5 w-5" />}
                        {isDownloading ? 'جاري التحميل...' : 'تنزيل PNG'}
                    </button>
                    <div className="relative w-full sm:w-auto">
                        <button
                            onClick={() => setIsSharing(prev => !prev)}
                            className="hologram-btn inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg w-full sm:w-auto"
                        >
                            <ShareIcon className="h-5 w-5" />
                            مشاركة
                        </button>
                        {isSharing && (
                            <div className="absolute bottom-full mb-2 w-full sm:w-40 bg-slate-900/80 backdrop-blur-sm border border-cyan-500/20 rounded-lg shadow-lg z-10 p-2 space-y-2">
                                <button onClick={() => handleShare('whatsapp')} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-200 hover:bg-cyan-500/10 rounded-md">
                                    <WhatsAppIcon className="text-green-400 h-5 w-5"/>
                                    واتساب
                                </button>
                                <button onClick={() => handleShare('facebook')} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-200 hover:bg-cyan-500/10 rounded-md">
                                    <FacebookIcon className="text-blue-400 h-5 w-5"/>
                                    فيسبوك
                                </button>
                            </div>
                        )}
                    </div>
                     <button
                        onClick={onDone}
                        className="hologram-btn inline-flex items-center justify-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg !bg-gray-500/10 !border-gray-500/30 !text-gray-300 hover:!bg-gray-500/20 w-full sm:w-auto"
                    >
                        تم
                    </button>
                </div>
            </div>

            <div className="mt-8 w-full print-area">
                <div ref={invoiceRef}>
                    <InvoicePreview settings={settings} order={order} />
                </div>
            </div>
        </div>
    );
};