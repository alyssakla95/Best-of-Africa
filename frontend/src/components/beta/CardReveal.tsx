import React from 'react';

export const CardReveal = ({ children, className = "" }: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) => <div className={className}>{children}</div>;
