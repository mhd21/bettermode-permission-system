import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { User } from 'src/modules/users/models/user.model';
import { CreateUserInput } from 'src/modules/users/dto/create-user.input';
import { UsersService } from 'src/modules/users/services/users.service';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  /**
   * Mutation to create a new user.
   */
  @Mutation(() => User, { name: 'createUser' })
  async createUser(@Args('input') input: CreateUserInput): Promise<User> {
    return this.usersService.createUser(input);
  }

  /**
   * Query to get a list of users.
   */
  @Query(() => [User], { name: 'getUsers' })
  async getUsers(): Promise<User[]> {
    return this.usersService.getUsers();
  }

  /**
   * Query to get a user by ID.
   */
  @Query(() => User, { name: 'getUser', nullable: true })
  async getUserById(@Args('id') id: string): Promise<User | null> {
    return this.usersService.getUserById(id);
  }
}
