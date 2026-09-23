import { DataTypes, type Model, type ModelStatic, type Sequelize } from "sequelize";
import { CURRENCIES } from "@/lib/db/enums";

/** Defines a category spending cap for one calendar month and currency. */
export function defineBudget(sequelize: Sequelize): ModelStatic<Model> {
  return sequelize.define(
    "budget",
    {
      id: { type: DataTypes.CHAR(36), primaryKey: true },
      userId: { type: DataTypes.CHAR(36), allowNull: false },
      categoryId: { type: DataTypes.CHAR(36), allowNull: false },
      yearMonth: { type: DataTypes.CHAR(7), allowNull: false },
      amount: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
      currency: {
        type: DataTypes.ENUM(...CURRENCIES),
        allowNull: false,
        defaultValue: "ARS",
      },
    },
    { tableName: "budgets", underscored: true, timestamps: true },
  );
}
