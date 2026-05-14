import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import DashboardLayout from './pages/admin/DashboardLayout';
import CandidateHome from './pages/candidate/CandidateHome';
import TestInterface from './pages/candidate/TestInterface';
import ResultPage from './pages/candidate/ResultPage';
import { useEffect, useState } from 'react';

import TestComplete from './pages/candidate/TestComplete';

export default function App() {
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  const handleLogin = (userData: any, token: string) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <Router>
      <Routes>
        <Route path="/login" element={
          user ? (
            <Navigate to={
              user.role === 'candidate' 
                ? (user.candidateStatus === 'published' ? '/result' : '/candidate-home') 
                : '/dashboard'
            } />
          ) : (
            <Login onLogin={handleLogin} />
          )
        } />
        
        {/* Admin Routes */}
        <Route path="/dashboard/*" element={
          user && user.role !== 'candidate' ? <DashboardLayout user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
        } />

        {/* Candidate Routes */}
        <Route path="/candidate-home" element={
          user && user.role === 'candidate' ? <CandidateHome user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
        } />
        
        <Route path="/test" element={
          user && user.role === 'candidate' ? <TestInterface user={user} /> : <Navigate to="/login" />
        } />

        <Route path="/test-complete" element={<TestComplete />} />

        <Route path="/result" element={
          user && user.role === 'candidate' ? <ResultPage user={user} onLogout={handleLogout} /> : <Navigate to="/login" />
        } />

        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  );
}
