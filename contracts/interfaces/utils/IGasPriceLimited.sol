// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

interface IGasPriceLimited {
    event SetMaxGasPrice(uint256 _maxGasPrice);

    function maxGasPrice() external view returns (uint256 _maxGasPrice);

    function setMaxGasPrice(uint256 _maxGasPrice) external;
}
