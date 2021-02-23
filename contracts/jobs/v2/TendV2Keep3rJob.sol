// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";
import "@lbertenasco/contract-utils/contracts/abstract/MachineryReady.sol";
import "@lbertenasco/contract-utils/interfaces/keep3r/IKeep3rV1.sol";

import "./V2Keep3rJob.sol";

import "../../../interfaces/keep3r/IKeep3rV1Helper.sol";
import "../../../interfaces/yearn/IBaseStrategy.sol";
import "../../../interfaces/keep3r/IUniswapV2SlidingOracle.sol";

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
