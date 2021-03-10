import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  Index,
  OneToMany,
} from 'typeorm';
import { ClaimEntity } from './claim.entity';

@Entity('snapshot')
export class SnapshotEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Index({ unique: true })
  address: string;

  @Column({ name: 'available_to_be_claimed', default: 0 })
  availableToBeClaimed: number;

  @Column({ name: 'total_locked', default: 0 })
  totalLocked: number;

  @Column({ name: 'total_claimed', default: 0 })
  totalClaimed: number;

  @OneToMany(
    type => ClaimEntity,
    claim => claim.address,
  )
  claims: ClaimEntity[];
}
