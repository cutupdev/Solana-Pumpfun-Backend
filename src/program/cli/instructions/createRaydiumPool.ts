import { TransactionInstruction, PublicKey, AccountMeta } from "@solana/web3.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import BN from "bn.js" // eslint-disable-line @typescript-eslint/no-unused-vars
import * as borsh from "@coral-xyz/borsh" // eslint-disable-line @typescript-eslint/no-unused-vars
import { PROGRAM_ID } from "../programId"

export interface CreateRaydiumPoolArgs {
  nonce: number
  initPcAmount: BN
  initCoinAmount: BN
}

export interface CreateRaydiumPoolAccounts {
  ammProgram: PublicKey
  tokenProgram: PublicKey
  associatedTokenProgram: PublicKey
  systemProgram: PublicKey
  sysvarRent: PublicKey
  amm: PublicKey
  ammAuthority: PublicKey
  ammOpenOrders: PublicKey
  lpMint: PublicKey
  coinMint: PublicKey
  pcMint: PublicKey
  coinVault: PublicKey
  pcVault: PublicKey
  targetOrders: PublicKey
  ammConfig: PublicKey
  feeDestination: PublicKey
  marketProgram: PublicKey
  market: PublicKey
  userWallet: PublicKey
  userTokenCoin: PublicKey
  userTokenPc: PublicKey
  userTokenLp: PublicKey
}

export const layout = borsh.struct([
  borsh.u8("nonce"),
  borsh.u64("initPcAmount"),
  borsh.u64("initCoinAmount"),
])

export function createRaydiumPool(
  args: CreateRaydiumPoolArgs,
  accounts: CreateRaydiumPoolAccounts,
  programId: PublicKey = PROGRAM_ID
) {
  const keys: Array<AccountMeta> = [
    { pubkey: accounts.ammProgram, isSigner: false, isWritable: false },
    { pubkey: accounts.tokenProgram, isSigner: false, isWritable: false },
    {
      pubkey: accounts.associatedTokenProgram,
      isSigner: false,
      isWritable: false,
    },
    { pubkey: accounts.systemProgram, isSigner: false, isWritable: false },
    { pubkey: accounts.sysvarRent, isSigner: false, isWritable: false },
    { pubkey: accounts.amm, isSigner: false, isWritable: true },
    { pubkey: accounts.ammAuthority, isSigner: false, isWritable: false },
    { pubkey: accounts.ammOpenOrders, isSigner: false, isWritable: true },
    { pubkey: accounts.lpMint, isSigner: false, isWritable: true },
    { pubkey: accounts.coinMint, isSigner: false, isWritable: false },
    { pubkey: accounts.pcMint, isSigner: false, isWritable: false },
    { pubkey: accounts.coinVault, isSigner: false, isWritable: true },
    { pubkey: accounts.pcVault, isSigner: false, isWritable: true },
    { pubkey: accounts.targetOrders, isSigner: false, isWritable: true },
    { pubkey: accounts.ammConfig, isSigner: false, isWritable: false },
    { pubkey: accounts.feeDestination, isSigner: false, isWritable: true },
    { pubkey: accounts.marketProgram, isSigner: false, isWritable: false },
    { pubkey: accounts.market, isSigner: false, isWritable: false },
    { pubkey: accounts.userWallet, isSigner: true, isWritable: true },
    { pubkey: accounts.userTokenCoin, isSigner: false, isWritable: true },
    { pubkey: accounts.userTokenPc, isSigner: false, isWritable: true },
    { pubkey: accounts.userTokenLp, isSigner: false, isWritable: true },
  ]
  const identifier = Buffer.from([65, 45, 119, 77, 204, 178, 84, 2])
  const buffer = Buffer.alloc(1000)
  const len = layout.encode(
    {
      nonce: args.nonce,
      initPcAmount: args.initPcAmount,
      initCoinAmount: args.initCoinAmount,
    },
    buffer
  )
  const data = Buffer.concat([identifier, buffer]).slice(0, 8 + len)
  const ix = new TransactionInstruction({ keys, programId, data })
  return ix
}
