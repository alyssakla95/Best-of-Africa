
import fs from 'fs';
import path from 'path';

const countries = [
    { code: "DZ", name: "Algeria" }, { code: "AO", name: "Angola" }, { code: "BJ", name: "Benin" },
    { code: "BW", name: "Botswana" }, { code: "BF", name: "Burkina Faso" }, { code: "BI", name: "Burundi" },
    { code: "CV", name: "Cabo Verde" }, { code: "CM", name: "Cameroon" }, { code: "CF", name: "Central African Republic" },
    { code: "TD", name: "Chad" }, { code: "KM", name: "Comoros" }, { code: "CD", name: "DR Congo" },
    { code: "CG", name: "Republic of the Congo" }, { code: "CI", name: "Cote d'Ivoire" }, { code: "DJ", name: "Djibouti" },
    { code: "EG", name: "Egypt" }, { code: "GQ", name: "Equatorial Guinea" }, { code: "ER", name: "Eritrea" },
    { code: "SZ", name: "Eswatini" }, { code: "ET", name: "Ethiopia" }, { code: "GA", name: "Gabon" },
    { code: "GM", name: "Gambia" }, { code: "GH", name: "Ghana" }, { code: "GN", name: "Guinea" },
    { code: "GW", name: "Guinea-Bissau" }, { code: "KE", name: "Kenya" }, { code: "LS", name: "Lesotho" },
    { code: "LR", name: "Liberia" }, { code: "LY", name: "Libya" }, { code: "MG", name: "Madagascar" },
    { code: "MW", name: "Malawi" }, { code: "ML", name: "Mali" }, { code: "MR", name: "Mauritania" },
    { code: "MU", name: "Mauritius" }, { code: "MA", name: "Morocco" }, { code: "MZ", name: "Mozambique" },
    { code: "NA", name: "Namibia" }, { code: "NE", name: "Niger" }, { code: "NG", name: "Nigeria" },
    { code: "RW", name: "Rwanda" }, { code: "ST", name: "Sao Tome and Principe" }, { code: "SN", name: "Senegal" },
    { code: "SC", name: "Seychelles" }, { code: "SL", name: "Sierra Leone" }, { code: "SO", name: "Somalia" },
    { code: "ZA", name: "South Africa" }, { code: "SS", name: "South Sudan" }, { code: "SD", name: "Sudan" },
    { code: "TZ", name: "Tanzania" }, { code: "TG", name: "Togo" }, { code: "TN", name: "Tunisia" },
    { code: "UG", name: "Uganda" }, { code: "ZM", name: "Zambia" }, { code: "ZW", name: "Zimbabwe" }
];

const configDir = path.join(process.cwd(), 'src/boa/config');

if (!fs.existsSync(configDir)) {
    fs.mkdirSync(configDir, { recursive: true });
}

countries.forEach(country => {
    const config = {
        countryCode: country.code,
        boaApiBaseUrl: "http://localhost:8000",
        walletDataDir: `./data/wallets/${country.name.toLowerCase().replace(/\s+/g, '_')}`,
        budgetCapUsdc: 50,
        auditFrequencyHours: 24,
        metricThresholds: {
            pageViews: 500,
            bounceRate: 70,
            timeOnPage: 60
        }
    };

    const fileName = `${country.name.toLowerCase().replace(/\s+/g, '_')}.json`;
    fs.writeFileSync(path.join(configDir, fileName), JSON.stringify(config, null, 2));
    console.log(`Generated config for ${country.name}`);
});
