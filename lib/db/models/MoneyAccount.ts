import { DataTypes, type Model, type ModelStatic, type Sequelize } from "sequelize";
import { ACCOUNT_TYPES, CURRENCIES } from "@/lib/db/enums";

/** Defines the money_accounts table. Named apart from Auth.js `accounts`. */
export function defineMoneyAccount(sequelize: Sequelize): ModelStatic<Model> {
  return sequelize.define(
    "moneyAccount",
    {
      id: { type: DataTypes.CHAR(36), primaryKey: true },
      userId: { type: DataTypes.CHAR(36), allowNull: false },
      name: { type: DataTypes.STRING(80), allowNull: false },
      type: { type: DataTypes.ENUM(...ACCOUNT_TYPES), allowNull: false },
      currency: {
        type: DataTypes.ENUM(...CURRENCIES),
        allowNull: false,
        defaultValue: "ARS",
      },
      initialBalance: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
      notes: { type: DataTypes.STRING(500), allowNull: true },
      sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      archivedAt: { type: DataTypes.DATE, allowNull: true },
    },
    { tableName: "money_accounts", underscored: true, timestamps: true },
  );
}
