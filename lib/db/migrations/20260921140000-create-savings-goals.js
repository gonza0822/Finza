"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("savings_goals", {
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
      target_amount: { type: Sequelize.DECIMAL(14, 2), allowNull: false },
      assigned_amount: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: false,
        defaultValue: 0,
      },
      currency: {
        type: Sequelize.ENUM("ARS", "USD"),
        allowNull: false,
        defaultValue: "ARS",
      },
      target_on: { type: Sequelize.DATEONLY, allowNull: false },
      status: {
        type: Sequelize.ENUM("activo", "alcanzado", "pausado", "cancelado"),
        allowNull: false,
        defaultValue: "activo",
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex("savings_goals", ["user_id"], {
      name: "savings_goals_user_id_idx",
    });
    await queryInterface.addIndex("savings_goals", ["user_id", "status"], {
      name: "savings_goals_user_status_idx",
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("savings_goals");
  },
};
