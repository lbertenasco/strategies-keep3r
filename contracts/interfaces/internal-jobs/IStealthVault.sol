// SPDX-License-Identifier: MIT
pragma solidity >=0.6.8;

interface IStealthVault {
    function isStealthVault() external pure returns (bool);

    //events
    event Bonded(address _keeper, uint256 _amount, uint256 _finalBond);
    event Unbonded(address _keeper, uint256 _amount, uint256 _finalBond);
    event ReportedHash(bytes32 _hash, address _reportedBy, uint256 _reportBond);
    event BondTaken(bytes32 _hash, address _keeper, uint256 _penalty, address _reportedBy);
    event ValidatedHash(bytes32 _hash, address _keeper, uint256 _penalty);
    event ClaimedPenalty(bytes32 _hash, address _keeper, address _reportedBy, uint256 _penaltyAmount, uint256 _reportAmount);
    event InvalidatedPenalty(bytes32 _hash, uint256 _reportAmount);

    // global bond
    function requiredReportBond() external view returns (uint256 _requiredReportBond);

    function totalBonded() external view returns (uint256 _totalBonded);

    function bonded(address _keeper) external view returns (uint256 _bond);

    // global keeper
    function keeperStealthJob(address _keeper, address _job) external view returns (bool _enabled);

    // global hash
    function hashReportedBy(bytes32 _hash) external view returns (address _reportedBy);

    function hashPenaltyKeeper(bytes32 _hash) external view returns (address _hashPenaltyKeeper);

    function hashPenaltyCooldown(bytes32 _hash) external view returns (uint256 _hashPenaltyCooldown);

    function hashReportedBond(bytes32 _hash) external view returns (uint256 _hashReportedBond);

    function hashPenaltyAmount(bytes32 _hash) external view returns (uint256 _hashPenaltyAmount);

    // global penalty
    function penaltyReviewPeriod() external view returns (uint256 _penaltyReviewPeriod);

    // governor
    function setPenaltyReviewPeriod(
        uint256 _penaltyReviewPeriod /*onlyGovernor*/
    ) external;

    function setRequiredReportBond(
        uint256 _requiredReportBond /*onlyGovernor*/
    ) external;

    function transferGovernorBond(
        address _keeper,
        uint256 _amount /*onlyGovernor*/
    ) external;

    function invalidatePenalty(
        bytes32 _hash /*onlyGovernor*/
    ) external;

    // keeper
    function bond() external payable;

    function unbondAll() external;

    function unbond(uint256 _amount) external;

    function enableStealthJob(address _job) external;

    function enableStealthJobs(address[] calldata _jobs) external;

    function disableStealthJob(address _job) external;

    function disableStealthJobs(address[] calldata _jobs) external;

    // job
    function validateHash(
        address _keeper,
        bytes32 _hash,
        uint256 _penalty
    ) external returns (bool);

    // watcher
    function reportHash(bytes32 _hash) external;

    function claimPenalty(bytes32 _hash) external;
}
