import { Controller, Get } from '@nestjs/common';
import { ApiService } from './api.service';

@Controller('api')
export class ApiController {
    constructor(private apiService: ApiService){}

    @Get('start')
    startLiveStreaming() : Promise<string>{
        return this.apiService.startLiveStreaming();
    }

    @Get('stop')
    stopLiveStreaming() : Promise<string>{
        return this.apiService.stopLiveStreaming();
    }

}
