// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

interface IBaseStrategy {
    function tendTrigger(uint256 callCost) external view returns (bool);

    function tend() external;

    function harvestTrigger(uint256 callCost) external view returns (bool);

    function harvest() external;
}
