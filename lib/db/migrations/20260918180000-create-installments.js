"use strict";

const { randomUUID } = require("crypto");

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("installments", {
      id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        primaryKey: true,
      },
      movement_id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: { model: "movements", key: "id" },
        onDelete: "RESTRICT",
      },
      credit_card_id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: { model: "credit_cards", key: "id" },
        onDelete: "RESTRICT",
      },
      cycle_id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: { model: "credit_card_cycles", key: "id" },
        onDelete: "RESTRICT",
      },
      installment_number: { type: Sequelize.TINYINT, allowNull: false },
      installment_count: { type: Sequelize.TINYINT, allowNull: false },
      amount: { type: Sequelize.DECIMAL(14, 2), allowNull: false },
      status: {
        type: Sequelize.ENUM("pendiente", "en_resumen", "pagada", "anulada"),
        allowNull: false,
        defaultValue: "pendiente",
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex("installments", ["movement_id", "installment_number"], {
      name: "installments_movement_number_uq",
      unique: true,
    });
    await queryInterface.addIndex("installments", ["credit_card_id"], {
      name: "installments_credit_card_id_idx",
    });
    await queryInterface.addIndex("installments", ["cycle_id"], {
      name: "installments_cycle_id_idx",
    });

    const [gastos] = await queryInterface.sequelize.query(
      `SELECT id, credit_card_id, cycle_id, amount, status
       FROM movements
       WHERE type = 'gasto'
         AND payment_mean = 'credito'
         AND credit_card_id IS NOT NULL
         AND cycle_id IS NOT NULL`,
    );
    const now = new Date();
    const rows = (gastos ?? []).map((gasto) => ({
      id: randomUUID(),
      movement_id: gasto.id,
      credit_card_id: gasto.credit_card_id,
      cycle_id: gasto.cycle_id,
      installment_number: 1,
      installment_count: 1,
      amount: gasto.amount,
      status: gasto.status === "anulado" ? "anulada" : "pendiente",
      created_at: now,
      updated_at: now,
    }));
    if (rows.length > 0) {
      await queryInterface.bulkInsert("installments", rows);
    }
  },

  async down(queryInterface) {
    await queryInterface.dropTable("installments");
  },
};
