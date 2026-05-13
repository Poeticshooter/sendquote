import nextCoreWebVitals from "eslint-config-next/core-web-vitals";

const config = [...nextCoreWebVitals];

config[0].rules["react-hooks/set-state-in-effect"] = "off";
config[0].rules["react-hooks/refs"] = "off";
config[0].rules["react-hooks/static-components"] = "off";

export default config;