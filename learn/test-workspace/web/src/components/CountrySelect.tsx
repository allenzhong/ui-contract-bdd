// Custom combobox replacing a native <select>. The listbox is portaled to
// <body>, so it is NOT inside the trigger's DOM subtree — a classic reason
// static locators derived from the closed state fail.
import { useEffect, useId, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { Country } from '@/api/seed';

interface Props {
  label: string;
  testId: string;
  countries: Country[];
  value: string;
  onChange: (code: string) => void;
}

export function CountrySelect({ label, testId, countries, value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const labelId = useId();
  const listboxId = useId();
  const selected = countries.find((c) => c.code === value);

  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest(`#${CSS.escape(listboxId)}`) && target !== triggerRef.current) setOpen(false);
    };
    document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open, listboxId]);

  const rect = open ? triggerRef.current?.getBoundingClientRect() : undefined;

  return (
    <div className="field">
      <span id={labelId} className="label">
        {label}
      </span>
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-labelledby={labelId}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        data-testid={testId}
        className="combobox"
        onClick={() => setOpen((o) => !o)}
      >
        {selected?.name ?? 'Select…'}
      </button>
      {open &&
        createPortal(
          <ul
            id={listboxId}
            role="listbox"
            aria-labelledby={labelId}
            data-testid={`${testId}-listbox`}
            className="listbox"
            style={rect ? { top: rect.bottom + window.scrollY, left: rect.left, width: rect.width } : undefined}
          >
            {countries.map((c) => (
              <li
                key={c.code}
                role="option"
                aria-selected={c.code === value}
                data-testid={`${testId}-option`}
                data-key={c.code}
                onClick={() => {
                  onChange(c.code);
                  setOpen(false);
                }}
              >
                {c.name}
              </li>
            ))}
          </ul>,
          document.body,
        )}
    </div>
  );
}
