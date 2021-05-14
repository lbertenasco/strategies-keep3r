// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "../interfaces/utils/IGasPriceLimited.sol";
import "../interfaces/keep3r/IChainLinkFeed.sol";

abstract contract GasPriceLimited is IGasPriceLimited {
    IChainLinkFeed public constant FASTGAS = IChainLinkFeed(0x169E633A2D1E6c10dD91238Ba11c4A708dfEF37C);

    uint256 public override maxGasPrice;

    constructor() public {}

    // MaxGasPrice
    function _setMaxGasPrice(uint256 _maxGasPrice) internal {
        maxGasPrice = _maxGasPrice;
        emit SetMaxGasPrice(_maxGasPrice);
    }

    modifier limitGasPrice() {
        require(uint256(FASTGAS.latestAnswer()) <= maxGasPrice, "GasPriceLimited::limit-gas-price:gas-price-exceed-max");
        _;
    }
}
