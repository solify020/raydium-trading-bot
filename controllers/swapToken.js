const { Connection, Keypair, PublicKey, Transaction, sendAndConfirmTransaction } = require("@solana/web3.js");
const { Liquidity, Token, TokenAmount, Percent, TxVersion } = require("@raydium-io/raydium-sdk");
const { fetchPoolKeys } = require("./util_mainnet");
const { getTokenAccountsByOwner } = require("./util");

const TOKEN_PROGRAM_ID = new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA');

async function raydiumApiSwap(connection, amount, side, ownerKeypair, pairing, marketProgramId, baseDecimal, quoteDecimal, slippagePercent = 1) {
    try {
        const fromRaydiumPools = pairing;
        const owner = ownerKeypair.publicKey;

        // Fetch token accounts for the user
        const tokenAccounts = await getTokenAccountsByOwner(connection, owner);
        if (!tokenAccounts || tokenAccounts.length === 0) {
            throw new Error("No token accounts found for the owner");
        }

        // Fetch pool keys and info
        const poolKeys = await fetchPoolKeys(connection, new PublicKey(fromRaydiumPools), marketProgramId);
        const poolInfo = await Liquidity.fetchInfo({ connection, poolKeys });

        // Determine input/output tokens based on the side
        let coinIn, coinOut, coinInDecimal, coinOutDecimal;
        if (side === 'buy') {
            coinIn = poolKeys.quoteMint;
            coinInDecimal = quoteDecimal;
            coinOut = poolKeys.baseMint;
            coinOutDecimal = baseDecimal;
        } else {
            coinIn = poolKeys.baseMint;
            coinInDecimal = baseDecimal;
            coinOut = poolKeys.quoteMint;
            coinOutDecimal = quoteDecimal;
        }

        // Parse the input amount and create TokenAmount objects
        const amountParsed = parseInt((amount * 10 ** coinInDecimal).toFixed(0));
        const amountIn = new TokenAmount(new Token(TOKEN_PROGRAM_ID, coinIn, coinInDecimal), amountParsed);
        const currencyOut = new Token(TOKEN_PROGRAM_ID, coinOut, coinOutDecimal);

        // Set slippage and calculate output amounts
        const slippage = new Percent(slippagePercent, 100); // Use parameter for slippage
        const { amountOut, minAmountOut } = Liquidity.computeAmountOut({
            poolKeys,
            poolInfo,
            amountIn,
            currencyOut,
            slippage,
        });

        if (minAmountOut.raw <= 0 || amountIn.raw <= 0) {
            throw new Error("Invalid transaction amounts");
        }

        // Create and prepare transaction
        const transaction = new Transaction();
        const simpleInstruction = await Liquidity.makeSwapInstructionSimple({
            connection,
            poolKeys,
            userKeys: {
                tokenAccounts,
                owner,
            },
            amountIn,
            amountOut: minAmountOut,
            fixedSide: "in",
            makeTxVersion: TxVersion.V0,
        });

        if (simpleInstruction.innerTransactions.length === 0) {
            throw new Error("No inner transactions found");
        }

        // Add instructions to transaction
        const instructions = simpleInstruction.innerTransactions[0].instructions;
        instructions.forEach((instruction) => transaction.add(instruction));

        // Set recent blockhash and fee payer
        const { blockhash } = await connection.getLatestBlockhash();
        transaction.recentBlockhash = blockhash;
        transaction.feePayer = ownerKeypair.publicKey;

        // Send and confirm the transaction
        const signature = await sendAndConfirmTransaction(connection, transaction, [ownerKeypair], { commitment: 'confirmed' });

        // Check transaction confirmation status
        const checkTransactionError = async (startTime, signature) => {
            while (Date.now() - startTime <= 30000) {
                const status = await connection.getSignatureStatus(signature);
                if (status.value?.confirmationStatus === 'confirmed') {
                    if (status.value?.err) {
                        throw new Error("Transaction Failed");
                    }
                    return signature;
                }
                await new Promise((resolve) => setTimeout(resolve, 1000));
            }
            throw new Error("Transaction not processed");
        };

        return await checkTransactionError(Date.now(), signature);

    } catch (err) {
        console.error('Swap error:', err);
        throw err;
    }
}

module.exports = { raydiumApiSwap };