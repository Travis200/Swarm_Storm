const express = require('express');
const app = express();
const cors = require('cors');
const Axios = require('axios');
const bodyParser = require('body-parser');

const PORT = 80;

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

async function getNodesData(ipAddress) {
    try {
        let swarmNodes = await Axios.get(`http://${ipAddress}:2375/v1.41/nodes`);
        let swarmNodesArr = swarmNodes.data;
        return swarmNodesArr;
    }
    catch (err) {
        console.error(err);
    }
}

async function getNodeIDKeyValues(ipAddress) {
    nodeIDKeyValues = {};
    nodeDataArr = await getNodesData(ipAddress);

    for (let i = 0; i < nodeDataArr.length; i++) {
        nodeIDKeyValues[nodeDataArr[i].ID] =
        {
            "Version": nodeDataArr[i].Version.Index,
            "Role": nodeDataArr[i].Spec.Role,
            "Availability": nodeDataArr[i].Spec.Availability,
            "Labels": nodeDataArr[i].Spec.Labels
        }
    }
    return nodeIDKeyValues;
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

app.get("/api/nodes/:ipAddr", async (req, res) => {
    const ipAddress = req.params.ipAddr;
    try {
        const nodeDataArr = await getNodesData(ipAddress);
        if (nodeDataArr) {
            res.status(200).send(nodeDataArr);
        }
        else {
            res.status(404).send("Uh oh. It looks like an error occured.");
        }
    }
    catch (err) {
        res.status(404);
    }
});

app.post("/api/stress-ng-nodes", async (req, res) => {

    try {
        const ipAddress = req.body.ipAddress;
        const targetNodeIDs = req.body.targetNodeIDs;
        const experimentTime = parseInt(req.body.experimentTime);
        const stressngCommand = req.body.stressngCommand;
        const targetNetwork = req.body.targetNetwork;
        let nodeIDKeyValues = await getNodeIDKeyValues(ipAddress);

        // Set all nodes chaos targets boolean to False (may still be set to true from previous experiment)
        for (let i = 0; i < nodeDataArr.length; i++) {
            await Axios.post(`http://${ipAddress}:2375/v1.41/nodes/${nodeDataArr[i].ID}/update?version=${nodeIDKeyValues[nodeDataArr[i].ID].Version}`,
                {
                    "Role": nodeIDKeyValues[nodeDataArr[i].ID].Role,
                    "Availability": nodeIDKeyValues[nodeDataArr[i].ID].Availability,
                    "Labels": {
                        "chaostarget": "False",
                        "grafana": (nodeIDKeyValues[nodeDataArr[i].ID].Labels.grafana === undefined) ? "False" : (nodeIDKeyValues[nodeDataArr[i].ID].Labels.grafana === "True" ? "True" : "False")
                    }
                }
            );
        }

        nodeIDKeyValues = await getNodeIDKeyValues(ipAddress);

        // Set target nodes chaos target boolean to True
        for (let i = 0; i < targetNodeIDs.length; i++) {
            await Axios.post(`http://${ipAddress}:2375/v1.41/nodes/${targetNodeIDs[i]}/update?version=${nodeIDKeyValues[targetNodeIDs[i]].Version}`,
                {
                    "Role": nodeIDKeyValues[targetNodeIDs[i]].Role,
                    "Availability": nodeIDKeyValues[targetNodeIDs[i]].Availability,
                    "Labels": {
                        "chaostarget": "True",
                        "grafana": nodeIDKeyValues[targetNodeIDs[i]].Labels.grafana === "True" ? "True" : "False"
                    }
                }
            );
        }

        // Create service to deploy stress-ng task to target nodes
        await Axios.post(`http://${ipAddress}:2375/v1.41/services/create`,
            {
                "Name": "stress-ng-test",
                "TaskTemplate": {
                    "ContainerSpec": {
                        "Image": "stress-ng",
                        "Command": [
                            "sh", "-c", stressngCommand
                        ],
                        "TTY": true
                    },
                    "Placement": {
                        "Constraints": [
                            "node.labels.chaostarget==True"
                        ]
                    }
                },
                "Mode": {
                    "Global": {}
                },
                "Networks": [
                    {
                        "Target": targetNetwork
                    }
                ]
            }
        )

        res.send("Chaos injected.");
        // Remove service before experiment completes so task is not redeployed
        await sleep((experimentTime * 1000) - 10000);
        Axios.delete(`http://${ipAddress}:2375/v1.41/services/stress-ng-test`);
        console.log('Service now removed.');
    }
    catch (err) {
        console.error(err);
    }
});

app.post("/api/network-packet-delay", async (req, res) => {
    try {
        const ipAddress = req.body.ipAddress;
        const networkToDelay = req.body.networkToDelay;
        const experimentTime = req.body.experimentRuntime;

        // Create a container to inject network packet delays
        // await Axios.post(`http://${ipAddress}:2375/v1.41/services/create?name=network_delay`,
        //     {
        //         "Image": "stress-ng",
        //         "Command": [
        //             "sh", "-c", networkDelayCommand
        //         ],
        //         "TTY": true,

        //         "HostConfig": {
        //             "NetworkMode": targetNetwork,
        //             "CapAdd": [
        //                 "NET_ADMIN"
        //             ],
        //         }
        //     }
        // );

        await Axios.post(`http://${ipAddress}:2375/v1.41/services/create`,
        {
            "Name": "network-test",
            "TaskTemplate": {
                "ContainerSpec": {
                    "Image": "stress-ng",
                    "Command": [
                        "sh", "-c", `tc qdisc add dev ${networkToDelay} root netem delay 500ms; sleep ${experimentTime}; tc qdisc del dev ${networkToDelay} root netem delay 500ms`
                    ],
                    "CapabilityAdd" : [
                        "CAP_NET_ADMIN"
                    ],
                    "TTY": true
                },
                "Placement": {
                    "Constraints": [
                        "node.role!=manager"
                    ]
                }

            },
            "Mode": {
                "ReplicatedJob": {
                    "MaxConcurrent" : 1,
                    "TotalCompletions": 1
                }
            },
            "Networks": [
                {
                    "Target": "host"
                }
            ]
        }
    )

    console.log(networkToDelay);
    console.log(experimentTime);


    // await sleep((experimentTime * 1000) - 10000);
    // Axios.delete(`http://${ipAddress}:2375/v1.41/services/network-test`);
    // console.log('Service now removed.');

    }
    catch (err) {
        console.error(err);
    }
});




app.listen(PORT, () => {
    console.log(`Running on port ${PORT}`);
});