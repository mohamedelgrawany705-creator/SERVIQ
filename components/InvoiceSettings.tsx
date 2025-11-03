import React, { useState } from 'react';
import { InvoiceSettings, ThemeColor, InvoiceFontFamily, Order, Product, PromotionSetting } from '../types';
import { InvoicePreview } from './InvoicePreview';

interface InvoiceSettingsProps {
  initialSettings: InvoiceSettings;
  onSave: (settings: InvoiceSettings) => void;
  onCancel: () => void;
  products: Product[];
}

interface InvoiceTemplate {
  name: string;
  description: string;
  settings: Partial<InvoiceSettings>;
}

const templates: InvoiceTemplate[] = [
    {
        name: 'تقنية حديثة',
        description: 'تصميم عصري ونظيف يناسب شركات التكنولوجيا.',
        settings: {
            theme: 'purple',
            fontFamily: 'sans',
            companyName: 'Tech Solutions',
            companyAddress: '١٢٣ شارع الابتكار\nمدينة المستقبل، ١١٥١١',
            companyContact: 'info@techsolutions.eg',
            invoiceTitle: 'فاتورة تقنية',
            footerNotes: 'جميع الحقوق محفوظة لشركة Tech Solutions © 2024.',
            logo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTUwIDAgTDEwMCAyNSBWNzUgTDUwIDEwMCBMMCA3NSBW MjUgWiBNNTAgMjAgTDgwIDM1IFY2NSBMNTAgODAgTDIwIDY1IFYzNSBaIiBmaWxsPSJyZ2IoMTM5LCA5MiwgMjQ2KSIvPjwvc3ZnPg==',
        },
    },
    {
        name: 'استوديو إبداعي',
        description: 'تصميم فني وجذاب للمصممين والمستقلين.',
        settings: {
            theme: 'blue',
            fontFamily: 'sans',
            companyName: 'Creative Studio',
            companyAddress: '٤٥٦ شارع الفن\nالحي الإبداعي، ٣٤٥٦٧',
            companyContact: 'hello@creativestudio.art',
            invoiceTitle: 'فاتورة أعمال',
            footerNotes: 'شكرًا لاختياركم الإبداع.',
            logo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMjAiIGZpbGw9InJnYigzNywgOTksIDIzNSkiLz48cmVjdCB4PSI2MCIgeT0iNjAiIHdpZHRoPSIzMCIgaGVpZ"dGg0PSIzMCIgZmlsbD0icmdiKDU2LCAxODksIDI0OCkiLz48cGF0aCBkPSJNMjAgNzAgUSA1MCA0MCwgODAgNzAiIHN0cm9rZT0icmdiKDM3LCA5OSwgMjM1KSIgZmlsbD0idHJhbnNwYXJlbnQiIHN0cm9rZS13aWR0aD0iNSIvPjwvc3ZnPg==',
        },
    },
     {
        name: 'صديق للبيئة',
        description: 'تصميم هادئ ومستوحى من الطبيعة.',
        settings: {
            theme: 'green',
            fontFamily: 'serif',
            companyName: 'Eco World',
            companyAddress: '٧٨٩ شارع الطبيعة\nالواحة الخضراء، ٨٩٠١٢',
            companyContact: 'contact@ecoworld.com',
            invoiceTitle: 'فاتورة بيئية',
            footerNotes: 'نحو مستقبل أكثر اخضرارًا.',
            logo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTUwIDAgQyAyMCAyMCwgMjAgODAsIDUwIDEwMCBDIDgwIDgwLCA4MCAyMCwgNTAgMCBaIE01MCAxMCBDIDcwIDMwLCA3MCA3MCwgNTAgOTAgQyAzMCA3MCwgMzAgMzAsIDUwIDEwIFoiIGZpbGw9InJnYigyMiwgMTYzLCA3NCkiLz48L3N2Zz4=',
        },
    },
    {
        name: 'شركة كلاسيكية',
        description: 'تصميم رسمي وأنيق يناسب الشركات التقليدية.',
        settings: {
            theme: 'classic',
            fontFamily: 'serif',
            companyName: 'The Foundation Inc.',
            companyAddress: '١ شارع الأعمال\nالمركز المالي، ١٠١٠١',
            companyContact: 'support@foundation.corp',
            invoiceTitle: 'فاتورة رسمية',
            footerNotes: 'الجودة والثقة هما أساس عملنا.',
            logo: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgdmlld0JveD0iMCAwIDEwMCAxMDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHJlY3QgeD0iMTAiIHk9IjEwIiB3aWR0aD0iODAiIGhlaWdodD0iODAiIHN0cm9rZT0icmdiKDU1LCA2NSwgODEpIiBzdHJva2Utd2lkdGg9IjUiIGZpbGw9InRyYW5zcGFyZW50Ii8+PHRleHQgeD0iNTAiIHk9IjYwIiBmb250LWZhbWlseT0ic2VyaWYiIGZvbnQtc2l6ZT0iNDAiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGZpbGw9InJnYig1NSwgNjUsIDgxKSI+UzwvdGV4dD48L3N2Zz4=',
        },
    },
];

const sampleOrderForPreview: Order = {
    id: 'preview-123',
    orderNumber: 'SRV-DEMO',
    customerName: 'الاسم النموذجي للعميل',
    customerPhone1: '01012345678',
    customerGovernorate: 'المحافظة النموذجية',
    customerAddress: 'العنوان النموذجي للعميل',
    orderDate: new Date().toISOString(),
    items: [
// Fix: Added missing 'productId' to satisfy OrderItem type for preview.
        { id: 'item-prev-1', productId: 'prod-sample-1', name: 'المنتج الأول', quantity: 2, price: 150 },
// Fix: Added missing 'productId' to satisfy OrderItem type for preview.
        { id: 'item-prev-2', productId: 'prod-sample-2', name: 'المنتج الثاني', quantity: 1, price: 300 },
// Fix: Added missing 'productId' to satisfy OrderItem type for preview.
        { id: 'item-prev-3', productId: 'prod-sample-3', name: 'منتج مجاني', quantity: 1, price: 50, isGift: true },
    ],
    status: 'مكتمل',
    discount: 15,
};

const inputBaseClasses = "hologram-input mt-1 block w-full sm:text-sm text-white p-2";

const TemplateCard: React.FC<{ template: InvoiceTemplate, onSelect: () => void }> = ({ template, onSelect }) => {
    const themeClasses = {
        purple: 'bg-purple-900/50 border-purple-500/30',
        blue: 'bg-blue-900/50 border-blue-500/30',
        green: 'bg-green-900/50 border-green-500/30',
        classic: 'bg-gray-700/50 border-gray-500/30',
    };
    return (
        <button
            type="button"
            onClick={onSelect}
            className="hologram-panel hologram-panel-interactive p-4 rounded-xl text-right group flex flex-col transform transition-transform duration-300 hover:-translate-y-1"
        >
            <div className={`w-full h-24 rounded-lg flex items-center justify-center border ${themeClasses[template.settings.theme as ThemeColor]}`}>
                <img src={template.settings.logo} alt={template.name} className="h-12 w-12 object-contain transition-transform duration-300 group-hover:scale-110" />
            </div>
            <div className="mt-3">
                <h4 className="font-bold text-white text-3d">{template.name}</h4>
                <p className="text-xs text-gray-400 mt-1">{template.description}</p>
            </div>
        </button>
    );
};

const ThemeOption: React.FC<{ theme: ThemeColor, currentTheme: ThemeColor, setTheme: (theme: ThemeColor) => void }> = ({ theme, currentTheme, setTheme }) => {
  const colors = {
    purple: 'from-purple-500 to-pink-500',
    blue: 'from-blue-500 to-cyan-500',
    green: 'from-green-500 to-emerald-500',
    classic: 'from-gray-600 to-gray-800'
  };
  const isSelected = theme === currentTheme;
  return (
    <button
      type="button"
      onClick={() => setTheme(theme)}
      className={`w-full h-12 rounded-lg bg-gradient-to-r ${colors[theme]} flex items-center justify-center text-white font-semibold capitalize relative transition-all duration-200 transform hover:-translate-y-0.5 ${isSelected ? 'ring-2 ring-offset-2 ring-offset-slate-900 ring-white shadow-[0_0_15px_rgba(255,255,255,0.5)]' : 'hover:opacity-90'}`}
    >
      {theme}
    </button>
  );
};

const CustomRadio: React.FC<{ name: string, value: string, label: string, checked: boolean, onChange: (value: string) => void }> = ({ name, value, label, checked, onChange}) => (
    <label className={`block cursor-pointer p-3 rounded-lg text-center text-sm font-medium transition-all duration-200 transform hover:-translate-y-0.5 ${checked ? 'hologram-btn !bg-purple-600/30 !border-purple-500/80' : 'bg-black/20 text-gray-300 hover:bg-black/40 border border-transparent'}`}>
        <input type="radio" name={name} value={value} checked={checked} onChange={(e) => onChange(e.target.value)} className="sr-only" />
        {label}
    </label>
);


export const InvoiceSettingsForm: React.FC<InvoiceSettingsProps> = ({ initialSettings, onSave, onCancel, products }) => {
  const [settings, setSettings] = useState<InvoiceSettings>(initialSettings);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSettings({ ...settings, logo: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setSettings({ ...settings, [name]: value });
  };
  
  const handleToggleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    setSettings({ ...settings, [name]: checked });
  };

  const handleCustomRadioChange = (name: keyof InvoiceSettings, value: string) => {
    setSettings({ ...settings, [name]: value });
  }

  const handlePromotionChange = (field: keyof PromotionSetting, value: boolean | string | null) => {
    setSettings(prev => ({
        ...prev,
        promotion: {
            ...prev.promotion,
            [field]: value,
        }
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(settings);
  };

  return (
    <div className="max-w-7xl mx-auto">
       <h1 className="text-3xl font-bold text-white mb-6 text-3d hologram-title">اعدادات الفاتورة</h1>
       <div className="grid lg:grid-cols-2 gap-12">
        {/* Column 1: Form */}
        <form onSubmit={handleSubmit} className="space-y-8 hologram-panel rounded-2xl p-6 sm:p-8 h-fit">
          
          <div>
              <h2 className="text-2xl font-bold text-white text-3d">القوالب الجاهزة</h2>
              <p className="text-gray-400 text-sm mt-1">اختر قالبًا احترافيًا للبدء بسرعة. سيؤدي تحديد القالب إلى ملء جميع الحقول أدناه.</p>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {templates.map(template => (
                      <TemplateCard 
                          key={template.name} 
                          template={template} 
                          onSelect={() => setSettings(prev => ({ ...prev, ...template.settings }))}
                      />
                  ))}
              </div>
          </div>

          <div className="border-t border-cyan-500/10 pt-8">
            <h2 className="text-2xl font-bold text-white text-3d">بيانات الشركة</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center mt-4">
                <div className="md:col-span-1">
                    <label className="block text-sm font-medium text-gray-300">شعار الشركة</label>
                    <div className="mt-2 flex items-center gap-4">
                        <div className="w-20 h-20 rounded-lg bg-black/20 flex items-center justify-center overflow-hidden border border-cyan-500/20">
                            {settings.logo ? <img src={settings.logo} alt="شعار الشركة" className="object-contain h-full w-full"/> : <span className="text-xs text-gray-400">معاينة</span>}
                        </div>
                        <div className="space-y-1">
                            <input type="file" id="logo-upload" className="hidden" accept="image/*" onChange={handleFileChange} />
                            <label htmlFor="logo-upload" className="cursor-pointer text-sm text-purple-400 hover:text-purple-300 font-semibold">رفع</label>
                            {settings.logo && <button type="button" onClick={() => setSettings({...settings, logo: undefined})} className="block text-xs text-red-400 hover:text-red-300">إزالة</button>}
                        </div>
                    </div>
                </div>
                <div className="md:col-span-2 space-y-4">
                    <div>
                        <label htmlFor="companyName" className="block text-sm font-medium text-gray-300 mb-1">اسم الشركة</label>
                        <input type="text" id="companyName" name="companyName" value={settings.companyName || ''} onChange={handleInputChange} className={inputBaseClasses} />
                    </div>
                    <div>
                        <label htmlFor="companyAddress" className="block text-sm font-medium text-gray-300 mb-1">عنوان الشركة</label>
                        <textarea id="companyAddress" name="companyAddress" value={settings.companyAddress || ''} onChange={handleInputChange} rows={2} className={inputBaseClasses} />
                    </div>
                    <div>
                        <label htmlFor="companyContact" className="block text-sm font-medium text-gray-300 mb-1">معلومات التواصل</label>
                        <input type="text" id="companyContact" name="companyContact" value={settings.companyContact || ''} onChange={handleInputChange} className={inputBaseClasses} />
                    </div>
                </div>
            </div>
          </div>
          
          <div className="border-t border-cyan-500/10 pt-8">
              <h2 className="text-2xl font-bold text-white text-3d">محتوى الفاتورة</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
                  <div>
                    <label htmlFor="invoiceTitle" className="block text-sm font-medium text-gray-300 mb-1">عنوان الفاتورة</label>
                    <input type="text" id="invoiceTitle" name="invoiceTitle" value={settings.invoiceTitle || ''} onChange={handleInputChange} placeholder="مثال: فاتورة، عرض سعر" className={inputBaseClasses} />
                  </div>
                  <div className="space-y-4 pt-2">
                    <div className="relative flex items-start">
                        <div className="flex items-center h-5">
                            <input id="showTax" name="showTax" type="checkbox" checked={settings.showTax} onChange={handleToggleChange} className="focus:ring-purple-500 h-4 w-4 text-purple-600 border-gray-500 rounded bg-transparent" />
                        </div>
                        <div className="mr-3 text-sm">
                            <label htmlFor="showTax" className="font-medium text-gray-300">إظهار قسم الضريبة</label>
                        </div>
                    </div>
                    <div className="relative flex items-start">
                        <div className="flex items-center h-5">
                            <input id="showDiscount" name="showDiscount" type="checkbox" checked={settings.showDiscount} onChange={handleToggleChange} className="focus:ring-purple-500 h-4 w-4 text-purple-600 border-gray-500 rounded bg-transparent" />
                        </div>
                        <div className="mr-3 text-sm">
                            <label htmlFor="showDiscount" className="font-medium text-gray-300">تفعيل الخصومات</label>
                        </div>
                    </div>
                  </div>
                  <div className="md:col-span-2">
                      <label htmlFor="footerNotes" className="block text-sm font-medium text-gray-300 mb-1">ملاحظات التذييل</label>
                      <textarea id="footerNotes" name="footerNotes" value={settings.footerNotes || ''} onChange={handleInputChange} rows={3} placeholder="مثال: شروط الدفع، سياسة الاسترجاع..." className={inputBaseClasses} />
                  </div>
              </div>
          </div>

          <div className="border-t border-cyan-500/10 pt-8">
            <h2 className="text-2xl font-bold text-white text-3d">العروض الترويجية</h2>
            <p className="text-gray-400 text-sm mt-1">قم بإعداد عرض ترويجي تلقائي. عند شراء منتج معين، يتم إضافة منتج آخر كهدية.</p>
            <div className="mt-4 space-y-4">
                <div className="relative flex items-start">
                    <div className="flex items-center h-5">
                        <input 
                            id="promotionEnabled" 
                            name="promotionEnabled" 
                            type="checkbox" 
                            checked={settings.promotion?.enabled || false} 
                            onChange={(e) => handlePromotionChange('enabled', e.target.checked)}
                            className="focus:ring-purple-500 h-4 w-4 text-purple-600 border-gray-500 rounded bg-transparent" />
                    </div>
                    <div className="mr-3 text-sm">
                        <label htmlFor="promotionEnabled" className="font-medium text-gray-300">تفعيل العروض التلقائية</label>
                    </div>
                </div>
                {settings.promotion?.enabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-black/20 rounded-lg border border-cyan-500/10">
                        <div>
                            <label htmlFor="triggerProduct" className="block text-sm font-medium text-gray-300 mb-1">عند شراء المنتج</label>
                            <select 
                                id="triggerProduct" 
                                value={settings.promotion.triggerProductId || ''} 
                                onChange={(e) => handlePromotionChange('triggerProductId', e.target.value)}
                                className={inputBaseClasses}
                            >
                                <option value="">اختر المنتج المُحفِّز...</option>
                                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="giftProduct" className="block text-sm font-medium text-gray-300 mb-1">احصل على هدية</label>
                            <select 
                                id="giftProduct" 
                                value={settings.promotion.giftProductId || ''} 
                                onChange={(e) => handlePromotionChange('giftProductId', e.target.value)}
                                className={inputBaseClasses}
                            >
                                <option value="">اختر المنتج الهدية...</option>
                                {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>
                    </div>
                )}
            </div>
          </div>

          <div className="border-t border-cyan-500/10 pt-8">
              <h2 className="text-2xl font-bold text-white text-3d">شكل الفاتورة</h2>
              <div className="space-y-6 mt-4">
                <div>
                    <label className="text-base font-medium text-gray-300 text-3d">التصميم</label>
                    <div className="mt-2 grid grid-cols-2 sm:grid-cols-4 gap-4">
                        <ThemeOption theme="purple" currentTheme={settings.theme} setTheme={(theme) => handleCustomRadioChange('theme', theme)}/>
                        <ThemeOption theme="blue" currentTheme={settings.theme} setTheme={(theme) => handleCustomRadioChange('theme', theme)}/>
                        <ThemeOption theme="green" currentTheme={settings.theme} setTheme={(theme) => handleCustomRadioChange('theme', theme)}/>
                        <ThemeOption theme="classic" currentTheme={settings.theme} setTheme={(theme) => handleCustomRadioChange('theme', theme)}/>
                    </div>
                </div>
                <div>
                    <label className="text-base font-medium text-gray-300 text-3d">الخط</label>
                     <div className="mt-2 grid grid-cols-3 gap-4">
                        <CustomRadio name="fontFamily" value="sans" label="أساسي" checked={settings.fontFamily === 'sans'} onChange={(value) => handleCustomRadioChange('fontFamily', value)} />
                        <CustomRadio name="fontFamily" value="serif" label="رسمي" checked={settings.fontFamily === 'serif'} onChange={(value) => handleCustomRadioChange('fontFamily', value)} />
                        <CustomRadio name="fontFamily" value="mono" label="تقني" checked={settings.fontFamily === 'mono'} onChange={(value) => handleCustomRadioChange('fontFamily', value)} />
                    </div>
                </div>
              </div>
          </div>

          <div className="flex justify-end gap-4 pt-5 border-t border-cyan-500/10">
            <button type="button" onClick={onCancel} className="hologram-btn px-6 py-2.5 text-sm font-semibold rounded-lg !bg-gray-500/10 !border-gray-500/30 !text-gray-300 hover:!bg-gray-500/20">إلغاء</button>
            <button type="submit" className="hologram-btn px-6 py-2.5 text-sm font-semibold rounded-lg">حفظ الإعدادات</button>
          </div>
        </form>

        {/* Column 2: Preview */}
        <div className="hidden lg:block">
            <div className="sticky top-8">
              <h2 className="text-xl font-bold text-white mb-4 text-3d">معاينة حية</h2>
              <div className="hologram-panel p-4 rounded-xl">
                <div className="transform scale-[0.85] origin-top-right -mr-[8%]">
                    <InvoicePreview settings={settings} order={sampleOrderForPreview} />
                </div>
              </div>
            </div>
        </div>
       </div>
    </div>
  );
};