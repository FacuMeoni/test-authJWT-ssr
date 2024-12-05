import DBLocal from 'db-local'
import { ValidationError, NotFoundError } from './err_handler/errors.js'
import crypto from 'node:crypto'
import bcrypt from 'bcrypt'
import { SALT_ROUNDS, SECRET_JWT_KEY } from './config.js'
import jwt from 'jsonwebtoken'
const { Schema } = DBLocal({ path: './db' })

const User = Schema('User', {
  _id: { type: String, required: true },
  password: { type: String, required: true },
  username: { type: String, required: true }
})

export class UserRepository {
  static async create (req, res) {
    const { username, password } = req.body

    Validation.username(username)
    Validation.password(password)

    const user = User.findOne({ username })

    if (user) throw new ValidationError('username already exists')

    const id = crypto.randomUUID()
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS)

    User.create({
      _id: id,
      username,
      password: hashedPassword
    }).save()

    const token = jwt.sign({ id, username },
      SECRET_JWT_KEY,
      {
        expiresIn: '1h'
      }
    )

    res
      .cookie('access_token', token, {
        httpOnly: true, // La cookie solo se puede acceder desde el servido
        secure: process.env.NODE_ENV === 'production', // la cookie solo se puede acceder en https
        sameSite: 'strict', // se puede acceder a la cookie solo en el mismo dominio
        maxAge: 1000 * 60 * 60 // la cookie solo tiene validez de una hora
      })
      .status(201).json({ id, username })
  }

  static async login (req, res) {
    const { username, password } = req.body
    Validation.username(username)
    Validation.password(password)

    const user = await User.findOne({ username })
    if (!user) throw new NotFoundError('username does not exists')

    const isValid = await bcrypt.compare(password, user.password)
    if (!isValid) throw new ValidationError('incorrect password .')

    const token = jwt.sign({ id: user._id, username: user.username },
      SECRET_JWT_KEY,
      {
        expiresIn: '1h'
      }
    )

    res
      .cookie('access_token', token, {
        httpOnly: true, // La cookie solo se puede acceder desde el servido
        secure: process.env.NODE_ENV === 'production', // la cookie solo se puede acceder en https
        sameSite: 'strict', // se puede acceder a la cookie solo en el mismo dominio
        maxAge: 1000 * 60 * 60 // la cookie solo tiene validez de una hora
      })
      .status(200).json({ id: user._id, username: user.username })
  }
}

class Validation {
  static username (username) {
    if (typeof username !== 'string') throw new ValidationError('username must be an string')
    if (username.length < 3) throw new ValidationError('username must be at least 3 characters long')
  }

  static password (password) {
    if (typeof password !== 'string') throw new ValidationError('password must be an string')
    if (password.length < 6) throw new ValidationError('password must be at least 6 characters long')
  }
}
