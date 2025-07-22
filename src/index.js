const express = require('express')
const YAML = require('yamljs')
const swaggerUi = require('swagger-ui-express')
const OpenApiValidator = require('express-openapi-validator')

const app = express()

// In-memory storage for users (in a real app, this would be a database)
const users = new Map()
// In-memory storage for products (array simulation)
let products = []

const port = 3000

const swaggerDocument = YAML.load('./openapi.yaml')
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument))
app.use(express.json())
app.use(OpenApiValidator.middleware({
  apiSpec: swaggerDocument,
  validateRequests: true,
  validateResponses:true,
  ignorePaths: /.*\/docs.*/
}))

app.use((err, req, res, next)=>{
  res.status(err.status || 500).json({
    message: err.message,
    errors: err.errors
  })
})

// Routers para versionado
const v1Router = express.Router()
const v2Router = express.Router()

// ENDPOINTS COMUNES (puedes personalizar por versión si lo necesitas)
// Hello
v1Router.get('/hello', (req, res) => {
  res.json({message:'Hello world'})
})
v2Router.get('/hello', (req, res) => {
  res.json({message:'Hello world'})
})

// USERS
v1Router.post('/users', (req, res)=> {
  const {name, age, email} = req.body
  const newUser = {
    id: Date.now().toString(),
    name,
    age,
    email
  }
  users.set(newUser.id, newUser)
  res.status(201).json(newUser)
})
v2Router.post('/users', v1Router.stack.find(r => r.route && r.route.path === '/users' && r.route.methods.post).route.stack[0].handle)

v1Router.get('/users/:id', (req, res) => {
  const userId = parseInt(req.params.id)
  const user = Array.from(users.values()).find(u => parseInt(u.id) === userId)
  if (!user) {
    return res.status(404).json({ message: 'Usuario no encontrado' })
  }
  res.status(200).json({ id: parseInt(user.id), name: user.name })
})
v2Router.get('/users/:id', v1Router.stack.find(r => r.route && r.route.path === '/users/:id' && r.route.methods.get).route.stack[0].handle)

v1Router.post('/users/:id', (req, res) => {
  const userId = parseInt(req.params.id)
  const { name, age, email } = req.body
  const user = Array.from(users.values()).find(u => parseInt(u.id) === userId)
  if (!user) {
    return res.status(404).json({ message: 'Usuario no encontrado' })
  }
  user.name = name
  user.age = age
  user.email = email
  res.status(200).json({ id: parseInt(user.id), name: user.name, age: user.age.toString(), email: user.email })
})
v2Router.post('/users/:id', v1Router.stack.find(r => r.route && r.route.path === '/users/:id' && r.route.methods.post).route.stack[0].handle)

v1Router.delete('/users/:id', (req, res) => {
  const id = req.params.id
  if (!users.has(id)) {
    return res.status(404).json({ message: 'Usuario no encontrado' })
  }
  users.delete(id)
  res.status(204).send()
})
v2Router.delete('/users/:id', v1Router.stack.find(r => r.route && r.route.path === '/users/:id' && r.route.methods.delete).route.stack[0].handle)

// PRODUCTS
v1Router.post('/products', (req, res) => {
  const product = req.body
  const id = Date.now().toString()
  const newProduct = { ...product, id }
  products.push(newProduct)
  res.status(201).json(newProduct)
})
v2Router.post('/products', v1Router.stack.find(r => r.route && r.route.path === '/products' && r.route.methods.post).route.stack[0].handle)

v1Router.get('/products', (req, res) => {
  res.json(products)
})
v2Router.get('/products', v1Router.stack.find(r => r.route && r.route.path === '/products' && r.route.methods.get).route.stack[0].handle)

v1Router.get('/products/:id', (req, res) => {
  const product = products.find(p => p.id === req.params.id)
  if (!product) {
    return res.status(404).json({ message: 'Producto no encontrado' })
  }
  res.json(product)
})
v2Router.get('/products/:id', v1Router.stack.find(r => r.route && r.route.path === '/products/:id' && r.route.methods.get).route.stack[0].handle)

v1Router.put('/products/:id', (req, res) => {
  const id = req.params.id
  const index = products.findIndex(p => p.id === id)
  if (index === -1) {
    return res.status(404).json({ message: 'Producto no encontrado' })
  }
  const updatedProduct = { ...req.body, id }
  products[index] = updatedProduct
  res.json(updatedProduct)
})
v2Router.put('/products/:id', v1Router.stack.find(r => r.route && r.route.path === '/products/:id' && r.route.methods.put).route.stack[0].handle)

v1Router.delete('/products/:id', (req, res) => {
  const id = req.params.id
  const index = products.findIndex(p => p.id === id)
  if (index === -1) {
    return res.status(404).json({ message: 'Producto no encontrado' })
  }
  products.splice(index, 1)
  res.status(204).send()
})
v2Router.delete('/products/:id', v1Router.stack.find(r => r.route && r.route.path === '/products/:id' && r.route.methods.delete).route.stack[0].handle)

// Montar routers en /v1 y /v2
app.use('/v1', v1Router)
app.use('/v2', v2Router)

app.listen(port, ()=>{
  console.log('Running')
})