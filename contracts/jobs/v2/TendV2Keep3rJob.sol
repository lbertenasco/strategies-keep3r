// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "./V2Keep3rJob.sol";

contract TendV2Keep3rJob is V2Keep3rJob {
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
        address _v2Keeper
    ) public V2Keep3rJob(_mechanicsRegistry, _keep3r, _bond, _minBond, _earned, _age, _onlyEOA, _keep3rHelper, _slidingOracle, _v2Keeper, 0) {}

    function workable(address _strategy) external view override returns (bool) {
        return _workable(_strategy);
    }

    function _workable(address _strategy) internal view override returns (bool) {
        if (!super._workable(_strategy)) return false;
        (, uint256 _ethCallCost) = _getCallCosts(_strategy);
        return IBaseStrategy(_strategy).tendTrigger(_ethCallCost);
    }

    function _work(address _strategy) internal override {
        V2Keeper.tend(_strategy);
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
