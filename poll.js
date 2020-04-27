const contractABI = require('./erc20.abi');
const BigNumber = require('bignumber.js');
const EWMA = require('./ewma');
const  Web3 = require('web3');
const CoinGecko = require('coingecko-api');


const uniswapExchange = '0x2a1530c4c41db0b0b2bb646cb5eb1a67b7158667';
const daiAddress = '0x6b175474e89094c44da98b954eedeac495271d0f';
const DECIMAL_PLACES = new BigNumber(10).pow(18);

const pollPrice = async (cb) => {
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

    const coinGeckoPrice = await coinGeckoClient.simple.price({
      ids: ['ethereum'],
      vs_currencies: ['usd'],
    });

    const ethPrice = new BigNumber(coinGeckoPrice.data.ethereum.usd);
    const ethPerShare = ethInContract.div(uniSupply);
    const daiPerShare = daiInContract.div(uniSupply);
    const invariant = ethPerShare.times(daiPerShare);
    const daiETH = new BigNumber(1).div(ethPrice);

    const daiFairVal = invariant.div(daiETH).sqrt();
    const ethFairVal = invariant.div(ethPrice).sqrt();

    return daiFairVal.plus(ethFairVal.times(ethPrice))
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
    let uniValue;
    try{
      uniValue = await getTokenValue();
    } catch (e) {
      console.error('error getting token value', e);
      return
    }
    ewma.insert(uniValue);
    try {
      await cb(uniValue)
    } catch (e) {
      console.error('error calling the callback', e);
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