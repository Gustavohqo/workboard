import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpException,
  Param,
  Patch,
  Post,
  Put,
  UseFilters,
} from '@nestjs/common';
import { BoardValidationFilter } from './board-validation.filter.js';
import { CreateTaskDto } from './dto/create-task.dto.js';
import { MoveTaskDto } from './dto/move-task.dto.js';
import { SetLimitDto } from './dto/set-limit.dto.js';
import {
  type ActionResult,
  type BoardView,
  BoardService,
  type ErrorCode,
} from './board.service.js';

/** HTTP status of each failure code (ADR 0007). */
const STATUS_BY_ERROR: Record<ErrorCode, number> = {
  VALIDATION_ERROR: 400,
  UNKNOWN_COLUMN: 400,
  TASK_NOT_FOUND: 404,
  WIP_LIMIT_REACHED: 409,
  WIP_LIMIT_LOCKED: 409,
};

/** Failures are sent with their status; the body keeps the ADR 0007 shape. */
function respond(result: ActionResult): ActionResult {
  if (result.outcome === 'failed') {
    throw new HttpException(result, STATUS_BY_ERROR[result.error.code]);
  }
  return result;
}

/** HTTP only: each route delegates to the service, which holds the rules. */
@Controller()
@UseFilters(BoardValidationFilter)
export class BoardController {
  constructor(private readonly board: BoardService) {}

  @Get('board')
  getBoard(): BoardView {
    return this.board.getBoard();
  }

  @Put('board/settings')
  setLimit(@Body() body: SetLimitDto): ActionResult {
    return respond(this.board.setLimit(body.wipLimit));
  }

  @Post('tasks')
  @HttpCode(201)
  createTask(@Body() body: CreateTaskDto): ActionResult {
    return respond(this.board.createTask(body.title));
  }

  @Patch('tasks/:id/column')
  moveTask(@Param('id') id: string, @Body() body: MoveTaskDto): ActionResult {
    return respond(this.board.moveTask(id, body.column));
  }

  @Post('board/undo')
  @HttpCode(200)
  undo(): ActionResult {
    return respond(this.board.undo());
  }
}
