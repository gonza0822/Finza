"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const uuid = {
      type: Sequelize.CHAR(36),
      allowNull: false,
      primaryKey: true,
    };

    await queryInterface.createTable("users", {
      id: uuid,
      name: { type: Sequelize.STRING(120), allowNull: true },
      email: { type: Sequelize.STRING(254), allowNull: true, unique: true },
      email_verified: { type: Sequelize.DATE, allowNull: true },
      image: { type: Sequelize.STRING(512), allowNull: true },
      password_hash: { type: Sequelize.STRING(255), allowNull: true },
      default_currency: {
        type: Sequelize.ENUM("ARS", "USD"),
        allowNull: false,
        defaultValue: "ARS",
      },
      goals_count_as_committed: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      month_start_day: { type: Sequelize.TINYINT, allowNull: false, defaultValue: 1 },
      created_at: { type: Sequelize.DATE, allowNull: false },
      updated_at: { type: Sequelize.DATE, allowNull: false },
    });

    await queryInterface.createTable("accounts", {
      id: uuid,
      type: { type: Sequelize.STRING(50), allowNull: false },
      provider: { type: Sequelize.STRING(50), allowNull: false },
      provider_account_id: { type: Sequelize.STRING(255), allowNull: false },
      refresh_token: { type: Sequelize.TEXT, allowNull: true },
      access_token: { type: Sequelize.TEXT, allowNull: true },
      expires_at: { type: Sequelize.INTEGER, allowNull: true },
      token_type: { type: Sequelize.STRING(50), allowNull: true },
      scope: { type: Sequelize.STRING(512), allowNull: true },
      id_token: { type: Sequelize.TEXT, allowNull: true },
      session_state: { type: Sequelize.STRING(255), allowNull: true },
      user_id: {
        type: Sequelize.CHAR(36),
        allowNull: true,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
      },
    });
    await queryInterface.addIndex("accounts", ["provider", "provider_account_id"], {
      unique: true,
      name: "accounts_provider_provider_account_id_unique",
    });

    await queryInterface.createTable("sessions", {
      id: uuid,
      expires: { type: Sequelize.DATE, allowNull: false },
      session_token: { type: Sequelize.STRING(255), allowNull: false, unique: true },
      user_id: {
        type: Sequelize.CHAR(36),
        allowNull: true,
        references: { model: "users", key: "id" },
        onDelete: "CASCADE",
      },
    });

    await queryInterface.createTable("verification_tokens", {
      token: { type: Sequelize.STRING(255), allowNull: false, primaryKey: true },
      identifier: { type: Sequelize.STRING(255), allowNull: false },
      expires: { type: Sequelize.DATE, allowNull: false },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable("verification_tokens");
    await queryInterface.dropTable("sessions");
    await queryInterface.dropTable("accounts");
    await queryInterface.dropTable("users");
  },
};
