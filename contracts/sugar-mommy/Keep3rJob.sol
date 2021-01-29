// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import '@openzeppelin/contracts/math/SafeMath.sol';
import '@lbertenasco/contract-utils/contracts/utils/UtilsReady.sol';

import '../../interfaces/sugar-mommy/IKeep3rSugarMommy.sol';
import '../../interfaces/sugar-mommy/IKeep3rJob.sol';


abstract
contract Keep3rJob is IKeep3rJob {
  using SafeMath for uint256;
  
  IKeep3rSugarMommy public Keep3rSugarMommy;

  constructor(address _keep3rSugarMommy) public { 
    Keep3rSugarMommy = IKeep3rSugarMommy(_keep3rSugarMommy);
  }

  function isKeep3rJob() external pure override returns (bool) { return true; }

  // Keep3rSugarMommy actions
  function _startJob(address _keeper) internal {
    Keep3rSugarMommy.start(_keeper);
  }

  function _endJob(address _keeper) internal {
    Keep3rSugarMommy.end(_keeper, address(0), 0);
  }
  function _endJob(address _keeper, uint256 _amount) internal {
    Keep3rSugarMommy.end(_keeper, address(0), _amount);
  }
  function _endJob(address _keeper, address _credit, uint256 _amount) internal {
    Keep3rSugarMommy.end(_keeper, _credit, _amount);
  }

}
