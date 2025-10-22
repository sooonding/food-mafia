'use client';

import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  title: string;
  onBack?: () => void;
  className?: string;
}

export function PageHeader({ title, onBack, className }: PageHeaderProps) {
  return (
    <header
      className={cn(
        'flex items-center gap-3 py-4 mb-4 border-b bg-white',
        className
      )}
    >
      {onBack && (
        <button
          onClick={onBack}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label="뒤로가기"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700" />
        </button>
      )}
      <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
    </header>
  );
}
