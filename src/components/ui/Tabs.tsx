"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

// Tabs Context
interface TabsContextValue {
  activeTab: string;
  setActiveTab: (value: string) => void;
}

const TabsContext = createContext<TabsContextValue | null>(null);

function useTabsContext() {
  const context = useContext(TabsContext);
  if (!context) {
    throw new Error("Tabs components must be used within a Tabs provider");
  }
  return context;
}

// Tabs Root
interface TabsProps {
  defaultValue: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: ReactNode;
  className?: string;
}

export function Tabs({
  defaultValue,
  value,
  onValueChange,
  children,
  className = "",
}: TabsProps) {
  const [internalValue, setInternalValue] = useState(defaultValue);

  const activeTab = value ?? internalValue;
  const setActiveTab = (newValue: string) => {
    setInternalValue(newValue);
    onValueChange?.(newValue);
  };

  return (
    <TabsContext.Provider value={{ activeTab, setActiveTab }}>
      <div className={className}>{children}</div>
    </TabsContext.Provider>
  );
}

// TabsList
interface TabsListProps {
  children: ReactNode;
  className?: string;
}

export function TabsList({ children, className = "" }: TabsListProps) {
  return (
    <div
      role="tablist"
      className={`
        inline-flex items-center gap-1 p-1
        bg-surface-2 rounded-lg
        ${className}
      `}
    >
      {children}
    </div>
  );
}

// TabsTrigger
interface TabsTriggerProps {
  value: string;
  children: ReactNode;
  className?: string;
  disabled?: boolean;
}

export function TabsTrigger({
  value,
  children,
  className = "",
  disabled = false,
}: TabsTriggerProps) {
  const { activeTab, setActiveTab } = useTabsContext();
  const isActive = activeTab === value;

  return (
    <button
      type="button"
      role="tab"
      aria-selected={isActive}
      disabled={disabled}
      onClick={() => setActiveTab(value)}
      className={`
        px-3 py-1.5 text-sm font-medium rounded-md
        transition-colors cursor-pointer
        focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
        disabled:opacity-50 disabled:pointer-events-none disabled:cursor-not-allowed
        ${isActive
          ? "bg-surface text-foreground shadow-sm"
          : "text-muted hover:text-foreground"
        }
        ${className}
      `}
    >
      {children}
    </button>
  );
}

// TabsContent
interface TabsContentProps {
  value: string;
  children: ReactNode;
  className?: string;
}

export function TabsContent({ value, children, className = "" }: TabsContentProps) {
  const { activeTab } = useTabsContext();

  if (activeTab !== value) {
    return null;
  }

  return (
    <div role="tabpanel" className={className}>
      {children}
    </div>
  );
}

// Segmented Control (simplified variant)
interface SegmentedControlProps {
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  className?: string;
  size?: "sm" | "md";
}

export function SegmentedControl({
  value,
  onChange,
  options,
  className = "",
  size = "md",
}: SegmentedControlProps) {
  const sizeClasses = {
    sm: "px-2.5 py-1 text-xs",
    md: "px-3 py-1.5 text-sm",
  };

  return (
    <div
      role="radiogroup"
      className={`
        inline-flex items-center gap-1 p-1
        bg-surface-2 rounded-lg
        ${className}
      `}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          role="radio"
          aria-checked={value === option.value}
          onClick={() => onChange(option.value)}
          className={`
            ${sizeClasses[size]} font-medium rounded-md
            transition-colors cursor-pointer
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
            ${value === option.value
              ? "bg-surface text-foreground shadow-sm"
              : "text-muted hover:text-foreground"
            }
          `}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
