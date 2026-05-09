import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, UserPlus, Mail, Lock, User } from 'lucide-react';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const Register = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const res = await fetch(`${API_URL}/api/auth/register`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username: name, email, password })
            });
            const data = await res.json();

            if (!res.ok) throw new Error(data.error || 'Registration failed');

            localStorage.setItem('token', data.token);
            toast.success('Account created successfully!');
            navigate('/dashboard');
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative flex items-center justify-center overflow-hidden bg-slate-950 text-slate-200 py-12">
            {/* Background elements to match Landing page */}
            <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-primary-600/20 blur-[120px] rounded-full mix-blend-screen animate-pulse-slow" />
            <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 blur-[120px] rounded-full mix-blend-screen animate-pulse-slow" style={{ animationDelay: '2s' }} />

            <div className="relative z-10 w-full max-w-md p-8 animate-fade-in-up">

                <button
                    onClick={() => navigate('/')}
                    className="flex items-center text-slate-400 hover:text-white transition-colors mb-8"
                >
                    <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
                </button>

                <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl">
                    <div className="flex justify-center mb-8">
                        <div className="w-16 h-16 rounded-2xl bg-primary-500/20 text-primary-400 flex items-center justify-center">
                            <UserPlus className="w-8 h-8" />
                        </div>
                    </div>

                    <h2 className="text-3xl font-bold text-center text-white tracking-tight mb-2">Create Account</h2>
                    <p className="text-center text-slate-400 text-sm mb-8">Join AgentFAQ and build your automated support hub.</p>

                    <form onSubmit={handleRegister} className="space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Full Name</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <User className="h-5 w-5 text-slate-500" />
                                </div>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="block w-full pl-10 bg-slate-800 border border-slate-700 rounded-xl py-3 text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                    placeholder="John Doe"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Email</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail className="h-5 w-5 text-slate-500" />
                                </div>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full pl-10 bg-slate-800 border border-slate-700 rounded-xl py-3 text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                    placeholder="you@company.com"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-400 mb-2">Password</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Lock className="h-5 w-5 text-slate-500" />
                                </div>
                                <input
                                    type="password"
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-10 bg-slate-800 border border-slate-700 rounded-xl py-3 text-white focus:ring-2 focus:ring-primary-500 outline-none transition-all"
                                    placeholder="••••••••"
                                    minLength={6}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 px-4 bg-primary-600 hover:bg-primary-500 text-white rounded-xl font-bold transition-colors shadow-lg shadow-primary-500/25 disabled:opacity-50 mt-4"
                        >
                            {loading ? 'Creating account...' : 'Sign Up'}
                        </button>
                    </form>

                    <div className="mt-8 text-center text-sm text-slate-400 border-t border-slate-800 pt-6">
                        Already have an account?{' '}
                        <Link to="/login" className="text-primary-400 hover:text-primary-300 font-semibold transition-colors">
                            Sign in here
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
