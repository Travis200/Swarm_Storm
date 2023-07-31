import React, { useState, useEffect } from "react";
import "./App.css";
import Axios from "axios";

function App() {
  const [IPAddr, setIPAddr] = useState('');
  const [targetNodes, setTargetNodes] = useState([]);
  const [readyStateNodes, setReadyStateNodes] = useState([]);
  const [stressngCommand, setStressngCommand] = useState('');
  const [experimentRuntime, setExperimentRuntime] = useState('');
  const [networkName, setNetworkName] = useState('');
  const [nodesButtonData, setNodesButtonData] = useState([]);
  const [isNetworkAttack, setIsNetworkAttack] = useState(null);
  const [networkDelayCommand, setNetworkDelayCommand] = useState('');

  const injectChaos = () => {
    if (!isNetworkAttack) {
      if (IPAddr.length !== 0 && targetNodes.length !== 0 && stressngCommand !== 0 && experimentRuntime.length !== 0 && networkName.length !==0) {
        Axios.post('http://localhost:80/api/stress-ng-nodes',
        {
          "ipAddress": IPAddr,
          "targetNodeIDs": targetNodes,
          "stressngCommand" : stressngCommand,
          "experimentTime" : experimentRuntime,
          "targetNetwork": networkName,
        })
        alert("Chaos injected!");
      }
      else{
        alert("Please ensure there are no empty fields.");
      }
    }

    else if (isNetworkAttack) {
        if (IPAddr.length !== 0 && networkDelayCommand !== 0 && networkName.length !==0) {
          Axios.post('http://localhost:80/api/network-packet-delay',
          {
            "ipAddress": IPAddr,
            "targetNetwork": networkName,
            "networkDelayCommand" : networkDelayCommand
          })
          alert("Chaos injected!");
        }
        else{
          alert("Please ensure there are no empty fields.");
        }
    }
    }

  const targetClick = (nodeID) => {
    if (targetNodes.includes(nodeID)) {
      setTargetNodes((current) =>
      current.filter((element) => {
        return element !== nodeID;
      })
    );
    }

    else if (readyStateNodes.includes(nodeID)) {
      setTargetNodes(targetNodes => targetNodes.concat(nodeID));
    }

    else {
      alert("This node's state is currently down and not ready. Please try another node or ensure the node is ready.");
    }
  };

  async function getNodes() {
    if (IPAddr.length === 0) {
      alert("Please ensure you have entered the IP Address");
    }
    else {
    const nodes = await Axios.get(`http://localhost:80/api/nodes/${IPAddr}`)
    .catch(function (error) {
    alert(error);
  });
      let nodesButtonDataLocal = [];
      for (let i = 0; i < nodes.data.length; i++) {
        nodesButtonDataLocal.push(
          {
          id: nodes.data[i].ID,
          role: nodes.data[i].Spec.Role
        }
        );
        setNodesButtonData(nodesButtonDataLocal);
        if (nodes.data[i].Status.State === "ready") {
          setReadyStateNodes(readyStateNodes => readyStateNodes.concat(nodes.data[i].ID))
        }
      }
    }
  }  

  return (
    <div className="App">
      <div className="text">
      <h1>Chaos Engineering Tool</h1>
      <label>
        Master Node IP Address: 
      </label>
      <input name="ipAddress" onChange={(e) => {
        setIPAddr(e.target.value);
      }}/>
      <button id="button" onClick={getNodes}>Go</button> 
      </div>

      <div style={{display: nodesButtonData.length> 0 ? 'block' : 'none'}}>
      <h3 form>Choose Type Of Attack:</h3>
          <button id="button" style={{ 
            backgroundColor: 
            isNetworkAttack === false || isNetworkAttack === null ? "grey" : "orange" 
          }}onClick={() => {if (isNetworkAttack === false || isNetworkAttack === null) {setIsNetworkAttack(true)}}}>
          Network Delay Attack<br/>
          </button>
          <button id="button" style={{
            backgroundColor: 
            isNetworkAttack === true || isNetworkAttack === null ? "grey" : "orange" 
          }}onClick={() => {if (isNetworkAttack === true || isNetworkAttack === null) {setIsNetworkAttack(false)}}}>
          Stress-ng (CPU / Memory) Attack<br/>
          </button>
        </div>

        
        <div style={{display: isNetworkAttack === true ? 'block' : 'none'}}>
        <form>
        <label>
          Docker Network Name: 
        </label>
        <input name="networkName" onChange={(e) => {
            setNetworkName(e.target.value);
        }}/>
        <br/>
        <label>
          Network Delay Command:
        </label>
        <input name="networkDelayCommand" onChange={(e) => {
            setNetworkDelayCommand(e.target.value);
        }}/>
        <br/>
        <button id="button" onClick={injectChaos}>Inject Chaos</button>
        </form>
        </div>



      <div style={{display: nodesButtonData.length>0 && isNetworkAttack === false ? 'block' : 'none'}}>
      <h3 form >Choose Target Nodes:</h3>
        {nodesButtonData.map(n => (
          <button id="button" key={n.id} style={{
            backgroundColor: 
            targetNodes.includes(n.id) ? "orange" :
            readyStateNodes.includes(n.id)? "#73AB95" : "grey" 
          }}onClick={() => targetClick(n.id)}><span style={{ fontWeight: 'bold' }}>Role: </span>{n.role}<br/>
          <span style={{ fontWeight: 'bold' }}>Node ID: </span>{n.id}<br/>
          </button>
        ))}
        </div>
        
        <form style={{display: targetNodes.length>0 && isNetworkAttack === false ? 'block' : 'none'}}>
        <label>
          Docker Network Name: 
        </label>
        <input name="networkName" onChange={(e) => {
            setNetworkName(e.target.value);
        }}/>
        <br/>
        <label>
          Stress-ng Command: 
        </label>
        <input name="stressngCommand" onChange={(e) => {
            setStressngCommand(e.target.value);
        }}/>
        <br/>
        <label>
          Experiment Runtime (seconds):
        </label>
        <input name="experimentRuntime" onChange={(e) => {
            setExperimentRuntime(e.target.value);
        }}/>
        <br/>
        <button id="button" onClick={injectChaos}>Inject Chaos</button>
        </form>
    </div>
  );
} 

export default App;
