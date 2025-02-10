import {
    Commitment,
    Connection, Keypair,
} from '@solana/web3.js';

import {
    mplTokenMetadata,
    createNft,
} from '@metaplex-foundation/mpl-token-metadata';

import {createUmi} from '@metaplex-foundation/umi-bundle-defaults';

import {
    createSignerFromKeypair,
    keypairIdentity,
    percentAmount
} from '@metaplex-foundation/umi'

import * as base58 from 'bs58';


(async () => {
    const commitment: Commitment = 'processed';

    const connection = new Connection('https://api.testnet.v1.sonic.game', {
        commitment,
        wsEndpoint: 'wss://api.testnet.v1.sonic.game'
    });

    let umi = createUmi(connection.rpcEndpoint)
        .use(mplTokenMetadata());

    let senderUmiKeypair = umi.eddsa.createKeypairFromSecretKey(base58.decode("4DcqYGxBW1WHHwUi7mRnN3uxPbG6oiXRTJ5Fq3nNg74DUs56Ht5JbKmnce7XAcPEt2si5Gyvd2GNLxCHrw1ckXFs"))
    let senderSigner = createSignerFromKeypair(umi, senderUmiKeypair);

    umi.use(keypairIdentity(senderUmiKeypair));


    let mintUmiKeypair = umi.eddsa.createKeypairFromSecretKey(Keypair.generate().secretKey)
    let mintSigner = createSignerFromKeypair(umi, mintUmiKeypair);


    let tx;
    await createNft(umi, {
        mint: mintSigner,
        name: 'My NFT',
        symbol: "MNFT",
        authority: senderSigner,
        updateAuthority: senderSigner,
        payer: senderSigner,
        uri: "https://m6zsbnhyclkmaqkw62dyxpxo3qxfgb3niok3dv3sczi7epzazrja.arweave.net/Z7MgtPgS1MBBVvaHi77u3C5TB21DlbHXchZR8j8gzFI",
        sellerFeeBasisPoints: percentAmount(5),
        isCollection: false,
        isMutable: true,
        creators: [{address: senderSigner.publicKey, verified: false, share: 100}]
    }).setFeePayer(senderSigner)
        .setLatestBlockhash(umi).then(s => tx = s.build(umi));

    let signedTX = await senderSigner.signTransaction(tx);

    signedTX = await mintSigner.signTransaction(signedTX);

    let txHash = await umi.rpc.sendTransaction(signedTX);
    console.log("Tx Hash: ", base58.encode(txHash));

})();