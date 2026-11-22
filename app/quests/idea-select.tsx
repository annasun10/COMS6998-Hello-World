"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

export default function IdeaSelect({ name, label, options, hint, icon, disabled = false, value: selectedValue, onValueChange, placeholder, getOptionLabel = option => option }: {
  name: string;
  label: string;
  options: readonly string[];
  hint: string;
  icon: string;
  disabled?: boolean;
  value?: string;
  placeholder?: string;
  getOptionLabel?: (option: string) => string;
  onValueChange?: (value: string) => void;
}) {
  const id = useId();
  const container = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const search = useRef({ text: "", time: 0 });
  const [internalValue, setValue] = useState(options[0]);
  const value = selectedValue ?? internalValue;
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(options.indexOf(value));
  const selectedIndex = options.indexOf(value);
  const expanded = open && !disabled;

  useEffect(() => {
    if (!expanded) return;
    function closeOutside(event: PointerEvent) {
      if (event.target instanceof Node && !container.current?.contains(event.target)) setOpen(false);
    }
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, [expanded]);

  function select(index: number) {
    if (options[index] === undefined) return;
    if (selectedValue === undefined) setValue(options[index]);
    onValueChange?.(options[index]);
    setActive(index);
    setOpen(false);
    trigger.current?.focus();
  }

  function onKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
    } else if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      const current = expanded ? active : selectedIndex;
      setActive(event.key === "Home" ? 0 : event.key === "End" ? options.length - 1 : current < 0 ? (event.key === "ArrowUp" ? options.length - 1 : 0) : (current + (event.key === "ArrowDown" ? 1 : -1) + options.length) % options.length);
      setOpen(true);
    } else if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      if (expanded) select(active);
      else { setActive(Math.max(0, selectedIndex)); setOpen(true); }
    } else if (event.key.length === 1 && !event.metaKey && !event.ctrlKey && !event.altKey) {
      event.preventDefault();
      const now = Date.now();
      const text = (now - search.current.time < 700 ? search.current.text : "") + event.key.toLowerCase();
      search.current = { text, time: now };
      const index = options.findIndex(option => getOptionLabel(option).toLowerCase().startsWith(text));
      if (index >= 0) { setActive(index); setOpen(true); }
    }
  }

  return <div ref={container} className="idea-select-label" onBlur={event => {
    if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
  }}>
    <label id={`${id}-label`} htmlFor={id}>{label}</label>
    <input type="hidden" name={name} value={value} disabled={disabled} />
    <div className="idea-select-wrap">
      <button ref={trigger} id={id} type="button" role="combobox" aria-haspopup="listbox"
        aria-expanded={expanded} aria-controls={`${id}-list`} aria-labelledby={`${id}-label ${id}-value`}
        aria-describedby={hint ? `${id}-hint` : undefined} aria-activedescendant={expanded ? `${id}-option-${active}` : undefined}
        disabled={disabled} className="field idea-select" onKeyDown={onKeyDown}
        onClick={() => { setActive(Math.max(0, selectedIndex)); setOpen(!expanded); }}>
        <span className="idea-select-icon" aria-hidden="true">{icon}</span>
        <span id={`${id}-value`} className={selectedIndex < 0 ? "idea-select-placeholder" : undefined}>
          {selectedIndex < 0 ? placeholder : getOptionLabel(value)}
        </span>
        <svg className="idea-select-chevron" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
      </button>
      {expanded && <ul id={`${id}-list`} role="listbox" aria-labelledby={`${id}-label`} className="idea-select-menu">
        {options.map((option, index) => <li key={option} id={`${id}-option-${index}`} role="option"
          aria-selected={option === value} className={`idea-select-option${index === active ? " is-active" : ""}`}
          onPointerMove={() => setActive(index)} onPointerDown={event => event.preventDefault()} onClick={() => select(index)}>
          <span>{getOptionLabel(option)}</span><span className="idea-select-check" aria-hidden="true">{option === value ? "✓" : ""}</span>
        </li>)}
      </ul>}
    </div>
    {hint && <span id={`${id}-hint`} className="idea-select-hint">{hint}</span>}
  </div>;
}
