// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.6.12;
import '../../interfaces/uniswap/IUniswapV2Pair.sol';
import '../../interfaces/keep3r/IUniswapV2SlidingOracle.sol';
abstract
contract InterfaceImporter is IUniswapV2Pair, IUniswapV2SlidingOracle {
}
