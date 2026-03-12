import "reflect-metadata";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { FundsController } from "../src/modules/funds/funds.controller";
import { FundsService } from "../src/modules/funds/funds.service";
import { SchedulesController } from "../src/modules/schedules/schedules.controller";
import { SchedulesService } from "../src/modules/schedules/schedules.service";

describe("Funds and Schedules Controllers (e2e)", () => {
  let app: INestApplication;
  const fundsServiceMock = {
    topUp: jest.fn(),
    expense: jest.fn()
  };
  const schedulesServiceMock = {
    create: jest.fn(),
    list: jest.fn()
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [FundsController, SchedulesController],
      providers: [
        { provide: FundsService, useValue: fundsServiceMock },
        { provide: SchedulesService, useValue: schedulesServiceMock }
      ]
    }).compile();

    app = moduleRef.createNestApplication();
    app.use((req: { user?: { id: string; email: string } }, _res: unknown, next: () => void) => {
      req.user = { id: "user-1", email: "test@example.com" };
      next();
    });
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

  it("POST /funds/:id/top-ups should call topUp with authenticated user", async () => {
    const fundId = "550e8400-e29b-41d4-a716-446655440000";
    const accountId = "550e8400-e29b-41d4-a716-446655440001";
    fundsServiceMock.topUp.mockResolvedValue({ id: "tx1" });

    const response = await request(app.getHttpServer())
      .post(`/funds/${fundId}/top-ups`)
      .send({
        accountId,
        amount: 1200
      });

    expect(response.status).toBe(201);
    expect(response.body.data.id).toBe("tx1");
    expect(fundsServiceMock.topUp).toHaveBeenCalledWith("user-1", fundId, {
      accountId,
      amount: 1200
    });
  });

  it("POST /funds/:id/expenses should call expense with authenticated user", async () => {
    const fundId = "550e8400-e29b-41d4-a716-446655440000";
    const accountId = "550e8400-e29b-41d4-a716-446655440001";
    fundsServiceMock.expense.mockResolvedValue({ id: "tx2" });

    const response = await request(app.getHttpServer())
      .post(`/funds/${fundId}/expenses`)
      .send({
        accountId,
        amount: 500
      });

    expect(response.status).toBe(201);
    expect(response.body.data.id).toBe("tx2");
    expect(fundsServiceMock.expense).toHaveBeenCalledWith("user-1", fundId, {
      accountId,
      amount: 500
    });
  });

  it("POST /schedules/top-ups should create schedule", async () => {
    const payload = {
      fundId: "550e8400-e29b-41d4-a716-446655440000",
      accountId: "550e8400-e29b-41d4-a716-446655440001",
      amount: 1200,
      cycleDay: 1
    };
    schedulesServiceMock.create.mockResolvedValue({ id: "sch1" });

    const response = await request(app.getHttpServer()).post("/schedules/top-ups").send(payload);

    expect(response.status).toBe(201);
    expect(response.body.data.id).toBe("sch1");
    expect(schedulesServiceMock.create).toHaveBeenCalledWith("user-1", payload);
  });

  it("GET /schedules/top-ups should list schedules", async () => {
    schedulesServiceMock.list.mockResolvedValue([{ id: "sch1" }]);

    const response = await request(app.getHttpServer()).get("/schedules/top-ups");

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(schedulesServiceMock.list).toHaveBeenCalledWith("user-1");
  });
});
