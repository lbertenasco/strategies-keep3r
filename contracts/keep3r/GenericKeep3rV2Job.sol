// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";
import "@lbertenasco/contract-utils/contracts/utils/UtilsReady.sol";

import "../sugar-mommy/Keep3rJob.sol";

import "../../interfaces/keep3r/IKeep3rV1Helper.sol";
import "../../interfaces/yearn/IBaseStrategy.sol";
import "../../interfaces/keep3r/IUniswapV2SlidingOracle.sol";
import "../../interfaces/keep3r/IKeep3rV2StrategyJob.sol";

contract GenericKeep3rV2 is UtilsReady, Keep3rJob, IKeep3rV2StrategyJob {
    using SafeMath for uint256;

    EnumerableSet.AddressSet internal availableStrategies;
    mapping(address => uint256) public requiredHarvest;
    mapping(address => uint256) public requiredTend;
    address public keep3rHelper;
    address public slidingOracle;

    address public constant KP3R = address(0x1cEB5cB57C4D4E2b2433641b95Dd330A33185A44);
    address public constant WETH = address(0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2);

    constructor(
        address _keep3rSugarMommy,
        address _keep3rHelper,
        address _slidingOracle
    ) public UtilsReady() Keep3rJob(_keep3rSugarMommy) {
        keep3rHelper = _keep3rHelper;
        slidingOracle = _slidingOracle;
    }

    // Unique method to add a strategy to the system
    // If you don't require harvest, use _requiredHarvest = 0
    // If you don't require tend, use _requiredTend = 0
    function addStrategy(
        address _strategy,
        uint256 _requiredHarvest,
        uint256 _requiredTend
    ) external override onlyGovernor {
        require(_requiredHarvest > 0 || _requiredTend > 0, "generic-keep3r-v2::add-strategy:should-need-harvest-or-tend");
        if (_requiredHarvest > 0) {
            _addHarvestStrategy(_strategy, _requiredHarvest);
        }

        if (_requiredTend > 0) {
            _addTendStrategy(_strategy, _requiredTend);
        }

        availableStrategies.add(_strategy);
    }

    function _addHarvestStrategy(address _strategy, uint256 _requiredHarvest) internal {
        require(requiredHarvest[_strategy] == 0, "generic-keep3r-v2::add-harvest-strategy:strategy-already-added");
        _setRequiredHarvest(_strategy, _requiredHarvest);
        emit HarvestStrategyAdded(_strategy, _requiredHarvest);
    }

    function _addTendStrategy(address _strategy, uint256 _requiredTend) internal {
        require(requiredTend[_strategy] == 0, "generic-keep3r-v2::add-tend-strategy:strategy-already-added");
        _setRequiredTend(_strategy, _requiredTend);
        emit TendStrategyAdded(_strategy, _requiredTend);
    }

    function updateRequiredHarvestAmount(address _strategy, uint256 _requiredHarvest) external override onlyGovernor {
        require(requiredHarvest[_strategy] > 0, "generic-keep3r-v2::update-required-harvest:strategy-not-added");
        _setRequiredHarvest(_strategy, _requiredHarvest);
        emit HarvestStrategyModified(_strategy, _requiredHarvest);
    }

    function updateRequiredTendAmount(address _strategy, uint256 _requiredTend) external override onlyGovernor {
        require(requiredTend[_strategy] > 0, "generic-keep3r-v2::update-required-tend:strategy-not-added");
        _setRequiredTend(_strategy, _requiredTend);
        emit TendStrategyModified(_strategy, _requiredTend);
    }

    function removeStrategy(address _strategy) external override onlyGovernor {
        require(requiredHarvest[_strategy] > 0 || requiredTend[_strategy] > 0, "generic-keep3r-v2::remove-strategy:strategy-not-added");
        delete requiredHarvest[_strategy];
        delete requiredTend[_strategy];
        availableStrategies.remove(_strategy);
        emit StrategyRemoved(_strategy);
    }

    function removeHarvestStrategy(address _strategy) external override onlyGovernor {
        require(requiredHarvest[_strategy] > 0, "generic-keep3r-v2::remove-harvest-strategy:strategy-not-added");
        delete requiredHarvest[_strategy];

        if (requiredTend[_strategy] == 0) {
            availableStrategies.remove(_strategy);
        }

        emit HarvestStrategyRemoved(_strategy);
    }

    function removeTendStrategy(address _strategy) external override onlyGovernor {
        require(requiredTend[_strategy] > 0, "generic-keep3r-v2::remove-tend-strategy:strategy-not-added");
        delete requiredTend[_strategy];

        if (requiredHarvest[_strategy] == 0) {
            availableStrategies.remove(_strategy);
        }

        emit TendStrategyRemoved(_strategy);
    }

    function _setRequiredHarvest(address _strategy, uint256 _requiredHarvest) internal {
        require(_requiredHarvest > 0, "generic-keep3r-v2::set-required-harvest:should-not-be-zero");
        requiredHarvest[_strategy] = _requiredHarvest;
    }

    function _setRequiredTend(address _strategy, uint256 _requiredTend) internal {
        require(_requiredTend > 0, "generic-keep3r-v2::set-required-tend:should-not-be-zero");
        requiredTend[_strategy] = _requiredTend;
    }

    // Getters
    function name() external pure override returns (string memory) {
        return "Generic Vault V2 Strategy Keep3r";
    }

    function strategies() public view override returns (address[] memory _strategies) {
        _strategies = new address[](availableStrategies.length());
        for (uint256 i; i < availableStrategies.length(); i++) {
            _strategies[i] = availableStrategies.at(i);
        }
    }

    function harvestable(address _strategy) public view override returns (bool) {
        require(requiredHarvest[_strategy] > 0, "generic-keep3r-v2::harvestable:strategy-not-added");

        uint256 kp3rCallCost = IKeep3rV1Helper(keep3rHelper).getQuoteLimit(requiredHarvest[_strategy]);
        uint256 ethCallCost = IUniswapV2SlidingOracle(slidingOracle).current(KP3R, kp3rCallCost, WETH);
        return IBaseStrategy(_strategy).harvestTrigger(ethCallCost);
    }

    function tendable(address _strategy) public view override returns (bool) {
        require(requiredTend[_strategy] > 0, "generic-keep3r-v2::tendable:strategy-not-added");

        uint256 kp3rCallCost = IKeep3rV1Helper(keep3rHelper).getQuoteLimit(requiredTend[_strategy]);
        uint256 ethCallCost = IUniswapV2SlidingOracle(slidingOracle).current(KP3R, kp3rCallCost, WETH);
        return IBaseStrategy(_strategy).tendTrigger(ethCallCost);
    }

    // Keep3r actions
    function harvest(address _strategy) external override {
        require(harvestable(_strategy), "generic-keep3r-v2::harvest:not-workable");

        _startJob(msg.sender);
        _harvest(_strategy);
        _endJob(msg.sender);

        emit HarvestedByKeeper(_strategy);
    }

    function tend(address _strategy) external override {
        require(tendable(_strategy), "generic-keep3r-v2::tend:not-workable");

        _startJob(msg.sender);
        _tend(_strategy);
        _endJob(msg.sender);

        emit TendedByKeeper(_strategy);
    }

    // Governor keeper bypass
    function forceHarvest(address _strategy) external override onlyGovernor {
        _harvest(_strategy);
        emit HarvestedByGovernor(_strategy);
    }

    function forceTend(address _strategy) external override onlyGovernor {
        _tend(_strategy);
        emit TendedByGovernor(_strategy);
    }

    function _harvest(address _strategy) internal {
        IBaseStrategy(_strategy).harvest();
    }

    function _tend(address _strategy) internal {
        IBaseStrategy(_strategy).tend();
    }
}
