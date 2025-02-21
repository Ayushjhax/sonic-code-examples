const { Connection, TransactionInstruction, Keypair, PublicKey, Transaction, sendAndConfirmTransaction } = require('@solana/web3.js');
const bs58 = require('bs58');
const BufferLayout = require('@solana/buffer-layout');
const { Buffer } = require('buffer');
const BN = require('bn.js');

let connection = new Connection("https://api.testnet.v1.sonic.game/", "confirmed")

// My Wallet: EyYFxQ2FRcSkR8rdvefEDNy69KWHi2xTzbuVKxuBVueS
// Can be replaced with your own wallet private key
const feePayer = Keypair.fromSecretKey(
  bs58.decode(
    "xxxxxxxx" // private key for sonic testnet wallet
  )
);

const sonic_program_id = new PublicKey('SonicAccountMigrater11111111111111111111111');
const sonic_migrate_account = new PublicKey('SonicMigratedAccounts1111111111111111111112');
// after this script executed you can check the account in https://explorer.sonic.game/ for testnet
const account_to_migrate = new PublicKey("xxxxx"); // the account exists in solana and  need to migrate from solana to sonic

//build instruction data
/**
 * 
 * @param {*} node_id get "pubkey" from https://api.hypergrid.dev/hypergrid-ssn/hypergridssn/hypergrid_node
 * @param {*} refresh true/false, if true it forces the account to refresh its data from the source node.
 * @returns 
 */



function print_buffer_data(buffer) {
  let u8Array = new Uint8Array(buffer)
  console.log("[")
  for (let i = 0; i < u8Array.length; i += 4) {
    console.log(u8Array[i], u8Array[i + 1], u8Array[i + 2], u8Array[i + 3]);
  }
  console.log("]")
}
function migrateSourceAccounts(node_id, address) {

  const dataLayout = BufferLayout.struct([
    BufferLayout.u32('instruction'),
    new BufferLayout.Blob(32, 'node_id'),
    new BufferLayout.Blob(8, 'len'),
    BufferLayout.seq(new BufferLayout.Blob(32), address.length, "address"),
  ]);


  console.log(dataLayout.span)
  const data = Buffer.alloc(dataLayout.span);
  dataLayout.encode({
    instruction: 2,
    node_id: node_id.toBuffer(),
    len: new BN(address.length).toBuffer('le', 8),
    address: address.map(e => e.toBuffer()),
  }, data);

  // console.log(data);
  print_buffer_data(data)
  return data;
}

async function migrate_accounts() {
  const transaction = new Transaction()

  // solana testnet node pubkey
  let node_id = new PublicKey('4uhcVJyU9pJkvQyS88uRDiswHXSCkY3zQawwpjk2NsNY');

  const instruction = new TransactionInstruction({
    keys: [
      { pubkey: account_to_migrate, isSigner: false, isWritable: false },
      { pubkey: sonic_migrate_account, isSigner: false, isWritable: true }
    ],
    programId: sonic_program_id,
    data: migrateSourceAccounts(node_id, [account_to_migrate]), //instruction data
  })

  transaction.add(instruction)

  const transactionSignature = await sendAndConfirmTransaction(
    connection, transaction, [feePayer], { skipPreflight: false });
  console.log('tx signature', transactionSignature);

  let tx = await connection.getTransaction(transactionSignature);
  console.log('Transaction', tx);
}


migrate_accounts().then(() => {
  console.log("Done")
}).catch((err) => {
  console.error(err)
});
