// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;
import "./IStrategyKeep3r.sol";
import "./IVaultKeep3r.sol";
interface ICrvKeep3r is IStrategyKeep3r, IVaultKeep3r {
  function isCrvKeep3r() external pure returns (bool);
  // Getters
  function workable(address _strategyOrVault) external returns (bool);
}
