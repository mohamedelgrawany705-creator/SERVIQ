import React, { useState } from 'react';
import { GoogleGenAI, Type } from '@google/genai';
import { Order, OrderItem, Product } from '../types';
import { SparklesIcon, SpinnerIcon } from './icons';

interface BatchOrderFormProps {
    onAddBatchOrders: (orders: Omit<Order, 'id' | 'orderNumber' | 'orderDate' | 'status'>[]) => void;
    productList: Product[];
    onBack: () => void;
}

const inputBaseClasses = "hologram-input mt-1 block w-full sm:text-sm text-white transition-colors duration-200 p-2";

export const BatchOrderForm: React.FC<BatchOrderFormProps> = ({ onAddBatchOrders, productList, onBack }) => {
    const [aiPrompt, setAiPrompt] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);

    const handleGenerateWithAI = async () => {
        if (!aiPrompt.trim()) return;

        setIsGenerating(true);
        setAiError(null);

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

            const availableProductsString = productList.map(p => `(ID: "${p.id}", Name: "${p.name}")`).join(', ');

            const itemSchema = {
                type: Type.OBJECT,
                properties: {
                    productId: { type: Type.STRING, description: 'معرف المنتج (ID) المطابق من القائمة المتاحة.' },
                    quantity: { type: Type.NUMBER, description: 'كمية العنصر، الافتراضي هو 1' },
                    isGift: { type: Type.BOOLEAN, description: 'هل هذا العنصر هدية مجانية؟ الافتراضي هو false' },
                },
                required: ['productId'],
            };

            const orderSchema = {
                type: Type.OBJECT,
                properties: {
                    customerName: { type: Type.STRING, description: 'اسم العميل الكامل' },
                    customerPhone1: { type: Type.STRING, description: 'رقم الهاتف الأساسي للعميل' },
                    customerPhone2: { type: Type.STRING, description: 'رقم الهاتف الإضافي للعميل إن وجد' },
                    customerGovernorate: { type: Type.STRING, description: 'محافظة العميل' },
                    customerAddress: { type: Type.STRING, description: 'عنوان العميل التفصيلي' },
                    items: {
                        type: Type.ARRAY,
                        description: 'قائمة العناصر في الطلب. طابق كل عنصر مذكور مع المنتج الأنسب من قائمة المنتجات المتاحة وأرجع الـ ID الخاص به.',
                        items: itemSchema,
                    },
                },
                 required: ['customerName', 'customerPhone1', 'customerGovernorate', 'customerAddress', 'items'],
            };
            
            const batchSchema = {
                type: Type.ARRAY,
                description: "قائمة بجميع الطلبات المستخرجة من النص.",
                items: orderSchema,
            };

            const prompt = `
            مهمتك هي تحليل النص التالي الذي يحتوي على عدة طلبات واستخراج المعلومات بدقة مطلقة.
            النص: "${aiPrompt}"

            المنتجات المتاحة هي: [${availableProductsString}].

            **قواعد صارمة:**
            - **النسخ الحرفي:** لكل طلب، يجب عليك نسخ معلومات العميل (الاسم، الهاتف، العنوان، المحافظة) حرفيًا كما هي موجودة في النص، حتى لو كانت تحتوي على أخطاء إملائية. **لا تقم بتصحيح أو تغيير أي شيء على الإطلاق.**
            - **مطابقة المنتج:** طابق العناصر المذكورة مع أنسب منتج من قائمة "المنتجات المتاحة" وأرجع الـ ID الخاص به.
            - **الهدايا:** إذا تم ذكر عنصر كـ "هدية" أو "مجاني"، اجعل قيمة isGift true.
            - **التنسيق:** يجب أن يكون الإخراج عبارة عن مصفوفة JSON من كائنات الطلبات، تتبع المخطط المحدد.

            مثال على النسخ الحرفي: إذا كان الاسم في النص "احممد"، يجب أن تستخرجه "احممد" وليس "أحمد".

            قم بتحليل واستخراج جميع الطلبات الآن.
            `;

            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: prompt,
                config: {
                    systemInstruction: 'أنت مساعد استخراج بيانات آلي فائق الدقة. مهمتك الأساسية هي النسخ الحرفي للمعلومات من النص المقدم دون أي تعديل أو تصحيح إملائي. الدقة المطلقة هي الأولوية القصوى.',
                    responseMimeType: "application/json",
                    responseSchema: batchSchema,
                    temperature: 0,
                    thinkingConfig: { thinkingBudget: 0 },
                }
            });

            const jsonString = response.text.trim();
            const parsedData = JSON.parse(jsonString);

            if (Array.isArray(parsedData)) {
                const newOrders = parsedData.map(orderData => {
                    const items = (orderData.items || [])
                        .map((item: any) => {
                            if (!item.productId) return null;
                            const product = productList.find(p => p.id === item.productId);
                            if (!product) return null;
                            return {
                                id: crypto.randomUUID(),
                                productId: product.id,
                                name: product.name,
                                quantity: item.quantity || 1,
                                price: product.price,
                                isGift: item.isGift || false,
                            };
                        })
                        .filter(Boolean);

                    if (items.length === 0) return null;

                    return {
                        customerName: orderData.customerName || '',
                        customerPhone1: orderData.customerPhone1 || '',
                        customerPhone2: orderData.customerPhone2 || '',
                        customerGovernorate: orderData.customerGovernorate || '',
                        customerAddress: orderData.customerAddress || '',
                        items,
                    };
                }).filter(Boolean);
                
                if(newOrders.length > 0) {
                    onAddBatchOrders(newOrders as Omit<Order, 'id' | 'orderNumber' | 'orderDate' | 'status'>[]);
                } else {
                     setAiError("لم يتم العثور على أي طلبات صالحة أو منتجات مطابقة في النص.");
                }

            } else {
                 setAiError("فشل الذكاء الاصطناعي في إرجاع قائمة بالطلبات. يرجى التحقق من النص.");
            }

        } catch (error) {
            console.error("Error generating with AI:", error);
            setAiError("فشل في إنشاء البيانات. يرجى المحاولة مرة أخرى أو التحقق من النص.");
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-white mb-6 text-3d hologram-title">إنشاء فواتير متعددة</h1>
            <div className="space-y-8 hologram-panel rounded-2xl p-6 sm:p-8">
                <div>
                    <h3 className="text-lg font-bold text-white flex items-center gap-2 text-3d">
                        <SparklesIcon className="text-purple-400"/>
                        إنشاء دفعة باستخدام الذكاء الاصطناعي
                    </h3>
                    <p className="text-sm text-gray-400 mt-1">
                        الصق قائمة ببيانات العملاء والطلبات. سيقوم الذكاء الاصطناعي بتحليلها وإنشاء فاتورة لكل طلب تلقائيًا.
                    </p>
                    <div className="mt-4">
                        <textarea
                            value={aiPrompt}
                            onChange={e => setAiPrompt(e.target.value)}
                            placeholder="مثال:
أحمد، 0101، القاهرة، ...، يريد تصميم شعار.
فاطمة، 0122، الجيزة، ...، تريد موقع ويب واستضافة مجانية.
                            "
                            className={`${inputBaseClasses} w-full`}
                            rows={10}
                            disabled={isGenerating}
                        />
                    </div>
                    {aiError && <p className="text-red-400 text-sm mt-2">{aiError}</p>}
                </div>

                <div className="flex justify-end items-center gap-4 flex-wrap pt-5 border-t border-cyan-500/10">
                    <button type="button" onClick={onBack} className="hologram-btn px-6 py-2.5 text-sm font-semibold rounded-lg !bg-gray-500/10 !border-gray-500/30 !text-gray-300 hover:!bg-gray-500/20">إلغاء</button>
                    <button
                        type="button"
                        onClick={handleGenerateWithAI}
                        disabled={isGenerating || !aiPrompt.trim()}
                        className="hologram-btn px-6 py-2.5 text-sm font-semibold rounded-lg flex items-center justify-center gap-2 icon-glow"
                    >
                        {isGenerating ? <SpinnerIcon /> : <SparklesIcon className="h-4 w-4"/>}
                        <span>{isGenerating ? 'جاري الإنشاء...' : 'إنشاء الفواتير'}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
