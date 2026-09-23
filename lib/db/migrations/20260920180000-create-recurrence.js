"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable("recurrence_rules", {
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
      kind: { type: Sequelize.ENUM("gasto", "ingreso"), allowNull: false },
      rule_class: {
        type: Sequelize.ENUM(
          "suscripcion",
          "servicio",
          "alquiler",
          "envio_tercero",
          "sueldo",
          "otro",
        ),
        allowNull: false,
      },
      amount: { type: Sequelize.DECIMAL(14, 2), allowNull: false },
      frequency: {
        type: Sequelize.ENUM("semanal", "mensual", "anual"),
        allowNull: false,
      },
      due_day: { type: Sequelize.TINYINT, allowNull: false },
      due_month: { type: Sequelize.TINYINT, allowNull: true },
      account_id: {
        type: Sequelize.CHAR(36),
        allowNull: true,
        references: { model: "money_accounts", key: "id" },
        onDelete: "RESTRICT",
      },
      credit_card_id: {
        type: Sequelize.CHAR(36),
        allowNull: true,
        references: { model: "credit_cards", key: "id" },
        onDelete: "RESTRICT",
      },
      category_id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: { model: "categories", key: "id" },
        onDelete: "RESTRICT",
      },
      starts_on: { type: Sequelize.DATEONLY, allowNull: false },
      ends_on: { type: Sequelize.DATEONLY, allowNull: true },
      status: {
        type: Sequelize.ENUM("activa", "pausada", "finalizada"),
        allowNull: false,
        defaultValue: "activa",
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex("recurrence_rules", ["user_id"], {
      name: "recurrence_rules_user_id_idx",
    });

    await queryInterface.createTable("recurrence_occurrences", {
      id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        primaryKey: true,
      },
      recurrence_rule_id: {
        type: Sequelize.CHAR(36),
        allowNull: false,
        references: { model: "recurrence_rules", key: "id" },
        onDelete: "CASCADE",
      },
      scheduled_on: { type: Sequelize.DATEONLY, allowNull: false },
      amount: { type: Sequelize.DECIMAL(14, 2), allowNull: false },
      status: {
        type: Sequelize.ENUM("programada", "confirmada", "omitida", "vencida"),
        allowNull: false,
        defaultValue: "programada",
      },
      movement_id: {
        type: Sequelize.CHAR(36),
        allowNull: true,
        references: { model: "movements", key: "id" },
        onDelete: "SET NULL",
      },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.addIndex(
      "recurrence_occurrences",
      ["recurrence_rule_id", "scheduled_on"],
      { name: "recurrence_occurrences_rule_date_uq", unique: true },
    );
    await queryInterface.addIndex("recurrence_occurrences", ["movement_id"], {
      name: "recurrence_occurrences_movement_id_uq",
      unique: true,
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("recurrence_occurrences");
    await queryInterface.dropTable("recurrence_rules");
  },
};
