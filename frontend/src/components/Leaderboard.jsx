import React, { useEffect, useState } from 'react';
import { Trophy, TrendingUp } from 'lucide-react';
import api from '../api';

const Leaderboard = () => {
    const [users, setUsers] = useState([]);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const res = await api.get('leaderboard/');
                setUsers(res.data);
            } catch (err) {
                console.error(err);
            }
        };

        fetchLeaderboard();
        const interval = setInterval(fetchLeaderboard, 30000); // Live update every 30s
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="bg-slate-800/50 backdrop-blur-md border border-slate-700 rounded-xl p-5 shadow-xl sticky top-6">
            <div className="flex items-center gap-2 mb-4 text-amber-400">
                <Trophy size={20} />
                <h2 className="font-bold tracking-wide uppercase text-sm">24h Leaderboard</h2>
            </div>

            <div className="space-y-4">
                {users.map((user, index) => (
                    <div key={user.username} className="flex items-center justify-between group">
                        <div className="flex items-center gap-3">
                            <span className={`flex items-center justify-center w-6 h-6 rounded font-bold text-xs ${index === 0 ? 'bg-amber-400 text-black' :
                                    index === 1 ? 'bg-slate-300 text-black' :
                                        index === 2 ? 'bg-amber-700 text-white' : 'text-slate-500'
                                }`}>
                                {index + 1}
                            </span>
                            <span className="font-medium text-slate-200 group-hover:text-white transition-colors">
                                {user.username}
                            </span>
                        </div>
                        <div className="flex items-center gap-1 text-emerald-400 font-mono text-sm">
                            <TrendingUp size={12} />
                            {user.karma}
                        </div>
                    </div>
                ))}

                {users.length === 0 && (
                    <p className="text-slate-500 text-sm text-center py-4">No activity yet</p>
                )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-700 text-center">
                <p className="text-xs text-slate-500">Updates live based on recent karma</p>
            </div>
        </div>
    );
};

export default Leaderboard;
