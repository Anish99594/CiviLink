import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAccount, useReadContract, useWriteContract } from 'wagmi';
import { ethers } from 'ethers';
import { toast } from 'react-hot-toast';
import { 
  Users, 
  UserPlus, 
  UserMinus, 
  Shield, 
  Target, 
  TrendingUp,
  ArrowRight,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Copy,
  ExternalLink,
  Zap,
  RefreshCw
} from 'lucide-react';
import { LIQUID_DEMOCRACY_ADDRESS, LIQUID_DEMOCRACY_ABI, CITY_TOKEN_ADDRESS, CITY_TOKEN_ABI } from '../config/contracts';

const Governance = () => {
  const { address } = useAccount();
  const [isDelegating, setIsDelegating] = useState(false);
  const [delegateAddress, setDelegateAddress] = useState('');
  const [isRevoking, setIsRevoking] = useState(false);
  const [delegation, setDelegation] = useState(null);
  const [proxy, setProxy] = useState(null);
  const [isLoadingDelegation, setIsLoadingDelegation] = useState(false);
  const [isLoadingProxy, setIsLoadingProxy] = useState(false);
  const { writeContractAsync: assignProxyAsync } = useWriteContract();
  const [proxyAddress, setProxyAddress] = useState("");
  const [isAssigningProxy, setIsAssigningProxy] = useState(false);
  const [assignProxyHash, setAssignProxyHash] = useState();

  // Contract reads
  const { data: isCitizen, isError: isCitizenError, error: isCitizenErrorDetails } = useReadContract({
    address: LIQUID_DEMOCRACY_ADDRESS,
    abi: LIQUID_DEMOCRACY_ABI,
    functionName: 'isCitizen',
    args: [address],
  });

  const { data: totalCitizens, isError: totalCitizensError, error: totalCitizensErrorDetails } = useReadContract({
    address: LIQUID_DEMOCRACY_ADDRESS,
    abi: LIQUID_DEMOCRACY_ABI,
    functionName: 'totalCitizens',
  });

  const { data: tokenBalance, isError: tokenBalanceError, error: tokenBalanceErrorDetails } = useReadContract({
    address: CITY_TOKEN_ADDRESS,
    abi: CITY_TOKEN_ABI,
    functionName: 'balanceOf',
    args: [address],
  });

  const { data: delegationData, isError: delegationError, error: delegationErrorDetails, refetch: refetchDelegation } = useReadContract({
    address: LIQUID_DEMOCRACY_ADDRESS,
    abi: LIQUID_DEMOCRACY_ABI,
    functionName: 'delegations',
    args: [address],
  });

  const { data: proxyData, isError: proxyError, error: proxyErrorDetails, refetch: refetchProxy } = useReadContract({
    address: LIQUID_DEMOCRACY_ADDRESS,
    abi: LIQUID_DEMOCRACY_ABI,
    functionName: 'proxies',
    args: [address],
  });

  // Contract writes
  const { writeContractAsync: delegateToAsync, data: delegateTx } = useWriteContract();
  const { writeContractAsync: revokeDelegationAsync, data: revokeTx } = useWriteContract();

  // Update delegation and proxy state
  useEffect(() => {
    if (delegationData) {
      setDelegation({
        delegate: delegationData[0],
        startTime: Number(delegationData[1]),
        reputation: Number(delegationData[2]),
      });
      setIsLoadingDelegation(false);
    }
    if (delegationError) {
      toast.error(`Failed to load delegation: ${delegationErrorDetails?.message || 'Unknown error'}`);
      setDelegation(null);
      setIsLoadingDelegation(false);
    }
  }, [delegationData, delegationError, delegationErrorDetails]);

  useEffect(() => {
    if (proxyData) {
      setProxy({
        proxy: proxyData[0],
        expiry: Number(proxyData[1]),
      });
      setIsLoadingProxy(false);
    }
    if (proxyError) {
      toast.error(`Failed to load proxy: ${proxyErrorDetails?.message || 'Unknown error'}`);
      setProxy(null);
      setIsLoadingProxy(false);
    }
  }, [proxyData, proxyError, proxyErrorDetails]);

  // Handle errors for other reads
  useEffect(() => {
    if (isCitizenError) {
      toast.error(`Failed to check citizen status: ${isCitizenErrorDetails?.message || 'Unknown error'}`);
    }
    if (totalCitizensError) {
      toast.error(`Failed to load total citizens: ${totalCitizensErrorDetails?.message || 'Unknown error'}`);
    }
    if (tokenBalanceError) {
      toast.error(`Failed to load token balance: ${tokenBalanceErrorDetails?.message || 'Unknown error'}`);
    }
  }, [isCitizenError, isCitizenErrorDetails, totalCitizensError, totalCitizensErrorDetails, tokenBalanceError, tokenBalanceErrorDetails]);

  const handleDelegate = async () => {
    if (!delegateAddress || !ethers.utils.isAddress(delegateAddress)) {
      toast.error('Please enter a valid address');
      return;
    }
    if (delegateAddress.toLowerCase() === address?.toLowerCase()) {
      toast.error('Cannot delegate to yourself');
      return;
    }
    setIsDelegating(true);
    try {
      const txHash = await delegateToAsync({
        address: LIQUID_DEMOCRACY_ADDRESS,
        abi: LIQUID_DEMOCRACY_ABI,
        functionName: 'delegateTo',
        args: [delegateAddress],
      });
      // Wait for confirmation
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.waitForTransaction(txHash);
      toast.success('Delegation created successfully!');
      setIsDelegating(false);
      setDelegateAddress('');
      if (typeof refetchDelegation === 'function') await refetchDelegation();
    } catch (error) {
      toast.error(error?.message || 'Failed to delegate');
      setIsDelegating(false);
    }
  };

  const handleRevoke = async () => {
    setIsRevoking(true);
    try {
      await revokeDelegationAsync({
        address: LIQUID_DEMOCRACY_ADDRESS,
        abi: LIQUID_DEMOCRACY_ABI,
        functionName: 'revokeDelegation',
        args: [],
      });
    } catch (error) {
      toast.error(error?.message || 'Failed to revoke delegation');
      setIsRevoking(false);
    }
  };

  const handleRefresh = async () => {
    setIsLoadingDelegation(true);
    setIsLoadingProxy(true);
    await Promise.all([refetchDelegation(), refetchProxy()]);
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    toast.success('Address copied to clipboard');
  };

  const handleAssignProxy = async () => {
    if (!proxyAddress || !ethers.utils.isAddress(proxyAddress)) {
      toast.error("Please enter a valid address");
      return;
    }
    if (proxyAddress.toLowerCase() === address?.toLowerCase()) {
      toast.error("Cannot assign yourself as proxy");
      return;
    }
    setIsAssigningProxy(true);
    try {
      const txHash = await assignProxyAsync({
        address: LIQUID_DEMOCRACY_ADDRESS,
        abi: LIQUID_DEMOCRACY_ABI,
        functionName: "assignProxy",
        args: [proxyAddress],
      });
      // Wait for confirmation
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.waitForTransaction(txHash);
      toast.success('Proxy assigned successfully!');
      setIsAssigningProxy(false);
      setProxyAddress("");
      if (typeof refetchProxy === 'function') await refetchProxy();
    } catch (error) {
      toast.error(error?.message || "Failed to assign proxy");
      setIsAssigningProxy(false);
    }
  };

  const stats = [
    {
      label: "Total Citizens",
      value: totalCitizens ? Number(totalCitizens).toString() : '0',
      icon: Users,
      color: "text-blue-400",
      bgColor: "bg-blue-500/20"
    },
    {
      label: "Your CITY Tokens",
      value: tokenBalance ? Number(ethers.utils.formatUnits(tokenBalance, 18)).toFixed(4) : '0',
      icon: Shield,
      color: "text-purple-400",
      bgColor: "bg-purple-500/20"
    },
    {
      label: "Your Reputation",
      value: delegation ? delegation.reputation.toString() : '0',
      icon: TrendingUp,
      color: "text-green-400",
      bgColor: "bg-green-500/20"
    },
    {
      label: "Delegation Since",
      value: delegation && delegation.startTime ? new Date(delegation.startTime * 1000).toLocaleDateString() : '-',
      icon: Target,
      color: "text-orange-400",
      bgColor: "bg-orange-500/20"
    }
  ];

  const features = [
    {
      title: "Liquid Delegation",
      description: "Delegate your voting power to trusted community members while retaining the ability to vote directly when needed.",
      icon: Users,
      color: "text-blue-400"
    },
    {
      title: "Proxy Voting",
      description: "Assign a proxy to vote on your behalf when you're unavailable, ensuring continuous participation.",
      icon: Shield,
      color: "text-green-400"
    },
    {
      title: "Reputation System",
      description: "Build reputation through consistent voting patterns and successful delegations.",
      icon: TrendingUp,
      color: "text-purple-400"
    },
    {
      title: "Quadratic Voting",
      description: "Vote with credits that scale quadratically, preventing concentration of power.",
      icon: Zap,
      color: "text-orange-400"
    }
  ];

  if (!address) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Please connect your wallet</h2>
          <p className="text-gray-400">Connect your wallet to access governance features</p>
        </div>
      </div>
    );
  }

  if (!isCitizen) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Register as Citizen First</h2>
          <p className="text-gray-400">You need to register as a citizen to access governance features</p>
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
          <h1 className="text-3xl font-bold text-white mb-2">Governance & Delegation</h1>
          <p className="text-gray-400">Manage your voting power and delegate to trusted representatives</p>
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
                className={`glass-effect rounded-xl p-6 border border-gray-700/50`}
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
          {/* Create Delegation */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="glass-effect rounded-xl p-6">
              <h2 className="text-xl font-semibold text-white mb-6 flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-green-400" />
                <span>Create Delegation</span>
              </h2>
              
              <form onSubmit={(e) => { e.preventDefault(); handleDelegate(); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Delegate Address
                  </label>
                  <input
                    type="text"
                    value={delegateAddress}
                    onChange={(e) => setDelegateAddress(e.target.value)}
                    placeholder="0x..."
                    className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isDelegating}
                  className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg transition-all duration-200 font-semibold flex items-center justify-center space-x-2"
                >
                  {isDelegating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Creating Delegation...</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Create Delegation</span>
                    </>
                  )}
                </button>
              </form>

              <div className="mt-6 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
                <h4 className="text-sm font-semibold text-blue-400 mb-2">How Delegation Works</h4>
                <ul className="text-sm text-gray-300 space-y-1">
                  <li>• Delegate your voting power to trusted representatives</li>
                  <li>• Delegates vote on your behalf in proposals</li>
                  <li>• You can revoke delegations at any time</li>
                  <li>• Reputation grows with successful delegations</li>
                </ul>
              </div>
            </div>
          </motion.div>

          {/* Active Delegation */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="glass-effect rounded-xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
                  <Users className="w-5 h-5 text-blue-400" />
                  <span>Active Delegation</span>
                </h2>
                <button
                  onClick={handleRefresh}
                  className="text-gray-400 hover:text-white transition-colors"
                  title="Refresh Data"
                >
                  <RefreshCw className="w-5 h-5" />
                </button>
              </div>

              {isLoadingDelegation ? (
                <div className="text-center py-8">
                  <div className="w-8 h-8 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                  <p className="text-gray-400">Loading delegation...</p>
                </div>
              ) : delegation && delegation.delegate !== ethers.constants.AddressZero ? (
                <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center">
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      </div>
                      <span className="text-sm font-medium text-white">Active</span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(delegation.delegate)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-400">Delegate:</span>
                      <span className="text-sm text-white font-mono">
                        {delegation.delegate.slice(0, 6)}...{delegation.delegate.slice(-4)}
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

                  <button
                    onClick={handleRevoke}
                    disabled={isRevoking}
                    className="w-full mt-3 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-2 rounded-lg transition-all duration-200 text-sm font-semibold flex items-center justify-center space-x-2"
                  >
                    {isRevoking ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Revoking...</span>
                      </>
                    ) : (
                      <>
                        <UserMinus className="w-4 h-4" />
                        <span>Revoke Delegation</span>
                      </>
                    )}
                  </button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-white mb-2">No Active Delegation</h3>
                  <p className="text-gray-400">Create a delegation to get started</p>
                </div>
              )}
            </div>
          </motion.div>
        </div>

        {/* Assign Proxy */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-8"
        >
          <div className="glass-effect rounded-xl p-6 border border-green-500/30 mb-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
              <Shield className="w-5 h-5 text-green-400" />
              <span>Assign Proxy</span>
            </h2>
            <form
              onSubmit={e => {
                e.preventDefault();
                handleAssignProxy();
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-white mb-2">
                  Proxy Address
                </label>
                <input
                  type="text"
                  value={proxyAddress}
                  onChange={e => setProxyAddress(e.target.value)}
                  placeholder="0x..."
                  className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-green-500"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={isAssigningProxy}
                className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-3 rounded-lg transition-all duration-200 font-semibold flex items-center justify-center space-x-2"
              >
                {isAssigningProxy ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Assigning Proxy...</span>
                  </>
                ) : (
                  <>
                    <Shield className="w-4 h-4" />
                    <span>Assign Proxy</span>
                  </>
                )}
              </button>
            </form>
            <div className="mt-6 p-4 bg-green-500/10 rounded-lg border border-green-500/20">
              <h4 className="text-sm font-semibold text-green-400 mb-2">How Proxy Voting Works</h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Assign a proxy to vote on your behalf if you are unavailable</li>
                <li>• Proxy is valid for one voting period (7 days)</li>
                <li>• You can reassign or update your proxy at any time</li>
                <li>• Only verified citizens can be assigned as proxies</li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Proxy Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="mt-8"
        >
          <div className="glass-effect rounded-xl p-6 border border-green-500/30">
            <h2 className="text-lg font-semibold text-white mb-2">Your Proxy</h2>
            {isLoadingProxy ? (
              <p className="text-gray-400">Loading...</p>
            ) : proxy && proxy.proxy !== ethers.constants.AddressZero ? (
              <div className="p-4 bg-gray-800/30 rounded-lg border border-gray-700/50">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Proxy:</span>
                    <span className="text-sm text-white font-mono">
                      {proxy.proxy.slice(0, 6)}...{proxy.proxy.slice(-4)}
                      <button
                        onClick={() => copyToClipboard(proxy.proxy)}
                        className="ml-2 text-gray-400 hover:text-white transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-400">Expiry:</span>
                    <span className="text-sm text-white">{new Date(proxy.expiry * 1000).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-gray-400">No proxy assigned.</p>
            )}
          </div>
        </motion.div>

        {/* Governance Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="mt-8"
        >
          <div className="glass-effect rounded-xl p-6">
            <h2 className="text-xl font-semibold text-white mb-6 flex items-center space-x-2">
              <Shield className="w-5 h-5 text-purple-400" />
              <span>Governance Framework</span>
            </h2>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <Target className="w-6 h-6 text-blue-400" />
                </div>
                <h3 className="font-semibold text-white mb-2">Direct Democracy</h3>
                <p className="text-sm text-gray-400">Vote directly on proposals using your CITY tokens</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <UserPlus className="w-6 h-6 text-green-400" />
                </div>
                <h3 className="font-semibold text-white mb-2">Liquid Delegation</h3>
                <p className="text-sm text-gray-400">Delegate voting power to trusted representatives</p>
              </div>
              
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                  <TrendingUp className="w-6 h-6 text-purple-400" />
                </div>
                <h3 className="font-semibold text-white mb-2">Quadratic Voting</h3>
                <p className="text-sm text-gray-400">Voting power scales with the square root of credits</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Governance;