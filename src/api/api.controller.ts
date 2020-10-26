import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiService } from './api.service';

@Controller('api')
export class ApiController {
    constructor(private readonly apiService: ApiService){}

    @Get('init')
    initLiveEvent() : Promise<{message: string,injestUrl:string}>{
        return this.apiService.initLiveEvent();
    }

    @Get('start')
    startLiveEvent() : Promise<{message: string,playerPath:string}> {
        return this.apiService.startLiveEvent();
    }

    @Get('stop')
    stopLiveEvent() : Promise<string> {
        return this.apiService.stopLiveEvents();
    }
    
    @Get('media-service')
    getMediaService() : Promise<{message:string}> {
        return this.apiService.getMediaService();
    }

    /*
    @Get('stop')
    stopLiveStreaming() : Promise<string>{
        return this.apiService.stopLiveStreaming();
    }*/

}
