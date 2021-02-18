// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

interface IKeep3rJob {
    event MechanicAdded(address _mechanic);
    event MechanicRemoved(address _mechanic);

    function addMechanic(address _mechanic) external;

    function removeMechanic(address _mechanic) external;

    function mechanics() external view returns (address[] memory _mechanicsList);

    function isMechanic(address mechanic) external view returns (bool _isMechanic);

    function work(bytes calldata _workData) external;

    // use callStatic for the following functions:
    function workable() external returns (bool);

    function getWorkData() external returns (bytes memory _workData);
}
