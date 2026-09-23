import { DataTypes, type Model, type ModelStatic, type Sequelize } from "sequelize";
import { INSTALLMENT_STATUSES } from "@/lib/db/enums";

/** Defines fractions of a credit gasto assigned to successive billing cycles. */
export function defineInstallment(sequelize: Sequelize): ModelStatic<Model> {
  return sequelize.define(
    "installment",
    {
      id: { type: DataTypes.CHAR(36), primaryKey: true },
      movementId: { type: DataTypes.CHAR(36), allowNull: false },
      creditCardId: { type: DataTypes.CHAR(36), allowNull: false },
      cycleId: { type: DataTypes.CHAR(36), allowNull: false },
      installmentNumber: { type: DataTypes.TINYINT, allowNull: false },
      installmentCount: { type: DataTypes.TINYINT, allowNull: false },
      amount: { type: DataTypes.DECIMAL(14, 2), allowNull: false },
      status: {
        type: DataTypes.ENUM(...INSTALLMENT_STATUSES),
        allowNull: false,
        defaultValue: "pendiente",
      },
    },
    { tableName: "installments", underscored: true, timestamps: true },
  );
}
