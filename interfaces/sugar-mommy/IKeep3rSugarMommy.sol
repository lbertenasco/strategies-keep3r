// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

interface IKeep3rSugarMommy {
    event Keep3rSet(address _keep3r);
    event Keep3rRequirementsSet(address _bond, uint256 _minBond, uint256 _earned, uint256 _age, bool _onlyEOA);
    event JobStarted(address _job, address _keeper);
    event JobEnded(address _job, address _keeper);

    function isKeep3rSugarMommy() external pure returns (bool);

    function setKeep3r(address _keep3r) external;

    function setKeep3rRequirements(
        address _bond,
        uint256 _minBond,
        uint256 _earned,
        uint256 _age,
        bool _onlyEOA
    ) external;

    function jobs() external view returns (address[] memory validJobs);

    function start(address _keeper) external;

    function end(
        address _keeper,
        address _credit,
        uint256 _amount
    ) external;
}
