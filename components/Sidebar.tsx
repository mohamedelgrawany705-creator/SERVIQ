import React from 'react';
import { View } from '../types';
import { DocumentTextIcon, PlusIcon, CogIcon, XMarkIcon, ChartPieIcon, CubeIcon, Squares2x2Icon } from './icons';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  currentView: View;
  onNavigate: (view: View) => void;
}

interface NavItemProps {
  icon: React.ReactNode;
  label: string;
  isActive: boolean;
  onClick: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, isActive, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center p-3 rounded-lg text-right transition-all duration-200 transform-gpu icon-glow ${
      isActive
        ? 'bg-purple-600/20 text-white font-semibold border border-purple-500/30 shadow-[0_0_15px_rgba(168,85,247,0.2)]'
        : 'text-gray-300 hover:bg-cyan-500/10 hover:text-white hover:-translate-y-0.5'
    }`}
  >
    <span className={`ml-3 transition-colors ${isActive ? 'text-purple-400' : 'text-gray-400'}`}>{icon}</span>
    <span>{label}</span>
  </button>
);

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose, currentView, onNavigate }) => {
  return (
    <>
      {/* Backdrop for mobile */}
      <div
        className={`fixed inset-0 bg-black/70 backdrop-blur-sm z-30 transition-opacity duration-300 md:hidden ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      ></div>

      {/* Sidebar */}
      <aside
        className={`hologram-panel fixed top-0 bottom-0 right-0 w-64 z-40 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 md:shadow-none md:w-56 md:flex-shrink-0 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="p-4 flex justify-between items-center border-b border-cyan-500/10">
          <button className="text-2xl font-bold hologram-logo" onClick={() => onNavigate('home')}>
            serviq
          </button>
          <button
            onClick={onClose}
            className="md:hidden p-1 rounded-full text-gray-400 hover:bg-cyan-500/10 icon-glow"
            aria-label="إغلاق القائمة"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>
        <nav className="p-4 space-y-2">
           <NavItem
            label="الرئيسية"
            icon={<Squares2x2Icon className="h-5 w-5" />}
            isActive={currentView === 'home'}
            onClick={() => onNavigate('home')}
          />
           <NavItem
            label="احصائيات المبيعات"
            icon={<ChartPieIcon className="h-5 w-5" />}
            isActive={currentView === 'dashboard'}
            onClick={() => onNavigate('dashboard')}
          />
          <NavItem
            label="لوحة الطلبات"
            icon={<DocumentTextIcon className="h-5 w-5" />}
            isActive={currentView === 'list'}
            onClick={() => onNavigate('list')}
          />
          <NavItem
            label="إنشاء طلب"
            icon={<PlusIcon className="h-5 w-5" />}
            isActive={currentView === 'form'}
            onClick={() => onNavigate('form')}
          />
           <NavItem
            label="المنتجات"
            icon={<CubeIcon className="h-5 w-5" />}
            isActive={currentView === 'products'}
            onClick={() => onNavigate('products')}
          />
          <NavItem
            label="اعدادات الفاتورة"
            icon={<CogIcon className="h-5 w-5" />}
            isActive={currentView === 'settings'}
            onClick={() => onNavigate('settings')}
          />
        </nav>
      </aside>
    </>
  );
};