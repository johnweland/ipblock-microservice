![Deployment](https://github.com/johnweland/ipblock-microservice/workflows/Deployment/badge.svg?branch=develop) [![Contributor Covenant](https://img.shields.io/badge/Contributor%20Covenant-v2.0%20adopted-ff69b4.svg)](code_of_conduct.md) [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
# ipblock-microservice
A "cloud native" service in AWS that will check if an IP address exists in a Firehol blocklist

## Getting Started
These instructions will get you a copy of the project up and running on your local machine for development and testing purposes. See deployment for notes on how to deploy the project on a live system.

### Prerequisites
1. You will need an AWS account. You can create an [AWS account](https://aws.amazon.com/free/) and use the free tier.
2. You will need [nodejs](https://nodejs.org/) version 12 or higher.

### Installing
1. Fork this repository on github
2. clone your copy to you local machine
   ``` bash
   git clone git@github.com:<YOURUSERNAME>/ipblock-microservice.git
   ```
3. Move to your directory, open in `vscode` or your favorite editor and install the dependencies
   ```bash
   cd ipblock-microservice && code . && npm install
   ```
4. Install serverless globally; read the [serverless documentation](https://www.npmjs.com/package/serverless)
   ```bash
   npm install -g serverless
   ```
5. Add your AWS credentials
   ```bash
   serverless config credentials --provider aws --key <YOUR KEY> --secret <YOUR SECRET>
   ```

### Deployment
Deploying can be done with
```bash
serverless deploy
```
### Contributing
Please read CONTRIBUTING.md for details on our code of conduct, and the process for submitting pull requests to us.
### Versioning
We use [SemVer](https://semver.org/) for versioning. For the versions available, see the [tags on this repository](https://github.com/johnweland/ipblock-microservice/tags).

## Built With
* [nodejs](https://nodejs.org/) - framework
* [serverless](https://www.npmjs.com/package/serverless) - npm package
* [aws](https://aws.amazon.com/free/) - deployment platform
* [firehol blocklist-ipsets](https://github.com/firehol/blocklist-ipsets) - filter list

## Authors
* **John Weland** - _initial work_ - [johnweland.me](https://johnweland.me)

See also the list of [contributors](https://github.com/johnweland/ipblock-microservice/graphs/contributors) who participated in this project.

## License
This project is licensed under the MIT License - see the [LICENSE.md](https://github.com/johnweland/ipblock-microservice/blob/main/LICENSE) file for details