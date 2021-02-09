// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

import "@lbertenasco/contract-utils/interfaces/utils/IUtilsReady.sol";

interface IKeep3rEscrow is IUtilsReady {
    function isKeep3rEscrow() external pure returns (bool);

    function returnLPsToGovernance() external;

    function addLiquidityToJob(
        address liquidity,
        address job,
        uint256 amount
    ) external;

    function applyCreditToJob(
        address provider,
        address liquidity,
        address job
    ) external;

    function unbondLiquidityFromJob(
        address liquidity,
        address job,
        uint256 amount
    ) external;

    function removeLiquidityFromJob(address liquidity, address job) external;
}
