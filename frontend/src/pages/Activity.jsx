import React, { useState, useEffect } from 'react';
import { HelpCircle, Clock, CheckCircle2, AlertCircle, MessageSquare } from 'lucide-react';
import { useEvent } from '../contexts/EventContext';

const Activity = () => {
    const { activeEvent } = useEvent();
    const [unknownQuestions, setUnknownQuestions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyText, setReplyText] = useState('');
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (activeEvent) fetchUnknownQuestions();
    }, [activeEvent]);

    const fetchUnknownQuestions = async () => {
        try {
            // Use relative path with Vite proxy
            const response = await fetch(`/api/unknown-questions?eventId=${activeEvent._id}`);
            if (!response.ok) throw new Error('Failed to fetch unknown questions');
            const data = await response.json();
            setUnknownQuestions(data);
        } catch (err) {
            console.error('Error fetching unknown questions:', err);
            setError(err.message || 'Error loading data');
        } finally {
            setLoading(false);
        }
    };

    const handleReply = async (id) => {
        if (!replyText.trim()) return;
        setSubmitting(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`/api/unknown-questions/${id}/answer`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({ answer: replyText })
            });
            if (!res.ok) throw new Error('Failed to send reply');

            // Remove from list
            setUnknownQuestions(prev => prev.filter(q => q._id !== id));
            setReplyingTo(null);
            setReplyText('');
        } catch (err) {
            console.error(err);
            alert("Error sending reply");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="text-white">Loading...</div>;

    return (
        <div className="space-y-8 animate-fade-in max-w-5xl mx-auto">
            <div>
                <h2 className="text-3xl font-bold text-white tracking-tight">Inbox / Unanswered</h2>
                <p className="text-slate-400 mt-2">Questions from integrated platforms that the bot couldn't answer.</p>
            </div>

            <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 shadow-lg backdrop-blur-sm overflow-hidden">
                <div className="p-6 border-b border-slate-700/50 flex justify-between items-center">
                    <h3 className="text-xl font-bold text-white flex items-center">
                        <AlertCircle className="w-5 h-5 mr-2 text-amber-500" />
                        Unanswered Questions
                    </h3>
                    <span className="text-xs font-mono text-slate-500 bg-slate-900 px-2 py-1 rounded">LIVE</span>
                </div>

                {unknownQuestions.length === 0 ? (
                    <div className="p-12 text-center">
                        <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
                        <h3 className="text-xl font-bold text-white">All Clear!</h3>
                        <p className="text-slate-400 mt-2">Your bot is handling all queries perfectly.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-slate-700/50">
                        {unknownQuestions.map((question) => (
                            <div key={question._id} className="p-6 hover:bg-slate-700/30 transition-colors group">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <h4 className="text-lg font-medium text-slate-200 group-hover:text-white transition-colors">
                                            "{question.text}"
                                        </h4>
                                        <div className="flex items-center mt-3 space-x-4 text-sm text-slate-400">
                                            <span className="flex items-center">
                                                <Clock className="w-3.5 h-3.5 mr-1.5" />
                                                {new Date(question.createdAt).toLocaleDateString()}
                                            </span>
                                            <span className="px-2 py-0.5 rounded-full bg-slate-700 text-slate-300 text-xs border border-slate-600">
                                                Platform: <span className="capitalize">{question.sourcePlatform || 'Website'}</span>
                                            </span>
                                        </div>
                                    </div>
                                    <div className="ml-4 flex flex-col items-end space-y-2">
                                        <div className="px-3 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-bold flex items-center">
                                            <HelpCircle className="w-4 h-4 mr-1.5" />
                                            {question.count} {question.count > 1 ? 'runs' : 'run'}
                                        </div>
                                        <button
                                            onClick={() => {
                                                setReplyingTo(replyingTo === question._id ? null : question._id);
                                                setReplyText('');
                                            }}
                                            className="flex items-center text-xs font-semibold px-3 py-1.5 rounded bg-primary-600/20 text-primary-400 hover:bg-primary-600 hover:text-white transition-colors border border-primary-500/30"
                                        >
                                            <MessageSquare className="w-3.5 h-3.5 mr-1" />
                                            {replyingTo === question._id ? 'Cancel' : 'Reply'}
                                        </button>
                                    </div>
                                </div>
                                {replyingTo === question._id && (
                                    <div className="mt-4 pt-4 border-t border-slate-700/50">
                                        <textarea
                                            value={replyText}
                                            onChange={(e) => setReplyText(e.target.value)}
                                            placeholder={`Answer user on ${question.sourcePlatform || 'Website'}...`}
                                            className="w-full bg-slate-900 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-primary-500 outline-none text-sm resize-none h-24"
                                        />
                                        <div className="flex justify-end mt-3">
                                            <button
                                                onClick={() => handleReply(question._id)}
                                                disabled={submitting || !replyText.trim()}
                                                className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50"
                                            >
                                                {submitting ? 'Sending...' : 'Send Reply & Save FAQ'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Activity;
