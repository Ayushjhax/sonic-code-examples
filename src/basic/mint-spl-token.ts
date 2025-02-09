import {
    Commitment,
    Connection, Keypair,
    LAMPORTS_PER_SOL,
    SystemProgram,
    Transaction,
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

import * as base58 from 'bs58';


(async () => {
    const commitment: Commitment = 'processed';

    const connection = new Connection('https://api.testnet.v1.sonic.game', {
        commitment,
        wsEndpoint: 'wss://api.testnet.v1.sonic.game'
    });

    const sender: Keypair = Keypair.fromSecretKey(base58.decode("4DcqYGxBW1WHHwUi7mRnN3uxPbG6oiXRTJ5Fq3nNg74DUs56Ht5JbKmnce7XAcPEt2si5Gyvd2GNLxCHrw1ckXFs"));

    const tx = new Transaction();

    const tokenMintAccountKeypair = Keypair.generate();

    console.log("token mint account: ", tokenMintAccountKeypair.publicKey.toBase58());

    const lamports = await getMinimumBalanceForRentExemptMint(connection);

    tx.add(
        SystemProgram.createAccount({
            fromPubkey: sender.publicKey,
            newAccountPubkey: tokenMintAccountKeypair.publicKey,
            space: MINT_SIZE,
            lamports,
            programId: TOKEN_PROGRAM_ID,
        })
    );

    tx.add(
        createInitializeMint2Instruction(tokenMintAccountKeypair.publicKey, 9, sender.publicKey, sender.publicKey, TOKEN_PROGRAM_ID),
    );

    const senderTokenAccount = await getAssociatedTokenAddress(tokenMintAccountKeypair.publicKey, sender.publicKey, true, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);

    tx.add(
        createAssociatedTokenAccountInstruction(
            sender.publicKey,
            senderTokenAccount,
            sender.publicKey,
            tokenMintAccountKeypair.publicKey,
            TOKEN_PROGRAM_ID,
            ASSOCIATED_TOKEN_PROGRAM_ID)
    );

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
    tx.recentBlockhash = (await connection.getLatestBlockhash())[0];

    const txHash = await connection.sendTransaction(tx, [sender, tokenMintAccountKeypair]);

    console.log("tx hash: ", txHash);

})();