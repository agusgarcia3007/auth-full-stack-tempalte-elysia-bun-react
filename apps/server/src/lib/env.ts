import arkenv from "arkenv";

export const env = arkenv({
  PORT: "number.port",
  DATABASE_URL: "string",
});
