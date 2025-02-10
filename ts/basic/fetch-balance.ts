import {
    Commitment,
    Connection,
    LAMPORTS_PER_SOL,
    PublicKey,
} from '@solana/web3.js';


(async () => {
    const commitment: Commitment = 'processed';

    const connection = new Connection('https://api.testnet.v1.sonic.game', {
        commitment,
        wsEndpoint: 'wss://api.testnet.v1.sonic.game'
    });

    const balance = await connection.getBalance(new PublicKey("KjkadiKKYic9Qs53qXScUJDSM6KoG9BnBG4s8iNkP6f"));

    console.log("balance: ", balance / LAMPORTS_PER_SOL)

})();