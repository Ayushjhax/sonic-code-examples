import {
  createAssociatedTokenAccountInstruction,
  createCloseAccountInstruction,
  createSyncNativeInstruction,
  createTransferInstruction,
  getAssociatedTokenAddress,
  getOrCreateAssociatedTokenAccount,
  NATIVE_MINT,
} from "@solana/spl-token";
import {
  Connection,
  Keypair,
  LAMPORTS_PER_SOL,
  PublicKey,
  sendAndConfirmTransaction,
  SystemProgram,
  Transaction,
} from "@solana/web3.js";
import bs58 from "bs58";
import * as dotenv from 'dotenv';
dotenv.config();

const privateKey = process.env.SONIC_PRIVATE_KEY;

async function wrapSol(
  connection: Connection,
  wallet: Keypair,
  amountToWrap: number
) {
  const associatedTokenAccount = await getAssociatedTokenAddress(
    NATIVE_MINT,
    wallet.publicKey
  );
  const wrapTransaction = new Transaction().add(
    createAssociatedTokenAccountInstruction(
      wallet.publicKey,
      associatedTokenAccount,
      wallet.publicKey,
      NATIVE_MINT
    ), // it will cost around 0.002 sol for Associated Token Account creation
    SystemProgram.transfer({
      fromPubkey: wallet.publicKey,
      toPubkey: associatedTokenAccount,
      lamports: amountToWrap * LAMPORTS_PER_SOL,
    }),
    createSyncNativeInstruction(associatedTokenAccount)
  );

  const txn = await sendAndConfirmTransaction(connection, wrapTransaction, [
    wallet,
  ]);
  console.log("Wrapped SOL", `https://explorer.sonic.game/tx/${txn}`);

  return associatedTokenAccount;
}

async function unwrapSol(
  connection: Connection,
  wallet: Keypair
): Promise<void> {
  const associatedTokenAccount = await getAssociatedTokenAddress(
    NATIVE_MINT,
    wallet.publicKey
  );

  // Check if the wrapped SOL account exists
  const accountInfo = await connection.getAccountInfo(associatedTokenAccount);
  if (!accountInfo) {
    console.log("No wrapped SOL account found. Nothing to unwrap.");
    return;
  }

  // Check if there's any wrapped SOL to unwrap
  const tokenBalance = await connection.getTokenAccountBalance(associatedTokenAccount);
  if (tokenBalance.value.uiAmount === 0) {
    console.log("Wrapped SOL account has zero balance. Nothing to unwrap.");
    return;
  }

  console.log(`Unwrapping ${tokenBalance.value.uiAmount} wrapped SOL...`);

  const unwrapTransaction = new Transaction().add(
    createCloseAccountInstruction(
      associatedTokenAccount,
      wallet.publicKey,
      wallet.publicKey
    )
  );
  const txn = await sendAndConfirmTransaction(connection, unwrapTransaction, [
    wallet,
  ]);
  console.log("Unwrapped SOL", `https://explorer.sonic.game/tx/${txn}`);
}

async function main() {
  try {
    console.log("Starting SOL wrap/unwrap demo...");
    
    const connection = new Connection("https://api.mainnet-alpha.sonic.game/");
    const keypair = Keypair.fromSecretKey(bs58.decode(privateKey));

    console.log(`Wallet: ${keypair.publicKey.toBase58()}`);

    const balance = await connection.getBalance(
      new PublicKey(keypair.publicKey.toBase58()),
      "confirmed"
    );
    console.log(`Current balance: ${balance / LAMPORTS_PER_SOL} SOL`);

    if (balance < 0.01 * LAMPORTS_PER_SOL) {
      console.log("Insufficient balance. Need at least 0.01 SOL for this demo.");
      return;
    }

    // Step 1: Wrap some SOL first
    console.log("\nStep 1: Wrapping 0.001 SOL...");
    const associatedTokenAccount = await wrapSol(connection, keypair, 0.001);
    console.log(`Wrapped SOL account: ${associatedTokenAccount.toBase58()}`);

    // Check balance after wrapping
    const balanceAfterWrap = await connection.getBalance(
      new PublicKey(keypair.publicKey.toBase58()),
      "confirmed"
    );
    console.log(`Balance after wrapping: ${balanceAfterWrap / LAMPORTS_PER_SOL} SOL`);

    // Step 2: Now unwrap the SOL
    console.log("\nStep 2: Unwrapping SOL...");
    await unwrapSol(connection, keypair);
    
    const finalBalance = await connection.getBalance(
      new PublicKey(keypair.publicKey.toBase58()),
      "confirmed"
    );
    console.log(`Final balance: ${finalBalance / LAMPORTS_PER_SOL} SOL`);
    
    console.log("\nDemo completed successfully!");

  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

main();