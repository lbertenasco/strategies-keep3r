# YUnsafeOracleV1

### Wrappers:

- [x] [`Keep3rV2OracleFactory`](./contracts/oracle/Keep3rV2OracleFactoryWrapper.sol)
  > [`0xa07662C041C4F7B31Fd61C13C44212fF35b5296D`](https://etherscan.io/address/0xa07662C041C4F7B31Fd61C13C44212fF35b5296D#code)
- [ ] UniswapV2
- [ ] (define next on-chain oracles to wrap)

### Supported pairs:

- [x] ETH-KP3R (defaultOracle: `Keep3rV2OracleFactory`: [`0xa07662C041C4F7B31Fd61C13C44212fF35b5296D`](https://etherscan.io/address/0xa07662C041C4F7B31Fd61C13C44212fF35b5296D#code))

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
