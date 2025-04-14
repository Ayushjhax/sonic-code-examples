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

const privateKey = "YOUR_PRIVATE_KEY";

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
  const connection = new Connection("https://api.mainnet-alpha.sonic.game/");

  const keypair = Keypair.fromSecretKey(bs58.decode(privateKey));

  const balance = await connection.getBalance(
    new PublicKey(keypair.publicKey.toBase58()),
    "confirmed"
  );
  console.log("Your balance is", balance / LAMPORTS_PER_SOL);

  //   console.log("Wrapping SOL...");
  //   await wrapSol(connection, keypair, 0.001);

  //   const associatedTokenAccount = await wrapSol(connection, keypair, 0.001);

  //   console.log("Associated Token Account", associatedTokenAccount.toBase58());

  console.log("Unwrapping SOL...");
  await unwrapSol(connection, keypair);
  const newBalance = await connection.getBalance(
    new PublicKey(keypair.publicKey.toBase58()),
    "confirmed"
  );
  console.log("new balance", newBalance / LAMPORTS_PER_SOL);
}

main();
