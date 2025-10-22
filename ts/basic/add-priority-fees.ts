import {
    Commitment,
    Connection, Keypair,
    LAMPORTS_PER_SOL,
    PublicKey, SystemProgram,
    Transaction,
    ComputeBudgetProgram,
    VersionedTransaction,
    TransactionMessage,
} from '@solana/web3.js';

import base58 from 'bs58';
import * as dotenv from 'dotenv';

dotenv.config();

(async () => {
    const commitment: Commitment = 'processed';

    const connection = new Connection(process.env.RPC_URL, {
        commitment,
        wsEndpoint: process.env.WS_ENDPOINT
    });

    const privateKey = process.env.SONIC_PRIVATE_KEY;
    const recipientAddress = process.env.PUBLIC_KEY;

    const sender: Keypair = Keypair.fromSecretKey(base58.decode(privateKey));

    const tx = new Transaction();

    tx.add(ComputeBudgetProgram.setComputeUnitPrice({
        microLamports: 20000,
    }));

    tx.add(
        SystemProgram.transfer({
            fromPubkey: sender.publicKey,
            toPubkey: new PublicKey(recipientAddress),
            lamports: 0.01 * LAMPORTS_PER_SOL
        })
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

})();