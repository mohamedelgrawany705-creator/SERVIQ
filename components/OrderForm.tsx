import React, { useState, useEffect } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { Order, OrderItem, OrderStatus, InvoiceSettings, Product } from '../types';
import { PlusIcon, TrashIcon, SparklesIcon, SpinnerIcon } from './icons';
import { Modal } from './Modal';
import { InvoicePreview } from './InvoicePreview';


interface OrderFormProps {
  onAddOrder: (order: Order) => void;
  onUpdateOrder: (order: Order) => void;
  onDeleteOrder: (orderId: string) => void;
  editingOrder: Order | null;
  onBack: () => void;
  settings: InvoiceSettings;
  productList: Product[];
}

const governorates = [
    "القاهرة", "الجيزة", "الأسكندرية", "الدقهلية", "الشرقية", "المنوفية", "القليوبية", "البحيرة", "الغربية", "بور سعيد", "دمياط", "الإسماع минимализм", "السويس", "كفر الشيخ", "الفيوم", "بني سويف", "المنيا", "أسيوط", "سوهاج", "قنا", "الأقصر", "أسوان", "البحر الأحمر", "الوادي الجديد", "مطروح", "شمال سيناء", "جنوب سيناء"
];

const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ar-EG', { style: 'currency', currency: 'EGP' }).format(amount);
};

const inputBaseClasses = "hologram-input mt-1 block w-full sm:text-sm text-white transition-colors duration-200 p-2";

export const OrderForm: React.FC<OrderFormProps> = ({ onAddOrder, onUpdateOrder, onDeleteOrder, editingOrder, onBack, settings, productList }) => {
  const [customerName, setCustomerName] = useState('');
  const [customerPhone1, setCustomerPhone1] = useState('');
  const [customerPhone2, setCustomerPhone2] = useState('');
  const [customerGovernorate, setCustomerGovernorate] = useState(governorates[0]);
  const [customerAddress, setCustomerAddress] = useState('');
  const [status, setStatus] = useState<OrderStatus>('قيد التنفيذ');
  const [discount, setDiscount] = useState(0);
  const [items, setItems] = useState<Partial<OrderItem>[]>([
    { id: crypto.randomUUID(), productId: '', name: '', quantity: 1, price: 0, isGift: false },
  ]);
  
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  
  const isEditing = !!editingOrder;

  useEffect(() => {
    if (editingOrder) {
      setCustomerName(editingOrder.customerName);
      setCustomerPhone1(editingOrder.customerPhone1);
      setCustomerPhone2(editingOrder.customerPhone2 || '');
      setCustomerGovernorate(editingOrder.customerGovernorate);
      setCustomerAddress(editingOrder.customerAddress);
      setStatus(editingOrder.status);
      setDiscount(editingOrder.discount || 0);

      // Backwards compatibility for old orders without productId
      const sanitizedItems = editingOrder.items.map(item => {
        if (!item.productId) {
            const product = productList.find(p => p.name === item.name);
            return { ...item, productId: product?.id || '' };
        }
        return item;
      });
      setItems(sanitizedItems.length > 0 ? sanitizedItems : [{ id: crypto.randomUUID(), productId: '', name: '', quantity: 1, price: 0, isGift: false }]);
    }
  }, [editingOrder, productList]);

  useEffect(() => {
    const promotion = settings.promotion;
    if (!promotion || !promotion.enabled || !promotion.triggerProductId || !promotion.giftProductId || isEditing) {
      return;
    }

    const giftProduct = productList.find(p => p.id === promotion.giftProductId);
    if (!giftProduct || promotion.triggerProductId === promotion.giftProductId) return;

    const hasTriggerItem = items.some(item => item.productId === promotion.triggerProductId && !item.isGift);
    const promoGiftId = `promo-${giftProduct.id}`;
    const hasPromoGiftItem = items.some(item => item.id === promoGiftId);

    if (hasTriggerItem && !hasPromoGiftItem) {
      setItems(currentItems => [
        ...currentItems,
        {
          id: promoGiftId,
          productId: giftProduct.id,
          name: giftProduct.name,
          quantity: 1,
          price: giftProduct.price,
          isGift: true
        }
      ]);
    } else if (!hasTriggerItem && hasPromoGiftItem) {
      setItems(currentItems => currentItems.filter(item => item.id !== promoGiftId));
    }
  }, [items, settings.promotion, productList, isEditing]);


  const handleGenerateWithAI = async () => {
    if (!aiPrompt.trim()) return;

    setIsGenerating(true);
    setAiError(null);

    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

        const availableProductsString = productList.map(p => `(ID: "${p.id}", Name: "${p.name}")`).join(', ');

        const schema = {
          type: Type.OBJECT,
          properties: {
            customerName: { type: Type.STRING, description: 'اسم العميل الكامل' },
            customerPhone1: { type: Type.STRING, description: 'رقم الهاتف الأساسي للعميل' },
            customerPhone2: { type: Type.STRING, description: 'رقم الهاتف الإضافي للعميل إن وجد' },
            customerGovernorate: { type: Type.STRING, description: 'محافظة العميل' },
            customerAddress: { type: Type.STRING, description: 'عنوان العميل التفصيلي' },
            items: {
              type: Type.ARRAY,
              description: 'قائمة العناصر في الطلب. طابق كل عنصر مذكور في النص مع المنتج الأنسب من قائمة المنتجات المتاحة وأرجع الـ ID الخاص به.',
              items: {
                type: Type.OBJECT,
                properties: {
                  productId: { type: Type.STRING, description: 'معرف المنتج (ID) المطابق من القائمة المتاحة.' },
                  quantity: { type: Type.NUMBER, description: 'كمية العنصر، الافتراضي هو 1' },
                  isGift: { type: Type.BOOLEAN, description: 'هل هذا العنصر هدية مجانية؟ الافتراضي هو false' },
                },
                required: ['productId'],
              },
            },
          },
          required: ['customerName', 'customerPhone1', 'customerGovernorate', 'customerAddress', 'items'],
        };
        
        const prompt = `
        حلل النص التالي لاستخراج تفاصيل الطلب.
        النص: "${aiPrompt}"

        المنتجات المتاحة هي: [${availableProductsString}].

        المهمة:
        1. استخرج معلومات العميل (الاسم، الهاتف، المحافظة، العنوان).
        2. بالنسبة لكل عنصر في الطلب، ابحث عن المنتج الأكثر تطابقًا من قائمة "المنتجات المتاحة". استخدم المعنى وليس فقط الكلمات الدقيقة (مثلاً، "لوجو" يجب أن يطابق المنتج الذي اسمه "تصميم شعار").
        3. قم بإرجاع معرف المنتج (ID) وليس اسمه.
        4. إذا ذكر أن شيئًا ما "هدية" أو "مجاني"، فاجعل isGift true.
        5. قم بتنسيق الإخراج كملف JSON يتبع المخطط المحدد.
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            }
        });

        const jsonString = response.text.trim();
        const parsedData = JSON.parse(jsonString);

        if (parsedData.customerName) setCustomerName(parsedData.customerName);
        if (parsedData.customerPhone1) setCustomerPhone1(parsedData.customerPhone1);
        if (parsedData.customerPhone2) setCustomerPhone2(parsedData.customerPhone2);
        if (parsedData.customerGovernorate && governorates.includes(parsedData.customerGovernorate)) setCustomerGovernorate(parsedData.customerGovernorate);
        if (parsedData.customerAddress) setCustomerAddress(parsedData.customerAddress);

        if (parsedData.items && Array.isArray(parsedData.items)) {
            const newItems = parsedData.items
              .map((item: any) => {
                  if (!item.productId) return null;
                  const product = productList.find(p => p.id === item.productId);
                  if (!product) return null; // Ignore items with invalid IDs
                  return {
                      id: crypto.randomUUID(),
                      productId: product.id,
                      name: product.name,
                      quantity: item.quantity || 1,
                      price: product.price,
                      isGift: item.isGift || false,
                  };
              })
              .filter(Boolean); // Remove nulls
              
            if (newItems.length > 0) {
                setItems(newItems as OrderItem[]);
            } else if (parsedData.items.length > 0) {
                setAiError("لم يتم العثور على منتجات مطابقة في قائمتك. يرجى التأكد من أن المنتجات المذكورة موجودة.");
            }
        }
        setAiPrompt('');

    } catch (error) {
        console.error("Error generating with AI:", error);
        setAiError("فشل في إنشاء البيانات. يرجى المحاولة مرة أخرى أو التحقق من النص.");
    } finally {
        setIsGenerating(false);
    }
  };

  const handleItemChange = (id: string, field: keyof OrderItem, value: string | number | boolean) => {
    setItems(items.map(item => {
      if (item.id === id) {
        const updatedItem = { ...item, [field]: value };
        
        if (field === 'productId') {
          const product = productList.find(p => p.id === value);
          updatedItem.name = product ? product.name : '';
          updatedItem.price = product ? product.price : 0;
        } else if (field === 'price') {
            const newPrice = typeof value === 'string' ? parseFloat(value) : Number(value);
            if (!isNaN(newPrice)) {
                updatedItem.price = newPrice;
                const matchingProducts = productList.filter(p => p.price === newPrice);
                if (matchingProducts.length === 1) {
                    updatedItem.productId = matchingProducts[0].id;
                    updatedItem.name = matchingProducts[0].name;
                }
            }
        }
        return updatedItem;
      }
      return item;
    }));
  };

  const addItem = () => {
    setItems([...items, { id: crypto.randomUUID(), productId: '', name: '', quantity: 1, price: 0, isGift: false }]);
  };

  const removeItem = (id: string) => {
    if (items.length > 1) {
      setItems(items.filter(item => item.id !== id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validItems = items.filter(item => item.productId && item.quantity && item.quantity > 0);

    if (!customerPhone1.trim() || !customerAddress.trim() || validItems.length === 0) {
      alert('الرجاء ملء الحقول الإجبارية: رقم الهاتف الأساسي، العنوان بالتفصيل، ومنتج واحد على الأقل.');
      return;
    }

    const orderData = {
      customerName,
      customerPhone1,
      customerPhone2,
      customerGovernorate,
      customerAddress,
      items: validItems as OrderItem[],
      status,
      discount: settings.showDiscount ? discount : undefined,
    };

    if (isEditing) {
        onUpdateOrder({
            ...editingOrder,
            ...orderData,
            orderDate: editingOrder.orderDate, // Keep original date on edit
        });
    } else {
        onAddOrder({
            ...orderData,
            id: crypto.randomUUID(),
            orderNumber: `SRV-${Date.now().toString().slice(-6)}`,
            orderDate: new Date().toISOString(),
        });
    }
  };
  
  const calculateTotal = () => {
    const subtotal = items
        .filter(item => !item.isGift && item.price && item.quantity)
        .reduce((total, item) => total + (item.quantity! * item.price!), 0);
    if (settings.showDiscount && discount > 0) {
        return subtotal - (subtotal * (discount / 100));
    }
    return subtotal;
  };
  
  const getCurrentOrderForPreview = (): Order => {
    const validItems = items.filter(item => item.productId && item.name && item.quantity && item.quantity > 0);
    return {
        id: editingOrder?.id || 'preview-id',
        orderNumber: editingOrder?.orderNumber || `SRV-${Date.now().toString().slice(-6)}`,
        customerName: customerName || 'اسم العميل',
        customerPhone1: customerPhone1 || '01234567890',
        customerPhone2,
        customerGovernorate,
        customerAddress: customerAddress || 'عنوان العميل',
        orderDate: editingOrder?.orderDate || new Date().toISOString(),
        items: (validItems.length > 0
            ? validItems
            : [{ id: 'sample-item', productId: 'sample', name: 'منتج نموذجي', price: 100, quantity: 1 }]) as OrderItem[],
        status,
        discount: settings.showDiscount ? discount : undefined,
    };
  };

  const handleDeleteClick = () => {
    if (editingOrder) {
      onDeleteOrder(editingOrder.id);
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
    <h1 className="text-3xl font-bold text-white mb-6 text-3d hologram-title">{isEditing ? 'تعديل الطلب' : 'إنشاء طلب جديد'}</h1>
    <form onSubmit={handleSubmit} className="space-y-8 hologram-panel rounded-2xl p-6 sm:p-8">
      
      {!isEditing && (
        <div className="p-4 hologram-panel rounded-xl">
            <h3 className="text-lg font-bold text-white flex items-center gap-2 text-3d">
                <SparklesIcon className="text-purple-400"/>
                إنشاء باستخدام الذكاء الاصطناعي
            </h3>
            <p className="text-sm text-gray-400 mt-1">صف الطلب بالكامل، وسيقوم الذكاء الاصطناعي بملء جميع الحقول لك.</p>
            <div className="mt-4 flex flex-col sm:flex-row gap-2">
                <textarea
                    value={aiPrompt}
                    onChange={e => setAiPrompt(e.target.value)}
                    placeholder="مثال: طلب لـ أحمد محمود، هاتف 01234567890، من القاهرة، بالعنوان 15 شارع طلعت حرب. الطلب يحتوي على تصميم موقع ويب واحد، وإدارة حسابات التواصل الاجتماعي لمدة شهر كهدية."
                    className={`${inputBaseClasses} flex-grow`}
                    rows={3}
                    disabled={isGenerating}
                />
                <button
                    type="button"
                    onClick={handleGenerateWithAI}
                    disabled={isGenerating || !aiPrompt.trim()}
                    className="hologram-btn px-4 py-2 w-full sm:w-auto h-fit text-sm font-medium rounded-lg flex items-center justify-center gap-2 icon-glow"
                >
                    {isGenerating ? <SpinnerIcon /> : <SparklesIcon className="h-4 w-4"/>}
                    <span>{isGenerating ? 'جاري الإنشاء...' : 'إنشاء'}</span>
                </button>
            </div>
            {aiError && <p className="text-red-400 text-sm mt-2">{aiError}</p>}
        </div>
      )}

      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white border-t border-cyan-500/10 pt-6 text-3d">بيانات العميل</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="customerName" className="block text-sm font-medium text-gray-300 mb-1">اسم العميل <span className="text-gray-500">(اختياري)</span></label>
            <input type="text" id="customerName" value={customerName} onChange={e => setCustomerName(e.target.value)} className={inputBaseClasses} />
          </div>
           <div>
            <label htmlFor="customerPhone1" className="block text-sm font-medium text-gray-300 mb-1">رقم الهاتف الأساسي</label>
            <input type="tel" id="customerPhone1" value={customerPhone1} onChange={e => setCustomerPhone1(e.target.value)} required className={inputBaseClasses} />
          </div>
          <div>
            <label htmlFor="customerPhone2" className="block text-sm font-medium text-gray-300 mb-1">رقم هاتف إضافي (اختياري)</label>
            <input type="tel" id="customerPhone2" value={customerPhone2} onChange={e => setCustomerPhone2(e.target.value)} className={inputBaseClasses} />
          </div>
          <div>
            <label htmlFor="customerGovernorate" className="block text-sm font-medium text-gray-300 mb-1">المحافظة <span className="text-gray-500">(اختياري)</span></label>
            <select id="customerGovernorate" value={customerGovernorate} onChange={e => setCustomerGovernorate(e.target.value)} className={inputBaseClasses}>
                {governorates.map(gov => <option key={gov} value={gov}>{gov}</option>)}
            </select>
          </div>
          <div className="md:col-span-2">
            <label htmlFor="customerAddress" className="block text-sm font-medium text-gray-300 mb-1">العنوان بالتفصيل</label>
            <textarea id="customerAddress" value={customerAddress} onChange={e => setCustomerAddress(e.target.value)} required rows={2} className={inputBaseClasses} />
          </div>
        </div>
      </div>
      
       <div className="space-y-6">
        <h2 className="text-2xl font-bold text-white border-t border-cyan-500/10 pt-6 text-3d">تفاصيل إضافية</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-300 mb-1">الحالة</label>
            <select id="status" value={status} onChange={e => setStatus(e.target.value as OrderStatus)} className={inputBaseClasses}>
              <option>قيد التنفيذ</option>
              <option>مكتمل</option>
              <option>ملغى</option>
            </select>
          </div>
          {settings.showDiscount && (
            <div>
              <label htmlFor="discount" className="block text-sm font-medium text-gray-300 mb-1">خصم (%)</label>
              <input type="number" id="discount" value={discount} onChange={e => setDiscount(parseFloat(e.target.value) || 0)} min="0" max="100" step="0.01" className={inputBaseClasses} />
            </div>
          )}
        </div>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-xl font-bold text-white border-t border-cyan-500/10 pt-6 text-3d">العناصر</h3>
        <div className="space-y-4">
          {items.map((item, index) => (
            <div key={item.id} className="grid grid-cols-12 gap-x-4 gap-y-2 items-end bg-black/20 border border-cyan-500/10 p-3 rounded-lg">
              <div className="col-span-12 sm:col-span-5">
                <label className="text-xs text-gray-400">المنتج</label>
                <select value={item.productId} onChange={e => handleItemChange(item.id!, 'productId', e.target.value)} className={inputBaseClasses}>
                    <option value="" disabled>اختر منتج...</option>
                    {productList.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div className="col-span-4 sm:col-span-2">
                 <label className="text-xs text-gray-400">الكمية</label>
                <input type="number" value={item.quantity} onChange={e => handleItemChange(item.id!, 'quantity', parseInt(e.target.value) || 0)} min="1" className={inputBaseClasses} />
              </div>
              <div className="col-span-8 sm:col-span-3">
                 <label className="text-xs text-gray-400">السعر</label>
                <input 
                    type="number" 
                    value={item.price} 
                    onChange={e => handleItemChange(item.id!, 'price', e.target.value)} 
                    min="0"
                    step="0.01"
                    className={inputBaseClasses} 
                />
              </div>
              <div className="col-span-12 sm:col-span-2 flex items-center justify-between sm:justify-end gap-2 pt-2">
                 <div className="flex items-center gap-2">
                    <input type="checkbox" id={`isGift-${item.id}`} checked={!!item.isGift} onChange={e => handleItemChange(item.id!, 'isGift', e.target.checked)} className="focus:ring-purple-500 h-4 w-4 text-purple-600 border-gray-500 rounded bg-transparent" />
                    <label htmlFor={`isGift-${item.id}`} className="text-xs text-gray-300">هدية</label>
                 </div>
                 <button type="button" onClick={() => removeItem(item.id!)} className="text-red-400 hover:text-red-300 disabled:opacity-50 icon-glow icon-glow-red" disabled={items.length <= 1}>
                    <TrashIcon />
                </button>
              </div>
            </div>
          ))}
        </div>
        <button type="button" onClick={addItem} className="inline-flex items-center px-3 py-2 border border-dashed border-cyan-500/30 text-sm font-medium rounded-lg text-gray-300 hover:text-white hover:border-cyan-500/60 icon-glow">
          <PlusIcon className="h-5 w-5 ml-2" />
          إضافة عنصر
        </button>
      </div>

       <div className="border-t border-cyan-500/10 pt-5">
            <div className="flex justify-between items-center text-white">
                <span className="text-lg font-medium text-3d">المبلغ الإجمالي:</span>
                <span className="text-2xl font-bold hologram-title">
                    {formatCurrency(calculateTotal())}
                </span>
            </div>
        </div>

      <div className="flex justify-between items-center gap-4 flex-wrap pt-5 border-t border-cyan-500/10">
        <div>
           {isEditing && (
                <button
                    type="button"
                    onClick={handleDeleteClick}
                    className="hologram-btn px-6 py-2.5 text-sm font-semibold rounded-lg !bg-red-500/10 !border-red-500/40 !text-red-400 hover:!bg-red-500/20 icon-glow icon-glow-red"
                >
                    حذف الطلب
                </button>
            )}
        </div>

        <div className="flex items-center gap-4 flex-wrap">
            <button type="button" onClick={onBack} className="hologram-btn px-6 py-2.5 text-sm font-semibold rounded-lg !bg-gray-500/10 !border-gray-500/30 !text-gray-300 hover:!bg-gray-500/20">إلغاء</button>
            <button 
              type="button" 
              onClick={() => setIsPreviewOpen(true)} 
              className="hologram-btn px-6 py-2.5 text-sm font-semibold rounded-lg !bg-cyan-500/10 !border-cyan-500/30 !text-cyan-300 hover:!bg-cyan-500/20"
            >
              معاينة الفاتورة
            </button>
            <button type="submit" className="hologram-btn px-6 py-2.5 text-sm font-semibold rounded-lg">
                {isEditing ? 'حفظ التعديلات' : 'إنشاء الطلب'}
            </button>
        </div>
      </div>
    </form>
    
    <Modal isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} title="معاينة الفاتورة النهائية">
      <div className="bg-slate-900 p-2 sm:p-4">
          <div className="transform scale-[0.9] sm:scale-100 origin-top">
              <InvoicePreview settings={settings} order={getCurrentOrderForPreview()} />
          </div>
      </div>
    </Modal>

    </div>
  );
};