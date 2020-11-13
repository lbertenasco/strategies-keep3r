// SPDX-License-Identifier: MIT
pragma solidity >=0.6.8;
import "./../yearn/IHarvestableStrategy.sol";
interface IDforceStrategy is IHarvestableStrategy {
    function pool() external pure returns (address);
}