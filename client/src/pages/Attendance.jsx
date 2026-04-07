import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../context/AuthContext';
import API from '../api';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { CheckCircle, AlertTriangle, Activity, MapPin, Layers, Clock, XCircle } from 'lucide-react';
import { format } from 'date-fns';

const Attendance = () => {
  const { user } = useContext(AuthContext);
  const [data, setData] = useState({ overall: 0, totalClasses: 0, totalPresent: 0, totalAbsent: 0, totalLeave: 0, warning: null, requiredNext: 0, insights: [], records: [] });
  const [markingData, setMarkingData] = useState({ studentIds: '', date: format(new Date(), 'yyyy-MM-dd'), status: 'PRESENT' });
  const [disputes, setDisputes] = useState([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        if (['Student', 'Admin'].includes(user.role)) {
           const { data: analytics } = await API.get('/attendance/student');
           setData(analytics);
        }
        if (['Faculty', 'Admin'].includes(user.role)) {
           const { data: pendingDisputes } = await API.get('/attendance/disputes/pending');
           setDisputes(pendingDisputes);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchAnalytics();
  }, [user]);

  const requestDispute = async (id) => {
     const reason = prompt("Explain why this absence mark is incorrect:");
     if (!reason) return;
     try {
       await API.post(`/attendance/dispute/${id}`, { reason });
       alert("Dispute pushed to faculty successfully!");
       window.location.reload();
     } catch (err) {
       alert(err.response?.data?.message);
     }
  };

  const resolveDispute = async (id, approved) => {
     try {
       await API.post(`/attendance/dispute/${id}/resolve`, { approved });
       window.location.reload();
     } catch (err) {
       alert(err.response?.data?.message);
     }
  };

  const handleMarkAttendance = async (e) => {
    e.preventDefault();
    try {
      const sIds = markingData.studentIds.split(',').map(s => s.trim());
      await API.post('/attendance/mark', { ...markingData, studentIds: sIds });
      alert("Attendance records updated!");
      setMarkingData({...markingData, studentIds: ''});
    } catch (err) {
      alert(err.response?.data?.message || "Error");
    }
  };

  const debugInjectAbsence = async () => {
    try {
      await API.post('/attendance/inject-demo');
      window.location.reload();
    } catch(err) {
      alert("Error: " + err.message);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <header className="bg-white p-6 md:p-8 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 flex items-center justify-between">
        <div>
          <h2 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">Attendance & Tracking</h2>
          <p className="text-gray-500 mt-1 font-medium">{user.role} Module</p>
        </div>
      </header>

      {['Faculty', 'Admin'].includes(user.role) && (
        <div className="bg-white p-6 md:p-8 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 border-t-4 border-indigo-500">
          <div className="flex items-center space-x-3 mb-6">
             <div className="bg-indigo-50 p-2.5 rounded-xl text-indigo-600"><MapPin className="w-6 h-6"/></div>
             <h3 className="text-xl font-bold text-gray-900">Mark Global Daily Attendance</h3>
          </div>
          <form onSubmit={handleMarkAttendance} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
             <div>
               <label className="block text-sm font-bold text-gray-700 mb-2">Date</label>
               <input type="date" required className="w-full border-gray-200 bg-gray-50 rounded-xl py-3 px-4 outline-none" value={markingData.date} onChange={e=>setMarkingData({...markingData, date: e.target.value})} />
             </div>
             <div>
               <label className="block text-sm font-bold text-gray-700 mb-2">Status Marking</label>
               <select className="w-full border-gray-200 bg-gray-50 rounded-xl py-3 px-4 outline-none" value={markingData.status} onChange={e=>setMarkingData({...markingData, status: e.target.value})}>
                 <option value="PRESENT">Present</option>
                 <option value="ABSENT">Absent</option>
               </select>
             </div>
             <div className="lg:col-span-4">
               <label className="block text-sm font-bold text-gray-700 mb-2">Target Student Names</label>
               <textarea className="w-full border-gray-200 bg-gray-50 rounded-xl py-3 px-4 outline-none font-medium" placeholder="Type specific names (e.g. John Doe), or type 'ALL' to mark entire class..." value={markingData.studentIds} onChange={e=>setMarkingData({...markingData, studentIds: e.target.value})}></textarea>
             </div>
             <button type="submit" className="lg:col-span-1 bg-gray-900 text-white font-bold py-3 px-4 rounded-xl hover:bg-gray-800 shadow-xl">Mark Entries</button>
          </form>
        </div>
      )}

      {['Faculty', 'Admin'].includes(user.role) && disputes.length > 0 && (
        <div className="bg-white rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-amber-200 overflow-hidden mt-8 border-t-4 border-t-amber-500">
           <div className="p-6 md:p-8 flex items-center justify-between border-b border-gray-100">
             <div className="flex items-center space-x-3">
               <div className="bg-amber-50 p-2.5 rounded-xl text-amber-600"><AlertTriangle className="w-5 h-5"/></div>
               <h3 className="text-xl font-bold text-gray-900">Pending Reviews: Attendance Disputes</h3>
             </div>
           </div>
           <div className="overflow-x-auto">
             <table className="min-w-full divide-y divide-gray-100">
               <tbody className="divide-y divide-gray-100">
                 {disputes.map(d => (
                   <tr key={d._id} className="hover:bg-gray-50/50">
                     <td className="px-8 py-5">
                       <div className="font-bold text-gray-900">{d.studentId?.name || "Unknown"} <span className="font-medium text-xs text-gray-500 ml-2">{d.studentId?.department}</span></div>
                       <div className="text-sm font-semibold text-gray-600 mt-1">{format(new Date(d.date), 'MMM do, yyyy')} — <span className="italic">"{d.disputeReason}"</span></div>
                     </td>
                     <td className="px-8 py-5 text-right w-64">
                       <button onClick={()=>resolveDispute(d._id, false)} className="text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 px-4 py-2 rounded-lg transition-colors border border-red-200 mr-2">Reject</button>
                       <button onClick={()=>resolveDispute(d._id, true)} className="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 px-4 py-2 rounded-lg transition-colors border border-indigo-500">Fix & Approve</button>
                     </td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </div>
      )}

      {['Student'].includes(user.role) && (
        <>
          {data.warning && (
            <div className={`p-5 rounded-2xl flex border-2 box-border shadow-lg ${data.warning.includes('CRITICAL') ? 'bg-red-50 text-red-800 border-red-500 shadow-red-200' : 'bg-orange-50 text-orange-800 border-orange-500 shadow-orange-200'}`}>
              <AlertTriangle className="w-7 h-7 mr-4"/>
              <div>
                <h3 className="font-extrabold text-lg">{data.warning}</h3>
                {data.requiredNext > 0 && <p className="font-medium mt-1">Predictions actively show you must attend your next <b>{data.requiredNext}</b> classes sequentially to bridge the 75% threshold limit safely.</p>}
              </div>
            </div>
          )}

          <div className="space-y-8">
            <div className="bg-white p-6 rounded-2xl shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-gray-100 mt-2 relative">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-gray-900">Attendance History Log</h3>
                <button onClick={debugInjectAbsence} className="text-xs uppercase tracking-widest font-bold bg-gray-900 text-white px-4 py-2 rounded-lg hover:bg-gray-800 shadow-xl border-b-4 border-gray-950 active:border-b-0 active:translate-y-1 transition-all">
                  DEMO: Generate Absent Record
                </button>
              </div>
              
              {data.records.length === 0 ? (
                 <div className="text-center p-8 text-gray-500 italic font-medium bg-gray-50 rounded-xl">
                   No historical attendance records tracked yet. Click the Demo button above to inject one!
                 </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-100">
                    <thead className="bg-gray-50/50">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Date</th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {[...data.records].sort((a,b)=>new Date(b.date)-new Date(a.date)).map((r) => (
                        <tr key={r._id} className="hover:bg-gray-50/40">
                          <td className="px-6 py-4 font-semibold text-gray-800">{format(new Date(r.date), 'MMMM do, yyyy')}</td>
                          <td className="px-6 py-4">
                             <div className="flex items-center space-x-3">
                               <span className={`px-3 py-1 rounded-lg text-xs font-bold border ${r.status === 'PRESENT' ? 'bg-green-50 border-green-200 text-green-700' : r.status === 'LEAVE' ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-red-50 border-red-200 text-red-700'}`}>
                                 {r.status}
                               </span>
                               {r.status === 'ABSENT' && (!r.disputeStatus || r.disputeStatus === 'NONE' || r.disputeStatus === 'REJECTED') && (
                                  <button onClick={() => requestDispute(r._id)} className="text-xs font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1 rounded-lg transition-colors border border-indigo-200">Dispute Incorrect Absence</button>
                               )}
                               {r.disputeStatus === 'PENDING_REVIEW' && (
                                  <span className="text-xs font-bold text-amber-600 bg-amber-50 px-3 py-1 rounded-lg border border-amber-200">Faculty Review Pendng</span>
                               )}
                               {r.status === 'PRESENT' && r.disputeStatus === 'APPROVED' && (
                                  <span className="text-[10px] uppercase font-black tracking-wider text-green-500 bg-green-50 border border-green-100 px-2 py-0.5 rounded">Dispute Won</span>
                               )}
                             </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default Attendance;
