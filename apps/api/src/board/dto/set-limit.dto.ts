import { IsInt, Min } from 'class-validator';

/** Body of `PUT /api/board/settings` (ADR 0006). */
export class SetLimitDto {
  @IsInt()
  @Min(1)
  wipLimit: number;
}
