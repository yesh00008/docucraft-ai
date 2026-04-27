import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import MainLayout from './components/layout/MainLayout';
import Home from './pages/Home';
import SignIn from './pages/SignIn';
import SignUp from './pages/SignUp';
import AboutUs from './pages/AboutUs';

// Protected Route Component (Commented out for testing the chat page without auth)
// const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
//   const { user, isLoading } = useAuth();
//   
//   if (isLoading) {
//     return <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">Loading...</div>;
//   }
//   
//   if (!user) {
//     return <Navigate to="/signin" replace />;
//   }
//   
//   return <>{children}</>;
// };

function AppRoutes() {
  return (
    <Router>
      <Routes>
        <Route element={<MainLayout />}>
          {/* Public Routes */}
          <Route path="/signin" element={<SignIn />} />
          <Route path="/signup" element={<SignUp />} />
          <Route path="/about" element={<AboutUs />} />
          
          {/* Make Home public for testing the Chat Page */}
          <Route 
            path="/" 
            element={<Home />} 
          />
        </Route>
      </Routes>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
