import {
    Commitment,
    Connection,
    PublicKey,
} from '@solana/web3.js';
import {ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress, TOKEN_PROGRAM_ID} from "@solana/spl-token";
import * as dotenv from 'dotenv';

dotenv.config();

(async () => {
    const commitment: Commitment = 'processed';

    const connection = new Connection(process.env.RPC_URL, {
        commitment,
        wsEndpoint: process.env.WS_ENDPOINT
    });

    const tokenMintAccount = new PublicKey("4tzrHCWVs6Y8fzj4DLwctHAGNrh9U1vgPzq5KLFo81dx");

    const owner = new PublicKey(process.env.PUBLIC_KEY);

    const ownerTokenAccount = await getAssociatedTokenAddress(tokenMintAccount, owner, true, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);

    const tokenBalance = await connection.getTokenAccountBalance(ownerTokenAccount);

    console.log("Token balance:", tokenBalance.value.uiAmount, "tokens");
    console.log("Token balance (raw):", tokenBalance.value.amount);
    console.log("Decimals:", tokenBalance.value.decimals);

})();