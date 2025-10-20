import { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet-async';
import { toast } from 'sonner';
import Hero from '../components/landing/Hero.jsx';
import FeatureGrid from '../components/landing/FeatureGrid.jsx';
import LatestPosts from '../components/landing/LatestPosts.jsx';
import CTA from '../components/landing/CTA.jsx';
import NewsletterForm from '../components/landing/NewsletterForm.jsx';
import { listLatestPosts } from '../services/api.js';
import { buildPageTitle, sanitizeMetaText, SITE_DESCRIPTION } from '../seo/config.js';

const PAGE_TITLE = 'Inicio';
const PAGE_DESCRIPTION =
  'Descubre recursos, tutoriales y patrones de diseño para crear experiencias modernas con React, Tailwind, Flowbite y Radix.';
const LATEST_POSTS_LIMIT = 6;
const MIN_LOADING_DURATION = 260;

function Landing() {
  const [latestPostsState, setLatestPostsState] = useState({
    posts: [],
    loading: true,
    error: null
  });

  useEffect(() => {
    let isMounted = true;
    let timeoutId;

    const loadLatestPosts = async () => {
      const startTime =
        typeof performance !== 'undefined' && typeof performance.now === 'function'
          ? performance.now()
          : Date.now();

      setLatestPostsState((previous) => ({ ...previous, loading: true, error: null }));

      const ensureMinimumDelay = (callback) => {
        const now =
          typeof performance !== 'undefined' && typeof performance.now === 'function'
            ? performance.now()
            : Date.now();
        const elapsed = now - startTime;
        const remaining = MIN_LOADING_DURATION - elapsed;

        if (remaining > 0) {
          timeoutId = setTimeout(callback, remaining);
        } else {
          callback();
        }
      };

      try {
        const results = await listLatestPosts({ limit: LATEST_POSTS_LIMIT });

        ensureMinimumDelay(() => {
          if (!isMounted) {
            return;
          }
          setLatestPostsState({
            posts: Array.isArray(results) ? results : [],
            loading: false,
            error: null
          });
        });
      } catch (error) {
        ensureMinimumDelay(() => {
          if (!isMounted) {
            return;
          }
          setLatestPostsState({ posts: [], loading: false, error: error ?? new Error('Unknown error') });
          toast.error('No pudimos cargar las publicaciones recientes. Intenta de nuevo en unos segundos.');
          if (import.meta.env?.DEV) {
            console.error('Fallo al obtener posts recientes para la landing.', error);
          }
        });
      }
    };

    loadLatestPosts();

    return () => {
      isMounted = false;
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, []);

  return (
    <>
      <Helmet>
        <title>{buildPageTitle(PAGE_TITLE)}</title>
        <meta name="description" content={sanitizeMetaText(PAGE_DESCRIPTION)} />
        <meta property="og:title" content={buildPageTitle(PAGE_TITLE)} />
        <meta property="og:description" content={sanitizeMetaText(PAGE_DESCRIPTION || SITE_DESCRIPTION)} />
        <meta name="twitter:title" content={buildPageTitle(PAGE_TITLE)} />
        <meta name="twitter:description" content={sanitizeMetaText(PAGE_DESCRIPTION || SITE_DESCRIPTION)} />
      </Helmet>
      <div className="flex flex-col gap-24 pb-24">
        <Hero />
        <FeatureGrid />
        <LatestPosts
          limit={LATEST_POSTS_LIMIT}
          loading={latestPostsState.loading}
          posts={latestPostsState.posts}
        />
        <NewsletterForm />
        <CTA />
      </div>
    </>
  );
}

export default Landing;
