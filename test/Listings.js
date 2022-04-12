const { expect } = require("chai");
const { utils, providers } = require("ethers");
const { ethers } = require("hardhat");

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

describe.only("Listings", function () {

    let listings;
    let nft;
    let stablecoin;

    it("Deploy contract", async function () {

        const NFT = await ethers.getContractFactory("Spots");
        nft = await NFT.deploy("0x0000000000000000000000000000000000000000");
        await nft.deployed();
        await nft.start_sale();

        const Stablecoin = await ethers.getContractFactory("TestERC20");
        stablecoin = await Stablecoin.deploy();
        await stablecoin.deployed();

        const Listings = await ethers.getContractFactory("Listings");
        listings = await Listings.deploy(nft.address, stablecoin.address);
        await listings.deployed();
    });

    it("Cannot list without Spot", async function () {
        expect_error_message(async () => {
            await listings.list(1, "San Jose, USA", 1500, "");
        }, "OwnerQueryForNonexistentToken");
    });

    it("Can list with Spot", async function () {
        let price = await nft.calc_price(1);
        await nft.mint(1, [], false, {value: price});
        await listings.list(0, "San Jose, USA", 1500, "");
    });

    let medellin1_price = 800;
    let medellin2_price = 850;
    it("Can list", async function () {
        let price = await nft.calc_price(3);
        await nft.mint(3, [], false, {value: price});
        await listings.list(1, "Medellin, Colombia", medellin1_price, "");
        await listings.list(2, "Medellin, Colombia", medellin2_price, "");
        await listings.list(3, "Mexico City, Mexico", 1200, "");
    });

    let medellin1_id;
    let medellin2_id;
    it("Can look up by city", async function () {
        const PRICE_POS_IN_LISTING = 1;
        medellin1_id = await listings.listings_by_location("Medellin, Colombia", 0);
        medellin2_id = await listings.listings_by_location("Medellin, Colombia", 1);
        let medellin1 = await listings.listings(medellin1_id);
        let medellin2 = await listings.listings(medellin2_id);
        expect(medellin1['price']).to.equal(medellin1_price);
        expect(medellin2['price']).to.equal(medellin2_price);
    });

    let booking_id;
    it("Can book", async function() {
        let booking_message = "Hello world!"
        let nights = 3;
        let total_price = nights*medellin1_price;

        await stablecoin.approve(listings.address, total_price);
        await listings.book(medellin1_id, 0, nights, booking_message);

        booking_id = await listings.bookings_by_listing(medellin1_id, 0);
        expect(booking_id).to.equal(1);
        let booking = await listings.bookings(booking_id);
        expect(booking['message']).to.equal(booking_message);
        expect(booking['confirmed']).to.equal(false);
        expect(await listings.amount_of_bookings_for_listing(medellin1_id)).to.equal(1);
    })

    it("Can confirm booking", async function() {
        await listings.confirm_booking(booking_id);
        let booking = await listings.bookings(booking_id);
        expect(booking['confirmed']).to.equal(true);
    })
});
