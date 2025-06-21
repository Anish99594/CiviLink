import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useAccount } from 'wagmi';
import { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Dashboard from './pages/Dashboard';
import Proposals from './pages/Proposals';
import CreateProposal from './pages/CreateProposal';
import Governance from './pages/Governance';
import Profile from './pages/Profile';

function AnimatedRoutes() {
  const { isConnected } = useAccount();
  const location = useLocation();
  const pageRef = useRef();

  useLayoutEffect(() => {
    if (pageRef.current) {
      gsap.fromTo(
        pageRef.current,
        { opacity: 0, y: 40 },
        { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }
      );
    }
  }, [location.pathname]);

  return (
    <div ref={pageRef}>
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/dashboard" element={isConnected ? <Dashboard /> : <Home />} />
        <Route path="/proposals" element={isConnected ? <Proposals /> : <Home />} />
        <Route path="/create-proposal" element={isConnected ? <CreateProposal /> : <Home />} />
        <Route path="/governance" element={isConnected ? <Governance /> : <Home />} />
        <Route path="/profile" element={isConnected ? <Profile /> : <Home />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gradient-to-br from-dark-900 via-dark-800 to-dark-900">
        <Navbar />
        <AnimatedRoutes />
      </div>
    </Router>
  );
}

export default App; 