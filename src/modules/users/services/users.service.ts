import { ConflictException, Injectable } from '@nestjs/common';
import { User } from '@prisma/client';
import { PrismaService } from 'src/shared/database/prisma/prisma.service';
import { CreateUserInput } from '../dto/create-user.input';
import { ulid } from 'ulid';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async createUser(input: CreateUserInput): Promise<User> {
    const { username, email } = input;

    // Check for duplicate username or email
    const existingUser = await this.prisma.user.findFirst({
      where: { OR: [{ username }, { email }] },
    });
    if (existingUser) {
      throw new ConflictException('Username or email already exists.');
    }

    return this.prisma.user.create({
      data: {
        id: `USER${ulid()}`,
        username,
        email,
      },
    });
  }

  /**
   * Retrieve a list of all users.
   */
  async getUsers(): Promise<User[]> {
    return this.prisma.user.findMany({
      orderBy: {
        createdAt: 'desc', // Order by the most recent users
      },
    });
  }

  /**
   * Get user by ID.
   */
  async getUserById(userId: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id: userId },
    });
  }
}
