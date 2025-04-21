# Settlr - Smart Contract Escrow Platform

Settlr is a modern web application that leverages OpenAI's GPT-4 to automate and streamline the creation of escrow agreements for blockchain transactions, particularly focusing on NFT sales. Video  - https://drive.google.com/file/d/1iHG2-uOssL1DLzo3Y8PEDJeAZmKHTyW8/view?usp=sharing, Slideshow, https://drive.google.com/file/d/1HKu5I8yWYn9Ujy9SE4toAZgs9n_GXfdQ/view?usp=sharing.

## Features

- **AI-Powered Document Generation**
  - Legal contracts in PDF format
  - Solidity smart contracts
  - Deployment scripts
  - Transaction summaries
  - Automated validation of escrow terms

- **Smart Contract Integration**
  - Secure escrow implementation
  - NFT transfer verification
  - ETH payment handling
  - Dispute resolution mechanisms

## Prerequisites

- Node.js (v16 or higher)
- OpenAI API key
- Ethereum wallet and testnet ETH (for testing)

## Installation

1. Clone the repository:
```bash
git clone https://github.com/pabloecheva/settlr.git
cd settlr
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Create a `.env.local` file in the root directory with the following:
```
OPENAI_API_KEY=your_api_key_here
```

## Usage

### Development Server

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Testing

Run the OpenAI integration test:
```bash
node test-openai.js
```

Test the escrow deal generation:
```bash
node test-escrow-deal.js
```

## Project Structure

- `/app` - Next.js application files
  - `/components` - React components
  - `/utils` - Utility functions and OpenAI integration
- `/test-*.js` - Test files for various functionalities

## API Integration

### OpenAI Integration

The project uses OpenAI's GPT-4 model for:
- Validating escrow deal information
- Generating legal documents
- Creating Solidity smart contracts
- Producing deployment scripts
- Summarizing transactions

### Smart Contract Features

The generated smart contracts include:
- OpenZeppelin contract integration
- Secure payment handling
- NFT transfer verification
- Dispute resolution mechanisms
- Best practices implementation

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## Security

- Never commit API keys or sensitive information
- Always use environment variables for secrets
- Follow smart contract security best practices

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- OpenAI for GPT-4 API
- OpenZeppelin for smart contract libraries
- Next.js team for the framework
