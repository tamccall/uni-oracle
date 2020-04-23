const CoinGecko = require('coingecko-api');
const BigNumber = require('bignumber.js');
const  Web3 = require('web3');
const contractABI = require('./erc20.abi');
const EWMA = require('ewma');

const uniswapExchange = '0x2a1530c4c41db0b0b2bb646cb5eb1a67b7158667';
const daiAddress = '0x6b175474e89094c44da98b954eedeac495271d0f';
const DECIMAL_PLACES = new BigNumber(10).pow(18);

const main  = async () => {
  const web3 = new Web3(process.env['MAINNET_URL']);
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

  const sleep = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
  };

  const initialValue = await getTokenValue();
  const FIVE_SECONDS = 5 * 1000;
  const ewma = new EWMA(FIVE_SECONDS, initialValue.toNumber());
  console.log('Getting token value');
  for (let i = 0; i < 50; i++) {
    // Sleep for n seconds
    await sleep(FIVE_SECONDS);
    const uniValue = await getTokenValue();
    ewma.insert(uniValue.toNumber());
    console.log(`Token Value: ${ewma.value()}`)
  }
};

main().catch(error => console.error('caught an error', error));