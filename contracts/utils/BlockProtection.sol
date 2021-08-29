// SPDX-License-Identifier: MIT

pragma solidity 0.8.4;

import "@openzeppelin/contracts/utils/Address.sol";
import "@lbertenasco/contract-utils/contracts/abstract/MachineryReady.sol";

interface IBlockProtection {
    error InvalidBlock();

    function callWithBlockProtection(
        address _to,
        bytes calldata _data,
        uint256 _blockNumber
    ) external payable returns (bytes memory _returnData);
}

contract BlockProtection is MachineryReady, IBlockProtection {
    using Address for address;

    constructor(address _mechanicsRegistry) MachineryReady(_mechanicsRegistry) {}

    function callWithBlockProtection(
        address _to,
        bytes memory _data,
        uint256 _blockNumber
    ) external payable override onlyMechanic() returns (bytes memory _returnData) {
        if (_blockNumber != block.number) revert InvalidBlock();
        return _to.functionCallWithValue(_data, msg.value);
    }
}
