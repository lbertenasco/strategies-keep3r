// SPDX-License-Identifier: MIT

pragma solidity >=0.6.8;

import '@openzeppelin/contracts/math/SafeMath.sol';
import '@lbertenasco/contract-utils/contracts/keep3r/Keep3rAbstract.sol';
import '@lbertenasco/contract-utils/contracts/utils/UtilsReady.sol';

import '../../interfaces/meta-keep3r/IMetaKeep3rJob.sol';

/*
### YearnMetaKeep3r:

Will be the only yearn job.
- pro: we only have to maintain the credits of 1 big job, instead of multiple tiny ones. fast and easily add sub-jobs.
- con: we might get drained if not carefull on what we add. also if the credits end, everything stops auto'ing.

contracts to be used via delegatecall:
- vault: earn, forceEarn(not really neccesary but whatever), workable (v1+v2)
- strategy: harvest, forceHarvest, workable (v1+v2)
- strategy: tend, forceTend, workable (v2)
- auto-refill: refill, forceRefill, workable (v1+v2)
    - init with YearnMetaKeep3r as job address
    - has 2 escrow contracts holding KP3R/ETH-LP tokens (created via factory on runtime)
        - this is to be able to never be out of creds
    - can only return LPs to ychad
    - uses keep3r's addLiquidityToJob, applyCreditToJob, unbondLiquidityFromJob and removeLiquidityFromJob.
    - workable should be a mix of cooldowns and current creds
*/
abstract
contract MetaKeep3rJob is UtilsReady, Keep3r, IMetaKeep3rJob {
  using SafeMath for uint256;
  

  constructor(
    address _keep3r,
    address _bond,
    uint256 _minBond,
    uint256 _earned,
    uint256 _age,
    bool _onlyEOA
  ) public UtilsReady() Keep3r(_keep3r) { 
    _setKeep3rRequirements(_bond, _minBond, _earned, _age, _onlyEOA);
  }

  function isMetaKeep3r() external pure override returns (bool) { return true; }

  // Keep3r Setters
  function setKeep3r(address _keep3r) external override onlyGovernor {
    _setKeep3r(_keep3r);
    emit Keep3rSet(_keep3r);
  }
  function setKeep3rRequirements(address _bond, uint256 _minBond, uint256 _earned, uint256 _age, bool _onlyEOA) external override onlyGovernor {
    _setKeep3rRequirements(_bond, _minBond, _earned, _age, _onlyEOA);
    emit Keep3rRequirementsSet(_bond, _minBond, _earned, _age, _onlyEOA);
  }


  // Getters


  // Keep3r actions



  // Governor keeper bypass


  // Governable

}
