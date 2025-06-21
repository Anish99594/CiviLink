import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useAccount, useReadContract, useChainId, useReadContracts } from 'wagmi';
import { ethers } from 'ethers';
import { toast } from 'react-hot-toast';
import { 
  User, 
  Award, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle,
  FileText,
  Users,
  Shield,
  Activity,
  Copy,
  ExternalLink,
  Calendar,
  Target,
  Zap,
  Vote
} from 'lucide-react';
import { LIQUID_DEMOCRACY_ADDRESS, LIQUID_DEMOCRACY_ABI, CITY_TOKEN_ADDRESS, CITY_TOKEN_ABI } from '../config/contracts';

const Profile = () => {
  const { address } = useAccount();
  const chainId = useChainId();
  const [tokenBalance, setTokenBalance] = useState('0');
  const [isCitizen, setIsCitizen] = useState(false);
  const [reputation, setReputation] = useState(0);
  const [votingHistory, setVotingHistory] = useState([]);
  const [delegation, setDelegation] = useState(null);
  const [proposals, setProposals] = useState([]);

  // Contract reads
  const { data: citizenStatus } = useReadContract({
    address: LIQUID_DEMOCRACY_ADDRESS,
    abi: LIQUID_DEMOCRACY_ABI,
    functionName: 'isCitizen',
    args: [address],
  });

  const { data: balance } = useReadContract({
    address: CITY_TOKEN_ADDRESS,
    abi: CITY_TOKEN_ABI,
    functionName: 'balanceOf',
    args: [address],
  });

  const { data: delegationData } = useReadContract({
    address: LIQUID_DEMOCRACY_ADDRESS,
    abi: LIQUID_DEMOCRACY_ABI,
    functionName: 'delegations',
    args: [address],
  });

  // Get proposal count
  const { data: proposalsCount } = useReadContract({
    address: LIQUID_DEMOCRACY_ADDRESS,
    abi: LIQUID_DEMOCRACY_ABI,
    functionName: 'proposalCount',
    enabled: !!address,
  });

  // Get all proposals
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
  const { data: proposalsData, isLoading: proposalsLoading } = useReadContracts({
    contracts: proposalCalls,
    allowFailure: true,
    enabled: proposalIds.length > 0,
  });

  // For each proposal, check if user has voted or vetoed
  const hasVotedCalls = proposalIds.map((id) => ({
    address: LIQUID_DEMOCRACY_ADDRESS,
    abi: LIQUID_DEMOCRACY_ABI,
    functionName: 'hasVoted',
    args: [id, address],
    chainId,
  }));
  const hasVetoedCalls = proposalIds.map((id) => ({
    address: LIQUID_DEMOCRACY_ADDRESS,
    abi: LIQUID_DEMOCRACY_ABI,
    functionName: 'hasVetoed',
    args: [id, address],
    chainId,
  }));
  const { data: votedData } = useReadContracts({
    contracts: hasVotedCalls,
    allowFailure: true,
    enabled: proposalIds.length > 0,
  });
  const { data: vetoedData } = useReadContracts({
    contracts: hasVetoedCalls,
    allowFailure: true,
    enabled: proposalIds.length > 0,
  });

  useEffect(() => {
    if (citizenStatus !== undefined) {
      setIsCitizen(citizenStatus);
    }
  }, [citizenStatus]);

  useEffect(() => {
    if (balance) {
      setTokenBalance(Number(ethers.utils.formatUnits(balance, 18)).toFixed(4));
    }
  }, [balance]);

  useEffect(() => {
    if (delegationData) {
      setDelegation({
        delegate: delegationData[0],
        startTime: Number(delegationData[1]),
        reputation: Number(delegationData[2]),
      });
    }
  }, [delegationData]);

  // Build voting history from proposals and user votes
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

  // Calculate reputation (simple: number of votes + delegations)
  useEffect(() => {
    let score = 0;
    proposals.forEach(vote => {
      if (vote.executed) {
        score += vote.voted ? 10 : 5;
      }
      score += 1;
    });
    if (delegation && delegation.reputation) {
      score += delegation.reputation;
    }
    setReputation(score);
  }, [proposals, delegation]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Address copied to clipboard');
  };

  const getShortAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const stats = [
    {
      label: "CITY Tokens",
      value: tokenBalance,
      icon: Award,
      color: "text-purple-400",
      bgColor: "bg-purple-500/20"
    },
    {
      label: "Reputation Score",
      value: reputation.toString(),
      icon: TrendingUp,
      color: "text-blue-400",
      bgColor: "bg-blue-500/20"
    },
    {
      label: "Votes Cast",
      value: proposals.length.toString(),
      icon: Vote,
      color: "text-green-400",
      bgColor: "bg-green-500/20"
    },
    {
      label: "Active Delegation",
      value: delegation && delegation.delegate && delegation.delegate !== ethers.constants.AddressZero ? getShortAddress(delegation.delegate) : 'None',
      icon: Users,
      color: "text-orange-400",
      bgColor: "bg-orange-500/20"
    }
  ];

  if (!address) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Please connect your wallet</h2>
          <p className="text-gray-400">Connect your wallet to view your profile</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2">Your Profile</h1>
          <p className="text-gray-400">View your on-chain governance activity and stats</p>
        </motion.div>

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
                className={`glass-effect rounded-xl p-6`}
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

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Voting History */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="glass-effect rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-6">Recent Voting History</h3>
              <div className="space-y-4">
                {proposals.length === 0 ? (
                  <div className="text-gray-400 text-center">No voting history found.</div>
                ) : proposals.map((vote, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                    <div className="flex-1">
                      <p className="text-white font-medium line-clamp-1">{vote.description}</p>
                      <p className="text-sm text-gray-400">{vote.executed ? 'Executed' : vote.paused ? 'Paused' : 'Active'}</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${
                        vote.executed ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                      }`}>
                        {vote.voted ? 'Voted' : vote.vetoed ? 'Vetoed' : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Delegation */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="glass-effect rounded-xl p-6">
              <h3 className="text-xl font-semibold text-white mb-6">Delegation</h3>
              {delegation && delegation.delegate && delegation.delegate !== ethers.constants.AddressZero ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Delegate:</span>
                    <span className="text-sm text-white font-mono">
                      {getShortAddress(delegation.delegate)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Since:</span>
                    <span className="text-sm text-white">
                      {new Date(delegation.startTime * 1000).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Reputation:</span>
                    <span className="text-sm text-white font-semibold">{delegation.reputation}</span>
                  </div>
                </div>
              ) : (
                <div className="text-gray-400">No active delegation.</div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Profile; 