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
import "../../interfaces/keep3r/IChainLinkFeed.sol";

abstract contract V2QueueKeep3rJob is MachineryReady, Keep3r, IV2QueueKeep3rJob {
    using SafeMath for uint256;

    address public constant WETH = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;
    address public override fastGasOracle = 0x169E633A2D1E6c10dD91238Ba11c4A708dfEF37C;

    uint256 public constant PRECISION = 1_000;
    uint256 public constant MAX_REWARD_MULTIPLIER = 1 * PRECISION; // 1x max reward multiplier
    uint256 public override rewardMultiplier = MAX_REWARD_MULTIPLIER;

    address public v2Keeper;
    address public oracle;

    EnumerableSet.AddressSet internal _availableStrategies;

    // strategy queue strategies
    mapping(address => address[]) public strategyQueue;
    // strategy queue amounts
    mapping(address => uint256[]) public strategyAmounts;
    // last strategy workAt timestamp
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
        address _v2Keeper,
        uint256 _workCooldown
    ) public MachineryReady(_mechanicsRegistry) Keep3r(_keep3r) {
        _setKeep3rRequirements(_bond, _minBond, _earned, _age, _onlyEOA);
        v2Keeper = _v2Keeper;
        if (_workCooldown > 0) _setWorkCooldown(_workCooldown);
    }

    // Keep3r Setters
    function setKeep3r(address _keep3r) external override onlyGovernor {
        _setKeep3r(_keep3r);
    }

    function setV2Keep3r(address _v2Keeper) external override onlyGovernor {
        v2Keeper = _v2Keeper;
    }

    function setFastGasOracle(address _fastGasOracle) external override onlyGovernor {
        require(_fastGasOracle != address(0), "V2QueueKeep3rJob::set-fas-gas-oracle:not-zero-address");
        fastGasOracle = _fastGasOracle;
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
        require(_rewardMultiplier <= MAX_REWARD_MULTIPLIER, "V2QueueKeep3rJob::set-reward-multiplier:multiplier-exceeds-max");
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
    function setStrategy(
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

    function strategyQueueList(address _strategy) public view override returns (address[] memory _strategies) {
        _strategies = new address[](strategyQueue[_strategy].length);
        for (uint256 i; i < strategyQueue[_strategy].length; i++) {
            _strategies[i] = strategyQueue[_strategy][i];
        }
    }

    // Keeper view actions (internal)
    function _mainStrategyWorkable(address _strategy) internal view virtual returns (bool) {
        require(_availableStrategies.contains(_strategy), "V2QueueKeep3rJob::main-workable:strategy-not-added");
        require(workCooldown == 0 || block.timestamp > lastWorkAt[_strategy].add(workCooldown), "V2QueueKeep3rJob::main-workable:on-cooldown");
        return true;
    }

    function _workable(address _strategy) internal view virtual returns (bool) {
        return _mainStrategyWorkable(_strategy);
    }

    // Get eth costs
    function _getEthGasPrice() internal view returns (uint256 _ethGasPrice) {
        return uint256(IChainLinkFeed(fastGasOracle).latestAnswer());
    }

    function _strategyTrigger(address _strategy, uint256 _amount) internal view virtual returns (bool) {}

    // Keep3r actions
    function _workInternal(address _strategy, bool _workForTokens) internal returns (uint256 _credits) {
        uint256 _initialGas = gasleft();
        uint256 _ethGasPrice = _getEthGasPrice();
        // Checks if main strategy is workable
        require(_mainStrategyWorkable(_strategy), "V2QueueKeep3rJob::work:main-not-workable");
        bool mainWorked = false;

        for (uint256 _index = 0; _index < strategyQueue[_strategy].length; _index++) {
            uint256 _ethAmount = strategyAmounts[_strategy][_index].mul(_ethGasPrice);
            if (_strategyTrigger(strategyQueue[_strategy][_index], _ethAmount)) {
                _work(strategyQueue[_strategy][_index]);
                if (strategyQueue[_strategy][_index] == _strategy) mainWorked = true;
            }
        }
        require(mainWorked, "V2QueueKeep3rJob::work:main-not-worked");

        lastWorkAt[_strategy] = block.timestamp;

        _credits = _calculateCredits(_initialGas);

        emit Worked(_strategy, msg.sender, _credits, _workForTokens);
    }

    function _calculateCredits(uint256 _initialGas) internal view returns (uint256 _credits) {
        // Gets default credits from KP3R_Helper and applies job reward multiplier
        return _getQuoteLimitFor(tx.origin, _initialGas).mul(rewardMultiplier).div(PRECISION);
    }

    // Mechanics keeper bypass
    function forceWork(address _strategy) external override onlyGovernorOrMechanic {
        _work(_strategy);
        emit ForceWorked(_strategy);
    }

    function _work(address _strategy) internal virtual {}
}
