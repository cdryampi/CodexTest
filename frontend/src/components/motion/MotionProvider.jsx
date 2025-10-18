import { LazyMotion, MotionConfig, domAnimation } from 'framer-motion';

function MotionProvider({ children }) {
  return (
    <MotionConfig reducedMotion="user">
      <LazyMotion features={domAnimation}>{children}</LazyMotion>
    </MotionConfig>
  );
}

export default MotionProvider;
