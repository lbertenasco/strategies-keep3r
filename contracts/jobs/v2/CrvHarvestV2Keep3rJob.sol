// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

// V1 crv
import "../../interfaces/yearn/IV1Controller.sol";
import "../../interfaces/yearn/IV1Vault.sol";
import "../../interfaces/crv/ICrvStrategy.sol";
import "../../interfaces/crv/ICrvClaimable.sol";

import "../../interfaces/jobs/v2/ICrvV2Keep3rJob.sol";
import "./V2Keep3rJob.sol";

contract CrvHarvestV2Keep3rJob is V2Keep3rJob, ICrvV2Keep3rJob {
    // V1 specific
    mapping(address => uint256) public override requiredEarn;

    uint256 public override maxHarvestPeriod;
    uint256 public override lastHarvest;
    uint256 public override harvestCooldown;

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
    ) public V2Keep3rJob(_mechanicsRegistry, _keep3r, _bond, _minBond, _earned, _age, _onlyEOA, _v2Keeper, _workCooldown) {}

    function workable(address _strategy) external view override returns (bool) {
        _strategy; // shh
        revert("use callStatic.workableStatic(_strategy)");
    }

    function workableStatic(address _strategy) external override returns (bool) {
        return _workableCrv(_strategy);
    }

    function _workableCrv(address _strategy) internal returns (bool) {
        require(_availableStrategies.contains(_strategy), "CrvHarvestV2Keep3rJob::workable:strategy-not-added");
        if (workCooldown == 0 || block.timestamp > lastWorkAt[_strategy].add(workCooldown)) return true;
        if (_isV1Strategy(_strategy)) {
            return _workableV1(_strategy);
        }
        return IBaseStrategy(_strategy).harvestTrigger(_getCallCosts(_strategy));
    }

    // V1
    function setMaxHarvestPeriod(uint256 _maxHarvestPeriod) external override onlyGovernorOrMechanic {
        _setMaxHarvestPeriod(_maxHarvestPeriod);
    }

    function _setMaxHarvestPeriod(uint256 _maxHarvestPeriod) internal {
        require(_maxHarvestPeriod > 0, "CrvHarvestV2Keep3rJob::set-max-harvest-period:should-not-be-zero");
        maxHarvestPeriod = _maxHarvestPeriod;
    }

    function setHarvestCooldown(uint256 _harvestCooldown) external override onlyGovernorOrMechanic {
        _setHarvestCooldown(_harvestCooldown);
    }

    function _setHarvestCooldown(uint256 _harvestCooldown) internal {
        harvestCooldown = _harvestCooldown;
    }

    // V1 strategies
    function addV1Strategies(
        address[] calldata _strategies,
        uint256[] calldata _requiredAmounts,
        uint256[] calldata _requiredEarns
    ) external override onlyGovernorOrMechanic {
        require(
            _strategies.length == _requiredAmounts.length,
            "CrvHarvestV2Keep3rJob::add-strategies:strategies-required-amounts-different-length"
        );
        for (uint256 i; i < _strategies.length; i++) {
            _addV1Strategy(_strategies[i], _requiredAmounts[i], _requiredEarns[i]);
        }
    }

    function addV1Strategy(
        address _strategy,
        uint256 _requiredAmount,
        uint256 _requiredEarn
    ) external override onlyGovernorOrMechanic {
        _addV1Strategy(_strategy, _requiredAmount, _requiredEarn);
    }

    function _addV1Strategy(
        address _strategy,
        uint256 _requiredAmount,
        uint256 _requiredEarn
    ) internal {
        require(!_availableStrategies.contains(_strategy), "CrvHarvestV2Keep3rJob::add-strategy:strategy-already-added");
        _setRequiredAmount(_strategy, _requiredAmount);
        _setRequiredEarn(_strategy, _requiredEarn);
        emit StrategyAdded(_strategy, _requiredAmount);
        _availableStrategies.add(_strategy);
    }

    function updateV1Strategies(
        address[] calldata _strategies,
        uint256[] calldata _requiredAmounts,
        uint256[] calldata _requiredEarns
    ) external override onlyGovernorOrMechanic {
        require(
            _strategies.length == _requiredAmounts.length && _strategies.length == _requiredEarns.length,
            "CrvHarvestV2Keep3rJob::update-strategies:strategies-required-harvests-and-earns-different-length"
        );
        for (uint256 i; i < _strategies.length; i++) {
            _updateV1Strategy(_strategies[i], _requiredAmounts[i], _requiredEarns[i]);
        }
    }

    function updateV1Strategy(
        address _strategy,
        uint256 _requiredAmount,
        uint256 _requiredEarn
    ) external override onlyGovernorOrMechanic {
        _updateV1Strategy(_strategy, _requiredAmount, _requiredEarn);
    }

    function _updateV1Strategy(
        address _strategy,
        uint256 _requiredAmount,
        uint256 _requiredEarn
    ) internal {
        require(requiredAmount[_strategy] > 0, "CrvHarvestV2Keep3rJob::update-required-harvest:strategy-not-added");
        _setRequiredAmount(_strategy, _requiredAmount);
        _setRequiredEarn(_strategy, _requiredEarn);
        emit V1StrategyModified(_strategy, _requiredAmount, _requiredEarn);
    }

    function _setRequiredEarn(address _strategy, uint256 _requiredEarn) internal {
        require(_requiredEarn > 0, "CrvHarvestV2Keep3rJob::set-required-earn:should-not-be-zero");
        requiredEarn[_strategy] = _requiredEarn;
    }

    // V1 work
    function _workableV1(address _strategy) internal returns (bool) {
        require(requiredAmount[_strategy] > 0, "CrvHarvestV2Keep3rJob::workable:strategy-not-added");
        // ensures no other strategy has been harvested for at least the harvestCooldown
        if (block.timestamp < lastHarvest.add(harvestCooldown)) return false;
        // if strategy has exceeded maxHarvestPeriod, force workable true
        if (block.timestamp > lastWorkAt[_strategy].add(maxHarvestPeriod)) return true;
        return calculateV1Harvest(_strategy) >= requiredAmount[_strategy];
    }

    function calculateV1Harvest(address _strategy) public override returns (uint256 _amount) {
        require(requiredAmount[_strategy] > 0, "CrvHarvestV2Keep3rJob::calculate-harvest:strategy-not-added");
        address _gauge = ICrvStrategy(_strategy).gauge();
        address _voter = ICrvStrategy(_strategy).voter();
        return ICrvClaimable(_gauge).claimable_tokens(_voter);
    }

    function _workV1(address _strategy, bool _workForTokens) internal returns (uint256 _credits) {
        uint256 _initialGas = gasleft();
        require(_workable(_strategy), "CrvHarvestV2Keep3rJob::harvest:not-workable");

        // Checks if vault has enough available amount to earn
        address controller = ICrvStrategy(_strategy).controller();
        address want = ICrvStrategy(_strategy).want();
        address vault = IV1Controller(controller).vaults(want);
        uint256 available = IV1Vault(vault).available();
        if (available >= requiredEarn[_strategy]) {
            IV1Vault(vault).earn();
        }

        _harvestV1(_strategy);

        _credits = _calculateCredits(_initialGas);

        emit Worked(_strategy, msg.sender, _credits, _workForTokens);
    }

    function _harvestV1(address _strategy) internal {
        ICrvStrategy(_strategy).harvest();
    }

    function _work(address _strategy) internal override {
        V2Keeper.harvest(_strategy);
    }

    function _afterWork(address _strategy) internal {
        lastWorkAt[_strategy] = block.timestamp;
        lastHarvest = block.timestamp;
    }

    function _crvWork(address _strategy, bool _workForTokens) internal returns (uint256 _credits) {
        if (_isV1Strategy(_strategy)) {
            return _workV1(_strategy, _workForTokens);
        }
        return _workInternal(_strategy, _workForTokens);
    }

    function _isV1Strategy(address _strategy) internal view returns (bool) {
        return requiredEarn[_strategy] > 0;
    }

    // Keep3r actions
    function work(address _strategy) external override returns (uint256 _credits) {
        return workForBond(_strategy);
    }

    function workForBond(address _strategy) public override notPaused onlyKeeper returns (uint256 _credits) {
        _credits = _crvWork(_strategy, false);
        _paysKeeperAmount(msg.sender, _credits);
    }

    function workForTokens(address _strategy) external override notPaused onlyKeeper returns (uint256 _credits) {
        _credits = _crvWork(_strategy, true);
        _paysKeeperInTokens(msg.sender, _credits);
    }
}
