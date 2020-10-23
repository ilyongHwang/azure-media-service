import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
// import { AppController } from './app.controller';
// import { AppService } from './app.service';
// import { ApiController } from './api/api.controller';
// import { ApiService } from './api/api.service';
import { ApiModule } from './api/api.module';

@Module({
  imports: [ApiModule, ConfigModule.forRoot(
    { envFilePath: '.development.env' })],
  controllers: [],
  providers: [],  
})
export class AppModule {}
