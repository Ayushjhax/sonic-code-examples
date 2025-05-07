from solana.rpc.api import Client
from solders.keypair import Keypair
from solders.hash import Hash
from solders.message import MessageV0
from solders.system_program import TransferParams, transfer
from solders.transaction import VersionedTransaction

## Documentation: 
## Solders: https://kevinheavey.github.io/solders/index.html
## Solana: https://michaelhly.com/solana-py/

http_client = Client("https://api.testnet.sonic.game/")

try:
    secret_key = [
    174, 47, 154, 16, 202, 193, 206, 113,
    199, 190, 53, 133, 169, 175, 31, 56,
    222, 53, 138, 189, 224, 216, 117, 173,
    10, 149, 53, 45, 73, 251, 237, 246,
    15, 185, 186, 82, 177, 240, 148, 69,
    241, 227, 167, 80, 141, 89, 240, 121,
    121, 35, 172, 247, 68, 251, 226, 218,
    48, 63, 176, 109, 168, 89, 238, 135,
]
    sender = Keypair.from_bytes(secret_key)
    print("sender", sender.pubkey())
    balance = http_client.get_balance(sender.pubkey())
    print("sender balance", balance.value)
    receiver = Keypair()
    print("receiver", receiver.pubkey())
    ix = transfer(
        TransferParams(
            from_pubkey=sender.pubkey(), to_pubkey=receiver.pubkey(), lamports=1_000_000
        )
    )
    blockhash = http_client.get_latest_blockhash().value.blockhash
    print("blockhash", blockhash)
    msg = MessageV0.try_compile(
        payer=sender.pubkey(),
        instructions=[ix],
        address_lookup_table_accounts=[],
        recent_blockhash=blockhash,
    )
    tx = VersionedTransaction(msg, [sender])
    tx_sig = http_client.send_transaction(tx)
    print("tx_sig", tx_sig)
except Exception as e:
    print(e)

