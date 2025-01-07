const { Connection, Keypair, PublicKey, Transaction, sendAndConfirmTransaction } = require("@solana/web3.js");
const { Liquidity, Token, TokenAmount, Percent, TxVersion, parseBigNumberish, LIQUIDITY_STATE_LAYOUT_V4 } = require("@raydium-io/raydium-sdk");
const { getTokenAccountsByOwner } = require("./controllers/util");
const { raydiumApiSwap } = require('./controllers/swapToken');
const bs58 = require('bs58');

require('dotenv').config();

(async() => {
    const connection = new Connection("https://mainnet.helius-rpc.com/?api-key=c606f118-a4bf-4739-b1a1-c6c2dc4675c7", "confirmed");

    const poolId = new PublicKey('4Mf62F6prBGwrmEr9qjjr9ZtgGYzKSiRrvRz2Ry5pnCJ');
    const marketProgramId = new PublicKey(process.env.MARKET_PROGRAM_ID);

    const privateKey = bs58.default.decode(process.env.WALLET_PRIVATE_KEY);
    const poolData = await connection.getAccountInfo(poolId);
    // Create the Keypair
    const data = LIQUIDITY_STATE_LAYOUT_V4.decode(poolData.data);
    console.log("data ===>", data);
    const wallet = Keypair.fromSecretKey(privateKey);
    // console.log("pooldata ===>", poolData);

    raydiumApiSwap(connection, 632.0008, "buy", wallet, poolId, marketProgramId, 9, 6)
        .then(data => console.log(data))
        .catch(err => console.error(err));
})();