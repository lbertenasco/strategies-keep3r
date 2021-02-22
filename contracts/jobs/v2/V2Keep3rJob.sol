// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "../../proxy-job/Keep3rJob.sol";
import "../../../interfaces/jobs/v2/IV2Keeper.sol";

abstract contract V2Keep3rJob is Keep3rJob {
    IV2Keeper public V2Keeper;

    constructor(address _keep3rProxyJob, address _v2Keeper) public Keep3rJob(_keep3rProxyJob) {
        V2Keeper = IV2Keeper(_v2Keeper);
    }
}
