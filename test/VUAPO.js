const chai = require("chai");
const chaiAlmost = require('chai-almost');
const { utils, providers } = require("ethers");
const { keccak256 } = require("ethers/lib/utils");
const { ethers } = require("hardhat");
const { MerkleTree } = require('merkletreejs');
chai.use(chaiAlmost());
let expect = chai.expect;

async function expect_error_message(f, error_message) {
    let was_error_thrown;
    try {
        await f();
        was_error_thrown = false;
    } catch (error) {
        was_error_thrown = true;
        if(error.message.search(error_message) <= 0) {
            throw new Error("expected error '" + error_message + "' but got: " + error);
        }
    }
    if(!was_error_thrown) {
        throw new Error("expected '" + error_message + "' error, but no error thrown");
    }
}

describe.only("VUAPO", function () {

    let nft, mint10;
    let leaf0, leaf1;
    let signer0, signer1, signer3;

    it("Deploy contract", async function () {
        [signer0, signer1, signer3] = await ethers.getSigners();
        const NFT = await ethers.getContractFactory("VUAPO");
        nft = await NFT.deploy(signer0.address);
        await nft.deployed();
        expect(await nft.totalSupply()).to.equal(0);
    });

    it("Can set whitelist", async function () {
        leaf0 = keccak256(signer0.address);
        leaf1 = keccak256(signer1.address);
        let leaves = [leaf0, leaf1];
        const merkleTree = new MerkleTree(leaves, keccak256, { hashLeaves: false, sortPairs: true });
        await nft.set_whitelist(utils.arrayify(merkleTree.getHexRoot()));
        await nft.flip_whitelist_enabled();
    });

    it("Can mint", async function () {
        await nft.start_sale();
        let price = await nft.calc_price(1);
        expect(price/1e18).to.equal(0.005);
        await nft.mint(1, [leaf1], false, {value: price});
        expect(await nft.totalSupply()).to.equal(1);
    });

    it("Price increases", async function () {
        let price = await nft.calc_price(1);
        expect(price/1e18).to.equal(0.00515);
        await nft.mint(1, [leaf1], false, {value: price});
        expect(await nft.totalSupply()).to.equal(2);
    });
    
    it("Can mint 10 NFTs at once", async function () {
        expect(await nft.totalSupply()).to.equal(2);
        let price = await nft.calc_price(10);
        await nft.mint(10, [leaf1], false, {value: price+'' });
        expect(await nft.totalSupply()).to.equal(12);
        for(let i = 2; i < 12; i++) {
            expect(await nft.ownerOf(i)).to.equal(signer0.address);
        }
    });

    it("Can withdraw", async function () {
        await nft.withdraw();
        expect(await ethers.provider.getBalance(nft.address)).to.equal(0);
    });
    
    it("Can buy coupons", async function () {
        expect(await nft.totalSupply()).to.equal(12);
        let price = await nft.calc_price(1);
        await nft.mint(1, [leaf1], true, {value: price+'' });
        expect(await nft.totalSupply()).to.equal(12);
        let price_new = await nft.calc_price(1);
        expect(price_new > price, "Price did not increase");
    });
    
    it("Can withdraw coupons", async function () {
        let price_before = await nft.calc_price(1);
        expect(await nft.totalSupply()).to.equal(12);
        await nft.mint_from_coupons(1);
        expect(await nft.totalSupply()).to.equal(13);
        let price_after = await nft.calc_price(1);
        expect(price_before == price_after, "Price changed");
    });
    
    it("Cannot withdraw more coupons than bought", async function () {
        await expect_error_message(async () => {
            await nft.mint_from_coupons(1);
        }, "Insufficient coupons")
    });
    
    it("Can aidrop from old NFTs", async function () {
        await nft.airdrop_coupons_to_old_contract_owners(nft.address);
        let coupons = await nft.coupons(signer0.address);
        expect(coupons).to.equal(13);
    });
    
    it("Can transfer coupons", async function () {
        let amount = 7;
        await nft.transfer_coupons(signer1.address, amount);
        expect(await nft.coupons(signer0.address)).to.equal(13-amount);
        expect(await nft.coupons(signer1.address)).to.equal(amount);
    });
    
    it("Create bid", async function () {
        let price = await nft.calc_price(2) - await nft.calc_price(1);
        let remainder = 1336;
        let deposit_input = (parseInt(await nft.calc_price(2)) + remainder)+'';

        await nft.create_bid(price, {value: deposit_input});
        let deposit_before = (await nft.bids(0))[2];
        expect(deposit_before).to.equal(deposit_input);
    });
    
    it("Execute bids", async function () {
        expect(await nft.coupons(signer0.address)).to.equal(6);
        await nft.execute_bids();
        let deposit_after = (await nft.bids(0))[2];
        expect(deposit_after).to.equal(remainder);
        expect(await nft.coupons(signer0.address)).to.equal(6+2);
    });

    let remainder = 1336;
    it("Create plan", async function () {
        let deposit_input = (parseInt(await nft.calc_price(7)) + remainder)+'';

        await nft.start_plan(70, {value: deposit_input});
        let deposit_before = (await nft.plans(0))[1];
        expect(deposit_before).to.equal(deposit_input);
    });
    
    it("Execute plan", async function () {
        await network.provider.send("evm_increaseTime", [30]);
        await network.provider.send("evm_mine");
        await nft.execute_plans();
        expect(await nft.coupons(signer0.address)).to.equal(8+3);
    });
    
    it("Plans are not executed beyond budget.", async function () {
        await network.provider.send("evm_increaseTime", [80])
        await network.provider.send("evm_mine")
        await nft.execute_plans();
        let deposit_after = (await nft.plans(0))[1];
        expect(deposit_after).to.equal(remainder);
        expect(await nft.coupons(signer0.address)).to.equal(8+7);
    });
    
    it("Can end plan.", async function () {
        await nft.end_plan(0);
        let deposit_after = (await nft.plans(0))[1];
        expect(deposit_after).to.equal(0);
    });
});
