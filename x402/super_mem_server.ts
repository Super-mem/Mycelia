// server.js
require("dotenv").config(); // Ensure .env is loaded at the very top
const express = require("express");
const { paymentMiddleware } = require("x402-express");
const { ethers } = require("ethers");
const abi = require("./contract.json");

const CONTRACT_ABI = abi;
const CONTRACT_ADDRESS = "0x81638b5a984b1f8731fa0faf50cec04e66898bf9";

const facilitatorUrl = "https://facilitator.x402.rs";
// const payTo = process.env.ADDRESS;
// Read super_mem private key, public key, and address from environment variables
const superMemPrivKey = process.env.SUPER_MEM_PRIVKEY;
// const superMemPubKey = process.env.SUPER_MEM_PUBKEY;
const superMemAddress = process.env.SUPER_MEM_ADDRESS;
const FLOW_TESTNET_CONFIG = {
  chainId: 545, // Flow testnet chain ID
  name: "Flow Testnet",
  rpcUrl: "https://testnet.evm.nodes.onflow.org", // Flow EVM testnet RPC
  blockExplorer: "https://evm-testnet.flowscan.org",
};

// Print env keys for troubleshooting
function printEnvDebug() {
  console.log("SUPER_MEM_PRIVKEY:", !!process.env.SUPER_MEM_PRIVKEY);
  console.log("SUPER_MEM_ADDRESS:", !!process.env.SUPER_MEM_ADDRESS);
}
printEnvDebug();

if (!superMemPrivKey) {
  console.error("Missing SUPER_MEM_PRIVKEY environment variable");
  process.exit(1);
}
if (!superMemAddress) {
  console.error("Missing SUPER_MEM_ADDRESS environment variable");
  process.exit(1);
}
if (!facilitatorUrl) {
  console.error("Missing required environment variables");
  process.exit(1);
}

const app = express();

app.use(express.json());

// Pricing logic based on score or id
const getAmount = (score) => {
  // You can adjust this logic as needed
  if (!score) return 0.001;
  const s = parseFloat(score);
  if (isNaN(s)) return 0.001;
  if (s >= 0.9) return 0.01;
  if (s >= 0.75) return 0.005;
  if (s >= 0.5) return 0.002;
  return 0.001;
};

const createDynamicPaymentMiddleware = (endpoint) => {
  return (req, res, next) => {
    // Accept score from route params instead of query/body
    // We'll expect endpoints like /agent1/:user_id/:score/:query_id
    // But for backward compatibility, also check query string
    console.log(req.params)
    let score;
    if (req.params && req.params.score != undefined) {
      score = req.params.score;
    } else if (req.query && req.query.score != undefined) {
      score = req.query.score;
    }

    if (!score) {
      score = 0.5
    }

    const amount = getAmount(score);

    const dynamicPaymentMiddleware = paymentMiddleware(
      superMemAddress,
      {
        [`GET ${endpoint}`]: {
          price: `$${amount}`,
          network: "base-sepolia",
        },
      },
      {
        url: facilitatorUrl,
      }
    );

    // Apply the payment middleware
    dynamicPaymentMiddleware(req, res, next);
  };
};

// Apply dynamic payment middleware to each endpoint
// Accept both /agent1?user_id=...&score=...&query_id=... and /agent1/:user_id/:score/:query_id
app.use(
  "/agent1/:user_id/:score/:query_id",
  createDynamicPaymentMiddleware("/agent1/:user_id/:score/:query_id")
);
app.use(
  "/agent2/:user_id/:score/:query_id",
  createDynamicPaymentMiddleware("/agent2/:user_id/:score/:query_id")
);
app.use("/agent1", createDynamicPaymentMiddleware("/agent1"));
app.use("/agent2", createDynamicPaymentMiddleware("/agent2"));

// GET endpoint using params
app.get("/agent1/:user_id/:score/:query_id", async (req, res) => {
  const { user_id, score, query_id } = req.params;
    await(async () => {
        // Convert query_id to integer safely
        const queryIdInt = parseInt(query_id, 10);
        if (!isNaN(queryIdInt) && user_id) {
        try {
            await markQueryAsPaid("agent1", queryIdInt, user_id);
        } catch (err) {
            console.error("Error marking query as paid:", err);
        }
        }
    })();
  res.json({
    success: "200",
    message: `Payment successful by agent1`,
    user_id,
    score,
    query_id,
  });
});

app.get("/agent2/:user_id/:score/:query_id", async (req, res) => {
  const { user_id, score, query_id } = req.params;
  await(async () => {
    // Convert query_id to integer safely
    const queryIdInt = parseInt(query_id, 10);
    if (!isNaN(queryIdInt) && user_id) {
      try {
        await markQueryAsPaid("agent2", queryIdInt, user_id);
      } catch (err) {
        console.error("Error marking query as paid:", err);
      }
    }
  })();
  res.json({
    success: "200",
    message: `Payment successful by agent2`,
    user_id,
    score,
    query_id,
  });
});

// Also support old query string style for backward compatibility
app.get("/agent1", async (req, res) => {
  const { user_id, score, query_id } = req.query;
  await (async () => {
    // Convert query_id to integer safely
    const queryIdInt = parseInt(query_id, 10);
    if (!isNaN(queryIdInt) && user_id) {
      try {
        await markQueryAsPaid(queryIdInt, user_id);
      } catch (err) {
        console.error("Error marking query as paid:", err);
      }
    }
  })();
  res.json({
    success: "200",
    message: `Payment successful by agent1`,
    user_id,
    score,
    query_id,
  });
});

app.get("/agent2", async (req, res) => {
  const { user_id, score, query_id } = req.query;
  await (async () => {
    // Convert query_id to integer safely
    const queryIdInt = parseInt(query_id, 10);
    if (!isNaN(queryIdInt) && user_id) {
      try {
        await markQueryAsPaid(queryIdInt, user_id);
      } catch (err) {
        console.error("Error marking query as paid:", err);
      }
    }
  })();
  res.json({
    success: "200",
    message: `Payment successful by agent2`,
    user_id,
    score,
    query_id,
  });
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "Server is running",
    timestamp: new Date().toISOString(),
    env: {
      SUPER_MEM_PRIVKEY: !!process.env.SUPER_MEM_PRIVKEY,
      SUPER_MEM_ADDRESS: !!process.env.SUPER_MEM_ADDRESS,
      FACILITATOR_URL: process.env.FACILITATOR_URL,
      FLOW_TESTNET_RPC_URL: process.env.FLOW_TESTNET_RPC_URL,
    },
  });
});

const PORT = process.env.PORT || 4021;

app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`);
  console.log("Available endpoints:");
  console.log(
    `  GET http://localhost:${PORT}/agent1/:user_id/:score/:query_id`
  );
  console.log(
    `  GET http://localhost:${PORT}/agent2/:user_id/:score/:query_id`
  );
  console.log(
    `  GET http://localhost:${PORT}/agent1?user_id=...&score=...&query_id=...`
  );
  console.log(
    `  GET http://localhost:${PORT}/agent2?user_id=...&score=...&query_id=...`
  );
  console.log(`  GET  http://localhost:${PORT}/health`);
  if (!superMemPrivKey) {
    console.warn("SUPER_MEM_PRIVKEY is missing. Please check your .env file.");
  }
  if (!superMemAddress) {
    console.warn("SUPER_MEM_ADDRESS is missing. Please check your .env file.");
  }
});

async function markQueryAsPaid(
    model, 
  queryId,
  user_id
) {
  try {
    if (!superMemPrivKey) {
      throw new Error("Private key not found");
    }
    console.log("asdasda")
    const provider = new ethers.JsonRpcProvider(FLOW_TESTNET_CONFIG.rpcUrl);
    const signer = new ethers.Wallet(superMemPrivKey, provider);
    const contract = new ethers.Contract(
      CONTRACT_ADDRESS,
      CONTRACT_ABI,
      signer
    );
    console.log("paying for queryid and user_id", queryId, user_id)
    const tx = await contract.unblockModel(model);
    console.log("Payment transaction sent:", tx.hash);

    const receipt = await tx.wait();
    console.log("Payment confirmed in block:", receipt.blockNumber);

    return { success: true };
  } catch (error) {
    console.error("Error marking query as paid:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
