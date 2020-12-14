// SPDX-License-Identifier: MIT
pragma solidity >=0.6.8;
interface ICrvClaimable {
    function claimable_tokens(address _address) external returns (uint256 _amount);
}
