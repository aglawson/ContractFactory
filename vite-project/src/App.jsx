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
  const [owned, setOwned] = useState('');
  const m_etherscan = 'https://etherscan.io/'
  const g_etherscan = 'https://goerli.etherscan.io/'

  async function handleButton () {
    if(button === 'Connect Wallet') {
      await getSigner();
    } else if(button === 'Sign In') {
      await DeployContract('Howdy', 'HOWDY', '10000000000000000', '0', 10000, 'goerli')//SignIn();
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

  async function SignIn() {
    const message = Date.now().toString();
    const signature = await signer.signMessage(message)

    //const auth = await axios.get(`${URL}signature_auth?wallet=${userAddress}&message=${message}&signature=${signature}`);
    const owned_contracts = await axios.get(`${URL}get_owned_contracts?wallet=${userAddress}&message=${message}&signature=${signature}`);
    console.log(owned_contracts)
    let oc = '';
    for(let i = 0; i < owned_contracts.data.output.data.length; i++) {
      oc += `${owned_contracts.data.output.data[i]}, `
    }
    setOwned(oc);
    // const notice = auth.data === true ? 'Login Successful' : 'Login Failed';
    // alert(notice)
  }

  async function DeployContract(name, symbol, price, wlPrice, maxSupply, network) {
    const message = Date.now().toString();
    const signature = await signer.signMessage(message)

    const deploy = await axios.get(`${URL}deploy_nft?name=${name}&symbol=${symbol}&price=${price}&whitelist_price=${wlPrice}&maxSupply=${maxSupply}&wallet=${userAddress}&message=${message}&signature=${signature}&network=${network}`);
    console.log(deploy.data.output.data);

    const etherscan = network == 'goerli' ? g_etherscan : m_etherscan;

    document.getElementById('link').innerHTML = '<a href=' + etherscan + '/address/' + deploy.data.output.data + ' target="blank">See Contract</a>'
  }

  return (
    <div className="App">
      <div>
      </div>
      <h1>Contract Factory</h1>
      <div className="card">
        <p id='link'></p>
        <p>{message}</p>
        <button onClick={() => handleButton()}>
          {button}
        </button>
        <p>{owned}</p>
      </div>
    </div>
  )
}

export default App
