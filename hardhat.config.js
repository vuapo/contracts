const { task } = require("hardhat/config");
const { utils } = require("ethers");

require("@nomiclabs/hardhat-waffle");

const SPOTS_ADDRESS = "0x8E597Adc758C72ee13bcCfF2a518F1F9E2f49c1f" // "0xAa3eF3C28680a1535e0964a76Bd13dAeB7e56d51"; // "0x8E597Adc758C72ee13bcCfF2a518F1F9E2f49c1f";
const USDT_ADDRESS = "0xc2132D05D31c914a87C6611C10748AEb04B58e8F";

task("deploy", "Deploys the contract", async (taskArgs, hre) => {
    const Contract = await hre.ethers.getContractFactory("Spots");
    const contract = await Contract.deploy("0x6A962a736Bea41500990346858BDa7D3f2567875");
    await contract.deployed();
    console.log("Spots deployed to:", contract.address);
});

task("deploy_dapp", "Deploys the dApp", async (taskArgs, hre) => {
    const Contract = await hre.ethers.getContractFactory("Listings");
    const contract = await Contract.deploy(SPOTS_ADDRESS, USDT_ADDRESS);
    await contract.deployed();
    console.log("Listings deployed to:", contract.address);
});

task("total_sales", "Prints the amount of NFTs sold", async (taskArgs, hre) => {
    const Contract = await hre.ethers.getContractFactory("Spots");
    const contract = Contract.attach(SPOTS_ADDRESS);
    let total_sales = await contract.total_sales();
    console.log("NFTs sold: " + total_sales);
});

task("withdraw", "Withdraws all tokens from the contract", async (taskArgs, hre) => {
    const Contract = await hre.ethers.getContractFactory("Spots");
    const contract = Contract.attach(SPOTS_ADDRESS);
    await contract.withdraw();
    console.log("Tokens withdrawn");
});

task("start_sale", "Starts the sale", async (taskArgs, hre) => {
    const Contract = await hre.ethers.getContractFactory("Spots");
    const contract = Contract.attach(SPOTS_ADDRESS);
    await contract.start_sale();
    console.log("Sale started.");
});

task("calc_price", "Calculates the current price", async (taskArgs, hre) => {
    const Contract = await hre.ethers.getContractFactory("Spots");
    const contract = Contract.attach(SPOTS_ADDRESS);
    let price = await contract.calc_price(1);
    console.log("Current price is " + price);
});

task("set_whitelist", "Sets the whitelist merkle tree root")
.addParam("root", "The merkle tree root")
.setAction(async (taskArgs, hre) => {
    const Contract = await hre.ethers.getContractFactory("Spots");
    const contract = Contract.attach(SPOTS_ADDRESS);
    await contract.set_whitelist(utils.arrayify(taskArgs.root));
    console.log("Whitelist set.");
});

task("owner_of", "Prints the owner address of a token")
.addParam("id", "The token id")
.setAction(async (taskArgs, hre) => {
    let id = taskArgs.id;
    const Contract = await hre.ethers.getContractFactory("Spots");
    const contract = Contract.attach(SPOTS_ADDRESS);
    let owner = await contract.ownerOf(id);
    console.log("Owner of #"+id+" is " + owner);
});

task("list_all_owners", "Prints all owner addresses of a token")
.setAction(async (taskArgs, hre) => {
    const Contract = await hre.ethers.getContractFactory("Spots");
    const contract = Contract.attach(SPOTS_ADDRESS);
    let supply = await contract.totalSupply();
    let owners = {};
    for(let i = 0; i < supply; i++) {
        let owner = await contract.ownerOf(i);
        owners[owner] = owners[owner] ? owners[owner] + 1 : 1;
        if(i%10 == 0) {
            console.log("at token #"+i+"...")
        }
    }
    console.log(owners);
});

task("balance_of", "Prints the token balance of an address")
.addParam("address", "The address whose balance to fetch")
.setAction(async (taskArgs, hre) => {
    let address = taskArgs.address;
    const Contract = await hre.ethers.getContractFactory("Spots");
    const contract = Contract.attach(SPOTS_ADDRESS);
    let balance = await contract.balanceOf(address);
    console.log("The balance of "+address+" is " + balance);
});

task("flip_whitelist_enabled", "Flips whether the whitelist is enabled", async (taskArgs, hre) => {
    const Contract = await hre.ethers.getContractFactory("Spots");
    const contract = Contract.attach(SPOTS_ADDRESS);
    await contract.flip_whitelist_enabled();
    console.log("Whitelist state flipped");
});

task("whitelist_enabled", "Returns whether the whitelist is enabled", async (taskArgs, hre) => {
    const Contract = await hre.ethers.getContractFactory("Spots");
    const contract = Contract.attach(SPOTS_ADDRESS);
    let whitelist_state = await contract.whitelist_enabled();
    console.log("Whitelist is " + (whitelist_state ? "enabled" : "disabled"));
});

task("set_start_price", "Sets the start price for the sale")
.addParam("price", "The price in gwei")
.setAction(async (taskArgs, hre) => {
    const Contract = await hre.ethers.getContractFactory("Spots");
    const contract = Contract.attach(SPOTS_ADDRESS);
    await contract.set_start_price(taskArgs.price);
    console.log("Start price set.");
});

task("set_price_base", "Sets the base for price increase/decrease")
.addParam("base", "The potentiation base")
.setAction(async (taskArgs, hre) => {
    const Contract = await hre.ethers.getContractFactory("Spots");
    const contract = Contract.attach(SPOTS_ADDRESS);
    await contract.set_price_base(taskArgs.base);
    console.log("Base set.");
});

task("set_not_revealed_uri", "Sets the token metadata URI until reveal")
.addParam("uri", "The metadata URI")
.setAction(async (taskArgs, hre) => {
    const Contract = await hre.ethers.getContractFactory("Spots");
    const contract = Contract.attach(SPOTS_ADDRESS);
    await contract.set_not_revealed_uri(taskArgs.uri);
    console.log("not_revealed_uri set.");
});

task("airdrop_coupons_to_old_contract_owners", "Airdrops NFT to old owners from old NFT contract")
.addParam("address", "Address of old NFT contract")
.setAction(async (taskArgs, hre) => {
    const Contract = await hre.ethers.getContractFactory("Spots");
    const contract = Contract.attach(SPOTS_ADDRESS);
    await contract.airdrop_coupons_to_old_contract_owners(taskArgs.address);
    console.log("NFTs airdropped");
});

task("mint_coupons", "Mints NFTs from coupons")
.addParam("address", "Address of the receiver")
.addParam("maxamount", "Maximum amount to mint")
.setAction(async (taskArgs, hre) => {
    const Contract = await hre.ethers.getContractFactory("Spots");
    const contract = Contract.attach(SPOTS_ADDRESS);
    await contract.mint_coupons(taskArgs.address, taskArgs.maxamount);
    console.log("NFTs minted from coupons");
});

task("plans", "Reads a DCA plan")
.addParam("index", "index of the plan to read")
.setAction(async (taskArgs, hre) => {
    const Contract = await hre.ethers.getContractFactory("Spots");
    const contract = Contract.attach(SPOTS_ADDRESS);
    let plan = await contract.plans(taskArgs.index);
    console.log(plan);
});

task("execute_plans", "Executes all DCA plan")
.setAction(async (taskArgs, hre) => {
    const Contract = await hre.ethers.getContractFactory("Spots");
    const contract = Contract.attach(SPOTS_ADDRESS);
    await contract.execute_plans();
    console.log("Plans executed");
});

task("mint_all_coupons", "Mints all NFTs from coupons")
.addParam("maxamount", "Maximum amount to mint")
.setAction(async (taskArgs, hre) => {
    let max_amount = taskArgs.maxamount;
    const Contract = await hre.ethers.getContractFactory("Spots");
    const contract = Contract.attach(SPOTS_ADDRESS);
    let list = {
        '0x6A962a736Bea41500990346858BDa7D3f2567875': 61,
        '0xd9f368c33f3F5594006be04E7093CB3D42F8B308': 3,
        '0xd227493E36A34dB7465B9d2902787ceD2a987222': 17,
        '0xADcae84953690AF85a7636344401F3136CCC0549': 10,
        '0x33a7d139955c1B34033Fa5187D752AF986Eace9e': 2,
        '0x42542D1F1a465Aa3E812AB5D2b0C23A1dD17B20f': 1,
        '0x32783593686040ECb5E48Ef6b172F12b9a046744': 3,
        '0x198c8d21f5B6C333CBBc52E7a46215866b8A79f9': 52,
        '0x3d9dBA95Ebb82a03E29D243beF1A7004F9E99e30': 5,
        '0x8DC0C97b6188306dE4D825969c288CCB45cdb5Fd': 1,
        '0xfA70E16AafdE291Ec0373bd88ac7a49495859B5A': 60,
        '0xB1f292bF146eC69Cdae4A5247387Dbf5d24925A9': 21,
        '0x9C341B6d2BD15Cf391396f071EA0fc251DCd3925': 10
    };


    function sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    for (let address in list) {
        let amount = await contract.coupons(address);
        console.log("Minting " + amount + " NFTs for " + address + "...");
        let calls_needed = Math.ceil(amount / max_amount);
        for(let i = 0; i < calls_needed; i++) {
            try {
                await contract.mint_coupons(address, max_amount);
            } catch(error) {
                console.log(error);
                i--;
                await sleep(1000);
                continue;
            }
            console.log("completed " + (i+1) + "/" + calls_needed);
        }
    }
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