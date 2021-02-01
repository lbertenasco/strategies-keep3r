// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

interface IUniswapV2SlidingOracle {
    function current(address tokenIn, uint amountIn, address tokenOut) external view returns (uint);
    function updatePair(address pair) external returns (bool);
    function workable(address pair) external view returns (bool);
    function workForFree() external;
}
