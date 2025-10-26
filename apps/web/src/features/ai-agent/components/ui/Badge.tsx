import React from 'react';

interface BadgeProps {
  ok: boolean;
  children: React.ReactNode;
}

export function Badge({ ok, children }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
        ok
          ? "bg-green-100 text-green-800"
          : "bg-red-100 text-red-800"
      }`}
    >
      {children}
    </span>
  );
}
