import { IsString } from 'class-validator';

/** Body of `POST /api/tasks`. A blank title is rejected by the service (RN18). */
export class CreateTaskDto {
  @IsString()
  title: string;
}
