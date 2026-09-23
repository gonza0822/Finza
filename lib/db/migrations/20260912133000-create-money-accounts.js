"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("money_accounts", {
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
      name: { type: Sequelize.STRING(80), allowNull: false },
      type: {
        type: Sequelize.ENUM("banco", "billetera", "efectivo", "otro"),
        allowNull: false,
      },
      currency: {
        type: Sequelize.ENUM("ARS", "USD"),
        allowNull: false,
        defaultValue: "ARS",
      },
      initial_balance: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: false,
      },
      notes: { type: Sequelize.STRING(500), allowNull: true },
      sort_order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      archived_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex("money_accounts", ["user_id"], {
      name: "money_accounts_user_id_idx",
    });
    await queryInterface.addIndex("money_accounts", ["user_id", "archived_at"], {
      name: "money_accounts_user_id_archived_at_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("money_accounts");
  },
};
