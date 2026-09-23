import { DataTypes, type Model, type ModelStatic, type Sequelize } from "sequelize";
import { CATEGORY_KINDS } from "@/lib/db/enums";

/** Defines categories (and subcategories via parent_id) in one table. */
export function defineCategory(sequelize: Sequelize): ModelStatic<Model> {
  return sequelize.define(
    "category",
    {
      id: { type: DataTypes.CHAR(36), primaryKey: true },
      userId: { type: DataTypes.CHAR(36), allowNull: true },
      parentId: { type: DataTypes.CHAR(36), allowNull: true },
      slug: { type: DataTypes.STRING(60), allowNull: false, unique: true },
      name: { type: DataTypes.STRING(80), allowNull: false },
      kind: { type: DataTypes.ENUM(...CATEGORY_KINDS), allowNull: false },
      icon: { type: DataTypes.STRING(40), allowNull: false },
      color: { type: DataTypes.CHAR(7), allowNull: false },
      isSystem: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
      sortOrder: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      archivedAt: { type: DataTypes.DATE, allowNull: true },
    },
    { tableName: "categories", underscored: true, timestamps: true },
  );
}
