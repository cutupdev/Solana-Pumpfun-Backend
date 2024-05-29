import * as anchor from "@coral-xyz/anchor" 
import { PROGRAM_ID } from "./cli/programId"
import {  PublicKey, SYSVAR_RENT_PUBKEY, SystemProgram, } from "@solana/web3.js"
import {  TOKEN_PROGRAM_ID, getAssociatedTokenAddress,  } from "@solana/spl-token"
import { AddLiquidityAccounts, AddLiquidityArgs, InitializeAccounts, InitializeArgs, RemoveLiquidityAccounts, RemoveLiquidityArgs, SwapAccounts, SwapArgs, addLiquidity, initialize, removeLiquidity, swap } from "./cli/instructions/"
import { ASSOCIATED_PROGRAM_ID } from "@coral-xyz/anchor/dist/cjs/utils/token"

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
    const [liquidityProviderAccount] = PublicKey.findProgramAddressSync(
    [Buffer.from(LP_SEED_PREFIX), poolPda.toBuffer(), payer.toBuffer()],
    PROGRAM_ID
    )
    const poolTokenOne = await getAssociatedTokenAddress(
    mintToken, poolPda, true
    )
    const userAta1 = await getAssociatedTokenAddress(
    mintToken, payer
    )
    const acc: AddLiquidityAccounts = {
        pool: poolPda,
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
    const args: AddLiquidityArgs ={
        amountOne: new anchor.BN(1000000000000000),
        amountTwo: new anchor.BN(30000000000)
    }
    const ix = addLiquidity(args, acc);

    return {ix, acc}
}
export const initializeIx = async (
    payer: PublicKey
 ) => {
    const [curveConfig] = PublicKey.findProgramAddressSync(
        [Buffer.from(curveSeed)],
        PROGRAM_ID
    );

    const acc : InitializeAccounts = {
        dexConfigurationAccount: curveConfig,
        admin: payer,
        rent: SYSVAR_RENT_PUBKEY,
        systemProgram: SystemProgram.programId
    };

    const args: InitializeArgs = {
        fee: 1
    }

    const ix = initialize(args, acc);
    return {ix, acc}

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

