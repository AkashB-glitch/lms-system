import React, { useContext } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthContext } from './context/AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import Attendance from './pages/Attendance';
import Navbar from './components/Navbar';

function App() {
  const { user } = useContext(AuthContext);

  return (
    <div className="min-h-screen bg-gray-50">
      {user && <Navbar />}
      <div className="container mx-auto p-4 md:p-8">
        <Routes>
          <Route path="/login" element={!user ? <Login /> : <Navigate to="/" />} />
          <Route path="/register" element={!user ? <Register /> : <Navigate to="/" />} />
          <Route path="/" element={user ? <Dashboard /> : <Navigate to="/login" />} />
          <Route path="/attendance" element={user ? <Attendance /> : <Navigate to="/login" />} />
          <Route path="/analytics" element={user && ['Admin', 'HOD'].includes(user.role) ? <Analytics /> : <Navigate to="/" />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;
