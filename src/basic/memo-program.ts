import {
    Commitment,
    Connection, Keypair,
    LAMPORTS_PER_SOL,
    PublicKey, SystemProgram,
    Transaction,
    TransactionInstruction,
} from '@solana/web3.js';

import * as base58 from 'bs58';


(async () => {
    const commitment: Commitment = 'processed';

    const connection = new Connection('https://api.testnet.v1.sonic.game', {
        commitment,
        wsEndpoint: 'wss://api.testnet.v1.sonic.game'
    });

    const sender: Keypair = Keypair.fromSecretKey(base58.decode("4DcqYGxBW1WHHwUi7mRnN3uxPbG6oiXRTJ5Fq3nNg74DUs56Ht5JbKmnce7XAcPEt2si5Gyvd2GNLxCHrw1ckXFs"));

    const tx = new Transaction();

    tx.add(
        SystemProgram.transfer({
            fromPubkey: sender.publicKey,
            toPubkey: new PublicKey("KjkadiKKYic9Qs53qXScUJDSM6KoG9BnBG4s8iNkP6f"),
            lamports: 0.01 * LAMPORTS_PER_SOL
        })
    );

    // Memo instruction
    tx.add(
        new TransactionInstruction({
            keys: [
                { pubkey: sender.publicKey, isSigner: true, isWritable: true },
            ],
            data: Buffer.from("Memo message to send in this transaction", "utf-8"),
            programId: new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"),
        }),
    );

    tx.feePayer = sender.publicKey;
    tx.recentBlockhash = (await connection.getLatestBlockhash())[0];

    const txHash = await connection.sendTransaction(tx,  [sender]);

    console.log("tx hash: ", txHash);

})();