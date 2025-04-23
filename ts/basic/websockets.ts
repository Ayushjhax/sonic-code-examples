import WebSocket from "ws";

const WEBSOCKET_URL = "wss://rpc.mainnet-alpha.sonic.game";
const methodName = "accountSubscribe"; // method you want to call
const accountAddress = "WALLET_ADDRESS";

const ws = new WebSocket(WEBSOCKET_URL);

ws.on("open", () => {
  console.log("Connected to Sonic Mainnet WebSocket");

  // Call a method after connection is established
  const requestPayload = {
    jsonrpc: "2.0",
    method: methodName,
    params: [
      accountAddress,
      {
        encoding: "jsonParsed",
        commitment: "confirmed",
      },
    ], // Add your parameters here if needed
    id: 1,
  };

  ws.send(JSON.stringify(requestPayload));
});

ws.on("message", (data) => {
  console.log("Received:", data);
});

ws.on("error", (error) => {
  console.error("WebSocket error:", error);
});

ws.on("close", () => {
  console.log("WebSocket connection closed");
});
