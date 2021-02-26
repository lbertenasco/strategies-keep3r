// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;
import "@lbertenasco/contract-utils/interfaces/keep3r/IKeep3r.sol";

interface IKeep3rProxyJob is IKeep3r {
    event Worked(address _job, address _keeper);

    function jobs() external view returns (address[] memory validJobs);

    function work(address _job, bytes calldata _workData) external;

    // use callStatic
    function workable(address _job) external returns (bool _workable);

    function isValidJob(address _job) external view returns (bool _valid);
}
