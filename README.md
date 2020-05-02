# Uni-V1 Oracle
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Ftamccall%2Funi-oracle.svg?type=shield)](https://app.fossa.io/projects/git%2Bgithub.com%2Ftamccall%2Funi-oracle?ref=badge_shield)


This package is an example oracle used to demonstrate how uniswap-v1 tokens might be priced and integrated into the
oracle architecture of the DAI cryptocurrency.

Please see makerdao's [oracle-v2](https://github.com/makerdao/oracles-v2) repo as well as [this forum post](https://forum.makerdao.com/t/dai-eth-uni-v1-oracle-discussion/2146/3?u=andy_mccall) for context.

This repository takes a [NAV](https://www.investopedia.com/terms/n/nav.asp) based approach to arrive at a price for the 
uniswap tokens that is explored in the aforementioned forum thread as well as [this medium thread](https://medium.com/@pintail/understanding-uniswap-returns-cc593f3499ef).

## Installation

To run this repository you will first need to create an ethereum keystore file to for the oracle to use when signing 
scuttlebutt messages. There are several options on this front but I recommend using [geth](https://geth.ethereum.org/docs/install-and-build/installing-geth). To create a keyfile run

```
geth account new
```

Additionally you will need to install [ssb-server](https://www.npmjs.com/package/ssb-server) to run scuttlebutt run:

```
ssb-server start
``` 

Lastly you will want need a way to connect to an ethereum node. I recomend using infura.io you can find a guide for 
setting that up [here](https://blog.infura.io/getting-started-with-infura-28e41844cc89/)

### Environment Variables

Having all of that setup you will also need to setup a few environment variables in order for the oracle to run properly.
Most of these variables were taken from [oracles-v2](https://github.com/makerdao/oracles-v2) to demo compatibility
with existing maker tech.

```
export MAINNET_URL="wss://mainnet.infura.io/v3/YOUR_INFURA_PROJECT"
export ETH_PASSWORD="KEYSTORE_PASSWORD"
export ETH_KEYSTORE="./your-keystore-file"
export ETH_FROM="0xANETHACCOUNT"
```

## Running

To run start the scuttlebut server and enter:

```
 2020-05-01 19:17:54 ⌚  Andys-MBP in ~/workspace/uni-oracle
± |master {1} U:1 ✗| → node ./main.js 
```

This will start up an http server you should see posting to your scuttlebutt server.


## License
[![FOSSA Status](https://app.fossa.io/api/projects/git%2Bgithub.com%2Ftamccall%2Funi-oracle.svg?type=large)](https://app.fossa.io/projects/git%2Bgithub.com%2Ftamccall%2Funi-oracle?ref=badge_large)