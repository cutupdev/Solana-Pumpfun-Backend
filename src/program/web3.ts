import { TokenStandard, createAndMint, mplTokenMetadata } from "@metaplex-foundation/mpl-token-metadata";
import { Instruction, createSignerFromKeypair, generateSigner, percentAmount, signerIdentity } from "@metaplex-foundation/umi";
import { createUmi } from "@metaplex-foundation/umi-bundle-defaults";
import { ComputeBudgetProgram, Connection, Keypair, PublicKey, SYSVAR_RENT_PUBKEY, Signer, SystemProgram, Transaction, TransactionResponse, VersionedTransaction, clusterApiUrl, sendAndConfirmTransaction } from "@solana/web3.js";
import base58 from "bs58";
import { Types } from "mongoose";
import Coin from "../models/Coin";
import { createLPIx, initializeIx, removeLiquidityIx } from "./web3Provider";
import { web3 } from "@coral-xyz/anchor";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import { PROGRAM_ID } from "./cli/programId";
import { AccountType, TOKEN_PROGRAM_ID, getAssociatedTokenAddress } from "@solana/spl-token";
import { BN } from "bn.js";
import { SwapAccounts, SwapArgs, swap } from "./cli/instructions";
import * as anchor from "@coral-xyz/anchor"
import { ASSOCIATED_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token";
import { LiquidityPool } from "./cli/accounts";
import { string } from "joi";
import { Int32 } from "mongodb";
import { setCoinStatus } from "../routes/coinStatus";
import CoinStatus from "../models/CoinsStatus";
import { simulateTransaction } from "@coral-xyz/anchor/dist/cjs/utils/rpc";
import pinataSDK from '@pinata/sdk';


const curveSeed = "CurveConfiguration"
const POOL_SEED_PREFIX = "liquidity_pool"
const LP_SEED_PREFIX = "LiqudityProvider"
const PINATA_SECRET_API_KEY = process.env.PINATA_SECRET_API_KEY
const PINATA_GATEWAY_URL = process.env.PINATA_GATEWAY_URL;


export const connection = new Connection(clusterApiUrl('devnet'))

const privateKey = base58.decode(process.env.PRIVATE_KEY!);

export const adminKeypair = web3.Keypair.fromSecretKey(privateKey);
const adminWallet = new NodeWallet(adminKeypair);

// const umi = createUmi(process.env.PUBLIC_SOLANA_RPC!);
const umi = createUmi(clusterApiUrl('devnet'));

const userWallet = umi.eddsa.createKeypairFromSecretKey(privateKey);

const userWalletSigner = createSignerFromKeypair(umi, userWallet);
umi.use(signerIdentity(userWalletSigner));
umi.use(mplTokenMetadata());

export const uploadMetadata = async (data: CoinInfo): Promise<any> => {
    // const url = data.url;
    const url = 'https://api.pinata.cloud/pinning/pinFileToIPFS/'
    console.log(data)
    const metadata = {
        name: data.name,
        ticker: data.ticker,
        URL: data.url,
        description: data.description,
    }
    const pinata = new pinataSDK({ pinataJWTKey: PINATA_SECRET_API_KEY });

    try {
        const res = await pinata.pinJSONToIPFS(metadata);
        console.log(res, "======")
        return res
    } catch (error) {
        console.error('Error uploading metadata: ', error);
        return error;
    }
}
// Initialize Transaction for smart contract
export const initializeTx = async () => {
    const initTx = await initializeIx(adminWallet.publicKey);
    const createTx = new Transaction().add(initTx.ix);
    console.log(adminWallet.publicKey.toBase58())

    createTx.feePayer = adminWallet.publicKey;
    createTx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash

    const txId = await sendAndConfirmTransaction(connection, createTx, [adminKeypair]);
    console.log("txId:", txId)
}


// Create Token and add liquidity transaction
export const createToken = async (data: CoinInfo) => {
    const uri = await uploadMetadata(data);

    const mint = generateSigner(umi);
    const tx = createAndMint(umi, {
        mint,
        authority: umi.identity,
        name: data.name,
        symbol: data.ticker,
        uri: data.url,
        sellerFeeBasisPoints: percentAmount(0),
        decimals: 6,
        amount: 1000_000_000_000_000,
        tokenOwner: userWallet.publicKey,
        tokenStandard: TokenStandard.Fungible,
    })
    const mintTx = await tx.sendAndConfirm(umi)
    console.log(userWallet.publicKey, "Successfully minted 1 million tokens (", mint.publicKey, ")");
    const newCoin = new Coin({
        ...data,
        // amount: tx.amount,
        token: mint.publicKey
    })
    await sleep(5000);
    try {
        const lpTx = await createLPIx(new PublicKey(mint.publicKey), adminKeypair.publicKey)
        const createTx = new Transaction().add(lpTx.ix);
        createTx.feePayer = adminWallet.publicKey;
        createTx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash

        const txId = await sendAndConfirmTransaction(connection, createTx, [adminKeypair]);
        console.log("txId:", txId)
        // const checkTx = await checkTransactionStatus(txId);
        const urlSeg = data.url.split('/');
        const url = `${PINATA_GATEWAY_URL}/${urlSeg[urlSeg.length - 1]}`;
        console.log(url)
        console.log('great')
        const newCoin = new Coin({
            creator: data.creator,
            name: data.name,
            ticker: data.ticker,
            description: data.description,
            token: mint.publicKey,
            url,
        });
        console.log(newCoin)
        const response = await newCoin.save();
        const newCoinStatus = new CoinStatus({
            coinId: response._id,
            record: [
                {
                    holder: response.creator,
                    holdingStatus: 2,
                    amount: 0,
                    tx: txId,
                    price: newCoin.reserveTwo / newCoin.reserveOne
                }
            ]
        })
        await newCoinStatus.save();
        console.log("Saved Successfully...");
        return response
    } catch (error) {
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
        const [globalAccount] = PublicKey.findProgramAddressSync(
            [Buffer.from("global")],
            PROGRAM_ID
        )

        const poolTokenOne = await getAssociatedTokenAddress(
            mint1, globalAccount, true
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
            globalAccount,
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
    if (logs.logs[1].includes('AddLiquidity')) {
        return undefined
    }
    console.log(logs)
    // Get parsed log data
    const parsedData: ResultType = parseLogs(logs.logs, logs.signature);
    console.log(parsedData);

    if (parsedData.reserve2 > 80_000_000_000) {
        // Remove liquidity poll and move to Raydium
        // createRaydium()
        return;
    }
    await setCoinStatus(parsedData)


}, "confirmed")

// Remove liquidity pool and Create Raydium Pool
export const createRaydium = async (mint1: PublicKey) => {
    const amountOne = 1000_000_000_000;
    const amountTwo = 1000_000_000_000;
    const radyiumIx = await removeLiquidityIx(mint1, adminKeypair.publicKey, connection);

    if (radyiumIx == undefined) return;
    for (const iTx of radyiumIx.willSendTx) {
        if (iTx instanceof VersionedTransaction) {
            iTx.sign([adminKeypair]);
            await connection.sendTransaction(iTx, {
                skipPreflight: true
            });
        } else {
            await sendAndConfirmTransaction(connection, iTx, [adminKeypair], {
                skipPreflight: true
            });
        }
    }
    // console.log(await connection.simulateTransaction(radyiumIx.tx1))
    // await connection.sendTransaction(radyiumIx.tx1, [adminKeypair]);


    const tx = new Transaction().add(ComputeBudgetProgram.setComputeUnitLimit({ units: 400_000 }));

    for (let i = 0; i < radyiumIx.ixs.length; i++) {
        tx.add(radyiumIx.ixs[i]);
    }

    tx.feePayer = adminKeypair.publicKey;
    tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash

    // console.dir((await simulateTransaction(connection, tx)), { depth: null })
    const ret = await simulateTransaction(connection, tx);

    if (!ret.value.logs) return "";
    for (let i = 0; i < ret.value.logs?.length; i++)
        console.log(ret.value.logs[i]);

    const sig = await sendAndConfirmTransaction(connection, tx, [adminKeypair], { skipPreflight: true })

    return sig;
}

function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
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
    url: string;
    description?: string;
    token?: string;
    reserve1?: number;
    reserve2?: number;
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