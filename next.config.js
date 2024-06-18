const isProduction = process.env.NODE_ENV === 'production'

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
  basePath: isProduction? '/hello-near-examples' : '',
  output: "export",
  distDir: 'build',
  reactStrictMode: true,
  env: {
    NEAR_ACCOUNT_ID: "gregx.testnet",
    NEAR_PRIVATE_KEY: "ed25519:5FUUm31hdnh5wnahfh932MaZEmzKVeHyF6ckviss4f1HkAPMWDqooxbPTQcBHFF8mqyTak4qCa2b383mt5542amS",
    MPC_PATH:"ethereum,1",
    MPC_CHAIN:"[ethereum]",
    MPC_CONTRACT_ID:"v2.multichain-mpc.testnet",
    MPC_PUBLIC_KEY:"secp256k1:4NfTiv3UsGahebgTaHyD9vF8KYKMBnfd6kh94mK6xv8fGBiJB8TBtFMP5WWXz6B89Ac1fbpzPwAvoyQebemHFwx3",
    TATUM_API_KEY:"t-660377bd70604e001c3712e6-045c28a4cd40450e890ecded",
    NEAR_PROXY:"false"
  }
}

module.exports = nextConfig;
