import { TokenStandard, createAndMint, mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import { Instruction, createSignerFromKeypair, generateSigner, percentAmount, signerIdentity } from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { ComputeBudgetProgram, Connection, Keypair, PublicKey, SYSVAR_RENT_PUBKEY, Signer, SystemProgram, Transaction, TransactionResponse, clusterApiUrl, sendAndConfirmTransaction } from "@solana/web3.js";
import base58 from "bs58";
import { Types } from "mongoose";
import Coin from "../models/Coin";
import { createLPIx, initializeIx } from "./web3Provider";
import { web3 } from "@coral-xyz/anchor";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { PROGRAM_ID } from "./cli/programId";
import { AccountType, TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from "@solana/spl-token";
import { BN } from "bn.js";
import { SwapAccounts, SwapArgs, removeLiquidity, swap } from "./cli/instructions";
import * as anchor from "@coral-xyz/anchor"
import { ASSOCIATED_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token";
import { LiquidityPool } from "./cli/accounts";
import { string } from "joi";
import { Int32 } from "mongodb";
import { setCoinStatus } from "../routes/coinStatus";
import CoinStatus from "../models/CoinsStatus";

const curveSeed = "CurveConfiguration"
const POOL_SEED_PREFIX = "liquidity_pool"
const LP_SEED_PREFIX = "LiqudityProvider"

const connection = new Connection(clusterApiUrl('devnet'))

const privateKey = base58.decode(process.env.PRIVATE_KEY!);

const adminKeypair = web3.Keypair.fromSecretKey(privateKey);
const adminWallet = new NodeWallet(adminKeypair);

// const umi = createUmi(process.env.PUBLIC_SOLANA_RPC!);
const umi = createUmi(clusterApiUrl('devnet'));

const userWallet = umi.eddsa.createKeypairFromSecretKey(privateKey);

const userWalletSigner = createSignerFromKeypair(umi, userWallet);
umi.use(signerIdentity(userWalletSigner));
umi.use(mplTokenMetadata());


// Initialize Transaction for smart contract
export const initializeTx = async () => {
    const initTx = await initializeIx(adminWallet.publicKey);
    const createTx = new Transaction().add(initTx.ix);

    createTx.feePayer = adminWallet.publicKey;
    createTx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash

    const txId = await sendAndConfirmTransaction(connection, createTx, [adminKeypair]);
    console.log("txId:", txId)
}

// Create Token and add liquidity transaction
export const createToken = async (data: CoinInfo) => {

    const mint = generateSigner(umi);
    // console.log("User wallet: ", userWallet.publicKey);
    const tx = createAndMint(umi, {
        mint,
        authority: umi.identity,
        name: data.name,
        symbol: data.ticker,
        uri: data.image,
        sellerFeeBasisPoints: percentAmount(0),
        decimals: 6,
        amount: 1000_000_000_000_000,
        tokenOwner: userWallet.publicKey,
        tokenStandard: TokenStandard.Fungible,
    })
    const mintTx = await tx.sendAndConfirm(umi)
    console.log("Successfully minted 1 million tokens (", mint.publicKey, ")");
    const newCoin = new Coin({
        ...data,
        // amount: tx.amount,
        token: mint.publicKey
    })
    // await initializeTx();
    // const createTx = new Transaction().add(lpTx.ix);
    const lpTx = await createLPIx(new PublicKey(mint.publicKey), adminKeypair.publicKey)
    const createTx = new Transaction().add(lpTx.ix);
    createTx.feePayer = adminWallet.publicKey;
    createTx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash

    const txId = await sendAndConfirmTransaction(connection, createTx, [adminKeypair]);
    console.log("txId:", txId)
    const checkTx = await checkTransactionStatus(txId);
    if (checkTx) {
        const res = await newCoin.save();
        const newCoinStatus =new CoinStatus({
            coinId: res._id,
            record: [
                {
                    holder: res.creator,
                    holdingStatus: 2,
                    amount: 0,
                }
            ]
        })
        await newCoinStatus.save();
        console.log("Saved Successfully...");
        return res
    } else {
        return "transaction failed"
    }

}

// check transaction
export const checkTransactionStatus = async (transactionId: string) => {
    try {
        // Fetch the transaction details using the transaction ID
        const transactionResponse: TransactionResponse | null = await connection.getTransaction(transactionId);

        // If the transactionResponse is null, the transaction is not found
        if (transactionResponse === null) {
            console.log(`Transaction ${transactionId} not found.`);
            return false;
        }

        // Check the status of the transaction
        if (transactionResponse.meta && transactionResponse.meta.err === null) {
            return true;
        } else {
            console.log(`Transaction ${transactionId} failed with error: ${transactionResponse.meta?.err}`);
            return false
        }
    } catch (error) {
        console.error(`Error fetching transaction ${transactionId}:`, error);
        return false;
    }
}

// Swap transaction
export const swapTx = async (
    mint1: PublicKey, user: Signer
) => {
    try {
        const [curveConfig] = PublicKey.findProgramAddressSync(
            [Buffer.from(curveSeed)],
            PROGRAM_ID
        )
        const [poolPda] = PublicKey.findProgramAddressSync(
            [Buffer.from(POOL_SEED_PREFIX), mint1.toBuffer()],
            PROGRAM_ID
        )
        const poolTokenOne = await getAssociatedTokenAddress(
            mint1, poolPda, true
        )
        const userAta1 = await getAssociatedTokenAddress(
            mint1, adminKeypair.publicKey
        )

        const args: SwapArgs = {
            amount: new anchor.BN(20000000),
            style: new anchor.BN(2)
        }

        const acc: SwapAccounts = {
            dexConfigurationAccount: curveConfig,
            pool: poolPda,
            mintTokenOne: mint1,
            poolTokenAccountOne: poolTokenOne,
            userTokenAccountOne: userAta1,
            user: adminKeypair.publicKey,
            tokenProgram: TOKEN_PROGRAM_ID,
            associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
            rent: SYSVAR_RENT_PUBKEY,
            systemProgram: SystemProgram.programId
        }
       
        const dataIx = await swap(args, acc, PROGRAM_ID)
        const tx = new Transaction().add(dataIx);
        tx.feePayer = adminKeypair.publicKey
        tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
        // console.log(await connection.simulateTransaction(tx))
        const sig = await sendAndConfirmTransaction(connection, tx, [adminKeypair], { skipPreflight: true })
        return sig
    } catch (error) {
        console.log("Error in swap transaction", error)
    }
}

// Get info when user buy or sell token
const logTx = connection.onLogs(PROGRAM_ID, async (logs, ctx) => {
    if (logs.err !== null) {
        return undefined
    }
    if(logs.logs[1].includes('AddLiquidity')){
        return undefined
    }
    console.log(logs)
    // Get parsed log data
    const parsedData:ResultType = parseLogs(logs.logs, logs.signature);
    console.log(parsedData);

    if(parsedData.reserve2 > 80_000_000_000 ){
        // Remove liquidity poll and move to Raydium
        //  removeLiquidity()
        return ;
    }
    await setCoinStatus(parsedData)


}, "confirmed")

// Get swap(buy and sell)
function parseLogs(logs: string[], tx: string) {
    const result: ResultType = {
        tx,
        mint: '',
        owner: '',
        swapType: 0,
        swapAmount: 0,
        reserve1: 0,
        reserve2: 0
    };
    logs.forEach(log => {
        if (log.includes('Mint: ')) {
            result.mint = (log.split(' ')[3]);
        }
        if (log.includes('Swap: ')) {
            result.owner = log.split(' ')[3];
            result.swapType = parseInt(log.split(' ')[4]);
            result.swapAmount = parseInt(log.split(' ')[5]);
        }
        if (log.includes('Reserves: ')) {
            result.reserve1 = parseInt(log.split(' ')[3]);
            result.reserve2 = parseInt(log.split(' ')[4]);
        }
    });
    return result;
}

export interface CoinInfo {
    creator?: Types.ObjectId;
    name: string;
    ticker: string;
    url?: string;
    description?: string;
    token?: string;
    reserve1?: number;
    reserve2?: number;
    image: string;
}

export interface ResultType {
    tx: string,
    mint: string;
    owner: string;
    swapType: number;
    swapAmount: number;
    reserve1: number;
    reserve2: number;
}