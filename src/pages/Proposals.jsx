import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAccount, useReadContract, useChainId, useReadContracts } from 'wagmi';
import { 
  Search, 
  Filter, 
  Grid, 
  List, 
  Calendar, 
  Users, 
  TrendingUp,
  Plus,
  ArrowRight
} from 'lucide-react';
import { Link } from 'react-router-dom';
import ProposalCard from '../components/ProposalCard';
import { LIQUID_DEMOCRACY_ADDRESS, LIQUID_DEMOCRACY_ABI } from '../config/contracts';
import { toast } from 'react-hot-toast';

const Proposals = () => {
  const { address } = useAccount();
  const [proposals, setProposals] = useState([]);
  const [filteredProposals, setFilteredProposals] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [viewMode, setViewMode] = useState('grid');
  const [isLoading, setIsLoading] = useState(true); // Initial loading state
  const chainId = useChainId();

  // Contract reads
  const { data: proposalsCount, isError: proposalsCountError, error: proposalsCountErrorDetails } = useReadContract({
    address: LIQUID_DEMOCRACY_ADDRESS,
    abi: LIQUID_DEMOCRACY_ABI,
    functionName: 'proposalCount',
    enabled: !!address,
  });

  // Batch read all proposals using useReadContracts
  const proposalIds = useMemo(() => (
    proposalsCount ? Array.from({ length: Number(proposalsCount) }, (_, i) => i + 1) : []
  ), [proposalsCount]);
  const proposalCalls = proposalIds.map((id) => ({
    address: LIQUID_DEMOCRACY_ADDRESS,
    abi: LIQUID_DEMOCRACY_ABI,
    functionName: 'getProposal',
    args: [id],
    chainId,
  }));
  const { data: proposalsData, isLoading: proposalsLoading, refetch: refetchProposals, isError: proposalsError, error: proposalsErrorDetails } = useReadContracts({
    contracts: proposalCalls,
    allowFailure: true,
    enabled: proposalIds.length > 0,
  });

  const categories = [
    { id: 'all', name: 'All Categories', color: 'text-gray-400' },
    { id: '0', name: 'Governance', color: 'text-blue-400' },
    { id: '1', name: 'Infrastructure', color: 'text-green-400' },
    { id: '2', name: 'Policy', color: 'text-purple-400' },
    { id: '3', name: 'Development', color: 'text-orange-400' }
  ];

  const statuses = [
    { id: 'all', name: 'All Status', color: 'text-gray-400' },
    { id: 'active', name: 'Active', color: 'text-green-400' },
    { id: 'ended', name: 'Ended', color: 'text-gray-400' },
    { id: 'executed', name: 'Executed', color: 'text-blue-400' },
    { id: 'paused', name: 'Paused', color: 'text-red-400' }
  ];

  // Error handling for contract reads
  useEffect(() => {
    if (proposalsCountError) toast.error(`Failed to load proposal count: ${proposalsCountErrorDetails?.message || 'Unknown error'}`);
    if (proposalsError) toast.error(`Failed to load proposals: ${proposalsErrorDetails?.message || 'Unknown error'}`);
  }, [proposalsCountError, proposalsCountErrorDetails, proposalsError, proposalsErrorDetails]);

  // Update isLoading based on proposalsLoading
  useEffect(() => {
    setIsLoading(proposalsLoading);
  }, [proposalsLoading]);

  // Update proposals state
  useEffect(() => {
    if (proposalsData && proposalIds.length > 0) {
      const loadedProposals = proposalsData
        .map((result, idx) => {
          if (!result?.result || result.status === 'failure') return null;
          const proposal = result.result;
          return {
            id: proposalIds[idx],
            description: proposal[0],
            category: Number(proposal[1]),
            endTime: Number(proposal[2]),
            targetAddress: proposal[3],
            allocatedAmount: proposal[4],
            totalYesCredits: Number(proposal[5]),
            totalNoCredits: Number(proposal[6]),
            vetoVotes: Number(proposal[7]),
            executed: proposal[8],
            paused: proposal[9]
          };
        })
        .filter(Boolean);
      setProposals(loadedProposals);
    }
  }, [proposalsData, proposalIds]);

  // Filter proposals
  useEffect(() => {
    let filtered = proposals;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(proposal =>
        proposal.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(proposal => proposal.category === parseInt(selectedCategory));
    }

    // Filter by status
    if (selectedStatus !== 'all') {
      const now = Math.floor(Date.now() / 1000);
      filtered = filtered.filter(proposal => {
        switch (selectedStatus) {
          case 'active':
            return !proposal.executed && !proposal.paused && proposal.endTime > now;
          case 'ended':
            return !proposal.executed && !proposal.paused && proposal.endTime <= now;
          case 'executed':
            return proposal.executed;
          case 'paused':
            return proposal.paused;
          default:
            return true;
        }
      });
    }

    setFilteredProposals(filtered);
  }, [proposals, searchTerm, selectedCategory, selectedStatus]);

  const getStats = () => {
    const now = Math.floor(Date.now() / 1000);
    const active = proposals.filter(p => !p.executed && !p.paused && p.endTime > now).length;
    const ended = proposals.filter(p => !p.executed && !p.paused && p.endTime <= now).length;
    const executed = proposals.filter(p => p.executed).length;
    const paused = proposals.filter(p => p.paused).length;

    return { active, ended, executed, paused };
  };

  const stats = getStats();

  if (!address) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Please connect your wallet</h2>
          <p className="text-gray-400">Connect your wallet to view proposals</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">All Proposals</h1>
              <p className="text-gray-400">Browse and participate in community governance proposals</p>
            </div>
            <Link
              to="/create-proposal"
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg transition-all duration-200 font-semibold flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Create Proposal</span>
            </Link>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="glass-effect rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-green-400">{stats.active}</div>
              <div className="text-sm text-gray-400">Active</div>
            </div>
            <div className="glass-effect rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-gray-400">{stats.ended}</div>
              <div className="text-sm text-gray-400">Ended</div>
            </div>
            <div className="glass-effect rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-400">{stats.executed}</div>
              <div className="text-sm text-gray-400">Executed</div>
            </div>
            <div className="glass-effect rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-red-400">{stats.paused}</div>
              <div className="text-sm text-gray-400">Paused</div>
            </div>
          </div>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-effect rounded-xl p-6 mb-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search proposals..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-4">
              {/* Category Filter */}
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-gray-400" />
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="bg-gray-800/50 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>{category.name}</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="bg-gray-800/50 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                {statuses.map((status) => (
                  <option key={status.id} value={status.id}>{status.name}</option>
                ))}
              </select>

              {/* View Mode */}
              <div className="flex items-center space-x-1 bg-gray-800/50 rounded-lg p-1">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded transition-colors ${
                    viewMode === 'grid' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded transition-colors ${
                    viewMode === 'list' ? 'bg-blue-500 text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Proposals Grid/List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {isLoading ? (
            <div className="glass-effect rounded-xl p-12 text-center">
              <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-400">Loading proposals...</p>
            </div>
          ) : filteredProposals.length > 0 ? (
            <div className={`grid ${viewMode === 'grid' ? 'md:grid-cols-2 lg:grid-cols-3 gap-6' : 'grid-cols-1 gap-3'}`}>
              {filteredProposals.map((proposal) => (
                <ProposalCard
                  key={proposal.id}
                  proposal={proposal}
                  onProposalChanged={refetchProposals}
                />
              ))}
            </div>
          ) : (
            <div className="glass-effect rounded-xl p-12 text-center">
              <div className="w-16 h-16 bg-gray-800/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">No proposals found</h3>
              <p className="text-gray-400 mb-6">
                {searchTerm || selectedCategory !== 'all' || selectedStatus !== 'all'
                  ? 'Try adjusting your filters or search terms.'
                  : 'Be the first to create a proposal and start shaping the future.'}
              </p>
              {!searchTerm && selectedCategory === 'all' && selectedStatus === 'all' && (
                <Link
                  to="/create-proposal"
                  className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg transition-all duration-200 font-semibold"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Proposal</span>
                </Link>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Proposals;