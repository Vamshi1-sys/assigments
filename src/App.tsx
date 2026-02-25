import React, { createContext, useContext, useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ClipboardList, 
  Upload, 
  Truck, 
  User as UserIcon, 
  LogOut, 
  LayoutDashboard, 
  CheckCircle, 
  Clock, 
  AlertCircle,
  Bell,
  TrendingUp,
  DollarSign,
  Search,
  Filter,
  CheckCircle2,
  MessageSquare,
  Send,
  Edit,
  Trash2,
  Settings,
  Users as UsersListIcon,
  FileText,
  ChevronRight,
  Plus,
  Package,
  PenTool
} from 'lucide-react';

// --- Types ---
interface User {
  id: number;
  name: string;
  email: string;
  role: 'student' | 'admin' | 'writer' | 'delivery';
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// --- Components ---

const Navbar = () => {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const fetchNotifications = async () => {
    if (!auth?.token) return;
    try {
      const res = await fetch('/api/notifications', {
        headers: { 'Authorization': `Bearer ${auth.token}` }
      });
      if (res.ok) setNotifications(await res.json());
    } catch (err) {}
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [auth?.token]);

  const markAsRead = async () => {
    await fetch('/api/notifications/read', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${auth?.token}` }
    });
    setNotifications(notifications.map(n => ({ ...n, is_read: 1 })));
  };

  if (!auth?.user) return null;

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <nav className="glass sticky top-0 z-50 px-6 py-4 flex items-center justify-between">
      <Link to="/" className="flex items-center gap-2 group">
        <div className="bg-indigo-600 p-2 rounded-lg group-hover:rotate-12 transition-transform">
          <PenTool className="text-white w-5 h-5" />
        </div>
        <span className="font-serif text-xl font-bold tracking-tight">Handwritten</span>
      </Link>
      
      <div className="flex items-center gap-6">
        <div className="relative">
          <button 
            onClick={() => { setShowNotifications(!showNotifications); if(!showNotifications) markAsRead(); }}
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-xl transition-colors relative"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] flex items-center justify-center rounded-full font-bold">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-2xl border border-slate-100 py-4 z-[100]">
              <h3 className="px-6 pb-2 text-sm font-bold text-slate-900 border-b border-slate-50">Notifications</h3>
              <div className="max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-6 py-4 text-sm text-slate-400">No notifications</div>
                ) : (
                  notifications.map(n => (
                    <div key={n.id} className={`px-6 py-3 text-sm border-b border-slate-50 last:border-0 ${!n.is_read ? 'bg-indigo-50/30' : ''}`}>
                      <p className="text-slate-700">{n.message}</p>
                      <span className="text-[10px] text-slate-400">{new Date(n.created_at).toLocaleTimeString()}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full text-sm font-medium text-slate-600">
          <UserIcon className="w-4 h-4" />
          {auth.user.name} ({auth.user.role})
        </div>
        <button 
          onClick={() => { auth.logout(); navigate('/login'); }}
          className="text-slate-500 hover:text-red-600 transition-colors"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </nav>
  );
};

const ProtectedRoute = ({ children, roles }: { children: React.ReactNode, roles?: string[] }) => {
  const auth = useContext(AuthContext);
  if (!auth?.token) return <Navigate to="/login" />;
  if (roles && !roles.includes(auth.user?.role || '')) return <Navigate to="/" />;
  return <>{children}</>;
};

// --- Pages ---

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const auth = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (res.ok) {
        auth?.login(data.token, data.user);
        navigate('/');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to connect to server');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-slate-100"
      >
        <div className="text-center mb-8">
          <div className="inline-block bg-indigo-100 p-4 rounded-2xl mb-4">
            <PenTool className="text-indigo-600 w-8 h-8" />
          </div>
          <h1 className="text-3xl font-serif font-bold text-slate-900">Welcome Back</h1>
          <p className="text-slate-500 mt-2">Sign in to manage your assignments</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Email Address</label>
            <input 
              type="email" 
              required 
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              placeholder="name@example.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
            <input 
              type="password" 
              required 
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
            />
          </div>
          {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
          <button className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
            Sign In
          </button>
        </form>

        <div className="mt-8 pt-8 border-t border-slate-100 text-center">
          <p className="text-slate-500 text-sm">
            Don't have an account? <Link to="/register" className="text-indigo-600 font-bold">Create one</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('student');
  const [error, setError] = useState('');
  const auth = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role })
      });
      const data = await res.json();
      if (res.ok) {
        auth?.login(data.token, data.user);
        navigate('/');
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError('Failed to connect to server');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-slate-100"
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-serif font-bold text-slate-900">Create Account</h1>
          <p className="text-slate-500 mt-2">Join the handwritten revolution</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Full Name</label>
            <input 
              type="text" required 
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
              value={name} onChange={e => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
            <input 
              type="email" required 
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
              value={email} onChange={e => setEmail(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">Password</label>
            <input 
              type="password" required 
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none"
              value={password} onChange={e => setPassword(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">I am a...</label>
            <select 
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-indigo-500 outline-none bg-white"
              value={role} onChange={e => setRole(e.target.value)}
            >
              <option value="student">Student</option>
              <option value="writer">Writer</option>
              <option value="delivery">Delivery Agent</option>
            </select>
          </div>
          {error && <p className="text-red-500 text-sm font-medium">{error}</p>}
          <button className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors mt-4">
            Register
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-slate-500 text-sm">
            Already have an account? <Link to="/login" className="text-indigo-600 font-bold">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

const StudentDashboard = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [pageCount, setPageCount] = useState(1);
  const [dueDate, setDueDate] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const auth = useContext(AuthContext);

  const PRICE_PER_PAGE = 40;

  const fetchOrders = async () => {
    const res = await fetch('/api/orders', {
      headers: { 'Authorization': `Bearer ${auth?.token}` }
    });
    const data = await res.json();
    setOrders(data);
  };

  useEffect(() => { fetchOrders(); }, []);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData();
    formData.append('title', title);
    formData.append('description', description);
    formData.append('page_count', pageCount.toString());
    if (dueDate) formData.append('due_date', dueDate);
    if (file) formData.append('file', file);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${auth?.token}` },
        body: formData
      });
      if (res.ok) {
        setShowUpload(false);
        setTitle('');
        setDescription('');
        setDueDate('');
        setFile(null);
        fetchOrders();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-end mb-12">
        <div>
          <h1 className="text-4xl font-serif font-bold text-slate-900">My Assignments</h1>
          <p className="text-slate-500 mt-2">Track and manage your handwritten requests</p>
        </div>
        <button 
          onClick={() => setShowUpload(true)}
          className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
        >
          <Plus className="w-5 h-5" />
          New Assignment
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {orders.map((order) => (
            <motion.div 
              key={order.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div className="bg-slate-100 p-3 rounded-2xl">
                  <FileText className="text-slate-600 w-6 h-6" />
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                  order.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' :
                  order.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                  'bg-indigo-100 text-indigo-700'
                }`}>
                  {order.status.replace('_', ' ')}
                </span>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-1">{order.title}</h3>
              <p className="text-slate-500 text-sm line-clamp-2 mb-4">{order.description}</p>
              
              {order.due_date && (
                <div className="flex items-center gap-2 mb-4 text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1.5 rounded-xl w-fit">
                  <Clock className="w-3.5 h-3.5" />
                  Due: {new Date(order.due_date).toLocaleDateString()}
                </div>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-slate-50">
                <div className="flex flex-col">
                  <span className="text-xs text-slate-400 uppercase font-bold tracking-widest">Price</span>
                  <span className="text-lg font-bold text-indigo-600">₹{order.price}</span>
                </div>
                <Link 
                  to={`/order/${order.id}`}
                  className="p-2 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </Link>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Upload Modal */}
      {showUpload && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-xl rounded-3xl shadow-2xl p-8 my-8"
          >
            <h2 className="text-2xl font-serif font-bold mb-6">Request Assignment</h2>
            <form onSubmit={handleUpload} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Title</label>
                <input 
                  type="text" required 
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                  value={title} onChange={e => setTitle(e.target.value)}
                  placeholder="e.g. Physics Chapter 4 Notes"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Number of Pages</label>
                  <input 
                    type="number" required min="1"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                    value={pageCount} onChange={e => setPageCount(parseInt(e.target.value) || 1)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Estimated Price</label>
                  <div className="w-full px-4 py-2.5 rounded-xl border border-slate-100 bg-slate-50 font-bold text-indigo-600">
                    ₹{pageCount * PRICE_PER_PAGE}
                  </div>
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Instructions</label>
                <textarea 
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 h-32"
                  value={description} onChange={e => setDescription(e.target.value)}
                  placeholder="Any specific handwriting style or formatting?"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Due Date</label>
                <input 
                  type="date" required 
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500"
                  value={dueDate} onChange={e => setDueDate(e.target.value)}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Upload Content (PDF/Images)</label>
                <div className="border-2 border-dashed border-slate-200 rounded-2xl p-8 text-center hover:border-indigo-400 transition-colors cursor-pointer relative">
                  <input 
                    type="file" 
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    onChange={e => setFile(e.target.files?.[0] || null)}
                  />
                  <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-sm text-slate-500 font-medium">
                    {file ? file.name : 'Click or drag to upload assignment content'}
                  </p>
                </div>
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowUpload(false)}
                  className="flex-1 py-3 rounded-xl font-bold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  disabled={loading}
                  className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Submit Request'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

const OrderDetail = () => {
  const { id } = useParams();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [commentText, setCommentText] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);
  const auth = useContext(AuthContext);

  const fetchOrder = async () => {
    const res = await fetch(`/api/orders/${id}`, {
      headers: { 'Authorization': `Bearer ${auth?.token}` }
    });
    const data = await res.json();
    setOrder(data);
    setLoading(false);
  };

  useEffect(() => { fetchOrder(); }, [id]);

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmittingComment(true);
    
    const res = await fetch(`/api/orders/${id}/comments`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth?.token}` 
      },
      body: JSON.stringify({ text: commentText })
    });
    
    if (res.ok) {
      setCommentText('');
      fetchOrder();
    }
    setSubmittingComment(false);
  };

  if (loading) return <div className="p-12 text-center">Loading...</div>;
  if (!order) return <div className="p-12 text-center">Order not found</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="mb-8">
        <Link to="/" className="text-indigo-600 font-bold flex items-center gap-1 mb-4">
          <ChevronRight className="w-4 h-4 rotate-180" /> Back to Dashboard
        </Link>
        <h1 className="text-4xl font-serif font-bold text-slate-900">{order.title}</h1>
        <div className="flex items-center gap-4 mt-2">
          <p className="text-slate-500">Order ID: #{order.id}</p>
          {order.due_date && (
            <div className="flex items-center gap-2 text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
              <Clock className="w-3.5 h-3.5" />
              Due: {new Date(order.due_date).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
            <h2 className="text-xl font-bold mb-4">Description</h2>
            <p className="text-slate-600 leading-relaxed">{order.description}</p>
            
            <div className="mt-8 grid grid-cols-3 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl">
                <span className="text-xs text-slate-400 uppercase font-bold tracking-widest block mb-1">Pages</span>
                <span className="text-xl font-bold text-slate-900">{order.page_count}</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl">
                <span className="text-xs text-slate-400 uppercase font-bold tracking-widest block mb-1">Price/Page</span>
                <span className="text-xl font-bold text-slate-900">₹{order.price_per_page}</span>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl">
                <span className="text-xs text-slate-400 uppercase font-bold tracking-widest block mb-1">Total Price</span>
                <span className="text-xl font-bold text-indigo-600">₹{order.price}</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
            <h2 className="text-xl font-bold mb-6">Timeline</h2>
            <div className="space-y-8 relative before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
              {order.updates?.map((update: any, i: number) => (
                <div key={i} className="relative pl-10">
                  <div className={`absolute left-0 top-1 w-6 h-6 rounded-full border-4 border-white shadow-sm ${
                    i === 0 ? 'bg-indigo-600' : 'bg-slate-300'
                  }`} />
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-900 uppercase text-xs tracking-wider">{update.status.replace('_', ' ')}</h4>
                      <p className="text-slate-500 text-sm mt-1">{update.message}</p>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">
                      {new Date(update.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-sm">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-indigo-600" />
              Discussion
            </h2>
            
            <div className="space-y-6 mb-8 max-h-[400px] overflow-y-auto pr-2">
              {order.comments?.length === 0 ? (
                <p className="text-slate-400 text-center py-4 italic">No messages yet. Start the conversation!</p>
              ) : (
                order.comments?.map((comment: any, i: number) => (
                  <div key={i} className={`flex flex-col ${comment.user_id === auth?.user?.id ? 'items-end' : 'items-start'}`}>
                    <div className={`max-w-[85%] p-4 rounded-2xl ${
                      comment.user_id === auth?.user?.id 
                        ? 'bg-indigo-600 text-white rounded-tr-none shadow-md shadow-indigo-100' 
                        : 'bg-slate-100 text-slate-800 rounded-tl-none'
                    }`}>
                      <p className="text-sm leading-relaxed">{comment.text}</p>
                    </div>
                    <div className="flex items-center gap-2 mt-1 px-1">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{comment.user_name}</span>
                      <span className="text-[10px] text-slate-300">•</span>
                      <span className="text-[10px] text-slate-400">{new Date(comment.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={handleAddComment} className="relative">
              <input 
                type="text" 
                placeholder="Type your message..."
                className="w-full pl-6 pr-14 py-4 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 transition-all shadow-sm"
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                disabled={submittingComment}
              />
              <button 
                type="submit"
                disabled={submittingComment || !commentText.trim()}
                className="absolute right-2 top-2 bottom-2 px-4 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center justify-center"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-indigo-600 rounded-3xl p-8 text-white shadow-xl shadow-indigo-100">
            <h3 className="text-lg font-bold mb-4">Current Status</h3>
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-white/20 p-2 rounded-xl">
                <Clock className="w-6 h-6" />
              </div>
              <span className="text-2xl font-bold capitalize">{order.status.replace('_', ' ')}</span>
            </div>
            <p className="text-indigo-100 text-sm">
              Your assignment is currently being processed by our team.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<'orders' | 'users' | 'analytics'>('orders');
  const [orders, setOrders] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  
  const [writers, setWriters] = useState<any[]>([]);
  const [deliveryAgents, setDeliveryAgents] = useState<any[]>([]);
  
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  
  const [selectedWriter, setSelectedWriter] = useState('');
  const [selectedDelivery, setSelectedDelivery] = useState('');
  
  const auth = useContext(AuthContext);

  const fetchData = async () => {
    const [ordersRes, writersRes, deliveryRes, usersRes, analyticsRes] = await Promise.all([
      fetch('/api/orders', { headers: { 'Authorization': `Bearer ${auth?.token}` } }),
      fetch('/api/users/role/writer', { headers: { 'Authorization': `Bearer ${auth?.token}` } }),
      fetch('/api/users/role/delivery', { headers: { 'Authorization': `Bearer ${auth?.token}` } }),
      fetch('/api/admin/users', { headers: { 'Authorization': `Bearer ${auth?.token}` } }),
      fetch('/api/admin/stats', { headers: { 'Authorization': `Bearer ${auth?.token}` } })
    ]);
    setOrders(await ordersRes.json());
    setWriters(await writersRes.json());
    setDeliveryAgents(await deliveryRes.json());
    setUsers(await usersRes.json());
    setAnalytics(await analyticsRes.json());
  };

  useEffect(() => { fetchData(); }, []);

  const handleAssign = async () => {
    const res = await fetch('/api/admin/assign', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth?.token}` 
      },
      body: JSON.stringify({
        order_id: selectedOrder.id,
        writer_id: selectedWriter,
        delivery_id: selectedDelivery
      })
    });
    if (res.ok) {
      setSelectedOrder(null);
      setIsAssigning(false);
      fetchData();
    }
  };

  const handleUpdateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/admin/orders/${selectedOrder.id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth?.token}` 
      },
      body: JSON.stringify(selectedOrder)
    });
    if (res.ok) {
      setSelectedOrder(null);
      fetchData();
    }
  };

  const handleDeleteOrder = async (id: number) => {
    if (!confirm('Are you sure you want to delete this order?')) return;
    const res = await fetch(`/api/admin/orders/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${auth?.token}` }
    });
    if (res.ok) fetchData();
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await fetch(`/api/admin/users/${selectedUser.id}`, {
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth?.token}` 
      },
      body: JSON.stringify(selectedUser)
    });
    if (res.ok) {
      setSelectedUser(null);
      fetchData();
    }
  };

  const handleDeleteUser = async (id: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    const res = await fetch(`/api/admin/users/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${auth?.token}` }
    });
    if (res.ok) fetchData();
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         order.student_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-serif font-bold">Admin Control Panel</h1>
        <div className="flex bg-slate-100 p-1 rounded-xl">
          <button 
            onClick={() => setActiveTab('orders')}
            className={`px-6 py-2 rounded-lg font-bold transition-all ${activeTab === 'orders' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Orders
          </button>
          <button 
            onClick={() => setActiveTab('users')}
            className={`px-6 py-2 rounded-lg font-bold transition-all ${activeTab === 'users' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Users
          </button>
          <button 
            onClick={() => setActiveTab('analytics')}
            className={`px-6 py-2 rounded-lg font-bold transition-all ${activeTab === 'analytics' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}
          >
            Analytics
          </button>
        </div>
      </div>

      {activeTab === 'analytics' && analytics && (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                  <DollarSign className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Revenue</p>
                  <p className="text-2xl font-bold text-slate-900">₹{analytics.revenue || 0}</p>
                </div>
              </div>
              <div className="h-1 bg-slate-50 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 w-2/3"></div>
              </div>
            </div>
            
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                  <Clock className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Pending</p>
                  <p className="text-2xl font-bold text-slate-900">{analytics.pending || 0}</p>
                </div>
              </div>
              <div className="h-1 bg-slate-50 rounded-full overflow-hidden">
                <div className="h-full bg-indigo-500 w-1/2"></div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Orders</p>
                  <p className="text-2xl font-bold text-slate-900">{analytics.totalOrders || 0}</p>
                </div>
              </div>
              <div className="h-1 bg-slate-50 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 w-3/4"></div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Writers</p>
                  <p className="text-2xl font-bold text-slate-900">{analytics.writers || 0}</p>
                </div>
              </div>
              <div className="h-1 bg-slate-50 rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 w-1/3"></div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm">
              <h3 className="text-xl font-bold mb-6">Recent Orders</h3>
              <div className="space-y-4">
                {analytics.recentOrders.map((order: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl">
                    <div>
                      <p className="font-bold text-slate-900">{order.title}</p>
                      <p className="text-xs text-slate-500">by {order.student_name}</p>
                    </div>
                    <p className="font-bold text-indigo-600">₹{order.price}</p>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-white p-8 rounded-3xl border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center">
              <div className="w-32 h-32 rounded-full border-8 border-indigo-500 border-t-transparent animate-spin mb-6"></div>
              <h3 className="text-xl font-bold mb-2">Growth Target</h3>
              <p className="text-slate-500">You are at 65% of your monthly goal.</p>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'orders' ? (
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search by title or student name..."
                className="w-full pl-12 pr-4 py-3 rounded-2xl border border-slate-200 outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-2xl border border-slate-200">
              <Filter className="w-5 h-5 text-slate-400" />
              <select 
                className="outline-none bg-transparent font-medium text-slate-600"
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="assigned">Assigned</option>
                <option value="writing">Writing</option>
                <option value="ready_for_delivery">Ready</option>
                <option value="delivered">Delivered</option>
              </select>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-slate-100">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Order</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Student</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Pages</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Price</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredOrders.map(order => (
                  <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-bold text-slate-900">{order.title}</div>
                    <div className="text-xs text-slate-400">ID: #{order.id}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-600 font-medium">{order.student_name}</td>
                  <td className="px-6 py-4 text-slate-600">{order.page_count}</td>
                  <td className="px-6 py-4 text-indigo-600 font-bold">₹{order.price}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold uppercase">
                      {order.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-3">
                      {order.status === 'pending' && (
                        <button 
                          onClick={() => { setSelectedOrder(order); setIsAssigning(true); }}
                          className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg transition-colors"
                          title="Assign Agents"
                        >
                          <UsersListIcon className="w-4 h-4" />
                        </button>
                      )}
                      <button 
                        onClick={() => { setSelectedOrder(order); setIsAssigning(false); }}
                        className="text-slate-600 hover:bg-slate-100 p-2 rounded-lg transition-colors"
                        title="Edit Order"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteOrder(order.id)}
                        className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                        title="Delete Order"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      ) : (
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-b border-slate-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">User</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Email</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Role</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Joined</th>
                <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-widest">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4 font-bold text-slate-900">{user.name}</td>
                  <td className="px-6 py-4 text-slate-600">{user.email}</td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold uppercase">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-400 text-sm">
                    {new Date(user.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-3">
                      <button 
                        onClick={() => setSelectedUser(user)}
                        className="text-slate-600 hover:bg-slate-100 p-2 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:bg-red-50 p-2 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Assign Modal */}
      {selectedOrder && isAssigning && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl my-8">
            <h2 className="text-2xl font-serif font-bold mb-6">Assign Agents</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Writer</label>
                <select 
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none"
                  value={selectedWriter} onChange={e => setSelectedWriter(e.target.value)}
                >
                  <option value="">Select Writer</option>
                  {writers.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Delivery Agent</label>
                <select 
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none"
                  value={selectedDelivery} onChange={e => setSelectedDelivery(e.target.value)}
                >
                  <option value="">Select Delivery Agent</option>
                  {deliveryAgents.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button onClick={() => { setSelectedOrder(null); setIsAssigning(false); }} className="flex-1 py-3 font-bold text-slate-500">Cancel</button>
                <button onClick={handleAssign} className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold">Confirm</button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit Order Modal */}
      {selectedOrder && !isAssigning && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-xl rounded-3xl p-8 shadow-2xl my-8">
            <h2 className="text-2xl font-serif font-bold mb-6">Edit Order</h2>
            <form onSubmit={handleUpdateOrder} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Title</label>
                <input 
                  type="text" required 
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none"
                  value={selectedOrder.title} onChange={e => setSelectedOrder({...selectedOrder, title: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Description</label>
                <textarea 
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none h-24"
                  value={selectedOrder.description} onChange={e => setSelectedOrder({...selectedOrder, description: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Pages</label>
                  <input 
                    type="number" required 
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none"
                    value={selectedOrder.page_count} 
                    onChange={e => {
                      const pages = parseInt(e.target.value) || 0;
                      setSelectedOrder({
                        ...selectedOrder, 
                        page_count: pages,
                        price: pages * (selectedOrder.price_per_page || 0)
                      });
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Price/Page (₹)</label>
                  <input 
                    type="number" required 
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none"
                    value={selectedOrder.price_per_page} 
                    onChange={e => {
                      const ppp = parseFloat(e.target.value) || 0;
                      setSelectedOrder({
                        ...selectedOrder, 
                        price_per_page: ppp,
                        price: (selectedOrder.page_count || 0) * ppp
                      });
                    }}
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">Total Price (₹)</label>
                  <input 
                    type="number" required 
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none bg-slate-50"
                    value={selectedOrder.price} 
                    readOnly
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Due Date</label>
                <input 
                  type="date" 
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none"
                  value={selectedOrder.due_date ? selectedOrder.due_date.split('T')[0] : ''} 
                  onChange={e => setSelectedOrder({...selectedOrder, due_date: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Status</label>
                <select 
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none"
                  value={selectedOrder.status} onChange={e => setSelectedOrder({...selectedOrder, status: e.target.value})}
                >
                  <option value="pending">Pending</option>
                  <option value="assigned">Assigned</option>
                  <option value="writing">Writing</option>
                  <option value="ready_for_delivery">Ready for Delivery</option>
                  <option value="out_for_delivery">Out for Delivery</option>
                  <option value="delivered">Delivered</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setSelectedOrder(null)} className="flex-1 py-3 font-bold text-slate-500">Cancel</button>
                <button type="submit" className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold">Save Changes</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Edit User Modal */}
      {selectedUser && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm overflow-y-auto">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl my-8">
            <h2 className="text-2xl font-serif font-bold mb-6">Edit User</h2>
            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Name</label>
                <input 
                  type="text" required 
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none"
                  value={selectedUser.name} onChange={e => setSelectedUser({...selectedUser, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Email</label>
                <input 
                  type="email" required 
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none"
                  value={selectedUser.email} onChange={e => setSelectedUser({...selectedUser, email: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1">Role</label>
                <select 
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 outline-none"
                  value={selectedUser.role} onChange={e => setSelectedUser({...selectedUser, role: e.target.value})}
                >
                  <option value="student">Student</option>
                  <option value="writer">Writer</option>
                  <option value="delivery">Delivery Agent</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setSelectedUser(null)} className="flex-1 py-3 font-bold text-slate-500">Cancel</button>
                <button type="submit" className="flex-1 bg-indigo-600 text-white py-3 rounded-xl font-bold">Save Changes</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const login = (newToken: string, newUser: User) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      <Router>
        <div className="min-h-screen bg-slate-50">
          <Navbar />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/order/:id" element={
              <ProtectedRoute>
                <OrderDetail />
              </ProtectedRoute>
            } />
            <Route path="/" element={
              <ProtectedRoute>
                {user?.role === 'admin' ? <AdminDashboard /> : 
                 user?.role === 'delivery' ? <DeliveryDashboard /> :
                 user?.role === 'writer' ? <WriterDashboard /> :
                 <StudentDashboard />}
              </ProtectedRoute>
            } />
          </Routes>
        </div>
      </Router>
    </AuthContext.Provider>
  );
}

const DeliveryDashboard = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [earnings, setEarnings] = useState(0);
  const auth = useContext(AuthContext);

  const fetchData = async () => {
    const [ordersRes, earningsRes] = await Promise.all([
      fetch('/api/orders', { headers: { 'Authorization': `Bearer ${auth?.token}` } }),
      fetch('/api/earnings', { headers: { 'Authorization': `Bearer ${auth?.token}` } })
    ]);
    setOrders(await ordersRes.json());
    const earningsData = await earningsRes.json();
    setEarnings(earningsData.total);
  };

  useEffect(() => { fetchData(); }, []);

  const updateStatus = async (orderId: number, status: string, message: string) => {
    await fetch(`/api/orders/${orderId}/status`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth?.token}` 
      },
      body: JSON.stringify({ status, message })
    });
    fetchData();
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-serif font-bold">Delivery Fleet</h1>
        <div className="bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-100">
          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Earnings</p>
          <p className="text-lg font-bold text-emerald-700">₹{earnings}</p>
        </div>
      </div>
      <div className="grid gap-6">
        {orders.map(order => (
          <div key={order.id} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Truck className="text-indigo-600 w-5 h-5" />
                <h3 className="text-xl font-bold text-slate-900">{order.title}</h3>
              </div>
              <p className="text-slate-500 text-sm">Pickup from Writer, Deliver to Student</p>
              <div className="mt-4 flex gap-4">
                <div className="text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1 rounded-full">
                  Status: {order.status}
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              {order.status === 'ready_for_delivery' && (
                <button 
                  onClick={() => updateStatus(order.id, 'out_for_delivery', 'Agent has picked up the assignment and is on the way')}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700"
                >
                  Pick Up
                </button>
              )}
              {order.status === 'out_for_delivery' && (
                <button 
                  onClick={() => updateStatus(order.id, 'delivered', 'Assignment delivered to student successfully')}
                  className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-emerald-700"
                >
                  Mark Delivered
                </button>
              )}
              <Link to={`/order/${order.id}`} className="p-2 bg-slate-50 rounded-xl">
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const WriterDashboard = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [earnings, setEarnings] = useState(0);
  const auth = useContext(AuthContext);

  const fetchData = async () => {
    const [ordersRes, earningsRes] = await Promise.all([
      fetch('/api/orders', { headers: { 'Authorization': `Bearer ${auth?.token}` } }),
      fetch('/api/earnings', { headers: { 'Authorization': `Bearer ${auth?.token}` } })
    ]);
    setOrders(await ordersRes.json());
    const earningsData = await earningsRes.json();
    setEarnings(earningsData.total);
  };

  useEffect(() => { fetchData(); }, []);

  const updateStatus = async (orderId: number, status: string, message: string) => {
    await fetch(`/api/orders/${orderId}/status`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${auth?.token}` 
      },
      body: JSON.stringify({ status, message })
    });
    fetchData();
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-serif font-bold">Writer Workspace</h1>
        <div className="bg-emerald-50 px-4 py-2 rounded-2xl border border-emerald-100">
          <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest">Earnings (70%)</p>
          <p className="text-lg font-bold text-emerald-700">₹{earnings.toFixed(2)}</p>
        </div>
      </div>
      <div className="grid gap-6">
        {orders.map(order => (
          <div key={order.id} className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-xs font-bold text-slate-400">#{order.id}</span>
                <h3 className="text-xl font-bold text-slate-900">{order.title}</h3>
              </div>
              <p className="text-slate-500 text-sm">{order.description}</p>
              <div className="mt-4 flex gap-4">
                <div className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                  {order.page_count} Pages
                </div>
                <div className="text-xs font-bold text-slate-500 bg-slate-50 px-3 py-1 rounded-full">
                  Status: {order.status}
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              {order.status === 'assigned' && (
                <button 
                  onClick={() => updateStatus(order.id, 'writing', 'Writer has started working on the assignment')}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-indigo-700"
                >
                  Start Writing
                </button>
              )}
              {order.status === 'writing' && (
                <button 
                  onClick={() => updateStatus(order.id, 'ready_for_delivery', 'Assignment completed and ready for pickup')}
                  className="bg-emerald-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-emerald-700"
                >
                  Mark Completed
                </button>
              )}
              <Link to={`/order/${order.id}`} className="p-2 bg-slate-50 rounded-xl">
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
