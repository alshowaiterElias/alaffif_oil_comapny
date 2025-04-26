# Admin Panel with Firebase Integration

This admin panel is configured to use Firebase Firestore for data storage. The application has been updated to use real data from the following collections:

## Database Collections

### Users Collection

This collection stores approved user accounts:

```
users:
- id (document ID): Firebase Auth User ID
- createdAt: Timestamp - When the user was created
- email: String - User's email address
- lastUpdated: Timestamp - When the user was last updated
- name: String - User's name
- phone: String - User's phone number
- roles: String - User's role(s) (comma-separated if multiple, e.g., "deizelOperator,wasteOperator,oilOperator")
- status: String - User's status ("approved", "pending", "rejected")
```

### User Requests Collection

This collection stores user registration requests that admins need to approve:

```
user_requests:
- id (document ID): Auto-generated Firestore ID
- createdAt: Timestamp - When the request was created
- email: String - Requester's email address
- lastUpdated: Timestamp - When the request was last updated
- name: String - Requester's name
- phone: String - Requester's phone number
- roles: String - Requested role(s) (comma-separated if multiple, or null)
- status: String - Request status ("pending", "approved", "rejected")
- userId: String - Firebase Auth User ID (if available)
```

## Implemented Functionality

The application now connects to Firebase Firestore and:

1. **Authentication**: Users with "admin" or "accountant" roles can log in
2. **Dashboard**: Shows statistics about users and requests using real data
3. **User Requests Management**: Admins can view, approve, or reject user requests

## Role-Based Access Control

The application supports role-based access control:
- Routes can require specific roles for access
- Roles are stored as strings (can be comma-separated for multiple roles)
- Admin users have access to all features
- Accountant users have limited access as defined in the routes

### Available Roles

The system has five roles:

1. **Admin**: Full control over the system
2. **Accountant**: Access to financial reports
3. **Dezil Operator** (deizelOperator): Access to diesel operations
4. **Oil Operator** (oilOperator): Access to oil operations
5. **Waste Operator** (wasteOperator): Access to waste operations

### Role Assignment Rules

When assigning roles to users, the following rules apply:

- Operator roles (dezil, oil, waste) can be selected together
- Operator roles cannot be mixed with Admin or Accountant roles
- Admin and Accountant roles cannot be selected together
- Only users with Admin or Accountant roles can access the admin panel

## Firebase Services Integration

The following Firebase services are used:
- **Firebase Authentication**: For user login and session management
- **Firestore Database**: For storing and retrieving user data and requests

## Available Services

The following service functions are available for Firebase interactions:

```typescript
// User services
fetchUsers(): Promise<User[]>
fetchUserById(userId: string): Promise<User | null>

// User request services
fetchUserRequests(): Promise<UserRequest[]>
fetchUserRequestsByStatus(status: string): Promise<UserRequest[]>
updateUserRequestStatus(requestId: string, status: string, roles?: string): Promise<boolean>
approveUserRequest(requestId: string, userId: string, roles: string): Promise<boolean>
rejectUserRequest(requestId: string): Promise<boolean>
```

# Getting Started with Create React App

This project was bootstrapped with [Create React App](https://github.com/facebook/create-react-app).

## Available Scripts

In the project directory, you can run:

### `npm start`

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.\
You will also see any lint errors in the console.

### `npm test`

Launches the test runner in the interactive watch mode.\
See the section about [running tests](https://facebook.github.io/create-react-app/docs/running-tests) for more information.

### `npm run build`

Builds the app for production to the `build` folder.\
It correctly bundles React in production mode and optimizes the build for the best performance.

The build is minified and the filenames include the hashes.\
Your app is ready to be deployed!

See the section about [deployment](https://facebook.github.io/create-react-app/docs/deployment) for more information.

### `npm run eject`

**Note: this is a one-way operation. Once you `eject`, you can't go back!**

If you aren't satisfied with the build tool and configuration choices, you can `eject` at any time. This command will remove the single build dependency from your project.

Instead, it will copy all the configuration files and the transitive dependencies (webpack, Babel, ESLint, etc) right into your project so you have full control over them. All of the commands except `eject` will still work, but they will point to the copied scripts so you can tweak them. At this point you're on your own.

You don't have to ever use `eject`. The curated feature set is suitable for small and middle deployments, and you shouldn't feel obligated to use this feature. However we understand that this tool wouldn't be useful if you couldn't customize it when you are ready for it.

## Learn More

You can learn more in the [Create React App documentation](https://facebook.github.io/create-react-app/docs/getting-started).

To learn React, check out the [React documentation](https://reactjs.org/).
