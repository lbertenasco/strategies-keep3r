# YUnsafeOracleV1

### Wrappers:

- [x] [`Keep3rV2OracleFactory`](./contracts/oracle/Keep3rV2OracleFactoryWrapper.sol)
  > [`0xa07662C041C4F7B31Fd61C13C44212fF35b5296D`](https://etherscan.io/address/0xa07662C041C4F7B31Fd61C13C44212fF35b5296D#code)
- [ ] UniswapV2
- [ ] (define next on-chain oracles to wrap)

### Supported pairs:

- [x] ETH-KP3R:
  - pair: [`0xaf988afF99d3d0cb870812C325C588D8D8CB7De8`](https://etherscan.io/address/0xaf988afF99d3d0cb870812C325C588D8D8CB7De8#code)
  - oracle: **default!** [`0xa07662C041C4F7B31Fd61C13C44212fF35b5296D`](https://etherscan.io/address/0xa07662C041C4F7B31Fd61C13C44212fF35b5296D#code)
- [ ] ETH-example
  - pair: [`0xETH_EXAMPLE_PAIR`](https://etherscan.io/address/0xETH_EXAMPLE_PAIR#code)
  - oracle: [`0xORACLE`](https://etherscan.io/address/0xORACLE#code)

### [`YUnsafeOracleV1`](./contracts/oracle/YUnsafeOracleV1.sol)

> [`0xD1f5aEe3f025d2f4e42dd74DEC17d5FaA4707CbC`](https://etherscan.io/address/0xD1f5aEe3f025d2f4e42dd74DEC17d5FaA4707CbC#code)

```ts
    function getAmountOut(
        address _pair,
        address _tokenIn,
        uint256 _amountIn,
        address _tokenOut
    ) external view override returns (uint256 _amountOut) {
        if (pairOracle[_pair] != address(0)) return ISimpleOracle(pairOracle[_pair]).getAmountOut(_pair, _tokenIn, _amountIn, _tokenOut);
        return ISimpleOracle(defaultOracle).getAmountOut(_pair, _tokenIn, _amountIn, _tokenOut);
    }
```

### How to add new pairs + custom wrappers

- add a PR to this repo that adds the pair(s) needed under `### Supported pairs:`
  - each pair should have the name (in symbols), the address and the wrapper-oracle that supports that pair
  - a yMechanic member will answer on the PR if there are any comments or after the pair is added
    > take into account that the defaultOracle should handle MOST of the pairs out there. if you have an improvement for the defaultOracle feel free to create a PR too :)

```ts
    function setPairOracle(address _pair, address _oracle) external override onlyGovernor {
        pairOracle[_pair] = _oracle;
    }
```

### Changing default oracle and considerations

> [IMPORTANT] remember that when changing the default oracle, some pairs might stop working. make sure new default oracle supports same tokens as previous one.

```ts
    function setDefaultOracle(address _defaultOracle) external override onlyGovernor {
        _setOracle(_defaultOracle);
    }
    function _setOracle(address _defaultOracle) internal {
        defaultOracle = _defaultOracle;
    }
```
