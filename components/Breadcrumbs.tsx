import React from 'react';
import { View } from '../types';

interface BreadcrumbsProps {
  history: View[];
  onNavigate: (index: number) => void;
}

const viewToNameMap: Record<View, string> = {
  home: 'الرئيسية',
  dashboard: 'احصائيات المبيعات',
  list: 'لوحة الطلبات',
  form: 'طلب جديد',
  invoice: 'عرض الفاتورة',
  settings: 'اعدادات الفاتورة',
  products: 'المنتجات',
  'post-creation': 'الفاتورة جاهزة',
};

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ history, onNavigate }) => {
  if (history.length <= 1) {
    return <div className="h-5"></div>; // Placeholder to prevent layout shift
  }

  return (
    <nav className="flex items-center space-x-2 text-sm text-gray-400 h-5" aria-label="Breadcrumb">
      {history.map((view, index) => (
        <React.Fragment key={`${view}-${index}`}>
          {index > 0 && <span className="text-gray-500 mx-1">/</span>}
          <button 
            onClick={() => onNavigate(index)} 
            disabled={index === history.length - 1}
            className={`transition-colors duration-200 ${index === history.length - 1 ? 'text-white font-semibold cursor-default' : 'hover:text-purple-400'}`}
          >
            {viewToNameMap[view] || view}
          </button>
        </React.Fragment>
      ))}
    </nav>
  );
};