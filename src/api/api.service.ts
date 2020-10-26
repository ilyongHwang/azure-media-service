import { Injectable } from '@nestjs/common';
import * as msRestNodeAuth from "@azure/ms-rest-nodeauth";
import { Assets, AzureMediaServices, AzureMediaServicesModels, LiveEvents, LiveOutputs, StreamingEndpoints, StreamingLocators } from "@azure/arm-mediaservices";
import { UriBuilder } from 'uribuilder';
import { EnabledProtocols, LiveEventInput } from '@azure/arm-mediaservices/esm/models/mappers';
import { RestResponse, ServiceClientCredentials } from '@azure/ms-rest-js';
import { ConfigService } from '@nestjs/config';
import { throwError } from 'rxjs';
import { LiveOutput, StreamingEndpoint, StreamingLocator } from '@azure/arm-mediaservices/esm/models';

@Injectable()
export class ApiService {
    private azureAuth;
    private mediaService : AzureMediaServices;
    private liveEvent;
    private asset : Assets; 
    private liveOutput : LiveOutputs; 
    private streamingLocator : StreamingLocators; 
    private streamingEndPoint; // ?
    private injestUrl;
    private playerPath;

    private resourceGroupName = this.configService.get<string>("resourceGroupName")
    private accountName = this.configService.get<string>("accountName")
    private region = this.configService.get<string>("region")
        
    private liveEventName = this.configService.get<string>("liveEventName")
    private liveOutputName = this.configService.get<string>("liveOutput")
    private assetName = `liveevnt-${this.liveEventName}-${this.liveOutputName}`
    private streamingLocatorName = this.configService.get<string>("streamingLocator")
    private streamingEndpointName = this.configService.get<string>("streamingEndpoint")

    constructor(private readonly configService: ConfigService){}

    
    // 초기화 및 live Event 실행
    async initLiveEvent() {
        // 1. Azure Credential 획득
        console.log(`1. Azure Credential 획득 중 ...`)
        this.azureAuth = await msRestNodeAuth.loginWithServicePrincipalSecret(
            this.configService.get<string>("aadClientId"),
            this.configService.get<string>("aadSecret"),
            this.configService.get<string>("aadTenantId")
        )
        console.log(`1. done!\n`)

        // 2. Media Service 연결
        console.log(`2. Media Service 연결 중 ....`)
        this.mediaService = new AzureMediaServices(
            this.azureAuth,
            this.configService.get<string>('subscriptionId'),
        )
        console.log(`2. done!\n`)


        // 3. Live Event 확인 및 생성
        console.log(`3. Live Event 있는지 확인 중 ....`)
        const liveEventResult = await this.mediaService.liveEvents.get(
            this.resourceGroupName,
            this.accountName,
            this.liveEventName
        ).catch((err) => {
            console.log(err);
            return err;
        })
        
        if (liveEventResult.hasOwnProperty('error')) {
            console.log(`생성중...`)
            this.liveEvent = await this.mediaService.liveEvents.create(
                this.resourceGroupName,
                this.accountName,
                this.liveEventName,
                {
                    location : this.region,
                    input: { streamingProtocol: 'RTMP' }
                }
            ).then(async (res) => {
                return await this.mediaService.liveEvents.get(
                    this.resourceGroupName,
                    this.accountName,
                    this.liveEventName
                )
            })
            .then(res => {
                this.liveEvent = res;
                this.injestUrl = res.input.endpoints[0].url;
                console.log(this.injestUrl)
            })
            .catch(err => {
                console.log(err);
                return err;
            })
        } else {
            console.log(`연결중...`)
            this.liveEvent = liveEventResult;
            this.injestUrl = liveEventResult.input.endpoints[0].url;
            console.log(this.injestUrl)
        }

        await this.mediaService.liveEvents.start(
            this.resourceGroupName,
            this.accountName,
            this.liveEventName
        ).then(res=>console.log(res))
        .catch(err=>console.log(err))
        console.log(`3. done!\n`)

        // 4. Asset 확인 및 생성
        console.log(`4. Asset 확인 및 생성 중...`)
        this.asset = await this.mediaService.assets.createOrUpdate(
            this.resourceGroupName,
            this.accountName,
            this.assetName,
            {}
        )
        .then(res => console.log(res))
        .catch((err) => {
            console.log(err)
            return err
        })
        
        console.log(`4. done!\n`)
            
        // 5. Live Output 확인 및 생성
        console.log(`5. Live Output 확인 및 생성 중...`)
        const liveOutputResult = await this.mediaService.liveOutputs.get(
            this.resourceGroupName,
            this.accountName,
            this.liveEventName,
            this.liveOutputName
        ).catch(err=>{
            console.log(err)
            return err
        })
        
        if(liveOutputResult.hasOwnProperty('error')) {
            console.log(`생성중...`)
            this.liveOutput = await this.mediaService.liveOutputs.create(
                this.resourceGroupName,
                this.accountName,
                this.liveEventName,
                this.liveOutputName,
                {
                    archiveWindowLength : "PT8H",
                    assetName: this.assetName
                }
            ).catch(err => err)
        } else {
            console.log(`연결중...`)
            this.liveOutput = liveOutputResult
        }
        console.log(`5. done!\n`)
            
        // 6. Streaming Locator 확인 및 생성
        console.log(`6. Streaming Locator 확인 및 생성 중...`)
        const streamingLocatorResult = await this.mediaService.streamingLocators.get(
            this.resourceGroupName,
            this.accountName,
            this.streamingLocatorName
        ).catch(err => err)
        if(streamingLocatorResult.hasOwnProperty('error')){
            console.log(`생성중...`)
            this.streamingLocator = await this.mediaService.streamingLocators.create(
                this.resourceGroupName,
                this.accountName,
                this.streamingLocatorName,
                {
                    assetName: this.assetName,
                    streamingPolicyName :"Predefined_ClearStreamingOnly",
                }
            ).catch(err => err)

        } else {
            console.log(`연결중...`)
            this.streamingEndPoint = streamingLocatorResult
        }
        console.log(`6. done!\n`)
            
        // 7. Streaming End Point 확인 및 생성
        console.log(`7. Streaming End Point 확인 및 생성 중...`)
        const streamingEndPointResult = await this.mediaService.streamingEndpoints.get(
            this.resourceGroupName,
            this.accountName,
            this.streamingEndpointName
        ).catch(err => err)
        if(streamingEndPointResult.hasOwnProperty("error")) {
            console.log(`생성중...`)
            await this.mediaService.streamingEndpoints.create(
                this.resourceGroupName,
                this.accountName,
                this.streamingEndpointName,
                {
                    location: this.region,
                    scaleUnits: 1
                }
            ).then(async res => {
                this.streamingEndPoint = await this.mediaService.streamingEndpoints.get(
                    this.resourceGroupName,
                    this.accountName,
                    this.streamingEndpointName
                ).catch(err => err)
            })
            .catch(err => err)
        } else {
            console.log(`연결중...`)
            this.streamingEndPoint = await this.mediaService.streamingEndpoints.get(
                this.resourceGroupName,
                this.accountName,
                this.streamingEndpointName
            ).catch(err => err)
        }
        console.log(`7. done!\n`)

        return {
            message : `Success init Live Event!`,
            injestUrl : this.injestUrl
        };
    }


    // 시작
    async startLiveEvent() {
        /*
        console.log(`1. Live Events 시작 중...`)
        const liveEventStartResult = await this.mediaService.liveEvents.start(
            this.resourceGroupName,
            this.accountName,
            this.liveEventName
        ).catch(err=>console.log(err))
        // console.log(liveEventStartResult)
        console.log(`1. done!\n`)
        */
        
        console.log(`1. Streaming Endpoint 시작 중 ...`)
        await this.mediaService.streamingEndpoints.start(
            this.resourceGroupName,
            this.accountName,
            this.streamingEndpointName
        )
        .then(res => console.log(`성공 : ${res}`))
        .catch(err=> console.log(`에러! : ${err}`))
        console.log(`1. done!\n`)

        console.log(`2. streaming url 얻는 중 ...`)
        
        await this.mediaService.streamingLocators.listPaths(
            this.resourceGroupName,
            this.accountName,
            this.streamingLocatorName
        )
        .then(res => {
            console.log(this.streamingEndPoint)
            console.log(res)

            const uriBuilder = new UriBuilder();
            

            res.streamingPaths.forEach(element => {
                console.log(element.paths)
                uriBuilder.schema = 'https'
                uriBuilder.host = this.streamingEndPoint.hostName

                if (element.paths.length > 0) {
                    uriBuilder.setPath(element.paths[0])
                }
            })
            this.playerPath = uriBuilder.toString()
        })
        .catch(err=> console.log(`에러 ! : ${err}`))
        console.log(`2. done!\n`)
        console.log(this.playerPath)
        
        return {
            message : `Success Start Live Event!`,
            playerPath : this.playerPath
        }
    }
    

    // 종료!
    async stopLiveEvents() {
        console.log(`1. streaming End Point 종료 중...`)
        await this.mediaService.streamingEndpoints.stop(
            this.resourceGroupName,
            this.accountName,
            this.streamingEndpointName
        )
        .then((res)=>console.log(res))
        .catch(err=>console.log(err))
        console.log(`done!\n`)

        console.log(`2. Live Events 종료 중...`)
        const liveEventStopResult = await this.mediaService.liveEvents.stop(
            this.resourceGroupName,
            this.accountName,
            this.liveEventName,
            { removeOutputsOnStop : true }
        )
        .then((res)=>console.log(res))
        .catch(err=>console.log(err))
        console.log(`done!\n`)

        return `Success!`
    }


    // Resource 제거
    async removeLiveEvents() {

    }


    // MediaService 얻기! (api server re-start)
    async getMediaService( ) {
        // 1. Azure Credential 획득
        console.log(`1. Azure Credential 획득 중 ...`)
        this.azureAuth = await msRestNodeAuth.loginWithServicePrincipalSecret(
            this.configService.get<string>("aadClientId"),
            this.configService.get<string>("aadSecret"),
            this.configService.get<string>("aadTenantId")
        )
        console.log(`1. done!\n`)

        // 2. Media Service 연결
        console.log(`2. Media Service 연결 중 ....`)
        this.mediaService = new AzureMediaServices(
            this.azureAuth,
            this.configService.get<string>('subscriptionId'),
        )
        console.log(`2. done!\n`)

        return {
            message: `Success Get Media Servce`
        }
    }
    
}
