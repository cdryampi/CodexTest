import { Routes, Route } from 'react-router-dom';
import NavBar from './components/NavBar.jsx';
import Home from './pages/Home.jsx';
import Post from './pages/Post.jsx';

function App() {
  return (
    <div className="min-h-screen bg-slate-100">
      <NavBar />
      <main className="mx-auto max-w-5xl px-4 pb-16 pt-8">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/post/:postId" element={<Post />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
