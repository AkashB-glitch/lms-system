import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import API from '../api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';
import { Shield, Activity, Users, Filter } from 'lucide-react';
import { format } from 'date-fns';

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

const Analytics = () => {
  const { user } = useContext(AuthContext);
  const [data, setData] = useState({ trendsData: [], deptData: [], peakData: [] });
  const [auditLogs, setAuditLogs] = useState([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const { data: analytics } = await API.get('/analytics/analytics-data');
        setData(analytics);
        
        if (user.role === 'Admin') {
           const { data: logs } = await API.get('/analytics/audit-logs');
           setAuditLogs(logs);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchAnalytics();
  }, [user]);

  return (
    <div className="space-y-8 pb-12">
      <header className="bg-white p-8 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 mb-8 flex items-center space-x-4">
        <div className="bg-indigo-100 p-3 rounded-xl text-indigo-600"><Activity className="w-8 h-8"/></div>
        <div>
          <h2 className="text-3xl font-black text-gray-900 tracking-tight">Predictive Analytics Dashboard</h2>
          <p className="text-gray-500 mt-1 font-medium">Enterprise Leave Metrics & Audit Trails</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Monthly Trends - Bar Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Monthly Leave Trends</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.trendsData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB"/>
                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#F3F4F6'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} />
                <Bar dataKey="leaves" fill="#4f46e5" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Department Distribution - Pie Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Department Distribution</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={data.deptData} cx="50%" cy="50%" innerRadius={80} outerRadius={110} paddingAngle={5} dataKey="value">
                  {data.deptData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Peak Periods - Line Chart */}
        <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 lg:col-span-2">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Peak Application Periods</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.peakData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB"/>
                <XAxis dataKey="period" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'}} />
                <Line type="monotone" dataKey="counts" stroke="#10b981" strokeWidth={4} dot={{r: 6, fill: '#10b981', strokeWidth: 0}} activeDot={{r: 8}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Audit Logs (Admin Only) */}
        {user.role === 'Admin' && (
          <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 lg:col-span-2">
             <div className="flex items-center space-x-3 mb-6">
                <div className="bg-gray-900 p-2 rounded-lg text-white"><Shield className="w-5 h-5"/></div>
                <h3 className="text-xl font-bold text-gray-900">Enterprise Audit Logs</h3>
             </div>
             
             <div className="overflow-hidden overflow-x-auto rounded-xl border border-gray-200">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Timestamp</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Action</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Entity</th>
                      <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Actor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {auditLogs.map((log) => (
                       <tr key={log._id} className="hover:bg-gray-50">
                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                           {format(new Date(log.createdAt), 'MMM dd yyyy, h:mm a')}
                         </td>
                         <td className="px-6 py-4 whitespace-nowrap">
                           <span className={`px-3 py-1 flex w-max items-center font-bold text-xs rounded-full ${
                             log.action.includes('APPROVED') ? 'bg-green-100 text-green-700' :
                             log.action.includes('REJECTED') ? 'bg-red-100 text-red-700' :
                             'bg-indigo-100 text-indigo-700'
                           }`}>
                             {log.action}
                           </span>
                         </td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                           <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs">{log.entity}</span> <code className="text-gray-400 text-xs ml-2">{log.entityId}</code>
                         </td>
                         <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-bold">
                           {log.actorId ? log.actorId.name : 'System'} <span className="text-gray-400 font-normal ml-2">{log.actorId?.role}</span>
                         </td>
                       </tr>
                    ))}
                  </tbody>
                </table>
             </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default Analytics;
