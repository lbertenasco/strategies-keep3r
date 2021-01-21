// SPDX-License-Identifier: MIT
pragma solidity >=0.6.8;
import '@lbertenasco/contract-utils/interfaces/keep3r/IKeep3r.sol';
interface IMetaKeep3r is IKeep3r {
  
  function isMetaKeep3r() external pure returns (bool);

}
