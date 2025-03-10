# Sonic Code Examples

This repository contains a collection of code examples and starter templates for building applications on the Sonic blockchain. These examples demonstrate various capabilities of the SonicSVM ecosystem and provide developers with practical starting points for their own projects.

## Table of Contents

- [Basic Sonic Operations](#basic-sonic-operations)
- [SPL Token Operations](#spl-token-operations)
- [NFT Operations](#nft-operations)
- [Pyth Integration](#pyth-integration)
- [Agent Kit](#agent-kit)
- [Rush ECS Framework](#rush-ecs-framework)

## Basic Sonic Operations

Simple examples for interacting with the Sonic blockchain:

- [Fetch Balance](ts/basic/fetch-balance.ts) - Get the SOL balance of an account
- [Send Transaction](ts/basic/send-transaction.ts) - Transfer SOL between accounts
- [Add Priority Fees](ts/basic/add-priority-fees) - Set compute unit price for transactions
- [Memo Program](ts/basic/memo-program.ts) - Add memo data to transactions
- [gRPC Interaction](ts/basic/gRPC-interaction.ts) - Subscribe to account updates via gRPC

## SPL Token Operations

Examples for working with SPL tokens on Sonic:

- [Mint SPL Token](ts/basic/mint-spl-token.ts) - Create and mint a new SPL token
- [Send SPL Token](ts/basic/send-spl-token.ts) - Transfer SPL tokens between accounts
- [Fetch Token Balance](ts/basic/fetch-token-balance.ts) - Get the token balance of an account

## NFT Operations

Examples for NFT operations:

- [Mint NFT](ts/nft/mint-nft.ts) - Create and mint a new NFT using Metaplex

## Pyth Integration

Examples for integrating with Pyth Network price feeds:

- [Get Price Feed](ts/pyth/get-price-feed.ts) - Fetch price data from Pyth Network

## Agent Kit

A complete example of using the Sonic Agent Kit to create AI agents that can interact with the Sonic blockchain:

- [Agent Kit Example](ts/agent-kit/index.ts) - Create an AI agent that can perform onchain actions

## Rush ECS Framework

Examples of using the Rush ECS Framework for onchain game development:

- [Rush Quickstart](rust/rush/) - A simple Bevy game demonstrating how to convert a game to use the Rush ECS framework
- [Position Example](rust/rush/position/) - Example of storing and updating entity positions onchain

## Getting Started

1. Clone this repository:

   ```
   git clone https://github.com/your-username/sonic-code-examples.git
   cd sonic-code-examples
   ```

2. Install dependencies:

   ```
   npm install
   ```

3. Set up your environment variables in a `.env` file:

   ```
   RPC_URL=https://api.testnet.v1.sonic.game
   SONIC_PRIVATE_KEY=your_private_key_here
   OPENAI_API_KEY=your_openai_api_key_here (for Agent Kit examples)
   ```

4. Run an example:
   ```
   npx ts-node ts/basic/fetch-balance.ts
   ```

## Resources

- [Sonic Documentation](https://docs.sonic.game/)
- [Rush ECS Framework Documentation](https://docs.sonic.game/developers/rush-ecs-framework/quickstart)
- [Sonic Agent Kit Documentation](https://github.com/sendaifun/sonic-agent-kit)
