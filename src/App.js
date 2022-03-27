// Import hooks from React, functionality from ethers
import { useState, useEffect } from 'react';
import { ethers, utils } from "ethers";

// Import abi from PerseCoin smart contract
import abi from "./contracts/PerseCoin.json";

function App() {

  // Store and update state of
  //    isWalletConnected, inputValue
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [inputValue, setInputValue] = useState({ walletAddress: "", transferAmount: "", burnAmount: "", mintAmount: "" });

  // Store and update state of
  //    tokenName, tokenSymbol
  const [tokenName, setTokenName] = useState("");
  const [tokenSymbol, setTokenSymbol] = useState("");

  // Store and update state of 
  //    tokenTotalSupply, isTokenOwner
  const [tokenTotalSupply, setTokenTotalSupply] = useState(0);
  const [isTokenOwner, setIsTokenOwner] = useState(false);

  // Store and update state of 
  //    tokenOwnerAddress, yourWalletAddress
  const [tokenOwnerAddress, setTokenOwnerAddress] = useState(null);
  const [yourWalletAddress, setYourWalletAddress] = useState(null);

  // Store and update state of
  //    error
  const [error, setError] = useState(null);

  // Store contract address, given by hardhat when deployed
  const contractAddress = '0xf397934Fa77d4D65f264Ec6FE43bA88BbbB10120';

  // Store imported abi file
  const contractABI = abi.abi;

  // Connect Metamask account
  const checkIfWalletIsConnected = async () => {
    try {

      // If ethereum is in window object
      //    Request array of Metamask accounts
      //    Store the account at index 0 in const account
      if (window.ethereum) {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' })
        const account = accounts[0];
        setIsWalletConnected(true);
        setYourWalletAddress(account);
        console.log("Account Connected: ", account);

      // If ethereum is not in window object
      //    Error and console message
      } else {
        setError("Install a MetaMask wallet to receive PerseCoins.");
        console.log("No Metamask wallet detected.");
      }
    } catch (error) {
      console.log(error);
    }
  }

  // Get token info
  const getTokenInfo = async () => {
    try {
      if (window.ethereum) {

        // Take in provider to allow for connection to Ethereum
        const provider = new ethers.providers.Web3Provider(window.ethereum);

        // Take in signer via provider
        //    To allow for writing to Ethereum via transactions
        const signer = provider.getSigner();

        // Take in contract, abi file, and signer
        const tokenContract = new ethers.Contract(contractAddress, contractABI, signer);
        
        // Take first account from Metamask
        const [account] = await window.ethereum.request({ method: 'eth_requestAccounts' });

        // Take in token name, symbol, owner, supply and format
        let tokenName = await tokenContract.name();
        let tokenSymbol = await tokenContract.symbol();
        let tokenOwner = await tokenContract.owner();
        let tokenSupply = await tokenContract.totalSupply();
        tokenSupply = utils.formatEther(tokenSupply)

        // Set token name, symbol, total supply, and token owner address
        setTokenName(`${tokenName}`);
        setTokenSymbol(tokenSymbol);
        setTokenTotalSupply(tokenSupply);
        setTokenOwnerAddress(tokenOwner);

        // Check if connected account is token owner
        //    If so, allow for functionality to burn and mint new tokens
        if (account.toLowerCase() === tokenOwner.toLowerCase()) {
          setIsTokenOwner(true)
        }
      }
    } catch (error) {
      console.log(error);
    }
  }

  // Send tokens to other accounts
  const transferToken = async (event) => {

    // Prevent DApp from reloading when submitting form
    event.preventDefault();
    try {
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const tokenContract = new ethers.Contract(contractAddress, contractABI, signer);

        // Transfer tokens to other account with parameters
        //    Account address and amount to send
        const txn = await tokenContract.transfer(inputValue.walletAddress, utils.parseEther(inputValue.transferAmount));
        console.log("Transferring PerseCoins...");
        await txn.wait();
        console.log("PerseCoins transferred.", txn.hash);

      } else {
        console.log("Ethereum object not found. Install Metamask.");
        setError("Install a MetaMask wallet to receive PerseCoins.");
      }
    } catch (error) {
      console.log(error);
    }
  }

  // Burn tokens
  const burnTokens = async (event) => {

    // Prevent DApp from reloading when submitting form
    event.preventDefault();
    try {
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const tokenContract = new ethers.Contract(contractAddress, contractABI, signer);

        // Burn tokens with parameter
        //    Amount to burn
        const txn = await tokenContract.burnTokens(utils.parseEther(inputValue.burnAmount));
        console.log("Burning PerseCoins...");
        await txn.wait();
        console.log("PerseCoins burned.", txn.hash);

        // Update token supply
        let tokenSupply = await tokenContract.totalSupply();
        tokenSupply = utils.formatEther(tokenSupply)
        setTokenTotalSupply(tokenSupply);

      } else {
        console.log("Ethereum object not found. Install Metamask.");
        setError("Install a MetaMask wallet to receive PerseCoins.");
      }
    } catch (error) {
      console.log(error);
    }
  }

  // Mint tokens
  const mintTokens = async (event) => {

    // Prevent DApp from reloading when submitting form
    event.preventDefault();
    try {
      if (window.ethereum) {
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const tokenContract = new ethers.Contract(contractAddress, contractABI, signer);
        let tokenOwner = await tokenContract.owner();

        // Mint tokens with parameter
        //    Token owner address and amount to mint
        const txn = await tokenContract.mintTokens(tokenOwnerAddress, utils.parseEther(inputValue.mintAmount));
        console.log("Minting PerseCoins...");
        await txn.wait();
        console.log("PerseCoins minted.", txn.hash);

        // Update token supply
        let tokenSupply = await tokenContract.totalSupply();
        tokenSupply = utils.formatEther(tokenSupply)
        setTokenTotalSupply(tokenSupply);

      } else {
        console.log("Ethereum object not found. Install Metamask.");
        setError("Install a MetaMask wallet to receive PerseCoins.");
      }
    } catch (error) {
      console.log(error);
    }
  }

  // Take in form input and pass to handler functions
  const handleInputChange = (event) => {
    setInputValue(prevFormData => ({ ...prevFormData, [event.target.name]: event.target.value }));
  }

  // Load all functions during initial loading of DApp
  useEffect(() => {

    // Check for wallet and get token info
    checkIfWalletIsConnected();
    getTokenInfo();

  }, [])

  return (
    <main>
      <h2>
        <span>The PerseCoin Token</span>
      </h2>
      <section>
        {error && <p>{error}</p>}
        <div>
          <span><strong>Coin:</strong> {tokenName} </span>
          <span><strong>Ticker:</strong>  {tokenSymbol} </span>
          <span><strong>Total Supply:</strong>  {tokenTotalSupply}</span>
        </div>
        <div>
          <form>
            <input
              type="text"
              onChange={handleInputChange}
              name="walletAddress"
              placeholder="Wallet Address"
              value={inputValue.walletAddress}
            />
            <input
              type="text"
              onChange={handleInputChange}
              name="transferAmount"
              placeholder={`0.0000 ${tokenSymbol}`}
              value={inputValue.transferAmount}
            />
            <button
              onClick={transferToken}>Transfer Tokens</button>
          </form>
        </div>
        {isTokenOwner && (
          <section>
            <div>
              <form>
                <input
                  type="text"
                  onChange={handleInputChange}
                  name="burnAmount"
                  placeholder={`0.0000 ${tokenSymbol}`}
                  value={inputValue.burnAmount}
                />
                <button
                  onClick={burnTokens}>
                  Burn Tokens
                </button>
              </form>
            </div>
            <div>
              <form>
                <input
                  type="text"
                  onChange={handleInputChange}
                  name="mintAmount"
                  placeholder={`0.0000 ${tokenSymbol}`}
                  value={inputValue.mintAmount}
                />
                <button
                  onClick={mintTokens}>
                  Mint Tokens
                </button>
              </form>
            </div>
          </section>
        )}
        <div>
          <p><span><strong>Contract Address:</strong> </span>{contractAddress}</p>
        </div>
        <div>
          <p><span><strong>Token Owner Address:</strong> </span>{tokenOwnerAddress}</p>
        </div>
        <div>
          {isWalletConnected && <p><span><strong>Your Wallet Address:</strong> </span>{yourWalletAddress}</p>}
          <button onClick={checkIfWalletIsConnected}>
            {isWalletConnected ? "Wallet Connected" : "Connect Wallet"}
          </button>
        </div>
      </section>
    </main>
  );
}
export default App;