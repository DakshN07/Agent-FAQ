// frontend/src/pages/Dashboard.jsx
import React, { useEffect, useState } from 'react';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { toast } from 'react-hot-toast';

ChartJS.register(ArcElement, Tooltip, Legend);

const ICONS = {
  faqs: { icon: '❓', bg: 'bg-blue-100 text-blue-600' },
  unanswered: { icon: '🤔', bg: 'bg-yellow-100 text-yellow-600' },
  accuracy: { icon: '✅', bg: 'bg-green-100 text-green-600' },
  today: { icon: '⏰', bg: 'bg-purple-100 text-purple-600' },
};

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const loadingToast = toast.loading('Fetching dashboard data...');
      try {
        // Fetch analytics and recent questions in parallel
        const [analyticsRes, questionsRes] = await Promise.all([
          fetch('https://agent-faq.onrender.com/api/analytics'),
          fetch('https://agent-faq.onrender.com/api/unknown-questions?limit=5'),
        ]);

        if (!analyticsRes.ok) throw new Error(`Analytics API error: ${analyticsRes.statusText}`);
        if (!questionsRes.ok) throw new Error(`Questions API error: ${questionsRes.statusText}`);

        const analyticsData = await analyticsRes.json();
        const questionsData = await questionsRes.json();

        setStats(analyticsData);
        setRecentActivity(questionsData.map((q) => ({ ...q, matched: false }))); // Assuming unknown questions are unmatched

        toast.success('Data loaded successfully!', { id: loadingToast });
      } catch (err) {
        console.error('Fetch error:', err);
        toast.error(`Failed to load data: ${err.message}`, { id: loadingToast });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const doughnutData = {
    labels: ['Answered', 'Unanswered'],
    datasets: [
      {
        data: [stats ? stats.totalFaqs : 0, stats ? stats.totalUnknown : 0],
        backgroundColor: ['#34D399', '#FBBF24'],
        hoverBackgroundColor: ['#10B981', '#F59E0B'],
        borderColor: '#ffffff',
        borderWidth: 2,
      },
    ],
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        <StatCard label="Total FAQs" value={stats?.totalFaqs ?? '--'} {...ICONS.faqs} />
        <StatCard label="Unanswered" value={stats?.totalUnknown ?? '--'} {...ICONS.unanswered} />
        <StatCard label="Accuracy" value={stats?.accuracy != null ? `${stats.accuracy}%` : '--'} {...ICONS.accuracy} />
        <StatCard label="Today's Activity" value={stats?.todayQuestions ?? '--'} {...ICONS.today} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {recentActivity.length > 0 ? (
              recentActivity.map((item, idx) => <ActivityItem key={idx} {...item} />)
            ) : (
              <p className="text-gray-500">No recent activity to display.</p>
            )}
          </div>
        </div>

        {/* Chart */}
        <div className="bg-white rounded-lg shadow-md p-6 flex flex-col items-center justify-center">
          <h2 className="text-xl font-semibold mb-4">FAQ Distribution</h2>
          <div style={{ width: '100%', maxWidth: '250px' }}>
            {stats && <Doughnut data={doughnutData} />}
          </div>
        </div>
      </div>
    </div>
  );
};

const StatCard = ({ icon, bg, value, label }) => (
  <div className="bg-white rounded-lg shadow p-5 flex items-center hover:shadow-lg transition-shadow">
    <div className={`w-12 h-12 flex items-center justify-center rounded-full mr-4 text-2xl ${bg}`}>{icon}</div>
    <div>
      <div className="text-2xl font-bold text-gray-800">{value}</div>
      <div className="text-gray-500">{label}</div>
    </div>
  </div>
);

const ActivityItem = ({ question, matched, createdAt }) => (
  <div className={`p-4 rounded-lg flex items-center border-l-4 ${matched ? 'bg-green-50 border-green-500' : 'bg-yellow-50 border-yellow-500'}`}>
    <span className={`mr-3 text-xl ${matched ? 'text-green-600' : 'text-yellow-600'}`}>{matched ? '✅' : '🤔'}</span>
    <div>
      <p className="font-semibold text-gray-700">{question}</p>
      <p className="text-sm text-gray-500">{new Date(createdAt).toLocaleString()}</p>
    </div>
  </div>
);

export default Dashboard;
