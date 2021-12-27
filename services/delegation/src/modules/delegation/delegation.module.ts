import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import delegationConfig from '../../config/delegation';
import { NodeModule } from '../node/node.module';
import { StakingModule } from '../staking/staking.module';
import { Node } from '../node/node.entity';
import { Delegation } from './delegation.entity';
import { DelegationController } from './delegation.controller';
import { DelegationService } from './delegation.service';

@Module({
  imports: [
    ConfigModule.forFeature(delegationConfig),
    TypeOrmModule.forFeature([Delegation, Node]),
    NodeModule,
    StakingModule,
  ],
  controllers: [DelegationController],
  providers: [DelegationService],
  exports: [TypeOrmModule],
})
export class DelegationModule {}
