import { DataTypes, type Model, type ModelStatic, type Sequelize } from "sequelize";
import {
  RECURRENCE_CLASSES,
  RECURRENCE_FREQUENCIES,
  RECURRENCE_KINDS,
  RECURRENCE_RULE_STATUSES,
} from "@/lib/db/enums";

/** Defines a repeating gasto/ingreso template (not the ledger row). */
export function defineRecurrenceRule(sequelize: Sequelize): ModelStatic<Model> {
  return sequelize.define(
    "recurrenceRule",
    {
      id: { type: DataTypes.CHAR(36), primaryKey: true },
      userId: { type: DataTypes.CHAR(36), allowNull: false },
      name: { type: DataTypes.STRING(80), allowNull: false },
      kind: { type: DataTypes.ENUM(...RECURRENCE_KINDS), allowNull: false },
      ruleClass: { type: DataTypes.ENUM(...RECURRENCE_CLASSES), allowNull: false },
      amount: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
      frequency: { type: DataTypes.ENUM(...RECURRENCE_FREQUENCIES), allowNull: false },
      dueDay: { type: DataTypes.TINYINT, allowNull: false },
      dueMonth: { type: DataTypes.TINYINT, allowNull: true },
      accountId: { type: DataTypes.CHAR(36), allowNull: true },
      creditCardId: { type: DataTypes.CHAR(36), allowNull: true },
      categoryId: { type: DataTypes.CHAR(36), allowNull: false },
      startsOn: { type: DataTypes.DATEONLY, allowNull: false },
      endsOn: { type: DataTypes.DATEONLY, allowNull: true },
      status: {
        type: DataTypes.ENUM(...RECURRENCE_RULE_STATUSES),
        allowNull: false,
        defaultValue: "activa",
      },
    },
    { tableName: "recurrence_rules", underscored: true, timestamps: true },
  );
}
