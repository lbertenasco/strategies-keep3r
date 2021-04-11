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
        address _keep3rHelper,
        address _slidingOracle,
        address _v2Keeper,
        uint256 _workCooldown
    )
        public
        V2QueueKeep3rJob(
            _mechanicsRegistry,
            _keep3r,
            _bond,
            _minBond,
            _earned,
            _age,
            _onlyEOA,
            _keep3rHelper,
            _slidingOracle,
            _v2Keeper,
            _workCooldown
        )
    {}

    function workable(address _strategy, uint256 _workAmount) external view override returns (bool) {
        return _workable(_strategy, _workAmount);
    }

    function _workable(address _strategy, uint256 _workAmount) internal view override returns (bool) {
        if (!super._workable(_strategy, _workAmount)) return false;
        (, uint256 _ethCallCost) = _getCallCosts(_strategy);
        return IBaseStrategy(_strategy).harvestTrigger(_ethCallCost);
    }

    function _strategyTrigger(address _strategy, uint256 _amount) internal view override returns (bool) {
        return IBaseStrategy(_strategy).harvestTrigger(_amount);
    }

    function _work(address _strategy) internal override {
        lastWorkAt[_strategy] = block.timestamp;
        IV2Keeper(v2Keeper).harvest(_strategy);
    }

    // Keep3r actions
    function work(address _strategy, uint256 _workAmount) external override returns (uint256 _credits) {
        return workForBond(_strategy, _workAmount);
    }

    function workForBond(address _strategy, uint256 _workAmount) public override notPaused onlyKeeper returns (uint256 _credits) {
        _credits = _workInternal(_strategy, _workAmount, false);
        _paysKeeperAmount(msg.sender, _credits);
    }

    function workForTokens(address _strategy, uint256 _workAmount) external override notPaused onlyKeeper returns (uint256 _credits) {
        _credits = _workInternal(_strategy, _workAmount, true);
        _paysKeeperInTokens(msg.sender, _credits);
    }
}
