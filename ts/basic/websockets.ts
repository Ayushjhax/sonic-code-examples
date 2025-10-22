import WebSocket from "ws";
import * as dotenv from 'dotenv';

dotenv.config();

(async () => {
  try {
    const websocketUrl = process.env.WS_ENDPOINT;
    const methodName = 'accountSubscribe';
    const accountAddress = process.env.PUBLIC_KEY;
    const encoding = 'jsonParsed';
    const commitment = 'confirmed';

   
    const ws = new WebSocket(websocketUrl);

    ws.on("open", () => {
      console.log("Connected to Sonic WebSocket");

      // Call a method after connection is established
      const requestPayload = {
        jsonrpc: "2.0",
        method: methodName,
        params: [
          accountAddress,
          {
            encoding: encoding,
            commitment: commitment,
          },
        ],
        id: 1,
      };

      console.log("Sending subscription request...");
      ws.send(JSON.stringify(requestPayload));
    });

    ws.on("message", (data) => {
      try {
        const parsed = JSON.parse(data.toString());
        console.log("Received data:");
        console.log(JSON.stringify(parsed, null, 2));
      } catch (error) {
        console.log("Received raw data:", data.toString());
      }
    });

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
    });

    ws.on("close", (code, reason) => {
      console.log(`WebSocket connection closed. Code: ${code}, Reason: ${reason}`);
    });

    // Graceful shutdown
    process.on('SIGINT', () => {
      console.log("\nShutting down WebSocket connection...");
      ws.close();
      process.exit(0);
    });

  } catch (error) {
    console.error("Error:", error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
})();
