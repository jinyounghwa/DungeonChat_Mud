import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { DatabaseService } from '../database/database.service';
import * as bcrypt from 'bcrypt';
import {
  createMockUser,
  MockDatabaseService,
} from '../game/test/test-utils';

describe('AuthService', () => {
  let service: AuthService;
  let dbService: MockDatabaseService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: DatabaseService, useClass: MockDatabaseService },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn((payload) => `token_${JSON.stringify(payload)}`),
            verify: jest.fn((token) => JSON.parse(token.replace('token_', ''))),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    dbService = module.get<MockDatabaseService>(DatabaseService) as any;
    jwtService = module.get<JwtService>(JwtService);
  });

  describe('register', () => {
    it('새로운 사용자를 등록할 수 있어야 함', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const username = 'testuser';

      dbService.user.findUnique
        .mockResolvedValueOnce(null) // email check
        .mockResolvedValueOnce(null); // username check
      dbService.user.create.mockResolvedValue({
        id: 'user-123',
        email,
        username,
        passwordHash: await bcrypt.hash(password, 10),
      });

      const result = await service.register(email, password, username);

      expect(result).toHaveProperty('userId');
      expect(result).toHaveProperty('email');
      expect(result).toHaveProperty('username');
      expect(dbService.user.create).toHaveBeenCalled();
    });

    it('비밀번호를 bcrypt로 해싱해야 함', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const username = 'testuser';

      dbService.user.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);

      let hashedPassword = '';
      dbService.user.create.mockImplementation(async ({ data }) => {
        hashedPassword = data.passwordHash;
        return {
          id: 'user-123',
          email,
          username,
          passwordHash: hashedPassword,
        };
      });

      await service.register(email, password, username);

      // 해시된 비밀번호는 원본과 다름
      expect(hashedPassword).not.toBe(password);
      // 해시는 같은 입력으로도 매번 다름 (salt 때문)
      const hash2 = await bcrypt.hash(password, 10);
      expect(hashedPassword).not.toBe(hash2);
    });

    it('중복된 이메일로 등록할 수 없어야 함', async () => {
      const existingUser = createMockUser();
      dbService.user.findUnique.mockResolvedValueOnce(existingUser);

      await expect(
        service.register(existingUser.email, 'password', 'newuser'),
      ).rejects.toThrow(ConflictException);
    });

    it('중복된 username으로 등록할 수 없어야 함', async () => {
      const existingUser = createMockUser();
      dbService.user.findUnique
        .mockResolvedValueOnce(null) // email check
        .mockResolvedValueOnce(existingUser); // username check

      await expect(
        service.register('new@example.com', 'password', existingUser.username),
      ).rejects.toThrow(ConflictException);
    });

    it('등록 후 accessToken을 반환해야 함', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const username = 'testuser';
      const userId = 'user-123';

      dbService.user.findUnique
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(null);
      dbService.user.create.mockResolvedValue({
        id: userId,
        email,
        username,
        passwordHash: 'hashed',
      });

      jest.spyOn(jwtService, 'sign').mockReturnValue('access_token');

      const result = await service.register(email, password, username);

      expect(result).toHaveProperty('accessToken');
    });
  });

  describe('login', () => {
    it('유효한 자격증명으로 로그인할 수 있어야 함', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const hashedPassword = await bcrypt.hash(password, 10);

      dbService.user.findUnique.mockResolvedValue({
        id: 'user-123',
        email,
        username: 'testuser',
        passwordHash: hashedPassword,
      });

      jest.spyOn(jwtService, 'sign').mockReturnValue('access_token');

      const result = await service.login(email, password);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
    });

    it('존재하지 않는 이메일로 로그인할 수 없어야 함', async () => {
      dbService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.login('nonexistent@example.com', 'password'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('잘못된 비밀번호로 로그인할 수 없어야 함', async () => {
      const email = 'test@example.com';
      const correctPassword = 'correct123';
      const wrongPassword = 'wrong123';
      const hashedPassword = await bcrypt.hash(correctPassword, 10);

      dbService.user.findUnique.mockResolvedValue({
        id: 'user-123',
        email,
        username: 'testuser',
        passwordHash: hashedPassword,
      });

      await expect(
        service.login(email, wrongPassword),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('로그인 시 accessToken을 반환해야 함', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const hashedPassword = await bcrypt.hash(password, 10);

      dbService.user.findUnique.mockResolvedValue({
        id: 'user-123',
        email,
        username: 'testuser',
        passwordHash: hashedPassword,
      });

      jest.spyOn(jwtService, 'sign').mockReturnValue('access_token');

      const result = await service.login(email, password);

      expect(result.accessToken).toBeDefined();
      expect(typeof result.accessToken).toBe('string');
    });

    it('로그인 시 refreshToken을 반환해야 함', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const hashedPassword = await bcrypt.hash(password, 10);

      dbService.user.findUnique.mockResolvedValue({
        id: 'user-123',
        email,
        username: 'testuser',
        passwordHash: hashedPassword,
      });

      jest.spyOn(jwtService, 'sign')
        .mockReturnValueOnce('access_token')
        .mockReturnValueOnce('refresh_token');

      const result = await service.login(email, password);

      expect(result.refreshToken).toBeDefined();
      expect(typeof result.refreshToken).toBe('string');
    });

    it('로그인 시 사용자 정보를 반환해야 함', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = {
        id: 'user-123',
        email,
        username: 'testuser',
        passwordHash: hashedPassword,
      };

      dbService.user.findUnique.mockResolvedValue(user);
      jest.spyOn(jwtService, 'sign').mockReturnValue('token');

      const result = await service.login(email, password);

      expect(result.user.id).toBe(user.id);
      expect(result.user.email).toBe(user.email);
      expect(result.user.username).toBe(user.username);
    });
  });

  describe('validateUser', () => {
    it('유효한 자격증명의 사용자를 검증할 수 있어야 함', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const hashedPassword = await bcrypt.hash(password, 10);
      const user = {
        id: 'user-123',
        email,
        username: 'testuser',
        passwordHash: hashedPassword,
      };

      dbService.user.findUnique.mockResolvedValue(user);

      const result = await service.validateUser(email, password);

      expect(result).toBeDefined();
      expect(result.id).toBe(user.id);
    });

    it('잘못된 비밀번호는 null을 반환해야 함', async () => {
      const email = 'test@example.com';
      const hashedPassword = await bcrypt.hash('correct', 10);
      const user = {
        id: 'user-123',
        email,
        username: 'testuser',
        passwordHash: hashedPassword,
      };

      dbService.user.findUnique.mockResolvedValue(user);

      const result = await service.validateUser(email, 'wrong');

      expect(result).toBeNull();
    });

    it('존재하지 않는 사용자는 null을 반환해야 함', async () => {
      dbService.user.findUnique.mockResolvedValue(null);

      const result = await service.validateUser('nonexistent@example.com', 'password');

      expect(result).toBeNull();
    });
  });

  describe('refreshToken', () => {
    it('유효한 refreshToken으로 새로운 accessToken을 발급할 수 있어야 함', async () => {
      const userId = 'user-123';
      const refreshToken = 'refresh_token_123';

      jest.spyOn(jwtService, 'verify').mockReturnValue({ userId });
      jest.spyOn(jwtService, 'sign')
        .mockReturnValueOnce('new_access_token')
        .mockReturnValueOnce('new_refresh_token');

      const result = await service.refreshToken(refreshToken);

      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
    });

    it('유효하지 않은 refreshToken은 거부해야 함', async () => {
      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error('Invalid token');
      });

      await expect(
        service.refreshToken('invalid_token'),
      ).rejects.toThrow();
    });
  });

  describe('changePassword', () => {
    it('올바른 현재 비밀번호로 비밀번호를 변경할 수 있어야 함', async () => {
      const userId = 'user-123';
      const currentPassword = 'old123';
      const newPassword = 'new456';
      const hashedPassword = await bcrypt.hash(currentPassword, 10);

      dbService.user.findUnique.mockResolvedValue({
        id: userId,
        email: 'test@example.com',
        username: 'testuser',
        passwordHash: hashedPassword,
      });

      dbService.user.update.mockResolvedValue({
        id: userId,
        passwordHash: await bcrypt.hash(newPassword, 10),
      });

      const result = await service.changePassword(userId, currentPassword, newPassword);

      expect(result).toHaveProperty('message');
      expect(dbService.user.update).toHaveBeenCalled();
    });

    it('잘못된 현재 비밀번호로는 변경할 수 없어야 함', async () => {
      const userId = 'user-123';
      const hashedPassword = await bcrypt.hash('correct', 10);

      dbService.user.findUnique.mockResolvedValue({
        id: userId,
        email: 'test@example.com',
        username: 'testuser',
        passwordHash: hashedPassword,
      });

      await expect(
        service.changePassword(userId, 'wrong', 'newpassword'),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('새로운 비밀번호를 bcrypt로 해싱해야 함', async () => {
      const userId = 'user-123';
      const currentPassword = 'old123';
      const newPassword = 'new456';
      const hashedPassword = await bcrypt.hash(currentPassword, 10);

      dbService.user.findUnique.mockResolvedValue({
        id: userId,
        email: 'test@example.com',
        username: 'testuser',
        passwordHash: hashedPassword,
      });

      let updatedHash = '';
      dbService.user.update.mockImplementation(async ({ data }) => {
        updatedHash = data.passwordHash;
        return { id: userId, passwordHash: updatedHash };
      });

      await service.changePassword(userId, currentPassword, newPassword);

      // 새로운 해시는 새로운 비밀번호와 다름
      expect(updatedHash).not.toBe(newPassword);
    });

    it('존재하지 않는 사용자는 에러를 throw해야 함', async () => {
      dbService.user.findUnique.mockResolvedValue(null);

      await expect(
        service.changePassword('nonexistent', 'old', 'new'),
      ).rejects.toThrow();
    });
  });

  describe('logout', () => {
    it('로그아웃 시 성공 메시지를 반환해야 함', async () => {
      const result = await service.logout();

      expect(result).toHaveProperty('message');
      expect(result.message).toContain('로그아웃');
    });
  });

  describe('Authentication flow', () => {
    it('회원가입 후 로그인 flow를 실행할 수 있어야 함', async () => {
      const email = 'test@example.com';
      const password = 'password123';
      const username = 'testuser';

      // 회원가입
      dbService.user.findUnique
        .mockResolvedValueOnce(null) // email check
        .mockResolvedValueOnce(null); // username check

      const hashedPassword = await bcrypt.hash(password, 10);
      dbService.user.create.mockResolvedValue({
        id: 'user-123',
        email,
        username,
        passwordHash: hashedPassword,
      });

      jest.spyOn(jwtService, 'sign').mockReturnValue('access_token');

      const registerResult = await service.register(email, password, username);
      expect(registerResult).toHaveProperty('accessToken');

      // 로그인
      dbService.user.findUnique.mockResolvedValue({
        id: 'user-123',
        email,
        username,
        passwordHash: hashedPassword,
      });

      jest.spyOn(jwtService, 'sign')
        .mockReturnValueOnce('access_token')
        .mockReturnValueOnce('refresh_token');

      const loginResult = await service.login(email, password);
      expect(loginResult).toHaveProperty('accessToken');
      expect(loginResult).toHaveProperty('refreshToken');
    });

    it('password change flow를 실행할 수 있어야 함', async () => {
      const userId = 'user-123';
      const oldPassword = 'old123';
      const newPassword = 'new456';
      const hashedOldPassword = await bcrypt.hash(oldPassword, 10);

      dbService.user.findUnique.mockResolvedValue({
        id: userId,
        email: 'test@example.com',
        username: 'testuser',
        passwordHash: hashedOldPassword,
      });

      dbService.user.update.mockResolvedValue({
        id: userId,
        passwordHash: await bcrypt.hash(newPassword, 10),
      });

      const result = await service.changePassword(userId, oldPassword, newPassword);
      expect(result).toHaveProperty('message');

      // 새로운 비밀번호로 로그인 가능 확인
      const newHashedPassword = await bcrypt.hash(newPassword, 10);
      dbService.user.findUnique.mockResolvedValue({
        id: userId,
        email: 'test@example.com',
        username: 'testuser',
        passwordHash: newHashedPassword,
      });

      jest.spyOn(jwtService, 'sign').mockReturnValue('access_token');

      const loginResult = await service.login('test@example.com', newPassword);
      expect(loginResult).toHaveProperty('accessToken');
    });
  });
});
