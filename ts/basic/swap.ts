// we will be using Sega.so to swap tokens
// docs: https://docs.sega.so/

import {
  Connection,
  Keypair,
  PublicKey,
  VersionedTransaction,
} from "@solana/web3.js";
import bs58 from "bs58";

const privateKey = "YOUR_PRIV_KEY";

const tokenAddresses = {
  sonic: "mrujEYaN1oyQXDHeYNxBYpxWKVkQ2XsGxfznpifu4aL",
  sol: "So11111111111111111111111111111111111111112",
};

interface TokenPrices {
  id: string;
  success: boolean;
  data: {
    [tokenAddress: string]: string; // Maps token addresses to price strings
  };
}

interface RouteStep {
  poolId: string;
  inputMint: string;
  outputMint: string;
  feeMint: string;
  feeRate: number;
  feeAmount: string;
  remainingAccounts: any[]; // This appears to be an empty array in the sample
}

interface SwapQuote {
  id: string;
  success: boolean;
  data: {
    swapType: string;
    inputMint: string;
    inputAmount: string;
    outputMint: string;
    outputAmount: string;
    otherAmountThreshold: string;
    slippageBps: number;
    priceImpactPct: number;
    referrerAmount: string;
    routePlan: RouteStep[];
  };
}

interface SwapRequestParams {
  wallet: string;
  computeUnitPriceMicroLamports: string;
  swapResponse: SwapQuote;
  txVersion: string;
  wrapSol: boolean;
  unwrapSol: boolean;
  outputAccount: string;
}

interface TransactionData {
  transaction: string;
}

interface SwapTransactionResponse {
  id: string;
  success: boolean;
  data: TransactionData[];
}

/**
 * Fetches the price of tokens from the Sega API
 * @param tokenAddresses Array of token mint addresses
 * @returns Price data for the specified tokens
 */
async function fetchPrice(tokenAddresses: string[]): Promise<TokenPrices> {
  try {
    const response = await fetch(
      `https://api.sega.so/api/mint/price?mints=${tokenAddresses.join(",")}`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = (await response.json()) as TokenPrices;

    if (!data.success) {
      throw new Error("Failed to fetch price data");
    }

    return data;
  } catch (error) {
    console.error("Error fetching token prices:", error);
    throw error;
  }
}

async function fetchAllTokensForOwner(owner: PublicKey) {
  const connection = new Connection("https://api.mainnet-alpha.sonic.game/");
  const tokenAccounts = await connection.getTokenAccountsByOwner(
    owner,
    { programId: new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb") },
    "confirmed"
  );
  console.log(tokenAccounts);
  return tokenAccounts;
}

async function fetchQuote(
  inputMint: string,
  outputMint: string,
  amount: number
): Promise<SwapQuote> {
  try {
    const response = await fetch(
      `https://api.sega.so/swap/compute/swap-base-in?inputMint=${inputMint}&outputMint=${outputMint}&amount=${amount}&slippageBps=50&txVersion=V0`
    );

    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }

    const data = (await response.json()) as SwapQuote;

    if (!data.success) {
      throw new Error(`Quote failed: ${data.id}`);
    }

    return data;
  } catch (error) {
    console.error("Error fetching quote:", error);
    throw error;
  }
}

async function fetchSwapTxn(
  user: Keypair | string,
  inputMint: string,
  outputMint: string,
  amount: number
): Promise<SwapTransactionResponse> {
  try {
    const quote = await fetchQuote(inputMint, outputMint, amount);

    // Get user public key regardless of input type
    const userPublicKey =
      typeof user === "string" ? new PublicKey(user) : user.publicKey;

    const requestParams: SwapRequestParams = {
      wallet: userPublicKey.toBase58(),
      computeUnitPriceMicroLamports: "10500",
      swapResponse: quote,
      txVersion: "V0",
      wrapSol: true,
      unwrapSol: false,
      outputAccount: undefined,
    };

    const txn = await fetch(
      "https://api.sega.so/swap/transaction/swap-base-in",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          accept: "application/json, text/plain, */*",
        },
        body: JSON.stringify(requestParams),
      }
    );

    if (!txn.ok) {
      throw new Error(`HTTP error! Status: ${txn.status}`);
    }

    const response = (await txn.json()) as SwapTransactionResponse;
    console.log("Swap transaction response:", response);

    return response;
  } catch (error) {
    console.error("Error in swap transaction:", error);
    throw error;
  }
}

/**
 * Processes a swap transaction response and returns a VersionedTransaction object
 * @param response The swap transaction response from the API
 * @returns A VersionedTransaction object that can be signed and sent
 */
function processSwapTransaction(
  response: SwapTransactionResponse
): VersionedTransaction {
  if (!response.success || !response.data || response.data.length === 0) {
    throw new Error("Invalid transaction response");
  }

  const transactionBase64 = response.data[0].transaction;
  // Convert to Uint8Array explicitly
  const transactionBuffer = Uint8Array.from(
    Buffer.from(transactionBase64, "base64")
  );

  try {
    const versionedTransaction =
      VersionedTransaction.deserialize(transactionBuffer);
    return versionedTransaction;
  } catch (error) {
    console.error("Error deserializing transaction:", error);
    throw new Error(`Failed to deserialize transaction: ${error.message}`);
  }
}

/**
 * Calculates estimated output amount based on token prices
 * @param inputMint Input token mint address
 * @param outputMint Output token mint address
 * @param inputAmount Amount of input tokens (in base units)
 * @returns Estimated output amount (in base units)
 */
async function calculateSwapEstimate(
  inputMint: string,
  outputMint: string,
  inputAmount: number
): Promise<number> {
  try {
    // Fetch prices for both tokens
    const priceData = await fetchPrice([inputMint, outputMint]);

    if (!priceData.data[inputMint] || !priceData.data[outputMint]) {
      throw new Error("Price data missing for one or both tokens");
    }

    // Get prices in USD
    const inputPriceUSD = parseFloat(priceData.data[inputMint]);
    const outputPriceUSD = parseFloat(priceData.data[outputMint]);

    // Calculate total value in USD
    const inputValueUSD = (inputAmount / 1e9) * inputPriceUSD; // Assuming 9 decimals for SOL/SONIC

    // Calculate output amount based on USD value
    const estimatedOutputAmount = (inputValueUSD / outputPriceUSD) * 1e9;

    // Apply a slippage adjustment (this is just a rough estimate)
    const estimatedOutputWithSlippage = estimatedOutputAmount * 0.99; // 1% slippage

    return Math.floor(estimatedOutputWithSlippage);
  } catch (error) {
    console.error("Error calculating swap estimate:", error);
    throw error;
  }
}

/**
 * Signs and sends a versioned transaction
 * This function is provided as a reference but is commented out in the main execution
 *
 * @param transaction The versioned transaction to sign and send
 * @param signer The signer keypair
 * @param connection The Solana connection
 * @returns The transaction signature
 */
async function signAndSendTransaction(
  transaction: VersionedTransaction,
  signer: Keypair,
  connection: Connection
): Promise<string> {
  // Add signer to the transaction
  transaction.sign([signer]);

  // Send the transaction
  const signature = await connection.sendTransaction(transaction);
  console.log("Transaction sent with signature:", signature);

  // Wait for confirmation
  const confirmation = await connection.confirmTransaction(signature);
  console.log("Transaction confirmed:", confirmation);

  return signature;
}

// Main execution
(async () => {
  try {
    const keypair = Keypair.fromSecretKey(bs58.decode(privateKey));
    console.log("Starting swap execution...");
    console.log(`Input token (SOL): ${tokenAddresses.sol}`);
    console.log(`Output token (SONIC): ${tokenAddresses.sonic}`);

    const inputAmount = 100_000; // Amount in lamports (SOL has 9 decimals)
    console.log(
      `Input amount: ${inputAmount} lamports (${inputAmount / 1e9} SOL)`
    );

    // Fetch price information
    console.log("Fetching price information...");
    const priceData = await fetchPrice([
      tokenAddresses.sol,
      tokenAddresses.sonic,
    ]);
    console.log(`SOL Price: $${priceData.data[tokenAddresses.sol]}`);
    console.log(`SONIC Price: $${priceData.data[tokenAddresses.sonic]}`);

    // Get estimated amount
    console.log("Calculating swap estimate...");
    const estimatedOutput = await calculateSwapEstimate(
      tokenAddresses.sol,
      tokenAddresses.sonic,
      inputAmount
    );
    console.log(
      `Estimated output: ${estimatedOutput} (${estimatedOutput / 1e9} SONIC)`
    );

    const userPublicKey = keypair.publicKey.toBase58();
    console.log(`Using public key: ${userPublicKey}`);

    // Get the swap quote first
    console.log("Fetching swap quote...");
    const quote = await fetchQuote(
      tokenAddresses.sol,
      tokenAddresses.sonic,
      inputAmount
    );

    console.log(`Quote received: ${quote.id}`);
    console.log(
      `Expected output amount: ${quote.data.outputAmount} (${
        Number(quote.data.outputAmount) / 1e9
      } SONIC)`
    );

    console.log("Creating swap transaction...");
    const swapResponse = await fetchSwapTxn(
      userPublicKey,
      tokenAddresses.sol,
      tokenAddresses.sonic,
      inputAmount
    );

    console.log("Processing transaction...");
    const transaction = processSwapTransaction(swapResponse);
    console.log(
      "Transaction created successfully:",
      transaction.message.compiledInstructions.length,
      "instructions"
    );

    console.log("Transaction version:", transaction.version);
    console.log("Message header:", transaction.message.header);

    const actualOutput = Number(quote.data.outputAmount);
    const estimationAccuracy =
      actualOutput > 0
        ? Math.abs(((estimatedOutput - actualOutput) / actualOutput) * 100)
        : 0;
    console.log(`Actual output from quote: ${actualOutput}`);
    console.log(`Estimation accuracy: ${estimationAccuracy.toFixed(2)}% off`);

    const connection = new Connection("https://api.mainnet-alpha.sonic.game/");

    // Sign and send the transaction
    const signature = await signAndSendTransaction(
      transaction,
      keypair,
      connection
    );
    console.log(
      "Transaction completed with signature:",
      `https://explorer.sonic.game/tx/${signature}`
    );

    console.log("Swap execution completed");
  } catch (error) {
    console.error("Failed to execute swap:", error);
    if (error.stack) {
      console.error("Error stack trace:", error.stack);
    }
  }
})();
