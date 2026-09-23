"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("categories", {
      id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.CHAR(36),
        allowNull: true,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
      },
      parent_id: {
        type: Sequelize.CHAR(36),
        allowNull: true,
        references: { model: "categories", key: "id" },
        onDelete: "SET NULL",
      },
      slug: { type: Sequelize.STRING(60), allowNull: false, unique: true },
      name: { type: Sequelize.STRING(80), allowNull: false },
      kind: {
        type: Sequelize.ENUM("gasto", "ingreso", "ajuste"),
        allowNull: false,
      },
      icon: { type: Sequelize.STRING(40), allowNull: false },
      color: { type: Sequelize.CHAR(7), allowNull: false },
      is_system: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      sort_order: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
      archived_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex("categories", ["kind"], {
      name: "categories_kind_idx",
    });
    await queryInterface.addIndex("categories", ["parent_id"], {
      name: "categories_parent_id_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("categories");
  },
};
