import { Helmet } from 'react-helmet-async';
import Hero from '../components/landing/Hero.jsx';
import FeatureGrid from '../components/landing/FeatureGrid.jsx';
import LatestPosts from '../components/landing/LatestPosts.jsx';
import CTA from '../components/landing/CTA.jsx';
import NewsletterForm from '../components/landing/NewsletterForm.jsx';
import { buildPageTitle, sanitizeMetaText, SITE_DESCRIPTION } from '../seo/config.js';

const PAGE_TITLE = 'Inicio';
const PAGE_DESCRIPTION =
  'Descubre recursos, tutoriales y patrones de diseño para crear experiencias modernas con React, Tailwind, Flowbite y Radix.';

function Landing() {
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
        <LatestPosts limit={6} />
        <NewsletterForm />
        <CTA />
      </div>
    </>
  );
}

export default Landing;
