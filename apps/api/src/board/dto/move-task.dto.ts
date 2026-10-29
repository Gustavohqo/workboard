import { IsString } from 'class-validator';

/** Body of `PATCH /api/tasks/:id/column`. An unknown column is rejected by the service (RN04). */
export class MoveTaskDto {
  @IsString()
  column: string;
}
