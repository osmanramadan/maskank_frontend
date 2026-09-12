import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '../../services/api.js';

const initialState = {
  token: localStorage.getItem('maskank_token'),
  user: null,
  status: 'idle'
};

export const login = createAsyncThunk('auth/login', async (credentials, { rejectWithValue }) => {
  try { return (await api.post('/auth/login', credentials)).data.data; } catch (error) { return rejectWithValue(error.response?.data?.message || 'Unable to sign in'); }
});

export const register = createAsyncThunk('auth/register', async (details, { rejectWithValue }) => {
  try { return (await api.post('/auth/register', details)).data.data; } catch (error) { return rejectWithValue(error.response?.data?.message || 'Unable to create account'); }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action) {
      state.token = action.payload.token;
      state.user = action.payload.user;
      localStorage.setItem('maskank_token', action.payload.token);
    },
    clearCredentials(state) {
      state.token = null;
      state.user = null;
      localStorage.removeItem('maskank_token');
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => { state.status = 'loading'; })
      .addCase(login.fulfilled, (state, action) => { state.status = 'succeeded'; state.token = action.payload.token; state.user = action.payload.user; localStorage.setItem('maskank_token', action.payload.token); })
      .addCase(login.rejected, (state, action) => { state.status = 'failed'; state.error = action.payload; })
      .addCase(register.pending, (state) => { state.status = 'loading'; })
      .addCase(register.fulfilled, (state, action) => { state.status = 'succeeded'; state.token = action.payload.token; state.user = action.payload.user; localStorage.setItem('maskank_token', action.payload.token); })
      .addCase(register.rejected, (state, action) => { state.status = 'failed'; state.error = action.payload; });
  }
});

export const { setCredentials, clearCredentials } = authSlice.actions;
export default authSlice.reducer;
