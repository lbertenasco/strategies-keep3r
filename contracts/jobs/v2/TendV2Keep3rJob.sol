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
        address _slidingOracle,
        uint256 _workCooldown,
        uint256 _maxCredits
    ) public V2Keep3rJob(_mechanicsRegistry, _keep3rProxyJob, _v2Keeper, _keep3r, _keep3rHelper, _slidingOracle, _workCooldown, _maxCredits) {
        // set workType as tend
        workType = WorkType.tend;
    }
}
