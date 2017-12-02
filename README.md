# Etherlynk
Decentralized communications for Ethereum

In a sentence, Etherlynk is a unified communication protocol that enables the users of enterprise [DApps](https://ethereum.stackexchange.com/questions/383/what-is-a-dapp) (decentralized applications) to communicate and collaborate with each other within the context of the business transactions that binds them.

Etherlynk is <b>not</b> a communication protocol between DApps like [Whisper](https://github.com/ethereum/wiki/wiki/Whisper), <b>nor</b> is it a communication protocol for integrating telecommunication devices to the Ethereum network. To do that you would need an Ethereum based telephony API like [EtherVox](http://ethervox.gltd.net/home) and access to the infastructure provided by the [ComChain Alliance](http://www.comchainalliance.org/). 

Etherlynk is about initiating regulated and compliant enterprise communications directly from the context of business transactions happening inside a DApp. The purpose is to create from <b>source</b>, a consistent timeline of business transactions and supporting communication events side by side in the Ethereum block chain.

## Use case
- Members of the same working team (including external partners) need to stay connected to each other for the life span of a business project or the execution of a business task. To remain competitive, team members need to disseminate information to colleagues across global subsidiaries immediately and quickly. The conventional technology for this is known as intercom and hoot 'n' holler when the connection is persistent.

- Buy side, sell side and brokers communicate with each other directly over dedicated private inter-company connections (trunks, lines) to transact business and a need to have compliance adherence with a decentralized media recording platform. This involves the use of Ethereum to store the communications meta-data as ledger transactions on the block chain including a link to the recorded audio and video media stored for prosperity on a decentralized IPFS network.

- Communication between the general public using DApps and members of business teams (agents) representing the business groups transacting with the general public consumers. This class of communication is mostly in-bound.

## Specs
- Web based API. Will require the use of WebRTC for multi-user audio/video conferencing.
- REST API for communication control. 1-1, 1-N and N-1 type signalling.
- High Level API always exposed to the DApps user interface (UI).
- Real Time Communication with very low latency, resilience, high availability, simplified management.
- No single point of failure.
- Conversations start out peer-to-peer and transparently upgrade to a conference when three or more participants are involved.
- Conversations downgrade from a conference to peer-to-peer when only two participants are involved.
- Conferences can be hosted on a Media Control Unit (MCU) or a Selective Forwarding Unit (SFU).
- Overall architecture is an decentralized federation of domains each running a cluster of media servers.





