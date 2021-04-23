// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "./V2QueueKeep3rJob.sol";

contract HarvestV2QueueKeep3rJob is V2QueueKeep3rJob {
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
    ) public V2QueueKeep3rJob(_mechanicsRegistry, _keep3r, _bond, _minBond, _earned, _age, _onlyEOA, _v2Keeper, _workCooldown) {}

    function workable(address _strategy) external view override returns (bool) {
        return _workable(_strategy);
    }

    function _workable(address _strategy) internal view override returns (bool) {
        return super._workable(_strategy);
    }

    function _strategyTrigger(address _strategy, uint256 _amount) internal view override returns (bool) {
        if (_amount == 0) return true; // Force harvest on amount 0
        return IBaseStrategy(_strategy).harvestTrigger(_amount);
    }

    function _work(address _strategy) internal override {
        IV2Keeper(v2Keeper).harvest(_strategy);
    }

    // Keep3r actions
    function work(address _strategy) external override returns (uint256 _credits) {
        return workForBond(_strategy);
    }

    function workForBond(address _strategy) public override notPaused onlyKeeper returns (uint256 _credits) {
        _credits = _workInternal(_strategy, false);
        _paysKeeperAmount(msg.sender, _credits);
    }

    function workForTokens(address _strategy) external override notPaused onlyKeeper returns (uint256 _credits) {
        _credits = _workInternal(_strategy, true);
        _paysKeeperInTokens(msg.sender, _credits);
    }
}
