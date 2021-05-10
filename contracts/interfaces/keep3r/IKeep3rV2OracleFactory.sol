// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

interface IKeep3rV2OracleFactory {
    function current(
        address pair,
        address tokenIn,
        uint256 amountIn,
        address tokenOut
    ) external view returns (uint256 amountOut, uint256 lastUpdatedAgo);
}
