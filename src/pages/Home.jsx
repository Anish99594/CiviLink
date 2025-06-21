import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { 
  Vote, 
  Users, 
  Shield, 
  TrendingUp, 
  Globe, 
  Zap,
  ArrowRight,
  CheckCircle,
  Star,
  Plus
} from 'lucide-react';
import { useRef, useLayoutEffect } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
gsap.registerPlugin(ScrollTrigger);

const Home = () => {
  const features = [
    {
      icon: Vote,
      title: "Liquid Democracy",
      description: "Delegate your voting power or vote directly on proposals with quadratic voting system."
    },
    {
      icon: Shield,
      title: "Veto Mechanism",
      description: "Strong opposition can pause proposals with a 10% veto threshold."
    },
    {
      icon: Users,
      title: "Proxy Voting",
      description: "Assign proxies for offline voting and maintain participation."
    },
    {
      icon: TrendingUp,
      title: "Reputation System",
      description: "Build reputation through consistent voting patterns and delegation."
    }
  ];

  const stats = [
    { label: "Active Citizens", value: "1,234", icon: Users },
    { label: "Total Proposals", value: "89", icon: Vote },
    { label: "Success Rate", value: "94%", icon: CheckCircle },
    { label: "Avg Participation", value: "78%", icon: TrendingUp }
  ];

  const heroRef = useRef();
  const statsRef = useRef();

  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      // Hero entrance timeline
      const tl = gsap.timeline();
      tl.from('.hero-gradient-bg', { opacity: 0, scale: 1.1, duration: 1.2, ease: 'power2.out' })
        .from('.hero-title', { y: 80, opacity: 0, duration: 1, ease: 'power4.out' }, '-=0.8')
        .from('.hero-subtitle', { y: 40, opacity: 0, duration: 1, delay: 0.1, ease: 'power4.out' }, '-=0.7')
        .from('.hero-cta', { scale: 0.8, opacity: 0, duration: 0.8, delay: 0.1, ease: 'back.out(1.7)' }, '-=0.7')
        .from('.hero-stats .stat', { y: 60, opacity: 0, stagger: 0.12, duration: 0.7, ease: 'power3.out' }, '-=0.5');

      // Stats parallax on scroll
      if (statsRef.current) {
        gsap.utils.toArray('.stat').forEach((el, i) => {
          gsap.fromTo(el, {
            y: 40,
            opacity: 0.7,
          }, {
            y: 0,
            opacity: 1,
            duration: 1,
            scrollTrigger: {
              trigger: el,
              start: 'top 80%',
              toggleActions: 'play none none reverse',
            },
            delay: i * 0.1,
          });
        });
      }
    }, heroRef);
    return () => ctx.revert();
  }, []);

  return (
    <div className="min-h-screen" ref={heroRef}>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="hero-gradient-bg absolute inset-0 bg-gradient-to-br from-blue-600/20 via-purple-600/20 to-cyan-600/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center">
            <h1 className="hero-title text-5xl md:text-7xl font-bold mb-6">
              <span className="gradient-text">Liquid Democracy</span>
              <br />
              <span className="text-white">for Network States</span>
            </h1>
            <p className="hero-subtitle text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
              Revolutionary governance system combining direct democracy, delegation, 
              and quadratic voting for truly decentralized decision-making.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <span className="hero-cta"><ConnectButton /></span>
              <span className="hero-cta">
                <Link
                  to="/dashboard"
                  className="inline-flex items-center space-x-2 bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-lg transition-all duration-200 border border-white/20"
                >
                  <span>Explore Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-white mb-4">
              Revolutionary Governance Features
            </h2>
            <p className="text-xl text-gray-300 max-w-2xl mx-auto">
              Experience the future of decentralized governance with our cutting-edge features
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div
                  key={index}
                  className="glass-effect rounded-xl p-6 text-center hover:shadow-lg transition-all duration-300"
                >
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Icon className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-3">{feature.title}</h3>
                  <p className="text-gray-400">{feature.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-dark-800/50 to-dark-900/50 hero-stats" ref={statsRef}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div
                  key={index}
                  className="stat text-center"
                >
                  <div className="w-16 h-16 bg-gradient-to-r from-blue-500/20 to-purple-600/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
                    <Icon className="w-8 h-8 text-blue-400" />
                  </div>
                  <div className="text-3xl font-bold text-white mb-2">{stat.value}</div>
                  <div className="text-gray-400">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div>
            <h2 className="text-4xl font-bold text-white mb-6">
              Ready to Shape the Future?
            </h2>
            <p className="text-xl text-gray-300 mb-8">
              Join thousands of citizens already participating in the most advanced 
              governance system ever created.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <ConnectButton />
              <Link
                to="/create-proposal"
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-3 rounded-lg transition-all duration-200 font-semibold"
              >
                <Plus className="w-5 h-5" />
                <span>Create Proposal</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home; 