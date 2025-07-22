const express = require('express')
const YAML = require('yamljs')
const swaggerUi = require('swagger-ui-express')
const OpenApiValidator = require('express-openapi-validator')

const app = express()

// In-memory storage for users (in a real app, this would be a database)
const users = new Map()

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
app.get('/hello', (req,res)=> {
  res.json({message:'Hello world'})
})

app.post('/users', (req, res)=> {
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

// GET /users/{id} - Obtener un usuario por ID
app.get('/users/:id', (req, res) => {
  const userId = parseInt(req.params.id)
  
  // Find user by ID
  const user = Array.from(users.values()).find(u => parseInt(u.id) === userId)
  
  if (!user) {
    return res.status(404).json({
      message: 'Usuario no encontrado'
    })
  }
  
  res.status(200).json({
    id: parseInt(user.id),
    name: user.name
  })
})

// POST /users/{id} - Actualizar el nombre del usuario
app.post('/users/:id', (req, res) => {
  const userId = parseInt(req.params.id)
  const { name, age, email } = req.body
  
  // Find user by ID
  const user = Array.from(users.values()).find(u => parseInt(u.id) === userId)
  
  if (!user) {
    return res.status(404).json({
      message: 'Usuario no encontrado'
    })
  }
  
  // Update user data
  user.name = name
  user.age = age
  user.email = email
  
  res.status(200).json({
    id: parseInt(user.id),
    name: user.name,
    age: user.age.toString(), // Convert to string as per spec
    email: user.email
  })
})

app.listen(port, ()=>{
  console.log('Running')
})