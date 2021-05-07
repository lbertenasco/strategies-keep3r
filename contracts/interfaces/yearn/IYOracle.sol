// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

interface IYOracle {
    function quote(
        address _tokenIn,
        address _tokenOut,
        uint256 amount
    ) external view returns (uint256 _quote);
}
