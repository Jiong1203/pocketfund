import { describe, expect, it, vi } from "vitest";
import { AppError } from "../src/common/errors";
import type { AccountsRepository } from "../src/modules/accounts/accounts.repository";
import type { FundsRepository } from "../src/modules/funds/funds.repository";
import { FundsService } from "../src/modules/funds/funds.service";
import type { TransactionsRepository } from "../src/modules/transactions/transactions.repository";
import { TransactionsService } from "../src/modules/transactions/transactions.service";
import { TransactionType } from "../src/modules/transactions/transactions.types";
import { ACCOUNT_ID, FUND_ID } from "./helpers";

function setup() {
  const transactionsRepository = {
    insertTransaction: vi.fn(async (input) => ({ id: "tx", ...input })),
    listPaged: vi.fn()
  };
  const fundsRepository = { ensureFundExists: vi.fn(), getFundBalance: vi.fn() };
  const accountsRepository = { ensureOwned: vi.fn() };

  const transactionsService = new TransactionsService(transactionsRepository as unknown as TransactionsRepository);
  const fundsService = new FundsService(
    fundsRepository as unknown as FundsRepository,
    accountsRepository as unknown as AccountsRepository,
    transactionsRepository as unknown as TransactionsRepository,
    transactionsService
  );
  return { transactionsRepository, fundsRepository, accountsRepository, transactionsService, fundsService };
}

describe("Ledger posting", () => {
  it("posts TOP_UP as a positive amount", async () => {
    const { fundsService, transactionsRepository } = setup();

    await fundsService.topUp("user-1", FUND_ID, { accountId: ACCOUNT_ID, amount: 1200 });

    expect(transactionsRepository.insertTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ type: TransactionType.TOP_UP, amount: 1200, fundId: FUND_ID, accountId: ACCOUNT_ID })
    );
  });

  it("posts EXPENSE as a negative amount", async () => {
    const { fundsService, transactionsRepository } = setup();

    await fundsService.expense("user-1", FUND_ID, { accountId: ACCOUNT_ID, amount: 350.5 });

    expect(transactionsRepository.insertTransaction).toHaveBeenCalledWith(
      expect.objectContaining({ type: TransactionType.EXPENSE, amount: -350.5 })
    );
  });

  it("checks fund and account ownership before posting", async () => {
    const { fundsService, fundsRepository, accountsRepository, transactionsRepository } = setup();
    accountsRepository.ensureOwned.mockRejectedValue(new AppError({ code: "RESOURCE_NOT_FOUND", message: "x" }, 404));

    await expect(fundsService.expense("user-1", FUND_ID, { accountId: ACCOUNT_ID, amount: 1 })).rejects.toMatchObject({
      status: 404
    });
    expect(fundsRepository.ensureFundExists).toHaveBeenCalledWith("user-1", FUND_ID);
    expect(transactionsRepository.insertTransaction).not.toHaveBeenCalled();
  });

  it("generates an idempotency key and occurred_at when not provided", async () => {
    const { transactionsService, transactionsRepository } = setup();

    await transactionsService.createLedgerTransaction({
      userId: "user-1",
      fundId: FUND_ID,
      accountId: ACCOUNT_ID,
      type: TransactionType.TOP_UP,
      amountAbs: 10
    });

    const input = transactionsRepository.insertTransaction.mock.calls[0][0];
    expect(input.idempotencyKey).toMatch(/^[0-9a-f-]{36}$/);
    expect(Number.isNaN(Date.parse(input.occurredAt))).toBe(false);
  });

  it("maps a unique violation to LEDGER_DUPLICATE_TRANSACTION", async () => {
    const { transactionsService, transactionsRepository } = setup();
    transactionsRepository.insertTransaction.mockRejectedValue(Object.assign(new Error("dup"), { code: "23505" }));

    await expect(
      transactionsService.createLedgerTransaction({
        userId: "user-1",
        fundId: FUND_ID,
        accountId: ACCOUNT_ID,
        type: TransactionType.TOP_UP,
        amountAbs: 10,
        idempotencyKey: "same"
      })
    ).rejects.toMatchObject({ code: "LEDGER_DUPLICATE_TRANSACTION", status: 409 });
  });
});

describe("Editing transactions", () => {
  function setupEdit(existing: { type: TransactionType; amount: string }) {
    const repo = {
      findByIdAndUserId: vi.fn(async () => ({ id: "tx", ...existing })),
      updateTransaction: vi.fn(async (_id, _userId, fields) => ({ id: "tx", ...fields }))
    };
    return { repo, service: new TransactionsService(repo as unknown as TransactionsRepository) };
  }

  it("keeps an edited EXPENSE negative when the client sends a positive amount", async () => {
    const { repo, service } = setupEdit({ type: TransactionType.EXPENSE, amount: "-350.50" });

    await service.updateTransaction("user-1", "tx", { amount: 300 });

    expect(repo.updateTransaction).toHaveBeenCalledWith("tx", "user-1", { amount: -300 });
  });

  it("flips the stored sign when only the type changes", async () => {
    const { repo, service } = setupEdit({ type: TransactionType.EXPENSE, amount: "-350.50" });

    await service.updateTransaction("user-1", "tx", { type: TransactionType.TOP_UP });

    expect(repo.updateTransaction).toHaveBeenCalledWith("tx", "user-1", { type: TransactionType.TOP_UP, amount: 350.5 });
  });

  it("leaves the amount alone when only the description changes", async () => {
    const { repo, service } = setupEdit({ type: TransactionType.EXPENSE, amount: "-350.50" });

    await service.updateTransaction("user-1", "tx", { description: "lunch" });

    expect(repo.updateTransaction).toHaveBeenCalledWith("tx", "user-1", { description: "lunch" });
  });
});

describe("Fund balance", () => {
  it("returns the balance computed by the ledger query", async () => {
    const { fundsService, fundsRepository } = setup();
    fundsRepository.getFundBalance.mockResolvedValue(850);

    await expect(fundsService.getBalance("user-1", FUND_ID)).resolves.toEqual({ fundId: FUND_ID, balance: 850 });
    expect(fundsRepository.ensureFundExists).toHaveBeenCalledWith("user-1", FUND_ID);
  });
});
