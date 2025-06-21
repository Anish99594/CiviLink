import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { ethers } from 'ethers';
import { toast } from 'react-hot-toast';
import { 
  Vote, 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Users, 
  TrendingUp,
  Shield,
  Calendar,
  Zap,
  DollarSign,
  Play
} from 'lucide-react';
import { LIQUID_DEMOCRACY_ADDRESS, LIQUID_DEMOCRACY_ABI } from '../config/contracts';

const ProposalCard = ({ proposal, onProposalChanged }) => {
  const { address } = useAccount();
  const [isVotingYes, setIsVotingYes] = useState(false);
  const [isVotingNo, setIsVotingNo] = useState(false);
  const [isVetoing, setIsVetoing] = useState(false);
  const [voteCredits, setVoteCredits] = useState('100');
  const [voteHash, setVoteHash] = useState(null);
  const [vetoHash, setVetoHash] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);

  // Check if user has already voted
  const { data: hasVoted, refetch: refetchHasVoted } = useReadContract({
    address: LIQUID_DEMOCRACY_ADDRESS,
    abi: LIQUID_DEMOCRACY_ABI,
    functionName: 'hasVoted',
    args: [proposal.id, address],
    enabled: !!address && !!proposal.id,
  });

  // Check if user has vetoed
  const { data: hasVetoed, refetch: refetchHasVetoed } = useReadContract({
    address: LIQUID_DEMOCRACY_ADDRESS,
    abi: LIQUID_DEMOCRACY_ABI,
    functionName: 'hasVetoed',
    args: [proposal.id, address],
    enabled: !!address && !!proposal.id,
  });

  // Check if user is citizen
  const { data: isCitizen } = useReadContract({
    address: LIQUID_DEMOCRACY_ADDRESS,
    abi: LIQUID_DEMOCRACY_ABI,
    functionName: 'isCitizen',
    args: [address],
    enabled: !!address,
  });

  // Contract writes
  const { writeContractAsync: voteAsync } = useWriteContract();
  const { writeContractAsync: vetoAsync } = useWriteContract();
  const { writeContractAsync: executeProposalAsync } = useWriteContract();

  const categories = [
    { name: 'Governance', color: 'text-blue-400', bgColor: 'bg-blue-500/20' },
    { name: 'Infrastructure', color: 'text-green-400', bgColor: 'bg-green-500/20' },
    { name: 'Policy', color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
    { name: 'Development', color: 'text-orange-400', bgColor: 'bg-orange-500/20' }
  ];

  const getTimeRemaining = () => {
    const now = Math.floor(Date.now() / 1000);
    const remaining = proposal.endTime - now;
    
    if (remaining <= 0) return 'Ended';
    
    const days = Math.floor(remaining / 86400);
    const hours = Math.floor((remaining % 86400) / 3600);
    
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
  };

  const getVotePercentage = () => {
    const total = proposal.totalYesCredits + proposal.totalNoCredits;
    if (total === 0) return 0;
    return Math.round((proposal.totalYesCredits / total) * 100);
  };

  const handleVote = async (support) => {
    if (!voteCredits || parseFloat(voteCredits) <= 0) {
      toast.error('Please enter valid vote credits');
      return;
    }
    if (!isCitizen) {
      toast.error('You must be a registered citizen to vote.');
      return;
    }
    if (isEnded) {
      toast.error('Voting period has ended.');
      return;
    }
    if (proposal.paused) {
      toast.error('Proposal is paused.');
      return;
    }
    if (proposal.executed) {
      toast.error('Proposal already executed.');
      return;
    }
    if (hasVetoed) {
      toast.error('You have already vetoed this proposal.');
      return;
    }
    if (hasVoted) {
      toast.error('You have already voted on this proposal.');
      return;
    }
    const credits = voteCredits;
    support ? setIsVotingYes(true) : setIsVotingNo(true);
    try {
      const txHash = await voteAsync({
        address: LIQUID_DEMOCRACY_ADDRESS,
        abi: LIQUID_DEMOCRACY_ABI,
        functionName: 'vote',
        args: [proposal.id, support, credits],
      });
      // Wait for confirmation using the hash directly
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.waitForTransaction(txHash);
      toast.success('Vote submitted!');
      await refetchHasVoted();
      if (onProposalChanged) await onProposalChanged();
      setVoteHash(null);
      setIsVotingYes(false);
      setIsVotingNo(false);
    } catch (error) {
      toast.error(error?.reason || error?.message || 'Failed to submit vote');
      setIsVotingYes(false);
      setIsVotingNo(false);
    }
  };

  const handleVeto = async () => {
    if (!isCitizen) {
      toast.error('You must be a registered citizen to veto.');
      return;
    }
    if (isEnded) {
      toast.error('Voting period has ended.');
      return;
    }
    if (proposal.paused) {
      toast.error('Proposal is paused.');
      return;
    }
    if (proposal.executed) {
      toast.error('Proposal already executed.');
      return;
    }
    if (hasVoted) {
      toast.error('You have already voted on this proposal.');
      return;
    }
    if (hasVetoed) {
      toast.error('You have already vetoed this proposal.');
      return;
    }
    setIsVetoing(true);
    try {
      const txHash = await vetoAsync({
        address: LIQUID_DEMOCRACY_ADDRESS,
        abi: LIQUID_DEMOCRACY_ABI,
        functionName: 'veto',
        args: [proposal.id],
      });
      // Wait for confirmation using the hash directly
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.waitForTransaction(txHash);
      toast.success('Veto submitted successfully!');
      await refetchHasVetoed();
      if (onProposalChanged) await onProposalChanged();
      setVetoHash(null);
      setIsVetoing(false);
    } catch (error) {
      toast.error(error?.reason || error?.message || 'Failed to submit veto');
      setIsVetoing(false);
    }
  };

  const handleExecute = async () => {
    if (!isEnded || proposal.executed || proposal.paused) return;
    
    setIsExecuting(true);
    try {
      const txHash = await executeProposalAsync({
        address: LIQUID_DEMOCRACY_ADDRESS,
        abi: LIQUID_DEMOCRACY_ABI,
        functionName: 'executeProposal',
        args: [proposal.id],
      });

      // Wait for confirmation
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.waitForTransaction(txHash);
      
      toast.success('Proposal executed successfully!');
      if (onProposalChanged) await onProposalChanged();
    } catch (error) {
      console.error('Error executing proposal:', error);
      toast.error(error?.message || 'Failed to execute proposal');
    } finally {
      setIsExecuting(false);
    }
  };

  const isEnded = proposal.endTime < Math.floor(Date.now() / 1000);
  const category = categories[proposal.category] || categories[0];

  // Format the allocated amount for display
  const formatAllocatedAmount = (amount) => {
    if (!amount || amount === '0') return 'N/A';
    return Number(ethers.utils.formatUnits(amount, 18)).toFixed(2);
  };

  // Check if this is a budget proposal
  const isBudgetProposal = proposal.category === 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-effect rounded-xl p-6 border border-gray-700/50 hover:border-gray-600/50 transition-all duration-200"
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`w-8 h-8 ${category.bgColor} rounded-full flex items-center justify-center`}>
            <Vote className={`w-4 h-4 ${category.color}`} />
          </div>
          <div>
            <h3 className="font-semibold text-white">Proposal #{proposal.id}</h3>
            <span className={`text-xs px-2 py-1 rounded-full ${category.bgColor} ${category.color}`}>
              {category.name}
            </span>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          {proposal.executed && (
            <div className="flex items-center space-x-1 text-green-400">
              <CheckCircle className="w-4 h-4" />
              <span className="text-xs">Executed</span>
            </div>
          )}
          {proposal.paused && (
            <div className="flex items-center space-x-1 text-red-400">
              <XCircle className="w-4 h-4" />
              <span className="text-xs">Paused</span>
            </div>
          )}
          {isEnded && !proposal.executed && !proposal.paused && (
            <div className="flex items-center space-x-1 text-gray-400">
              <Clock className="w-4 h-4" />
              <span className="text-xs">Ended</span>
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      <p className="text-gray-300 text-sm mb-4 line-clamp-2">
        {proposal.description}
      </p>

      {/* Budget Proposal Details */}
      {isBudgetProposal && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 mb-3">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-green-400" />
            <span className="text-green-400 font-medium text-sm">Budget Allocation</span>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Target Address:</span>
              <div className="text-white font-mono text-xs truncate">
                {proposal.targetAddress || 'N/A'}
              </div>
            </div>
            <div>
              <span className="text-gray-400">Amount:</span>
              <div className="text-white font-semibold">
                {formatAllocatedAmount(proposal.allocatedAmount)} CITY
              </div>
            </div>
          </div>
          {proposal.executed && (
            <div className="mt-2 p-2 bg-emerald-500/20 rounded text-xs text-emerald-400">
              ✓ Tokens transferred to target address
            </div>
          )}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-4 h-4 text-green-400" />
          <div>
            <p className="text-xs text-gray-400">Yes Votes</p>
            <p className="text-sm font-semibold text-white">
              {proposal.totalYesCredits}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-4 h-4 text-red-400" />
          <div>
            <p className="text-xs text-gray-400">No Votes</p>
            <p className="text-sm font-semibold text-white">
              {proposal.totalNoCredits}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Shield className="w-4 h-4 text-orange-400" />
          <div>
            <p className="text-xs text-gray-400">Veto Votes</p>
            <p className="text-sm font-semibold text-white">{proposal.vetoVotes || 0}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Calendar className="w-4 h-4 text-blue-400" />
          <div>
            <p className="text-xs text-gray-400">Time Left</p>
            <p className="text-sm font-semibold text-white">{getTimeRemaining()}</p>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>Vote Progress</span>
          <span>{getVotePercentage()}% Yes</span>
        </div>
        <div className="w-full bg-gray-700 rounded-full h-2">
          <div 
            className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full transition-all duration-300"
            style={{ width: `${getVotePercentage()}%` }}
          ></div>
        </div>
      </div>

      {/* Action Buttons */}
      {!isEnded && !proposal.executed && !proposal.paused && (
        <div className="space-y-3">
          {/* Vote Input */}
          <div className="flex items-center space-x-2">
            <input
              type="number"
              value={voteCredits}
              onChange={(e) => setVoteCredits(e.target.value)}
              placeholder="Credits"
              className="flex-1 bg-gray-800/50 border border-gray-600 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-blue-500"
              min="1"
            />
            <span className="text-xs text-gray-400">CITY</span>
          </div>
          <div className="text-xs text-gray-400 mt-1">
            Note: The number of credits you enter may be capped at 100 and 5% will be burned. The actual number of credits counted may be less than what you enter.
          </div>

          {/* Show badge if user has voted */}
          {hasVoted && (
            <div className="text-xs text-green-400 font-semibold mb-2 flex items-center space-x-1">
              <CheckCircle className="w-4 h-4" />
              <span>You have voted</span>
            </div>
          )}

          {/* Vote Buttons */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleVote(true)}
              disabled={isVotingYes || hasVoted || !isCitizen || isEnded || proposal.paused || proposal.executed || hasVetoed}
              className="flex items-center justify-center space-x-2 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-all duration-200 text-sm font-semibold"
              title={
                !isCitizen
                  ? 'You must be a registered citizen to vote.'
                  : isEnded
                  ? 'Voting period has ended.'
                  : proposal.paused
                  ? 'Proposal is paused.'
                  : proposal.executed
                  ? 'Proposal already executed.'
                  : hasVetoed
                  ? 'You have already vetoed this proposal.'
                  : hasVoted
                  ? 'You have already voted on this proposal.'
                  : ''
              }
            >
              {isVotingYes ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <CheckCircle className="w-4 h-4" />
              )}
              <span>Vote Yes</span>
            </button>
            
            <button
              onClick={() => handleVote(false)}
              disabled={isVotingNo || hasVoted || !isCitizen || isEnded || proposal.paused || proposal.executed || hasVetoed}
              className="flex items-center justify-center space-x-2 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-all duration-200 text-sm font-semibold"
              title={
                !isCitizen
                  ? 'You must be a registered citizen to vote.'
                  : isEnded
                  ? 'Voting period has ended.'
                  : proposal.paused
                  ? 'Proposal is paused.'
                  : proposal.executed
                  ? 'Proposal already executed.'
                  : hasVetoed
                  ? 'You have already vetoed this proposal.'
                  : hasVoted
                  ? 'You have already voted on this proposal.'
                  : ''
              }
            >
              {isVotingNo ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <XCircle className="w-4 h-4" />
              )}
              <span>Vote No</span>
            </button>
          </div>

          {/* Veto Button */}
          <button
            onClick={handleVeto}
            disabled={isVetoing || hasVetoed || !isCitizen || isEnded || proposal.paused || proposal.executed || hasVoted}
            className="w-full flex items-center justify-center space-x-2 bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white px-4 py-2 rounded-lg transition-all duration-200 text-sm font-semibold"
            title={
              !isCitizen
                ? 'You must be a registered citizen to veto.'
                : isEnded
                ? 'Voting period has ended.'
                : proposal.paused
                ? 'Proposal is paused.'
                : proposal.executed
                ? 'Proposal already executed.'
                : hasVoted
                ? 'You have already voted on this proposal.'
                : hasVetoed
                ? 'You have already vetoed this proposal.'
                : ''
            }
          >
            {isVetoing ? (
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <AlertTriangle className="w-4 h-4" />
            )}
            <span>Veto Proposal</span>
          </button>

          {/* Status Messages */}
          {hasVoted && (
            <p className="text-center text-sm text-green-400">✓ You have voted on this proposal</p>
          )}
          {hasVetoed && (
            <p className="text-center text-sm text-orange-400">✓ You have vetoed this proposal</p>
          )}
        </div>
      )}

      {/* Execution Status */}
      {isEnded && (
        <div className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Play className="w-4 h-4 text-blue-400" />
            <span className="text-blue-400 font-medium text-sm">Execution Status</span>
          </div>
          
          {proposal.executed ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-emerald-400">
                <CheckCircle className="w-4 h-4" />
                <span className="text-sm font-medium">Proposal Executed</span>
              </div>
              <div className="text-sm text-gray-300">
                Result: <span className={proposal.totalYesCredits > proposal.totalNoCredits ? 'text-emerald-400' : 'text-red-400'}>
                  {proposal.totalYesCredits > proposal.totalNoCredits ? 'PASSED' : 'FAILED'}
                </span>
              </div>
              {isBudgetProposal && proposal.totalYesCredits > proposal.totalNoCredits && (
                <div className="text-sm text-emerald-400">
                  ✓ {formatAllocatedAmount(proposal.allocatedAmount)} CITY transferred to {proposal.targetAddress?.slice(0, 8)}...{proposal.targetAddress?.slice(-6)}
                </div>
              )}
            </div>
          ) : proposal.paused ? (
            <div className="flex items-center gap-2 text-red-400">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm">Proposal paused due to veto threshold</span>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-sm text-gray-300">
                Voting ended. Ready for execution.
              </div>
              <button
                onClick={handleExecute}
                disabled={isExecuting}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors duration-200"
              >
                {isExecuting ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Executing...
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Play className="w-4 h-4" />
                    Execute Proposal
                  </div>
                )}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Ended/Executed Status */}
      {(isEnded || proposal.executed || proposal.paused) && (
        <div className="text-center py-4">
          {proposal.executed ? (
            <div className="flex items-center justify-center space-x-2 text-green-400">
              <CheckCircle className="w-5 h-5" />
              <span className="font-semibold">Proposal Executed</span>
            </div>
          ) : proposal.paused ? (
            <div className="flex items-center justify-center space-x-2 text-red-400">
              <XCircle className="w-5 h-5" />
              <span className="font-semibold">Proposal Paused</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2 text-gray-400">
              <Clock className="w-5 h-5" />
              <span className="font-semibold">Voting Period Ended</span>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
};

export default ProposalCard;