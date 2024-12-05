import dotenv from 'dotenv'

dotenv.config()

export const {
  PORT,
  SALT_ROUNDS = 10,
  SECRET_JWT_KEY
} = process.env
