// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts@4.9.0/security/ReentrancyGuard.sol";

// Interface for ERC-20 token (CITY)
interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function burn(uint256 amount) external;
}

/// @title LiquidDemocracy - Governance system for Network States
/// @notice Implements liquid democracy with quadratic voting, veto, and proxy voting
/// @dev Admin role is a temporary placeholder for demo; replace with DAO/multisig for production
contract LiquidDemocracy is ReentrancyGuard {
    // Enums and Structs
    enum Category { Budget, Policy, Infrastructure, Other }
    
    struct Proposal {
        string description;
        Category category;
        uint256 endTime;
        address targetAddress; // For budget proposals
        uint256 allocatedAmount; // For budget proposals
        mapping(address => bool) hasVoted; // Tracks voters
        mapping(address => bool) hasVetoed; // Tracks veto voters
        mapping(address => uint256) voteCredits; // Quadratic voting credits
        uint256 totalYesCredits;
        uint256 totalNoCredits;
        uint256 vetoVotes; // Count of vetoes
        bool executed;
        bool paused; // For veto mechanism
    }

    struct Delegation {
        address delegate;
        uint256 startTime;
        uint256 reputation; // Reputation score (capped at 1000)
    }

    struct ProxyVote {
        address proxy;
        uint256 expiry;
    }

    // State Variables
    IERC20 public immutable cityToken; // Governance token
    mapping(address => bool) public isCitizen; // Verified citizens
    mapping(address => Delegation) public delegations; // Delegation graph
    mapping(address => ProxyVote) public proxies; // Offline proxies
    mapping(address => mapping(Category => uint256)) public expertise; // Category-based stake
    mapping(uint256 => Proposal) public proposals; // Proposal storage
    uint256 public proposalCount; // Total proposals
    uint256 public constant VOTING_DURATION = 7 days;
    uint256 public constant BASE_VOTE_CREDITS = 100;
    uint256 public constant VETO_THRESHOLD = 10; // 10% of voters to pause
    uint256 public constant BURN_PERCENTAGE = 5; // 5% of vote credits burned
    uint256 public constant MAX_DELEGATION_DEPTH = 5; // Limit delegation chain
    uint256 public totalCitizens; // Track citizen count for veto
    address public admin; // Temporary admin for demo

    // Events
    event CitizenRegistered(address indexed citizen);
    event CitizenDeregistered(address indexed citizen);
    event Delegated(address indexed from, address indexed to);
    event ProxyAssigned(address indexed voter, address indexed proxy);
    event ProposalCreated(uint256 indexed proposalId, string description, Category category, address targetAddress, uint256 allocatedAmount);
    event Voted(uint256 indexed proposalId, address indexed voter, bool support, uint256 credits);
    event VetoVoted(uint256 indexed proposalId, address indexed voter);
    event ProposalPaused(uint256 indexed proposalId);
    event ProposalUnpaused(uint256 indexed proposalId);
    event ProposalExecuted(uint256 indexed proposalId, bool passed, address targetAddress, uint256 allocatedAmount);
    event Burned(address indexed voter, uint256 amount);
    event ExpertiseUpdated(address indexed citizen, Category category, uint256 expertise);

    // Modifiers
    modifier onlyCitizen() {
        require(isCitizen[msg.sender], "Not a verified citizen");
        _;
    }

    modifier activeProposal(uint256 proposalId) {
        require(proposalId <= proposalCount && proposalId > 0, "Invalid proposal ID");
        require(block.timestamp < proposals[proposalId].endTime, "Voting period ended");
        require(!proposals[proposalId].paused, "Proposal paused");
        _;
    }

    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin");
        _;
    }

    // Constructor
    constructor(address _cityToken) {
        require(_cityToken != address(0), "Invalid token address");
        cityToken = IERC20(_cityToken);
        admin = msg.sender;
    }

    // Register as a citizen
    function registerCitizen() external nonReentrant {
        require(!isCitizen[msg.sender], "Already registered");
        isCitizen[msg.sender] = true;
        totalCitizens++;
        emit CitizenRegistered(msg.sender);
    }

    // Deregister a citizen (for production)
    function deregisterCitizen(address citizen) external onlyAdmin nonReentrant {
        require(citizen != address(0), "Invalid citizen");
        require(isCitizen[citizen], "Not a citizen");
        require(delegations[citizen].delegate == address(0), "Revoke delegation first");
        isCitizen[citizen] = false;
        totalCitizens--;
        delete proxies[citizen];
        emit CitizenDeregistered(citizen);
    }

    // Delegate voting power
    function delegateTo(address delegate) external onlyCitizen nonReentrant {
        require(delegate != address(0) && delegate != msg.sender, "Invalid delegate");
        require(isCitizen[delegate], "Delegate must be a citizen");
        delegations[msg.sender] = Delegation(delegate, block.timestamp, delegations[msg.sender].reputation);
        emit Delegated(msg.sender, delegate);
    }

    // Revoke delegation
    function revokeDelegation() external onlyCitizen nonReentrant {
        delete delegations[msg.sender];
        emit Delegated(msg.sender, address(0));
    }

    // Assign an offline proxy
    function assignProxy(address proxy) external onlyCitizen nonReentrant {
        require(proxy != address(0) && isCitizen[proxy], "Invalid proxy");
        proxies[msg.sender] = ProxyVote(proxy, block.timestamp + VOTING_DURATION);
        emit ProxyAssigned(msg.sender, proxy);
    }

    // Update expertise (admin-only for demo)
    function updateExpertise(address citizen, Category category, uint256 expertiseValue) external onlyAdmin {
        require(citizen != address(0), "Invalid citizen");
        require(isCitizen[citizen], "Not a citizen");
        expertise[citizen][category] = expertiseValue;
        emit ExpertiseUpdated(citizen, category, expertiseValue);
    }

    // Create a new proposal
    function createProposal(string calldata description, Category category, address targetAddress, uint256 allocatedAmount) 
        external onlyCitizen nonReentrant {
        require(bytes(description).length > 0, "Invalid description");
        if (category == Category.Budget) {
            require(targetAddress != address(0), "Invalid target address");
            require(allocatedAmount > 0, "Invalid amount");
        }
        proposalCount++;
        Proposal storage p = proposals[proposalCount];
        p.description = description;
        p.category = category;
        p.endTime = block.timestamp + VOTING_DURATION;
        p.targetAddress = targetAddress;
        p.allocatedAmount = allocatedAmount;
        emit ProposalCreated(proposalCount, description, category, targetAddress, allocatedAmount);

        // Reward proposer
        require(cityToken.transfer(msg.sender, 20 * 10**18), "Token transfer failed");
    }

    /// @notice Cast a vote on a proposal with specified credits
    /// @param proposalId ID of the proposal to vote on
    /// @param support True for yes, false for no
    /// @param credits Amount of voting credits to allocate
    function vote(uint256 proposalId, bool support, uint256 credits) 
        external 
        onlyCitizen 
        activeProposal(proposalId) 
        nonReentrant 
    {
        require(credits > 0, "Credits must be non-zero");
        Proposal storage p = proposals[proposalId];
        require(!p.hasVoted[msg.sender] && !p.hasVetoed[msg.sender], "Already voted or vetoed");

        // Calculate credits with expertise and reputation
        uint256 effectiveCredits = calculateEffectiveCredits(msg.sender, proposalId, credits);
        require(effectiveCredits > 0, "Insufficient credits");

        // Burn a percentage of credits
        uint256 burnAmount = (effectiveCredits * BURN_PERCENTAGE) / 100;
        uint256 voteCost = effectiveCredits - burnAmount;
        require(cityToken.balanceOf(msg.sender) >= voteCost, "Insufficient balance");
        require(cityToken.transferFrom(msg.sender, address(this), voteCost), "Token transfer failed");
        if (burnAmount > 0) {
            cityToken.burn(burnAmount);
            emit Burned(msg.sender, burnAmount);
        }

        p.hasVoted[msg.sender] = true;
        p.voteCredits[msg.sender] = voteCost;
        if (support) {
            p.totalYesCredits += voteCost;
        } else {
            p.totalNoCredits += voteCost;
        }
        updateReputation(msg.sender, proposalId);
        emit Voted(proposalId, msg.sender, support, voteCost);
        checkVeto(proposalId);
    }

    /// @notice Veto a proposal to signal strong opposition
    /// @param proposalId ID of the proposal to veto
    function veto(uint256 proposalId) 
        external 
        onlyCitizen 
        activeProposal(proposalId) 
        nonReentrant 
    {
        Proposal storage p = proposals[proposalId];
        require(!p.hasVoted[msg.sender] && !p.hasVetoed[msg.sender], "Already voted or vetoed");
        p.hasVetoed[msg.sender] = true;
        p.vetoVotes++;
        emit VetoVoted(proposalId, msg.sender);
        checkVeto(proposalId);
    }

    /// @notice Allows voting on multiple proposals in a single transaction
    /// @param proposalIds Array of proposal IDs to vote on
    /// @param supportChoices Array of support choices (true for yes, false for no)
    /// @param credits Array of vote credits to allocate
    function batchVote(uint256[] calldata proposalIds, bool[] calldata supportChoices, uint256[] calldata credits) 
        external 
        onlyCitizen 
        nonReentrant 
    {
        require(proposalIds.length == supportChoices.length && supportChoices.length == credits.length, "Input mismatch");
        require(proposalIds.length > 0, "Empty input arrays");
        for (uint256 i = 0; i < proposalIds.length; i++) {
            uint256 proposalId = proposalIds[i];
            bool support = supportChoices[i];
            uint256 credit = credits[i];
            Proposal storage p = proposals[proposalId];
            if (!p.hasVoted[msg.sender] && 
                !p.hasVetoed[msg.sender] && 
                block.timestamp < p.endTime && 
                !p.paused) {
                // Inline vote logic to bypass potential compiler issue
                require(credit > 0, "Credits must be non-zero");
                require(isCitizen[msg.sender], "Not a verified citizen");
                require(proposalId <= proposalCount && proposalId > 0, "Invalid proposal ID");
                require(block.timestamp < p.endTime, "Voting period ended");
                require(!p.paused, "Proposal paused");
                require(!p.hasVoted[msg.sender] && !p.hasVetoed[msg.sender], "Already voted or vetoed");

                uint256 effectiveCredits = calculateEffectiveCredits(msg.sender, proposalId, credit);
                require(effectiveCredits > 0, "Insufficient credits");

                uint256 burnAmount = (effectiveCredits * BURN_PERCENTAGE) / 100;
                uint256 voteCost = effectiveCredits - burnAmount;
                require(cityToken.balanceOf(msg.sender) >= voteCost, "Insufficient balance");
                require(cityToken.transferFrom(msg.sender, address(this), voteCost), "Token transfer failed");
                if (burnAmount > 0) {
                    cityToken.burn(burnAmount);
                    emit Burned(msg.sender, burnAmount);
                }

                p.hasVoted[msg.sender] = true;
                p.voteCredits[msg.sender] = voteCost;
                if (support) {
                    p.totalYesCredits += voteCost;
                } else {
                    p.totalNoCredits += voteCost;
                }
                updateReputation(msg.sender, proposalId);
                emit Voted(proposalId, msg.sender, support, voteCost);
                checkVeto(proposalId);
            }
        }
    }

    /// @notice Vote on behalf of another citizen as their proxy
    /// @param proposalId ID of the proposal to vote on
    /// @param support True for yes, false for no
    /// @param credits Amount of voting credits to allocate
    /// @param voter Address of the citizen being proxied
    function proxyVote(uint256 proposalId, bool support, uint256 credits, address voter) 
        external 
        onlyCitizen 
        activeProposal(proposalId) 
        nonReentrant 
    {
        require(credits > 0, "Credits must be non-zero");
        ProxyVote storage proxy = proxies[voter];
        require(msg.sender == proxy.proxy, "Not authorized proxy");
        require(block.timestamp <= proxy.expiry, "Proxy expired");
        Proposal storage p = proposals[proposalId];
        require(!p.hasVoted[voter] && !p.hasVetoed[voter], "Voter already participated");

        uint256 effectiveCredits = calculateEffectiveCredits(voter, proposalId, credits);
        uint256 burnAmount = (effectiveCredits * BURN_PERCENTAGE) / 100;
        uint256 voteCost = effectiveCredits - burnAmount;
        require(cityToken.balanceOf(voter) >= voteCost, "Insufficient voter balance");
        require(cityToken.transferFrom(voter, address(this), voteCost), "Token transfer failed");
        if (burnAmount > 0) {
            cityToken.burn(burnAmount);
            emit Burned(voter, burnAmount);
        }

        p.hasVoted[voter] = true;
        p.voteCredits[voter] = voteCost;
        if (support) {
            p.totalYesCredits += voteCost;
        } else {
            p.totalNoCredits += voteCost;
        }
        updateReputation(voter, proposalId);
        emit Voted(proposalId, voter, support, voteCost);
        checkVeto(proposalId);
    }

    // Execute a proposal
    function executeProposal(uint256 proposalId) external nonReentrant {
        Proposal storage p = proposals[proposalId];
        require(proposalId <= proposalCount && proposalId > 0, "Invalid proposal ID");
        require(block.timestamp >= p.endTime, "Voting still active");
        require(!p.executed, "Already executed");
        require(!p.paused, "Proposal paused");

        p.executed = true;
        bool passed = p.totalYesCredits > p.totalNoCredits;

        // Execute budget proposal by transferring tokens
        if (passed && p.category == Category.Budget && p.targetAddress != address(0) && p.allocatedAmount > 0) {
            require(cityToken.transfer(p.targetAddress, p.allocatedAmount), "Token transfer failed");
        }

        emit ProposalExecuted(proposalId, passed, p.targetAddress, p.allocatedAmount);
    }

    // Unpause a proposal (admin-only for demo)
    function unpauseProposal(uint256 proposalId) external onlyAdmin {
        Proposal storage p = proposals[proposalId];
        require(p.paused, "Not paused");
        p.paused = false;
        emit ProposalUnpaused(proposalId);
    }

    // Check if veto threshold is met
    function checkVeto(uint256 proposalId) internal {
        Proposal storage p = proposals[proposalId];
        if (totalCitizens > 0 && (p.vetoVotes * 100) / totalCitizens >= VETO_THRESHOLD) {
            p.paused = true;
            emit ProposalPaused(proposalId);
        }
    }

    // Calculate effective voting credits
    function calculateEffectiveCredits(address voter, uint256 proposalId, uint256 requestedCredits) 
        internal view returns (uint256) 
    {
        Proposal storage p = proposals[proposalId];
        uint256 baseCredits = BASE_VOTE_CREDITS;
        uint256 expertiseBonus = expertise[voter][p.category];
        uint256 repBonus = delegations[voter].reputation / 100;

        // Traverse delegation chain with depth limit
        address current = voter;
        uint256 timeBonus = 0;
        uint256 depth = 0;
        while (delegations[current].delegate != address(0) && depth < MAX_DELEGATION_DEPTH) {
            timeBonus += (block.timestamp - delegations[current].startTime) / 1 days;
            current = delegations[current].delegate;
            if (!isCitizen[current]) break;
            depth++;
        }

        uint256 totalCredits = baseCredits + (baseCredits * (expertiseBonus + repBonus + timeBonus)) / 100;
        return requestedCredits <= totalCredits ? requestedCredits : totalCredits;
    }

    // Update delegate reputation
    function updateReputation(address voter, uint256 proposalId) internal {
        address delegate = delegations[voter].delegate;
        if (delegate != address(0) && delegations[delegate].reputation < 1000 && !proposals[proposalId].hasVetoed[voter]) {
            Proposal storage p = proposals[proposalId];
            bool voterSupport = p.voteCredits[voter] > 0 && p.totalYesCredits >= p.totalNoCredits;
            bool delegateSupport = p.hasVoted[delegate] && p.voteCredits[delegate] > 0 && p.totalYesCredits >= p.totalNoCredits;
            if (voterSupport == delegateSupport) {
                delegations[delegate].reputation++;
            }
        }
    }

    // View proposal results
    function getProposalResult(uint256 proposalId) 
        external view 
        returns (string memory description, uint256 yesCredits, uint256 noCredits, bool executed, bool paused) 
    {
        Proposal storage p = proposals[proposalId];
        return (p.description, p.totalYesCredits, p.totalNoCredits, p.executed, p.paused);
    }

    /// @notice Fetch detailed information about a proposal
    /// @param proposalId ID of the proposal to query
    /// @return description Proposal description
    /// @return category Proposal category (Budget, Policy, Infrastructure, Other)
    /// @return endTime Timestamp when voting ends
    /// @return targetAddress Address to receive funds for budget proposals
    /// @return allocatedAmount Amount of tokens for budget proposals
    /// @return totalYesCredits Total credits for yes votes
    /// @return totalNoCredits Total credits for no votes
    /// @return vetoVotes Number of veto votes
    /// @return executed Whether the proposal has been executed
    /// @return paused Whether the proposal is paused
    function getProposal(uint256 proposalId) 
        external view 
        returns (
            string memory description,
            Category category,
            uint256 endTime,
            address targetAddress,
            uint256 allocatedAmount,
            uint256 totalYesCredits,
            uint256 totalNoCredits,
            uint256 vetoVotes,
            bool executed,
            bool paused
        ) 
    {
        require(proposalId <= proposalCount && proposalId > 0, "Invalid proposal ID");
        Proposal storage p = proposals[proposalId];
        return (
            p.description,
            p.category,
            p.endTime,
            p.targetAddress,
            p.allocatedAmount,
            p.totalYesCredits,
            p.totalNoCredits,
            p.vetoVotes,
            p.executed,
            p.paused
        );
    }
} 