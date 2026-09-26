"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn("recurrence_rules", "amount_currency", {
      type: Sequelize.ENUM("ARS", "USD"),
      allowNull: false,
      defaultValue: "ARS",
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn("recurrence_rules", "amount_currency");
  },
};
