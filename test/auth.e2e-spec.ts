import "reflect-metadata";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { AuthController } from "../src/modules/auth/auth.controller";
import { AuthService } from "../src/modules/auth/auth.service";

describe("AuthController (e2e)", () => {
  let app: INestApplication;
  const authServiceMock = {
    register: jest.fn(),
    login: jest.fn()
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [{ provide: AuthService, useValue: authServiceMock }]
    }).compile();

    app = moduleRef.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true
      })
    );
    await app.init();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  afterAll(async () => {
    await app.close();
  });

  it("POST /auth/register should return wrapped auth payload", async () => {
    authServiceMock.register.mockResolvedValue({
      accessToken: "mock-token",
      user: { id: "u1", email: "user@example.com" }
    });

    const response = await request(app.getHttpServer()).post("/auth/register").send({
      email: "user@example.com",
      password: "password123"
    });

    expect(response.status).toBe(201);
    expect(response.body.data.accessToken).toBe("mock-token");
    expect(authServiceMock.register).toHaveBeenCalledWith({
      email: "user@example.com",
      password: "password123"
    });
  });

  it("POST /auth/login should return wrapped auth payload", async () => {
    authServiceMock.login.mockResolvedValue({
      accessToken: "mock-token",
      user: { id: "u1", email: "user@example.com" }
    });

    const response = await request(app.getHttpServer()).post("/auth/login").send({
      email: "user@example.com",
      password: "password123"
    });

    expect(response.status).toBe(201);
    expect(response.body.data.user.id).toBe("u1");
    expect(authServiceMock.login).toHaveBeenCalledWith({
      email: "user@example.com",
      password: "password123"
    });
  });
});
