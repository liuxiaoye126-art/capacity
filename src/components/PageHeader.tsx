import React from 'react';

interface PageHeaderProps {
  title: string;
  description: string;
}

export const PageHeader = ({ title, description }: PageHeaderProps) => {
  return (
    <div className="mb-4">
      <div className="admin-card px-5 py-5">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-4 w-1 rounded-full bg-primary" />
          <h1 className="text-lg font-semibold text-on-surface">{title}</h1>
        </div>
        <p className="text-sm text-on-surface-variant leading-6">{description}</p>
      </div>
    </div>
  );
};