# Chaos Enginering Tool for Docker Swarm

This tool can be used to execute stress-ng commands on target nodes in a Docker Swarm. The code inside the System and Monitoring folder should be deployed to the cloud. The System and Monitoring consists of the Java Benchmark App (which is the application we are monitoring) and monitoring services such as Prometheus, Node Exporter, cAdvisor and Grafana. The chaos engineering tool and Locust can be run either locally or on the cloud but should be run outside of the Docker Swarm.


## Installation

Ensure NPM, NodeJS, Nodemon React are installed in the relevant locations.

### Java Benchmark App

1. Create a Docker Swarm on Aws EC2 instances.
2. Copy the the code inside the Java Benchmark App folder to all of the AWS EC2 instances.
3. Build the stress-ng container from the Dockerfile on all of the EC2 instances using the following command inside the Java Benchmark App folder ```docker build -t stress-ng .```
4. Run the command ```docker stack deploy -c docker-compose.yml dockerswarm``` on a manager node to deploy the application to the dockerswarm.

### Locust

1. Ensure the terminal file directory is inside the chaos_engineering_tool/locust folder
2. Run ```docker compose up```

### Chaos Engineering tool

1. Ensure the terminal file directory is inside the chaos_engineering_tool/server folder
2. Run ```npm install```
3. Run ```nodemon index.js```
4. Open a new terminal inside the chaos_engineering_tool/client folder
5. Run ```npm install```
6. Run ```npm start```
7. A frontend webserver should now automatically start and load if not open localhost:3005 in your desired web browser.