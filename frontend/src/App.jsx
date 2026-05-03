import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './AuthContext';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ProjectPage from './pages/ProjectPage';

function PrivateRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login"       element={<Login />} />
          <Route path="/register"    element={<Register />} />
          <Route path="/dashboard"   element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/project/:id" element={<PrivateRoute><ProjectPage /></PrivateRoute>} />
          <Route path="*"            element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
