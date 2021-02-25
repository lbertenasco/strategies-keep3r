// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@lbertenasco/contract-utils/contracts/abstract/MachineryReady.sol";
import "@lbertenasco/contract-utils/contracts/keep3r/Keep3rAbstract.sol";

import "../proxy-job/Keep3rJob.sol";
import "../../interfaces/jobs/ICrvStrategyKeep3rJob.sol";
import "../../interfaces/keep3r/IKeep3rEscrow.sol";

import "../../interfaces/yearn/IV1Controller.sol";
import "../../interfaces/yearn/IV1Vault.sol";
import "../../interfaces/crv/ICrvStrategy.sol";
import "../../interfaces/crv/ICrvClaimable.sol";

contract CrvStrategyKeep3rJob is MachineryReady, Keep3rJob, ICrvStrategyKeep3rJob {
    using SafeMath for uint256;

    mapping(address => uint256) public requiredHarvest;

    EnumerableSet.AddressSet internal _availableStrategies;

    uint256 public override availableThreshold;

    constructor(
        address _mechanicsRegistry,
        address _keep3rProxyJob,
        uint256 _maxCredits,
        uint256 _availableThreshold
    ) public MachineryReady(_mechanicsRegistry) Keep3rJob(_keep3rProxyJob) {
        _setMaxCredits(_maxCredits);
        _setAvailableThreshold(_availableThreshold);
    }

    // Setters
    function addStrategies(address[] calldata _strategies, uint256[] calldata _requiredHarvests) external override onlyGovernorOrMechanic {
        require(
            _strategies.length == _requiredHarvests.length,
            "CrvStrategyKeep3rJob::add-strategies:strategies-required-harvests-different-length"
        );
        for (uint256 i; i < _strategies.length; i++) {
            _addStrategy(_strategies[i], _requiredHarvests[i]);
        }
    }

    function addStrategy(address _strategy, uint256 _requiredHarvest) external override onlyGovernorOrMechanic {
        _addStrategy(_strategy, _requiredHarvest);
    }

    function _addStrategy(address _strategy, uint256 _requiredHarvest) internal {
        require(requiredHarvest[_strategy] == 0, "CrvStrategyKeep3rJob::add-strategy:strategy-already-added");
        _setRequiredHarvest(_strategy, _requiredHarvest);
        _availableStrategies.add(_strategy);
        emit StrategyAdded(_strategy, _requiredHarvest);
    }

    function updateRequiredHarvestAmount(address _strategy, uint256 _requiredHarvest) external override onlyGovernorOrMechanic {
        require(requiredHarvest[_strategy] > 0, "CrvStrategyKeep3rJob::update-required-harvest:strategy-not-added");
        _setRequiredHarvest(_strategy, _requiredHarvest);
        emit StrategyModified(_strategy, _requiredHarvest);
    }

    function removeStrategy(address _strategy) external override onlyGovernorOrMechanic {
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

    function workable() public override notPaused returns (bool) {
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
    function work(bytes memory _workData) external override notPaused onlyProxyJob updateCredits {
        address _strategy = decodeWorkData(_workData);
        require(_workable(_strategy), "CrvStrategyKeep3rJob::harvest:not-workable");

        _harvest(_strategy);

        emit Worked(_strategy);
    }

    // Mechanics Setters
    function setMaxCredits(uint256 _maxCredits) external override onlyGovernorOrMechanic {
        _setMaxCredits(_maxCredits);
    }

    function setAvailableThreshold(uint256 _availableThreshold) external override onlyGovernorOrMechanic {
        _setAvailableThreshold(_availableThreshold);
    }

    function _setAvailableThreshold(uint256 _availableThreshold) internal {
        availableThreshold = _availableThreshold;
    }

    // Mechanics keeper bypass
    function forceWork(address _strategy) external override onlyGovernorOrMechanic {
        _harvest(_strategy);
        emit ForceWorked(_strategy);
    }

    function _harvest(address _strategy) internal {
        address controller = ICrvStrategy(_strategy).controller();
        address want = ICrvStrategy(_strategy).want();
        address vault = IV1Controller(controller).vaults(want);
        uint256 available = IV1Vault(vault).available();
        if (available >= availableThreshold) {
            IV1Vault(vault).earn();
        }
        ICrvStrategy(_strategy).harvest();
    }
}
