import { DataTypes, type Model, type ModelStatic, type Sequelize } from "sequelize";
import {
  AJUSTE_DIRECTIONS,
  CURRENCIES,
  LEDGER_TYPES,
  MOVEMENT_STATUSES,
  PAYMENT_MEANS,
} from "@/lib/db/enums";

/** Defines the ledger table, including transfer/conversion legs and audited ajustes. */
export function defineMovement(sequelize: Sequelize): ModelStatic<Model> {
  return sequelize.define(
    "movement",
    {
      id: { type: DataTypes.CHAR(36), primaryKey: true },
      userId: { type: DataTypes.CHAR(36), allowNull: false },
      type: { type: DataTypes.ENUM(...LEDGER_TYPES), allowNull: false },
      status: {
        type: DataTypes.ENUM(...MOVEMENT_STATUSES),
        allowNull: false,
        defaultValue: "confirmado",
      },
      occurredOn: { type: DataTypes.DATEONLY, allowNull: false },
      amount: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
      currency: { type: DataTypes.ENUM(...CURRENCIES), allowNull: false },
      accountId: { type: DataTypes.CHAR(36), allowNull: true },
      creditCardId: { type: DataTypes.CHAR(36), allowNull: true },
      cycleId: { type: DataTypes.CHAR(36), allowNull: true },
      counterAccountId: { type: DataTypes.CHAR(36), allowNull: true },
      counterAmount: { type: DataTypes.DECIMAL(14, 2), allowNull: true },
      counterCurrency: { type: DataTypes.ENUM(...CURRENCIES), allowNull: true },
      ajusteDirection: { type: DataTypes.ENUM(...AJUSTE_DIRECTIONS), allowNull: true },
      categoryId: { type: DataTypes.CHAR(36), allowNull: true },
      paymentMean: { type: DataTypes.ENUM(...PAYMENT_MEANS), allowNull: false },
      notes: { type: DataTypes.STRING(500), allowNull: true },
    },
    { tableName: "movements", underscored: true, timestamps: true },
  );
}
