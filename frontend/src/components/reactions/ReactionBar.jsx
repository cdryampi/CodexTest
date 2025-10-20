import { useCallback, useEffect, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext.jsx';
import { getPostReactions, togglePostReaction } from '../../services/api.js';
import ReactionButton from './ReactionButton.jsx';
import EmojiPickerPopover from './EmojiPickerPopover.jsx';
import launchConfetti from './ConfettiBurst.js';
import { cn } from '../../lib/utils.js';

const REACTIONS = [
  { type: 'like', label: 'Me gusta', emoji: '👍' },
  { type: 'love', label: 'Me encanta', emoji: '❤️' },
  { type: 'clap', label: 'Aplausos', emoji: '👏' },
  { type: 'wow', label: 'Me sorprende', emoji: '⚡' },
  { type: 'laugh', label: 'Me divierte', emoji: '😄' },
  { type: 'insight', label: 'Me inspira', emoji: '💡' }
];

const EMPTY_SUMMARY = {
  counts: REACTIONS.reduce((acc, reaction) => ({ ...acc, [reaction.type]: 0 }), {}),
  total: 0,
  my_reaction: null
};

const CELEBRATION_PREFIX = 'post:reactions:celebrated:';
const isBrowser = typeof window !== 'undefined';

const readCelebrationFlag = (key) => {
  if (!key || !isBrowser) {
    return false;
  }
  try {
    return window.localStorage.getItem(key) === '1';
  } catch (error) {
    return false;
  }
};

const writeCelebrationFlag = (key) => {
  if (!key || !isBrowser) {
    return;
  }
  try {
    window.localStorage.setItem(key, '1');
  } catch (error) {
    // Silently ignore storage errors (private mode, etc.)
  }
};

const buildOptimisticSummary = (summary, nextType) => {
  const current = summary ?? EMPTY_SUMMARY;
  const counts = { ...current.counts };
  const previousType = current.my_reaction;
  let total = current.total ?? 0;
  let myReaction = previousType;

  if (previousType === nextType) {
    counts[nextType] = Math.max(0, (counts[nextType] ?? 0) - 1);
    total = Math.max(0, total - 1);
    myReaction = null;
  } else {
    if (previousType) {
      counts[previousType] = Math.max(0, (counts[previousType] ?? 0) - 1);
    }
    counts[nextType] = (counts[nextType] ?? 0) + 1;
    if (!previousType) {
      total += 1;
    }
    myReaction = nextType;
  }

  return {
    counts,
    total: Math.max(0, total),
    my_reaction: myReaction
  };
};

function ReactionBar({ slug, className }) {
  const celebrationKey = useMemo(() => (slug ? `${CELEBRATION_PREFIX}${slug}` : null), [slug]);
  const { isAuthenticated } = useAuth();
  const [summary, setSummary] = useState(EMPTY_SUMMARY);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasCelebrated, setHasCelebrated] = useState(() => readCelebrationFlag(celebrationKey));

  useEffect(() => {
    setHasCelebrated(readCelebrationFlag(celebrationKey));
  }, [celebrationKey]);

  useEffect(() => {
    if (!slug) {
      setSummary(EMPTY_SUMMARY);
      setIsLoading(false);
      return undefined;
    }

    const controller = new AbortController();
    let active = true;

    const fetchSummary = async () => {
      setIsLoading(true);
      try {
        const data = await getPostReactions(slug, { signal: controller.signal });
        if (!active) {
          return;
        }
        setSummary({
          counts: { ...EMPTY_SUMMARY.counts, ...data.counts },
          total: data.total ?? 0,
          my_reaction: data.my_reaction ?? null
        });
        if (!hasCelebrated && data.my_reaction) {
          setHasCelebrated(true);
          writeCelebrationFlag(celebrationKey);
        }
      } catch (error) {
        if (error.name === 'CanceledError' || error.name === 'AbortError' || error.code === 'ERR_CANCELED') {
          return;
        }
        toast.error(error.message ?? 'No fue posible cargar las reacciones.');
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    fetchSummary();
    return () => {
      active = false;
      controller.abort();
    };
  }, [celebrationKey, hasCelebrated, slug]);

  const handleToggle = useCallback(
    async (type) => {
      if (!slug) {
        return;
      }
      if (!isAuthenticated) {
        toast.info('Inicia sesión para dejar tu reacción.');
        return;
      }
      if (isSubmitting) {
        return;
      }

      setIsSubmitting(true);
      const previous = {
        counts: { ...summary.counts },
        total: summary.total,
        my_reaction: summary.my_reaction
      };
      setSummary(buildOptimisticSummary(summary, type));

      try {
        const payload = await togglePostReaction(slug, type);
        setSummary({
          counts: { ...EMPTY_SUMMARY.counts, ...payload.counts },
          total: payload.total ?? 0,
          my_reaction: payload.my_reaction ?? null
        });
        if (!hasCelebrated && !previous.my_reaction && payload.my_reaction) {
          launchConfetti();
          setHasCelebrated(true);
          writeCelebrationFlag(celebrationKey);
        }
      } catch (error) {
        setSummary(previous);
        toast.error(error.message ?? 'No pudimos registrar tu reacción.');
      } finally {
        setIsSubmitting(false);
      }
    },
    [celebrationKey, hasCelebrated, isAuthenticated, isSubmitting, slug, summary]
  );

  const reactionLabel = useMemo(() => {
    const lookup = REACTIONS.reduce((acc, reaction) => {
      acc[reaction.type] = reaction.label;
      return acc;
    }, {});
    if (!summary.my_reaction) {
      return 'Elige una reacción y cuéntanos qué te pareció.';
    }
    return `Tu reacción: ${lookup[summary.my_reaction] ?? summary.my_reaction}`;
  }, [summary.my_reaction]);

  return (
    <section
      className={cn(
        'rounded-3xl border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/70',
        className
      )}
      aria-label="Reacciones de la publicación"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3 text-sm font-medium text-slate-600 dark:text-slate-300">
          <Sparkles className="h-5 w-5 text-sky-500" aria-hidden="true" />
          <span>{`Reacciones totales: ${summary.total}`}</span>
          {isLoading ? <Loader2 className="h-4 w-4 animate-spin text-slate-400" aria-hidden="true" /> : null}
        </div>
        <EmojiPickerPopover
          disabled={!isAuthenticated || isSubmitting || isLoading}
          onSelect={handleToggle}
        />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3" role="group" aria-label="Tipos de reacción disponibles">
        {REACTIONS.map((reaction) => (
          <ReactionButton
            key={reaction.type}
            type={reaction.type}
            label={reaction.label}
            emoji={reaction.emoji}
            count={summary.counts?.[reaction.type] ?? 0}
            active={summary.my_reaction === reaction.type}
            disabled={isSubmitting}
            onToggle={handleToggle}
          />
        ))}
      </div>
      <p className="mt-4 text-sm text-slate-500 dark:text-slate-400">
        {isAuthenticated ? reactionLabel : 'Inicia sesión para reaccionar y guardar tu voto.'}
      </p>
    </section>
  );
}

ReactionBar.propTypes = {
  slug: PropTypes.string,
  className: PropTypes.string
};

export default ReactionBar;
