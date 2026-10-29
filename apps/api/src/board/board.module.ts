import { Module } from '@nestjs/common';
import { BoardController } from './board.controller.js';
import { BoardService } from './board.service.js';

/** Board domain: one in-memory board per application instance (ADR 0004). */
@Module({
  controllers: [BoardController],
  providers: [
    // The service builds its own domain objects, so the module creates it.
    { provide: BoardService, useFactory: () => new BoardService() },
  ],
})
export class BoardModule {}
