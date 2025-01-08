const { Connection, Keypair, PublicKey, Transaction, sendAndConfirmTransaction } = require("@solana/web3.js");
const { Liquidity, Token, TokenAmount, Percent, TxVersion, parseBigNumberish, LIQUIDITY_STATE_LAYOUT_V4 } = require("@raydium-io/raydium-sdk");
const { getTokenAccountsByOwner } = require("./controllers/util");
const { raydiumApiSwap } = require('./controllers/swapToken');
const bs58 = require('bs58');
const { poolDataFilter } = require('./controllers/poolDataFilter');
const { getPoolData } = require('./controllers/getPoolData');

require('dotenv').config();

(async() => {
    const connection = new Connection("https://withered-chaotic-rain.solana-mainnet.quiknode.pro/2adcb441bbd017922a33adaa5ebbddb9b4287c82", "confirmed");

    const swapSide = "buy";
    const swapAmount = 1;
    const tokenAddress = "eL5fUxj2J4CiQsmW85k5FG9DvuQjjUoBHoQBi2Kpump";

    const poolList = await getPoolData(tokenAddress);
    const poolPublicKey = poolDataFilter(poolList)[0].id;

    const poolId = new PublicKey(poolPublicKey);
    const marketProgramId = new PublicKey(process.env.MARKET_PROGRAM_ID);

    const privateKey = bs58.default.decode(process.env.WALLET_PRIVATE_KEY);
    // const poolData = await connection.getAccountInfo(poolId);
    // Create the Keypair
    // const data = LIQUIDITY_STATE_LAYOUT_V4.decode(poolData.data);
    const wallet = Keypair.fromSecretKey(privateKey);
    // console.log("pooldata ===>", poolData);

    raydiumApiSwap(connection, 1, "buy", wallet, poolId, marketProgramId, 9, 6)
        .then(data => console.log(data))
        .catch(err => console.error(err));
})();