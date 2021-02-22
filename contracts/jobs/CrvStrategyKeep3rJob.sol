// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@lbertenasco/contract-utils/contracts/abstract/MachineryReady.sol";
import "@lbertenasco/contract-utils/contracts/keep3r/Keep3rAbstract.sol";

import "../proxy-job/Keep3rJob.sol";
import "../../interfaces/jobs/ICrvStrategyKeep3rJob.sol";
import "../../interfaces/keep3r/IKeep3rEscrow.sol";

import "../../interfaces/crv/ICrvStrategy.sol";
import "../../interfaces/crv/ICrvClaimable.sol";

contract CrvStrategyKeep3rJob is MachineryReady, Keep3rJob, ICrvStrategyKeep3rJob {
    using SafeMath for uint256;

    mapping(address => uint256) public requiredHarvest;

    EnumerableSet.AddressSet internal _availableStrategies;

    constructor(address _mechanicsRegistry, address _keep3rProxyJob) public MachineryReady(_mechanicsRegistry) Keep3rJob(_keep3rProxyJob) {}

    // Setters
    function addStrategies(address[] calldata _strategies, uint256[] calldata _requiredHarvests) external override onlyGovernor {
        require(
            _strategies.length == _requiredHarvests.length,
            "CrvStrategyKeep3rJob::add-strategies:strategies-required-harvests-different-length"
        );
        for (uint256 i; i < _strategies.length; i++) {
            _addStrategy(_strategies[i], _requiredHarvests[i]);
        }
    }

    function addStrategy(address _strategy, uint256 _requiredHarvest) external override onlyGovernor {
        _addStrategy(_strategy, _requiredHarvest);
    }

    function _addStrategy(address _strategy, uint256 _requiredHarvest) internal {
        require(requiredHarvest[_strategy] == 0, "CrvStrategyKeep3rJob::add-strategy:strategy-already-added");
        _setRequiredHarvest(_strategy, _requiredHarvest);
        _availableStrategies.add(_strategy);
        emit StrategyAdded(_strategy, _requiredHarvest);
    }

    function updateRequiredHarvestAmount(address _strategy, uint256 _requiredHarvest) external override onlyGovernor {
        require(requiredHarvest[_strategy] > 0, "CrvStrategyKeep3rJob::update-required-harvest:strategy-not-added");
        _setRequiredHarvest(_strategy, _requiredHarvest);
        emit StrategyModified(_strategy, _requiredHarvest);
    }

    function removeStrategy(address _strategy) external override onlyGovernor {
        require(requiredHarvest[_strategy] > 0, "CrvStrategyKeep3rJob::remove-strategy:strategy-not-added");
        requiredHarvest[_strategy] = 0;
        _availableStrategies.remove(_strategy);
        emit StrategyRemoved(_strategy);
    }

    function _setRequiredHarvest(address _strategy, uint256 _requiredHarvest) internal {
        require(_requiredHarvest > 0, "CrvStrategyKeep3rJob::set-required-harvest:should-not-be-zero");
        requiredHarvest[_strategy] = _requiredHarvest;
    }

    // Getters
    function strategies() public view override returns (address[] memory _strategies) {
        _strategies = new address[](_availableStrategies.length());
        for (uint256 i; i < _availableStrategies.length(); i++) {
            _strategies[i] = _availableStrategies.at(i);
        }
    }

    // Job actions
    function getWorkData() public override returns (bytes memory _workData) {
        for (uint256 i; i < _availableStrategies.length(); i++) {
            address _strategy = _availableStrategies.at(i);
            if (_workable(_strategy)) return abi.encode(_strategy);
        }
    }

    function decodeWorkData(bytes memory _workData) public pure returns (address _strategy) {
        return abi.decode(_workData, (address));
    }

    function calculateHarvest(address _strategy) public override returns (uint256 _amount) {
        require(requiredHarvest[_strategy] > 0, "CrvStrategyKeep3rJob::calculate-harvest:strategy-not-added");
        address _gauge = ICrvStrategy(_strategy).gauge();
        address _voter = ICrvStrategy(_strategy).voter();
        return ICrvClaimable(_gauge).claimable_tokens(_voter);
    }

    function workable() public override returns (bool) {
        for (uint256 i; i < _availableStrategies.length(); i++) {
            if (_workable(_availableStrategies.at(i))) return true;
        }
        return false;
    }

    function _workable(address _strategy) internal returns (bool) {
        require(requiredHarvest[_strategy] > 0, "CrvStrategyKeep3rJob::workable:strategy-not-added");
        return calculateHarvest(_strategy) >= requiredHarvest[_strategy];
    }

    // Keep3r actions
    function work(bytes memory _workData) external override notPaused onlyProxyJob {
        address _strategy = decodeWorkData(_workData);
        require(_workable(_strategy), "CrvStrategyKeep3rJob::harvest:not-workable");

        _harvest(_strategy);

        emit Worked(_strategy);
    }

    // Governor keeper bypass
    function forceWork(address _strategy) external override onlyGovernorOrMechanic {
        _harvest(_strategy);
        emit ForceWorked(_strategy);
    }

    function _harvest(address _strategy) internal {
        IHarvestableStrategy(_strategy).harvest();
    }
}
