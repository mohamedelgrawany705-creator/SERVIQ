import React from 'react';
import { Bars3Icon } from './icons';

interface HeaderProps {
    onMenuClick: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  return (
    <header className="sticky top-0 hologram-panel z-20 md:hidden p-4">
        <div className="flex items-center justify-between">
            <div className="flex items-center">
                <h1 className="text-2xl font-bold hologram-logo">
                    serviq
                </h1>
            </div>
            <button
                onClick={onMenuClick}
                className="p-2 rounded-full text-gray-400 hover:bg-cyan-500/10 hover:text-white icon-glow"
                aria-label="فتح القائمة"
            >
                <Bars3Icon className="h-6 w-6" />
            </button>
        </div>
    </header>
  );
};