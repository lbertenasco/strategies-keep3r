// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";
import "@lbertenasco/contract-utils/contracts/abstract/MachineryReady.sol";
import "@lbertenasco/contract-utils/interfaces/keep3r/IKeep3rV1Helper.sol";
import "@lbertenasco/contract-utils/contracts/keep3r/Keep3rAbstract.sol";

import "../../interfaces/jobs/v2/IV2Keeper.sol";

import "../../interfaces/jobs/v2/IV2QueueKeep3rJob.sol";
import "../../interfaces/yearn/IBaseStrategy.sol";
import "../../interfaces/keep3r/IUniswapV2SlidingOracle.sol";

abstract contract V2QueueKeep3rJob is MachineryReady, Keep3r, IV2QueueKeep3rJob {
    using SafeMath for uint256;

    address public constant WETH = address(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2);

    uint256 public constant PRECISION = 1_000;
    uint256 public constant MAX_REWARD_MULTIPLIER = 1 * PRECISION; // 1x max reward multiplier
    uint256 public override rewardMultiplier = MAX_REWARD_MULTIPLIER;

    address public v2Keeper;
    address public keep3rHelper;
    address public oracle;

    EnumerableSet.AddressSet internal _availableStrategies;

    mapping(address => address[]) public strategyQueue;
    mapping(address => uint256[]) public strategyAmounts;
    mapping(address => uint256) public strategyQueueIndex;

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
        address _oracle,
        address _v2Keeper,
        uint256 _workCooldown
    ) public MachineryReady(_mechanicsRegistry) Keep3r(_keep3r) {
        _setKeep3rRequirements(_bond, _minBond, _earned, _age, _onlyEOA);
        v2Keeper = _v2Keeper;
        keep3rHelper = _keep3rHelper;
        oracle = _oracle;
        if (_workCooldown > 0) _setWorkCooldown(_workCooldown);
    }

    // Keep3r Setters
    function setKeep3r(address _keep3r) external override onlyGovernor {
        _setKeep3r(_keep3r);
    }

    function setV2Keep3r(address _v2Keeper) external override onlyGovernor {
        v2Keeper = _v2Keeper;
    }

    function setOracle(address _oracle) external override onlyGovernor {
        oracle = _oracle;
    }

    function setKeep3rHelper(address _keep3rHelper) external override onlyGovernor {
        keep3rHelper = _keep3rHelper;
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
        require(_workCooldown > 0, "V2QueueKeep3rJob::set-work-cooldown:should-not-be-zero");
        workCooldown = _workCooldown;
    }

    // Governor

    function addStrategy(
        address _strategy,
        address[] calldata _strategies,
        uint256[] calldata _requiredAmounts
    ) external override onlyGovernorOrMechanic {
        _setStrategy(_strategy, _strategies, _requiredAmounts);
    }

    function _setStrategy(
        address _strategy,
        address[] calldata _strategies,
        uint256[] calldata _requiredAmounts
    ) internal {
        require(strategyQueue[_strategy].length == 0, "V2QueueKeep3rJob::add-strategy:strategy-already-added");
        strategyQueue[_strategy] = _strategies;
        strategyAmounts[_strategy] = _requiredAmounts;
        // emit StrategyAdded(_strategy, _strategies, _strategies);
        _availableStrategies.add(_strategy);
    }

    function removeStrategy(address _strategy) external override onlyGovernorOrMechanic {
        require(strategyQueue[_strategy].length > 0, "V2QueueKeep3rJob::remove-strategy:strategy-not-added");
        delete strategyQueue[_strategy];
        delete strategyAmounts[_strategy];
        _availableStrategies.remove(_strategy);
        emit StrategyRemoved(_strategy);
    }

    // Getters
    function strategies() public view override returns (address[] memory _strategies) {
        _strategies = new address[](_availableStrategies.length());
        for (uint256 i; i < _availableStrategies.length(); i++) {
            _strategies[i] = _availableStrategies.at(i);
        }
    }

    // Keeper view actions (internal)
    function _workable(address _strategy, uint256 _workAmount) internal view virtual returns (bool) {
        (, bytes32 _strategyIndexBytes) = _getWorkableStrategies(_strategy, _workAmount);
        return uint256(_strategyIndexBytes) > 0;
    }

    function _getWorkableStrategies(address _strategy, uint256 _workAmount)
        internal
        view
        returns (uint256 _queueIndex, bytes32 _strategyIndexBytes)
    {
        require(_availableStrategies.contains(_strategy), "V2QueueKeep3rJob::workable:strategy-not-added");
        require(workCooldown == 0 || block.timestamp > lastWorkAt[_strategy].add(workCooldown), "V2QueueKeep3rJob::workable:on-cooldown");
        // grab current index
        _queueIndex = strategyQueueIndex[_strategy];
        uint256 _index = strategyQueueIndex[_strategy];
        uint256 _maxLength =
            _index.add(_workAmount) >= strategyQueue[_strategy].length ? strategyQueue[_strategy].length : _index.add(_workAmount);
        // loop through strategies queue _workAmount of times starting from index
        for (; _index < _maxLength; _index++) {
            // work if workable
            if (_strategyTrigger(strategyQueue[_strategy][_index], strategyAmounts[_strategy][_index])) {
                _strategyIndexBytes = _strategyIndexBytes | bytes32(2**_index);
                // _amount = _amount.add(1);
            }
        }

        // TODO Move below to work function!
        // // save index if unfinished queue
        // if (_index == strategyQueue[_strategy].length) {
        //     strategyQueueIndex[_strategy] = _index;
        // } else {
        //     // if index max, set index as 0 and lastWorkAt = now
        //     strategyQueueIndex[_strategy] = 0;
        //     lastWorkAt[_strategy] = block.timestamp;
        // }
    }

    // Get eth costs
    function _getCallCost() internal view returns (uint256 _kp3rCallCost, uint256 _ethCallCost) {
        _kp3rCallCost = IKeep3rV1Helper(keep3rHelper).quote(1 ether);
        _ethCallCost = IUniswapV2SlidingOracle(oracle).current(address(_Keep3r), _kp3rCallCost, WETH);
    }

    function _getCallCosts(address _strategy) internal view returns (uint256 _kp3rCallCost, uint256 _ethCallCost) {
        // if (requiredAmount[_strategy] == 0) return (0, 0);
        // _kp3rCallCost = IKeep3rV1Helper(keep3rHelper).getQuoteLimit(requiredAmount[_strategy]);
        // _ethCallCost = IUniswapV2SlidingOracle(oracle).current(address(_Keep3r), _kp3rCallCost, WETH);
    }

    function _strategyTrigger(address _strategy, uint256 _amount) internal view virtual returns (bool) {}

    // Keep3r actions
    function _workInternal(
        address _strategy,
        uint256 _workAmount,
        bool _workForTokens
    ) internal returns (uint256 _credits) {
        uint256 _initialGas = gasleft();
        (uint256 _queueIndex, bytes32 _strategyIndexBytes) = _getWorkableStrategies(_strategy, _workAmount);
        require(_strategyIndexBytes > 0, "V2QueueKeep3rJob::work:not-workable");

        // TODO getMax Length before workable and pass it through
        for (; _queueIndex < strategyQueueIndex[_strategy]; _queueIndex++) {
            // recover with _strategyIndexBytes & 2**_index == 2**_index
            if (_strategyIndexBytes & bytes32(2**_queueIndex) == bytes32(2**_queueIndex)) {
                _work(strategyQueue[_strategy][_queueIndex]);
            }
        }

        _credits = _calculateCredits(_initialGas);

        emit Worked(_strategy, _workAmount, msg.sender, _credits, _workForTokens);
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
