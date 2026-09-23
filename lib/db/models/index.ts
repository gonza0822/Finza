import { DataTypes, type Model, type ModelStatic } from "sequelize";
import { models as authDefaultModels } from "@auth/sequelize-adapter";
import { getSequelize } from "@/lib/db/sequelize";
import { CURRENCIES } from "@/lib/db/enums";
import { defineMoneyAccount } from "@/lib/db/models/MoneyAccount";
import { defineCategory } from "@/lib/db/models/Category";
import { defineCreditCard } from "@/lib/db/models/CreditCard";
import { defineCreditCardCycle } from "@/lib/db/models/CreditCardCycle";
import { defineInstallment } from "@/lib/db/models/Installment";
import { defineMovement } from "@/lib/db/models/Movement";
import { defineRecurrenceOccurrence } from "@/lib/db/models/RecurrenceOccurrence";
import { defineRecurrenceRule } from "@/lib/db/models/RecurrenceRule";
import { defineBudget } from "@/lib/db/models/Budget";
import { defineSavingsGoal } from "@/lib/db/models/SavingsGoal";

export interface FinzaModels {
  User: ModelStatic<Model>;
  Account: ModelStatic<Model>;
  Session: ModelStatic<Model>;
  VerificationToken: ModelStatic<Model>;
  MoneyAccount: ModelStatic<Model>;
  Category: ModelStatic<Model>;
  CreditCard: ModelStatic<Model>;
  CreditCardCycle: ModelStatic<Model>;
  Installment: ModelStatic<Model>;
  Movement: ModelStatic<Model>;
  RecurrenceRule: ModelStatic<Model>;
  RecurrenceOccurrence: ModelStatic<Model>;
  Budget: ModelStatic<Model>;
  SavingsGoal: ModelStatic<Model>;
}

const globalForModels = globalThis as unknown as {
  finzaModels: FinzaModels | undefined;
};

function bindCategoryTree(Category: ModelStatic<Model>) {
  Category.hasMany(Category, { as: "children", foreignKey: "parentId" });
  Category.belongsTo(Category, { as: "parent", foreignKey: "parentId" });
}

function missingAssoc(model: ModelStatic<Model>, as: string): boolean {
  return !model.associations[as];
}

/** Wires card FKs without redefining Auth.js or money-account tables. */
function bindCreditCardRelations(
  User: ModelStatic<Model>,
  MoneyAccount: ModelStatic<Model>,
  CreditCard: ModelStatic<Model>,
  CreditCardCycle: ModelStatic<Model>,
) {
  if (missingAssoc(User, "creditCards")) {
    User.hasMany(CreditCard, { foreignKey: "userId" });
  }
  if (missingAssoc(CreditCard, "user")) {
    CreditCard.belongsTo(User, { foreignKey: "userId" });
  }
  if (missingAssoc(MoneyAccount, "creditCards")) {
    MoneyAccount.hasMany(CreditCard, { foreignKey: "paymentAccountId" });
  }
  if (missingAssoc(CreditCard, "paymentAccount")) {
    CreditCard.belongsTo(MoneyAccount, { as: "paymentAccount", foreignKey: "paymentAccountId" });
  }
  if (missingAssoc(CreditCard, "creditCardCycles")) {
    CreditCard.hasMany(CreditCardCycle, { foreignKey: "creditCardId" });
  }
  if (missingAssoc(CreditCardCycle, "creditCard")) {
    CreditCardCycle.belongsTo(CreditCard, { foreignKey: "creditCardId" });
  }
}

/** Wires recurrence FKs without redefining money, card or movement tables. */
function bindRecurrenceRelations(
  User: ModelStatic<Model>,
  MoneyAccount: ModelStatic<Model>,
  Category: ModelStatic<Model>,
  CreditCard: ModelStatic<Model>,
  Movement: ModelStatic<Model>,
  RecurrenceRule: ModelStatic<Model>,
  RecurrenceOccurrence: ModelStatic<Model>,
) {
  if (missingAssoc(User, "recurrenceRules")) {
    User.hasMany(RecurrenceRule, { foreignKey: "userId" });
  }
  if (missingAssoc(RecurrenceRule, "user")) {
    RecurrenceRule.belongsTo(User, { foreignKey: "userId" });
  }
  if (missingAssoc(MoneyAccount, "recurrenceRules")) {
    MoneyAccount.hasMany(RecurrenceRule, { foreignKey: "accountId" });
  }
  if (missingAssoc(RecurrenceRule, "moneyAccount")) {
    RecurrenceRule.belongsTo(MoneyAccount, { as: "moneyAccount", foreignKey: "accountId" });
  }
  if (missingAssoc(CreditCard, "recurrenceRules")) {
    CreditCard.hasMany(RecurrenceRule, { foreignKey: "creditCardId" });
  }
  if (missingAssoc(RecurrenceRule, "creditCard")) {
    RecurrenceRule.belongsTo(CreditCard, { as: "creditCard", foreignKey: "creditCardId" });
  }
  if (missingAssoc(Category, "recurrenceRules")) {
    Category.hasMany(RecurrenceRule, { foreignKey: "categoryId" });
  }
  if (missingAssoc(RecurrenceRule, "category")) {
    RecurrenceRule.belongsTo(Category, { foreignKey: "categoryId" });
  }
  if (missingAssoc(RecurrenceRule, "occurrences")) {
    RecurrenceRule.hasMany(RecurrenceOccurrence, { as: "occurrences", foreignKey: "recurrenceRuleId" });
  }
  if (missingAssoc(RecurrenceOccurrence, "rule")) {
    RecurrenceOccurrence.belongsTo(RecurrenceRule, { as: "rule", foreignKey: "recurrenceRuleId" });
  }
  if (missingAssoc(Movement, "recurrenceOccurrence")) {
    Movement.hasOne(RecurrenceOccurrence, { as: "recurrenceOccurrence", foreignKey: "movementId" });
  }
  if (missingAssoc(RecurrenceOccurrence, "movement")) {
    RecurrenceOccurrence.belongsTo(Movement, { foreignKey: "movementId" });
  }
}

/** Wires installment FKs without redefining card or movement tables. */
function bindInstallmentRelations(
  Movement: ModelStatic<Model>,
  CreditCard: ModelStatic<Model>,
  CreditCardCycle: ModelStatic<Model>,
  Installment: ModelStatic<Model>,
) {
  if (missingAssoc(Movement, "installments")) {
    Movement.hasMany(Installment, { foreignKey: "movementId" });
  }
  if (missingAssoc(Installment, "movement")) {
    Installment.belongsTo(Movement, { foreignKey: "movementId" });
  }
  if (missingAssoc(CreditCard, "installments")) {
    CreditCard.hasMany(Installment, { foreignKey: "creditCardId" });
  }
  if (missingAssoc(Installment, "creditCard")) {
    Installment.belongsTo(CreditCard, { foreignKey: "creditCardId" });
  }
  if (missingAssoc(CreditCardCycle, "installments")) {
    CreditCardCycle.hasMany(Installment, { foreignKey: "cycleId" });
  }
  if (missingAssoc(Installment, "cycle")) {
    Installment.belongsTo(CreditCardCycle, { as: "cycle", foreignKey: "cycleId" });
  }
}

/** Wires budget FKs without redefining user or category tables. */
function bindBudgetRelations(
  User: ModelStatic<Model>,
  Category: ModelStatic<Model>,
  Budget: ModelStatic<Model>,
) {
  if (missingAssoc(User, "budgets")) {
    User.hasMany(Budget, { foreignKey: "userId" });
  }
  if (missingAssoc(Budget, "user")) {
    Budget.belongsTo(User, { foreignKey: "userId" });
  }
  if (missingAssoc(Category, "budgets")) {
    Category.hasMany(Budget, { foreignKey: "categoryId" });
  }
  if (missingAssoc(Budget, "category")) {
    Budget.belongsTo(Category, { foreignKey: "categoryId" });
  }
}

/** Wires savings-goal FKs without redefining user tables. */
function bindSavingsGoalRelations(User: ModelStatic<Model>, SavingsGoal: ModelStatic<Model>) {
  if (missingAssoc(User, "savingsGoals")) {
    User.hasMany(SavingsGoal, { foreignKey: "userId" });
  }
  if (missingAssoc(SavingsGoal, "user")) {
    SavingsGoal.belongsTo(User, { foreignKey: "userId" });
  }
}

/** Wires ledger FKs without redefining Auth.js or money-account tables. */
function bindMovementRelations(
  User: ModelStatic<Model>,
  MoneyAccount: ModelStatic<Model>,
  Category: ModelStatic<Model>,
  CreditCard: ModelStatic<Model>,
  CreditCardCycle: ModelStatic<Model>,
  Movement: ModelStatic<Model>,
) {
  if (missingAssoc(User, "movements")) {
    User.hasMany(Movement, { foreignKey: "userId" });
  }
  if (missingAssoc(Movement, "user")) {
    Movement.belongsTo(User, { foreignKey: "userId" });
  }
  if (missingAssoc(MoneyAccount, "movements")) {
    MoneyAccount.hasMany(Movement, { foreignKey: "accountId" });
  }
  if (missingAssoc(Movement, "moneyAccount")) {
    Movement.belongsTo(MoneyAccount, { foreignKey: "accountId" });
  }
  if (missingAssoc(MoneyAccount, "incomingMovements")) {
    MoneyAccount.hasMany(Movement, { as: "incomingMovements", foreignKey: "counterAccountId" });
  }
  if (missingAssoc(Movement, "counterAccount")) {
    Movement.belongsTo(MoneyAccount, { as: "counterAccount", foreignKey: "counterAccountId" });
  }
  if (missingAssoc(Category, "movements")) {
    Category.hasMany(Movement, { foreignKey: "categoryId" });
  }
  if (missingAssoc(Movement, "category")) {
    Movement.belongsTo(Category, { foreignKey: "categoryId" });
  }
  if (missingAssoc(CreditCard, "movements")) {
    CreditCard.hasMany(Movement, { foreignKey: "creditCardId" });
  }
  if (missingAssoc(Movement, "creditCard")) {
    Movement.belongsTo(CreditCard, { foreignKey: "creditCardId" });
  }
  if (missingAssoc(CreditCardCycle, "movements")) {
    CreditCardCycle.hasMany(Movement, { foreignKey: "cycleId" });
  }
  if (missingAssoc(Movement, "cycle")) {
    Movement.belongsTo(CreditCardCycle, { as: "cycle", foreignKey: "cycleId" });
  }
}

function movementNeedsReload(Movement: ModelStatic<Model> | undefined): boolean {
  return Boolean(
    Movement &&
      (!Movement.rawAttributes.counterAccountId || !Movement.rawAttributes.creditCardId),
  );
}

/** Attaches models added after this process first loaded the cache (HMR / phased deploys). */
function attachMissingFeatureModels(cached: FinzaModels): FinzaModels {
  const sequelize = getSequelize();
  if (!cached.Category) {
    cached.Category = defineCategory(sequelize);
    bindCategoryTree(cached.Category);
  }
  if (!cached.CreditCard) {
    cached.CreditCard = defineCreditCard(sequelize);
  }
  if (!cached.CreditCardCycle) {
    cached.CreditCardCycle = defineCreditCardCycle(sequelize);
    bindCreditCardRelations(
      cached.User,
      cached.MoneyAccount,
      cached.CreditCard,
      cached.CreditCardCycle,
    );
  }
  if (!cached.Movement || movementNeedsReload(cached.Movement)) {
    if (cached.Movement) {
      sequelize.modelManager.removeModel(cached.Movement);
    }
    cached.Movement = defineMovement(sequelize);
  }
  bindMovementRelations(
    cached.User,
    cached.MoneyAccount,
    cached.Category,
    cached.CreditCard,
    cached.CreditCardCycle,
    cached.Movement,
  );
  if (!cached.Installment) {
    cached.Installment = defineInstallment(sequelize);
  }
  bindInstallmentRelations(
    cached.Movement,
    cached.CreditCard,
    cached.CreditCardCycle,
    cached.Installment,
  );
  if (!cached.RecurrenceRule) {
    cached.RecurrenceRule = defineRecurrenceRule(sequelize);
  }
  if (!cached.RecurrenceOccurrence) {
    cached.RecurrenceOccurrence = defineRecurrenceOccurrence(sequelize);
  }
  bindRecurrenceRelations(
    cached.User,
    cached.MoneyAccount,
    cached.Category,
    cached.CreditCard,
    cached.Movement,
    cached.RecurrenceRule,
    cached.RecurrenceOccurrence,
  );
  if (!cached.Budget) {
    cached.Budget = defineBudget(sequelize);
  }
  bindBudgetRelations(cached.User, cached.Category, cached.Budget);
  if (!cached.SavingsGoal) {
    cached.SavingsGoal = defineSavingsGoal(sequelize);
  }
  bindSavingsGoalRelations(cached.User, cached.SavingsGoal);
  return cached;
}

/** Defines Auth.js tables once per process. Feature models are added with their migrations. */
export function getModels(): FinzaModels {
  const cached = globalForModels.finzaModels;
  if (
    cached?.MoneyAccount &&
    cached?.Category &&
    cached?.CreditCard &&
    cached?.CreditCardCycle &&
    cached?.Installment &&
    cached?.RecurrenceRule &&
    cached?.RecurrenceOccurrence &&
    cached?.Budget &&
    cached?.SavingsGoal &&
    cached?.Movement &&
    cached.Movement.rawAttributes.counterAccountId &&
    cached.Movement.rawAttributes.creditCardId &&
    cached.Movement.associations.counterAccount &&
    cached.Movement.associations.creditCard
  ) {
    return cached;
  }
  if (cached?.MoneyAccount) {
    return attachMissingFeatureModels(cached);
  }

  const sequelize = getSequelize();
  const authOpts = { underscored: true, timestamps: false };

  const User =
    cached?.User ??
    sequelize.define(
      "user",
      {
        ...authDefaultModels.User,
        passwordHash: { type: DataTypes.STRING(255), allowNull: true },
        defaultCurrency: {
          type: DataTypes.ENUM(...CURRENCIES),
          allowNull: false,
          defaultValue: "ARS",
        },
        goalsCountAsCommitted: {
          type: DataTypes.BOOLEAN,
          allowNull: false,
          defaultValue: true,
        },
        monthStartDay: { type: DataTypes.TINYINT, allowNull: false, defaultValue: 1 },
      },
      {
        tableName: "users",
        underscored: true,
        timestamps: true,
        defaultScope: { attributes: { exclude: ["passwordHash"] } },
      },
    );

  const Account =
    cached?.Account ??
    sequelize.define("account", authDefaultModels.Account, {
      ...authOpts,
      tableName: "accounts",
    });
  const Session =
    cached?.Session ??
    sequelize.define("session", authDefaultModels.Session, {
      ...authOpts,
      tableName: "sessions",
    });
  const VerificationToken =
    cached?.VerificationToken ??
    sequelize.define("verificationToken", authDefaultModels.VerificationToken, {
      ...authOpts,
      tableName: "verification_tokens",
    });

  const MoneyAccount = cached?.MoneyAccount ?? defineMoneyAccount(sequelize);
  if (!cached?.MoneyAccount) {
    User.hasMany(MoneyAccount, { foreignKey: "userId" });
    MoneyAccount.belongsTo(User, { foreignKey: "userId" });
  }

  const Category = cached?.Category ?? defineCategory(sequelize);
  if (!cached?.Category) {
    bindCategoryTree(Category);
  }

  const CreditCard = defineCreditCard(sequelize);
  const CreditCardCycle = defineCreditCardCycle(sequelize);
  bindCreditCardRelations(User, MoneyAccount, CreditCard, CreditCardCycle);

  const Movement = defineMovement(sequelize);
  bindMovementRelations(User, MoneyAccount, Category, CreditCard, CreditCardCycle, Movement);

  const Installment = defineInstallment(sequelize);
  bindInstallmentRelations(Movement, CreditCard, CreditCardCycle, Installment);

  const RecurrenceRule = defineRecurrenceRule(sequelize);
  const RecurrenceOccurrence = defineRecurrenceOccurrence(sequelize);
  bindRecurrenceRelations(
    User,
    MoneyAccount,
    Category,
    CreditCard,
    Movement,
    RecurrenceRule,
    RecurrenceOccurrence,
  );

  const Budget = defineBudget(sequelize);
  bindBudgetRelations(User, Category, Budget);

  const SavingsGoal = defineSavingsGoal(sequelize);
  bindSavingsGoalRelations(User, SavingsGoal);

  const models: FinzaModels = {
    User,
    Account,
    Session,
    VerificationToken,
    MoneyAccount,
    Category,
    CreditCard,
    CreditCardCycle,
    Installment,
    Movement,
    RecurrenceRule,
    RecurrenceOccurrence,
    Budget,
    SavingsGoal,
  };
  globalForModels.finzaModels = models;
  return models;
}

/** Auth.js adapter models bound to the shared Sequelize instance. */
export function getAuthAdapterModels() {
  const { User, Account, Session, VerificationToken } = getModels();
  return { User, Account, Session, VerificationToken };
}
