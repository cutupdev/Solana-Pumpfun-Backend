import * as anchor from "@coral-xyz/anchor"
import { PROGRAM_ID } from "./cli/programId"
import { ComputeBudgetProgram, Connection, PublicKey, SYSVAR_RENT_PUBKEY, SystemProgram, Transaction, TransactionInstruction, VersionedTransaction, } from "@solana/web3.js"
import { TOKEN_PROGRAM_ID, getAssociatedTokenAddress, getAssociatedTokenAddressSync, } from "@solana/spl-token"
import { AddLiquidityAccounts, AddLiquidityArgs, InitializeAccounts, InitializeArgs, RemoveLiquidityAccounts, RemoveLiquidityArgs, SwapAccounts, SwapArgs, addLiquidity, initialize, removeLiquidity, swap } from "./cli/instructions"
import { ASSOCIATED_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token"
import {
  MarketV2,
  Token,
  DEVNET_PROGRAM_ID,
  TxVersion,
  LOOKUP_TABLE_CACHE,
  buildSimpleTransaction,
  Spl,
  parseBigNumberish,
  InstructionType
} from '@raydium-io/raydium-sdk';
import { adminKeypair } from "./web3"

const curveSeed = "CurveConfiguration"
const POOL_SEED_PREFIX = "liquidity_pool"
const LP_SEED_PREFIX = "LiqudityProvider"



export const createLPIx = async (
  mintToken: PublicKey,
  payer: PublicKey,
) => {
  const [poolPda] = PublicKey.findProgramAddressSync(
    [Buffer.from(POOL_SEED_PREFIX), mintToken.toBuffer()],
    PROGRAM_ID
  )
  const [globalAccount] = PublicKey.findProgramAddressSync(
    [Buffer.from("global")],
    PROGRAM_ID
  );
  const [liquidityProviderAccount] = PublicKey.findProgramAddressSync(
    [Buffer.from(LP_SEED_PREFIX), poolPda.toBuffer(), payer.toBuffer()],
    PROGRAM_ID
  )
  const poolTokenOne = await getAssociatedTokenAddress(
    mintToken, globalAccount, true
  )
  const userAta1 = await getAssociatedTokenAddress(
    mintToken, payer
  )
  const acc: AddLiquidityAccounts = {
    pool: poolPda,
    globalAccount,
    mintTokenOne: mintToken,
    poolTokenAccountOne: poolTokenOne,
    userTokenAccountOne: userAta1,
    liquidityProviderAccount: liquidityProviderAccount,
    user: payer,
    tokenProgram: TOKEN_PROGRAM_ID,
    associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
    rent: SYSVAR_RENT_PUBKEY,
    systemProgram: SystemProgram.programId
  }
  const args: AddLiquidityArgs = {
    amountOne: new anchor.BN(1000000000000000),
    amountTwo: new anchor.BN(30000000000)
  }
  const ix = addLiquidity(args, acc);

  return { ix, acc }
}
export const initializeIx = async (
  payer: PublicKey
) => {
  const [curveConfig] = PublicKey.findProgramAddressSync(
    [Buffer.from(curveSeed)],
    PROGRAM_ID
  );
  const [globalAccount] = PublicKey.findProgramAddressSync(
    [Buffer.from("global")],
    PROGRAM_ID
  );

  const acc: InitializeAccounts = {
    dexConfigurationAccount: curveConfig,
    globalAccount,
    admin: payer,
    rent: SYSVAR_RENT_PUBKEY,
    systemProgram: SystemProgram.programId
  };

  const args: InitializeArgs = {
    fee: 1
  }

  const ix = initialize(args, acc);
  return { ix, acc }

}





// export const performTx = async (
//     address: string,
//     txId: string,
// ) => {
//     try{
//         console.log("==============")

//         let txInfo;
//         for(let i=0; ; i++) {
//             await sleep(2000)
//             txInfo = await getDataFromSignature(txId, io); 

//             console.log(txInfo)
//             if (txInfo !== undefined) {
//                 break;
//             }
//             if (i > 30) {
//                 io.emit("performedTx", address, "Time Out");
//                 return;
//             }
//         }

//     } catch (err) {

//     }

// }


// const getDataFromSignature = async (sig: string, io: Server) => {

//     try {
//         let tx = await connection.getParsedTransaction(sig,'confirmed');
//         if (tx && tx.meta && !tx.meta.err) {   
//             let length = tx.transaction.message.instructions.length;

//             for (let i = length; i > 0; i--) {
//                     const ix = tx.transaction.message.instructions[i-1]  as ParsedInstruction

//                     if (ix.programId.toBase58() === SPL_TOKEN_PROGRAM ) {
//                         console.log(ix, " =============> ix")
//                         const srcAcc = await connection.getParsedAccountInfo(new PublicKey(ix.parsed.info.source));
//                         const destAcc = await connection.getParsedAccountInfo(new PublicKey(ix.parsed.info.destination));
//                         const src = (srcAcc.value?.data as ParsedAccountData).parsed.info.owner;
//                         const dest = (destAcc.value?.data as ParsedAccountData).parsed.info.owner;
//                         const amount = parseInt(ix.parsed.info.amount);


//                         break;
//                     }

//             }

//             return true;

//         }

//     } catch (error) {
//         console.log("error:", error)
//     }
// }

// export const createAddLPIx = (
//     mintTokenOne: PublicKey,
//     mintTokenTwo: PublicKey,
//     payer: PublicKey,
//     amountOne: anchor.BN,
//     amountTwo: anchor.BN
// ) => {
//     const [poolPda] = PublicKey.findProgramAddressSync(
//         [Buffer.from("liquidity_pool"), Buffer.from(mintTokenOne > mintTokenTwo ? mintTokenOne.toBase58()+mintTokenTwo.toBase58() :  mintTokenTwo.toBase58()+mintTokenOne.toBase58()) ],
//         PROGRAM_ID
//     )

//     const [liquidityProviderAccount] = PublicKey.findProgramAddressSync(
//         [Buffer.from("LiqudityProvider"), poolPda.toBuffer(), payer.toBuffer()],
//         PROGRAM_ID
//     )

//     const poolTokenAccountOne = getAssociatedTokenAddressSync(mintTokenOne, poolPda); 
//     const poolTokenAccountTwo = getAssociatedTokenAddressSync(mintTokenOne, poolPda); 
//     const userTokenAccountOne = getAssociatedTokenAddressSync(mintTokenOne, payer); 
//     const userTokenAccountTwo = getAssociatedTokenAddressSync(mintTokenOne, payer); 

//     const acc: AddLiquidityAccounts = {
//         pool: poolPda,
//         liquidityProviderAccount,
//         mintTokenOne,
//         mintTokenTwo,
//         poolTokenAccountOne,
//         poolTokenAccountTwo,
//         userTokenAccountOne,
//         userTokenAccountTwo,
//         user: payer,
//         systemProgram: SystemProgram.programId,
//         tokenProgram:TOKEN_PROGRAM_ID,
//         associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID
//     }

//     const args: AddLiquidityArgs = {
//         amountOne,
//         amountTwo
//     }
//     const ix = addLiquidity(args, acc);

//     return {ix, acc}
// }

// export const createRemoveLPIx = (
//     mintTokenOne: PublicKey,
//     mintTokenTwo: PublicKey,
//     payer: PublicKey,
//     shares: anchor.BN,
// ) => {
//     const [poolPda] = PublicKey.findProgramAddressSync(
//         [Buffer.from("liquidity_pool"), Buffer.from(mintTokenOne > mintTokenTwo ? mintTokenOne.toBase58()+mintTokenTwo.toBase58() :  mintTokenTwo.toBase58()+mintTokenOne.toBase58()) ],
//         PROGRAM_ID
//     )

//     const [liquidityProviderAccount] = PublicKey.findProgramAddressSync(
//         [Buffer.from("LiqudityProvider"), poolPda.toBuffer(), payer.toBuffer()],
//         PROGRAM_ID
//     )

//     const poolTokenAccountOne = getAssociatedTokenAddressSync(mintTokenOne, poolPda); 
//     const poolTokenAccountTwo = getAssociatedTokenAddressSync(mintTokenOne, poolPda); 
//     const userTokenAccountOne = getAssociatedTokenAddressSync(mintTokenOne, payer); 
//     const userTokenAccountTwo = getAssociatedTokenAddressSync(mintTokenOne, payer); 

//     const acc: RemoveLiquidityAccounts = {
//         pool: poolPda,
//         liquidityProviderAccount,
//         mintTokenOne,
//         mintTokenTwo,
//         poolTokenAccountOne,
//         poolTokenAccountTwo,
//         userTokenAccountOne,
//         userTokenAccountTwo,
//         user: payer,
//         systemProgram: SystemProgram.programId,
//         tokenProgram:TOKEN_PROGRAM_ID,
//         associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID
//     }

//     const args: RemoveLiquidityArgs = {
//         shares
//     }
//     const ix = removeLiquidity(args, acc);

//     return {ix, acc}
// }

// export const createSwapIx = (
//     mintTokenOne: PublicKey,
//     mintTokenTwo: PublicKey,
//     payer: PublicKey,
//     amount: anchor.BN,
// ) => {
//     const [poolPda] = PublicKey.findProgramAddressSync(
//         [Buffer.from("liquidity_pool"), Buffer.from(mintTokenOne > mintTokenTwo ? mintTokenOne.toBase58()+mintTokenTwo.toBase58() :  mintTokenTwo.toBase58()+mintTokenOne.toBase58()) ],
//         PROGRAM_ID
//     )

//     const [dexConfigurationAccount] = PublicKey.findProgramAddressSync(
//         [Buffer.from("CurveConfiguration")],
//         PROGRAM_ID
//     )

//     const poolTokenAccountOne = getAssociatedTokenAddressSync(mintTokenOne, poolPda); 
//     const poolTokenAccountTwo = getAssociatedTokenAddressSync(mintTokenOne, poolPda); 
//     const userTokenAccountOne = getAssociatedTokenAddressSync(mintTokenOne, payer); 
//     const userTokenAccountTwo = getAssociatedTokenAddressSync(mintTokenOne, payer); 

//     const acc: SwapAccounts = {
//         dexConfigurationAccount,
//         pool: poolPda,
//         mintTokenOne,
//         mintTokenTwo,
//         poolTokenAccountOne,
//         poolTokenAccountTwo,
//         userTokenAccountOne,
//         userTokenAccountTwo,
//         user: payer,
//         systemProgram: SystemProgram.programId,
//         tokenProgram:TOKEN_PROGRAM_ID,
//         associatedTokenProgram: ASSOCIATED_TOKEN_PROGRAM_ID
//     }

//     const args: SwapArgs = {
//         amount
//     }
//     const ix = swap(args, acc);

//     return {ix, acc}
// }
export const removeLiquidityIx = async (
  mintToken: PublicKey,
  // amountOne: anchor.BN,
  // amountTwo: anchor.BN,
  payer: PublicKey,
  connection: Connection
) => {
  try {
    const ammProgram = new PublicKey("HWy1jotHpo6UqeQxx49dpYYdQB8wj9Qk9MdxwjLvDHB8");

    console.log("Remove::::::::")
    //  coin mint address
    const coinMint = mintToken;
    console.log("coinMint: ", coinMint.toBase58());
    //  coin mint address
    const pcMint = new PublicKey("So11111111111111111111111111111111111111112");
    console.log("pcMint: ", pcMint.toBase58());
    //  market address
    const createMarketInstruments = await MarketV2.makeCreateMarketInstructionSimple({
      connection,
      wallet: payer,
      baseInfo: {mint: mintToken, decimals: 9},
      quoteInfo: {mint: pcMint, decimals: 9},
      lotSize: 1, // default 1
      tickSize: 0.01, // default 0.01
      dexProgramId: DEVNET_PROGRAM_ID.OPENBOOK_MARKET,
      makeTxVersion,
    })
    
    const willSendTx = await buildSimpleTransaction({
      connection,
      makeTxVersion,
      payer,
      innerTransactions: createMarketInstruments.innerTransactions,
    })


    const market = createMarketInstruments.address.marketId;

    const [poolPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("liquidity_pool"), mintToken.toBuffer()],
      PROGRAM_ID
    )
    const [globalAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("global")],
      PROGRAM_ID
    )

    console.log("globalAccount: ", globalAccount.toBase58())
    const [liquidityProviderAccount] = PublicKey.findProgramAddressSync(
      [Buffer.from("LiqudityProvider"), poolPda.toBuffer(), payer.toBuffer()],
      PROGRAM_ID
    )

    console.log(poolPda, "===================")

    const [amm] = PublicKey.findProgramAddressSync(
      [ammProgram.toBuffer(), market.toBuffer(), Buffer.from("amm_associated_seed")],
      ammProgram
    );
    console.log("amm: ", amm.toBase58());

    const [ammAuthority] = PublicKey.findProgramAddressSync(
      [Buffer.from("amm authority")],
      ammProgram
    );
    console.log("ammAuthority: ", ammAuthority.toBase58());

    const [ammOpenOrders] = PublicKey.findProgramAddressSync(
      [ammProgram.toBuffer(), market.toBuffer(), Buffer.from("open_order_associated_seed")],
      ammProgram
    );
    console.log("ammOpenOrders: ", ammOpenOrders.toBase58());

    const [lpMint] = PublicKey.findProgramAddressSync(
      [ammProgram.toBuffer(), market.toBuffer(), Buffer.from("lp_mint_associated_seed")],
      ammProgram
    );
    console.log("lpMint: ", lpMint.toBase58());

    console.log("coinMint: ", coinMint.toBase58());
    console.log("pcMint: ", pcMint.toBase58());

    const [coinVault] = PublicKey.findProgramAddressSync(
      [ammProgram.toBuffer(), market.toBuffer(), Buffer.from("coin_vault_associated_seed")],
      ammProgram
    );
    console.log("coinVault: ", coinVault.toBase58());

    const [pcVault] = PublicKey.findProgramAddressSync(
      [ammProgram.toBuffer(), market.toBuffer(), Buffer.from("pc_vault_associated_seed")],
      ammProgram
    );
    console.log("pcVault: ", pcVault.toBase58());

    //  fee destination
    const feeDestination = new PublicKey("3XMrhbv989VxAMi3DErLV9eJht1pHppW5LbKxe9fkEFR");
    console.log("feeDestination: ", feeDestination.toBase58());

    const [targetOrders] = PublicKey.findProgramAddressSync(
      [ammProgram.toBuffer(), market.toBuffer(), Buffer.from("target_associated_seed")],
      ammProgram
    );
    console.log("targetOrders: ", targetOrders.toBase58());

    const [ammConfig] = PublicKey.findProgramAddressSync(
      [Buffer.from("amm_config_account_seed")],
      ammProgram
    );
    console.log("ammConfig: ", ammConfig.toBase58());

    console.log("serumProgram: ", "EoTcMgcDRTJVZDMZWBoU6rhYHZfkNTVEAfz3uUJRcYGj");
    console.log("serumMarket: ", market.toBase58());

    const userWallet = new PublicKey("EmPsWiBxEy6rXNj3VVtHLNAmP5hUaVUrDH3QXiTttDgy");
    console.log("userWallet: ", userWallet.toBase58());

    const userTokenCoin = await getAssociatedTokenAddress(
      coinMint, globalAccount, true
    )
    console.log("userTokenCoin: ", userTokenCoin.toBase58());

    const userTokenPc = await getAssociatedTokenAddress(
      pcMint, globalAccount, true
    )
    console.log("userTokenPc: ", userTokenPc.toBase58());

    const userTokenLp = await getAssociatedTokenAddress(
      lpMint, globalAccount, true
    )
    console.log("userTokenLp: ", userTokenLp.toBase58());

    const ixs: TransactionInstruction[] = [];
    const newTokenAccount = await Spl.insertCreateWrappedNativeAccount({
      connection,
      owner: globalAccount,
      payer,
      instructions: ixs,
      instructionsType: [],
      signers: [adminKeypair],
      amount: new anchor.BN(1000000000),
    });

    const nonce = 252;

    const acc: RemoveLiquidityAccounts = {
      pool: poolPda,
      globalAccount,
      ammProgram,
      tokenProgram: TOKEN_PROGRAM_ID,
      associatedTokenProgram: ASSOCIATED_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
      sysvarRent: SYSVAR_RENT_PUBKEY,
      amm,
      ammAuthority,
      ammOpenOrders,
      lpMint,
      coinMint,
      pcMint,
      coinVault,
      pcVault,
      targetOrders,
      ammConfig,
      feeDestination,
      marketProgram: new PublicKey("EoTcMgcDRTJVZDMZWBoU6rhYHZfkNTVEAfz3uUJRcYGj"),
      market,
      userWallet: payer,
      userTokenCoin,
      userTokenPc: newTokenAccount,
      userTokenLp,
    } 
    const args: RemoveLiquidityArgs = {
      nonce,
      initPcAmount: new anchor.BN(880000),
    }

    ixs.push(removeLiquidity(args, acc));

    // ixs.push(Spl.makeCloseAccountInstruction({
    //   programId: TOKEN_PROGRAM_ID,
    //   tokenAccount: newTokenAccount,
    //   owner: payer,
    //   payer,
    //   instructionsType: [],
    // }));

    return { ixs, acc, willSendTx }
  } catch (error) {
    console.log("Error in removing liquidity", error)
  }
}

export const makeTxVersion = TxVersion.LEGACY; // LEGACY
