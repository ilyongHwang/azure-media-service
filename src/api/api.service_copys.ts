import { Injectable } from '@nestjs/common';
import * as msRestNodeAuth from "@azure/ms-rest-nodeauth";
import { AzureMediaServices, AzureMediaServicesModels } from "@azure/arm-mediaservices";
import { UriBuilder } from 'uribuilder';
import { EnabledProtocols } from '@azure/arm-mediaservices/esm/models/mappers';

@Injectable()
export class ApiService {
    private readonly myAzureInfo = {
        armAadAudience :"https://management.core.windows.net",
        aadEndpoint :"https://login.microsoftonline.com/",
        armEndpoint :"https://management.azure.com",

        subscriptionId :"c033c522-abfb-4c51-9b60-033187f184eb",
        liveEventName :"TestLiveEvent",
        resourceGroupName :"live_streaming",
        accountName :"live",
        region :"Korea Central",

        aadClientId :"8178290d-f8df-4915-ac21-95fa5164bffb",
        aadSecret :"_Nto~QO6QoFGZAiOM~Ti6yPp5_9-cXO74G",
        aadTenantId :"083974be-e60e-4ff9-8824-e5a3e38ddde6",
    };
    // private myLiveEvents = null;
    // private myAzureAuth = null;

    /*
    constructor() {
        this.myLiveEvents = msRestNodeAuth.loginWithServicePrincipalSecret(this.myAzureInfo.aadClientId, this.myAzureInfo.aadSecret, this.myAzureInfo.aadTenantId);
    }*/

    async startLiveStreaming() {
        // login
        const azureAuth = await msRestNodeAuth.loginWithServicePrincipalSecret(
            this.myAzureInfo.aadClientId, 
            this.myAzureInfo.aadSecret, 
            this.myAzureInfo.aadTenantId);
        console.log(`login success!`);
        const client = new AzureMediaServices(
            azureAuth, 
            this.myAzureInfo.subscriptionId
            );
        const startInfo = await client.liveEvents.start(
            this.myAzureInfo.resourceGroupName, 
            this.myAzureInfo.accountName, 
            this.myAzureInfo.liveEventName
        )
        console.log(`Success start LiveEvents`);
        
        if (!startInfo) return `Error : start live streaming! ${startInfo}`;

        // Create an Asset for the LiveOutput to use
        const assetName = `liveevent-${this.myAzureInfo.liveEventName}-TestLiveOutput`
        console.log(`Creating an asset named ${assetName}...`)
        const asset = await client.assets.createOrUpdate(
            this.myAzureInfo.resourceGroupName,
            this.myAzureInfo.accountName,
            assetName,
            {

            })
        console.log(`done! \n`)


        // Create the Live Output
        console.log(`Creating the Live Output...`)
        const liveOutputName = "TestLiveOutput";
        const liveOutput = await client.liveOutputs.create(
            this.myAzureInfo.resourceGroupName, 
            this.myAzureInfo.accountName, 
            this.myAzureInfo.liveEventName,
            liveOutputName,
            {
                assetName: assetName,
                archiveWindowLength : "PT8H"
            }
            )
        console.log(`done! \n`)

        // Create the Streaming Locator
        const streamingLocatorName = "TestStreamingLocator"
        console.log(`Creatking the Streaming Locator... (Name : ${streamingLocatorName})`)
        const streamingLocator = await client.streamingLocators.create(
            this.myAzureInfo.resourceGroupName,
            this.myAzureInfo.accountName,
            streamingLocatorName,
            {
                assetName:assetName,
                streamingPolicyName : "Predefined_ClearStreamingOnly",
            })
        console.log(`done! \n`)


        // Get the Default stremaing Endpoint on the account
        const streamingEndPointName = "TestStreamingEndPoint"
        console.log(`Creating a Streaming End Point... (Name : ${streamingEndPointName})`)
        const streamingEndpoint = await client.streamingEndpoints.create(
            this.myAzureInfo.resourceGroupName,
            this.myAzureInfo.accountName,
            streamingEndPointName,
            {
                location:this.myAzureInfo.region,
                scaleUnits: 1
            },
        )
        console.log(`done! \n`)

        // start Streaming EndPoint
        console.log("start streaming EndPoint....")
        const startStreamingEndPoint = await client.streamingEndpoints.start(
            this.myAzureInfo.resourceGroupName,
            this.myAzureInfo.accountName,
            streamingEndPointName
        )
        console.log(`done! \n`)

        
        // Get the url to stream the output
        console.log(`\n\n-----------------`)
        console.log(`Getting the stream url...`)
        const paths = await client.streamingLocators.listPaths(
            this.myAzureInfo.resourceGroupName,
            this.myAzureInfo.accountName,
            streamingLocatorName
        )

        let stringBuilder = ""
        let playerPath = "";
        console.log(`The urls to stream the output from a client:`);

        paths.streamingPaths.forEach(streamingPath => {

            const uriBuilder = new UriBuilder();
            uriBuilder.schema = 'https';
            uriBuilder.host = streamingEndpoint.hostName;
            
            if (streamingPath.paths.length > 0){
                uriBuilder.setPath(streamingPath.paths[0]);
                /*
                        stringBuilder.AppendLine($"\t{paths.StreamingPaths[i].StreamingProtocol}-{paths.StreamingPaths[i].EncryptionScheme}");
                        stringBuilder.AppendLine($"\t\t{uriBuilder.ToString()}");
                        stringBuilder.AppendLine();
                */
               stringBuilder += `\n\t${streamingPath.streamingProtocol}-${streamingPath.encryptionScheme}`
               stringBuilder += `\n\t${uriBuilder.toString()}\n`;


                if (streamingPath.streamingProtocol === "Dash")
                    playerPath = uriBuilder.toString();
    
            }
            
        });

        if (stringBuilder.length > 0) {
            console.log(stringBuilder.toString());
            console.log("Open the following URL to playback the published,recording LiveOutput in the Azure Media Player")
            console.log(`\t https://ampdemo.azureedge.net/?url=${playerPath}&heuristicprofile=lowlatency`);
            console.log(`Continue experimenting with the stream until you are ready to finish.`);
            // console.log(`Press enter to stop the LiveOutput...`);
            
        } else {
            console.log(`No Streaming Paths were detected.  Has the Stream been started?`);
            console.log(`Cleaning up and Exiting...`);
        }

        return `Success : start live streaming!`;
        // 
    }
    
    async stopLiveStreaming() {
        const azureAuth = await msRestNodeAuth.loginWithServicePrincipalSecret(this.myAzureInfo.aadClientId, this.myAzureInfo.aadSecret, this.myAzureInfo.aadTenantId);
        const azureMediaServicesClient = new AzureMediaServices(azureAuth, this.myAzureInfo.subscriptionId);
        const stopInfo = await azureMediaServicesClient.liveEvents.stop(
            this.myAzureInfo.resourceGroupName, 
            this.myAzureInfo.accountName, 
            this.myAzureInfo.liveEventName,
            {removeOutputsOnStop: true}
        )

        return `Success : stop live streaming!`;
    }
    
}
