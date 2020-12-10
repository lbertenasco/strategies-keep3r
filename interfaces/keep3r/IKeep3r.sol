// SPDX-License-Identifier: MIT
pragma solidity >=0.6.8;
interface IKeep3r {
  event Keep3rSet(address keep3r);
  event Keep3rRequirementsSet(address bond, uint256 minBond, uint256 earned, uint256 age, bool _onlyEOA);
  // Keep3rSetters
  function setKeep3r(address _keep3r) external;
  function setKeep3rRequirements(address _bond, uint256 _minBond, uint256 _earned, uint256 _age, bool _onlyEOA) external;
}
