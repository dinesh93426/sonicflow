import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import prisma from '../config/prisma.js';
import { BadRequestError, ConflictError, NotFoundError, UnauthorizedError } from '../utils/errors.js';

export interface RegisterDTO {
  email: string;
  password: string;
  displayName: string;
  role?: 'USER' | 'CONTENT_MANAGER' | 'ADMIN';
}

export interface LoginDTO {
  email: string;
  password: string;
}

export class AuthService {
  private generateToken(payload: { id: string; email: string; role: string; displayName: string }): string {
    return jwt.sign({ ...payload, jti: crypto.randomUUID() }, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as any,
    });
  }

  async register(data: RegisterDTO, ipAddress?: string, userAgent?: string) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (existing) {
      throw new ConflictError('An account with this email address already exists');
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(data.password, salt);

    // If first user, make ADMIN, otherwise default to USER or specified role
    const totalUsers = await prisma.user.count();
    const assignedRole = totalUsers === 0 ? 'ADMIN' : (data.role || 'USER');

    const user = await prisma.user.create({
      data: {
        email: data.email.toLowerCase(),
        passwordHash,
        displayName: data.displayName,
        role: assignedRole,
        emailVerified: true, // Auto-verified for local/demo ease, can send verification token in prod
      },
      select: {
        id: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        role: true,
        emailVerified: true,
        createdAt: true,
      },
    });

    const token = this.generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      displayName: user.displayName,
    });

    // Create session record
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
        ipAddress,
        userAgent,
      },
    });

    return { user, token };
  }

  async login(data: LoginDTO, ipAddress?: string, userAgent?: string) {
    const user = await prisma.user.findUnique({
      where: { email: data.email.toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const isValid = await bcrypt.compare(data.password, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    const token = this.generateToken({
      id: user.id,
      email: user.email,
      role: user.role,
      displayName: user.displayName,
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
        ipAddress,
        userAgent,
      },
    });

    const sanitizedUser = {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      role: user.role,
      emailVerified: user.emailVerified,
      createdAt: user.createdAt,
    };

    return { user: sanitizedUser, token };
  }

  async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        role: true,
        emailVerified: true,
        createdAt: true,
        spotifyProduct: true,
        spotifyUserId: true,
        spotifyAccessToken: true,
        _count: {
          select: {
            playlists: true,
            favoriteSongs: true,
            savedAlbums: true,
            followedArtists: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundError('User not found');
    }

    const { spotifyAccessToken, ...rest } = user;
    return {
      ...rest,
      isSpotifyConnected: Boolean(spotifyAccessToken),
      hasSpotifyPremium: user.spotifyProduct === 'premium',
    };
  }

  async updateProfile(userId: string, data: { displayName?: string; avatarUrl?: string }) {
    const user = await prisma.user.update({
      where: { id: userId },
      data,
      select: {
        id: true,
        email: true,
        displayName: true,
        avatarUrl: true,
        role: true,
        emailVerified: true,
        updatedAt: true,
      },
    });

    return user;
  }

  async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });

    if (!user) {
      // Don't disclose whether email exists for security
      return { message: 'If this email exists, a password reset token has been issued' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 3600000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    return {
      message: 'If this email exists, a password reset token has been issued',
      resetToken: process.env.NODE_ENV !== 'production' ? resetToken : undefined,
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: { gt: new Date() },
      },
    });

    if (!user) {
      throw new BadRequestError('Invalid or expired password reset token');
    }

    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    // Invalidate existing sessions on password reset
    await prisma.session.deleteMany({
      where: { userId: user.id },
    });

    return { message: 'Password has been successfully updated' };
  }

  async logout(sessionToken?: string) {
    if (sessionToken) {
      await prisma.session.deleteMany({
        where: { token: sessionToken },
      });
    }
    return { message: 'Logged out successfully' };
  }

  async deleteAccount(userId: string) {
    await prisma.user.delete({
      where: { id: userId },
    });
    return { message: 'Account successfully deleted' };
  }
}

export const authService = new AuthService();
