import { configureStore } from '@reduxjs/toolkit';
import authReducer from '../features/auth/authSlice.js';
import propertyReducer from '../features/properties/propertySlice.js';
import favoriteReducer from '../features/favorites/favoriteSlice.js';
import adminReducer from '../features/admin/adminSlice.js';
import userReducer from '../features/users/userSlice.js';

export const store = configureStore({
  reducer: {
    auth: authReducer
    , properties: propertyReducer
    , favorites: favoriteReducer
    , admin: adminReducer
    , user: userReducer
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
