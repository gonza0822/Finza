import { DataTypes, type Model, type ModelStatic, type Sequelize } from "sequelize";
import { CURRENCIES, GOAL_STATUSES } from "@/lib/db/enums";

/** Defines a virtual savings overlay: assigned amount does not move accounts. */
export function defineSavingsGoal(sequelize: Sequelize): ModelStatic<Model> {
  return sequelize.define(
    "savingsGoal",
    {
      id: { type: DataTypes.CHAR(36), primaryKey: true },
      userId: { type: DataTypes.CHAR(36), allowNull: false },
      name: { type: DataTypes.STRING(80), allowNull: false },
      targetAmount: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
      assignedAmount: { type: DataTypes.DECIMAL(14, 2), allowNull: false, defaultValue: 0 },
      currency: {
        type: DataTypes.ENUM(...CURRENCIES),
        allowNull: false,
        defaultValue: "ARS",
      },
      targetOn: { type: DataTypes.DATEONLY, allowNull: false },
      status: {
        type: DataTypes.ENUM(...GOAL_STATUSES),
        allowNull: false,
        defaultValue: "activo",
      },
    },
    { tableName: "savings_goals", underscored: true, timestamps: true },
  );
}
