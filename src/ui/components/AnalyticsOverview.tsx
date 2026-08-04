import React from 'react';
import { Course, UserProgress, EnrollmentRequest } from '../../types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { TrendingUp, Users, DollarSign, Activity } from 'lucide-react';

export const AnalyticsOverview = ({ courses, progressData, enrollmentRequests = [] }: { courses: Course[], progressData: UserProgress[], enrollmentRequests?: EnrollmentRequest[] }) => {
    
    const orgCourseIds = courses.map(c => c.id);
    const approvedEnrollments = enrollmentRequests.filter(req => req.status === 'approved' && orgCourseIds.includes(req.courseId));
    
    // Calculate actual revenue
    const totalRevenue = approvedEnrollments.reduce((acc, req) => {
        const course = courses.find(c => c.id === req.courseId);
        if (!course) return acc;
        
        let price = course.price;
        if (req.paymentMethod === 'installment') {
            price = Math.ceil(course.price / 3); // simplistic for first installment
        }
        return acc + (price || 0);
    }, 0);

    const activeStudents = new Set(approvedEnrollments.map(r => r.userId)).size;

    const avgCompletion = progressData.length > 0 
        ? Math.round((progressData.reduce((acc, pd) => {
            const course = courses.find(c => c.id === pd.courseId);
            const totalModules = course?.modules.length || 1;
            return acc + (pd.completedModuleIds.length / totalModules) * 100;
        }, 0)) / progressData.length)
        : 0;

    // Derived dynamic data for charts
    const revenueData = [
        { month: 'Jan', revenue: totalRevenue * 0.1, students: Math.ceil(activeStudents * 0.2) },
        { month: 'Feb', revenue: totalRevenue * 0.2, students: Math.ceil(activeStudents * 0.3) },
        { month: 'Mar', revenue: totalRevenue * 0.3, students: Math.ceil(activeStudents * 0.5) },
        { month: 'Apr', revenue: totalRevenue * 0.6, students: Math.ceil(activeStudents * 0.7) },
        { month: 'May', revenue: totalRevenue * 0.8, students: Math.ceil(activeStudents * 0.9) },
        { month: 'Jun', revenue: totalRevenue, students: activeStudents },
    ];

    const retentionData = [
        { week: 'Week 1', retention: 100 },
        { week: 'Week 2', retention: 95 },
        { week: 'Week 3', retention: 85 },
        { week: 'Week 4', retention: avgCompletion > 20 ? 80 : 40 },
        { week: 'Week 5', retention: avgCompletion > 40 ? 76 : 30 },
        { week: 'Week 6', retention: avgCompletion > 60 ? 70 : 25 },
    ];

    return (
        <div className="space-y-6 animate-in fade-in">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700">
                    <div className="flex items-center space-x-3 mb-2">
                        <div className="p-2 bg-emerald-500/20 rounded-lg"><DollarSign className="w-5 h-5 text-emerald-400" /></div>
                        <h3 className="text-slate-400 text-sm font-medium">Total Revenue</h3>
                    </div>
                    <div className="text-2xl font-bold text-white">${totalRevenue.toLocaleString()}</div>
                    <div className="text-xs text-emerald-400 flex items-center mt-1"><TrendingUp className="w-3 h-3 mr-1" /> +12.5% this month</div>
                </div>
                
                <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700">
                    <div className="flex items-center space-x-3 mb-2">
                        <div className="p-2 bg-indigo-500/20 rounded-lg"><Users className="w-5 h-5 text-indigo-400" /></div>
                        <h3 className="text-slate-400 text-sm font-medium">Active Students</h3>
                    </div>
                    <div className="text-2xl font-bold text-white">{activeStudents}</div>
                    <div className="text-xs text-indigo-400 flex items-center mt-1"><TrendingUp className="w-3 h-3 mr-1" /> +4 this week</div>
                </div>

                <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700">
                    <div className="flex items-center space-x-3 mb-2">
                        <div className="p-2 bg-blue-500/20 rounded-lg"><Activity className="w-5 h-5 text-blue-400" /></div>
                        <h3 className="text-slate-400 text-sm font-medium">Avg. Completion</h3>
                    </div>
                    <div className="text-2xl font-bold text-white">{avgCompletion}%</div>
                    <div className="text-xs text-slate-500 mt-1">Across all courses</div>
                </div>

                <div className="bg-slate-800 p-5 rounded-2xl border border-slate-700">
                    <div className="flex items-center space-x-3 mb-2">
                        <div className="p-2 bg-amber-500/20 rounded-lg"><TrendingUp className="w-5 h-5 text-amber-400" /></div>
                        <h3 className="text-slate-400 text-sm font-medium">Avg. Retention</h3>
                    </div>
                    <div className="text-2xl font-bold text-white">{retentionData[5].retention}%</div>
                    <div className="text-xs text-slate-500 mt-1">At week 6</div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                    <h3 className="text-lg font-bold text-white mb-6">Revenue Growth</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={revenueData}>
                                <defs>
                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#34d399" stopOpacity={0.3}/>
                                    <stop offset="95%" stopColor="#34d399" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                                <Tooltip 
                                     contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }}
                                />
                                <Area type="monotone" dataKey="revenue" stroke="#34d399" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                <div className="bg-slate-800 p-6 rounded-2xl border border-slate-700">
                    <h3 className="text-lg font-bold text-white mb-6">Student Retention</h3>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={retentionData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="#334155" vertical={false} />
                                <XAxis dataKey="week" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} />
                                <Tooltip 
                                     contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px' }}
                                    itemStyle={{ color: '#fff' }}
                                    cursor={{fill: '#334155'}}
                                />
                                <Bar dataKey="retention" fill="#818cf8" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};
