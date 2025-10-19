import { Routes, Route, Outlet } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import Navbar from './components/Navbar.jsx';
import Footer from './components/Footer.jsx';
import Home from './pages/Home.jsx';
import Post from './pages/Post.jsx';
import NotFound from './pages/NotFound.jsx';
import Timeline from './pages/Timeline.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Profile from './pages/Profile.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';
import DashboardLayout from './layouts/DashboardLayout.jsx';
import DashboardHome from './pages/dashboard/DashboardHome.jsx';
import DashboardPosts from './pages/dashboard/DashboardPosts.jsx';
import DashboardComments from './pages/dashboard/DashboardComments.jsx';
import DashboardSettings from './pages/dashboard/DashboardSettings.jsx';
import DashboardUsers from './pages/dashboard/DashboardUsers.jsx';
import { SITE_NAME, SITE_DESCRIPTION, DEFAULT_OG_IMAGE, DEFAULT_TWITTER_CARD } from './seo/config.js';
import { Toaster } from 'react-hot-toast';

const TITLE_TEMPLATE = `%s | ${SITE_NAME}`;

function SiteLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-100 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
      <Navbar />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-16 pt-10 sm:px-6 lg:px-8">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <>
      <Helmet defaultTitle={SITE_NAME} titleTemplate={TITLE_TEMPLATE} prioritizeSeoTags>
        <meta name="description" content={SITE_DESCRIPTION} />
        <meta property="og:site_name" content={SITE_NAME} />
        <meta property="og:description" content={SITE_DESCRIPTION} />
        <meta property="og:locale" content="es_ES" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content={DEFAULT_OG_IMAGE} />
        <meta name="twitter:card" content={DEFAULT_TWITTER_CARD} />
        <meta name="twitter:title" content={SITE_NAME} />
        <meta name="twitter:description" content={SITE_DESCRIPTION} />
        <meta name="twitter:image" content={DEFAULT_OG_IMAGE} />
      </Helmet>
      <Toaster position="top-right" toastOptions={{ duration: 3500 }} />
      <Routes>
        <Route element={<SiteLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/timeline" element={<Timeline />} />
          <Route path="/post/:slug" element={<Post />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/profile"
            element={(
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            )}
          />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route
          path="/dashboard/*"
          element={(
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          )}
        >
          <Route index element={<DashboardHome />} />
          <Route path="posts" element={<DashboardPosts />} />
          <Route path="comments" element={<DashboardComments />} />
          <Route path="users" element={<DashboardUsers />} />
          <Route path="settings" element={<DashboardSettings />} />
          <Route path="*" element={<DashboardHome />} />
        </Route>
      </Routes>
    </>
  );
}

export default App;
