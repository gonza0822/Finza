"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("movements", {
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
      type: {
        type: Sequelize.ENUM("gasto", "ingreso"),
        allowNull: false,
      },
      status: {
        type: Sequelize.ENUM("confirmado", "anulado"),
        allowNull: false,
        defaultValue: "confirmado",
      },
      occurred_on: { type: Sequelize.DATEONLY, allowNull: false },
      amount: { type: Sequelize.DECIMAL(14, 2), allowNull: false },
      currency: {
        type: Sequelize.ENUM("ARS", "USD"),
        allowNull: false,
      },
      account_id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: { model: "money_accounts", key: "id" },
        onDelete: "RESTRICT",
      },
      category_id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: { model: "categories", key: "id" },
        onDelete: "RESTRICT",
      },
      payment_mean: {
        type: Sequelize.ENUM("efectivo", "transferencia", "debito"),
        allowNull: false,
      },
      notes: { type: Sequelize.STRING(500), allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex("movements", ["user_id", "occurred_on"], {
      name: "movements_user_id_occurred_on_idx",
    });
    await queryInterface.addIndex("movements", ["account_id"], {
      name: "movements_account_id_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("movements");
  },
};
