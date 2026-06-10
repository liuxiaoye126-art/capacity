import { ChevronDown, ChevronRight, Database, LayoutDashboard } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { CapacityView } from '../../types';

export interface BreadcrumbItem {
  label: string;
  onClick?: () => void;
}

interface SubItemProps {
  label: string;
  isActive?: boolean;
  onClick?: () => void;
  disabled?: boolean;
}

const SubItem = ({ label, isActive, onClick, disabled }: SubItemProps) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`relative w-full text-left py-2.5 pl-9 pr-4 text-sm transition-colors
      ${disabled
        ? 'cursor-not-allowed text-on-surface-variant/50 border-l-[3px] border-transparent'
        : isActive
          ? 'text-primary font-medium bg-primary/5 border-l-[3px] border-primary'
          : 'text-on-surface-variant border-l-[3px] border-transparent hover:bg-surface-container-low hover:text-primary'
      }`}
  >
    {label}
  </button>
);

interface SidebarItemProps {
  icon: React.ElementType;
  label: string;
  isActive?: boolean;
  isOpen?: boolean;
  onClick?: () => void;
  children?: React.ReactNode;
}

const SidebarItem = ({ icon: Icon, label, isActive, isOpen, onClick, children }: SidebarItemProps) => (
  <div>
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between px-4 py-3 text-sm transition-colors
        ${isActive
          ? 'text-primary font-medium'
          : 'text-on-surface-variant hover:bg-surface-container-low hover:text-on-surface'
        }`}
    >
      <div className="flex items-center gap-3">
        <Icon className="w-[18px] h-[18px] flex-shrink-0" />
        <span>{label}</span>
      </div>
      {children && (isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />)}
    </button>
    <AnimatePresence initial={false}>
      {isOpen && children && (
        <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} exit={{ height: 0 }} className="overflow-hidden">
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

interface LayoutProps {
  children: React.ReactNode;
  breadcrumbs: BreadcrumbItem[];
  currentView: CapacityView;
  onChangeView: (view: CapacityView) => void;
}

export const MainFooterPortal = ({ children }: { children: React.ReactNode }) => {
  const container = typeof document !== 'undefined' ? document.getElementById('layout-main-footer') : null;

  return container ? createPortal(children, container) : null;
};

export const Layout = ({ children, breadcrumbs, currentView, onChangeView }: LayoutProps) => {
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['产能管理']);

  const toggleMenu = (menu: string) => {
    setExpandedMenus((prev) => (prev.includes(menu) ? prev.filter((item) => item !== menu) : [...prev, menu]));
  };

  return (
    <div className="flex h-screen overflow-hidden bg-surface">
      <aside className="w-[220px] flex-shrink-0 flex flex-col bg-white border-r border-outline-variant overflow-hidden">
        <div className="h-12 flex items-center gap-2.5 px-4 bg-primary flex-shrink-0">
          <div className="w-7 h-7 rounded bg-white/20 flex items-center justify-center text-white text-xs font-bold">BN</div>
          <span className="text-white font-semibold text-sm tracking-wide">笨鸟系统</span>
        </div>

        <nav className="flex-1 overflow-y-auto custom-scrollbar py-2">
          <SidebarItem
            icon={Database}
            label="产能管理"
            isActive
            isOpen={expandedMenus.includes('产能管理')}
            onClick={() => toggleMenu('产能管理')}
          >
            <SubItem label="一级产能管理" isActive={currentView === 'level1'} onClick={() => onChangeView('level1')} />
            <SubItem label="二级产能管理" isActive={currentView === 'level2'} onClick={() => onChangeView('level2')} />
            <SubItem label="三级产能管理" isActive={currentView === 'level3'} onClick={() => onChangeView('level3')} />
            <SubItem label="四级产能管理" isActive={currentView === 'level4'} onClick={() => onChangeView('level4')} />
            <SubItem label="五级产能管理" isActive={currentView === 'level5'} onClick={() => onChangeView('level5')} />
          </SidebarItem>
        </nav>
      </aside>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="h-12 flex-shrink-0 bg-primary flex items-center justify-between px-5 shadow-sm z-10">
          <div className="text-white/90 text-sm">产能管理</div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 cursor-pointer">
              <div className="w-7 h-7 rounded-full overflow-hidden bg-white/20 flex items-center justify-center text-white text-xs font-bold">ZS</div>
              <span className="text-white text-sm">张三</span>
            </div>
            <button className="flex items-center gap-1 text-white/80 hover:text-white text-sm transition-colors">
              <ChevronDown className="w-3.5 h-3.5" />
              退出登录
            </button>
          </div>
        </header>

        <div className="flex-shrink-0 flex items-center gap-1.5 px-5 py-3 text-sm bg-white border-b border-outline-variant">
          <LayoutDashboard className="w-3.5 h-3.5 text-on-surface-variant" />
          {breadcrumbs.map((crumb, index) => (
            <React.Fragment key={crumb.label}>
              <span className="text-on-surface-variant">/</span>
              {crumb.onClick && index !== breadcrumbs.length - 1 ? (
                <button
                  type="button"
                  onClick={crumb.onClick}
                  className="text-on-surface-variant transition-colors hover:text-primary"
                >
                  {crumb.label}
                </button>
              ) : (
                <span className={index === breadcrumbs.length - 1 ? 'text-primary font-medium' : 'text-on-surface-variant'}>
                  {crumb.label}
                </span>
              )}
            </React.Fragment>
          ))}
        </div>

        <main className="flex-1 min-h-0 flex flex-col overflow-hidden">
          <div className="flex-1 overflow-auto custom-scrollbar p-5">{children}</div>
          <div id="layout-main-footer" className="flex-shrink-0"></div>
        </main>
      </div>
    </div>
  );
};