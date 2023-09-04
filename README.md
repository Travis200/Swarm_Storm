# Chaos Enginering Tool for Docker Swarm

This tool can be used to inject both CPU / memory faults and also inject network latency into a Docker Swarm. The tool utilises stress-ng to inject CPU / memory faults into the target nodes of the Docker Swarm. The networking tool utilises iproute2 to inject network delays into the Docker Swarm. 
The code inside the System and Monitoring folder should be deployed to the cloud. The System and Monitoring consists of the Java Benchmark App (which is the application we are performing the chaos experiments on) and monitoring services such as Prometheus, Node Exporter, cAdvisor and Grafana. The chaos engineering tool and Locust can be run either locally or in the cloud but should be run outside of the Docker Swarm.


## Installation

Ensure Docker (and Docker compose) NPM, NodeJS, Nodemon, and React are installed on your local machine, then run npm install in both the client and server directories.
Ensure Docker is installed on all of the AWS EC2 instances.


### Set Up System and Monitoring

1. Create an AWS account if you do not already have one and sign in (https://aws.amazon.com).
2. Create a security group so the Docker Daemon.
3. Create AWS EC2 instances.
4. Install Docker on each EC2.
5. Modify so the docker daemon is exposed.
6. Restart docker daemon.
7. Copy across locustfile.py, docker-compose.yml and prometheus.yml from this repo to the master node.
8. Pull chaos engineering image using the command ```docker pull travis1220/chaos-engineering```
9. Add grafana=True label to manager node of docker swarm.
10. Deploy the stack to the swarm on the manager node using the command ```docker stack deploy -c docker-compose.yml dockerswarm```

### Set Up Locust

1. On your local machine ensure the terminal file directory is inside the chaos_engineering_tool/locust folder.
2. Run ```docker compose up```

### Set Up Chaos Engineering tool

1. On your local machine ensure the terminal file directory is inside the chaos_engineering_tool/server folder.
2. Run ```npm install```
3. Run ```node index.js```
4. Open a new terminal inside the chaos_engineering_tool/client folder.
5. Run ```npm install```
6. Run ```npm start```
7. A frontend webserver should now automatically start and load if not open localhost:3005 in your desired web browser.