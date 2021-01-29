// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;
import '@lbertenasco/contract-utils/interfaces/utils/IUtilsReady.sol';

interface IKeep3rEscrow is IUtilsReady {
  function isKeep3rEscrow() external pure returns (bool);

  function returnLPsToGovernance() external /*onlyGovernor*/;
  function addLiquidityToJob(address liquidity, address job, uint amount) external /*onlyGovernor*/;
  function applyCreditToJob(address provider, address liquidity, address job) external /*onlyGovernor*/;
  function unbondLiquidityFromJob(address liquidity, address job, uint amount) external /*onlyGovernor*/;
  function removeLiquidityFromJob(address liquidity, address job) external /*onlyGovernor*/;
}
