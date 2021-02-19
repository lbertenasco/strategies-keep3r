// SPDX-License-Identifier: GPL-3.0
pragma solidity 0.6.12;
import "../../interfaces/uniswap/IUniswapV2Pair.sol";
import "../../interfaces/keep3r/IUniswapV2SlidingOracle.sol";
import "../../interfaces/yearn/IVaultAPI.sol";
import "../../interfaces/yearn/IV1Registry.sol";
import "../../interfaces/yearn/IV1Vault.sol";
import "../../interfaces/yearn/IV1Strategy.sol";
import "../../interfaces/crv/ICrvClaimable.sol";

abstract contract InterfaceImporter is IUniswapV2Pair, IUniswapV2SlidingOracle {}
abstract contract InterfaceImporter2 is VaultAPI {}
abstract contract InterfaceImporter3 is IV1Registry, IV1Vault, IV1Strategy {}
abstract contract InterfaceImporter4 is ICrvClaimable {}
