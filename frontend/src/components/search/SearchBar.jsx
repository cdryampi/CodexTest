import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from 'react';
import { MagnifyingGlassIcon, XMarkIcon } from '@heroicons/react/24/outline';

const SearchBar = forwardRef(
  (
    {
      value = '',
      onChange,
      onDebouncedChange,
      onClear,
      placeholder = 'Buscar publicaciones…',
      label = 'Buscar en el blog',
      debounceDelay = 300,
      autoFocus = false,
      name = 'search',
      id = 'blog-search'
    },
    ref
  ) => {
    const inputRef = useRef(null);
    const [internalValue, setInternalValue] = useState(value ?? '');

    useImperativeHandle(ref, () => inputRef.current);

    useEffect(() => {
      setInternalValue(value ?? '');
    }, [value]);

    useEffect(() => {
      if (typeof onDebouncedChange !== 'function') {
        return;
      }

      const handler = window.setTimeout(() => {
        onDebouncedChange(internalValue ?? '');
      }, debounceDelay);

      return () => {
        window.clearTimeout(handler);
      };
    }, [internalValue, debounceDelay, onDebouncedChange]);

    useEffect(() => {
      if (!autoFocus) {
        return;
      }

      window.requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }, [autoFocus]);

    const emitChange = (nextValue) => {
      setInternalValue(nextValue);
      onChange?.(nextValue);
    };

    const handleChange = (event) => {
      emitChange(event.target.value);
    };

    const handleClear = () => {
      emitChange('');
      onDebouncedChange?.('');
      onClear?.();
      inputRef.current?.focus();
    };

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        handleClear();
      } else if (event.key === 'Enter') {
        onDebouncedChange?.(internalValue ?? '');
      }
    };

    return (
      <div className="w-full" role="search" aria-label={label}>
        <label htmlFor={id} className="sr-only">
          {label}
        </label>
        <div className="relative">
          <MagnifyingGlassIcon
            className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
            aria-hidden="true"
          />
          <input
            ref={inputRef}
            id={id}
            name={name}
            type="search"
            value={internalValue}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            autoComplete="off"
            enterKeyHint="search"
            className="w-full rounded-2xl border border-slate-200 bg-white/90 py-3 pl-11 pr-12 text-base text-slate-700 shadow-sm motion-safe:transition-shadow motion-safe:duration-300 placeholder:text-slate-400 focus-visible:ring focus-visible:ring-sky-500 focus-visible:ring-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-sky-500 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:placeholder:text-slate-500 dark:focus-visible:outline-sky-300 dark:focus-visible:ring-offset-slate-900"
          />
          {internalValue ? (
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full text-slate-400 motion-safe:transition-colors motion-safe:duration-200 hover:bg-slate-100 hover:text-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-500 dark:text-slate-500 dark:hover:bg-slate-800 dark:hover:text-slate-300 dark:focus-visible:outline-sky-300"
              aria-label="Limpiar búsqueda"
            >
              <XMarkIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          ) : null}
        </div>
      </div>
    );
  }
);

SearchBar.displayName = 'SearchBar';

export default SearchBar;
