import {
    Commitment,
    Connection, Keypair,
    LAMPORTS_PER_SOL,
    PublicKey, SystemProgram,
    Transaction,
    TransactionInstruction,
    VersionedTransaction,
    TransactionMessage,
} from '@solana/web3.js';

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
        const memoMessage ="Memo message to send in this transaction";

        const connection = new Connection(rpcUrl, {
            commitment,
            wsEndpoint
        });

        const sender: Keypair = Keypair.fromSecretKey(base58.decode(privateKey));

        const tx = new Transaction();

        tx.add(
            SystemProgram.transfer({
                fromPubkey: sender.publicKey,
                toPubkey: new PublicKey(recipientAddress),
                lamports: 0.01 * LAMPORTS_PER_SOL
            })
        );

        // Memo instruction
        tx.add(
            new TransactionInstruction({
                keys: [
                    { pubkey: sender.publicKey, isSigner: true, isWritable: true },
                ],
                data: Buffer.from(memoMessage, "utf-8"),
                programId: new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr"),
            }),
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
        console.error("error: ", error);
    }
})();