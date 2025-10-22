import {
    Commitment,
    Connection, Keypair,
    LAMPORTS_PER_SOL,
    SystemProgram,
    Transaction,
    VersionedTransaction,
    TransactionMessage,
} from '@solana/web3.js';

import {
    ASSOCIATED_TOKEN_PROGRAM_ID,
    getAssociatedTokenAddress,
    TOKEN_PROGRAM_ID,
    getMinimumBalanceForRentExemptMint,
    createInitializeMint2Instruction,
    MINT_SIZE,
    createAssociatedTokenAccountInstruction,
    createMintToCheckedInstruction
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

        const connection = new Connection(rpcUrl, {
            commitment,
            wsEndpoint
        });

        const sender: Keypair = Keypair.fromSecretKey(base58.decode(privateKey));

        const tx = new Transaction();
        const tokenMintAccountKeypair = Keypair.generate();

        console.log("Token mint account:", tokenMintAccountKeypair.publicKey.toBase58());

        const lamports = await getMinimumBalanceForRentExemptMint(connection);

        // Create account for the mint
        tx.add(
            SystemProgram.createAccount({
                fromPubkey: sender.publicKey,
                newAccountPubkey: tokenMintAccountKeypair.publicKey,
                space: MINT_SIZE,
                lamports,
                programId: TOKEN_PROGRAM_ID,
            })
        );

        // Initialize the mint
        tx.add(
            createInitializeMint2Instruction(
                tokenMintAccountKeypair.publicKey, 
                9, 
                sender.publicKey, 
                sender.publicKey, 
                TOKEN_PROGRAM_ID
            ),
        );

        // Get associated token account address
        const senderTokenAccount = await getAssociatedTokenAddress(
            tokenMintAccountKeypair.publicKey, 
            sender.publicKey, 
            true, 
            TOKEN_PROGRAM_ID, 
            ASSOCIATED_TOKEN_PROGRAM_ID
        );

        // Create associated token account
        tx.add(
            createAssociatedTokenAccountInstruction(
                sender.publicKey,
                senderTokenAccount,
                sender.publicKey,
                tokenMintAccountKeypair.publicKey,
                TOKEN_PROGRAM_ID,
                ASSOCIATED_TOKEN_PROGRAM_ID
            )
        );

        // Mint tokens to the account
        tx.add(
            createMintToCheckedInstruction(
                tokenMintAccountKeypair.publicKey,
                senderTokenAccount,
                sender.publicKey,
                1000 * LAMPORTS_PER_SOL,
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
        versionedTx.sign([sender, tokenMintAccountKeypair]);

        const txHash = await connection.sendTransaction(versionedTx);

        console.log("tx hash: ", txHash);

    } catch (error) {
        console.error("error: ", error);
    }
})();