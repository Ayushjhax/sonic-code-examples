import {
    Commitment,
    Connection,
    PublicKey,
} from '@solana/web3.js';
import {ASSOCIATED_TOKEN_PROGRAM_ID, getAssociatedTokenAddress, TOKEN_PROGRAM_ID} from "@solana/spl-token";

(async () => {
    const commitment: Commitment = 'processed';

    const connection = new Connection('https://api.testnet.v1.sonic.game', {
        commitment,
        wsEndpoint: 'wss://api.testnet.v1.sonic.game'
    });

    const tokenMintAccount = new PublicKey("7rh23QToLTBmYxR5jDiRbUtqcGey4xjDeU9JmtX6QChe");

    const owner = new PublicKey("KjkadiKKYic9Qs53qXScUJDSM6KoG9BnBG4s8iNkP6f");

    const ownerTokenAccount = await getAssociatedTokenAddress(tokenMintAccount, owner, true, TOKEN_PROGRAM_ID, ASSOCIATED_TOKEN_PROGRAM_ID);

    const tokenBalance = await connection.getTokenAccountBalance(ownerTokenAccount);

    console.log("token balance: ", tokenBalance.value.toString());

})();