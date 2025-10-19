import { Routes, Route } from 'react-router-dom';
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
import Dashboard from './pages/dashboard/Dashboard.jsx';
import PostsList from './pages/dashboard/PostsList.jsx';
import PostForm from './pages/dashboard/PostForm.jsx';
import CategoriesList from './pages/dashboard/CategoriesList.jsx';
import CategoryForm from './pages/dashboard/CategoryForm.jsx';
import TagsList from './pages/dashboard/TagsList.jsx';
import TagForm from './pages/dashboard/TagForm.jsx';
import {
  SITE_NAME,
  SITE_DESCRIPTION,
  DEFAULT_OG_IMAGE,
  DEFAULT_TWITTER_CARD
} from './seo/config.js';
import { Toaster } from 'react-hot-toast';

const TITLE_TEMPLATE = `%s | ${SITE_NAME}`;

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
      <div className="flex min-h-screen flex-col bg-slate-100 text-slate-900 transition-colors duration-300 dark:bg-slate-950 dark:text-slate-100">
        <Navbar />
        <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col px-4 pb-16 pt-10 sm:px-6 lg:px-8">
          <Routes>
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
            <Route
              path="/dashboard"
              element={(
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              )}
            />
            <Route
              path="/dashboard/posts"
              element={(
                <ProtectedRoute>
                  <PostsList />
                </ProtectedRoute>
              )}
            />
            <Route
              path="/dashboard/posts/new"
              element={(
                <ProtectedRoute>
                  <PostForm />
                </ProtectedRoute>
              )}
            />
            <Route
              path="/dashboard/posts/:slug/edit"
              element={(
                <ProtectedRoute>
                  <PostForm />
                </ProtectedRoute>
              )}
            />
            <Route
              path="/dashboard/categories"
              element={(
                <ProtectedRoute>
                  <CategoriesList />
                </ProtectedRoute>
              )}
            />
            <Route
              path="/dashboard/categories/new"
              element={(
                <ProtectedRoute>
                  <CategoryForm />
                </ProtectedRoute>
              )}
            />
            <Route
              path="/dashboard/categories/:id/edit"
              element={(
                <ProtectedRoute>
                  <CategoryForm />
                </ProtectedRoute>
              )}
            />
            <Route
              path="/dashboard/tags"
              element={(
                <ProtectedRoute>
                  <TagsList />
                </ProtectedRoute>
              )}
            />
            <Route
              path="/dashboard/tags/new"
              element={(
                <ProtectedRoute>
                  <TagForm />
                </ProtectedRoute>
              )}
            />
            <Route
              path="/dashboard/tags/:id/edit"
              element={(
                <ProtectedRoute>
                  <TagForm />
                </ProtectedRoute>
              )}
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </>
  );
}

export default App;
