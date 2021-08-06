// SPDX-License-Identifier: MIT

pragma solidity 0.8.4;

import "@lbertenasco/contract-utils/contracts/utils/Governable.sol";
import "@lbertenasco/contract-utils/contracts/utils/Manageable.sol";

interface IGovernableAndManageable is IManageable, IGovernable {}
