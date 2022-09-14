rm abis/*

npx solcjs --abi --include-path node_modules/ --base-path ./ ./contracts/Listings.sol -o abis

rm abis/@openzeppelin* abis/hardhat_console_sol_console.abi
rm abis/erc721a_contracts_ERC721A_sol_ERC721A.abi

mv abis/contracts_Spots_sol_Spots.abi             abis/ABI_Spots.json
mv abis/contracts_Listings_sol_Listings.abi       abis/ABI_Listings.jsonsol