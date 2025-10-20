import PropTypes from 'prop-types';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../../lib/utils.js';

function LoadingBar({ active, className }) {
  return (
    <AnimatePresence>
      {active ? (
        <motion.div
          key="loading-bar"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={cn('pointer-events-none', className)}
          aria-hidden="true"
        >
          <motion.div
            className="h-1 w-full overflow-hidden rounded-full bg-sky-500/20"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.span
              className="block h-full w-1/3 rounded-full bg-sky-500"
              initial={{ x: '-100%' }}
              animate={{ x: ['-100%', '100%'] }}
              transition={{ repeat: Infinity, repeatType: 'loop', duration: 1.2, ease: 'easeInOut' }}
            />
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}

LoadingBar.propTypes = {
  active: PropTypes.bool,
  className: PropTypes.string
};

LoadingBar.defaultProps = {
  active: false,
  className: 'absolute left-0 top-0 w-full px-6'
};

export default LoadingBar;
