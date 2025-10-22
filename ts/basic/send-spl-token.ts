import {
    Commitment,
    Connection, Keypair,
    LAMPORTS_PER_SOL,
    PublicKey,
    Transaction,
    VersionedTransaction,
    TransactionMessage,
} from '@solana/web3.js';

import {
    ASSOCIATED_TOKEN_PROGRAM_ID,
    getAssociatedTokenAddress,
    TOKEN_PROGRAM_ID,
    createAssociatedTokenAccountInstruction,
    createTransferCheckedInstruction
} from "@solana/spl-token";

import base58 from 'bs58';
import * as dotenv from 'dotenv';

dotenv.config();

(async () => {
    try {
        const rpcUrl = process.env.RPC_URL;
        const wsEndpoint = process.env.WS_ENDPOINT;
        const commitment: Commitment = 'processed';
        const privateKey = process.env.SONIC_PRIVATE_KEY;
        const recipientAddress = process.env.PUBLIC_KEY;
        const tokenMintAddress = "4tzrHCWVs6Y8fzj4DLwctHAGNrh9U1vgPzq5KLFo81dx";

        const connection = new Connection(rpcUrl, {
            commitment,
            wsEndpoint
        });

        const sender: Keypair = Keypair.fromSecretKey(base58.decode(privateKey));

        const tx = new Transaction();

        const tokenMintAccount = new PublicKey(tokenMintAddress);
        const to = new PublicKey(recipientAddress);

        const toTokenAccount = await getAssociatedTokenAddress(tokenMintAccount, to, true, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);

        const senderTokenAccount = await getAssociatedTokenAddress(tokenMintAccount, sender.publicKey, true, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);

        if ((await connection.getAccountInfo(toTokenAccount)) == null) {
            tx.add(
                createAssociatedTokenAccountInstruction(
                    sender.publicKey,
                    toTokenAccount,
                    to,
                    tokenMintAccount,
                    TOKEN_PROGRAM_ID,
                    ASSOCIATED_TOKEN_PROGRAM_ID)
            );
        }

        tx.add(
            createTransferCheckedInstruction(
                senderTokenAccount,
                tokenMintAccount,
                toTokenAccount,
                sender.publicKey,
                1 * LAMPORTS_PER_SOL,
                9,
                [],
                TOKEN_PROGRAM_ID,
            )
        );

        tx.feePayer = sender.publicKey;
        const { blockhash } = await connection.getLatestBlockhash();
        tx.recentBlockhash = blockhash;

        const messageV0 = new TransactionMessage({
            payerKey: sender.publicKey,
            recentBlockhash: blockhash,
            instructions: tx.instructions,
        }).compileToV0Message();

        const versionedTx = new VersionedTransaction(messageV0);
        versionedTx.sign([sender]);

        const txHash = await connection.sendTransaction(versionedTx);

        console.log("tx hash: ", txHash);

    } catch (error) {
        console.error("Error sending SPL token:", error instanceof Error ? error.message : 'Unknown error');
        process.exit(1);
    }
})();