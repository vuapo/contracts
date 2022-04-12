const { task } = require("hardhat/config");
const { utils } = require("ethers");

require("@nomiclabs/hardhat-waffle");

const VUAPO_ADDRESS = "0xAa3eF3C28680a1535e0964a76Bd13dAeB7e56d51";
const USDT_ADDRESS = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F";

task("deploy", "Deploys the contract", async (taskArgs, hre) => {
    const Contract = await hre.ethers.getContractFactory("VUAPO");
    const contract = await Contract.deploy("0x6A962a736Bea41500990346858BDa7D3f2567875");
    await contract.deployed();
    console.log("VUAPO deployed to:", contract.address);
});

task("deploy10", "Deploys the Mint10 contract", async (taskArgs, hre) => {
    const Contract = await hre.ethers.getContractFactory("VUAPO10");
    const contract = await Contract.deploy(VUAPO_ADDRESS);
    await contract.deployed();
    console.log("VUAPO10 deployed to:", contract.address);
});

task("deploy_dapp", "Deploys the dApp", async (taskArgs, hre) => {
    const Contract = await hre.ethers.getContractFactory("Listings");
    const contract = await Contract.deploy(VUAPO_ADDRESS, USDT_ADDRESS);
    await contract.deployed();
    console.log("Listings deployed to:", contract.address);
});

task("latest_minted_id", "Prints the latest token ID minted", async (taskArgs, hre) => {
    const Contract = await hre.ethers.getContractFactory("VUAPO10");
    const contract = Contract.attach("0x5840327f84668584156641e4B357300f6dB25c8e");
    let latest_minted_id = await contract.latest_minted_id();
    console.log("Latest ID minted: " + latest_minted_id);
});

task("total_sales", "Prints the amount of NFTs sold", async (taskArgs, hre) => {
    const Contract = await hre.ethers.getContractFactory("VUAPO");
    const contract = Contract.attach(VUAPO_ADDRESS);
    let total_sales = await contract.total_sales();
    console.log("NFTs sold: " + total_sales);
});

task("withdraw", "Withdraws all tokens from the contract", async (taskArgs, hre) => {
    const Contract = await hre.ethers.getContractFactory("VUAPO");
    const contract = Contract.attach(VUAPO_ADDRESS);
    await contract.withdraw();
    console.log("Tokens withdrawn");
});

task("start_sale", "Starts the sale", async (taskArgs, hre) => {
    const Contract = await hre.ethers.getContractFactory("VUAPO");
    const contract = Contract.attach(VUAPO_ADDRESS);
    await contract.start_sale();
    console.log("Sale started.");
});

task("calc_price", "Calculates the current price", async (taskArgs, hre) => {
    const Contract = await hre.ethers.getContractFactory("VUAPO");
    const contract = Contract.attach(VUAPO_ADDRESS);
    let price = await contract.calc_price();
    console.log("Current price is " + price);
});

task("set_whitelist", "Sets the whitelist merkle tree root")
.addParam("root", "The merkle tree root")
.setAction(async (taskArgs, hre) => {
    const Contract = await hre.ethers.getContractFactory("VUAPO");
    const contract = Contract.attach(VUAPO_ADDRESS);
    await contract.set_whitelist(utils.arrayify(taskArgs.root));
    console.log("Whitelist set.");
});

task("owner_of", "Prints the owner address of a token")
.addParam("id", "The token id")
.setAction(async (taskArgs, hre) => {
    let id = taskArgs.id;
    const Contract = await hre.ethers.getContractFactory("VUAPO");
    const contract = Contract.attach(VUAPO_ADDRESS);
    let owner = await contract.ownerOf(id);
    console.log("Owner of #"+id+" is " + owner);
});

task("balance_of", "Prints the token balance of an address")
.addParam("address", "The address whose balance to fetch")
.setAction(async (taskArgs, hre) => {
    let address = taskArgs.address;
    const Contract = await hre.ethers.getContractFactory("VUAPO");
    const contract = Contract.attach(VUAPO_ADDRESS);
    let balance = await contract.balanceOf(address);
    console.log("The balance of "+address+" is " + balance);
});

task("flip_whitelist_enabled", "Flips whether the whitelist is enabled", async (taskArgs, hre) => {
    const Contract = await hre.ethers.getContractFactory("VUAPO");
    const contract = Contract.attach(VUAPO_ADDRESS);
    await contract.flip_whitelist_enabled();
    console.log("Whitelist state flipped");
});

task("whitelist_enabled", "Returns whether the whitelist is enabled", async (taskArgs, hre) => {
    const Contract = await hre.ethers.getContractFactory("VUAPO");
    const contract = Contract.attach(VUAPO_ADDRESS);
    let whitelist_state = await contract.whitelist_enabled();
    console.log("Whitelist is " + (whitelist_state ? "enabled" : "disabled"));
});

task("set_start_price", "Sets the start price for the sale")
.addParam("price", "The price in gwei")
.setAction(async (taskArgs, hre) => {
    const Contract = await hre.ethers.getContractFactory("VUAPO");
    const contract = Contract.attach(VUAPO_ADDRESS);
    await contract.set_start_price(taskArgs.price);
    console.log("Start price set.");
});

task("set_price_exponent", "Sets the base for price increase/decrease")
.addParam("base", "The potentiation base")
.setAction(async (taskArgs, hre) => {
    const Contract = await hre.ethers.getContractFactory("VUAPO");
    const contract = Contract.attach(VUAPO_ADDRESS);
    await contract.set_price_exponent(taskArgs.base);
    console.log("Base set.");
});

task("set_not_revealed_uri", "Sets the token metadata URI until reveal")
.addParam("uri", "The metadata URI")
.setAction(async (taskArgs, hre) => {
    const Contract = await hre.ethers.getContractFactory("VUAPO");
    const contract = Contract.attach(VUAPO_ADDRESS);
    await contract.set_not_revealed_uri(taskArgs.uri);
    console.log("not_revealed_uri set.");
});

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: "0.8.7",
  networks: {
    rinkeby: {
        url: "https://rinkeby.infura.io/v3/dabf0b8c9f3f473589b965a13b87448f",
        accounts: ["0xe2a9691f3452159791639d26c01916d4640ac764c04cd0ebf90311b7d27f410d"] // 0xc6b9d812efac46cc5ee1256f1ea24006fcdf9aba
    },
    matic: {
        url: "https://polygon-rpc.com",
        accounts: ["0xe2a9691f3452159791639d26c01916d4640ac764c04cd0ebf90311b7d27f410d"] // 0xc6b9d812efac46cc5ee1256f1ea24006fcdf9aba
    }
  }
};