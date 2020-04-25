const contractABI = require('./erc20.abi');
const BigNumber = require('bignumber.js');
const EWMA = require('./ewma');
const  Web3 = require('web3');
const CoinGecko = require('coingecko-api');


const uniswapExchange = '0x2a1530c4c41db0b0b2bb646cb5eb1a67b7158667';
const daiAddress = '0x6b175474e89094c44da98b954eedeac495271d0f';
const DECIMAL_PLACES = new BigNumber(10).pow(18);

const pollPrice = async () => {
  const provider = new Web3.providers.WebsocketProvider(process.env['MAINNET_URL']);
  const web3 = new Web3(provider);
  const coinGeckoClient = new CoinGecko();

  const uniToken = new web3.eth.Contract(contractABI, uniswapExchange);
  const daiToken = new web3.eth.Contract(contractABI, daiAddress);

  const getTokenValue = async  () => {
    // Get the uniswap token supply
    const uniSupplyString = await uniToken.methods.totalSupply().call();
    const uniSupply = new BigNumber(uniSupplyString).div(DECIMAL_PLACES);

    // Get the amount of DAI in the contract
    const daiInContractString = await daiToken.methods.balanceOf(uniswapExchange).call();
    const daiInContract = new BigNumber(daiInContractString).div(DECIMAL_PLACES);

    const ethInContractString = await web3.eth.getBalance(uniswapExchange);
    const ethInContract = new BigNumber(ethInContractString).div(DECIMAL_PLACES);

    const ethPrice = await coinGeckoClient.simple.price({
      ids: ['ethereum'],
      vs_currencies: ['usd'],
    });

    const ethPriceBig = new BigNumber(ethPrice.data.ethereum.usd);
    return ethInContract.times(ethPriceBig).plus(daiInContract).div(uniSupply);
  };

  const initialVal = await getTokenValue();
  const halfLife = Math.pow(1/2, 1 / 5);
  const ewma = new EWMA(halfLife, initialVal);

  console.log('creating subscription');
  const subscription = await web3.eth.subscribe('newBlockHeaders', async (err) => {
    if (err) {
      console.error('error polling', err);
      throw err
    }

    console.log('getting token value');
    try{
      const uniValue = await getTokenValue();
      ewma.insert(uniValue);
    } catch (e) {
      console.error('error getting token value', e)
    }
  });

  return {
    subscription,
    ewma
  };
};

module.exports = {
  pollPrice
};