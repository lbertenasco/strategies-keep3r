// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "@openzeppelin/contracts/utils/Address.sol";
import "@openzeppelin/contracts/utils/EnumerableSet.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

import "../../interfaces/utils/ICollectableDust.sol";

abstract contract CollectableDust is ICollectableDust {
    using EnumerableSet for EnumerableSet.AddressSet;

    address public constant ETH_ADDRESS = 0xEeeeeEeeeEeEeeEeEeEeeEEEeeeeEeeeeeeeEEeE;
    EnumerableSet.AddressSet internal protocolTokens;

    constructor() public {}

    function _addProtocolToken(address _token) internal {
        require(!protocolTokens.contains(_token), "collectable-dust::token-is-part-of-the-protocol");
        protocolTokens.add(_token);
    }

    function _removeProtocolToken(address _token) internal {
        require(protocolTokens.contains(_token), "collectable-dust::token-not-part-of-the-protocol");
        protocolTokens.remove(_token);
    }

    function _sendDust(
        address _to,
        address _token,
        uint256 _amount
    ) internal {
        require(_to != address(0), "collectable-dust::cant-send-dust-to-zero-address");
        require(!protocolTokens.contains(_token), "collectable-dust::token-is-part-of-the-protocol");
        if (_token == ETH_ADDRESS) {
            payable(_to).transfer(_amount);
        } else {
            IERC20(_token).transfer(_to, _amount);
        }
        emit DustSent(_to, _token, _amount);
    }
}
