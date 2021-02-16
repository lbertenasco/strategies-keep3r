// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

interface IKeep3rProxyJob {
    event Worked(address _job, address _keeper);

    function jobs() external view returns (address[] memory validJobs);

    function workable(address _job) external view returns (bool _workable);

    function work(address _job, bytes calldata _workData) external;
}
