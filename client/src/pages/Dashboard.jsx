import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import API from '../api';
import { format } from 'date-fns';
import { io } from 'socket.io-client';
import { Calendar, CheckCircle, Clock, AlertTriangle, XCircle, FileText, Activity } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Dashboard = () => {
  const { user } = useContext(AuthContext);
  const [leaves, setLeaves] = useState([]);
  const [pendingLeaves, setPendingLeaves] = useState([]);
  const [leaveData, setLeaveData] = useState({
    leaveType: 'Casual', startDate: '', endDate: '', reason: ''
  });
  const [notify, setNotify] = useState(null);

  const fetchData = async () => {
    try {
      const { data } = await API.get('/leave/my');
      setLeaves(data);
      
      if (['Faculty', 'HOD', 'Admin'].includes(user.role)) {
        const { data: pendingData } = await API.get('/leave/pending');
        setPendingLeaves(pendingData);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchData();

    // Setup Socket.io for Real-time Notifications
    const socketUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace('/api', '') : 'http://localhost:5000';
    const socket = io(socketUrl);
    if (user && user._id) {
      socket.emit('register', user._id);
      socket.on('notification', (payload) => {
        setNotify(payload.message);
        setTimeout(() => setNotify(null), 5000);
        fetchData();
      });
    }

    return () => socket.disconnect();
  }, [user]);

  const handleApplyLeave = async (e) => {
    e.preventDefault();
    try {
      await API.post('/leave/apply', leaveData);
      setNotify('Leave request submitted successfully.');
      setTimeout(() => setNotify(null), 3000);
      setLeaveData({ leaveType: 'Casual', startDate: '', endDate: '', reason: '' });
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message || 'Error details');
    }
  };

  const handleApprove = async (id) => {
    try {
      await API.put(`/leave/approve/${id}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message);
    }
  };

  const handleReject = async (id) => {
    try {
      await API.put(`/leave/reject/${id}`);
      fetchData();
    } catch (err) {
      alert(err.response?.data?.message);
    }
  };

  const getStatusColor = (status) => {
    if (!status) return 'bg-gray-100 text-gray-700 border-gray-200';
    if (status === 'APPROVED') return 'bg-green-50 text-green-700 border-green-200/60';
    if (status === 'REJECTED') return 'bg-red-50 text-red-700 border-red-200/60';
    if (status.startsWith('PENDING')) return 'bg-amber-50 text-amber-700 border-amber-200/60';
    return 'bg-gray-50 text-gray-700 border-gray-200/60';
  };

  return (
    <div className="space-y-8 pb-12">
      <AnimatePresence>
        {notify && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            className="fixed top-20 right-8 bg-black text-white px-6 py-3 rounded-xl shadow-2xl flex items-center space-x-3 z-50">
            <CheckCircle className="w-5 h-5 text-green-400" />
            <span className="font-semibold text-sm">{notify}</span>
          </motion.div>
        )}
      </AnimatePresence>

      <header className="bg-white p-6 md:p-8 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Dashboard Overview</h2>
          <p className="text-gray-500 mt-1 font-medium">{user.role} · {user.department}</p>
        </div>
        <div className="hidden md:flex space-x-4">
          <div className="bg-indigo-50/50 px-5 py-3 rounded-xl border border-indigo-100 flex items-center space-x-3">
             <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600"><Calendar className="w-5 h-5" /></div>
             <div>
               <p className="text-[10px] text-indigo-500 uppercase font-bold tracking-wider">Today's Date</p>
               <p className="text-sm font-bold text-indigo-950">{format(new Date(), 'MMMM do, yyyy')}</p>
             </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {['Student', 'Faculty', 'HOD'].includes(user.role) && (
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="xl:col-span-1 border-gray-100">
            <div className="bg-white p-6 md:p-8 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 sticky top-24">
              <div className="flex items-center space-x-3 mb-8">
                <div className="bg-indigo-50 p-2.5 rounded-xl text-indigo-600"><FileText className="w-6 h-6" /></div>
                <h3 className="text-xl font-bold text-gray-900">Request Time Off</h3>
              </div>
              <form onSubmit={handleApplyLeave} className="space-y-5">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Leave Category</label>
                  <select className="w-full border border-gray-200 bg-gray-50 rounded-xl py-3.5 px-4 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-shadow outline-none" value={leaveData.leaveType} onChange={e=>setLeaveData({...leaveData, leaveType: e.target.value})}>
                    <option value="Casual">Casual Leave</option>
                    <option value="Medical">Medical Leave</option>
                    <option value="OD">On Duty (OD)</option>
                    <option value="Emergency">Emergency</option>
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">From</label>
                    <input type="date" required className="w-full border border-gray-200 bg-gray-50 rounded-xl py-3.5 px-4 focus:ring-2 focus:ring-indigo-500 transition-shadow text-sm outline-none" value={leaveData.startDate} onChange={e=>setLeaveData({...leaveData, startDate: e.target.value})} />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1.5">To</label>
                    <input type="date" required className="w-full border border-gray-200 bg-gray-50 rounded-xl py-3.5 px-4 focus:ring-2 focus:ring-indigo-500 transition-shadow text-sm outline-none" value={leaveData.endDate} onChange={e=>setLeaveData({...leaveData, endDate: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-1.5">Reason for Leave</label>
                  <textarea required className="w-full border border-gray-200 bg-gray-50 rounded-xl py-3.5 px-4 focus:ring-2 focus:ring-indigo-500 transition-shadow outline-none" rows="3" placeholder="Briefly explain..." value={leaveData.reason} onChange={e=>setLeaveData({...leaveData, reason: e.target.value})}></textarea>
                </div>
                <button type="submit" className="w-full bg-gray-900 text-white font-bold py-3.5 px-4 rounded-xl hover:bg-gray-800 transition-all shadow-xl shadow-gray-200/50 mt-2">
                  Submit Request
                </button>
              </form>
            </div>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className={['Student', 'Faculty', 'HOD'].includes(user.role) ? 'xl:col-span-2' : 'xl:col-span-3'}>
          <div className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 overflow-hidden mb-8">
            <div className="p-6 md:p-8 border-b border-gray-100 flex items-center space-x-3">
               <div className="bg-blue-50 p-2.5 rounded-xl text-blue-600"><Clock className="w-5 h-5"/></div>
               <h3 className="text-xl font-bold text-gray-900">My Applications</h3>
            </div>
            
            {leaves.length === 0 ? (
               <div className="p-16 text-center">
                 <div className="inline-block p-5 bg-gray-50 rounded-full mb-4"><Activity className="w-8 h-8 text-gray-400"/></div>
                 <p className="text-gray-500 font-semibold text-lg">No leave history found.</p>
                 <p className="text-gray-400 text-sm mt-1">Your approved and pending leaves will appear here.</p>
               </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-100">
                  <thead className="bg-gray-50/50">
                    <tr>
                      <th className="px-8 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Type & Reason</th>
                      <th className="px-8 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Duration</th>
                      <th className="px-8 py-5 text-left text-xs font-bold text-gray-500 uppercase tracking-widest">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {leaves.map((leave, i) => (
                      <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} key={leave._id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-8 py-5">
                          <div className="font-bold text-gray-900 mb-0.5">{leave.leaveType}</div>
                          <div className="text-sm text-gray-500 truncate max-w-sm">{leave.reason}</div>
                        </td>
                        <td className="px-8 py-5 whitespace-nowrap text-sm text-gray-700 font-semibold">
                          {format(new Date(leave.startDate), 'MMM dd')} <span className="text-gray-300 mx-1">—</span> {format(new Date(leave.endDate), 'MMM dd')}
                        </td>
                        <td className="px-8 py-5 whitespace-nowrap">
                          <div className="flex flex-col space-y-1">
                            <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold border ${getStatusColor(leave.status)}`}>
                              {leave.status === 'Approved' ? <CheckCircle className="w-3.5 h-3.5 mr-1.5"/> : leave.status === 'Rejected' ? <XCircle className="w-3.5 h-3.5 mr-1.5"/> : <Clock className="w-3.5 h-3.5 mr-1.5"/>}
                              {leave.status}
                            </span>
                            {leave.isLateRequest && (
                              <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200/60">
                                LATE REQUEST
                              </span>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {['Faculty', 'HOD', 'Admin'].includes(user.role) && (
            <div className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 overflow-hidden border-t-4 border-t-rose-500">
               <div className="p-6 md:p-8 flex items-center justify-between border-b border-gray-100">
                 <div className="flex items-center space-x-3">
                   <div className="bg-rose-50 p-2.5 rounded-xl text-rose-600"><AlertTriangle className="w-5 h-5"/></div>
                   <h3 className="text-xl font-bold text-gray-900">Action Required: Pending Approvals</h3>
                 </div>
                 <span className="bg-rose-100 text-rose-700 text-xs font-bold px-3 py-1.5 rounded-lg border border-rose-200">{pendingLeaves.length} PENDING</span>
               </div>
              {pendingLeaves.length === 0 ? (
                <div className="p-16 text-center text-gray-500 font-medium">All caught up! No pending requests for your approval.</div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-100">
                    <tbody className="divide-y divide-gray-100">
                      {pendingLeaves.map(leave => (
                        <tr key={leave._id} className="hover:bg-gray-50/50 transition-colors">
                          <td className="px-8 py-6">
                            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                              <div className="flex-1">
                                <div className="font-bold text-gray-900 text-lg mb-1">{leave.userId?.name} <span className="text-sm font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md ml-2">{leave.userId?.department}</span></div>
                                
                                <div className="flex flex-wrap items-center gap-3 mt-3 mb-3">
                                  <div className="text-xs font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 inline-block px-2.5 py-1 rounded-md">{leave.leaveType}</div>
                                  <div className="text-sm text-gray-600 font-medium flex items-center"><Calendar className="w-4 h-4 mr-1.5 text-gray-400"/> {format(new Date(leave.startDate), 'MMM dd')} - {format(new Date(leave.endDate), 'MMM dd')}</div>
                                </div>
                                
                                <p className="text-sm text-gray-600 bg-gray-50/80 p-3.5 rounded-xl border border-gray-100/80 italic leading-relaxed">"{leave.reason}"</p>
                              </div>
                              <div className="flex flex-col items-start md:items-end space-y-3 w-full md:w-auto">
                                {leave.isHighRisk && (
                                  <span className="px-3 py-1.5 inline-flex flex-row items-center text-xs font-bold rounded-lg bg-rose-50 text-rose-700 border border-rose-200">
                                    <AlertTriangle className="w-3.5 h-3.5 mr-1.5"/> AI Alert: Risk Score {leave.riskScore}
                                  </span>
                                )}
                                <div className="flex space-x-3 w-full md:w-auto">
                                  <button onClick={() => handleReject(leave._id)} className="flex-1 md:flex-none bg-white text-gray-600 font-bold px-5 py-2.5 rounded-xl hover:bg-gray-50 hover:text-red-600 transition-colors border border-gray-200">
                                    Reject
                                  </button>
                                  <button onClick={() => handleApprove(leave._id)} className="flex-1 md:flex-none bg-gray-900 text-white font-bold px-5 py-2.5 rounded-xl hover:bg-gray-800 transition-colors shadow-lg shadow-gray-200/50">
                                    Approve
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;
