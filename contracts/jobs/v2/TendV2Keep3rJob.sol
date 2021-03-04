// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "./V2Keep3rJob.sol";

contract TendV2Keep3rJob is V2Keep3rJob {
    constructor(
        address _mechanicsRegistry,
        address _keep3rProxyJob,
        address _v2Keeper,
        address _keep3r,
        address _keep3rHelper,
        address _slidingOracle
    ) public V2Keep3rJob(_mechanicsRegistry, _keep3rProxyJob, _v2Keeper, _keep3r, _keep3rHelper, _slidingOracle, 0) {}

    function workableStrategy(address _strategy) external view override returns (bool) {
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
    function work(bytes memory _workData) external override notPaused onlyProxyJob {
        _workInternal(_workData);
    }
}
