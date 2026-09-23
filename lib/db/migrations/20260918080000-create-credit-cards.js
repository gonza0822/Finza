"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("credit_cards", {
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
      brand: {
        type: Sequelize.ENUM("visa", "mastercard", "amex", "naranja", "otra"),
        allowNull: false,
      },
      last_four: { type: Sequelize.CHAR(4), allowNull: false },
      currency: {
        type: Sequelize.ENUM("ARS", "USD"),
        allowNull: false,
        defaultValue: "ARS",
      },
      credit_limit: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: false,
      },
      close_day: { type: Sequelize.TINYINT, allowNull: false },
      due_day: { type: Sequelize.TINYINT, allowNull: false },
      payment_account_id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: { model: "money_accounts", key: "id" },
        onDelete: "RESTRICT",
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

    await queryInterface.addIndex("credit_cards", ["user_id"], {
      name: "credit_cards_user_id_idx",
    });
    await queryInterface.addIndex("credit_cards", ["user_id", "archived_at"], {
      name: "credit_cards_user_id_archived_at_idx",
    });
    await queryInterface.addIndex("credit_cards", ["payment_account_id"], {
      name: "credit_cards_payment_account_id_idx",
    });

    await queryInterface.createTable("credit_card_cycles", {
      id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        primaryKey: true,
      },
      credit_card_id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: { model: "credit_cards", key: "id" },
        onDelete: "RESTRICT",
      },
      close_on: { type: Sequelize.DATEONLY, allowNull: false },
      due_on: { type: Sequelize.DATEONLY, allowNull: false },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex("credit_card_cycles", ["credit_card_id", "close_on"], {
      name: "credit_card_cycles_card_close_on_uq",
      unique: true,
    });

    await queryInterface.sequelize.query(
      "ALTER TABLE movements MODIFY COLUMN type ENUM('gasto','ingreso','transferencia','conversion','ajuste','pago_tarjeta') NOT NULL",
    );
    await queryInterface.sequelize.query(
      "ALTER TABLE movements MODIFY COLUMN payment_mean ENUM('efectivo','transferencia','debito','credito') NOT NULL",
    );
    await queryInterface.changeColumn("movements", "account_id", {
      type: Sequelize.CHAR(36),
      allowNull: true,
    });
    await queryInterface.addColumn("movements", "credit_card_id", {
      type: Sequelize.CHAR(36),
      allowNull: true,
      references: { model: "credit_cards", key: "id" },
      onDelete: "RESTRICT",
    });
    await queryInterface.addColumn("movements", "cycle_id", {
      type: Sequelize.CHAR(36),
      allowNull: true,
      references: { model: "credit_card_cycles", key: "id" },
      onDelete: "RESTRICT",
    });
    await queryInterface.addIndex("movements", ["credit_card_id"], {
      name: "movements_credit_card_id_idx",
    });
    await queryInterface.addIndex("movements", ["cycle_id"], {
      name: "movements_cycle_id_idx",
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex("movements", "movements_cycle_id_idx");
    await queryInterface.removeIndex("movements", "movements_credit_card_id_idx");
    await queryInterface.removeColumn("movements", "cycle_id");
    await queryInterface.removeColumn("movements", "credit_card_id");
    await queryInterface.changeColumn("movements", "account_id", {
      type: Sequelize.CHAR(36),
      allowNull: false,
    });
    await queryInterface.sequelize.query(
      "ALTER TABLE movements MODIFY COLUMN payment_mean ENUM('efectivo','transferencia','debito') NOT NULL",
    );
    await queryInterface.sequelize.query(
      "ALTER TABLE movements MODIFY COLUMN type ENUM('gasto','ingreso','transferencia','conversion','ajuste') NOT NULL",
    );
    await queryInterface.dropTable("credit_card_cycles");
    await queryInterface.dropTable("credit_cards");
  },
};
