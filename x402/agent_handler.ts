// server.js
require("dotenv").config(); // Ensure .env is loaded at the very top
const expressHandler = require("express");
const corsHandler = require("cors");
const { ethers } = require("ethers");
const abi = require("./contract.json");
const { wrapFetchWithPayment, decodeXPaymentResponse } = require("x402-fetch");

const CONTRACT_ABI = abi;
const CONTRACT_ADDRESS = "0x81638b5a984b1f8731fa0faf50cec04e66898bf9";
const RPC_URL = "https://testnet.evm.nodes.onflow.org";
const PORT_HANDLER = process.env.PORT || 3000;
const BASE_SEPOLIA_CONFIG = {
  rpcUrl: "https://sepolia.base.org",
  chainId: 84532,
  name: "Base Sepolia",
  symbol: "ETH",
  blockExplorer: "https://sepolia-explorer.base.org",
};

// Debug: Print env keys for troubleshooting
function printEnvDebug() {
  console.log("MODEL1PRIVKEY:", process.env.MODEL1PRIVKEY);
  console.log("MODEL2PRIVKEY:", process.env.MODEL2PRIVKEY);
}
printEnvDebug();

const privKey1 = process.env.MODEL1PRIVKEY;
const privKey2 = process.env.MODEL2PRIVKEY;

if (!privKey1) {
  console.warn("Warning: MODEL1PRIVKEY is not set in .env");
}
if (!privKey2) {
  console.warn("Warning: MODEL2PRIVKEY is not set in .env");
}

// --- App State ---
const appHandler = expressHandler();
appHandler.use(corsHandler());
appHandler.use(expressHandler.json());

const provider2 = new ethers.JsonRpcProvider(RPC_URL);
const contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, provider2);

const modelStates = new Map();
const requestQueue = new Map();

// --- Helpers ---
async function getModelStatus(modelName) {
  try {
    const [exists, isBlocked, pendingPayments] = await contract.getModelInfo(
      modelName
    );

    return {
      exists,
      isBlocked,
      pendingPayments: pendingPayments.toString(),
    };
  } catch (err) {
    console.error("Error fetching model status:", err);
    return null;
  }
}

function unblock_model(model, queryId, score, user) {
  const provider = new ethers.JsonRpcProvider(BASE_SEPOLIA_CONFIG.rpcUrl);
  if (provider) {
    console.log("ASdas");
  }
  var signer1, signer2;

  let fetchWithPayment;
  // Print which keys are being used for debugging
  if (model == "agent1") {
    if (!privKey1) {
      console.error("No MODEL1PRIVKEY found in environment for agent1");
      return;
    }
    signer1 = new ethers.Wallet(privKey1, provider);
    fetchWithPayment = wrapFetchWithPayment(fetch, signer1);
  } else if (model == "agent2") {
    if (!privKey2) {
      console.error("No MODEL2PRIVKEY found in environment for agent2");
      return;
    }
    signer2 = new ethers.Wallet(privKey2, provider);
    fetchWithPayment = wrapFetchWithPayment(fetch, signer2);
  } else {
    console.error("No signer for model:", model);
    return;
  }

  fetchWithPayment(
    `http://localhost:4021/${model}/${encodeURIComponent(
      user
    )}/${encodeURIComponent(score)}/${encodeURIComponent(queryId)}`,
    { method: "GET" }
  )
    .then(async (response) => {
      const body = await response.json();
      console.log(body);

      const paymentResponse = decodeXPaymentResponse(
        response.headers.get("x-payment-response")
      );
      console.log(paymentResponse);
    })
    .catch((error) => {
      console.error(error?.response?.data?.error || error?.message || error);
    });
}

let lastBlock = 0;

async function pollEvents() {
  try {
    const currentBlock = await provider2.getBlockNumber();

    // First run, just set lastBlock
    if (lastBlock == 0) {
      lastBlock = currentBlock;
      return;
    }

    // ModelBlocked
    const blockedEvents = await contract.queryFilter(
      contract.filters.ModelBlocked(),
      lastBlock + 1,
      currentBlock
    );
    for (const e of blockedEvents) {
      const [model, pendingPayments] = e.args;
      console.log(`Model blocked: ${model}`);
      modelStates.set(model, {
        blocked: true,
        pendingPayments: pendingPayments.toString(),
      });
    }

    // ModelUnblocked
    const unblockedEvents = await contract.queryFilter(
      contract.filters.ModelUnblocked(),
      lastBlock + 1,
      currentBlock
    );
    for (const e of unblockedEvents) {
      const [model] = e.args;
      console.log(`✅ Model unblocked: ${model}`);
      modelStates.set(model, { blocked: false, pendingPayments: "0" });
    }

    // ContextExtracted
    const extractedEvents = await contract.queryFilter(
      contract.filters.ContextExtracted(),
      lastBlock + 1,
      currentBlock
    );
    for (const e of extractedEvents) {
      const [queryId, model, ts, score, user, paid] = e.args;
      console.log(`📝 Query ${queryId} for model ${model} by ${user}`);
      unblock_model(model, queryId, score, user);
    }

    lastBlock = currentBlock;
  } catch (err) {
    console.error("Polling error:", err.message);
  }
}

setInterval(pollEvents, 10_000);

appHandler.get("/health", (req, res) => {
  res.json({
    status: "running",
    connectedModels: Array.from(modelStates.keys()),
    env: {
      MODEL1PRIVKEY: !!process.env.MODEL1PRIVKEY,
      MODEL2PRIVKEY: !!process.env.MODEL2PRIVKEY,
    },
  });
});

appHandler.get("/model/:modelName/status", async (req, res) => {
  const { modelName } = req.params;
  const onChain = await getModelStatus(modelName);
  const local = modelStates.get(modelName) || {};
  res.json({ modelName, onChain, local });
});

appHandler.post("/request/:modelName", (req, res) => {
  const { modelName } = req.params;
  const requestId = `req_${Date.now()}`;
  const request = { id: requestId, ...req.body };

  if (!requestQueue.has(modelName)) requestQueue.set(modelName, []);
  requestQueue.get(modelName).push(request);

  console.log(`📌 Queued request ${requestId} for model ${modelName}`);
  res.json({ success: true, requestId });
});

// --- Start Server ---
appHandler.listen(PORT_HANDLER, () => {
  console.log(`🚀 API server running on http://localhost:${PORT_HANDLER}`);
  if (!privKey1) {
    console.warn("MODEL1PRIVKEY is missing. Please check your .env file.");
  }
  if (!privKey2) {
    console.warn("MODEL2PRIVKEY is missing. Please check your .env file.");
  }
});
