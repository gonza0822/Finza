"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.sequelize.query(
      "ALTER TABLE movements MODIFY COLUMN type ENUM('gasto','ingreso','transferencia','conversion','ajuste') NOT NULL",
    );
    await queryInterface.changeColumn("movements", "category_id", {
      type: Sequelize.CHAR(36),
      allowNull: true,
    });
    await queryInterface.addColumn("movements", "counter_account_id", {
      type: Sequelize.CHAR(36),
      allowNull: true,
      references: { model: "money_accounts", key: "id" },
      onDelete: "RESTRICT",
    });
    await queryInterface.addColumn("movements", "counter_amount", {
      type: Sequelize.DECIMAL(14, 2),
      allowNull: true,
    });
    await queryInterface.addColumn("movements", "counter_currency", {
      type: Sequelize.ENUM("ARS", "USD"),
      allowNull: true,
    });
    await queryInterface.addColumn("movements", "ajuste_direction", {
      type: Sequelize.ENUM("sube", "baja"),
      allowNull: true,
    });
    await queryInterface.addIndex("movements", ["counter_account_id"], {
      name: "movements_counter_account_id_idx",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex("movements", "movements_counter_account_id_idx");
    await queryInterface.removeColumn("movements", "ajuste_direction");
    await queryInterface.removeColumn("movements", "counter_currency");
    await queryInterface.removeColumn("movements", "counter_amount");
    await queryInterface.removeColumn("movements", "counter_account_id");
    await queryInterface.changeColumn("movements", "category_id", {
      type: Sequelize.CHAR(36),
      allowNull: false,
    });
    await queryInterface.sequelize.query(
      "ALTER TABLE movements MODIFY COLUMN type ENUM('gasto','ingreso') NOT NULL",
    );
  },
};
