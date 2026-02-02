import React, { useState, useEffect } from 'react';
import { Layout, LogIn, Plus, Zap } from 'lucide-react';
import api from './api';
import PostCard from './components/PostCard';
import Leaderboard from './components/Leaderboard';

function App() {
  const [posts, setPosts] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showLogin, setShowLogin] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);

  // Initial Check
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsLoggedIn(true);
      api.defaults.headers.common['Authorization'] = `Basic ${token}`;
      fetchFeed(); // Verify if token is still good or just fetch
    } else {
      fetchFeed();
    }
  }, []);

  const fetchFeed = async () => {
    try {
      const res = await api.get('feed/');
      setPosts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    if (isRegistering) {
      try {
        await api.post('register/', { username, password });
        setIsRegistering(false); // Move to login
        alert('Account created! Please login.');
      } catch (err) {
        alert('Registration failed. Username might be taken.');
      }
    } else {
      const token = btoa(`${username}:${password}`);
      api.defaults.headers.common['Authorization'] = `Basic ${token}`;
      try {
        await api.get('feed/');
        localStorage.setItem('token', token);
        setIsLoggedIn(true);
        setShowLogin(false);
        fetchFeed();
      } catch (error) {
        alert('Login failed. Check credentials.');
      }
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;

    try {
      await api.post('feed/', { content: newPostContent });
      setNewPostContent('');
      fetchFeed();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 selection:bg-pink-500/30">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur-lg border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-pink-500 to-violet-600 rounded-lg flex items-center justify-center text-white font-bold">
              <Zap size={20} className="fill-current" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
              Playto Community
            </h1>
          </div>

          <div>
            {isLoggedIn ? (
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-slate-400">@{username || 'User'}</span>
                <button
                  onClick={() => {
                    localStorage.removeItem('token');
                    setIsLoggedIn(false);
                    delete api.defaults.headers.common['Authorization'];
                    fetchFeed();
                  }}
                  className="text-sm hover:text-white"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={() => { setShowLogin(true); setIsRegistering(false); }}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800 hover:bg-slate-700 transition-colors text-sm font-medium"
              >
                <LogIn size={16} />
                Login
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Login/Register Modal Overlay */}
      {showLogin && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-800 border border-slate-700 p-8 rounded-2xl shadow-2xl w-full max-w-sm">
            <h3 className="text-2xl font-bold text-white mb-2">
              {isRegistering ? 'Join Playto' : 'Welcome Back'}
            </h3>
            <p className="text-slate-400 text-sm mb-6">
              {isRegistering ? 'Create your account to start sharing.' : 'Login to your account.'}
            </p>

            <form onSubmit={handleAuth} className="space-y-4">
              <input
                type="text"
                placeholder="Username"
                autoFocus
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 focus:ring-2 focus:ring-pink-500 outline-none text-white transition-all shadow-inner"
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
              <input
                type="password"
                placeholder="Password"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-4 py-3 focus:ring-2 focus:ring-pink-500 outline-none text-white transition-all shadow-inner"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
              <button
                type="submit"
                className="w-full py-3 rounded-lg bg-pink-500 hover:bg-pink-600 text-white font-bold transition-all transform active:scale-[0.98] shadow-lg shadow-pink-500/20"
              >
                {isRegistering ? 'Sign Up' : 'Log In'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-slate-700 space-y-4">
              <button
                type="button"
                onClick={() => setIsRegistering(!isRegistering)}
                className="w-full text-sm text-slate-400 hover:text-white transition-colors"
              >
                {isRegistering ? 'Already have an account? Login' : 'New here? Create an account'}
              </button>
              <button
                type="button"
                onClick={() => setShowLogin(false)}
                className="w-full text-xs text-slate-500 hover:text-slate-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <main className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Feed (8 cols) */}
        <div className="lg:col-span-8">
          {/* Create Post Widget */}
          {isLoggedIn && (
            <div className="mb-8 p-4 bg-slate-800/50 border border-slate-700 rounded-xl flex gap-4">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-sky-500 to-indigo-600 flex-shrink-0" />
              <form onSubmit={handleCreatePost} className="flex-1">
                <textarea
                  className="w-full bg-transparent border-none focus:ring-0 text-lg placeholder-slate-500 resize-none h-20"
                  placeholder="What's sparking joy today?"
                  value={newPostContent}
                  onChange={e => setNewPostContent(e.target.value)}
                />
                <div className="flex justify-end mt-2 pt-2 border-t border-slate-700/50">
                  <button type="submit" className="flex items-center gap-2 px-4 py-2 bg-pink-500 hover:bg-pink-600 text-white rounded-lg font-medium transition-transform active:scale-95">
                    <Plus size={18} />
                    Post
                  </button>
                </div>
              </form>
            </div>
          )}

          <div className="space-y-4">
            {posts.map(post => (
              <PostCard key={post.id} post={post} />
            ))}
          </div>
        </div>

        {/* Right: Sidebar (4 cols) */}
        <div className="lg:col-span-4 hidden lg:block">
          <Leaderboard />

          <div className="mt-6 p-5 rounded-xl border border-slate-800 bg-slate-900/50 text-center">
            <p className="text-xs text-slate-500">
              Playto Challenge Demo<br />
              Powered by Django & React
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;
