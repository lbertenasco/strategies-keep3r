// SPDX-License-Identifier: MIT
pragma solidity 0.8.4;

interface IStealthRelayer {
    function caller() external view returns (address _caller);
}
