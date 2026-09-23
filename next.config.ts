import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["sequelize", "mysql2", "mysql2/promise", "bcryptjs"],
};

export default nextConfig;
