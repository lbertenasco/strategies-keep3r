// SPDX-License-Identifier: MIT

pragma solidity >=0.6.8;

import '../../interfaces/IKeep3rV1.sol';

abstract
contract Keep3r {

  IKeep3rV1 public keep3r;

  constructor(address _keep3r) public {
    _setKeep3r(_keep3r);
  }

  function _setKeep3r(address _keep3r) internal {
    keep3r = IKeep3rV1(_keep3r);
  }

  function _isKeeper() internal {
    require(keep3r.isKeeper(msg.sender), "keep3r::isKeeper:keeper-is-not-registered");
  }

  // Only checks if caller is a valid keeper, payment should be handled manually
  modifier onlyKeeper() {
    _isKeeper();
    _;
  }

  // Checks if caller is a valid keeper, handles default payment after execution
  modifier paysKeeper() {
    _isKeeper();
    _;
    keep3r.worked(msg.sender);
  }
}