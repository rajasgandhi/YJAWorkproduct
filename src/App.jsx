import React from 'react';

// --- Utility functions (now testable) ---
function safeUrl(url) {
  try {
    const u = new URL(url);
    if (!['http:', 'https:'].includes(u.protocol)) return '#';
    return u.toString();
  } catch {
    return '#';
  }
}

function uid() {
  return 'p_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function validatePostInput({ title, link, description }) {
  const errs = [];
  if (!title || !title.trim()) errs.push('Title is required');
  if (!link || !link.trim()) errs.push('Link is required');
  if (link && !/^https?:\/\//i.test(link)) errs.push('Link must start with http(s)://');
  if (description && description.length > 500) errs.push('Description must be ≤ 500 chars');
  return errs;
}

function filterPosts(posts, query) {
  const q = (query || '').trim().toLowerCase();
  if (!q) return posts;
  return posts.filter((p) =>
    [p.title, p.description, p.source, p.link].some((f) => (f || '').toLowerCase().includes(q))
  );
}

// --- App ---
export default function App() {
  return <MiniCRM />;
}

function MiniCRM() {
  const [view, setView] = React.useState('feed'); // 'feed' | 'admin'
  const [posts, setPosts] = React.useState(() => {
    const raw = localStorage.getItem('yja_posts_v1');
    if (raw) {
      try {
        return JSON.parse(raw);
      } catch {}
    }
    // Seed with a few example posts (you can delete these)
    return [
      {
        id: uid(),
        title: 'YJA Pathshala Spotlight',
        link: 'https://www.yja.org/education',
        description: 'Learn about recent educational initiatives across regions.',
        image: '',
        source: 'education',
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 3,
      },
      {
        id: uid(),
        title: 'Community Service Recap',
        link: 'https://www.yja.org/community',
        description: 'Highlights from the latest community drives and meetups.',
        image: '',
        source: 'community',
        createdAt: Date.now() - 1000 * 60 * 60 * 24 * 7,
      },
    ];
  });

  React.useEffect(() => {
    localStorage.setItem('yja_posts_v1', JSON.stringify(posts));
  }, [posts]);

  function handleCreate(post) {
    setPosts((p) => [{ ...post, id: uid(), createdAt: Date.now() }, ...p]);
    setView('feed');
  }

  function handleDelete(id) {
    setPosts((p) => p.filter((x) => x.id !== id));
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <Header view={view} setView={setView} />
      <main className="max-w-5xl mx-auto p-4 sm:p-6">
        {view === 'feed' ? (
          <Feed posts={posts} onDelete={handleDelete} gotoAdmin={() => setView('admin')} />
        ) : (
          <Admin onCreate={handleCreate} />
        )}
      </main>
      <Footer />
    </div>
  );
}

function Header({ view, setView }) {
  return (
    <header className="border-b bg-white">
      <div className="max-w-5xl mx-auto flex items-center justify-between p-4 sm:p-6">
        <div className="flex items-center gap-3">
          <Logo />
          <div className="text-xl font-semibold">YJA</div>
        </div>
        <nav className="flex items-center gap-2">
          <Tab active={view === 'feed'} onClick={() => setView('feed')}>
            View content
          </Tab>
          <Tab active={view === 'admin'} onClick={() => setView('admin')}>
            Manage content
          </Tab>
        </nav>
      </div>
    </header>
  );
}

function Tab({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      className={
        'px-3 py-1.5 rounded-full text-sm font-medium transition ' +
        (active ? 'bg-indigo-600 text-white shadow' : 'text-gray-700 hover:bg-gray-100')
      }
    >
      {children}
    </button>
  );
}

function Feed({ posts, onDelete, gotoAdmin }) {
  const [query, setQuery] = React.useState('');
  const filtered = React.useMemo(() => filterPosts(posts, query), [posts, query]);

  return (
    <div className="">
      <div className="flex items-center justify-between mb-4">
        <div className="text-lg font-semibold">Latest posts</div>
        <div className="flex items-center gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
            className="px-3 py-2 w-48 sm:w-64 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            onClick={gotoAdmin}
            className="hidden sm:inline-flex items-center gap-2 px-3 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
          >
            <PlusIcon /> New post
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState gotoAdmin={gotoAdmin} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <Card key={p.id} post={p} onDelete={() => onDelete(p.id)} />
          ))}
        </div>
      )}

    </div>
  );
}

function Card({ post, onDelete }) {
  const prettyDate = new Date(post.createdAt).toLocaleString();
  return (
    <div className="bg-white rounded-2xl shadow-sm border overflow-hidden flex flex-col">
      <div className="aspect-video bg-gray-100 flex items-center justify-center overflow-hidden">
        {post.image ? (
          <img src={post.image} alt="Post image" className="w-full h-full object-cover" />
        ) : (
          <div className="text-gray-400 text-sm">No image</div>
        )}
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-center justify-between gap-2 mb-2">
          <span
            className={
              'uppercase text-xs tracking-wide px-2 py-1 rounded-full ' +
              (post.source === 'education'
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-indigo-50 text-indigo-700')
            }
          >
            {post.source || 'general'}
          </span>
          <span className="text-xs text-gray-500">{prettyDate}</span>
        </div>
        <h3 className="font-semibold text-lg leading-snug mb-1 line-clamp-2">{post.title}</h3>
        <p className="text-sm text-gray-700 line-clamp-3 mb-3">{post.description}</p>
        <div className="mt-auto flex items-center justify-between">
          <a
            href={safeUrl(post.link)}
            target="_blank"
            rel="noreferrer noopener"
            className="text-indigo-600 hover:underline text-sm font-medium"
          >
            Visit link ↗
          </a>
          <button
            onClick={() => confirm('Delete this post?') && onDelete()}
            className="text-red-600 hover:text-red-700 text-sm"
            title="Delete"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ gotoAdmin }) {
  return (
    <div className="bg-white border rounded-2xl p-8 text-center shadow-sm">
      <div className="mx-auto mb-3 w-12 h-12 rounded-full bg-indigo-50 flex items-center justify-center">
        <PlusIcon />
      </div>
      <div className="font-semibold mb-1">No posts yet</div>
      <p className="text-sm text-gray-600 mb-4">Create your first post to see it appear here.</p>
      <button onClick={gotoAdmin} className="px-3 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700">
        New post
      </button>
    </div>
  );
}

function Admin({ onCreate }) {
  const [title, setTitle] = React.useState('');
  const [link, setLink] = React.useState('');
  const [description, setDescription] = React.useState('');
  const [source, setSource] = React.useState('community');
  const [imageDataUrl, setImageDataUrl] = React.useState('');
  const [error, setError] = React.useState('');

  function reset() {
    setTitle('');
    setLink('');
    setDescription('');
    setSource('community');
    setImageDataUrl('');
    setError('');
  }

  function handleSubmit(e) {
    e.preventDefault();

    const errs = validatePostInput({ title, link, description });
    if (errs.length) {
      setError(errs.join(' · '));
      return;
    }

    onCreate({
      title: title.trim(),
      link: link.trim(),
      description: description.trim(),
      image: imageDataUrl,
      source,
    });
    reset();
  }

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImageDataUrl(String(reader.result || ''));
    reader.readAsDataURL(file);
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl border shadow-sm p-4 sm:p-6">
        <h2 className="text-lg font-semibold mb-4">Create a new post</h2>
        {error && (
          <div className="mb-3 text-sm text-red-700 bg-red-50 border border-red-200 px-3 py-2 rounded-md">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Title *</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter title"
              className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              maxLength={120}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Link to content *</label>
            <input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="https://…"
              className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="One or two sentences."
              className="w-full h-28 px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              maxLength={500}
            />
            <div className="text-xs text-gray-500 text-right">{description.length}/500</div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Source</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value)}
                className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="community">Community</option>
                <option value="education">Education</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Upload image (optional)</label>
              <input type="file" accept="image/*" onChange={handleFile} className="block w-full text-sm" />
            </div>
          </div>

          {imageDataUrl && (
            <div className="mt-2">
              <div className="text-sm text-gray-600 mb-1">Preview</div>
              <div className="aspect-video bg-gray-100 rounded-lg overflow-hidden">
                <img src={imageDataUrl} alt="Preview" className="w-full h-full object-cover" />
              </div>
            </div>
          )}

          <div className="pt-2 flex items-center gap-2">
            <button type="submit" className="px-4 py-2 rounded-md bg-indigo-600 text-white hover:bg-indigo-700">
              Create post
            </button>
            <button
              type="button"
              onClick={reset}
              className="px-4 py-2 rounded-md border border-gray-300 hover:bg-gray-50"
            >
              Reset
            </button>
          </div>
        </form>
      </div>

      <Hints />
    </div>
  );
}

function Hints() {
  return (
    <div className="mt-6 text-sm text-gray-600">
      <details className="bg-white rounded-2xl border p-4">
        <summary className="cursor-pointer font-medium">Notes</summary>
        <ul className="list-disc pl-6 mt-2 space-y-1">
          <li>This demo stores posts in your browser localStorage. It persists between refreshes in this preview.</li>
          <li>Image uploads are kept as data URLs (base64) for simplicity in the demo.</li>
        </ul>
      </details>
    </div>
  );
}

function Footer() {
  return (
    <footer className="mt-10 pb-10 text-center text-xs text-gray-500">
      Built for YJA Director of Technology application — Rajas Gandhi.
    </footer>
  );
}

function Logo() {
  return (
    <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold">Y</div>
  );
}

function PlusIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <path d="M12 5c.414 0 .75.336.75.75V11.25H18.25a.75.75 0 010 1.5H12.75V18.25a.75.75 0 01-1.5 0V12.75H5.75a.75.75 0 010-1.5H11.25V5.75c0-.414.336-.75.75-.75z" />
    </svg>
  );
}
