import {
    Commitment,
    Connection, Keypair,
    LAMPORTS_PER_SOL,
    PublicKey,
    Transaction,
} from '@solana/web3.js';

import {
    ASSOCIATED_TOKEN_PROGRAM_ID,
    getAssociatedTokenAddress,
    TOKEN_PROGRAM_ID,
    createAssociatedTokenAccountInstruction,
    createTransferCheckedInstruction
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

    const tokenMintAccount = new PublicKey("H6WqcoA2238RdD92Jkss1KfRmzX2fZyREPspVdStzZX9");

    const to = new PublicKey("KjkadiKKYic9Qs53qXScUJDSM6KoG9BnBG4s8iNkP6f");

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
    tx.recentBlockhash = (await connection.getLatestBlockhash())[0];

    const txHash = await connection.sendTransaction(tx, [sender]);

    console.log("tx hash: ", txHash);

})();