// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";
import "@lbertenasco/contract-utils/contracts/abstract/MachineryReady.sol";
import "@lbertenasco/contract-utils/interfaces/keep3r/IKeep3rV1Helper.sol";
import "@lbertenasco/contract-utils/contracts/keep3r/Keep3rAbstract.sol";

import "../../interfaces/jobs/v2/IV2Keeper.sol";

import "../../interfaces/jobs/v2/IV2Keep3rJob.sol";
import "../../interfaces/yearn/IBaseStrategy.sol";
import "../../interfaces/keep3r/IUniswapV2SlidingOracle.sol";

abstract contract V2Keep3rJob is MachineryReady, Keep3r, IV2Keep3rJob {
    using SafeMath for uint256;

    address public constant WETH = address(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2);

    uint256 public constant PRECISION = 1_000;
    uint256 public constant MAX_REWARD_MULTIPLIER = 1 * PRECISION; // 1x max reward multiplier
    uint256 public override rewardMultiplier = MAX_REWARD_MULTIPLIER;

    IV2Keeper public V2Keeper;
    address public keep3rHelper;
    address public slidingOracle;

    EnumerableSet.AddressSet internal _availableStrategies;

    mapping(address => uint256) public requiredAmount;
    mapping(address => uint256) public lastWorkAt;

    uint256 public workCooldown;

    constructor(
        address _mechanicsRegistry,
        address _keep3r,
        address _bond,
        uint256 _minBond,
        uint256 _earned,
        uint256 _age,
        bool _onlyEOA,
        address _keep3rHelper,
        address _slidingOracle,
        address _v2Keeper,
        uint256 _workCooldown
    ) public MachineryReady(_mechanicsRegistry) Keep3r(_keep3r) {
        _setKeep3rRequirements(_bond, _minBond, _earned, _age, _onlyEOA);
        V2Keeper = IV2Keeper(_v2Keeper);
        keep3rHelper = _keep3rHelper;
        slidingOracle = _slidingOracle;
        if (_workCooldown > 0) _setWorkCooldown(_workCooldown);
    }

    // Keep3r Setters
    function setKeep3r(address _keep3r) external override onlyGovernor {
        _setKeep3r(_keep3r);
    }

    function setKeep3rRequirements(
        address _bond,
        uint256 _minBond,
        uint256 _earned,
        uint256 _age,
        bool _onlyEOA
    ) external override onlyGovernor {
        _setKeep3rRequirements(_bond, _minBond, _earned, _age, _onlyEOA);
    }

    function setRewardMultiplier(uint256 _rewardMultiplier) external override onlyGovernorOrMechanic {
        _setRewardMultiplier(_rewardMultiplier);
        emit SetRewardMultiplier(_rewardMultiplier);
    }

    function _setRewardMultiplier(uint256 _rewardMultiplier) internal {
        require(_rewardMultiplier <= MAX_REWARD_MULTIPLIER, "CrvStrategyKeep3rJob::set-reward-multiplier:multiplier-exceeds-max");
        rewardMultiplier = _rewardMultiplier;
    }

    // Setters
    function setWorkCooldown(uint256 _workCooldown) external override onlyGovernorOrMechanic {
        _setWorkCooldown(_workCooldown);
    }

    function _setWorkCooldown(uint256 _workCooldown) internal {
        require(_workCooldown > 0, "V2Keep3rJob::set-work-cooldown:should-not-be-zero");
        workCooldown = _workCooldown;
    }

    // Governor
    function addStrategies(address[] calldata _strategies, uint256[] calldata _requiredAmounts) external override onlyGovernorOrMechanic {
        require(_strategies.length == _requiredAmounts.length, "V2Keep3rJob::add-strategies:strategies-required-amounts-different-length");
        for (uint256 i; i < _strategies.length; i++) {
            _addStrategy(_strategies[i], _requiredAmounts[i]);
        }
    }

    function addStrategy(address _strategy, uint256 _requiredAmount) external override onlyGovernorOrMechanic {
        _addStrategy(_strategy, _requiredAmount);
    }

    function _addStrategy(address _strategy, uint256 _requiredAmount) internal {
        require(!_availableStrategies.contains(_strategy), "V2Keep3rJob::add-strategy:strategy-already-added");
        _setRequiredAmount(_strategy, _requiredAmount);
        emit StrategyAdded(_strategy, _requiredAmount);
        _availableStrategies.add(_strategy);
    }

    function updateRequiredAmounts(address[] calldata _strategies, uint256[] calldata _requiredAmounts)
        external
        override
        onlyGovernorOrMechanic
    {
        require(_strategies.length == _requiredAmounts.length, "V2Keep3rJob::update-strategies:strategies-required-amounts-different-length");
        for (uint256 i; i < _strategies.length; i++) {
            _updateRequiredAmount(_strategies[i], _requiredAmounts[i]);
        }
    }

    function updateRequiredAmount(address _strategy, uint256 _requiredAmount) external override onlyGovernorOrMechanic {
        _updateRequiredAmount(_strategy, _requiredAmount);
    }

    function _updateRequiredAmount(address _strategy, uint256 _requiredAmount) internal {
        require(_availableStrategies.contains(_strategy), "V2Keep3rJob::update-required-amount:strategy-not-added");
        _setRequiredAmount(_strategy, _requiredAmount);
        emit StrategyModified(_strategy, _requiredAmount);
    }

    function removeStrategy(address _strategy) external override onlyGovernorOrMechanic {
        require(_availableStrategies.contains(_strategy), "V2Keep3rJob::remove-strategy:strategy-not-added");
        delete requiredAmount[_strategy];
        _availableStrategies.remove(_strategy);
        emit StrategyRemoved(_strategy);
    }

    function _setRequiredAmount(address _strategy, uint256 _requiredAmount) internal {
        requiredAmount[_strategy] = _requiredAmount;
    }

    // Getters
    function strategies() public view override returns (address[] memory _strategies) {
        _strategies = new address[](_availableStrategies.length());
        for (uint256 i; i < _availableStrategies.length(); i++) {
            _strategies[i] = _availableStrategies.at(i);
        }
    }

    // Keeper view actions (internal)
    function _workable(address _strategy) internal view virtual returns (bool) {
        require(_availableStrategies.contains(_strategy), "V2Keep3rJob::workable:strategy-not-added");
        if (workCooldown == 0 || block.timestamp > lastWorkAt[_strategy].add(workCooldown)) return true;
        return false;
    }

    // Get eth costs
    function _getCallCosts(address _strategy) internal view returns (uint256 _kp3rCallCost, uint256 _ethCallCost) {
        if (requiredAmount[_strategy] == 0) return (0, 0);
        _kp3rCallCost = IKeep3rV1Helper(keep3rHelper).getQuoteLimit(requiredAmount[_strategy]);
        _ethCallCost = IUniswapV2SlidingOracle(slidingOracle).current(address(_Keep3r), _kp3rCallCost, WETH);
    }

    // Keep3r actions
    function _workInternal(address _strategy, bool _workForTokens) internal returns (uint256 _credits) {
        uint256 _initialGas = gasleft();
        require(_workable(_strategy), "V2Keep3rJob::work:not-workable");

        _work(_strategy);

        _credits = _calculateCredits(_initialGas);

        emit Worked(_strategy, msg.sender, _credits, _workForTokens);
    }

    function _calculateCredits(uint256 _initialGas) internal view returns (uint256 _credits) {
        // Gets default credits from KP3R_Helper and applies job reward multiplier
        return _getQuoteLimit(_initialGas).mul(rewardMultiplier).div(PRECISION);
    }

    // Mechanics keeper bypass
    function forceWork(address _strategy) external override onlyGovernorOrMechanic {
        _work(_strategy);
        emit ForceWorked(_strategy);
    }

    function _work(address _strategy) internal virtual {}
}
