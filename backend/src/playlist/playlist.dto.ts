import { Transform } from 'class-transformer';
import {
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  MinLength,
  IsObject,
  IsIn,
} from 'class-validator';
export class CreatePlaylistDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title: string;
  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  @MaxLength(2048)
  cover_url?: string;
}
export class UpdatePlaylistDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  title?: string;
  @IsOptional()
  @IsUrl({ protocols: ['https'], require_protocol: true })
  @MaxLength(2048)
  cover_url?: string;
}
export class AddTrackDto {
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  track_id: string;
  @IsOptional()
  @IsIn([
    'jamendo',
    'spotify',
    'youtube',
    'jiosaavn',
    'deezer',
    'gaana',
    'itunes',
  ])
  source?: string;
  @IsOptional() @IsObject() track?: Record<string, unknown>;
}
