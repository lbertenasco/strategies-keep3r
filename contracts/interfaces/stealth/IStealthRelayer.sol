// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;

interface IStealthRelayer {
    function caller() external view returns (address _caller);
}
