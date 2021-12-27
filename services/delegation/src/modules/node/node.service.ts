import * as ethers from 'ethers';
import * as moment from 'moment';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository, Connection, MoreThan } from 'typeorm';
import { ProfileService } from '../profile/profile.service';
import { Node } from './node.entity';
import { NodeCommission } from './node-commission.entity';
import { CreateNodeDto } from './dto/create-node.dto';
import { UpdateNodeDto } from './dto/update-node.dto';
import { CreateCommissionDto } from './dto/create-commission.dto';
import { ProfileNotFoundException } from '../profile/exceptions/profile-not-found.exception';
import { NodeAlreadyExistsException } from './exceptions/node-already-exists.exception';
import { NodeNotFoundException } from './exceptions/node-not-found-exception';
import { NodeDoesntBelongToUserException } from './exceptions/node-doesnt-belong-to-user.exception';
import { NodeCantBeDeletedException } from './exceptions/node-cant-be-deleted.exception';
import { NodeDoesntSupportCommissionsException } from './exceptions/node-doesnt-support-commissions';
import { NodeProofInvalidException } from './exceptions/node-proof-invalid';
import { CantAddCommissionException } from './exceptions/cant-add-commission';

@Injectable()
export class NodeService {
  constructor(
    @InjectRepository(Node)
    private nodeRepository: Repository<Node>,
    @InjectRepository(NodeCommission)
    private nodeCommissionRepository: Repository<NodeCommission>,
    private connection: Connection,
    private config: ConfigService,
    private profileService: ProfileService,
  ) {}

  async createNode(user: number, nodeDto: CreateNodeDto): Promise<Node> {
    nodeDto.address = ethers.utils.getAddress(nodeDto.address);

    const nodeExists = await this.nodeRepository.findOne({
      address: nodeDto.address,
    });

    if (nodeExists) {
      throw new NodeAlreadyExistsException(nodeDto.address);
    }

    const node = Node.fromDto(nodeDto);
    node.user = user;

    try {
      const digest = ethers.utils.keccak256(node.address);
      const recoveredAddress = ethers.utils.recoverAddress(
        digest,
        nodeDto.addressProof,
      );

      if (recoveredAddress !== node.address) {
        throw new NodeProofInvalidException(node.address);
      }
    } catch (e) {
      throw new NodeProofInvalidException(node.address);
    }

    if (node.isMainnet()) {
      try {
        await this.profileService.get(user);
      } catch (e) {
        throw new ProfileNotFoundException(user);
      }
    }

    await this.connection.transaction(async (manager) => {
      await manager.save(node);

      if (node.isMainnet()) {
        const commission = NodeCommission.fromValue(nodeDto.commission);
        commission.node = node;
        await manager.save(commission);
      }
    });

    return node;
  }

  async updateNode(
    user: number,
    nodeId: number,
    nodeDto: UpdateNodeDto,
  ): Promise<Node> {
    const node = await this.nodeRepository.findOne(nodeId);

    if (!node) {
      throw new NodeNotFoundException(nodeId);
    }
    this.checkNodeBelongsToUser(node, user);

    if (nodeDto.name) {
      node.name = nodeDto.name;
    }

    if (nodeDto.ip) {
      node.ip = nodeDto.ip;
    }

    return this.nodeRepository.save(node);
  }

  async createCommission(
    user: number,
    node: number,
    commissionDto: CreateCommissionDto,
  ): Promise<Node> {
    const n = await this.findNodeOrThrow(node);
    this.checkNodeBelongsToUser(n, user);

    if (n.isTestnet()) {
      throw new NodeDoesntSupportCommissionsException(n.id);
    }

    const coolingOffPeriodDays = this.config.get<number>(
      'delegation.coolingOffPeriodDays',
    );
    const currentCommissionCount = await this.nodeCommissionRepository.count({
      createdAt: MoreThan(
        moment().utc().subtract(coolingOffPeriodDays, 'days').toDate(),
      ),
      node: n,
    });

    if (currentCommissionCount >= 1) {
      throw new CantAddCommissionException(n.id);
    }

    const commission = NodeCommission.fromValue(commissionDto.commission);
    n.commissions = [...n.commissions, commission];

    return this.nodeRepository.save(n);
  }

  async deleteNode(user: number, node: number): Promise<Node> {
    const n = await this.findNodeOrThrow(node);
    this.checkNodeBelongsToUser(n, user);

    if (n.isMainnet()) {
      throw new NodeCantBeDeletedException(n.id);
    }

    await this.nodeRepository.delete(node);

    return n;
  }

  findAllNodesByUser(user: number): Promise<Node[]> {
    return this.nodeRepository.find({ user });
  }

  async findAllCommissionsByNode(
    user: number,
    node: number,
  ): Promise<NodeCommission[]> {
    const n = await this.findNodeOrThrow(node);
    this.checkNodeBelongsToUser(n, user);

    return this.nodeCommissionRepository.find({ node: n });
  }

  async findNodeOrThrow(node: number): Promise<Node> {
    const n = await this.nodeRepository.findOne(node);
    if (!n) {
      throw new NodeNotFoundException(node);
    }

    return n;
  }

  checkNodeBelongsToUser(node: Node, user: number): void {
    if (node.user !== user) {
      throw new NodeDoesntBelongToUserException(node.id);
    }
  }
}