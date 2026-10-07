import bcrypt from 'bcrypt';
import { query } from '../config/database';
import { AppError } from '../utils/appError';
import { signToken } from '../utils/jwt';
import { RegisterInput, LoginInput } from '../validators/auth.validation';

export interface SafeUser {
  id: string;
  fullName: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthResponse {
  user: SafeUser;
  token: string;
}

export class AuthService {
  private static readonly SALT_ROUNDS = 10;

  static async register(input: RegisterInput): Promise<AuthResponse> {
    const { fullName, email, password } = input;

    // Check if user with normalized email already exists
    const existingUser = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );

    if (existingUser.rows.length > 0) {
      throw new AppError('An account with this email address already exists', 409);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, this.SALT_ROUNDS);

    // Insert new user
    const insertResult = await query<SafeUser>(
      `INSERT INTO users (full_name, email, password)
       VALUES ($1, $2, $3)
       RETURNING id, full_name as "fullName", email, created_at as "createdAt", updated_at as "updatedAt"`,
      [fullName, email, hashedPassword]
    );

    const user = insertResult.rows[0];
    const token = signToken({ userId: user.id, email: user.email });

    return { user, token };
  }

  static async login(input: LoginInput): Promise<AuthResponse> {
    const { email, password } = input;

    // Find user by normalized email
    const result = await query<{
      id: string;
      full_name: string;
      email: string;
      password: string;
      created_at: Date;
      updated_at: Date;
    }>(
      `SELECT id, full_name, email, password, created_at, updated_at
       FROM users
       WHERE email = $1`,
      [email]
    );

    const userRecord = result.rows[0];

    // Generic invalid credentials error to avoid user enumeration
    if (!userRecord) {
      throw new AppError('Invalid email or password', 401);
    }

    const isPasswordValid = await bcrypt.compare(password, userRecord.password);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    const user: SafeUser = {
      id: userRecord.id,
      fullName: userRecord.full_name,
      email: userRecord.email,
      createdAt: userRecord.created_at,
      updatedAt: userRecord.updated_at,
    };

    const token = signToken({ userId: user.id, email: user.email });

    return { user, token };
  }

  static async getMe(userId: string): Promise<SafeUser> {
    const result = await query<SafeUser>(
      `SELECT id, full_name as "fullName", email, created_at as "createdAt", updated_at as "updatedAt"
       FROM users
       WHERE id = $1`,
      [userId]
    );

    const user = result.rows[0];
    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }
}
