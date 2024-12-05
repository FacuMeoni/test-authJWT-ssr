import express from 'express'
import { PORT, SECRET_JWT_KEY } from './config.js'
import { tryCatch } from './err_handler/try_catch.js'
import { UserRepository } from './user-repository.js'
import { errorHandler } from './err_handler/err_handler.js'
import cookieParser from 'cookie-parser'
import jwt from 'jsonwebtoken'

const app = express()
app.set('view engine', 'ejs')
app.use(express.json())
app.use(cookieParser())
app.use((req, res, next) => {
  const token = req.cookies.access_token
  req.session = { user: null }

  try {
    const data = jwt.verify(token, SECRET_JWT_KEY)
    req.session.user = data
  } catch {}

  next()
})

app.get('/', tryCatch((req, res) => {
  const { user } = req.session
  res.render('index', user)
}))

app.post('/login', tryCatch(UserRepository.login))

app.post('/register', tryCatch(UserRepository.create))

app.post('/logout', tryCatch((req, res) => {
  res
    .clearCookie('access_token')
    .json({ message: 'Logout successful' })
}))

app.use(errorHandler)

app.listen(PORT, () => {
  console.log('Server running on port', PORT)
})
