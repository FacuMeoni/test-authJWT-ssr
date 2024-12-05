import dotenv from 'dotenv'

dotenv.config()

export const {
  PORT,
  SALT_ROUNDS,
  SECRET_JWT_KEY
} = process.env
