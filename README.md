# Table Tennis Tournament Registration Backend API

A robust Node.js/Express backend API for managing table tennis tournament registrations with MongoDB integration.

## Features

- **User Registration & Authentication**: Secure user registration with JWT tokens
- **MongoDB Integration**: Robust data persistence with Mongoose ODM
- **File Upload**: Payment proof upload functionality
- **Referral System**: Built-in referral code system with cashback rewards
- **Tournament Management**: Complete tournament system with specific match rules
- **Match Rules Implementation**: 
  - Round of 16 and earlier: 1 set knockout
  - Quarter-finals: Best of 3 sets
  - Semi-finals: Best of 5 sets
  - Final: Best of 7 sets
- **Tournament Brackets**: Automatic bracket generation and match scheduling
- **Admin Panel**: Admin-only routes for user and tournament management
- **Security**: Rate limiting, CORS, Helmet security headers
- **Validation**: Input validation using express-validator
- **Error Handling**: Comprehensive error handling middleware

## Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn

## Installation

1. **Clone the repository and navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   - Copy `env.example` to `.env`
   - Update the following variables:
     ```env
     PORT=5000
     MONGODB_URI=mongodb://localhost:27017/tabletennis_tournament
     JWT_SECRET=your_secure_jwt_secret_here
     ```

4. **Create uploads directory:**
   ```bash
   mkdir uploads
   ```

## Running the Application

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication
- `POST /api/users/register` - User registration
- `POST /api/users/login` - User login

### User Profile
- `GET /api/users/profile` - Get user profile (Protected)
- `PUT /api/users/profile` - Update user profile (Protected)
- `POST /api/users/payment-proof` - Upload payment proof (Protected)

### Admin Routes
- `GET /api/users` - Get all users (Admin only)
- `PUT /api/users/:id/status` - Update user status (Admin only)

### Tournament Routes
- `POST /api/tournaments` - Create tournament (Admin only)
- `GET /api/tournaments` - Get all tournaments
- `GET /api/tournaments/:id` - Get tournament by ID
- `PUT /api/tournaments/:id` - Update tournament (Admin only)
- `DELETE /api/tournaments/:id` - Delete tournament (Admin only)
- `POST /api/tournaments/:id/register` - Register for tournament (Protected)
- `GET /api/tournaments/:id/registrations` - Get tournament registrations (Admin only)
- `PUT /api/tournaments/registrations/:id/status` - Approve/reject registration (Admin only)
- `POST /api/tournaments/:id/bracket` - Generate tournament bracket (Admin only)
- `GET /api/tournaments/:id/matches` - Get tournament matches
- `PUT /api/tournaments/matches/:id/result` - Update match result (Protected)

### Health Check
- `GET /api/health` - API health status

## Data Models

### User Schema
```javascript
{
  email: String (required, unique),
  password: String (required, hashed),
  firstName: String (required),
  lastName: String (required),
  phone: String (required),
  address: String (required),
  dateOfBirth: Date (required),
  referralCode: String,
  referredBy: ObjectId (ref: User),
  referralCount: Number (default: 0),
  cashbackEligible: Boolean (default: false),
  cashbackAmount: Number (default: 0),
  registrationStatus: String (enum: ['pending', 'approved', 'rejected']),
  paymentStatus: String (enum: ['pending', 'completed', 'failed']),
  paymentMethod: String (enum: ['card', 'bank']),
  paymentProof: String,
  registrationId: String (auto-generated),
  isAdmin: Boolean (default: false),
  isActive: Boolean (default: true),
  timestamps: true
}
```

### Tournament Schema
```javascript
{
  name: String (required),
  description: String,
  startDate: Date (required),
  endDate: Date (required),
  registrationDeadline: Date (required),
  maxParticipants: Number (required, 16-128),
  currentParticipants: Number (default: 0),
  status: String (enum: ['registration', 'seeding', 'active', 'completed', 'cancelled']),
  matchRules: {
    roundOf16AndEarlier: String (default: '1 set knockout'),
    quarterFinals: String (default: 'Best of 3 sets'),
    semiFinals: String (default: 'Best of 5 sets'),
    final: String (default: 'Best of 7 sets')
  },
  entryFee: Number (required),
  prizePool: {
    first: Number,
    second: Number,
    third: Number
  },
  createdBy: ObjectId (ref: User),
  timestamps: true
}
```

### Match Schema
```javascript
{
  tournament: ObjectId (ref: Tournament, required),
  player1: ObjectId (ref: User, required),
  player2: ObjectId (ref: User, required),
  round: String (enum: ['round_of_32', 'round_of_16', 'quarter_finals', 'semi_finals', 'final']),
  matchNumber: Number (required),
  status: String (enum: ['scheduled', 'in_progress', 'completed', 'cancelled']),
  scheduledTime: Date (required),
  sets: [{
    player1Score: Number (0-11),
    player2Score: Number (0-11),
    winner: String (enum: ['player1', 'player2', 'draw']),
    isCompleted: Boolean
  }],
  winner: ObjectId (ref: User),
  loser: ObjectId (ref: User),
  referee: ObjectId (ref: User),
  timestamps: true
}
```

### Tournament Registration Schema
```javascript
{
  tournament: ObjectId (ref: Tournament, required),
  player: ObjectId (ref: User, required),
  registrationDate: Date (default: now),
  status: String (enum: ['pending', 'approved', 'rejected', 'withdrawn']),
  paymentStatus: String (enum: ['pending', 'completed', 'failed', 'refunded']),
  paymentMethod: String (enum: ['card', 'bank'], required),
  paymentProof: String,
  entryFee: Number (required),
  seed: Number,
  approvedBy: ObjectId (ref: User),
  timestamps: true
}
```

## Referral System

The application includes a sophisticated referral system:

1. **Referral Code Generation**: Each user gets a unique referral code upon registration
2. **Referral Tracking**: Users can refer others using their code
3. **Cashback Rewards**: Users earn 60% cashback ($90) after 5 successful referrals
4. **Automatic Updates**: Referral counts and cashback eligibility are updated automatically

## Tournament Match Rules

The tournament system implements specific match rules based on tournament rounds:

1. **Round of 16 and Earlier**: Single set knockout matches (first to 11 points)
2. **Quarter-finals**: Best of 3 sets (first to win 2 sets)
3. **Semi-finals**: Best of 5 sets (first to win 3 sets)
4. **Final**: Best of 7 sets (first to win 4 sets)

**Scoring System**:
- Each set is played to 11 points
- Must win by 2 points if tied at 10-10
- Automatic bracket generation when minimum participants (16) is reached
- Match scheduling with 30-minute intervals

## Security Features

- **Password Hashing**: Bcrypt with salt rounds
- **JWT Authentication**: Secure token-based authentication
- **Rate Limiting**: Prevents abuse and DDoS attacks
- **Input Validation**: Comprehensive input sanitization
- **CORS Protection**: Configurable cross-origin resource sharing
- **Helmet Security**: Security headers for protection

## File Upload

- **Supported Formats**: Images (PNG, JPG, JPEG)
- **File Size Limit**: 10MB (configurable)
- **Storage**: Local file system with unique naming
- **Security**: File type validation and size restrictions

## Error Handling

The API includes comprehensive error handling:

- **Validation Errors**: Detailed field-specific error messages
- **Authentication Errors**: Proper HTTP status codes
- **File Upload Errors**: Size and format validation
- **Database Errors**: Mongoose error handling
- **Generic Errors**: Fallback error responses

## Development

### Project Structure
```
backend/
├── config/
│   └── database.js          # MongoDB connection
├── controllers/
│   ├── userController.js    # User business logic
│   └── tournamentController.js # Tournament business logic
├── middleware/
│   ├── auth.js             # Authentication middleware
│   ├── upload.js           # File upload middleware
│   └── validate.js         # Input validation middleware
├── models/
│   ├── User.js             # User data model
│   ├── Tournament.js       # Tournament data model
│   ├── Match.js            # Match data model
│   └── TournamentRegistration.js # Tournament registration model
├── routes/
│   ├── userRoutes.js       # User API route definitions
│   └── tournamentRoutes.js # Tournament API route definitions
├── uploads/                 # File upload directory
├── server.js               # Main application file
├── package.json            # Dependencies and scripts
├── test_api.js             # Basic API testing script
├── test_tournament.js      # Tournament system testing script
└── README.md               # This file
```

### Adding New Features

1. **Create Model**: Define data structure in `models/`
2. **Create Controller**: Implement business logic in `controllers/`
3. **Create Routes**: Define API endpoints in `routes/`
4. **Add Middleware**: Implement necessary middleware in `middleware/`
5. **Update Server**: Register new routes in `server.js`

## Testing

### Basic API Testing
Test the basic API endpoints using tools like:
- Postman
- Insomnia
- cURL
- Thunder Client (VS Code extension)

### Automated Testing Scripts
The project includes automated testing scripts:

1. **Basic API Test** (`test_api.js`):
   ```bash
   node test_api.js
   ```
   Tests user registration, login, and profile endpoints.

2. **Tournament System Test** (`test_tournament.js`):
   ```bash
   node test_tournament.js
   ```
   Tests the complete tournament system including:
   - Tournament creation with match rules
   - Player registration workflow
   - Bracket generation
   - Match management and scoring
   - All tournament API endpoints

**Note**: Make sure MongoDB is running and the server is started (`npm run dev`) before running tests.

## Deployment

### Environment Variables
Ensure all environment variables are properly set in production:
- `NODE_ENV=production`
- `MONGODB_URI_PROD` for production database
- Strong `JWT_SECRET`
- Proper CORS origins

### Production Considerations
- Use environment-specific MongoDB connections
- Implement proper logging
- Set up monitoring and health checks
- Configure reverse proxy (nginx)
- Use PM2 or similar process manager

## Support

For issues and questions:
1. Check the error logs
2. Verify environment variables
3. Ensure MongoDB is running
4. Check file permissions for uploads directory

## License

MIT License - see LICENSE file for details 