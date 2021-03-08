// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;
import "@lbertenasco/contract-utils/interfaces/keep3r/IKeep3r.sol";

interface IKeep3rProxyJobV2 is IKeep3r {
    event AddValidJob(address _job, uint256 _maxCredits);
    event RemoveValidJob(address _job);
    event SetJobMaxCredits(address _job, uint256 _maxCredits);
    event Worked(address _job, address _keeper);

    // setters
    function addValidJob(address _job, uint256 _maxCredits) external;

    function removeValidJob(address _job) external;

    function setJobMaxCredits(address _job, uint256 _maxCredits) external;

    // view
    function jobs() external view returns (address[] memory validJobs);

    function usedCredits(address _job) external view returns (uint256 _usedCredits);

    function maxCredits(address _job) external view returns (uint256 _maxCredits);

    // keeper
    function work(address _job, bytes calldata _workData) external;

    function workForBond(address _job, bytes calldata _workData) external;

    function workForTokens(address _job, bytes calldata _workData) external;

    // use callStatic
    function workable(address _job) external returns (bool _workable);

    function isValidJob(address _job) external view returns (bool _valid);
}
