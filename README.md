# Global Health Solution Server

This is the backend server for the Global Health Solution application. It provides various APIs for user management, appointments, calls, blogs, and more.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Environment Variables](#environment-variables)
3. [API Documentation](#api-documentation)
   - [Base URL](#base-url)
   - [Authentication](#authentication)
   - [Error Handling](#error-handling)
   - [Endpoints](#endpoints)
     - [User Management](#user-management)
     - [Appointments](#appointments)
     - [Calls](#calls)
     - [Blogs](#blogs)
     - [Admin](#admin)
     - [Payment](#payment)
     - [Chatbot](#chatbot)
4. [Websocket Events](#websocket-events)
5. [Contributing](#contributing)
6. [License](#license)

## Getting Started

To get started with this project, follow these steps:

1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables (see [Environment Variables](#environment-variables))
4. Run the server: `npm run dev`

## Environment Variables

Create a `.env` file in the root directory and add the following variables:

PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
EMAIL_USER=your_email_address
EMAIL_PASS=your_email_password
RECAPTCHA_SECRET_KEY=your_recaptcha_secret_key
AGORA_APP_ID=your_agora_app_id
AGORA_APP_CERTIFICATE=your_agora_app_certificate
SENDGRID_API_KEY=your_sendgrid_api_key

## API Documentation

### Base URL

All API requests should be made to: `http://localhost:5000/api` (replace with your production URL when deployed)

### Authentication

Most endpoints require authentication. Include the JWT token in the Authorization header:

Authorization: Bearer <your_token_here>

### Error Handling

Errors are returned in the following format:

json

{
"message": "Error message here"
}

### Endpoints

#### User Management

##### Register User

- **URL:** `/users/register`
- **Method:** `POST`
- **Auth required:** No
- **Data constraints:**

json

{
"role": "[user|specialist]",
"firstName": "string",
"lastName": "string",
"dateOfBirth": "YYYY-MM-DD",
"gender": "string",
"address": "string",
"country": "string",
"email": "string",
"phone": "string",
"password": "string",
"agreeTerms": "boolean",
"recaptcha": "string",
"specialistCategory": "string (required for specialists)",
"isOnline": "boolean (for specialists)",
"doctorRegistrationNumber": "string (for specialists)"
}

- **Success Response:** `201 Created`

##### Verify OTP

- **URL:** `/users/verify-otp`
- **Method:** `POST`
- **Auth required:** No
- **Data constraints:**

json

{
"email": "string",
"otp": "string"
}

- **Success Response:** `200 OK`

##### Resend OTP

- **URL:** `/users/resend-otp`
- **Method:** `POST`
- **Auth required:** No
- **Data constraints:**

json

{
"email": "string"
}

- **Success Response:** `200 OK`

##### Login

- **URL:** `/users/login`
- **Method:** `POST`
- **Auth required:** No
- **Data constraints:**

json

{
"email": "string",
"password": "string"
}

- **Success Response:** `200 OK`

##### Forgot Password

- **URL:** `/users/forgot-password`
- **Method:** `POST`
- **Auth required:** No
- **Data constraints:**

json

{
"email": "string"
}

- **Success Response:** `200 OK`

##### Login

- **URL:** `/users/login`
- **Method:** `POST`
- **Auth required:** No
- **Data constraints:**

json

{
"email": "string",
"password": "string"
}

- **Success Response:** `200 OK`

##### Forgot Password

- **URL:** `/users/forgot-password`
- **Method:** `POST`
- **Auth required:** No
- **Data constraints:**

json

{
"email": "string"
}

- **Success Response:** `200 OK`

##### Reset Password

- **URL:** `/users/reset-password/:token`
- **Method:** `POST`
- **Auth required:** No
- **Data constraints:**

json

{
"password": "string"
}

- **Success Response:** `200 OK`

##### Get User Profile

- **URL:** `/users/profile`
- **Method:** `GET`
- **Auth required:** Yes
- **Success Response:** `200 OK`

##### Update User Profile

- **URL:** `/users/profile`
- **Method:** `PUT`
- **Auth required:** Yes
- **Data constraints:** (All fields are optional)

json

{
"firstName": "string",
"lastName": "string",
"dateOfBirth": "YYYY-MM-DD",
"gender": "string",
"address": "string",
"country": "string",
"email": "string",
"phone": "string",
"password": "string",
"specialistCategory": "string",
"isOnline": "boolean"
}

- **Success Response:** `200 OK`

##### Update User Availability (Toggle Online Status)

- **URL:** `/users/availability`
- **Method:** `PUT`
- **Auth required:** Yes
- **Description:** Toggles the user's online status
- **Success Response:** `200 OK`

##### Update Specialist Availability Schedule

- **URL:** `/users/update-availability`
- **Method:** `PUT`
- **Auth required:** Yes
- **Data constraints:**

```json
{
  "availability": [
    {
      "day": "string",
      "startTime": "HH:mm",
      "endTime": "HH:mm"
    }
  ]
}
```

- **Success Response:** `200 OK`

#### Appointments

##### Create Appointment

- **URL:** `/appointments`
- **Method:** `POST`
- **Auth required:** Yes
- **Data constraints:**

json

{
"specialistId": "string",
"dateTime": "YYYY-MM-DDTHH:mm:ss.sssZ",
"specialistCategory": "string",
"notes": "string"
}

- **Success Response:** `201 Created`

##### Get Appointments

- **URL:** `/appointments`
- **Method:** `GET`
- **Auth required:** Yes
- **Success Response:** `200 OK`

##### Update Appointment

- **URL:** `/appointments/:id`
- **Method:** `PUT`
- **Auth required:** Yes
- **Data constraints:**

json

{
"status": "string",
"notes": "string"
}

- **Success Response:** `200 OK`

##### Start Appointment

- **URL:** `/appointments/:id/start`
- **Method:** `POST`
- **Auth required:** Yes
- **Success Response:** `200 OK`
- **Response body:**

```json
{
  "channelName": "string",
  "token": "string"
}
```

#### Calls

##### Initiate Call

- **URL:** `/calls/initiate`
- **Method:** `POST`
- **Auth required:** Yes
- **Data constraints:**

json

{
"appointmentId": "string"
}

- **Success Response:** `200 OK`

##### Accept Call

- **URL:** `/calls/accept`
- **Method:** `POST`
- **Auth required:** Yes
- **Data constraints:**

json

{
"callId": "string"
}

- **Success Response:** `200 OK`

##### Get Call

- **URL:** `/calls/get-call/:callId`
- **Method:** `GET`
- **Auth required:** Yes
- **Success Response:** `200 OK`

##### Get Calls

- **URL:** `/calls/get-calls`
- **Method:** `GET`
- **Auth required:** Yes
- **Query Parameters:**
  - `userId`: string
  - `specialistId`: string
  - `status`: string
  - `specialistCategory`: string
  - `startDate`: YYYY-MM-DD
  - `endDate`: YYYY-MM-DD
- **Success Response:** `200 OK`

##### Update Call Status

- **URL:** `/calls/:callId/status`
- **Method:** `PATCH`
- **Auth required:** Yes
- **Data constraints:**

```json
{
  "status": "string"
}
```

- **Success Response:** `200 OK`

#### Blogs

##### Create Blog

- **URL:** `/blogs`
- **Method:** `POST`
- **Auth required:** Yes
- **Data constraints:**

json

{
"title": "string",
"content": "string",
"tags": "string (comma-separated)",
"isPublished": "boolean"
}

- **Success Response:** `201 Created`

##### Get Blogs

- **URL:** `/blogs`
- **Method:** `GET`
- **Auth required:** No
- **Success Response:** `200 OK`

##### Get Blog by ID

- **URL:** `/blogs/:id`
- **Method:** `GET`
- **Auth required:** No
- **Success Response:** `200 OK`

##### Update Blog

- **URL:** `/blogs/:id`
- **Method:** `PUT`
- **Auth required:** Yes
- **Data constraints:**

json

{
"title": "string",
"content": "string",
"tags": "string (comma-separated)",
"isPublished": "boolean"
}

- **Success Response:** `200 OK`

##### Delete Blog

- **URL:** `/blogs/:id`
- **Method:** `DELETE`
- **Auth required:** Yes
- **Success Response:** `200 OK`

#### Admin

##### Register Admin

- **URL:** `/admin/register`
- **Method:** `POST`
- **Auth required:** No
- **Data constraints:**

json

{
"firstName": "string",
"lastName": "string",
"email": "string",
"adminPassword": "string"
}

- **Success Response:** `201 Created`

##### Admin Login

- **URL:** `/admin/login`
- **Method:** `POST`
- **Auth required:** No
- **Data constraints:**

json

{
"email": "string",
"password": "string"
}

- **Success Response:** `200 OK`

#### Notifications

##### Get Notifications

- **URL:** `/notifications`
- **Method:** `GET`
- **Auth required:** Yes
- **Success Response:** `200 OK`
- **Response body:** Array of notification objects

##### Mark Notification as Read

- **URL:** `/notifications/:id/read`
- **Method:** `PUT`
- **Auth required:** Yes
- **Success Response:** `200 OK`
- **Response body:** Updated notification object

Note: Notifications are automatically created for various events such as new appointments, messages, and system updates. The `createNotification` function is used internally to create notifications for various events. It also emits a `newNotification` event via Socket.IO to the user's notification room.

#### Websocket Events

The server uses Socket.IO for real-time communication. Here are the available events:

- `notification_${userId}`: Join a room for receiving user-specific notifications
- `join`: Join a room with the user's ID
- `callInitiated`: Emitted when a call is initiated
- `incomingCall`: Received when there's an incoming call
- `callAccepted`: Emitted and received when a call is accepted
- `callRejected`: Emitted and received when a call is rejected
- `callEnded`: Emitted and received when a call ends
- `newNotification`: Received when a new notification is created for the user

#### License

This project is licensed under the [MIT License](LICENSE).
"# medical-tour-api" 
"# medical-tour-api" 
