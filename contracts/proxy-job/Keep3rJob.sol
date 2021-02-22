// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";
import "@lbertenasco/contract-utils/interfaces/utils/IGovernable.sol";

import "../../interfaces/proxy-job/IKeep3rProxyJob.sol";
import "../../interfaces/proxy-job/IKeep3rJob.sol";

abstract contract Keep3rJob is IKeep3rJob, IGovernable {
    using SafeMath for uint256;
    using EnumerableSet for EnumerableSet.AddressSet;

    IKeep3rProxyJob public Keep3rProxyJob;

    constructor(address _keep3rProxyJob) public {
        Keep3rProxyJob = IKeep3rProxyJob(_keep3rProxyJob);
    }

    modifier onlyProxyJob() {
        require(msg.sender == address(Keep3rProxyJob), "Keep3rJob::onlyProxyJob:invalid-msg-sender");
        _;
    }
}
