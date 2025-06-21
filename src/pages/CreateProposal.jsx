import { useState } from 'react';
import { motion } from 'framer-motion';
import { useAccount, useWriteContract } from 'wagmi';
import { ethers } from 'ethers';
import { toast } from 'react-hot-toast';
import { 
  FileText, 
  Calendar, 
  Users, 
  Target, 
  ArrowLeft,
  Plus,
  AlertCircle,
  CheckCircle,
  DollarSign,
  Settings,
  Globe,
  Coins
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { LIQUID_DEMOCRACY_ADDRESS, LIQUID_DEMOCRACY_ABI } from '../config/contracts';

const CreateProposal = () => {
  const { address } = useAccount();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    description: '',
    category: 0,
    duration: 7, // days
    targetCredits: '1000',
    targetAddress: '',
    allocatedAmount: ''
  });
  const { writeContractAsync } = useWriteContract();

  const categories = [
    { id: 0, name: 'Budget', icon: DollarSign, color: 'text-green-400' },
    { id: 1, name: 'Policy', icon: FileText, color: 'text-blue-400' },
    { id: 2, name: 'Infrastructure', icon: Settings, color: 'text-purple-400' },
    { id: 3, name: 'Other', icon: Globe, color: 'text-orange-400' }
  ];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.description.trim()) {
      toast.error('Please enter a proposal description');
      return;
    }
    if (formData.category === 0 && (!formData.targetAddress || !ethers.utils.isAddress(formData.targetAddress))) {
      toast.error('Please enter a valid target address for budget proposal');
      return;
    }
    if (formData.category === 0 && (!formData.allocatedAmount || parseFloat(formData.allocatedAmount) <= 0)) {
      toast.error('Please enter a valid allocated amount');
      return;
    }
    setIsSubmitting(true);
    try {
      const tx = await writeContractAsync({
        address: LIQUID_DEMOCRACY_ADDRESS,
        abi: LIQUID_DEMOCRACY_ABI,
        functionName: 'createProposal',
        args: [
          formData.description,
          formData.category,
          formData.targetAddress || ethers.constants.AddressZero,
          formData.allocatedAmount ? ethers.utils.parseEther(formData.allocatedAmount) : 0
        ]
      });
      toast.success('Proposal created!');
      setFormData({ description: '', category: 0, duration: 7, targetCredits: '1000', targetAddress: '', allocatedAmount: '' });
    } catch (error) {
      console.error('Error creating proposal:', error);
      if (error.message?.includes('Not a verified citizen')) {
        toast.error('You must be a registered citizen to create proposals.');
      } else if (error.message?.includes('revert')) {
        toast.error('Transaction reverted. Please check your wallet and try again.');
      } else {
        toast.error('An unexpected error occurred. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  if (!address) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-white mb-4">Please connect your wallet</h2>
          <p className="text-gray-400">Connect your wallet to create proposals</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center space-x-4 mb-4">
            <Link
              to="/dashboard"
              className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>Back to Dashboard</span>
            </Link>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Create New Proposal</h1>
          <p className="text-gray-400">Submit a new governance proposal to the community</p>
        </motion.div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2"
          >
            <div className="glass-effect rounded-xl p-6">
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-white mb-2">
                    Proposal Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe your proposal in detail..."
                    className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 resize-none"
                    rows={6}
                    required
                  />
                </div>

                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-white mb-3">
                    Category
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {categories.map((category) => (
                      <button
                        key={category.id}
                        type="button"
                        onClick={() => handleInputChange('category', category.id)}
                        className={`p-4 rounded-lg border transition-all duration-200 text-left ${
                          formData.category === category.id
                            ? 'border-blue-500 bg-blue-500/20'
                            : 'border-gray-600 bg-gray-800/50 hover:border-gray-500'
                        }`}
                      >
                        <div className="font-medium text-white mb-1">{category.name}</div>
                        <div className="text-sm text-gray-400">{category.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Budget-specific fields */}
                {formData.category === 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-4 p-4 bg-green-500/10 border border-green-500/20 rounded-xl"
                  >
                    <div className="flex items-center gap-2 mb-3">
                      <DollarSign className="w-5 h-5 text-green-400" />
                      <span className="text-green-400 font-medium">Budget Proposal Details</span>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Target Address
                      </label>
                      <div className="relative">
                        <Target className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          value={formData.targetAddress}
                          onChange={(e) => handleInputChange('targetAddress', e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="0x..."
                          required
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-400 mb-2">
                        Allocated Amount (CITY)
                      </label>
                      <div className="relative">
                        <Coins className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="number"
                          value={formData.allocatedAmount}
                          onChange={(e) => handleInputChange('allocatedAmount', e.target.value)}
                          className="w-full pl-10 pr-4 py-3 bg-gray-800/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                          placeholder="1000"
                          step="0.01"
                          min="0"
                          required
                        />
                      </div>
                      <p className="text-xs text-gray-400 mt-1">
                        This amount will be transferred to the target address if the proposal passes
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Duration and Target Credits */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Voting Duration (days)
                    </label>
                    <select
                      value={formData.duration}
                      onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
                      className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value={1}>1 day</option>
                      <option value={3}>3 days</option>
                      <option value={7}>7 days</option>
                      <option value={14}>14 days</option>
                      <option value={30}>30 days</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-white mb-2">
                      Target Credits Required
                    </label>
                    <input
                      type="number"
                      value={formData.targetCredits}
                      onChange={(e) => handleInputChange('targetCredits', e.target.value)}
                      placeholder="1000"
                      className="w-full bg-gray-800/50 border border-gray-600 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
                      min="1"
                      required
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-lg transition-all duration-200 font-semibold flex items-center justify-center space-x-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Creating Proposal...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      <span>Create Proposal</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          </motion.div>

          {/* Guidelines */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="space-y-6"
          >
            {/* Guidelines */}
            <div className="glass-effect rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                <FileText className="w-5 h-5 text-blue-400" />
                <span>Proposal Guidelines</span>
              </h3>
              <div className="space-y-3 text-sm text-gray-300">
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Be clear and specific about your proposal</span>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Include expected outcomes and benefits</span>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Consider the impact on the community</span>
                </div>
                <div className="flex items-start space-x-2">
                  <CheckCircle className="w-4 h-4 text-green-400 mt-0.5 flex-shrink-0" />
                  <span>Set realistic target credits</span>
                </div>
              </div>
            </div>

            {/* Requirements */}
            <div className="glass-effect rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4 flex items-center space-x-2">
                <Target className="w-5 h-5 text-purple-400" />
                <span>Requirements</span>
              </h3>
              <div className="space-y-3 text-sm text-gray-300">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-blue-400" />
                  <span>Must be a registered citizen</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Calendar className="w-4 h-4 text-green-400" />
                  <span>Minimum 1 day voting period</span>
                </div>
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-orange-400" />
                  <span>Proposals can be vetoed by citizens</span>
                </div>
              </div>
            </div>

            {/* Preview */}
            <div className="glass-effect rounded-xl p-6">
              <h3 className="text-lg font-semibold text-white mb-4">Proposal Preview</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <span className="text-gray-400">Category:</span>
                  <span className="text-white ml-2">{categories[formData.category]?.name}</span>
                </div>
                <div>
                  <span className="text-gray-400">Duration:</span>
                  <span className="text-white ml-2">{formData.duration} days</span>
                </div>
                <div>
                  <span className="text-gray-400">Target Credits:</span>
                  <span className="text-white ml-2">{formData.targetCredits} CITY</span>
                </div>
                <div>
                  <span className="text-gray-400">End Date:</span>
                  <span className="text-white ml-2">
                    {new Date(Date.now() + formData.duration * 24 * 3600 * 1000).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default CreateProposal; 