// SPDX-License-Identifier: MIT
pragma solidity >=0.6.8;
import '@lbertenasco/contract-utils/interfaces/keep3r/IKeep3r.sol';
interface IMetaKeep3rJob is IKeep3r {
  
  function isMetaKeep3rJob() external pure returns (bool);

  function workCallback(bytes _data) external;
  
}
