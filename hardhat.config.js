const { task } = require("hardhat/config");
const { utils } = require("ethers");

require("@nomiclabs/hardhat-waffle");

const SPOTS_ADDRESS = "0xFeBaf772e68da55Cc9cC1E516679227d1a13B843" // "0x8e597adc758c72ee13bccff2a518f1f9e2f49c1f" "0xFeBaf772e68da55Cc9cC1E516679227d1a13B843"
const USDT_ADDRESS = "0x3c2b8be99c50593081eaa2a724f0b8285f5aba8f";
const LISTINGS_ADDRESS = "0xCf83Ba195627bDbFA680c104cdD85ec4290B5e4B";

const WITHDRAWAL_ADDRESS = "0x6A962a736Bea41500990346858BDa7D3f2567875";


async function get_spots_contract() {
    const Contract = await hre.ethers.getContractFactory("Spots");
    return Contract.attach(SPOTS_ADDRESS);
}

async function list_all_owners() {
    let contract = await get_spots_contract();
    let supply = await contract.totalSupply();
    let owners = {};
    for(let i = 0; i < supply; i++) {
        let owner = await contract.ownerOf(i);
        owners[owner] = owners[owner] ? owners[owner] + 1 : 1;
        if(i%10 == 0) {
            console.log("at token #"+i+"...")
        }
    }
    return owners;
}

task("deploy_small", "Deploys the contract", async (taskArgs, hre) => {
    const Contract = await hre.ethers.getContractFactory("SMALL_WRLD");
    const contract = await Contract.deploy(WITHDRAWAL_ADDRESS, WITHDRAWAL_ADDRESS);
    await contract.deployed();
    console.log("SMALL_WRLD deployed to:", contract.address);
});

task("small_ipfs", "Deploys the contract", async (taskArgs, hre) => {
    const Contract = await hre.ethers.getContractFactory("SMALL_WRLD");
    const contract = await Contract.attach("0x1B72db33b8c8A6fd64d1683d7328A4E6BE7Bc678");
    console.log(await contract.tokenURI(739));
});

task("set_root", "Sets the whitelist merkle tree root")
.addParam("root", "The merkle tree root")
.setAction(async (taskArgs, hre) => {
    const Contract = await hre.ethers.getContractFactory("SMALL_WRLD");
    let contract = Contract.attach("0x9C20BDD24f7dC027665958Cffc00301b46586776");
    await contract.setRoot(utils.arrayify(taskArgs.root));
    console.log("Whitelist root set.");
});

task("flip_presale_state", "...")
.setAction(async (taskArgs, hre) => {
    const Contract = await hre.ethers.getContractFactory("SMALL_WRLD");
    let contract = Contract.attach("0x9C20BDD24f7dC027665958Cffc00301b46586776");
    await contract.flipPreSaleState();
});

task("deploy", "Deploys the contract", async (taskArgs, hre) => {
    const Contract = await hre.ethers.getContractFactory("Spots");
    const contract = await Contract.deploy(WITHDRAWAL_ADDRESS);
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
    let contract = await get_spots_contract();
    let total_sales = await contract.total_sales();
    console.log("NFTs sold: " + total_sales);
});

task("withdraw", "Withdraws all tokens from the contract", async (taskArgs, hre) => {
    let contract = await get_spots_contract();
    await contract.withdraw();
    console.log("Tokens withdrawn");
});

task("start_sale", "Starts the sale", async (taskArgs, hre) => {
    let contract = await get_spots_contract();
    await contract.start_sale();
    console.log("Sale started.");
});

task("calc_price", "Calculates the current price", async (taskArgs, hre) => {
    let contract = await get_spots_contract();
    let price = await contract.calc_price(1);
    console.log("Current price is " + price);
});

task("set_whitelist", "Sets the whitelist merkle tree root")
.addParam("root", "The merkle tree root")
.setAction(async (taskArgs, hre) => {
    let contract = await get_spots_contract();
    await contract.set_whitelist(utils.arrayify(taskArgs.root));
    console.log("Whitelist set.");
});

task("owner_of", "Prints the owner address of a token")
.addParam("id", "The token id")
.setAction(async (taskArgs, hre) => {
    let id = taskArgs.id;
    let contract = await get_spots_contract();
    let owner = await contract.ownerOf(id);
    console.log("Owner of #"+id+" is " + owner);
});

task("list_all_owners", "Prints all owner addresses of a token")
.setAction(async (taskArgs, hre) => {
    let owners = await list_all_owners();
    console.log(owners);
});

task("purchases", "Prints all credits by owner")
.setAction(async (taskArgs, hre) => {
    let contract = await get_spots_contract();
    let purchases_length = await contract.purchases_length();

    for(let i = 0; i < purchases_length; i++) {
        let purchase = await contract.purchases(i);
        console.log("#" +i+ ": " + purchase);
    }
})

task("list_all_credits", "Prints all credits by owner")
.setAction(async (taskArgs, hre) => {
    let contract = await get_spots_contract();
    let addresses = [];

    let purchases_length = await contract.purchases_length();

    for(let i = 0; i < purchases_length; i++) {
        let purchase = await contract.purchases(i);
        let address = purchase[0];
        if(!addresses.includes(address)) {
            addresses.push(address);
        }
        if(i%10 == 0) {
            console.log("at purchase #"+i+ "/" + purchases_length+"...")
        }
    }
    console.log(addresses);

    let credits ={};
    for(let i = 0; i < addresses.length; i++) {
        let address = addresses[i];
        credits[address] = parseInt(await contract.coupons(address));
    }
    console.log(credits);
});

task("balance_of", "Prints the token balance of an address")
.addParam("address", "The address whose balance to fetch")
.setAction(async (taskArgs, hre) => {
    let address = taskArgs.address;
    let contract = await get_spots_contract();
    let balance = await contract.balanceOf(address);
    console.log("The balance of "+address+" is " + balance);
});

task("flip_whitelist_enabled", "Flips whether the whitelist is enabled", async (taskArgs, hre) => {
    let contract = await get_spots_contract();
    await contract.flip_whitelist_enabled();
    console.log("Whitelist state flipped");
});

task("whitelist_enabled", "Returns whether the whitelist is enabled", async (taskArgs, hre) => {
    let contract = await get_spots_contract();
    let whitelist_state = await contract.whitelist_enabled();
    console.log("Whitelist is " + (whitelist_state ? "enabled" : "disabled"));
});

task("set_start_price", "Sets the start price for the sale")
.addParam("price", "The price in gwei")
.setAction(async (taskArgs, hre) => {
    let contract = await get_spots_contract();
    await contract.set_start_price(taskArgs.price);
    console.log("Start price set.");
});

task("set_price_base", "Sets the base for price increase/decrease")
.addParam("base", "The potentiation base")
.setAction(async (taskArgs, hre) => {
    let contract = await get_spots_contract();
    await contract.set_price_base(taskArgs.base);
    console.log("Base set.");
});

task("set_not_revealed_uri", "Sets the token metadata URI until reveal")
.addParam("uri", "The metadata URI")
.setAction(async (taskArgs, hre) => {
    let contract = await get_spots_contract();
    await contract.set_not_revealed_uri(taskArgs.uri);
    console.log("not_revealed_uri set.");
});

task("airdrop_coupons_to_old_contract_owners", "Airdrops NFT to old owners from old NFT contract")
.addParam("address", "Address of old NFT contract")
.setAction(async (taskArgs, hre) => {
    let contract = await get_spots_contract();
    await contract.airdrop_coupons_to_old_contract_owners(taskArgs.address);
    console.log("NFTs airdropped");
});

task("mint_coupons", "Mints NFTs from coupons")
.addParam("address", "Address of the receiver")
.addParam("maxamount", "Maximum amount to mint")
.setAction(async (taskArgs, hre) => {
    let contract = await get_spots_contract();
    await contract.mint_coupons(taskArgs.address, taskArgs.maxamount);
    console.log("NFTs minted from coupons");
});

task("coupons", "Mints NFTs from coupons")
.addParam("address", "Address of the receiver")
.setAction(async (taskArgs, hre) => {
    let contract = await get_spots_contract();
    let coupons = await contract.coupons(taskArgs.address);
    console.log("Address " + taskArgs.address + " has " + coupons + " coupons");
});

task("plans", "Reads a DCA plan")
.addParam("index", "index of the plan to read")
.setAction(async (taskArgs, hre) => {
    let contract = await get_spots_contract();
    let plan = await contract.plans(taskArgs.index);
    console.log(plan);
});

task("listings", "Reads a Listing")
.addParam("index", "index of the plan to read")
.setAction(async (taskArgs, hre) => {
    const Contract = await hre.ethers.getContractFactory("Listings");
    const contract = Contract.attach(LISTINGS_ADDRESS);
    let listing = await contract.listings(taskArgs.index);
    console.log(listing);
});

task("execute_plans", "Executes all DCA plan")
.setAction(async (taskArgs, hre) => {
    let contract = await get_spots_contract();
    await contract.execute_plans();
    console.log("Plans executed");
});

task("execute_bids", "Executes all Bids")
.setAction(async (taskArgs, hre) => {
    let contract = await get_spots_contract();
    await contract.execute_bids();
    console.log("Bids executed");
});

task("mint_all_coupons", "Mints all NFTs from coupons")
.addParam("maxamount", "Maximum amount to mint")
.setAction(async (taskArgs, hre) => {
    let max_amount = taskArgs.maxamount;
    let contract = await get_spots_contract();
    let list = {
        '0x6A962a736Bea41500990346858BDa7D3f2567875': 73 + 269,
        '0xd9f368c33f3F5594006be04E7093CB3D42F8B308': 3,
        '0xADcae84953690AF85a7636344401F3136CCC0549': 10,
        '0x33a7d139955c1B34033Fa5187D752AF986Eace9e': 2,
        '0xd227493E36A34dB7465B9d2902787ceD2a987222': 17,
        '0x42542D1F1a465Aa3E812AB5D2b0C23A1dD17B20f': 1,
        '0x198c8d21f5B6C333CBBc52E7a46215866b8A79f9': 72,
        '0x32783593686040ECb5E48Ef6b172F12b9a046744': 3 + 7,
        '0x3d9dBA95Ebb82a03E29D243beF1A7004F9E99e30': 5,
        '0x8DC0C97b6188306dE4D825969c288CCB45cdb5Fd': 1,
        '0xfA70E16AafdE291Ec0373bd88ac7a49495859B5A': 99 + 180,
        '0xB1f292bF146eC69Cdae4A5247387Dbf5d24925A9': 21 + 10,
        '0x9C341B6d2BD15Cf391396f071EA0fc251DCd3925': 10,
        '0x424f56e1850bBB1226adf962115fA444623FaBBE': 1,
        '0xD6Ca5a5eaD698e2905264bc9B85FB673Ef67DfD9': 15,
        '0x48e44dE8Bd5795F4d16c3D8Dddf35e7F07d661d6': 170,
        '0xC9FFf338e3286A5B3731F80e7Ea5B38CA1dcFf4C': 35
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

task("aidrop_all_coupons", "Airdrops a list of coupons")
.setAction(async (taskArgs, hre) => {
    let contract = await get_spots_contract();
    let list = {
        '0x6A962a736Bea41500990346858BDa7D3f2567875': 73 + 269,
        '0xd9f368c33f3F5594006be04E7093CB3D42F8B308': 3,
        '0xADcae84953690AF85a7636344401F3136CCC0549': 10,
        '0x33a7d139955c1B34033Fa5187D752AF986Eace9e': 2,
        '0xd227493E36A34dB7465B9d2902787ceD2a987222': 17,
        '0x42542D1F1a465Aa3E812AB5D2b0C23A1dD17B20f': 1,
        '0x198c8d21f5B6C333CBBc52E7a46215866b8A79f9': 72,
        '0x32783593686040ECb5E48Ef6b172F12b9a046744': 3 + 7,
        '0x3d9dBA95Ebb82a03E29D243beF1A7004F9E99e30': 5,
        '0x8DC0C97b6188306dE4D825969c288CCB45cdb5Fd': 1,
        '0xfA70E16AafdE291Ec0373bd88ac7a49495859B5A': 99 + 180,
        '0xB1f292bF146eC69Cdae4A5247387Dbf5d24925A9': 21 + 10,
        '0x9C341B6d2BD15Cf391396f071EA0fc251DCd3925': 10,
        '0x424f56e1850bBB1226adf962115fA444623FaBBE': 1,
        '0xD6Ca5a5eaD698e2905264bc9B85FB673Ef67DfD9': 15,
        '0x48e44dE8Bd5795F4d16c3D8Dddf35e7F07d661d6': 170,
        '0xC9FFf338e3286A5B3731F80e7Ea5B38CA1dcFf4C': 35
    };

    for (const [receiver, amount] of Object.entries(list)) {
        await contract.airdrop_coupons(receiver, amount);
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
    ethereum: {
        url: "https://mainnet.infura.io/v3/",
        accounts: ["0xe2a9691f3452159791639d26c01916d4640ac764c04cd0ebf90311b7d27f410d"] // 0xc6b9d812efac46cc5ee1256f1ea24006fcdf9aba
    },
    matic: {
        url: "https://rpc-mainnet.maticvigil.com",
        accounts: ["0xe2a9691f3452159791639d26c01916d4640ac764c04cd0ebf90311b7d27f410d"] // 0xc6b9d812efac46cc5ee1256f1ea24006fcdf9aba
    },
    harmony: {
        url: "https://api.harmony.one",
        accounts: ["0xe2a9691f3452159791639d26c01916d4640ac764c04cd0ebf90311b7d27f410d"] // 0xc6b9d812efac46cc5ee1256f1ea24006fcdf9aba
    }
  }
};