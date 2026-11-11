"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";
import { ChevronDown, Search, X, Check } from "lucide-react";

export interface SelectOption {
  value: string | number;
  label: string;
  subLabel?: string;
  disabled?: boolean;
}

export interface SearchableSelectProps {
  options: (SelectOption | string | number)[];
  value: string | number | undefined | null;
  onChange: (value: any) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  required?: boolean;
  searchThreshold?: number; // default: 10
  className?: string;
  buttonClassName?: string;
  dropdownClassName?: string;
  emptyMessage?: string;
  id?: string;
  name?: string;
}

export function SearchableSelect({
  options = [],
  value,
  onChange,
  placeholder = "Select an option...",
  searchPlaceholder = "Search...",
  disabled = false,
  required = false,
  searchThreshold = 10,
  className = "",
  buttonClassName = "",
  dropdownClassName = "",
  emptyMessage = "No options found",
  id,
  name,
}: SearchableSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Normalize options into standardized SelectOption array
  const normalizedOptions: SelectOption[] = useMemo(() => {
    return options.map((opt) => {
      if (typeof opt === "object" && opt !== null && "value" in opt) {
        return opt as SelectOption;
      }
      return {
        value: opt as string | number,
        label: String(opt),
      };
    });
  }, [options]);

  // Current selected option
  const selectedOption = useMemo(() => {
    if (value === undefined || value === null || value === "") return null;
    return normalizedOptions.find((opt) => String(opt.value) === String(value)) || null;
  }, [normalizedOptions, value]);

  // Determine if search input should be visible (> 10 items)
  const isSearchable = normalizedOptions.length > searchThreshold;

  // Filtered options based on search query
  const filteredOptions = useMemo(() => {
    if (!isSearchable || !searchQuery.trim()) {
      return normalizedOptions;
    }
    const q = searchQuery.toLowerCase().trim();
    return normalizedOptions.filter((opt) => {
      const matchLabel = opt.label.toLowerCase().includes(q);
      const matchSub = opt.subLabel ? opt.subLabel.toLowerCase().includes(q) : false;
      const matchVal = String(opt.value).toLowerCase().includes(q);
      return matchLabel || matchSub || matchVal;
    });
  }, [normalizedOptions, searchQuery, isSearchable]);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && isSearchable) {
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 50);
    } else if (!isOpen) {
      setSearchQuery("");
    }
  }, [isOpen, isSearchable]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape" && isOpen) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleKeyDown);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  const handleSelect = (opt: SelectOption) => {
    if (opt.disabled) return;
    onChange(opt.value);
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className={`relative w-full text-xs ${className}`}>
      {/* Hidden input for form serialization if name is provided */}
      {name && <input type="hidden" name={name} value={value ?? ""} required={required} />}

      {/* Trigger Button */}
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => !disabled && setIsOpen((prev) => !prev)}
        className={`w-full flex items-center justify-between px-3 py-2 text-left bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-800 transition-all focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 ${
          disabled ? "bg-slate-50 text-slate-400 cursor-not-allowed border-slate-200" : "hover:border-slate-300 cursor-pointer"
        } ${buttonClassName}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="truncate pr-2">
          {selectedOption ? (
            <span className="flex items-center gap-2">
              <span className="truncate">{selectedOption.label}</span>
              {selectedOption.subLabel && (
                <span className="text-[11px] text-slate-400 truncate">({selectedOption.subLabel})</span>
              )}
            </span>
          ) : (
            <span className="text-slate-400 font-normal">{placeholder}</span>
          )}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180 text-blue-600" : ""
          }`}
        />
      </button>

      {/* Dropdown Popover */}
      {isOpen && (
        <div
          className={`absolute z-50 mt-1 w-full min-w-[200px] bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100 ${dropdownClassName}`}
          role="listbox"
        >
          {/* Search Box (Displayed automatically if items > 10) */}
          {isSearchable && (
            <div className="p-2 border-b border-slate-100 bg-slate-50/70">
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 absolute left-2.5 text-slate-400 pointer-events-none" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={searchPlaceholder}
                  className="w-full pl-8 pr-7 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-2 p-0.5 text-slate-400 hover:text-slate-600 rounded-md"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto divide-y divide-slate-50 py-1">
            {filteredOptions.length === 0 ? (
              <div className="py-6 px-4 text-center text-xs text-slate-400 font-normal">
                {emptyMessage}
              </div>
            ) : (
              filteredOptions.map((opt) => {
                const isSelected = String(opt.value) === String(value);
                return (
                  <div
                    key={String(opt.value)}
                    role="option"
                    aria-selected={isSelected}
                    onClick={() => handleSelect(opt)}
                    className={`px-3 py-2 cursor-pointer flex items-center justify-between text-xs transition-colors ${
                      opt.disabled
                        ? "opacity-40 cursor-not-allowed bg-slate-50 text-slate-400"
                        : isSelected
                        ? "bg-blue-50/80 text-blue-700 font-semibold"
                        : "text-slate-700 hover:bg-slate-50 hover:text-slate-900"
                    }`}
                  >
                    <div className="flex flex-col min-w-0 pr-2">
                      <span className="truncate">{opt.label}</span>
                      {opt.subLabel && (
                        <span className="text-[10px] text-slate-400 truncate mt-0.5">
                          {opt.subLabel}
                        </span>
                      )}
                    </div>
                    {isSelected && <Check className="w-3.5 h-3.5 text-blue-600 shrink-0" />}
                  </div>
                );
              })
            )}
          </div>

          {/* Optional Count Footer when items are many */}
          {isSearchable && (
            <div className="px-3 py-1.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
              <span>Showing {filteredOptions.length} of {normalizedOptions.length} options</span>
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="text-blue-600 hover:underline"
                >
                  Clear filter
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

