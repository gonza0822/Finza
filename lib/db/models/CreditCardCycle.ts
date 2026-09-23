import { DataTypes, type Model, type ModelStatic, type Sequelize } from "sequelize";

/** Defines billing cycles generated from a card's close and due days. */
export function defineCreditCardCycle(sequelize: Sequelize): ModelStatic<Model> {
  return sequelize.define(
    "creditCardCycle",
    {
      id: { type: DataTypes.CHAR(36), primaryKey: true },
      creditCardId: { type: DataTypes.CHAR(36), allowNull: false },
      closeOn: { type: DataTypes.DATEONLY, allowNull: false },
      dueOn: { type: DataTypes.DATEONLY, allowNull: false },
    },
    { tableName: "credit_card_cycles", underscored: true, timestamps: true },
  );
}
