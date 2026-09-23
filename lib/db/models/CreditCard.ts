import { DataTypes, type Model, type ModelStatic, type Sequelize } from "sequelize";
import { CARD_BRANDS, CURRENCIES } from "@/lib/db/enums";

/** Defines the credit_cards table (liabilities, not money accounts). */
export function defineCreditCard(sequelize: Sequelize): ModelStatic<Model> {
  return sequelize.define(
    "creditCard",
    {
      id: { type: DataTypes.CHAR(36), primaryKey: true },
      userId: { type: DataTypes.CHAR(36), allowNull: false },
      name: { type: DataTypes.STRING(80), allowNull: false },
      brand: { type: DataTypes.ENUM(...CARD_BRANDS), allowNull: false },
      lastFour: { type: DataTypes.CHAR(4), allowNull: false },
      currency: {
        type: DataTypes.ENUM(...CURRENCIES),
        allowNull: false,
        defaultValue: "ARS",
      },
      creditLimit: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
      closeDay: { type: DataTypes.TINYINT, allowNull: false },
      dueDay: { type: DataTypes.TINYINT, allowNull: false },
      paymentAccountId: { type: DataTypes.CHAR(36), allowNull: false },
      notes: { type: DataTypes.STRING(500), allowNull: true },
      sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      archivedAt: { type: DataTypes.DATE, allowNull: true },
    },
    { tableName: "credit_cards", underscored: true, timestamps: true },
  );
}
