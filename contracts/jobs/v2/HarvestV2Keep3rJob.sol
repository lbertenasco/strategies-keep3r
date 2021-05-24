// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "./V2Keep3rJob.sol";

contract HarvestV2Keep3rJob is V2Keep3rJob {
    constructor(
        address _mechanicsRegistry,
        address _yOracle,
        address _keep3r,
        address _bond,
        uint256 _minBond,
        uint256 _earned,
        uint256 _age,
        bool _onlyEOA,
        address _v2Keeper,
        uint256 _workCooldown
    ) public V2Keep3rJob(_mechanicsRegistry, _yOracle, _keep3r, _bond, _minBond, _earned, _age, _onlyEOA, _v2Keeper, _workCooldown) {}

    function workable(address _strategy) external view override returns (bool) {
        return _workable(_strategy);
    }

    function _workable(address _strategy) internal view override returns (bool) {
        if (!super._workable(_strategy)) return false;
        return IBaseStrategy(_strategy).harvestTrigger(_getCallCosts(_strategy));
    }

    function _work(address _strategy) internal override {
        lastWorkAt[_strategy] = block.timestamp;
        V2Keeper.harvest(_strategy);
    }

    // Keep3r actions
    function work(address _strategy) external override notPaused onlyKeeper returns (uint256 _credits) {
        _credits = _workInternal(_strategy);
        _paysKeeperAmount(msg.sender, _credits);
    }
}
