import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAccount, useReadContract, useWriteContract, useChainId, useReadContracts } from 'wagmi';
import { ethers } from 'ethers';
import { toast } from 'react-hot-toast';
import { 
  BarChart3, 
  Users, 
  Vote, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Plus,
  ArrowRight,
  Activity,
  Target,
  Award
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { LIQUID_DEMOCRACY_ADDRESS, LIQUID_DEMOCRACY_ABI, CITY_TOKEN_ADDRESS, CITY_TOKEN_ABI } from '../config/contracts';
import ProposalCard from '../components/ProposalCard';

const Dashboard = () => {
  const { address } = useAccount();
  const chainId = useChainId();
  const [proposals, setProposals] = useState([]);
  const [isCitizen, setIsCitizen] = useState(false);
  const [tokenBalance, setTokenBalance] = useState('0');
  const [totalCitizens, setTotalCitizens] = useState(0);
  const [proposalCount, setProposalCount] = useState(0);
  const { writeContractAsync } = useWriteContract();
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerError, setRegisterError] = useState(null);

  // Contract reads
  const { data: allowance, refetch: refetchAllowance, isError: allowanceError, error: allowanceErrorDetails } = useReadContract({
    address: CITY_TOKEN_ADDRESS,
    abi: CITY_TOKEN_ABI,
    functionName: 'allowance',
    args: [address, LIQUID_DEMOCRACY_ADDRESS],
    enabled: !!address,
  });

  const { data: proposalsCount, isError: proposalsCountError, error: proposalsCountErrorDetails } = useReadContract({
    address: LIQUID_DEMOCRACY_ADDRESS,
    abi: LIQUID_DEMOCRACY_ABI,
    functionName: 'proposalCount',
    enabled: !!address,
  });

  const { data: citizenStatus, isError: citizenError, error: citizenErrorDetails } = useReadContract({
    address: LIQUID_DEMOCRACY_ADDRESS,
    abi: LIQUID_DEMOCRACY_ABI,
    functionName: 'isCitizen',
    args: [address],
    enabled: !!address,
  });

  const { data: citizensCount, isError: citizensCountError, error: citizensCountErrorDetails } = useReadContract({
    address: LIQUID_DEMOCRACY_ADDRESS,
    abi: LIQUID_DEMOCRACY_ABI,
    functionName: 'totalCitizens',
    enabled: !!address,
  });

  const { data: balance, isError: balanceError, error: balanceErrorDetails } = useReadContract({
    address: CITY_TOKEN_ADDRESS,
    abi: CITY_TOKEN_ABI,
    functionName: 'balanceOf',
    args: [address],
    enabled: !!address,
  });

  // Batch read last 6 proposals using useReadContracts
  const proposalIds = useMemo(() => (
    proposalsCount
      ? Array.from({ length: Math.min(Number(proposalsCount), 6) }, (_, i) => Number(proposalsCount) - i).sort((a, b) => b - a)
      : []
  ), [proposalsCount]);
  const proposalCalls = proposalIds.map((id) => ({
    address: LIQUID_DEMOCRACY_ADDRESS,
    abi: LIQUID_DEMOCRACY_ABI,
    functionName: 'getProposal',
    args: [id],
    chainId,
  }));
  const { data: proposalsData, isLoading: isProposalsLoading, refetch: refetchProposals, isError: proposalsError, error: proposalsErrorDetails } = useReadContracts({
    contracts: proposalCalls,
    allowFailure: true,
    enabled: proposalIds.length > 0,
  });

  // Error handling for contract reads
  useEffect(() => {
    if (allowanceError) toast.error(`Failed to load allowance: ${allowanceErrorDetails?.message || 'Unknown error'}`);
    if (proposalsCountError) toast.error(`Failed to load proposal count: ${proposalsCountErrorDetails?.message || 'Unknown error'}`);
    if (citizenError) toast.error(`Failed to check citizen status: ${citizenErrorDetails?.message || 'Unknown error'}`);
    if (citizensCountError) toast.error(`Failed to load total citizens: ${citizensCountErrorDetails?.message || 'Unknown error'}`);
    if (balanceError) toast.error(`Failed to load token balance: ${balanceErrorDetails?.message || 'Unknown error'}`);
    if (proposalsError) toast.error(`Failed to load proposals: ${proposalsErrorDetails?.message || 'Unknown error'}`);
  }, [allowanceError, allowanceErrorDetails, proposalsCountError, proposalsCountErrorDetails, citizenError, citizenErrorDetails, citizensCountError, citizensCountErrorDetails, balanceError, balanceErrorDetails, proposalsError, proposalsErrorDetails]);

  // Update state from contract reads
  useEffect(() => {
    if (citizenStatus !== undefined) setIsCitizen(citizenStatus);
  }, [citizenStatus]);

  useEffect(() => {
    if (balance) setTokenBalance(Number(ethers.utils.formatUnits(balance, 18)).toFixed(4));
  }, [balance]);

  useEffect(() => {
    if (citizensCount) setTotalCitizens(Number(citizensCount));
  }, [citizensCount]);

  useEffect(() => {
    if (proposalsCount) setProposalCount(Number(proposalsCount));
  }, [proposalsCount]);

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
        .filter(Boolean)
        .sort((a, b) => b.id - a.id); // Ensure newest first
      setProposals(loadedProposals);
    }
  }, [proposalsData, proposalIds]);

  const handleRegister = async () => {
    setIsRegistering(true);
    setRegisterError(null);
    try {
      await writeContractAsync({
        address: LIQUID_DEMOCRACY_ADDRESS,
        abi: LIQUID_DEMOCRACY_ABI,
        functionName: 'registerCitizen',
      });
      toast.success('Successfully registered as citizen!');
      setIsCitizen(true);
    } catch (error) {
      setRegisterError(error.message);
      toast.error(`Failed to register: ${error.message}`);
    } finally {
      setIsRegistering(false);
    }
  };

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      const txHash = await writeContractAsync({
        address: CITY_TOKEN_ADDRESS,
        abi: CITY_TOKEN_ABI,
        functionName: 'approve',
        args: [LIQUID_DEMOCRACY_ADDRESS, ethers.constants.MaxUint256],
      });
      
      // Wait for transaction confirmation
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.waitForTransaction(txHash);
      
      toast.success('CITY token approved!');
      
      // Refetch allowance data to update UI
      await refetchAllowance();
    } catch (error) {
      console.error('Approval error:', error);
      toast.error(`Approval failed: ${error.message}`);
    } finally {
      setIsApproving(false);
    }
  };

  const stats = [
    {
      label: "Total Citizens",
      value: totalCitizens.toString(),
      icon: Users,
      color: "text-blue-400",
      bgColor: "bg-blue-500/20",
      borderColor: "border-blue-500/30"
    },
    {
      label: "Active Proposals",
      value: proposals.filter(p => !p.executed && !p.paused && p.endTime > Math.floor(Date.now() / 1000)).length.toString(),
      icon: Vote,
      color: "text-green-400",
      bgColor: "bg-green-500/20",
      borderColor: "border-green-500/30"
    },
    {
      label: "Your CITY Tokens",
      value: tokenBalance,
      icon: Award,
      color: "text-purple-400",
      bgColor: "bg-purple-500/20",
      borderColor: "border-purple-500/30"
    },
    {
      label: "Participation Rate",
      value: proposals.length > 0 ? `${Math.round((proposals.filter(p => p.totalYesCredits > 0 || p.totalNoCredits > 0).length / proposals.length) * 100)}%` : '0%',
      icon: TrendingUp,
      color: "text-orange-400",
      bgColor: "bg-orange-500/20",
      borderColor: "border-orange-500/30"
    }
  ];

  const [isApproving, setIsApproving] = useState(false);

  if (!address) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Please connect your wallet</h2>
          <p className="text-gray-400">Connect your wallet to access the dashboard</p>
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
          <h1 className="text-3xl font-bold text-white mb-2">Governance Dashboard</h1>
          <p className="text-gray-400">Welcome to the future of decentralized governance</p>
        </motion.div>

        {/* Approve Button */}
        {allowance !== undefined && ethers.BigNumber.from(allowance).lt(ethers.utils.parseUnits('1', 18)) && (
          <div className="flex justify-center mb-6">
            <button
              onClick={handleApprove}
              disabled={isApproving}
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 text-white px-6 py-3 rounded-lg font-semibold transition-all duration-200 disabled:opacity-50 shadow-lg"
            >
              {isApproving ? 'Approving...' : 'Approve CITY Token'}
            </button>
          </div>
        )}

        {/* Registration Banner */}
        {!isCitizen && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-effect rounded-xl p-6 mb-8 border border-yellow-500/30"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-yellow-400" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-white">Register as Citizen</h3>
                  <p className="text-gray-400">Join the governance system to participate in proposals</p>
                  {registerError && <p className="text-red-400 text-sm mt-2">{registerError}</p>}
                </div>
              </div>
              <button
                onClick={handleRegister}
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white px-6 py-3 rounded-lg transition-all duration-200 font-semibold disabled:opacity-50"
                disabled={isRegistering || (allowance !== undefined && ethers.BigNumber.from(allowance).lt(ethers.utils.parseUnits('1', 18)))}
              >
                {isRegistering ? 'Registering...' : 'Register Now'}
              </button>
            </div>
          </motion.div>
        )}

        {/* Stats Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`glass-effect rounded-xl p-6 border ${stat.borderColor}`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-400 text-sm">{stat.label}</p>
                    <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 ${stat.bgColor} rounded-full flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-effect rounded-xl p-6 mb-8"
        >
          <h2 className="text-xl font-semibold text-white mb-4">Quick Actions</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Link
              to="/create-proposal"
              className="flex items-center space-x-3 p-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 hover:from-blue-500/30 hover:to-purple-500/30 rounded-lg transition-all duration-200 border border-blue-500/30"
            >
              <Plus className="w-6 h-6 text-blue-400" />
              <div>
                <p className="font-semibold text-white">Create Proposal</p>
                <p className="text-sm text-gray-400">Submit a new governance proposal</p>
              </div>
            </Link>
            <Link
              to="/proposals"
              className="flex items-center space-x-3 p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 hover:from-green-500/30 hover:to-emerald-500/30 rounded-lg transition-all duration-200 border border-green-500/30"
            >
              <Vote className="w-6 h-6 text-green-400" />
              <div>
                <p className="font-semibold text-white">View Proposals</p>
                <p className="text-sm text-gray-400">Browse all active proposals</p>
              </div>
            </Link>
            <Link
              to="/governance"
              className="flex items-center space-x-3 p-4 bg-gradient-to-r from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 rounded-lg transition-all duration-200 border border-purple-500/30"
            >
              <Users className="w-6 h-6 text-purple-400" />
              <div>
                <p className="font-semibold text-white">Governance</p>
                <p className="text-sm text-gray-400">Manage delegations & proxies</p>
              </div>
            </Link>
          </div>
        </motion.div>

        {/* Recent Proposals */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-white">Recent Proposals</h2>
            <Link
              to="/proposals"
              className="flex items-center space-x-2 text-blue-400 hover:text-blue-300 transition-colors"
            >
              <span>View All</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          
          {isProposalsLoading ? (
            <div className="glass-effect rounded-xl p-12 text-center">
              <Vote className="w-16 h-16 text-gray-400 mx-auto mb-4 animate-spin" />
              <h3 className="text-lg font-semibold text-white mb-2">Loading Proposals...</h3>
              <p className="text-gray-400 mb-4">Fetching the latest proposals from the blockchain</p>
            </div>
          ) : proposals.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {proposals.map((proposal) => (
                <ProposalCard
                  key={proposal.id}
                  proposal={proposal}
                  onProposalChanged={refetchProposals}
                />
              ))}
            </div>
          ) : (
            <div className="glass-effect rounded-xl p-12 text-center">
              <Vote className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-white mb-2">
                {proposalCount > 0
                  ? 'No active proposals at the moment. Check back soon or view all proposals.'
                  : 'No proposals found. Be the first to create a proposal and start shaping the future.'}
              </h3>
              <Link
                to="/create-proposal"
                className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg transition-all duration-200 font-semibold"
              >
                <Plus className="w-4 h-4" />
                <span>Create Proposal</span>
              </Link>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;