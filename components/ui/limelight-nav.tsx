'use client';

import React, { useState, useRef, useLayoutEffect, cloneElement } from 'react';

// Adapted from the 21st.dev "LimelightNav" for Recast's Casting Studio tokens
// (molten highlight, ink/bone/line surfaces). Adds: visible labels, per-item
// `disabled`, and an optional controlled `activeIndex`.

export type NavItem = {
  id: string | number;
  icon: React.ReactElement;
  label?: string;
  disabled?: boolean;
  onClick?: () => void;
};

type LimelightNavProps = {
  items: NavItem[];
  defaultActiveIndex?: number;
  activeIndex?: number; // controlled
  onTabChange?: (index: number) => void;
  className?: string;
  limelightClassName?: string;
  itemClassName?: string;
  iconClassName?: string;
};

export const LimelightNav = ({
  items,
  defaultActiveIndex = 0,
  activeIndex: controlledIndex,
  onTabChange,
  className = '',
  limelightClassName = '',
  itemClassName = '',
  iconClassName = '',
}: LimelightNavProps) => {
  const [internalIndex, setInternalIndex] = useState(defaultActiveIndex);
  const activeIndex = controlledIndex ?? internalIndex;
  const [isReady, setIsReady] = useState(false);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const limelightRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    if (items.length === 0) return;
    const limelight = limelightRef.current;
    const activeItem = itemRefs.current[activeIndex];
    if (limelight && activeItem) {
      const newLeft = activeItem.offsetLeft + activeItem.offsetWidth / 2 - limelight.offsetWidth / 2;
      limelight.style.left = `${newLeft}px`;
      if (!isReady) setTimeout(() => setIsReady(true), 50);
    }
  }, [activeIndex, isReady, items]);

  if (items.length === 0) return null;

  const handleClick = (index: number, item: NavItem) => {
    if (item.disabled) return;
    if (controlledIndex === undefined) setInternalIndex(index);
    onTabChange?.(index);
    item.onClick?.();
  };

  return (
    <nav
      className={`relative inline-flex items-stretch h-11 border border-line bg-ink-soft px-1 ${className}`}
    >
      {items.map((item, index) => {
        const { id, icon, label, disabled } = item;
        const active = activeIndex === index;
        return (
          <button
            type="button"
            key={id}
            ref={(el) => {
              itemRefs.current[index] = el;
            }}
            onClick={() => handleClick(index, item)}
            disabled={disabled}
            aria-label={label}
            aria-current={active ? 'page' : undefined}
            className={`relative z-20 flex h-full items-center gap-2 px-3.5 font-mono text-[10px] uppercase tracking-[0.12em] transition-colors ${
              disabled
                ? 'text-steel/30 cursor-not-allowed'
                : active
                ? 'text-bone'
                : 'text-steel hover:text-bone'
            } ${itemClassName}`}
          >
            {cloneElement(icon as React.ReactElement<{ className?: string }>, {
              className: `w-[15px] h-[15px] shrink-0 transition-opacity duration-150 ${
                active ? 'opacity-100' : 'opacity-50'
              } ${(icon.props as { className?: string }).className || ''} ${iconClassName}`,
            })}
            {label && <span className="hidden sm:inline">{label}</span>}
          </button>
        );
      })}

      {/* limelight bar + downward cone */}
      <div
        ref={limelightRef}
        className={`absolute top-0 z-10 w-10 h-[2px] bg-molten ${
          isReady ? 'transition-[left] duration-300 ease-out' : ''
        } ${limelightClassName}`}
        style={{ left: '-999px', boxShadow: '0 14px 26px -6px rgba(255,74,28,0.55)' }}
      >
        <div className="absolute left-[-40%] top-[2px] w-[180%] h-10 [clip-path:polygon(8%_100%,28%_0,72%_0,92%_100%)] bg-gradient-to-b from-molten/25 to-transparent pointer-events-none" />
      </div>
    </nav>
  );
};

export default LimelightNav;
