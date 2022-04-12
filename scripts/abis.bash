rm abis/*

npx solcjs --abi --include-path node_modules/ --base-path ./ ./contracts/Listings.sol -o abis
#npx solcjs --abi --include-path node_modules/ --base-path ./ ./contracts/VUAPO10.sol -o abis

rm abis/@openzeppelin* abis/hardhat_console_sol_console.abi
rm abis/erc721a_contracts_ERC721A_sol_ERC721A.abi

mv abis/contracts_VUAPO_sol_VUAPO.abi       abis/ABI_VUAPO.json
mv abis/contracts_VUAPO10_sol_VUAPO10.abi       abis/ABI_VUAPO10.json
mv abis/contracts_Listings_sol_Listings.abi       abis/ABI_Listings.json