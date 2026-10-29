import { Module } from '@nestjs/common';
import { BoardModule } from './board/board.module.js';

/** Root application module. Domain modules are imported here. */
@Module({
  imports: [BoardModule],
})
export class AppModule {}
