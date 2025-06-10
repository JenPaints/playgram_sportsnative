import React, { useRef } from 'react';

interface SpotlightCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const SpotlightCard: React.FC<SpotlightCardProps> = ({ children, className = '', onClick }) => {
  const cardRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
    const card = cardRef.current;
    if (!card) return;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty('--spotlight-x', `${x}px`);
    card.style.setProperty('--spotlight-y', `${y}px`);
  };

  return (
    <div
      ref={cardRef}
      className={`relative overflow-hidden rounded-2xl border border-gray-700 bg-gray-800 shadow-lg transition-all duration-300 hover:shadow-2xl ${className}`}
      style={{
        background: `radial-gradient(600px circle at var(--spotlight-x, 50%) var(--spotlight-y, 50%), rgba(59,130,246,0.15), transparent 80%)`,
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => {
        if (cardRef.current) {
          cardRef.current.style.removeProperty('--spotlight-x');
          cardRef.current.style.removeProperty('--spotlight-y');
        }
      }}
      onClick={onClick}
    >
      {children}
    </div>
  );
}; 