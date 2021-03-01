import axios from 'axios';

const getGasPrice = async () => {
  try {
    const res = await axios.get('https://www.gasnow.org/api/v3/gas/price');
    return res.data;
  } catch (error) {
    console.error(error);
    return;
  }
};

const sendPrivateTransaction = async (signedMessage: any) => {
  try {
    const res = await axios.post(
      'https://api.taichi.network:10001/rpc/public',
      {
        jsonrpc: '2.0',
        method: 'eth_sendPrivateTransaction',
        params: [signedMessage],
        id: 1,
      }
    );
    return res.data;
  } catch (error) {
    console.error(error);
    return;
  }
};

const queryPrivateTransaction = async (txHash: string) => {
  try {
    const res = await axios.get(
      'https://api.taichi.network:10001/txscan/priTx?txHash=' + txHash
    );
    return res.data;
  } catch (error) {
    console.error(error);
    return;
  }
};

module.exports = {
  getGasPrice,
  sendPrivateTransaction,
  queryPrivateTransaction,
};
