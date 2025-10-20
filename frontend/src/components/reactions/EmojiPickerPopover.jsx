import { useCallback, useMemo, useState } from 'react';
import * as Popover from '@radix-ui/react-popover';
import EmojiPicker from 'emoji-picker-react';
import { SmilePlus } from 'lucide-react';
import PropTypes from 'prop-types';
import { cn } from '../../lib/utils.js';

const EMOJI_TO_TYPE = {
  '👍': 'like',
  '❤️': 'love',
  '👏': 'clap',
  '⚡': 'wow',
  '😄': 'laugh',
  '💡': 'insight'
};

function EmojiPickerPopover({ disabled = false, onSelect }) {
  const [open, setOpen] = useState(false);

  const handleEmojiClick = useCallback(
    (emojiData) => {
      if (!emojiData) {
        return;
      }
      const nextType = EMOJI_TO_TYPE[emojiData.emoji];
      if (!nextType) {
        return;
      }
      if (typeof onSelect === 'function') {
        onSelect(nextType);
      }
      setOpen(false);
    },
    [onSelect]
  );

  const theme = useMemo(() => {
    if (typeof window === 'undefined') {
      return 'light';
    }
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  }, []);

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <button
          type="button"
          className={cn(
            'inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-sky-400 hover:text-sky-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 focus-visible:ring-offset-2 focus-visible:ring-offset-white',
            'dark:border-slate-800 dark:bg-slate-900/70 dark:text-slate-300 dark:hover:border-sky-500 dark:hover:text-sky-300 dark:focus-visible:ring-sky-400 dark:focus-visible:ring-offset-slate-900',
            disabled && 'cursor-not-allowed opacity-60'
          )}
          aria-haspopup="dialog"
          aria-expanded={open}
          aria-label="Abrir selector de emojis"
          disabled={disabled}
        >
          <SmilePlus className="h-4 w-4" aria-hidden="true" />
          <span className="hidden sm:inline">Más reacciones</span>
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          sideOffset={12}
          align="end"
          className="z-50 rounded-2xl border border-slate-200 bg-white p-2 shadow-2xl shadow-slate-900/20 dark:border-slate-800 dark:bg-slate-900"
        >
          <EmojiPicker
            onEmojiClick={handleEmojiClick}
            searchDisabled
            previewConfig={{ showPreview: false }}
            skinTonesDisabled
            lazyLoadEmojis
            theme={theme}
            autoFocusSearch={false}
          />
          <Popover.Arrow className="fill-white dark:fill-slate-900" />
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}

EmojiPickerPopover.propTypes = {
  disabled: PropTypes.bool,
  onSelect: PropTypes.func
};

export default EmojiPickerPopover;
