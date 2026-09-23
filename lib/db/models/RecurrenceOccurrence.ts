import { DataTypes, type Model, type ModelStatic, type Sequelize } from "sequelize";
import { RECURRENCE_OCCURRENCE_STATUSES } from "@/lib/db/enums";

/** Defines one scheduled instance of a recurrence rule. */
export function defineRecurrenceOccurrence(sequelize: Sequelize): ModelStatic<Model> {
  return sequelize.define(
    "recurrenceOccurrence",
    {
      id: { type: DataTypes.CHAR(36), primaryKey: true },
      recurrenceRuleId: { type: DataTypes.CHAR(36), allowNull: false },
      scheduledOn: { type: DataTypes.DATEONLY, allowNull: false },
      amount: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
      status: {
        type: DataTypes.ENUM(...RECURRENCE_OCCURRENCE_STATUSES),
        allowNull: false,
        defaultValue: "programada",
      },
      movementId: { type: DataTypes.CHAR(36), allowNull: true },
    },
    { tableName: "recurrence_occurrences", underscored: true, timestamps: true },
  );
}
