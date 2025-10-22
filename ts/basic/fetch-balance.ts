import {
    Commitment,
    Connection,
    LAMPORTS_PER_SOL,
    PublicKey,
} from '@solana/web3.js';
import * as dotenv from 'dotenv';

dotenv.config();

(async () => {
    try {
        const rpcUrl = process.env.RPC_URL;
        const wsEndpoint = process.env.WS_ENDPOINT;
        const commitment: Commitment = 'processed';
        const publicKeyString = process.env.PUBLIC_KEY;

        const connection = new Connection(rpcUrl, {
            commitment,
            wsEndpoint
        });

        const balance = await connection.getBalance(new PublicKey(publicKeyString));
        console.log("Balance:", balance / LAMPORTS_PER_SOL, "SOL");

    } catch (error) {
        console.error("Error fetching balance:", error instanceof Error ? error.message : 'Unknown error');
        process.exit(1);
    }
})();