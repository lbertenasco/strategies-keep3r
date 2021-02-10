// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@lbertenasco/contract-utils/contracts/keep3r/Keep3rAbstract.sol";

import "../sugar-mommy/Keep3rJob.sol";

import "../../interfaces/keep3r/ICrvStrategyKeep3rJob.sol";

import "../../interfaces/crv/ICrvStrategy.sol";
import "../../interfaces/crv/ICrvClaimable.sol";

contract CrvStrategyKeep3rJob is UtilsReady, Keep3rJob, ICrvStrategyKeep3rJob {
    using SafeMath for uint256;

    mapping(address => uint256) public requiredHarvest;

    EnumerableSet.AddressSet internal availableStrategies;

    constructor(address _keep3rSugarMommy) public UtilsReady() Keep3rJob(_keep3rSugarMommy) {}

    function isCrvStrategyKeep3rJob() external pure override returns (bool) {
        return true;
    }

    // Setters
    function addStrategies(address[] calldata _strategies, uint256[] calldata _requiredHarvests) external override onlyGovernor {
        require(
            _strategies.length == _requiredHarvests.length,
            "crv-strategy-keep3r::add-strategies:strategies-required-harvests-different-length"
        );
        for (uint256 i; i < _strategies.length; i++) {
            _addStrategy(_strategies[i], _requiredHarvests[i]);
        }
    }

    function addStrategy(address _strategy, uint256 _requiredHarvest) external override onlyGovernor {
        _addStrategy(_strategy, _requiredHarvest);
    }

    function _addStrategy(address _strategy, uint256 _requiredHarvest) internal {
        require(requiredHarvest[_strategy] == 0, "crv-strategy-keep3r::add-strategy:strategy-already-added");
        _setRequiredHarvest(_strategy, _requiredHarvest);
        availableStrategies.add(_strategy);
        emit StrategyAdded(_strategy, _requiredHarvest);
    }

    function updateRequiredHarvestAmount(address _strategy, uint256 _requiredHarvest) external override onlyGovernor {
        require(requiredHarvest[_strategy] > 0, "crv-strategy-keep3r::update-required-harvest:strategy-not-added");
        _setRequiredHarvest(_strategy, _requiredHarvest);
        emit StrategyModified(_strategy, _requiredHarvest);
    }

    function removeStrategy(address _strategy) external override onlyGovernor {
        require(requiredHarvest[_strategy] > 0, "crv-strategy-keep3r::remove-strategy:strategy-not-added");
        requiredHarvest[_strategy] = 0;
        availableStrategies.remove(_strategy);
        emit StrategyRemoved(_strategy);
    }

    function _setRequiredHarvest(address _strategy, uint256 _requiredHarvest) internal {
        require(_requiredHarvest > 0, "crv-strategy-keep3r::set-required-harvest:should-not-be-zero");
        requiredHarvest[_strategy] = _requiredHarvest;
    }

    // Getters
    function strategies() public view override returns (address[] memory _strategies) {
        _strategies = new address[](availableStrategies.length());
        for (uint256 i; i < availableStrategies.length(); i++) {
            _strategies[i] = availableStrategies.at(i);
        }
    }

    function calculateHarvest(address _strategy) public override returns (uint256 _amount) {
        require(requiredHarvest[_strategy] > 0, "crv-strategy-keep3r::calculate-harvest:strategy-not-added");
        address _gauge = ICrvStrategy(_strategy).gauge();
        address _voter = ICrvStrategy(_strategy).voter();
        return ICrvClaimable(_gauge).claimable_tokens(_voter);
    }

    function workable(address _strategy) public override returns (bool) {
        require(requiredHarvest[_strategy] > 0, "crv-strategy-keep3r::workable:strategy-not-added");
        return calculateHarvest(_strategy) >= requiredHarvest[_strategy];
    }

    // Keep3r actions
    function work(address _strategy) external override {
        require(workable(_strategy), "crv-strategy-keep3r::harvest:not-workable");

        _startJob(msg.sender);

        _harvest(_strategy);

        _endJob(msg.sender);

        emit HarvestByKeeper(_strategy);
    }

    // Governor keeper bypass
    function forceWork(address _strategy) external override onlyGovernor {
        _harvest(_strategy);
        emit HarvestByGovernor(_strategy);
    }

    function _harvest(address _strategy) internal {
        IHarvestableStrategy(_strategy).harvest();
    }
}
