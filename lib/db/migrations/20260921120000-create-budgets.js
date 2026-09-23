"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("budgets", {
      id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
      },
      category_id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: { model: "categories", key: "id" },
        onDelete: "RESTRICT",
      },
      year_month: { type: Sequelize.CHAR(7), allowNull: false },
      amount: { type: Sequelize.DECIMAL(14, 2), allowNull: false },
      currency: {
        type: Sequelize.ENUM("ARS", "USD"),
        allowNull: false,
        defaultValue: "ARS",
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex("budgets", ["user_id"], {
      name: "budgets_user_id_idx",
    });
    await queryInterface.addIndex(
      "budgets",
      ["user_id", "category_id", "year_month", "currency"],
      { name: "budgets_user_category_month_currency_uq", unique: true },
    );
  },

  async down(queryInterface) {
    await queryInterface.dropTable("budgets");
  },
};
