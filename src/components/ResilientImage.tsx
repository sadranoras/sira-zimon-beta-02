import React, { useState } from 'react';
import { Microscope } from 'lucide-react';

interface ResilientImageProps {
  src: string;
  alt: string;
  className?: string;
  fallbackTitle?: string;
}

export const ResilientImage: React.FC<ResilientImageProps> = ({
  src,
  alt,
  className = 'w-full h-full object-cover',
  fallbackTitle,
}) => {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 to-emerald-50 dark:from-slate-800 dark:to-slate-900 text-slate-600 dark:text-slate-300 p-6 text-center ${className}`}
      >
        <Microscope className="w-8 h-8 text-emerald-700 dark:text-emerald-400 mb-2" />
        <span className="text-xs font-medium text-slate-700 dark:text-slate-200">{fallbackTitle || alt}</span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={className}
    />
  );
};
