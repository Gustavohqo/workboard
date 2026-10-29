import {
  type ArgumentsHost,
  BadRequestException,
  Catch,
  type ExceptionFilter,
  Injectable,
} from '@nestjs/common';
import type { Response } from 'express';
import { BoardService } from './board.service.js';

/**
 * Turns a rejected request body into the failure shape of ADR 0007, with the
 * current board, so the client never has to ask for it separately.
 */
@Injectable()
@Catch(BadRequestException)
export class BoardValidationFilter implements ExceptionFilter {
  constructor(private readonly board: BoardService) {}

  catch(_exception: BadRequestException, host: ArgumentsHost): void {
    const response = host.switchToHttp().getResponse<Response>();
    response.status(400).json({
      outcome: 'failed',
      error: { code: 'VALIDATION_ERROR', message: 'Request body is invalid.' },
      board: this.board.getBoard(),
    });
  }
}
