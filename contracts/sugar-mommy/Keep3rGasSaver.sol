import "@openzeppelin/contracts/math/SafeMath.sol";

interface IFreeFromUpTo {
    function freeFromUpTo(address from, uint256 value) external returns (uint256 freed);
}

abstract contract Keep3rGasSaver {
    using SafeMath for uint256;
    address public constant chi = address(0x0000000000004946c0e9F43F4Dee607b0eF1fA1c);
    address public constant gst2 = address(0x0000000000b3F879cb30FE243b4Dfee438691c04);

    modifier saveOnGas(address _gas_token) {
        if (_gas_token == chi) {
            uint256 gasStart = gasleft();
            _;
            uint256 gasSpent = (gasStart - gasleft()) + 21000 + (16 * msg.data.length);
            IFreeFromUpTo(chi).freeFromUpTo(msg.sender, (gasSpent + 14154) / 41130);
        } else if (_gas_token == gst2) {
            uint256 gasStart = gasleft();
            _;

            uint256 tokens = gasStart.sub(gasleft()).add(14154).div(uint256(24000).mul(2).sub(6870));

            uint256 mintCost = (tokens.mul(36543)).add(32254);
            uint256 freeCost = (tokens.mul(6870)).add(14154);
            uint256 maxreimburse = tokens.mul(24000);

            uint256 efficiency = maxreimburse.mul(tx.gasprice).mul(100).div(mintCost.mul(1000000000).add(freeCost.mul(tx.gasprice)));

            if (efficiency > 100) {
                uint256 tokensToFree = tokens;
                uint256 safeNumTokens = 0;
                uint256 gas = gasleft();

                if (gas >= 27710) {
                    // Make sure there is still enough gas to free. More details on contract line 233
                    safeNumTokens = gas.sub(27710).div(1148 + 5722 + 150);
                }

                if (tokensToFree > safeNumTokens) {
                    tokensToFree = safeNumTokens;
                }

                if (tokensToFree > 0) {
                    IFreeFromUpTo(gst2).freeFromUpTo(msg.sender, tokensToFree);
                }
            }
        } else {
            _;
        }
    }
}
