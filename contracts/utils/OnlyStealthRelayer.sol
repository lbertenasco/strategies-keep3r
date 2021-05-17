// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

interface IOnlyStealthRelayer {
    event StealthRelayerSet(address _stealthRelayer);

    function stealthRelayer() external view returns (address _stealthRelayer);

    function setStealthRelayer(address _stealthRelayer) external;
}

/*
 * OnlyStealthRelayerAbstract
 */
abstract contract OnlyStealthRelayer is IOnlyStealthRelayer {
    address public override stealthRelayer;

    constructor(address _stealthRelayer) public {
        _setStealthRelayer(_stealthRelayer);
    }

    modifier onlyStealthRelayer() {
        require(stealthRelayer == address(0) || msg.sender == stealthRelayer, "OnlyStealthRelayer::msg-sender-not-stealth-relayer");
        _;
    }

    function _setStealthRelayer(address _stealthRelayer) internal {
        stealthRelayer = _stealthRelayer;
        emit StealthRelayerSet(_stealthRelayer);
    }
}
