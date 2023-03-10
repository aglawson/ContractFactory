import { useState } from 'react'
import './App.css'
import { ethers } from 'ethers'
import axios from 'axios';
import { URL } from './secret';

let provider;
let signer;
let userAddress;

function App() {
  const [button, setButton] = useState('Connect Wallet')
  const [message, setMessage] = useState('Connect Wallet');
  const [owned, setOwned] = useState([]);

  const m_etherscan = 'https://etherscan.io/'
  const g_etherscan = 'https://goerli.etherscan.io/'
  const avax_scan = 'https://snowtrace.io/'
  const polygonscan = 'https://polygonscan.com/'
  const arbiscan = 'https://arbiscan.io/'
  const optimism = 'https://optimistic.etherscan.io/'

  async function handleButton () {
    if(button === 'Connect Wallet') {
      await getSigner();
    } else if(button === 'Sign In') {
      await SignIn();
    }
  }

  function getBlockExplorer(network) {
    switch (network) {
      case 'goerli':
        return g_etherscan
      case 'mainnet':
        return m_etherscan
      case 'avax':
        return avax_scan
      case 'polygon':
        return polygonscan
      case 'arbitrum':
        return arbiscan
      case 'optimism':
        return optimism
    }
  }

  async function getSigner () {
      try{
        provider = new ethers.providers.Web3Provider(window.ethereum)
        await provider.send("eth_requestAccounts", []);
        signer = await provider.getSigner();
        userAddress = await signer.getAddress();
        setMessage('Connected: ' + userAddress);
        setButton('Sign In');  
      } catch{
        getSigner();
      }
  }

  async function getSignature () {
    if(!signer) {
      await getSigner()
    }
    const message = Date.now().toString()
    const signature = await signer.signMessage(message)

    return {
      message: message,
      signature: signature
    }
  }

  async function SignIn() {
    const message = Date.now().toString();
    const signature = await signer.signMessage(message)

    //const auth = await axios.get(`${URL}signature_auth?wallet=${userAddress}&message=${message}&signature=${signature}`);
    const owned_contracts = await axios.get(`${URL}get_owned_contracts?wallet=${userAddress}&message=${message}&signature=${signature}`);
    console.log(owned_contracts)
    let ow = []
    for(let i = 0; i < owned_contracts.data.output.data.length; i++) {
      owned.push(owned_contracts.data.output.data[i]);
    }
    console.log(owned);

    let html = `<select type='text' id='contract_address'>`
    for(let i = 0; i < owned.length; i++) {
      html += `<option value=${owned[i]}>${owned[i]}</option>`
    }
    document.getElementById('owned_contracts').innerHTML = `${html}</select> <br/>`
  }

  async function DeployContract(e) {
    e.preventDefault();

    const name = document.getElementById('name').value;
    const symbol = document.getElementById('symbol').value;
    const price = document.getElementById('price').value;
    const wlPrice = document.getElementById('wlPrice').value
    const maxSupply = document.getElementById('maxSupply').value;
    const network = document.getElementById('network').value;
    const uri = document.getElementById('uri').value;

    const message = Date.now().toString();
    const signature = await signer.signMessage(message)

    const deploy = await axios.get(`${URL}deploy_nft?name=${name}&symbol=${symbol}&price=${(price * 10**18).toString()}&whitelist_price=${(wlPrice * 10**18).toString()}&maxSupply=${maxSupply}&wallet=${userAddress}&message=${message}&signature=${signature}&network=${network}&uri=${uri}`);
    console.log(deploy);

    const etherscan = getBlockExplorer(network)

    try{
      document.getElementById('link').innerHTML = '<a href=' + etherscan + '/address/' + deploy.data.output.data + ' target="blank">See Contract</a>'
    } catch (err) {
      alert(deploy.data.error.reason)
    }
  }

  async function SetState(e) {
    e.preventDefault();

    if(!userAddress){
      await getSigner();
    }

    const message = Date.now().toString();
    const signature = await signer.signMessage(message)

    const contract = document.getElementById('contract_address').value;
    
    const state = document.getElementById('states').value;
    const network = document.getElementById('network').value

    const setState = await axios.get(`${URL}set_state?contract=${contract}&state=${state}&signature=${signature}&message=${message}&wallet=${userAddress}&network=${network}`)
    console.log(setState);

    const etherscan = getBlockExplorer(network)

    try {
      document.getElementById('link').innerHTML = '<a href=' + etherscan + '/tx/' + setState.data.output.tx + ' target="blank">See Transaction</a>'
    } catch (err) {
      alert(setState.data.error.reason)
    }
  }

  async function AppendWhitelist(e) {
    e.preventDefault()
    const contract = document.getElementById('contract_address').value
    const network = document.getElementById('network').value;
    const whitelist = document.getElementById('whitelist').value.split(',')

    console.log(whitelist);

    if(!userAddress) {
      await getSigner();
    }

    if(!contract) {
      alert('Contract address not specified')
    }

    const signObj = await getSignature()

    try{
      const append = await axios.get(`${URL}append_whitelist?contract=${contract}&wallets=${whitelist}&signature=${signObj.signature}&message=${signObj.message}&wallet=${userAddress}&network=${network}`)
      console.log(append.data);

      const etherscan = getBlockExplorer(network)

      document.getElementById('link').innerHTML = '<a href=' + etherscan + '/tx/' + append.data.output.tx + ' target="blank">See Transaction</a>'

    } catch (error) {
      alert(error);
    }
  }

  return (
    <div className="App">
      <div>
      </div>
      <h1>Contract Factory</h1>
      <p>Must own an access NFT. Mint one here: </p><a href='https://accessnft.netlify.app/' target='blank'>Access NFT</a>
      <div className="card">
        <p id='link'></p>
        <p>{message}</p>
        <button onClick={() => handleButton()}>
          {button}
        </button>
        <br/>
        <div id='owned_contracts'></div>
        <br/>

        <form onSubmit={(e) => DeployContract(e)}>
          <input type='text' id='name' placeholder='name' defaultValue='Test'></input> <br/>
          <input type='text' id='symbol' placeholder='symbol' defaultValue='TEST'></input> <br/>
          <input type='text' id='price' placeholder='price' defaultValue='0.08'></input> <br/>
          <input type='text' id='wlPrice' placeholder='wlPrice' defaultValue='0.06'></input> <br/>
          <input type='text' id='maxSupply' placeholder='maxSupply' defaultValue='5000'></input> <br/>
          <input type='text' id='uri' placeholder='base uri' defaultValue='https://ipfs.io/ipfs/hash'></input> <br/>

          <select type='text' id='network' placeholder='network'>
            <option value='goerli'>Goerli</option> 
            <option value='mainnet'>Mainnet</option>
            <option value='polygon'>Polygon</option>
            <option value='arbitrum'>Arbitrum</option>
            <option value='avax'>Avalanche</option>
            <option value='optimism'>Optimism</option>
          </select> <br/>

          <button type='submit'>Deploy</button>
        </form>
        <br/>
        <form onSubmit={(e) => SetState(e)}>

          <select id='states'>
            <option value='0'>Closed</option>
            <option value='1'>Whitelist Only</option>
            <option value='2'>Public</option>
          </select> <br/>

          <input type='text' id='contract_address' placeholder='contract address'></input> <br/>

          <button type='submit'>Set State</button>
        </form>

        <form onSubmit={(e) => AppendWhitelist(e)}>
          <input type='text' id='whitelist' placeholder='addresses to add to allow list'></input>
          <button type='submit'>Add to Allow List</button>
        </form>
      </div>
    </div>
  )
}

export default App
