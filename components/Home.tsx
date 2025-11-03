import React from 'react';
import { PlusIcon, ChartPieIcon } from './icons';
import { View } from '../types';

interface HomeProps {
    onNavigate: (view: View) => void;
}

const NavCard: React.FC<{ onClick: () => void, icon: React.ReactNode, title: string }> = ({ onClick, icon, title }) => (
    <div className="group w-full" style={{ perspective: '1000px' }}>
        <button
            onClick={onClick}
            className="w-full flex flex-col items-center justify-center gap-4 px-8 py-10 hologram-panel hologram-panel-interactive rounded-2xl text-white text-lg font-semibold transform transition-transform duration-300 group-hover:-translate-y-2 group-hover:scale-105"
        >
            <div className="text-cyan-400 transition-transform duration-300 group-hover:scale-110 icon-glow">
              {icon}
            </div>
            <span className="text-3d">{title}</span>
        </button>
    </div>
);

export const Home: React.FC<HomeProps> = ({ onNavigate }) => {
    return (
        <div className="flex flex-col items-center justify-center text-center py-16 sm:py-24">
            <h2 className="text-5xl sm:text-6xl font-bold hologram-logo">
                serviq
            </h2>
            <p className="mt-4 max-w-2xl text-lg text-gray-400">
                الحل الأمثل لإدارة الطلبات وإنشاء فواتير احترافية. ماذا تود أن تفعل؟
            </p>
            <div className="mt-12 flex flex-col sm:flex-row items-center justify-center gap-8 w-full max-w-xl">
                <NavCard 
                    onClick={() => onNavigate('form')}
                    icon={<PlusIcon className="h-10 w-10"/>}
                    title="انشاء اوردر جديد"
                />
                 <NavCard 
                    onClick={() => onNavigate('dashboard')}
                    icon={<ChartPieIcon className="h-10 w-10"/>}
                    title="احصائيات المبيعات"
                />
            </div>
        </div>
    );
};