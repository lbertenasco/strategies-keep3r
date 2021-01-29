// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

interface IManageable {
  event PendingManagerSet(address pendingManager);
  event ManagerAccepted();

  function setPendingManager(address _pendingManager) external;
  function acceptManager() external;
}
