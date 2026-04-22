import { IsString, IsOptional, IsObject } from 'class-validator';

export class CreateErrorLogDto {
  @IsString()
  context: string;

  @IsString()
  message: string;

  @IsOptional()
  @IsString()
  stack?: string;

  @IsOptional()
  @IsObject()
  metadata?: Record<string, any>;

  @IsOptional()
  @IsString()
  userId?: string;

  @IsOptional()
  @IsString()
  deviceInfo?: string;
}
