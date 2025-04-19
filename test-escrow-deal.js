const OpenAI = require('openai');
require('dotenv').config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Sample deal data with some missing information
const initialDealData = {
  buyer: "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266", // Sample Ethereum address
  seller: "", // Missing seller address
  amount: 25, // ETH amount
  currency: "ETH",
  terms: [
    "Transfer of digital art NFT",
    "Payment in ETH"
  ],
  conditions: [
    "NFT must be original work"
  ],
  releaseConditions: [], // Missing release conditions
  disputeResolution: "", // Missing dispute resolution
  // Additional NFT-specific fields
  nftContract: "0x765df6da33c1ec1f83be42db171d7ee334a46df5",
  tokenId: "1337",
  deliveryDate: "2024-04-30"
};

async function validateAndPromptMissingInfo(dealData) {
  try {
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a smart contract escrow expert. Review the provided deal information and:
1. Identify any missing critical information
2. Suggest specific values for missing fields
3. Format response as JSON with two fields:
   - missingFields: array of field names that are empty or insufficient
   - suggestions: object with suggested values for each missing field`
        },
        {
          role: "user",
          content: JSON.stringify(dealData, null, 2)
        }
      ],
      model: "gpt-4",
      temperature: 0.7,
    });

    console.log("\n=== Missing Information Analysis ===");
    console.log(completion.choices[0]?.message?.content);
    return JSON.parse(completion.choices[0]?.message?.content);
  } catch (error) {
    console.error("Error validating deal data:", error);
    throw error;
  }
}

async function generateSolidityContract(dealData) {
  try {
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a Solidity smart contract developer. Create a secure escrow contract for an NFT sale that:
1. Uses OpenZeppelin contracts where appropriate
2. Implements secure payment handling
3. Includes NFT transfer verification
4. Has dispute resolution mechanisms
5. Uses latest Solidity best practices
6. Includes detailed comments explaining the code
Format the response as a complete, deployable Solidity file.`
        },
        {
          role: "user",
          content: JSON.stringify(dealData, null, 2)
        }
      ],
      model: "gpt-4",
      temperature: 0.7,
    });

    console.log("\n=== Generated Smart Contract ===");
    console.log(completion.choices[0]?.message?.content);
    return completion.choices[0]?.message?.content;
  } catch (error) {
    console.error("Error generating smart contract:", error);
    throw error;
  }
}

async function generateDealSummary(dealData) {
  try {
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a financial analyst. Create a concise summary of the NFT escrow deal that:
1. Highlights key participants and their roles
2. Outlines financial terms
3. Lists important dates and deadlines
4. Summarizes key conditions and requirements
5. Notes any potential risks or special considerations
Format the response in a clear, bullet-point style.`
        },
        {
          role: "user",
          content: JSON.stringify(dealData, null, 2)
        }
      ],
      model: "gpt-4",
      temperature: 0.7,
    });

    console.log("\n=== Deal Summary ===");
    console.log(completion.choices[0]?.message?.content);
    return completion.choices[0]?.message?.content;
  } catch (error) {
    console.error("Error generating deal summary:", error);
    throw error;
  }
}

async function generateDeploymentScript(contractCode, dealData) {
  try {
    const completion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a blockchain developer. Create a deployment script for the provided smart contract that:
1. Uses Hardhat or Truffle framework
2. Includes all necessary constructor parameters
3. Sets up proper network configuration
4. Includes deployment verification steps
5. Uses latest best practices
Format the response as a complete JavaScript deployment script.`
        },
        {
          role: "user",
          content: `Contract Code:\n${contractCode}\n\nDeal Data:\n${JSON.stringify(dealData, null, 2)}`
        }
      ],
      model: "gpt-4",
      temperature: 0.7,
    });

    console.log("\n=== Deployment Script ===");
    console.log(completion.choices[0]?.message?.content);
    return completion.choices[0]?.message?.content;
  } catch (error) {
    console.error("Error generating deployment script:", error);
    throw error;
  }
}

async function processEscrowDeal() {
  try {
    // Step 1: Validate and get missing information
    const validation = await validateAndPromptMissingInfo(initialDealData);
    
    // Step 2: Create complete deal data with suggested values
    const completeDealData = {
      ...initialDealData,
      ...validation.suggestions
    };

    // Step 3: Generate Solidity contract
    const contractCode = await generateSolidityContract(completeDealData);

    // Step 4: Generate deployment script
    await generateDeploymentScript(contractCode, completeDealData);

    // Step 5: Generate deal summary
    await generateDealSummary(completeDealData);

  } catch (error) {
    console.error("Error processing escrow deal:", error);
  }
}

// Run the test
processEscrowDeal(); 