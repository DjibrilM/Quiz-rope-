import { Module, Logger } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from './auth/auth.module';
import { ChildrenModule } from './children/children.module';
import { MatchModule } from './match/match.module';
import { QuestionModule } from './question/question.module';
import { RealtimeModule } from './realtime/realtime.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { HomeworkModule } from './homework/homework.module';
import configuration from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [configuration],
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const uri = configService.get<string>('mongodb.uri');
        const logger = new Logger('MongoDB');
        if (!uri || uri.includes('localhost')) {
          logger.warn(
            'Using default local MongoDB. Set MONGODB_URI for production.',
          );
        }
        return {
          uri: uri || 'mongodb://localhost:27017/quizrope',
          connectionFactory: (connection) => {
            connection.on('connected', () => logger.log('MongoDB connected'));
            connection.on('error', (err) =>
              logger.error('MongoDB connection error:', err.message),
            );
            return connection;
          },
        };
      },
      inject: [ConfigService],
    }),
    AuthModule,
    ChildrenModule,
    MatchModule,
    QuestionModule,
    RealtimeModule,
    SubscriptionModule,
    HomeworkModule,
  ],
})
export class AppModule {}
